;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_COMMAND_CENTER_VERSION = "4.2.4";
  const CENTER_NAME = "global_shopping_public_beta_final_readiness_command_center_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, final_readiness_command_center_only:true };
  const ALLOWED_NEXT_ACTIONS = ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required", "blocked"];
  const BLOCKED_NEXT_ACTIONS = ["enable_provider", "enable_payment", "enable_order", "auto_publish", "auto_launch", "ready_to_publish", "production_ready"];
  const BLOCKED_TEXT_RE = /ready_to_publish|production_ready|auto_release|auto_launch|auto_publish|enable_provider|enable_payment|enable_order/i;
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
    const mode = text(value || "final_readiness_command_center_only");
    return ALLOWED_MODES[mode] ? mode : "final_readiness_command_center_only";
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
    if (safe.readyToPublish === true || safe.productionReady === true || safe.autoRelease === true || safe.autoLaunch === true || safe.autoPublish === true) blocked.push("unsafe publish capability");
    if (safe.enableProvider === true || safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.enablePayment === true || safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.enableOrder === true || safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true) blocked.push("raw persistence");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true) blocked.push("raw user text persistence");
    ["status", "title", "summary", "subtitle", "readinessSummary"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingPublicBetaFinalReadinessCommandCenter(input) {
    const safe = obj(input);
    const publicBetaClosureEvidenceArchiveSummary = resolveSummary(safe, "publicBetaClosureEvidenceArchiveSummary", "WeishanGlobalShoppingPublicBetaClosureEvidenceArchive", "buildGlobalShoppingPublicBetaClosureEvidenceArchive");
    const manualTrialExitCriteriaSummary = resolveSummary(safe, "manualTrialExitCriteriaSummary", "WeishanGlobalShoppingManualTrialExitCriteria", "buildGlobalShoppingManualTrialExitCriteria");
    const offlineNextStepPlanningBoardSummary = resolveSummary(safe, "offlineNextStepPlanningBoardSummary", "WeishanGlobalShoppingOfflineNextStepPlanningBoard", "buildGlobalShoppingOfflineNextStepPlanningBoard");
    const publicBetaNextStepViewModelSummary = resolveSummary(safe, "publicBetaNextStepViewModelSummary", "WeishanGlobalShoppingPublicBetaNextStepViewModel", "buildGlobalShoppingPublicBetaNextStepViewModel");
    const publicBetaAcceptanceReviewConsoleSummary = resolveSummary(safe, "publicBetaAcceptanceReviewConsoleSummary", "WeishanGlobalShoppingPublicBetaAcceptanceReviewConsole", "buildGlobalShoppingPublicBetaAcceptanceReviewConsole");
    const noLaunchAssuranceGateSummary = resolveSummary(safe, "noLaunchAssuranceGateSummary", "WeishanGlobalShoppingNoLaunchAssuranceGate", "buildGlobalShoppingNoLaunchAssuranceGate");
    const summaries = [
      publicBetaClosureEvidenceArchiveSummary,
      manualTrialExitCriteriaSummary,
      offlineNextStepPlanningBoardSummary,
      publicBetaNextStepViewModelSummary,
      publicBetaAcceptanceReviewConsoleSummary,
      noLaunchAssuranceGateSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const closureEvidenceStatus = normalizeStatus(obj(publicBetaClosureEvidenceArchiveSummary).archiveStatus || obj(publicBetaClosureEvidenceArchiveSummary).status, "needs_review");
    const exitCriteriaStatus = normalizeStatus(obj(manualTrialExitCriteriaSummary).exitCriteriaStatus || obj(manualTrialExitCriteriaSummary).status, "needs_review");
    const nextStepPlanningStatus = normalizeStatus(obj(offlineNextStepPlanningBoardSummary).planningStatus || obj(offlineNextStepPlanningBoardSummary).status, "needs_review");
    const nextStepViewStatus = normalizeStatus(obj(publicBetaNextStepViewModelSummary).status, "needs_review");
    const acceptanceReviewStatus = normalizeStatus(obj(publicBetaAcceptanceReviewConsoleSummary).acceptanceReviewStatus || obj(publicBetaAcceptanceReviewConsoleSummary).status, "needs_review");
    const noLaunchStatus = normalizeStatus(obj(noLaunchAssuranceGateSummary).status, "needs_review");
    const blocked = blockedReasons(safe);
    const upstreamBlocked = [closureEvidenceStatus, exitCriteriaStatus, nextStepPlanningStatus, nextStepViewStatus, acceptanceReviewStatus, noLaunchStatus].some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = [closureEvidenceStatus, exitCriteriaStatus, nextStepPlanningStatus, nextStepViewStatus, acceptanceReviewStatus, noLaunchStatus].some(function (status) {
      return status !== "ready" && status !== "manual_review_required";
    });
    const finalReadinessStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const allowedNextActions = finalReadinessStatus === "blocked"
      ? ["blocked"]
      : ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"];
    const knownWarnings = unique(
      []
        .concat(Array.isArray(safe.knownWarnings) ? safe.knownWarnings : [])
        .concat(Array.isArray(obj(publicBetaClosureEvidenceArchiveSummary).knownWarnings) ? obj(publicBetaClosureEvidenceArchiveSummary).knownWarnings : [])
        .filter(function (item) { return /secret scan WARN/i.test(text(item)); })
    );

    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_COMMAND_CENTER_VERSION,
      centerMode:safeMode(safe.centerMode),
      finalReadinessStatus:finalReadinessStatus,
      status:finalReadinessStatus,
      readinessSummary:finalReadinessStatus === "blocked"
        ? "发布、provider、联网、付款、下单、出票全部保持阻断"
        : "当前仍是只读 Public Beta 候选",
      closureEvidenceStatus:closureEvidenceStatus,
      exitCriteriaStatus:exitCriteriaStatus,
      nextStepPlanningStatus:nextStepPlanningStatus,
      nextStepViewStatus:nextStepViewStatus,
      acceptanceReviewStatus:acceptanceReviewStatus,
      noLaunchStatus:noLaunchStatus,
      blockedCapabilities:unique(blocked.concat(BLOCKED_NEXT_ACTIONS)),
      allowedNextActions:allowedNextActions,
      blockedNextActions:BLOCKED_NEXT_ACTIONS.slice(),
      knownWarnings:knownWarnings,
      manualReviewRequired:true,
      publicBetaClosureEvidenceArchiveSummary:publicBetaClosureEvidenceArchiveSummary,
      manualTrialExitCriteriaSummary:manualTrialExitCriteriaSummary,
      offlineNextStepPlanningBoardSummary:offlineNextStepPlanningBoardSummary,
      publicBetaNextStepViewModelSummary:publicBetaNextStepViewModelSummary,
      publicBetaAcceptanceReviewConsoleSummary:publicBetaAcceptanceReviewConsoleSummary,
      noLaunchAssuranceGateSummary:noLaunchAssuranceGateSummary,
      userFacingSummary:{
        title:"Public Beta Final Readiness Command Center",
        resultLabel:finalReadinessStatus === "blocked" ? "Public Beta Final Readiness Command Center 已阻断" : (finalReadinessStatus === "needs_review" ? "Public Beta Final Readiness Command Center 仍需复核" : "Public Beta Final Readiness Command Center 需人工复核"),
        caveat:"不创建 release、不 push、不启用交易。"
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

  function buildGlobalShoppingPublicBetaFinalReadinessRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaFinalReadinessCommandCenter(input || {});
    return clone([
      row("public_beta_final_readiness_command_center", "Public Beta Final Readiness Command Center", safe.userFacingSummary.resultLabel, safe.finalReadinessStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_final_readiness", "Final Readiness", safe.readinessSummary, safe.finalReadinessStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_launch_boundary", "Launch Blockers", "发布、provider、联网、付款、下单、出票全部保持阻断", "warning"),
      row("public_beta_next_actions", "Allowed Next Actions", safe.allowedNextActions.join(" / "), safe.finalReadinessStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_manual_review", "Manual Review Required", "不创建 release、不 push、不启用交易", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalReadinessSections(input) {
    const safe = evaluateGlobalShoppingPublicBetaFinalReadinessCommandCenter(input || {});
    return clone([
      section("public_beta_final_readiness_command_center", "Public Beta Final Readiness Command Center", safe.userFacingSummary.resultLabel),
      section("public_beta_final_readiness_scope", "Final Readiness", "当前仍是只读 Public Beta 候选"),
      section("public_beta_final_readiness_boundary", "Launch Blockers", "发布、provider、联网、付款、下单、出票全部保持阻断")
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalReadinessCommandCenterAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaFinalReadinessCommandCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_COMMAND_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_COMMAND_CENTER_VERSION,
      finalReadinessStatus:safe.finalReadinessStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaFinalReadinessCommandCenter(center) {
    const safe = evaluateGlobalShoppingPublicBetaFinalReadinessCommandCenter(center || {});
    safe.rows = buildGlobalShoppingPublicBetaFinalReadinessRows(safe);
    safe.sections = buildGlobalShoppingPublicBetaFinalReadinessSections(safe);
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

  function buildGlobalShoppingPublicBetaFinalReadinessCommandCenter(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaFinalReadinessCommandCenter(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaFinalReadinessCommandCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_COMMAND_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingPublicBetaFinalReadinessCommandCenter,
    evaluateGlobalShoppingPublicBetaFinalReadinessCommandCenter,
    buildGlobalShoppingPublicBetaFinalReadinessRows,
    buildGlobalShoppingPublicBetaFinalReadinessSections,
    buildGlobalShoppingPublicBetaFinalReadinessCommandCenterAuditDraft,
    sanitizeGlobalShoppingPublicBetaFinalReadinessCommandCenter
  };
})();
