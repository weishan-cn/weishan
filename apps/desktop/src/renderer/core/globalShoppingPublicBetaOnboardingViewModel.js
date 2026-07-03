;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_ONBOARDING_VIEW_MODEL_VERSION = "4.1.5";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_onboarding_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
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
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }

  function buildGlobalShoppingOnboardingRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaUserOnboardingShellSummary", "WeishanGlobalShoppingPublicBetaUserOnboardingShell", "buildGlobalShoppingPublicBetaUserOnboardingShell");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_onboarding_missing", "Public Beta User Onboarding", "Public Beta User Onboarding 仍需复核", "warning")];
  }
  function buildGlobalShoppingVisualTrialRowsForView(input) {
    const summary = resolveSummary(input, "visualTrialGuideSummary", "WeishanGlobalShoppingVisualTrialGuide", "buildGlobalShoppingVisualTrialGuide");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("visual_trial_guide_missing", "Visual Trial Guide", "Visual Trial Guide 仍需复核", "warning")];
  }
  function buildGlobalShoppingSafeFeedbackRowsForView(input) {
    const summary = resolveSummary(input, "safeFeedbackDraftPanelSummary", "WeishanGlobalShoppingSafeFeedbackDraftPanel", "buildGlobalShoppingSafeFeedbackDraftPanel");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("safe_feedback_draft_missing", "Safe Feedback Draft", "Safe Feedback Draft 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaOnboardingCards(input) {
    const safe = obj(input);
    const onboardingSummary = resolveSummary(safe, "publicBetaUserOnboardingShellSummary", "WeishanGlobalShoppingPublicBetaUserOnboardingShell", "buildGlobalShoppingPublicBetaUserOnboardingShell");
    const trialGuideSummary = resolveSummary(safe, "visualTrialGuideSummary", "WeishanGlobalShoppingVisualTrialGuide", "buildGlobalShoppingVisualTrialGuide");
    const feedbackSummary = resolveSummary(safe, "safeFeedbackDraftPanelSummary", "WeishanGlobalShoppingSafeFeedbackDraftPanel", "buildGlobalShoppingSafeFeedbackDraftPanel");
    return clone([
      card("public_beta_user_onboarding", "Public Beta User Onboarding", labelOf(onboardingSummary, "Public Beta User Onboarding 仍需复核")),
      card("visual_trial_guide", "Visual Trial Guide", labelOf(trialGuideSummary, "Visual Trial Guide 仍需复核")),
      card("safe_feedback_draft", "Safe Feedback Draft", labelOf(feedbackSummary, "Safe Feedback Draft 仍需复核")),
      card("readonly_capabilities", "Readonly Capabilities", "你可以查看候选价、费用归一化和官方价锚点"),
      card("locked_capabilities", "Locked Capabilities", "当前不会付款、下单或出票"),
      card("privacy_boundary", "Privacy Boundary", "不会保存账号、证件或支付信息"),
      card("rc_candidate_boundary", "RC Candidate Boundary", "当前只是 RC 候选，不创建 release、不 push")
    ]);
  }

  function buildGlobalShoppingPublicBetaOnboardingRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("public_beta_onboarding_view_model_status", "Public Beta Onboarding View Model", status === "ready" ? "Public Beta Onboarding View Model 已准备" : (status === "blocked" ? "Public Beta Onboarding View Model 已阻断" : "Public Beta Onboarding View Model 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_onboarding_readonly", "Readonly Capabilities", "你可以查看候选价、费用归一化和官方价锚点", "pass"),
      row("public_beta_onboarding_locked", "Locked Capabilities", "当前不会付款、下单或出票", "warning"),
      row("public_beta_onboarding_privacy", "Privacy Boundary", "不会保存账号、证件或支付信息", "pass"),
      row("public_beta_onboarding_feedback", "Safe Feedback Draft", "反馈入口目前仅为草稿，不发送、不上传、不保存用户原文", "warning"),
      row("public_beta_onboarding_rc", "RC Candidate Boundary", "当前只是 RC 候选，不创建 release、不 push", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaOnboardingViewModel(viewModel) {
    const safe = obj(viewModel);
    const onboardingSummary = resolveSummary(safe, "publicBetaUserOnboardingShellSummary", "WeishanGlobalShoppingPublicBetaUserOnboardingShell", "buildGlobalShoppingPublicBetaUserOnboardingShell");
    const trialGuideSummary = resolveSummary(safe, "visualTrialGuideSummary", "WeishanGlobalShoppingVisualTrialGuide", "buildGlobalShoppingVisualTrialGuide");
    const feedbackSummary = resolveSummary(safe, "safeFeedbackDraftPanelSummary", "WeishanGlobalShoppingSafeFeedbackDraftPanel", "buildGlobalShoppingSafeFeedbackDraftPanel");
    const statuses = [safeStatus(onboardingSummary.status), safeStatus(trialGuideSummary.status), safeStatus(feedbackSummary.status)];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const missingRequired = !present(safe.publicBetaUserOnboardingShellSummary) || !present(safe.visualTrialGuideSummary) || !present(safe.safeFeedbackDraftPanelSummary);
    const status = blocked ? "blocked" : ((missingRequired || statuses.indexOf("needs_review") >= 0) ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ONBOARDING_VIEW_MODEL_VERSION,
      status,
      title:"Public Beta User Onboarding",
      subtitle:"Visual Trial Guide",
      cards:buildGlobalShoppingPublicBetaOnboardingCards({
        publicBetaUserOnboardingShellSummary:onboardingSummary,
        visualTrialGuideSummary:trialGuideSummary,
        safeFeedbackDraftPanelSummary:feedbackSummary
      }),
      rows:buildGlobalShoppingPublicBetaOnboardingRows({ status }),
      onboardingRows:buildGlobalShoppingOnboardingRowsForView({ publicBetaUserOnboardingShellSummary:onboardingSummary }),
      visualTrialRows:buildGlobalShoppingVisualTrialRowsForView({ visualTrialGuideSummary:trialGuideSummary }),
      safeFeedbackRows:buildGlobalShoppingSafeFeedbackRowsForView({ safeFeedbackDraftPanelSummary:feedbackSummary }),
      publicBetaUserOnboardingShellSummary:onboardingSummary,
      visualTrialGuideSummary:trialGuideSummary,
      safeFeedbackDraftPanelSummary:feedbackSummary,
      manualReviewRequired:true,
      userFacingSummary:{
        title:"Public Beta Onboarding View Model",
        resultLabel:status === "ready" ? "Public Beta User Onboarding / Visual Trial Guide / Safe Feedback Draft 已准备" : (status === "blocked" ? "Public Beta Onboarding View Model 已阻断" : "Public Beta Onboarding View Model 仍需复核"),
        caveat:"不输出反馈发送、上传、下单、付款、出票、provider、release 或 push 入口；当前只是 RC 候选，不创建 release、不 push。"
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

  function buildGlobalShoppingPublicBetaOnboardingViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaOnboardingViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_ONBOARDING_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ONBOARDING_VIEW_MODEL_VERSION,
      status:safe.status,
      cardCount:toArray(safe.cards).length,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaOnboardingViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaOnboardingViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaOnboardingViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaOnboardingViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_ONBOARDING_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaOnboardingViewModel,
    buildGlobalShoppingPublicBetaOnboardingCards,
    buildGlobalShoppingPublicBetaOnboardingRows,
    buildGlobalShoppingOnboardingRowsForView,
    buildGlobalShoppingVisualTrialRowsForView,
    buildGlobalShoppingSafeFeedbackRowsForView,
    buildGlobalShoppingPublicBetaOnboardingViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaOnboardingViewModel
  };
})();
