;(function () {
  "use strict";

  const REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION = "2.4.1";
  const SLOT_NAME = "real_flight_price_provider_adapter_slot_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeProviderMode(providerMode) {
    const mode = text(providerMode || "fixture");
    if (mode === "sandbox" || mode === "sandbox_read_only") return "sandbox_read_only";
    if (mode === "production" || mode === "production_disabled") return "production_disabled";
    return "fixture";
  }

  function getConnectorApi() {
    return window.WeishanSingleFlightProviderSandboxConnector || {};
  }

  function fallbackConnectorStatus(options) {
    const mode = normalizeProviderMode(options && (options.providerMode || options.mode));
    const production = mode === "production_disabled";
    return {
      connectorName:"single_flight_provider_sandbox_connector_v1",
      appVersion:REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION,
      providerId: options && options.providerId || "google_flights_search",
      providerName:"Google Flights",
      providerMode:mode,
      status: production ? "disabled" : (mode === "fixture" ? "fixture_ready" : "disabled"),
      decision: production ? "production_disabled" : (mode === "fixture" ? "fixture_read_only_ready" : "disabled_missing_sandbox_dry_run"),
      reason: production ? "production provider disabled" : "fixture read-only evidence ready",
      networkAllowed:false,
      productionProviderEnabled:false,
      readOnly:true,
      booking:false,
      payment:false,
      order:false,
      identityUpload:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      redacted:true
    };
  }

  function connectorOptions(options) {
    const safe = options && typeof options === "object" ? options : {};
    return {
      providerId: safe.providerId || "google_flights_search",
      providerMode: normalizeProviderMode(safe.providerMode || safe.mode),
      sandboxDryRunEnabled: safe.sandboxDryRunEnabled === true || safe.dryRunEnabled === true,
      dryRunEnabled: safe.dryRunEnabled === true,
      hasSecureCredentialReference: safe.hasSecureCredentialReference === true,
      networkDryRunAllowed: safe.networkDryRunAllowed === true,
      restrictedCategoryDecision: safe.restrictedCategoryDecision || "allow",
      restrictedCategory: safe.restrictedCategory === true
    };
  }

  function getConnectorStatus(options) {
    const api = getConnectorApi();
    if (typeof api.evaluateSingleFlightProviderSandboxReadiness === "function") return api.evaluateSingleFlightProviderSandboxReadiness(connectorOptions(options));
    return fallbackConnectorStatus(connectorOptions(options));
  }

  function createRealFlightPriceProviderAdapterSlot(options) {
    const connector = getConnectorStatus(options);
    const canFetchQuote = connector.status === "fixture_ready" || connector.status === "sandbox_ready";
    return clone({
      slotName: SLOT_NAME,
      version: REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION,
      providerMode: connector.providerMode,
      status: canFetchQuote ? "allowed" : connector.status === "blocked" ? "blocked" : "disabled",
      decision: connector.decision,
      reason: connector.reason,
      readOnly: true,
      networkAllowed: connector.networkAllowed === true,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      providerId: connector.providerId,
      providerName: connector.providerName,
      fareSource: connector.providerMode === "sandbox_read_only" ? "sandbox_read_only_stub" : "fixture_read_only",
      handoffType: "registry_gate_required",
      canFetchQuote: canFetchQuote,
      providerConnector: connector,
      redacted: true
    });
  }

  function fetchRealFlightPriceReadOnlyQuote(request, options) {
    const api = getConnectorApi();
    const safeOptions = connectorOptions(options);
    const quote = typeof api.fetchSingleFlightProviderSandboxQuote === "function"
      ? api.fetchSingleFlightProviderSandboxQuote(request, safeOptions)
      : null;
    const slot = createRealFlightPriceProviderAdapterSlot(safeOptions);
    const normalized = quote || {
      status: slot.canFetchQuote ? "fixture_ready" : slot.decision,
      providerId: slot.providerId,
      providerName: slot.providerName,
      providerMode: slot.providerMode,
      fareSource: slot.fareSource,
      handoffType: "registry_gate_required",
      route: "上海 -> 成都",
      departureDate: "2026-07-15",
      tripType: "one_way",
      passengerCount: 1,
      cabinClass: "economy",
      directOnly: false,
      sortIntent: "低价优先",
      currency: "CNY",
      baseFare: 860,
      taxesAndFees: 110,
      providerFees: 40,
      totalPrice: 1010,
      priceUpdatedAt: "2026-06-20T00:00:00.000Z",
      freshnessMinutes: 120,
      freshnessStatus: "fresh",
      taxFeeIntegrityStatus: "complete",
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      booking:false,
      payment:false,
      order:false,
      identityUpload:false,
      autoOpen:false,
      redacted:true
    };
    normalized.providerConnector = slot.providerConnector;
    normalized.bookingUrl = null;
    normalized.checkoutUrl = null;
    normalized.paymentUrl = null;
    normalized.orderUrl = null;
    normalized.booking = false;
    normalized.payment = false;
    normalized.order = false;
    normalized.identityUpload = false;
    normalized.autoOpen = false;
    return clone(normalized);
  }

  function getRealFlightPriceProviderAdapterSlotStatus(options) {
    return createRealFlightPriceProviderAdapterSlot(options);
  }

  function assertRealFlightPriceProviderAdapterSlotSafe(value) {
    const slot = value && typeof value === "object" ? value : createRealFlightPriceProviderAdapterSlot({});
    if (slot.redacted !== true) throw new Error("real flight price provider adapter slot must stay redacted");
    if (slot.readOnly !== true) throw new Error("real flight price provider adapter slot must stay read only");
    if (slot.booking !== false || slot.payment !== false || slot.order !== false || slot.identityUpload !== false) throw new Error("real flight price provider adapter slot must block unsafe actions");
    if (slot.bookingUrl !== null || slot.checkoutUrl !== null || slot.paymentUrl !== null || slot.orderUrl !== null) throw new Error("real flight price provider adapter slot must keep external action urls null");
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
