;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_NEXT_STEP_VIEW_MODEL_VERSION = "4.2.7";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_next_step_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }

  function buildGlobalShoppingClosureEvidenceArchiveRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaClosureEvidenceArchiveSummary", "WeishanGlobalShoppingPublicBetaClosureEvidenceArchive", "buildGlobalShoppingPublicBetaClosureEvidenceArchive");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("public_beta_closure_evidence_archive_missing", "Public Beta Closure Evidence Archive", "Public Beta Closure Evidence Archive 仍需复核", "warning")];
  }

  function buildGlobalShoppingManualExitCriteriaRowsForView(input) {
    const summary = resolveSummary(input, "manualTrialExitCriteriaSummary", "WeishanGlobalShoppingManualTrialExitCriteria", "buildGlobalShoppingManualTrialExitCriteria");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("manual_trial_exit_criteria_missing", "Manual Trial Exit Criteria", "Manual Trial Exit Criteria 仍需复核", "warning")];
  }

  function buildGlobalShoppingNextStepPlanningRowsForView(input) {
    const summary = resolveSummary(input, "offlineNextStepPlanningBoardSummary", "WeishanGlobalShoppingOfflineNextStepPlanningBoard", "buildGlobalShoppingOfflineNextStepPlanningBoard");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("offline_next_step_planning_board_missing", "Offline Next-Step Planning Board", "Offline Next-Step Planning Board 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaNextStepCards(input) {
    const closureArchiveSummary = resolveSummary(input, "publicBetaClosureEvidenceArchiveSummary", "WeishanGlobalShoppingPublicBetaClosureEvidenceArchive", "buildGlobalShoppingPublicBetaClosureEvidenceArchive");
    const manualTrialExitCriteriaSummary = resolveSummary(input, "manualTrialExitCriteriaSummary", "WeishanGlobalShoppingManualTrialExitCriteria", "buildGlobalShoppingManualTrialExitCriteria");
    const offlineNextStepPlanningBoardSummary = resolveSummary(input, "offlineNextStepPlanningBoardSummary", "WeishanGlobalShoppingOfflineNextStepPlanningBoard", "buildGlobalShoppingOfflineNextStepPlanningBoard");
    return clone([
      card("public_beta_closure_evidence_archive", "Public Beta Closure Evidence Archive", text(obj(closureArchiveSummary.userFacingSummary).resultLabel || "Public Beta Closure Evidence Archive 仍需复核")),
      card("manual_trial_exit_criteria", "Manual Trial Exit Criteria", text(obj(manualTrialExitCriteriaSummary.userFacingSummary).resultLabel || "Manual Trial Exit Criteria 仍需复核")),
      card("offline_next_step_planning_board", "Offline Next-Step Planning Board", text(obj(offlineNextStepPlanningBoardSummary.userFacingSummary).resultLabel || "Offline Next-Step Planning Board 仍需复核")),
      card("closure_evidence", "Closure Evidence", "闭环证据仅为只读归档视图，不写文件"),
      card("exit_criteria", "Exit Criteria", "退出标准不自动通过，不创建 release"),
      card("next_step_planning", "Next-Step Planning", "下一步只能继续测试、优化文案、扩展离线场景、人工复核或阻断"),
      card("manual_review_required", "Manual Review Required", "仍不允许启用 provider、付款、下单或发布")
    ]);
  }

  function buildGlobalShoppingPublicBetaNextStepRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_next_step_view_model", "Public Beta Next-Step ViewModel", safe.status === "ready" ? "Public Beta Next-Step ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta Next-Step ViewModel 已阻断" : "Public Beta Next-Step ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_next_step_closure", "Closure Evidence", "闭环证据仅为只读归档视图，不写文件", "warning"),
      row("public_beta_next_step_exit", "Exit Criteria", "退出标准不自动通过，不创建 release", "warning"),
      row("public_beta_next_step_planning", "Next-Step Planning", "下一步只能继续测试、优化文案、扩展离线场景、人工复核或阻断", "warning"),
      row("public_beta_next_step_manual", "Manual Review Required", "仍不允许启用 provider、付款、下单或发布", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaNextStepViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaClosureEvidenceArchiveSummary = resolveSummary(safe, "publicBetaClosureEvidenceArchiveSummary", "WeishanGlobalShoppingPublicBetaClosureEvidenceArchive", "buildGlobalShoppingPublicBetaClosureEvidenceArchive");
    const manualTrialExitCriteriaSummary = resolveSummary(safe, "manualTrialExitCriteriaSummary", "WeishanGlobalShoppingManualTrialExitCriteria", "buildGlobalShoppingManualTrialExitCriteria");
    const offlineNextStepPlanningBoardSummary = resolveSummary(safe, "offlineNextStepPlanningBoardSummary", "WeishanGlobalShoppingOfflineNextStepPlanningBoard", "buildGlobalShoppingOfflineNextStepPlanningBoard");
    const closureStatus = normalizeStatus(obj(publicBetaClosureEvidenceArchiveSummary).archiveStatus || obj(publicBetaClosureEvidenceArchiveSummary).status, "needs_review");
    const exitStatus = normalizeStatus(obj(manualTrialExitCriteriaSummary).exitCriteriaStatus || obj(manualTrialExitCriteriaSummary).status, "needs_review");
    const planningStatus = normalizeStatus(obj(offlineNextStepPlanningBoardSummary).planningStatus || obj(offlineNextStepPlanningBoardSummary).status, "needs_review");
    const missingRequired = !present(publicBetaClosureEvidenceArchiveSummary) || !present(manualTrialExitCriteriaSummary) || !present(offlineNextStepPlanningBoardSummary);
    const status = closureStatus === "blocked" || exitStatus === "blocked" || planningStatus === "blocked"
      ? "blocked"
      : (missingRequired || closureStatus !== "manual_review_required" || exitStatus !== "manual_review_required" || planningStatus !== "manual_review_required" ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_NEXT_STEP_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Closure Evidence Archive",
      subtitle:"Manual Trial Exit Criteria",
      cards:buildGlobalShoppingPublicBetaNextStepCards({
        publicBetaClosureEvidenceArchiveSummary:publicBetaClosureEvidenceArchiveSummary,
        manualTrialExitCriteriaSummary:manualTrialExitCriteriaSummary,
        offlineNextStepPlanningBoardSummary:offlineNextStepPlanningBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaNextStepRows({ status:status }),
      closureEvidenceArchiveRows:buildGlobalShoppingClosureEvidenceArchiveRowsForView({ publicBetaClosureEvidenceArchiveSummary:publicBetaClosureEvidenceArchiveSummary }),
      manualExitCriteriaRows:buildGlobalShoppingManualExitCriteriaRowsForView({ manualTrialExitCriteriaSummary:manualTrialExitCriteriaSummary }),
      nextStepPlanningRows:buildGlobalShoppingNextStepPlanningRowsForView({ offlineNextStepPlanningBoardSummary:offlineNextStepPlanningBoardSummary }),
      publicBetaClosureEvidenceArchiveSummary:publicBetaClosureEvidenceArchiveSummary,
      manualTrialExitCriteriaSummary:manualTrialExitCriteriaSummary,
      offlineNextStepPlanningBoardSummary:offlineNextStepPlanningBoardSummary,
      manualReviewRequired:true,
      safeToProceedWithManualNextStepReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Next-Step ViewModel",
        resultLabel:status === "ready" ? "Public Beta Closure Evidence Archive / Manual Trial Exit Criteria / Offline Next-Step Planning Board 已准备" : (status === "blocked" ? "Public Beta Next-Step ViewModel 已阻断" : "Public Beta Next-Step ViewModel 仍需复核"),
        caveat:"不写文件、不联网、不打开外部平台。"
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

  function buildGlobalShoppingPublicBetaNextStepViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaNextStepViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_NEXT_STEP_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_NEXT_STEP_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualNextStepReview:safe.safeToProceedWithManualNextStepReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaNextStepViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaNextStepViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaNextStepViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaNextStepViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_NEXT_STEP_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaNextStepViewModel,
    buildGlobalShoppingPublicBetaNextStepCards,
    buildGlobalShoppingPublicBetaNextStepRows,
    buildGlobalShoppingClosureEvidenceArchiveRowsForView,
    buildGlobalShoppingManualExitCriteriaRowsForView,
    buildGlobalShoppingNextStepPlanningRowsForView,
    buildGlobalShoppingPublicBetaNextStepViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaNextStepViewModel
  };
})();
