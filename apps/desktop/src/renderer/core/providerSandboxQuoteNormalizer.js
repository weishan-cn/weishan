;(function () {
  "use strict";

  const PROVIDER_SANDBOX_QUOTE_NORMALIZER_VERSION = "2.1.62";
  const NORMALIZER_NAME = "provider_sandbox_quote_normalizer_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (value == null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function safeJsonParse(rawResponse) {
    if (typeof rawResponse !== "string") return rawResponse;
    try {
      return JSON.parse(rawResponse);
    } catch (_) {
      return null;
    }
  }

  function hasSensitiveText(rawText) {
    return /(token|key|secret|password|session|auth|credential)/i.test(text(rawText));
  }

  function hasTransactionUrl(rawText) {
    return /"(bookingUrl|checkoutUrl|paymentUrl|orderUrl)"\s*:\s*"[^"]+"/i.test(text(rawText));
  }

  function getRegistryApi() {
    return window.WeishanMultiProviderSandboxAdapterRegistry || {};
  }

  function getTrustedRegistryApi() {
    return window.WeishanTrustedFlightSourceRegistry || {};
  }

  function getGateApi() {
    return window.WeishanSafeProviderDeepLinkHandoffGate || {};
  }

  function getProfile(providerId) {
    const registryApi = getRegistryApi();
    if (typeof registryApi.getSandboxAdapterProfile === "function") return registryApi.getSandboxAdapterProfile(providerId);
    return {
      providerId: text(providerId) || "unknown_provider",
      providerName: "Unknown provider",
      adapterType: "blocked",
      providerMode: "blocked",
      status: "blocked",
      responseShape: "unsupported",
      safeProviderHandoffUrl: null,
      safeProviderHandoffReady: false,
      capabilities: {
        importResponse: false,
        normalizeQuote: false,
        sandboxDryRun: false,
        productionApi: false,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false
      },
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    };
  }

  function detectProviderSandboxQuoteShape(rawResponse, options) {
    const raw = safeJsonParse(rawResponse);
    const safe = raw && typeof raw === "object" ? raw : {};
    const safeOptions = options && typeof options === "object" ? options : {};
    const providerId = text(safe.providerId || safeOptions.providerId || "");
    if (providerId === "trip_com_sandbox_stub" || (safe.trip && safe.price)) return "trip_com_stub_quote";
    if (providerId === "airline_official_sandbox_stub" || safe.money || safe.departOn || (safe.origin && safe.destination)) return "airline_official_stub_quote";
    if (providerId === "google_flights_search") return "no_price_reading";
    if (safe.baseFare != null || safe.taxesAndFees != null || safe.totalPrice != null) return "weishan_normalized_quote";
    return "unsupported";
  }

  function freshnessStatus(minutes) {
    const value = number(minutes);
    if (value == null) return "unknown";
    if (value < 0) return "invalid";
    if (value <= 24 * 60) return "fresh";
    return "stale";
  }

  function buildHandoffCandidate(profile, quote) {
    const trustedApi = getTrustedRegistryApi();
    const profileUrl = text(profile.safeProviderHandoffUrl || "");
    const trustedSource = profile.providerId && typeof trustedApi.getTrustedFlightSourceById === "function"
      ? trustedApi.getTrustedFlightSourceById(profile.providerId)
      : null;
    const candidateUrl = text(profileUrl || (trustedSource && trustedSource.safeProviderHandoffUrl) || "");
    const gateApi = getGateApi();
    const gateInput = {
      providerId: profile.providerId,
      providerName: profile.providerName,
      providerType: profile.adapterType === "search_handoff_only" ? "flight_search" : "flight_search",
      searchOnly: true,
      safeProviderHandoffUrl: candidateUrl || null,
      restrictedCategory: false,
      fareSource: text(quote.fareSource || "sandbox_read_only_import")
    };
    const gate = typeof gateApi.evaluateSafeProviderDeepLinkHandoff === "function"
      ? gateApi.evaluateSafeProviderDeepLinkHandoff(gateInput)
      : { providerConfirmationLink: candidateUrl ? "confirmation_required" : "disabled", safeProviderHandoffUrl: candidateUrl || null, safeProviderHandoffHost: "", autoOpen: false, bookingUrl: null, payment: "blocked", checkout: "blocked", order: "blocked", identityUpload: "blocked", redacted: true };
    const ready = gate && gate.providerConfirmationLink === "confirmation_required" && !!gate.safeProviderHandoffUrl;
    return {
      ready: ready,
      url: ready ? gate.safeProviderHandoffUrl : null,
      host: ready ? text(gate.safeProviderHandoffHost || "") : "",
      gate: gate,
      reason: ready ? "安全平台确认链接已通过检查" : "当前平台确认链接未通过安全检查"
    };
  }

  function blockedResult(reason, extra) {
    return clone(Object.assign({
      normalizerName: NORMALIZER_NAME,
      appVersion: PROVIDER_SANDBOX_QUOTE_NORMALIZER_VERSION,
      status: "blocked",
      reason: text(reason || "provider sandbox quote blocked"),
      responseShape: "unsupported",
      providerId: "",
      providerName: "",
      providerMode: "sandbox_read_only",
      fareSource: "sandbox_read_only_import",
      route: { origin: "", destination: "", display: "" },
      departureDate: "",
      currency: "",
      baseFare: null,
      taxesAndFees: null,
      providerFees: null,
      totalPrice: null,
      priceUpdatedAt: "",
      freshnessMinutes: null,
      freshnessStatus: "unknown",
      taxFeeIntegrityStatus: "incomplete",
      handoffType: "registry_gate_required",
      safeProviderHandoffReady: false,
      safeProviderHandoffUrl: null,
      safeProviderHandoffHost: "",
      handoffCandidate: null,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      rawResponseStored: false,
      sanitized: true,
      redacted: true
    }, extra || {}));
  }

  function normalizeSupportedQuote(raw, profile, responseShape, options) {
    const safe = raw && typeof raw === "object" ? raw : {};
    const safeOptions = options && typeof options === "object" ? options : {};
    let route = { origin: "", destination: "", display: "" };
    let departureDate = "";
    let currency = "";
    let baseFare = null;
    let taxesAndFees = null;
    let providerFees = 0;
    let totalPrice = null;
    let priceUpdatedAt = "";
    let freshnessMinutes = null;
    let fareSource = text(safe.fareSource || safeOptions.fareSource || "sandbox_read_only_import");
    if (responseShape === "trip_com_stub_quote") {
      route = { origin: text(safe.trip && safe.trip.from || ""), destination: text(safe.trip && safe.trip.to || ""), display: text(safe.trip && safe.trip.from || "") + " → " + text(safe.trip && safe.trip.to || "") };
      departureDate = text(safe.trip && safe.trip.date || "");
      currency = text(safe.price && safe.price.currency || "");
      baseFare = number(safe.price && safe.price.fare);
      taxesAndFees = number(safe.price && safe.price.tax);
      providerFees = number(safe.price && safe.price.serviceFee);
      totalPrice = number(safe.price && safe.price.total);
      priceUpdatedAt = text(safe.freshness && safe.freshness.updatedAt || "");
      freshnessMinutes = number(safe.freshness && safe.freshness.minutes);
    } else if (responseShape === "airline_official_stub_quote") {
      route = { origin: text(safe.origin || ""), destination: text(safe.destination || ""), display: text(safe.origin || "") + " → " + text(safe.destination || "") };
      departureDate = text(safe.departOn || "");
      currency = text(safe.money && safe.money.currency || "");
      baseFare = number(safe.money && safe.money.base);
      taxesAndFees = number(safe.money && safe.money.taxes);
      providerFees = number(safe.money && safe.money.fees);
      totalPrice = number(safe.money && safe.money.grandTotal);
      priceUpdatedAt = text(safe.updatedAt || "");
      freshnessMinutes = number(safe.freshnessMinutes);
    } else {
      route = { origin: text(safe.route && safe.route.origin || safe.origin || ""), destination: text(safe.route && safe.route.destination || safe.destination || ""), display: text(safe.route && safe.route.display || "") || ((text(safe.route && safe.route.origin || safe.origin || "")) + " → " + (text(safe.route && safe.route.destination || safe.destination || ""))) };
      departureDate = text(safe.departureDate || safe.date || "");
      currency = text(safe.currency || "");
      baseFare = number(safe.baseFare);
      taxesAndFees = number(safe.taxesAndFees);
      providerFees = number(safe.providerFees);
      totalPrice = number(safe.totalPrice);
      priceUpdatedAt = text(safe.priceUpdatedAt || safe.updatedAt || "");
      freshnessMinutes = number(safe.freshnessMinutes);
    }
    const handoff = buildHandoffCandidate(profile, {
      fareSource: fareSource
    });
    return clone({
      normalizerName: NORMALIZER_NAME,
      appVersion: PROVIDER_SANDBOX_QUOTE_NORMALIZER_VERSION,
      status: "normalized",
      providerId: text(profile.providerId),
      providerName: text(safe.providerName || profile.providerName),
      providerMode: text(profile.providerMode || "sandbox_read_only"),
      fareSource: fareSource,
      responseShape: responseShape,
      route: route,
      departureDate: departureDate,
      currency: text(currency).toUpperCase(),
      baseFare: baseFare,
      taxesAndFees: taxesAndFees,
      providerFees: providerFees == null ? 0 : providerFees,
      totalPrice: totalPrice,
      priceUpdatedAt: priceUpdatedAt,
      freshnessMinutes: freshnessMinutes == null ? 0 : freshnessMinutes,
      freshnessStatus: freshnessStatus(freshnessMinutes),
      taxFeeIntegrityStatus: baseFare != null && taxesAndFees != null && totalPrice != null && Math.abs(totalPrice - (baseFare + taxesAndFees + (providerFees == null ? 0 : providerFees))) < 0.0001 ? "complete" : "incomplete",
      handoffType: "registry_gate_required",
      safeProviderHandoffReady: handoff.ready === true,
      safeProviderHandoffUrl: handoff.ready === true ? handoff.url : null,
      safeProviderHandoffHost: handoff.ready === true ? handoff.host : "",
      handoffCandidate: clone({
        providerId: text(profile.providerId),
        providerName: text(profile.providerName),
        providerType: text(profile.adapterType === "search_handoff_only" ? "flight_search" : "flight_search"),
        handoffType: "provider_search",
        safeProviderHandoffUrl: handoff.ready === true ? handoff.url : null,
        responseShape: responseShape,
        redacted: true
      }),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      rawResponseStored: false,
      redacted: true
    });
  }

  function validateNormalizedProviderSandboxQuote(quoteInput, options) {
    const quote = quoteInput && typeof quoteInput === "object" ? quoteInput : {};
    const safeOptions = options && typeof options === "object" ? options : {};
    const reasons = [];
    const profile = getProfile(quote.providerId);
    if (profile.status === "blocked") reasons.push("unknown provider blocked");
    if (safeOptions.productionProviderEnabled === true || quote.providerMode === "production") reasons.push("production provider blocked");
    if (!["weishan_normalized_quote", "trip_com_stub_quote", "airline_official_stub_quote"].includes(text(quote.responseShape))) reasons.push("response shape unsupported");
    if (!text(quote.currency)) reasons.push("currency required");
    if (!text(quote.departureDate)) reasons.push("date required");
    const baseFare = number(quote.baseFare);
    const taxesAndFees = number(quote.taxesAndFees);
    const providerFees = quote.providerFees == null ? 0 : number(quote.providerFees);
    const totalPrice = number(quote.totalPrice);
    if (baseFare == null || taxesAndFees == null || providerFees == null || totalPrice == null || Math.abs(totalPrice - (baseFare + taxesAndFees + providerFees)) > 0.0001) reasons.push("total mismatch");
    if (hasSensitiveText(JSON.stringify(quote))) reasons.push("sensitive credential-like field detected");
    const transaction = /"(bookingUrl|checkoutUrl|paymentUrl|orderUrl)"\s*:\s*"[^"]+"/i.test(JSON.stringify(quote));
    if (transaction) reasons.push("transaction URL field detected");
    const status = reasons.length ? (reasons.some((reason) => /unknown provider blocked|production provider blocked|sensitive credential-like field detected|transaction URL field detected/.test(reason)) ? "blocked" : "rejected") : "normalized";
    return clone({
      normalizerName: NORMALIZER_NAME,
      appVersion: PROVIDER_SANDBOX_QUOTE_NORMALIZER_VERSION,
      status: status,
      reason: reasons.join("; "),
      providerId: text(quote.providerId),
      providerName: text(quote.providerName),
      providerMode: text(quote.providerMode || "sandbox_read_only"),
      fareSource: text(quote.fareSource || "sandbox_read_only_import"),
      responseShape: text(quote.responseShape || "unsupported"),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      rawResponseStored: false,
      redacted: true,
      validationReasons: reasons
    });
  }

  function normalizeProviderSandboxQuote(rawResponse, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const rawText = typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse || {});
    if (hasSensitiveText(rawText)) return blockedResult("sensitive credential-like field detected");
    if (hasTransactionUrl(rawText)) return blockedResult("transaction URL field detected");
    const raw = safeJsonParse(rawResponse);
    if (!raw || typeof raw !== "object") return blockedResult("malformed JSON safe downgrade", { status: "failed_safe" });
    const providerId = text(raw.providerId || safeOptions.providerId || "");
    const profile = getProfile(providerId);
    if (profile.status === "blocked") return blockedResult("unknown provider blocked", { providerId: profile.providerId, providerName: profile.providerName });
    if (safeOptions.productionProviderEnabled === true || profile.providerMode === "production") return blockedResult("production provider blocked", { providerId: profile.providerId, providerName: profile.providerName });
    const responseShape = text(raw.responseShape || detectProviderSandboxQuoteShape(raw, safeOptions));
    if (responseShape === "no_price_reading") return clone(Object.assign(blockedResult("provider does not expose price reading", { providerId: profile.providerId, providerName: profile.providerName, responseShape: responseShape }), { status: "rejected" }));
    if (!["weishan_normalized_quote", "trip_com_stub_quote", "airline_official_stub_quote"].includes(responseShape)) return clone(Object.assign(blockedResult("response shape unsupported", { providerId: profile.providerId, providerName: profile.providerName, responseShape: responseShape }), { status: "rejected" }));
    const normalized = normalizeSupportedQuote(raw, profile, responseShape, safeOptions);
    const validation = validateNormalizedProviderSandboxQuote(normalized, safeOptions);
    if (validation.status !== "normalized") {
      return clone(Object.assign({}, normalized, {
        status: validation.status,
        reason: validation.reason,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false,
        rawResponseStored: false,
        redacted: true
      }));
    }
    return clone(Object.assign({}, normalized, {
      status: "normalized",
      reason: "",
      rawResponseStored: false,
      redacted: true
    }));
  }

  function buildProviderSandboxQuoteNormalizerAuditDraft(input) {
    const normalized = input && input.normalizerName === NORMALIZER_NAME ? input : normalizeProviderSandboxQuote(input || {});
    return clone({
      eventType: "PROVIDER_SANDBOX_QUOTE_NORMALIZER_AUDIT_DRAFT",
      normalizerName: NORMALIZER_NAME,
      appVersion: PROVIDER_SANDBOX_QUOTE_NORMALIZER_VERSION,
      status: text(normalized.status || "failed_safe"),
      providerId: text(normalized.providerId || ""),
      providerName: text(normalized.providerName || ""),
      providerMode: text(normalized.providerMode || "sandbox_read_only"),
      fareSource: text(normalized.fareSource || "sandbox_read_only_import"),
      responseShape: text(normalized.responseShape || "unsupported"),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      rawResponseStored: false,
      redacted: true
    });
  }

  window.WeishanProviderSandboxQuoteNormalizer = {
    PROVIDER_SANDBOX_QUOTE_NORMALIZER_VERSION,
    NORMALIZER_NAME,
    detectProviderSandboxQuoteShape,
    normalizeProviderSandboxQuote,
    validateNormalizedProviderSandboxQuote,
    buildProviderSandboxQuoteNormalizerAuditDraft
  };
})();
