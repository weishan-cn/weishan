;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_CONSOLE_VERSION = "4.2.2";
  const CONSOLE_NAME = "global_shopping_public_beta_trial_operations_console_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, trial_operations_console_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish/i;
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "trial_operations_console_only");
    return ALLOWED_MODES[mode] ? mode : "trial_operations_console_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function sanitizeWarnings(value) {
    return toArray(value)
      .map(function (item) { return text(item); })
      .filter(Boolean)
      .filter(function (item) { return !SECRET_VALUE_RE.test(item); });
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
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw provider persistence");
    if (safe.rawUserTextPersistence === true || safe.rawUserText === true) blocked.push("raw user text persistence");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    ["status", "summary", "title", "subtitle", "nextManualAction", "operationsStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("auto release language");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingPublicBetaTrialOperationsConsole(input) {
    const safe = obj(input);
    const manualQaReportCenterSummary = resolveSummary(safe, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    const trialFeedbackSafetyGateSummary = resolveSummary(safe, "trialFeedbackSafetyGateSummary", "WeishanGlobalShoppingTrialFeedbackSafetyGate", "buildGlobalShoppingTrialFeedbackSafetyGate");
    const publicBetaRcEvidenceSnapshotSummary = resolveSummary(safe, "publicBetaRcEvidenceSnapshotSummary", "WeishanGlobalShoppingPublicBetaRcEvidenceSnapshot", "buildGlobalShoppingPublicBetaRcEvidenceSnapshot");
    const publicBetaManualQaViewModelSummary = resolveSummary(safe, "publicBetaManualQaViewModelSummary", "WeishanGlobalShoppingPublicBetaManualQaViewModel", "buildGlobalShoppingPublicBetaManualQaViewModel");
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const warnings = sanitizeWarnings(safe.knownWarnings || obj(publicBetaStabilityAuditSummary).knownWarnings);
    const blocked = blockedReasons(safe);
    const summaries = [
      manualQaReportCenterSummary,
      trialFeedbackSafetyGateSummary,
      publicBetaRcEvidenceSnapshotSummary,
      publicBetaManualQaViewModelSummary,
      publicBetaStabilityAuditSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = summaries.map(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).operationsStatus || "", "needs_review"); });
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked" || status === "failed_safe"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready"; });
    const status = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "ready");
    const nextManualAction = status === "blocked" ? "blocked" : (status === "ready" ? "manual_review_required" : "continue_testing");

    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_CONSOLE_VERSION,
      consoleMode:safeMode(safe.consoleMode),
      status,
      operationsStatus:status,
      title:"Public Beta Trial Operations Console",
      qaReadiness:text(obj(publicBetaManualQaViewModelSummary.userFacingSummary).resultLabel || obj(manualQaReportCenterSummary.userFacingSummary).resultLabel || "Public Beta Manual QA 仍需复核"),
      feedbackSafety:text(obj(trialFeedbackSafetyGateSummary.userFacingSummary).resultLabel || "Trial Feedback Safety Gate 仍需复核"),
      rcEvidenceStatus:text(obj(publicBetaRcEvidenceSnapshotSummary.userFacingSummary).resultLabel || "RC Evidence Snapshot 仍需复核"),
      blockedCapabilities:blocked,
      knownWarnings:warnings,
      nextManualAction:nextManualAction,
      manualReviewRequired:true,
      publicBetaManualQaReportCenterSummary:manualQaReportCenterSummary,
      trialFeedbackSafetyGateSummary:trialFeedbackSafetyGateSummary,
      publicBetaRcEvidenceSnapshotSummary:publicBetaRcEvidenceSnapshotSummary,
      publicBetaManualQaViewModelSummary:publicBetaManualQaViewModelSummary,
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      userFacingSummary:{
        title:"Public Beta Trial Operations Console",
        resultLabel:status === "ready" ? "Public Beta Trial Operations Console 已准备" : (status === "blocked" ? "Public Beta Trial Operations Console 已阻断" : "Public Beta Trial Operations Console 仍需复核"),
        caveat:"只输出只读运营摘要，不创建任务、不写文件、不发邮件、不接 provider。"
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

  function buildGlobalShoppingPublicBetaTrialOperationsRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaTrialOperationsConsole(input || {});
    return clone([
      row("public_beta_trial_operations_console", "Public Beta Trial Operations Console", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_trial_operations_qa", "QA Readiness", safe.qaReadiness, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_operations_feedback", "Feedback Safety", safe.feedbackSafety, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_operations_rc", "RC Evidence Status", safe.rcEvidenceStatus, safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_operations_next", "Next Manual Action", safe.nextManualAction, safe.nextManualAction === "blocked" ? "blocked" : "warning"),
      row("public_beta_trial_operations_review", "Manual Review Required", "下一步只能人工复核或继续测试", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaTrialOperationsSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaTrialOperationsConsole(input || {});
    return clone([
      section("public_beta_trial_operations_coverage", "Scenario Coverage", "Flight / Hotel / Product / Restricted / Feedback / No-Transaction / No-Provider 场景已覆盖"),
      section("public_beta_trial_operations_feedback", "Feedback Review", "反馈仍保持关闭，不发送、不上传、不保存用户原文"),
      section("public_beta_trial_operations_boundary", "Locked Capabilities", "不自动发布、不接 provider、不启用交易")
    ]);
  }

  function buildGlobalShoppingPublicBetaTrialOperationsConsoleAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaTrialOperationsConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_CONSOLE_VERSION,
      status:safe.status,
      nextManualAction:safe.nextManualAction,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaTrialOperationsConsole(consoleValue) {
    const safe = evaluateGlobalShoppingPublicBetaTrialOperationsConsole(consoleValue || {});
    safe.rows = buildGlobalShoppingPublicBetaTrialOperationsRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaTrialOperationsSections(safe);
    return safe;
  }

  function buildGlobalShoppingPublicBetaTrialOperationsConsole(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaTrialOperationsConsole(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaTrialOperationsConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaTrialOperationsConsole = {
    GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingPublicBetaTrialOperationsConsole,
    evaluateGlobalShoppingPublicBetaTrialOperationsConsole,
    buildGlobalShoppingPublicBetaTrialOperationsRows,
    buildGlobalShoppingPublicBetaTrialOperationsSections,
    buildGlobalShoppingPublicBetaTrialOperationsConsoleAuditDraft,
    sanitizeGlobalShoppingPublicBetaTrialOperationsConsole
  };
})();
