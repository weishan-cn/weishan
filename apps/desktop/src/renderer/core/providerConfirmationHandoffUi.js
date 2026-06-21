;(function () {
  "use strict";

  const PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION = "2.1.40";
  const PHASE = "provider_confirmation_handoff_ui_stub";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildProviderConfirmationHandoffUiModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      version: PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION,
      phase: PHASE,
      title: "前往平台确认",
      status: "stub only",
      summary: "只提供确认骨架，不自动打开平台、不付款、不下单。",
      candidateDecision: text(safe.candidateDecision || "confirmation_stub"),
      continueButtonDisabled: true,
      cancelButtonEnabled: true,
      noAutoOpen: true,
      noBookingUrl: true,
      bookingUrl: null,
      noPayment: true,
      noOrder: true,
      noIdentityUpload: true,
      showInMainFlow: false,
      redacted: true
    });
  }

  function buildProviderConfirmationSummary(input) {
    const ui = buildProviderConfirmationHandoffUiModel(input);
    return clone({
      version: PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION,
      phase: PHASE,
      title: ui.title,
      summary: ui.summary,
      status: ui.status,
      continueButtonDisabled: ui.continueButtonDisabled,
      cancelButtonEnabled: ui.cancelButtonEnabled,
      noAutoOpen: ui.noAutoOpen,
      noBookingUrl: ui.noBookingUrl,
      noPayment: ui.noPayment,
      noOrder: ui.noOrder,
      noIdentityUpload: ui.noIdentityUpload,
      redacted: true
    });
  }

  function getProviderConfirmationHandoffUiAuditDraft(input) {
    const ui = buildProviderConfirmationHandoffUiModel(input);
    return clone({
      eventType: "PROVIDER_CONFIRMATION_HANDOFF_UI_DRAFT",
      version: PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION,
      phase: PHASE,
      continueButtonDisabled: ui.continueButtonDisabled,
      cancelButtonEnabled: ui.cancelButtonEnabled,
      noAutoOpen: ui.noAutoOpen,
      noBookingUrl: ui.noBookingUrl,
      noPayment: ui.noPayment,
      noOrder: ui.noOrder,
      noIdentityUpload: ui.noIdentityUpload,
      redacted: true
    });
  }

  function assertProviderConfirmationHandoffUiSafe(value) {
    const ui = value && typeof value === "object" ? value : buildProviderConfirmationHandoffUiModel({});
    if (ui.redacted !== true) throw new Error("provider confirmation handoff ui must stay redacted");
    if (ui.continueButtonDisabled !== true) throw new Error("provider confirmation continue button must stay disabled");
    if (ui.cancelButtonEnabled !== true) throw new Error("provider confirmation cancel button must stay enabled");
    if (ui.noAutoOpen !== true || ui.noBookingUrl !== true || ui.noPayment !== true || ui.noOrder !== true || ui.noIdentityUpload !== true) throw new Error("provider confirmation handoff ui must keep all unsafe actions disabled");
    return true;
  }

  window.WeishanProviderConfirmationHandoffUi = {
    PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION,
    PHASE,
    buildProviderConfirmationHandoffUiModel,
    buildProviderConfirmationSummary,
    getProviderConfirmationHandoffUiAuditDraft,
    assertProviderConfirmationHandoffUiSafe
  };
})();
