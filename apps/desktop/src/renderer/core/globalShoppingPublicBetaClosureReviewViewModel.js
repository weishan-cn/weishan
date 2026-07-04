;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_REVIEW_VIEW_MODEL_VERSION = "4.1.9";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_closure_review_view_model_v1";

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

  function buildGlobalShoppingPublicBetaClosureReviewCards(input) {
    const safe = obj(input);
    return clone([
      card("public_beta_acceptance_review_console", "Public Beta Acceptance Review Console", text(obj(safe.publicBetaAcceptanceReviewConsoleSummary.userFacingSummary).resultLabel || "Public Beta Acceptance Review Console 仍需复核")),
      card("offline_trial_closure_board", "Offline Trial Closure Board", text(obj(safe.offlineTrialClosureBoardSummary.userFacingSummary).resultLabel || "Offline Trial Closure Board 仍需复核")),
      card("no_launch_assurance_gate", "No-Launch Assurance Gate", text(obj(safe.noLaunchAssuranceGateSummary.userFacingSummary).resultLabel || "No-Launch Assurance Gate 仍需复核")),
      card("acceptance_review", "Acceptance Review", "当前不发布、不创建 release、不 push"),
      card("trial_closure", "Trial Closure", "试用闭环仅为离线视图，不关闭真实任务"),
      card("no_launch", "No Launch", "仍不允许启用 provider、付款、下单或发布")
    ]);
  }

  function buildGlobalShoppingAcceptanceReviewRowsForView(input) {
    const summary = obj(input && input.publicBetaAcceptanceReviewConsoleSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingTrialClosureRowsForView(input) {
    const summary = obj(input && input.offlineTrialClosureBoardSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingNoLaunchRowsForView(input) {
    const summary = obj(input && input.noLaunchAssuranceGateSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingPublicBetaClosureReviewRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_closure_review_console", "Public Beta Acceptance Review Console", text(obj(safe.publicBetaAcceptanceReviewConsoleSummary.userFacingSummary).resultLabel || "Public Beta Acceptance Review Console 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_closure_review_board", "Offline Trial Closure Board", text(obj(safe.offlineTrialClosureBoardSummary.userFacingSummary).resultLabel || "Offline Trial Closure Board 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_closure_review_gate", "No-Launch Assurance Gate", text(obj(safe.noLaunchAssuranceGateSummary.userFacingSummary).resultLabel || "No-Launch Assurance Gate 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_closure_review_acceptance", "Acceptance Review", "当前不发布、不创建 release、不 push", "warning"),
      row("public_beta_closure_review_trial", "Trial Closure", "试用闭环仅为离线视图，不关闭真实任务", "warning"),
      row("public_beta_closure_review_no_launch", "No Launch", "仍不允许启用 provider、付款、下单或发布", "warning"),
      row("public_beta_closure_review_manual", "Manual Review Required", "验收复核后仍需人工决定下一阶段", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaClosureReviewViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaAcceptanceReviewConsoleSummary = resolveSummary(safe, "publicBetaAcceptanceReviewConsoleSummary", "WeishanGlobalShoppingPublicBetaAcceptanceReviewConsole", "buildGlobalShoppingPublicBetaAcceptanceReviewConsole");
    const offlineTrialClosureBoardSummary = resolveSummary(safe, "offlineTrialClosureBoardSummary", "WeishanGlobalShoppingOfflineTrialClosureBoard", "buildGlobalShoppingOfflineTrialClosureBoard");
    const noLaunchAssuranceGateSummary = resolveSummary(safe, "noLaunchAssuranceGateSummary", "WeishanGlobalShoppingNoLaunchAssuranceGate", "buildGlobalShoppingNoLaunchAssuranceGate");
    const acceptanceStatus = normalizeStatus(obj(publicBetaAcceptanceReviewConsoleSummary).acceptanceReviewStatus || obj(publicBetaAcceptanceReviewConsoleSummary).status, "needs_review");
    const trialClosureStatus = normalizeStatus(obj(offlineTrialClosureBoardSummary).closureStatus || obj(offlineTrialClosureBoardSummary).status, "needs_review");
    const noLaunchStatus = normalizeStatus(obj(noLaunchAssuranceGateSummary).status, "needs_review");
    const missingRequired = !present(publicBetaAcceptanceReviewConsoleSummary) || !present(offlineTrialClosureBoardSummary) || !present(noLaunchAssuranceGateSummary);
    const status = acceptanceStatus === "blocked" || trialClosureStatus === "blocked" || noLaunchStatus === "blocked"
      ? "blocked"
      : (missingRequired || noLaunchStatus !== "ready" || (acceptanceStatus !== "manual_review_required" && acceptanceStatus !== "ready") || (trialClosureStatus !== "manual_review_required" && trialClosureStatus !== "ready") ? "needs_review" : "ready");

    const result = {
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Acceptance Review Console",
      subtitle:"Offline Trial Closure Board",
      publicBetaAcceptanceReviewConsoleSummary:publicBetaAcceptanceReviewConsoleSummary,
      offlineTrialClosureBoardSummary:offlineTrialClosureBoardSummary,
      noLaunchAssuranceGateSummary:noLaunchAssuranceGateSummary,
      cards:[],
      rows:[],
      acceptanceReviewRows:buildGlobalShoppingAcceptanceReviewRowsForView({ publicBetaAcceptanceReviewConsoleSummary:publicBetaAcceptanceReviewConsoleSummary }),
      trialClosureRows:buildGlobalShoppingTrialClosureRowsForView({ offlineTrialClosureBoardSummary:offlineTrialClosureBoardSummary }),
      noLaunchRows:buildGlobalShoppingNoLaunchRowsForView({ noLaunchAssuranceGateSummary:noLaunchAssuranceGateSummary }),
      manualReviewRequired:true,
      safeToProceedWithManualClosureReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Closure Review View Model",
        resultLabel:status === "ready" ? "Public Beta Acceptance Review Console / Offline Trial Closure Board / No-Launch Assurance Gate 已准备" : (status === "blocked" ? "Public Beta Closure Review View Model 已阻断" : "Public Beta Closure Review View Model 仍需复核"),
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
    result.cards = buildGlobalShoppingPublicBetaClosureReviewCards(result);
    result.rows = buildGlobalShoppingPublicBetaClosureReviewRows(result);
    return clone(result);
  }

  function buildGlobalShoppingPublicBetaClosureReviewViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaClosureReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_REVIEW_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualClosureReview:safe.safeToProceedWithManualClosureReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaClosureReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaClosureReviewViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaClosureReviewViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaClosureReviewViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaClosureReviewViewModel,
    buildGlobalShoppingPublicBetaClosureReviewCards,
    buildGlobalShoppingPublicBetaClosureReviewRows,
    buildGlobalShoppingAcceptanceReviewRowsForView,
    buildGlobalShoppingTrialClosureRowsForView,
    buildGlobalShoppingNoLaunchRowsForView,
    buildGlobalShoppingPublicBetaClosureReviewViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaClosureReviewViewModel
  };
})();
