;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_REVIEW_VIEW_MODEL_VERSION = "4.1.7";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_freeze_review_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }

  function buildGlobalShoppingPublicBetaFreezeReviewCards(input) {
    const safe = obj(input);
    return clone([
      card("qa_freeze_gate", "Public Beta QA Freeze Gate", text(obj(safe.publicBetaQaFreezeGateSummary.userFacingSummary).resultLabel || "Public Beta QA Freeze Gate 仍需复核")),
      card("manual_trial_summary", "Manual Trial Summary Board", text(obj(safe.manualTrialSummaryBoardSummary.userFacingSummary).resultLabel || "Manual Trial Summary Board 仍需复核")),
      card("offline_readiness_review", "Offline Readiness Review Panel", text(obj(safe.offlineReadinessReviewPanelSummary.userFacingSummary).resultLabel || "Offline Readiness Review Panel 仍需复核")),
      card("frozen_scope", "Frozen Scope", "只读 QA 范围"),
      card("allowed_next_actions", "Allowed Next Actions", "continue_testing / manual_review_required / blocked"),
      card("blocked_next_actions", "Blocked Next Actions", "仍不允许启用 provider、付款、下单或发布")
    ]);
  }

  function buildGlobalShoppingQaFreezeRowsForView(input) {
    const summary = obj(input && input.publicBetaQaFreezeGateSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingManualTrialSummaryRowsForView(input) {
    const summary = obj(input && input.manualTrialSummaryBoardSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingReadinessReviewRowsForView(input) {
    const summary = obj(input && input.offlineReadinessReviewPanelSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingPublicBetaFreezeReviewRows(input) {
    const safe = obj(input);
    return clone([
      row("freeze_review_title", "Public Beta QA Freeze Gate", text(obj(safe.publicBetaQaFreezeGateSummary.userFacingSummary).resultLabel || "Public Beta QA Freeze Gate 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("freeze_review_trial_summary", "Manual Trial Summary Board", text(obj(safe.manualTrialSummaryBoardSummary.userFacingSummary).resultLabel || "Manual Trial Summary Board 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("freeze_review_offline_panel", "Offline Readiness Review Panel", text(obj(safe.offlineReadinessReviewPanelSummary.userFacingSummary).resultLabel || "Offline Readiness Review Panel 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("freeze_review_scope", "Frozen Scope", "当前冻结的是只读 QA 范围，不执行真实 freeze", "warning"),
      row("freeze_review_allowed", "Allowed Next Actions", "只允许继续测试、人工复核或阻断", "warning"),
      row("freeze_review_blocked", "Blocked Next Actions", "仍不允许启用 provider、付款、下单或发布", "warning"),
      row("freeze_review_manual", "Manual Review Required", "人工复核后再决定下一阶段", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaFreezeReviewViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaQaFreezeGateSummary = resolveSummary(safe, "publicBetaQaFreezeGateSummary", "WeishanGlobalShoppingPublicBetaQaFreezeGate", "buildGlobalShoppingPublicBetaQaFreezeGate");
    const manualTrialSummaryBoardSummary = resolveSummary(safe, "manualTrialSummaryBoardSummary", "WeishanGlobalShoppingManualTrialSummaryBoard", "buildGlobalShoppingManualTrialSummaryBoard");
    const offlineReadinessReviewPanelSummary = resolveSummary(safe, "offlineReadinessReviewPanelSummary", "WeishanGlobalShoppingOfflineReadinessReviewPanel", "buildGlobalShoppingOfflineReadinessReviewPanel");
    const qaStatus = normalizeStatus(obj(publicBetaQaFreezeGateSummary).status || obj(publicBetaQaFreezeGateSummary).freezeStatus || "", "needs_review");
    const trialStatus = normalizeStatus(obj(manualTrialSummaryBoardSummary).status || obj(manualTrialSummaryBoardSummary).trialSummaryStatus || "", "needs_review");
    const panelStatus = normalizeStatus(obj(offlineReadinessReviewPanelSummary).status || obj(offlineReadinessReviewPanelSummary).readinessStatus || "", "needs_review");
    const missingRequired = !present(publicBetaQaFreezeGateSummary) || !present(manualTrialSummaryBoardSummary) || !present(offlineReadinessReviewPanelSummary);
    const status = qaStatus === "blocked" || trialStatus === "blocked" || panelStatus === "blocked"
      ? "blocked"
      : (missingRequired || qaStatus !== "ready" || trialStatus !== "ready" || !/^(manual_review_required|ready)$/.test(panelStatus) ? "needs_review" : "ready");
    const result = {
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta QA Freeze Gate",
      subtitle:"Manual Trial Summary Board",
      publicBetaQaFreezeGateSummary:publicBetaQaFreezeGateSummary,
      manualTrialSummaryBoardSummary:manualTrialSummaryBoardSummary,
      offlineReadinessReviewPanelSummary:offlineReadinessReviewPanelSummary,
      cards:[],
      rows:[],
      qaFreezeRows:buildGlobalShoppingQaFreezeRowsForView({ publicBetaQaFreezeGateSummary:publicBetaQaFreezeGateSummary }),
      manualTrialRows:buildGlobalShoppingManualTrialSummaryRowsForView({ manualTrialSummaryBoardSummary:manualTrialSummaryBoardSummary }),
      readinessRows:buildGlobalShoppingReadinessReviewRowsForView({ offlineReadinessReviewPanelSummary:offlineReadinessReviewPanelSummary }),
      manualReviewRequired:true,
      safeToProceedWithManualFreezeReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Freeze Review View Model",
        resultLabel:status === "ready" ? "Public Beta QA Freeze Gate / Manual Trial Summary Board / Offline Readiness Review Panel 已准备" : (status === "blocked" ? "Public Beta Freeze Review View Model 已阻断" : "Public Beta Freeze Review View Model 仍需复核"),
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
    };
    result.cards = buildGlobalShoppingPublicBetaFreezeReviewCards(result);
    result.rows = buildGlobalShoppingPublicBetaFreezeReviewRows(result);
    return clone(result);
  }

  function buildGlobalShoppingPublicBetaFreezeReviewViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaFreezeReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_REVIEW_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualFreezeReview:safe.safeToProceedWithManualFreezeReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaFreezeReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaFreezeReviewViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaFreezeReviewViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaFreezeReviewViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaFreezeReviewViewModel,
    buildGlobalShoppingPublicBetaFreezeReviewCards,
    buildGlobalShoppingPublicBetaFreezeReviewRows,
    buildGlobalShoppingQaFreezeRowsForView,
    buildGlobalShoppingManualTrialSummaryRowsForView,
    buildGlobalShoppingReadinessReviewRowsForView,
    buildGlobalShoppingPublicBetaFreezeReviewViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaFreezeReviewViewModel
  };
})();
