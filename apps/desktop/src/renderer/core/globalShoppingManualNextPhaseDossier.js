;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_NEXT_PHASE_DOSSIER_VERSION = "4.2.2";
  const DOSSIER_NAME = "global_shopping_manual_next_phase_dossier_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_next_phase_dossier_only:true };
  const ALLOWED_OPTIONS = ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required", "blocked"];
  const BLOCKED_OPTIONS = ["enable_provider", "enable_payment", "enable_order", "production_ready", "auto_publish", "ready_to_publish"];
  const BLOCKED_TEXT_RE = /enable_provider|enable_payment|enable_order|production_ready|auto_publish|ready_to_publish|release|push/i;
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
    const mode = text(value || "manual_next_phase_dossier_only");
    return ALLOWED_MODES[mode] ? mode : "manual_next_phase_dossier_only";
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
    if (safe.provider === true || safe.realProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.enablePayment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.enableOrder === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.openExternal === true || safe.externalOpen === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external open");
    if (safe.release === true || safe.createRelease === true || safe.push === true || safe.pushEnabled === true || safe.gitMutation === true) blocked.push("release mutation");
    ["status", "title", "summary", "subtitle", "currentPhase"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe next phase language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingManualNextPhaseDossier(input) {
    const safe = obj(input);
    const finalReadinessSummary = resolveSummary(safe, "publicBetaFinalReadinessCommandCenterSummary", "WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter", "buildGlobalShoppingPublicBetaFinalReadinessCommandCenter");
    const offlineLaunchBlockerMatrixSummary = resolveSummary(safe, "offlineLaunchBlockerMatrixSummary", "WeishanGlobalShoppingOfflineLaunchBlockerMatrix", "buildGlobalShoppingOfflineLaunchBlockerMatrix");
    const manualTrialExitCriteriaSummary = resolveSummary(safe, "manualTrialExitCriteriaSummary", "WeishanGlobalShoppingManualTrialExitCriteria", "buildGlobalShoppingManualTrialExitCriteria");
    const offlineNextStepPlanningBoardSummary = resolveSummary(safe, "offlineNextStepPlanningBoardSummary", "WeishanGlobalShoppingOfflineNextStepPlanningBoard", "buildGlobalShoppingOfflineNextStepPlanningBoard");
    const manualLaunchHandoffPackSummary = resolveSummary(safe, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const missingRequired = [
      finalReadinessSummary,
      offlineLaunchBlockerMatrixSummary,
      manualTrialExitCriteriaSummary,
      offlineNextStepPlanningBoardSummary,
      manualLaunchHandoffPackSummary,
      publicBetaStabilityAuditSummary
    ].some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(finalReadinessSummary).finalReadinessStatus || obj(finalReadinessSummary).status, "needs_review"),
      normalizeStatus(obj(offlineLaunchBlockerMatrixSummary).blockerMatrixStatus || obj(offlineLaunchBlockerMatrixSummary).status, "needs_review"),
      normalizeStatus(obj(manualTrialExitCriteriaSummary).exitCriteriaStatus || obj(manualTrialExitCriteriaSummary).status, "needs_review"),
      normalizeStatus(obj(offlineNextStepPlanningBoardSummary).planningStatus || obj(offlineNextStepPlanningBoardSummary).status, "needs_review"),
      normalizeStatus(obj(manualLaunchHandoffPackSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaStabilityAuditSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const dossierStatus = blocked.length
      ? "blocked"
      : (missingRequired || statuses.some(function (status) { return status === "needs_review" || status === "blocked"; }) ? "needs_review" : "manual_review_required");
    const allowedNextPhaseOptions = dossierStatus === "blocked"
      ? ["blocked"]
      : ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"];

    return clone({
      dossierName:DOSSIER_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_NEXT_PHASE_DOSSIER_VERSION,
      dossierMode:safeMode(safe.dossierMode),
      dossierStatus:dossierStatus,
      status:dossierStatus,
      summary:dossierStatus === "blocked" ? "不创建 release、不 push、不启用交易" : "下一阶段只能继续测试、优化文案、扩展离线场景、人工复核或阻断",
      currentPhase:"public_beta_readonly_candidate",
      allowedNextPhaseOptions:allowedNextPhaseOptions,
      blockedNextPhaseOptions:BLOCKED_OPTIONS.slice(),
      requiredManualChecks:[
        "确认当前仍是只读 Public Beta 候选",
        "确认发布、provider、联网、付款、下单、出票全部保持阻断",
        "确认下一阶段仍需人工复核"
      ],
      knownLimitations:[
        "不写文件、不导出、不下载、不上传",
        "不发邮件、不创建任务、不打开外部平台",
        "不启用 provider、不启用交易"
      ],
      operatorNotes:[
        "当前仍是只读 Public Beta 候选",
        "不创建 release、不 push、不启用交易"
      ],
      manualReviewRequired:true,
      publicBetaFinalReadinessCommandCenterSummary:finalReadinessSummary,
      offlineLaunchBlockerMatrixSummary:offlineLaunchBlockerMatrixSummary,
      manualTrialExitCriteriaSummary:manualTrialExitCriteriaSummary,
      offlineNextStepPlanningBoardSummary:offlineNextStepPlanningBoardSummary,
      manualLaunchHandoffPackSummary:manualLaunchHandoffPackSummary,
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      userFacingSummary:{
        title:"Manual Next-Phase Dossier",
        resultLabel:dossierStatus === "blocked" ? "Manual Next-Phase Dossier 已阻断" : (dossierStatus === "needs_review" ? "Manual Next-Phase Dossier 仍需复核" : "Manual Next-Phase Dossier 需人工复核"),
        caveat:"下一阶段只能继续测试、优化文案、扩展离线场景、人工复核或阻断。"
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

  function buildGlobalShoppingManualNextPhaseDossierRows(input) {
    const safe = evaluateGlobalShoppingManualNextPhaseDossier(input || {});
    return clone([
      row("manual_next_phase_dossier", "Manual Next-Phase Dossier", safe.userFacingSummary.resultLabel, safe.dossierStatus === "blocked" ? "blocked" : "warning"),
      row("manual_next_phase_current_phase", "Current Phase", safe.currentPhase, "warning"),
      row("manual_next_phase_allowed", "Allowed Next Phase Options", safe.allowedNextPhaseOptions.join(" / "), safe.dossierStatus === "blocked" ? "blocked" : "warning"),
      row("manual_next_phase_blocked", "Blocked Next Phase Options", safe.blockedNextPhaseOptions.join(" / "), "warning"),
      row("manual_next_phase_manual", "Manual Review Required", "不创建 release、不 push、不启用交易", "warning")
    ]);
  }

  function buildGlobalShoppingManualNextPhaseDossierSections(input) {
    const safe = evaluateGlobalShoppingManualNextPhaseDossier(input || {});
    return clone([
      section("manual_next_phase_dossier", "Manual Next-Phase Dossier", safe.userFacingSummary.resultLabel),
      section("manual_next_phase_current_phase", "Current Phase", "当前仍是只读 Public Beta 候选"),
      section("manual_next_phase_boundary", "Next-Phase Dossier", "下一阶段只能继续测试、优化文案、扩展离线场景、人工复核或阻断")
    ]);
  }

  function buildGlobalShoppingManualNextPhaseDossierAuditDraft(input) {
    const safe = evaluateGlobalShoppingManualNextPhaseDossier(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_NEXT_PHASE_DOSSIER_AUDIT_DRAFT",
      dossierName:DOSSIER_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_NEXT_PHASE_DOSSIER_VERSION,
      dossierStatus:safe.dossierStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingManualNextPhaseDossier(dossier) {
    const safe = evaluateGlobalShoppingManualNextPhaseDossier(dossier || {});
    safe.rows = buildGlobalShoppingManualNextPhaseDossierRows(safe);
    safe.sections = buildGlobalShoppingManualNextPhaseDossierSections(safe);
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

  function buildGlobalShoppingManualNextPhaseDossier(input) {
    try {
      return sanitizeGlobalShoppingManualNextPhaseDossier(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualNextPhaseDossier({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualNextPhaseDossier = {
    GLOBAL_SHOPPING_MANUAL_NEXT_PHASE_DOSSIER_VERSION,
    DOSSIER_NAME,
    buildGlobalShoppingManualNextPhaseDossier,
    evaluateGlobalShoppingManualNextPhaseDossier,
    buildGlobalShoppingManualNextPhaseDossierRows,
    buildGlobalShoppingManualNextPhaseDossierSections,
    buildGlobalShoppingManualNextPhaseDossierAuditDraft,
    sanitizeGlobalShoppingManualNextPhaseDossier
  };
})();
