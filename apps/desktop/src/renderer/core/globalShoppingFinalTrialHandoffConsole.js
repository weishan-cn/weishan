;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FINAL_TRIAL_HANDOFF_CONSOLE_VERSION = "4.2.2";
  const CONSOLE_NAME = "global_shopping_final_trial_handoff_console_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, final_trial_handoff_only:true };
  const ALLOWED_NEXT_ACTIONS = ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required", "blocked"];
  const BLOCKED_TEXT_RE = /production_ready|auto_release|auto_launch|auto_publish|ready_to_publish|enable_provider|enable_payment|enable_order/i;
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) {
    return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "final_trial_handoff_only");
    return ALLOWED_MODES[mode] ? mode : "final_trial_handoff_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function hasTruthyUrl(value) {
    const normalized = text(value);
    return normalized && normalized !== "null";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.taskCreate === true || safe.createTask === true) blocked.push("task create");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    ["status", "summary", "title", "subtitle", "handoffStatus", "handoffSummary"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingFinalTrialHandoffConsole(input) {
    const safe = obj(input);
    const publicBetaCandidateLockSummary = resolveSummary(safe, "publicBetaCandidateLockSummary", "WeishanGlobalShoppingPublicBetaCandidateLock", "buildGlobalShoppingPublicBetaCandidateLock");
    const manualNextPhaseDossierSummary = resolveSummary(safe, "manualNextPhaseDossierSummary", "WeishanGlobalShoppingManualNextPhaseDossier", "buildGlobalShoppingManualNextPhaseDossier");
    const manualLaunchHandoffPackSummary = resolveSummary(safe, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const publicBetaClosureEvidenceArchiveSummary = resolveSummary(safe, "publicBetaClosureEvidenceArchiveSummary", "WeishanGlobalShoppingPublicBetaClosureEvidenceArchive", "buildGlobalShoppingPublicBetaClosureEvidenceArchive");
    const summaries = [
      publicBetaCandidateLockSummary,
      manualNextPhaseDossierSummary,
      manualLaunchHandoffPackSummary,
      publicBetaStabilityAuditSummary,
      publicBetaClosureEvidenceArchiveSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateLockSummary).candidateLockStatus || obj(publicBetaCandidateLockSummary).status, "needs_review"),
      normalizeStatus(obj(manualNextPhaseDossierSummary).dossierStatus || obj(manualNextPhaseDossierSummary).status, "needs_review"),
      normalizeStatus(obj(manualLaunchHandoffPackSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaStabilityAuditSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaClosureEvidenceArchiveSummary).archiveStatus || obj(publicBetaClosureEvidenceArchiveSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) {
      return status !== "ready" && status !== "manual_review_required";
    });
    const handoffStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const nextManualAction = handoffStatus === "blocked" ? "blocked" : "manual_review_required";

    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_TRIAL_HANDOFF_CONSOLE_VERSION,
      consoleMode:safeMode(safe.consoleMode),
      handoffStatus:handoffStatus,
      status:handoffStatus,
      handoffSummary:"最终试用交接仅为只读摘要，不生成文件",
      operatorChecklist:[
        "确认候选锁定仍为只读范围",
        "确认交接摘要不导出、不下载、不上传",
        "确认 provider、联网、付款、下单、出票、release、push 继续保持关闭"
      ],
      testerChecklist:[
        "继续测试 Flight / Hotel / Product / Restricted 场景",
        "只记录离线复核结论，不发送反馈、不上传问题",
        "下一阶段只能继续测试、优化文案、扩展离线场景、人工复核或阻断"
      ],
      lockedCapabilities:["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch"],
      knownLimitations:[
        "不生成真实交接包文件",
        "不导出、不下载、不上传、不发邮件",
        "不创建任务、不创建 release、不 push"
      ],
      nextManualAction:nextManualAction,
      blockedCapabilities:blocked,
      manualReviewRequired:true,
      publicBetaCandidateLockSummary:publicBetaCandidateLockSummary,
      manualNextPhaseDossierSummary:manualNextPhaseDossierSummary,
      manualLaunchHandoffPackSummary:manualLaunchHandoffPackSummary,
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      publicBetaClosureEvidenceArchiveSummary:publicBetaClosureEvidenceArchiveSummary,
      userFacingSummary:{
        title:"Final Trial Handoff Console",
        resultLabel:handoffStatus === "blocked" ? "Final Trial Handoff Console 已阻断" : (handoffStatus === "needs_review" ? "Final Trial Handoff Console 仍需复核" : "Final Trial Handoff Console 需人工复核"),
        caveat:"最终试用交接仅为只读摘要，不生成文件"
      },
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingFinalTrialHandoffRows(input) {
    const safe = evaluateGlobalShoppingFinalTrialHandoffConsole(input || {});
    return clone([
      row("final_trial_handoff_console", "Final Trial Handoff Console", safe.userFacingSummary.resultLabel, safe.handoffStatus === "blocked" ? "blocked" : "warning"),
      row("final_trial_handoff_summary", "Trial Handoff", safe.handoffSummary, "warning"),
      row("final_trial_handoff_operator", "Operator Checklist", safe.operatorChecklist.join(" / "), "warning"),
      row("final_trial_handoff_tester", "Tester Checklist", safe.testerChecklist.join(" / "), "warning"),
      row("final_trial_handoff_manual", "Manual Review Required", "不创建 release、不 push、不启用交易", "warning")
    ]);
  }

  function buildGlobalShoppingFinalTrialHandoffSections(input) {
    const safe = evaluateGlobalShoppingFinalTrialHandoffConsole(input || {});
    return clone([
      section("final_trial_handoff_console", "Final Trial Handoff Console", safe.userFacingSummary.resultLabel),
      section("final_trial_handoff_scope", "Trial Handoff", safe.handoffSummary),
      section("final_trial_handoff_manual", "Manual Review Required", "不创建 release、不 push、不启用交易")
    ]);
  }

  function buildGlobalShoppingFinalTrialHandoffConsoleAuditDraft(input) {
    const safe = evaluateGlobalShoppingFinalTrialHandoffConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FINAL_TRIAL_HANDOFF_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_TRIAL_HANDOFF_CONSOLE_VERSION,
      handoffStatus:safe.handoffStatus,
      nextManualAction:safe.nextManualAction,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingFinalTrialHandoffConsole(consoleSummary) {
    const safe = evaluateGlobalShoppingFinalTrialHandoffConsole(consoleSummary || {});
    safe.rows = buildGlobalShoppingFinalTrialHandoffRows(safe);
    safe.sections = buildGlobalShoppingFinalTrialHandoffSections(safe);
    safe.externalUrl = null;
    safe.platformUrl = null;
    safe.providerUrl = null;
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.buyButtonEnabled = false;
    safe.checkoutButtonEnabled = false;
    safe.paymentButtonEnabled = false;
    return safe;
  }

  function buildGlobalShoppingFinalTrialHandoffConsole(input) {
    try {
      return sanitizeGlobalShoppingFinalTrialHandoffConsole(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingFinalTrialHandoffConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingFinalTrialHandoffConsole = {
    GLOBAL_SHOPPING_FINAL_TRIAL_HANDOFF_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingFinalTrialHandoffConsole,
    evaluateGlobalShoppingFinalTrialHandoffConsole,
    buildGlobalShoppingFinalTrialHandoffRows,
    buildGlobalShoppingFinalTrialHandoffSections,
    buildGlobalShoppingFinalTrialHandoffConsoleAuditDraft,
    sanitizeGlobalShoppingFinalTrialHandoffConsole
  };
})();
