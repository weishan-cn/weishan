;(function () {
  "use strict";

  const PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION = "4.2.4";
  const PHASE = "provider_confirmation_handoff_ui_stub";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function buildProviderConfirmationHandoffUiModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    const safeProviderHandoffUrl = text(safe.safeProviderHandoffUrl || "");
    const allowed = !!safeProviderHandoffUrl && safe.providerConfirmationLink !== "disabled";
    return clone({
      version: PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION,
      phase: PHASE,
      title: "前往平台确认",
      status: allowed ? "confirmation_required" : "blocked",
      summary: allowed
        ? "只允许确认后打开可信平台确认页，不自动打开、不付款、不下单。"
        : "当前平台确认链接未通过安全检查，不能打开平台确认页。",
      candidateDecision: text(safe.candidateDecision || (allowed ? "safe_provider_handoff_ready" : "blocked")),
      providerConfirmationLink: allowed ? "confirmation_required" : "disabled",
      safeProviderHandoffUrl: safeProviderHandoffUrl || null,
      continueButtonDisabled: !allowed,
      cancelButtonEnabled: true,
      confirmButtonLabel: "确认打开可信平台确认页",
      cancelButtonLabel: "取消",
      noAutoOpen: true,
      noBookingUrl: true,
      bookingUrl: null,
      noPayment: true,
      noOrder: true,
      noIdentityUpload: true,
      showInMainFlow: false,
      openExternalRequested: false,
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
      candidateDecision: ui.candidateDecision,
      providerConfirmationLink: ui.providerConfirmationLink,
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

  function renderProviderConfirmationHandoffHtml(input) {
    const ui = buildProviderConfirmationHandoffUiModel(input);
    const safe = text(ui.safeProviderHandoffUrl || "");
    const host = safe ? (() => {
      try { return new URL(safe).hostname; } catch (_) { return ""; }
    })() : "";
    return `<section class="commerce-provider-confirmation-handoff-ui" aria-label="Safe Provider Handoff">
      <h5>${escapeHtml(ui.title || "前往平台确认")}</h5>
      <p>${escapeHtml(ui.summary || "只允许确认后打开可信平台确认页，不自动打开、不付款、不下单。")}</p>
      <p>当前状态：${escapeHtml(ui.status || "blocked")}</p>
      <p>candidateDecision：${escapeHtml(ui.candidateDecision || "blocked")}</p>
      <p>可信域名：${escapeHtml(host || "google.com / trip.com / ctrip.com / skyscanner.com / kayak.com / expedia.com / booking.com")}</p>
      <p>safe provider handoff url：confirmation only</p>
      <section data-commerce-safe-provider-confirmation-checklist="true"><h6>前往平台确认前检查</h6><p>将打开外部可信平台页面</p><p>唯珊不会付款、不会下单</p><p>唯珊不会上传证件或银行卡</p><p>价格、库存、税费和规则以平台页面为准</p><p>平台确认链接已通过安全检查</p></section>
      <p>bookingUrl：null</p>
      <p>payment：blocked</p>
      <p>order：blocked</p>
      <p>identityUpload：blocked</p>
      <div class="commerce-provider-confirmation-handoff-actions">
        <button type="button" class="cmd-btn primary" data-commerce-safe-provider-handoff-confirm="${ui.continueButtonDisabled ? "false" : "true"}" ${ui.continueButtonDisabled ? "disabled" : ""}>${escapeHtml("继续前往平台")}</button>
        <button type="button" class="cmd-btn gray" data-commerce-safe-provider-handoff-cancel="true">${escapeHtml(ui.cancelButtonLabel || "取消")}</button>
      </div>
    </section>`;
  }

  function getProviderConfirmationHandoffUiAuditDraft(input) {
    const ui = buildProviderConfirmationHandoffUiModel(input);
    return clone({
      eventType: "PROVIDER_CONFIRMATION_HANDOFF_UI_DRAFT",
      version: PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION,
      phase: PHASE,
      candidateDecision: ui.candidateDecision,
      providerConfirmationLink: ui.providerConfirmationLink,
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
    if (ui.noAutoOpen !== true || ui.noBookingUrl !== true || ui.noPayment !== true || ui.noOrder !== true || ui.noIdentityUpload !== true) throw new Error("provider confirmation handoff ui must keep all unsafe actions disabled");
    if (ui.bookingUrl !== null) throw new Error("provider confirmation handoff ui must not expose bookingUrl");
    if (ui.continueButtonDisabled !== true && ui.continueButtonDisabled !== false) throw new Error("provider confirmation continue button must be boolean");
    if (ui.cancelButtonEnabled !== true) throw new Error("provider confirmation cancel button must stay enabled");
    if (ui.status !== "confirmation_required" && ui.status !== "blocked") throw new Error("provider confirmation status must stay confirmation_required or blocked");
    return true;
  }

  window.WeishanProviderConfirmationHandoffUi = {
    PROVIDER_CONFIRMATION_HANDOFF_UI_VERSION,
    PHASE,
    buildProviderConfirmationHandoffUiModel,
    buildProviderConfirmationSummary,
    renderProviderConfirmationHandoffHtml,
    getProviderConfirmationHandoffUiAuditDraft,
    assertProviderConfirmationHandoffUiSafe
  };
})();
