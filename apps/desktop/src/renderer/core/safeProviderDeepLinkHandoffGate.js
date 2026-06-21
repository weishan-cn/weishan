;(function () {
  "use strict";

  const SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION = "2.1.40";
  const PHASE = "safe_provider_deep_link_handoff_gate_v1";
  const TRUSTED_HOSTS = ["google.com", "trip.com", "ctrip.com", "skyscanner.com", "kayak.com", "expedia.com", "booking.com"];
  const SHORT_URL_HOSTS = ["bit.ly", "t.co", "tinyurl.com", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "short.link"];
  const CREDENTIAL_PARAMS = /(api[_-]?key|apikey|token|access[_-]?token|refresh[_-]?token|secret|client[_-]?secret|authorization|password)=/i;

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function hostFromUrl(url) {
    try {
      return new URL(text(url)).hostname.toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function hasCredentialParams(value) {
    return CREDENTIAL_PARAMS.test(text(value));
  }

  function isTrustedHost(host) {
    return TRUSTED_HOSTS.some((trusted) => host === trusted || host.endsWith(`.${trusted}`));
  }

  function evaluateSafeProviderDeepLinkHandoff(candidateInput) {
    const candidate = candidateInput && typeof candidateInput === "object" ? candidateInput : {};
    const url = text(candidate.url || candidate.bookingUrl || candidate.deepLinkUrl || "");
    const host = hostFromUrl(url);
    const blockedReasons = [];
    const restrictedCategory = candidate.restrictedCategory === true || candidate.category === "restricted_provider" || candidate.category === "restricted_or_blocked";
    const safeSearchOnly = candidate.searchOnly === true || candidate.kind === "search_only" || candidate.providerKind === "search_only";

    if (!url) blockedReasons.push("missing url");
    if (url && /^http:\/\//i.test(url)) blockedReasons.push("non-https blocked");
    if (host && SHORT_URL_HOSTS.includes(host)) blockedReasons.push("short URL blocked");
    if (host && !isTrustedHost(host)) blockedReasons.push("unknown host blocked");
    if (hasCredentialParams(url) || hasCredentialParams(JSON.stringify(candidate))) blockedReasons.push("credential params blocked");
    if (restrictedCategory) blockedReasons.push("restricted category blocked");

    const allowed = blockedReasons.length === 0 && safeSearchOnly;
    const decision = allowed ? "confirmation_stub" : "blocked";

    return clone({
      version: SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION,
      gateName: PHASE,
      status: "skeleton only",
      candidateDecision: decision,
      providerConfirmationLink: "disabled",
      userConfirmationRequired: true,
      autoOpen: false,
      bookingUrl: null,
      payment: "blocked",
      checkout: "blocked",
      order: "blocked",
      identityUpload: "blocked",
      credentialParams: "blocked",
      shortUrl: "blocked",
      unknownHost: "blocked",
      restrictedCategory: "blocked",
      realProvider: "disabled",
      realNetwork: "disabled",
      trustedHosts: TRUSTED_HOSTS.slice(),
      blockedReasons: blockedReasons,
      redacted: true,
      audit: {
        eventType: "SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_DRAFT",
        version: SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION,
        gateName: PHASE,
        candidateDecision: decision,
        userConfirmationRequired: true,
        autoOpen: false,
        bookingUrlDisplayedCount: 0,
        paymentActionDisplayedCount: 0,
        orderActionDisplayedCount: 0,
        identityUploadAttemptCount: 0,
        blockedReasonCount: blockedReasons.length,
        redacted: true
      }
    });
  }

  function buildProviderDeepLinkHandoffDraft(candidateInput) {
    const gate = evaluateSafeProviderDeepLinkHandoff(candidateInput);
    return clone(Object.assign({}, gate, {
      summaryLine: gate.candidateDecision === "confirmation_stub"
        ? "只读安全候选：先确认，再手动打开可信平台。"
        : "当前链接被阻断，不允许自动打开平台。",
      confirmationButtonLabel: "确认打开可信平台",
      cancelButtonLabel: "取消"
    }));
  }

  function getSafeProviderDeepLinkHandoffGateAuditDraft(candidateInput) {
    const gate = evaluateSafeProviderDeepLinkHandoff(candidateInput || {});
    return clone(gate.audit || {
      eventType: "SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_DRAFT",
      version: SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION,
      gateName: PHASE,
      candidateDecision: gate.candidateDecision || "blocked",
      userConfirmationRequired: true,
      autoOpen: false,
      bookingUrlDisplayedCount: 0,
      paymentActionDisplayedCount: 0,
      orderActionDisplayedCount: 0,
      identityUploadAttemptCount: 0,
      blockedReasonCount: Array.isArray(gate.blockedReasons) ? gate.blockedReasons.length : 0,
      redacted: true
    });
  }

  function assertSafeProviderDeepLinkHandoffGateSafe(value) {
    const gate = value && typeof value === "object" ? value : evaluateSafeProviderDeepLinkHandoff({});
    if (gate.redacted !== true) throw new Error("safe provider deep link handoff gate must stay redacted");
    if (gate.autoOpen !== false) throw new Error("safe provider deep link handoff gate must not auto open");
    if (gate.bookingUrl !== null) throw new Error("safe provider deep link handoff gate must not expose bookingUrl");
    if (gate.payment !== "blocked" || gate.checkout !== "blocked" || gate.order !== "blocked" || gate.identityUpload !== "blocked") throw new Error("safe provider deep link handoff gate must block payment/order/identity");
    if (gate.providerConfirmationLink !== "disabled") throw new Error("provider confirmation link must stay disabled");
    const audit = gate.audit || {};
    if (audit.redacted !== true || audit.autoOpen !== false || audit.bookingUrlDisplayedCount !== 0 || audit.paymentActionDisplayedCount !== 0 || audit.orderActionDisplayedCount !== 0) throw new Error("safe provider deep link handoff gate audit must stay redacted and zeroed");
    return true;
  }

  window.WeishanSafeProviderDeepLinkHandoffGate = {
    SAFE_PROVIDER_DEEP_LINK_HANDOFF_GATE_VERSION,
    PHASE,
    evaluateSafeProviderDeepLinkHandoff,
    buildProviderDeepLinkHandoffDraft,
    getSafeProviderDeepLinkHandoffGateAuditDraft,
    assertSafeProviderDeepLinkHandoffGateSafe
  };
})();
