;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_MANUAL_VIEW_MODEL_VERSION = "4.1.6";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_final_manual_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function summaryLabel(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }

  function buildGlobalShoppingTrialReadinessRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaTrialReadinessPackSummary", "WeishanGlobalShoppingPublicBetaTrialReadinessPack", "buildGlobalShoppingPublicBetaTrialReadinessPack");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_trial_readiness_missing", "Public Beta Trial Readiness Pack", "Public Beta Trial Readiness Pack 仍需复核", "warning")];
  }
  function buildGlobalShoppingManualAcceptanceRowsForView(input) {
    const summary = resolveSummary(input, "finalManualAcceptanceConsoleSummary", "WeishanGlobalShoppingFinalManualAcceptanceConsole", "buildGlobalShoppingFinalManualAcceptanceConsole");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("final_manual_acceptance_missing", "Final Manual Acceptance Console", "Final Manual Acceptance Console 仍需复核", "warning")];
  }
  function buildGlobalShoppingFeedbackPlaceholderRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaFeedbackPlaceholderSummary", "WeishanGlobalShoppingPublicBetaFeedbackPlaceholder", "buildGlobalShoppingPublicBetaFeedbackPlaceholder");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("feedback_placeholder_missing", "Feedback Placeholder", "Feedback Placeholder 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaFinalManualCards(input) {
    const safe = obj(input);
    const trialSummary = resolveSummary(safe, "publicBetaTrialReadinessPackSummary", "WeishanGlobalShoppingPublicBetaTrialReadinessPack", "buildGlobalShoppingPublicBetaTrialReadinessPack");
    const acceptanceSummary = resolveSummary(safe, "finalManualAcceptanceConsoleSummary", "WeishanGlobalShoppingFinalManualAcceptanceConsole", "buildGlobalShoppingFinalManualAcceptanceConsole");
    const feedbackSummary = resolveSummary(safe, "publicBetaFeedbackPlaceholderSummary", "WeishanGlobalShoppingPublicBetaFeedbackPlaceholder", "buildGlobalShoppingPublicBetaFeedbackPlaceholder");
    return clone([
      card("public_beta_trial_readiness_pack", "Public Beta Trial Readiness Pack", summaryLabel(trialSummary, "Public Beta Trial Readiness Pack 仍需复核")),
      card("final_manual_acceptance_console", "Final Manual Acceptance Console", summaryLabel(acceptanceSummary, "Final Manual Acceptance Console 仍需复核")),
      card("feedback_placeholder", "Feedback Placeholder", summaryLabel(feedbackSummary, "Feedback Placeholder 仍需复核")),
      card("known_limitations", "Known Limitations", "试用范围仅限只读候选价、费用归一化、官方价锚点"),
      card("manual_review_required", "Manual Review Required", "人工验收后再决定下一阶段"),
      card("rc_candidate_boundary", "RC Candidate Boundary", "当前只是 RC 候选，不创建 release、不 push")
    ]);
  }

  function buildGlobalShoppingPublicBetaFinalManualRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("public_beta_final_manual_view_model_status", "Public Beta Final Manual View Model", status === "ready" ? "Public Beta Final Manual View Model 已准备" : (status === "blocked" ? "Public Beta Final Manual View Model 已阻断" : "Public Beta Final Manual View Model 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_final_manual_manual_review", "Manual Review Required", "人工验收后再决定下一阶段", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaFinalManualViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaTrialReadinessPackSummary = resolveSummary(safe, "publicBetaTrialReadinessPackSummary", "WeishanGlobalShoppingPublicBetaTrialReadinessPack", "buildGlobalShoppingPublicBetaTrialReadinessPack");
    const finalManualAcceptanceConsoleSummary = resolveSummary(safe, "finalManualAcceptanceConsoleSummary", "WeishanGlobalShoppingFinalManualAcceptanceConsole", "buildGlobalShoppingFinalManualAcceptanceConsole");
    const publicBetaFeedbackPlaceholderSummary = resolveSummary(safe, "publicBetaFeedbackPlaceholderSummary", "WeishanGlobalShoppingPublicBetaFeedbackPlaceholder", "buildGlobalShoppingPublicBetaFeedbackPlaceholder");
    const statuses = [
      safeStatus(publicBetaTrialReadinessPackSummary.status),
      safeStatus(finalManualAcceptanceConsoleSummary.status),
      safeStatus(publicBetaFeedbackPlaceholderSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(publicBetaTrialReadinessPackSummary) ||
      !present(finalManualAcceptanceConsoleSummary) ||
      !present(publicBetaFeedbackPlaceholderSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_MANUAL_VIEW_MODEL_VERSION,
      status,
      title:"Public Beta Trial Readiness Pack",
      subtitle:"Final Manual Acceptance Console",
      cards:buildGlobalShoppingPublicBetaFinalManualCards({
        publicBetaTrialReadinessPackSummary,
        finalManualAcceptanceConsoleSummary,
        publicBetaFeedbackPlaceholderSummary
      }),
      rows:buildGlobalShoppingPublicBetaFinalManualRows({ status }),
      trialReadinessRows:buildGlobalShoppingTrialReadinessRowsForView({ publicBetaTrialReadinessPackSummary }),
      manualAcceptanceRows:buildGlobalShoppingManualAcceptanceRowsForView({ finalManualAcceptanceConsoleSummary }),
      feedbackPlaceholderRows:buildGlobalShoppingFeedbackPlaceholderRowsForView({ publicBetaFeedbackPlaceholderSummary }),
      publicBetaTrialReadinessPackSummary,
      finalManualAcceptanceConsoleSummary,
      publicBetaFeedbackPlaceholderSummary,
      userFacingSummary:{
        title:"Public Beta Final Manual View Model",
        resultLabel:status === "ready" ? "Public Beta Trial Readiness Pack / Final Manual Acceptance Console / Feedback Placeholder 已准备" : (status === "blocked" ? "Public Beta Final Manual View Model 已阻断" : "Public Beta Final Manual View Model 仍需复核"),
        caveat:"不自动通过，不自动发布，人工验收后再决定下一阶段；当前只是 RC 候选，不创建 release、不 push。"
      },
      safeToProceedWithManualTrialReview:status === "ready",
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

  function buildGlobalShoppingPublicBetaFinalManualViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaFinalManualViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_MANUAL_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_MANUAL_VIEW_MODEL_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      cardCount:toArray(safe.cards).length,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaFinalManualViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaFinalManualViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaFinalManualViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaFinalManualViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_MANUAL_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaFinalManualViewModel,
    buildGlobalShoppingPublicBetaFinalManualCards,
    buildGlobalShoppingPublicBetaFinalManualRows,
    buildGlobalShoppingTrialReadinessRowsForView,
    buildGlobalShoppingManualAcceptanceRowsForView,
    buildGlobalShoppingFeedbackPlaceholderRowsForView,
    buildGlobalShoppingPublicBetaFinalManualViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaFinalManualViewModel
  };
})();
