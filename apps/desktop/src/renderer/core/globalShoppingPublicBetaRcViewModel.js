;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_RC_VIEW_MODEL_VERSION = "4.1.9";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_rc_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
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

  function buildGlobalShoppingRcConsoleRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaRcConsoleSummary", "WeishanGlobalShoppingPublicBetaRcConsole", "buildGlobalShoppingPublicBetaRcConsole");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_rc_console_missing", "Public Beta RC Console", "Public Beta RC Console 仍需复核", "warning")];
  }

  function buildGlobalShoppingOfflineTrialGateRowsForView(input) {
    const summary = resolveSummary(input, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("offline_trial_release_gate_missing", "Offline Trial Release Gate", "Offline Trial Release Gate 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaRcCards(input) {
    const safe = obj(input);
    const rcConsoleSummary = resolveSummary(safe, "publicBetaRcConsoleSummary", "WeishanGlobalShoppingPublicBetaRcConsole", "buildGlobalShoppingPublicBetaRcConsole");
    const gateSummary = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    return clone([
      card("public_beta_rc_console", "Public Beta RC Console", text(obj(rcConsoleSummary.userFacingSummary).resultLabel || "Public Beta RC Console 仍需复核")),
      card("offline_trial_release_gate", "Offline Trial Release Gate", text(obj(gateSummary.userFacingSummary).resultLabel || "Offline Trial Release Gate 仍需复核")),
      card("manual_review_required", "Manual Review Required", "人工复核通过后才能进入下一阶段"),
      card("no_release_mutation", "No Release Mutation", "当前只是 RC 候选，不创建 release、不 push"),
      card("no_transaction", "No Transaction", "仍然不接真实 provider、不联网、不启用交易"),
      card("no_provider", "No Provider", "不接真实 provider"),
      card("no_external_open", "No External Open", "不打开外部平台")
    ]);
  }

  function buildGlobalShoppingPublicBetaRcRows(input) {
    const safe = obj(input);
    const status = text(safe.status || "needs_review");
    return clone([
      row("public_beta_rc_view_model_status", "Public Beta RC View Model", status === "ready" ? "Public Beta RC View Model 已准备" : (status === "blocked" ? "Public Beta RC View Model 已阻断" : "Public Beta RC View Model 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_rc_view_model_release", "No Release Mutation", "当前只是 RC 候选，不创建 release、不 push", "warning"),
      row("public_beta_rc_view_model_transaction", "No Transaction", "仍然不接真实 provider、不联网、不启用交易", "warning"),
      row("public_beta_rc_view_model_manual_review", "Manual Review Required", "人工复核通过后才能进入下一阶段", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaRcViewModel(viewModel) {
    const safe = obj(viewModel);
    const hasProvidedRcConsoleSummary = present(safe.publicBetaRcConsoleSummary);
    const hasProvidedOfflineTrialReleaseGateSummary = present(safe.offlineTrialReleaseGateSummary);
    const publicBetaRcConsoleSummary = resolveSummary(safe, "publicBetaRcConsoleSummary", "WeishanGlobalShoppingPublicBetaRcConsole", "buildGlobalShoppingPublicBetaRcConsole");
    const offlineTrialReleaseGateSummary = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    const missingRequired = !hasProvidedRcConsoleSummary || !hasProvidedOfflineTrialReleaseGateSummary;
    const blocked = text(publicBetaRcConsoleSummary.status) === "blocked" || text(offlineTrialReleaseGateSummary.status) === "blocked";
    const ready = text(publicBetaRcConsoleSummary.status) === "manual_review_required" && text(offlineTrialReleaseGateSummary.status) === "ready";
    const status = blocked ? "blocked" : (missingRequired || !ready ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_RC_VIEW_MODEL_VERSION,
      status,
      title:"Public Beta RC Console",
      subtitle:"Offline Trial Release Gate",
      cards:buildGlobalShoppingPublicBetaRcCards({
        publicBetaRcConsoleSummary:publicBetaRcConsoleSummary,
        offlineTrialReleaseGateSummary:offlineTrialReleaseGateSummary
      }),
      rows:buildGlobalShoppingPublicBetaRcRows({ status }),
      rcConsoleRows:buildGlobalShoppingRcConsoleRowsForView({ publicBetaRcConsoleSummary:publicBetaRcConsoleSummary }),
      offlineTrialGateRows:buildGlobalShoppingOfflineTrialGateRowsForView({ offlineTrialReleaseGateSummary:offlineTrialReleaseGateSummary }),
      publicBetaRcConsoleSummary:publicBetaRcConsoleSummary,
      offlineTrialReleaseGateSummary:offlineTrialReleaseGateSummary,
      manualReviewRequired:true,
      safeToProceedWithManualRcReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta RC Console",
        resultLabel:status === "ready" ? "Public Beta RC Console / Offline Trial Release Gate 已准备" : (status === "blocked" ? "Public Beta RC View Model 已阻断" : "Public Beta RC View Model 仍需复核"),
        caveat:"不输出发布、push、tag、provider、付款、下单、出票入口。"
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

  function buildGlobalShoppingPublicBetaRcViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaRcViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_RC_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_RC_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualRcReview:safe.safeToProceedWithManualRcReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaRcViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaRcViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaRcViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaRcViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_RC_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaRcViewModel,
    buildGlobalShoppingPublicBetaRcCards,
    buildGlobalShoppingPublicBetaRcRows,
    buildGlobalShoppingRcConsoleRowsForView,
    buildGlobalShoppingOfflineTrialGateRowsForView,
    buildGlobalShoppingPublicBetaRcViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaRcViewModel
  };
})();
