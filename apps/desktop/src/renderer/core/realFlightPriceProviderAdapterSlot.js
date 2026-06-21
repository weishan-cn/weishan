;(function () {
  "use strict";

  const REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION = "2.1.43";
  const SLOT_NAME = "real_flight_price_provider_adapter_slot_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function buildSafeProviderHandoffCandidate(request) {
    const gateApi = window.WeishanSafeProviderDeepLinkHandoffGate || {};
    const providerId = "google_flights_search";
    const candidate = {
      providerId: providerId,
      providerName: "Google Flights",
      providerType: "flight_search",
      searchOnly: true,
      safeProviderHandoffUrl: "https://www.google.com/travel/flights",
      restrictedCategory: false
    };
    if (typeof gateApi.evaluateSafeProviderDeepLinkHandoff === "function") {
      return gateApi.evaluateSafeProviderDeepLinkHandoff(candidate);
    }
    return clone({
      version: REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION,
      status: "confirmation_required",
      candidateDecision: "safe_provider_handoff_ready",
      providerConfirmationLink: "confirmation_required",
      safeProviderHandoffUrl: candidate.safeProviderHandoffUrl,
      safeProviderHandoffHost: "google.com",
      userConfirmationRequired: true,
      autoOpen: false,
      bookingUrl: null,
      payment: "blocked",
      checkout: "blocked",
      order: "blocked",
      identityUpload: "blocked",
      realProvider: "disabled",
      realNetwork: "disabled",
      redacted: true
    });
  }

  function normalizeRequest(request) {
    const safe = request && typeof request === "object" ? request : {};
    return {
      origin: text(safe.origin || "上海"),
      destination: text(safe.destination || "成都"),
      departureDate: text(safe.departureDate || "2026-07-15"),
      tripType: text(safe.tripType || "one_way"),
      passengerCount: number(safe.passengerCount) || 1,
      cabinClass: text(safe.cabinClass || "economy"),
      directOnly: safe.directOnly === true,
      sortIntent: text(safe.sortIntent || "低价优先"),
      restrictedCategoryDecision: text(safe.restrictedCategoryDecision || "allow"),
      providerMode: text(safe.providerMode || "fixture"),
      hasSecureCredentialReference: safe.hasSecureCredentialReference === true,
      dryRunEnabled: safe.dryRunEnabled === true,
      redacted: true
    };
  }

  function buildFixtureQuote(request, options) {
    const safeRequest = normalizeRequest(request);
    const safeOptions = options && typeof options === "object" ? options : {};
    const providerMode = text(safeOptions.providerMode || safeRequest.providerMode || "fixture") === "sandbox" && safeRequest.dryRunEnabled === true ? "sandbox" : "fixture";
    const route = `${safeRequest.origin} -> ${safeRequest.destination}`;
    return clone({
      providerId: providerMode === "sandbox" ? "real_flight_sandbox" : "real_flight_fixture",
      providerName: providerMode === "sandbox" ? "Real Flight Sandbox" : "Real Flight Fixture",
      providerMode: providerMode,
      fareSource: providerMode === "sandbox" ? "sandbox_read_only" : "fixture_read_only",
      route: route,
      departureDate: safeRequest.departureDate,
      tripType: safeRequest.tripType,
      passengerCount: safeRequest.passengerCount,
      cabinClass: safeRequest.cabinClass,
      directOnly: safeRequest.directOnly,
      sortIntent: safeRequest.sortIntent,
      currency: "CNY",
      baseFare: 860,
      taxesAndFees: 110,
      providerFees: 40,
      totalPrice: 1010,
      priceUpdatedAt: "2026-06-20T00:00:00.000Z",
      freshnessMinutes: 120,
      freshnessStatus: "fresh",
      taxFeeIntegrityStatus: "complete",
      handoffCandidate: buildSafeProviderHandoffCandidate(safeRequest),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function createRealFlightPriceProviderAdapterSlot(options) {
    const safe = options && typeof options === "object" ? options : {};
    const providerMode = text(safe.providerMode || "fixture") === "sandbox" ? "sandbox" : (text(safe.providerMode || "fixture") === "production" ? "production_disabled" : "fixture");
    const status = providerMode === "sandbox"
      ? (safe.dryRunEnabled === true && safe.hasSecureCredentialReference === true ? "allowed" : "disabled")
      : (providerMode === "production_disabled" ? "disabled" : "allowed");
    return clone({
      slotName: SLOT_NAME,
      version: REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION,
      providerMode: providerMode,
      status: status,
      readOnly: true,
      networkAllowed: false,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      providerId: providerMode === "sandbox" ? "real_flight_sandbox" : "real_flight_fixture",
      providerName: providerMode === "sandbox" ? "Real Flight Sandbox" : "Real Flight Fixture",
      fareSource: providerMode === "sandbox" ? "sandbox_read_only" : "fixture_read_only",
      canFetchQuote: status === "allowed",
      redacted: true
    });
  }

  function fetchRealFlightPriceReadOnlyQuote(request, options) {
    const slot = createRealFlightPriceProviderAdapterSlot(options);
    if (slot.status !== "allowed") {
      return clone({
        providerId: slot.providerId,
        providerName: slot.providerName,
        providerMode: slot.providerMode,
        fareSource: slot.fareSource,
        route: `${normalizeRequest(request).origin} -> ${normalizeRequest(request).destination}`,
        departureDate: normalizeRequest(request).departureDate,
        tripType: normalizeRequest(request).tripType,
        passengerCount: normalizeRequest(request).passengerCount,
        cabinClass: normalizeRequest(request).cabinClass,
        directOnly: normalizeRequest(request).directOnly,
        sortIntent: normalizeRequest(request).sortIntent,
        currency: "CNY",
        baseFare: 860,
        taxesAndFees: 110,
        providerFees: 40,
        totalPrice: 1010,
        priceUpdatedAt: "2026-06-20T00:00:00.000Z",
        freshnessMinutes: 120,
        freshnessStatus: "fresh",
        taxFeeIntegrityStatus: "complete",
        handoffCandidate: buildSafeProviderHandoffCandidate(request),
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true,
        disabledReason: slot.providerMode === "sandbox" ? "missing secure credential reference or dry-run flag" : "fixture only"
      });
    }
    return buildFixtureQuote(request, options);
  }

  function getRealFlightPriceProviderAdapterSlotStatus(options) {
    return createRealFlightPriceProviderAdapterSlot(options);
  }

  function assertRealFlightPriceProviderAdapterSlotSafe(value) {
    const slot = value && typeof value === "object" ? value : createRealFlightPriceProviderAdapterSlot({});
    if (slot.redacted !== true) throw new Error("real flight price provider adapter slot must stay redacted");
    if (slot.readOnly !== true) throw new Error("real flight price provider adapter slot must stay read only");
    if (slot.booking !== false || slot.payment !== false || slot.order !== false || slot.identityUpload !== false) throw new Error("real flight price provider adapter slot must block booking/payment/order/identity upload");
    return true;
  }

  window.WeishanRealFlightPriceProviderAdapterSlot = {
    REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION,
    SLOT_NAME,
    createRealFlightPriceProviderAdapterSlot,
    fetchRealFlightPriceReadOnlyQuote,
    getRealFlightPriceProviderAdapterSlotStatus,
    assertRealFlightPriceProviderAdapterSlotSafe
  };
})();
