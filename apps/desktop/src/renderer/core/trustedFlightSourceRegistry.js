;(function () {
  "use strict";

  const TRUSTED_FLIGHT_SOURCE_REGISTRY_VERSION = "2.1.40";
  const PHASE = "trusted_flight_source_registry_skeleton_only";

  const TRUSTED_SOURCES = [
    {
      providerId: "google_flights_search",
      providerName: "Google Flights",
      providerType: "flight_search",
      accessMode: "manual_search_only"
    },
    {
      providerId: "trip_com_ctrip_search",
      providerName: "Trip.com / 携程",
      providerType: "flight_search",
      accessMode: "manual_search_only"
    },
    {
      providerId: "trusted_flight_fixture",
      providerName: "Trusted Flight Fixture",
      providerType: "fixture",
      accessMode: "fixture_only"
    }
  ];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildTrustedFlightSource(source) {
    const safe = source && typeof source === "object" ? source : {};
    return clone({
      providerId: text(safe.providerId),
      providerName: text(safe.providerName),
      providerType: text(safe.providerType),
      accessMode: text(safe.accessMode),
      productionProvider: "disabled",
      canUseNetwork: false,
      canUseApiKey: false,
      canSaveApiKey: false,
      canReadApiKey: false,
      canConnectEndpoint: false,
      bookingUrl: false,
      payment: false,
      order: false,
      identityUpload: false,
      realProvider: false,
      redacted: true
    });
  }

  function getTrustedFlightSourceRegistry() {
    return clone({
      version: TRUSTED_FLIGHT_SOURCE_REGISTRY_VERSION,
      phase: PHASE,
      status: "skeleton only",
      productionProvider: "disabled",
      canUseNetwork: false,
      canUseApiKey: false,
      canConnectEndpoint: false,
      canReturnBookingUrl: false,
      canPay: false,
      canCreateOrder: false,
      canUploadIdentity: false,
      unknownProvider: "blocked",
      trustedSources: TRUSTED_SOURCES.map(buildTrustedFlightSource),
      redacted: true
    });
  }

  function getTrustedFlightSourceById(providerId) {
    const id = text(providerId);
    const registry = getTrustedFlightSourceRegistry();
    const match = registry.trustedSources.find(function (item) {
      return item.providerId === id;
    });
    if (match) {
      return clone(Object.assign({
        status: match.accessMode,
        readinessDecision: match.accessMode,
        sourceBlocked: false,
        unknownProviderBlocked: false,
        bookingUrl: false,
        payment: false,
        order: false,
        identityUpload: false
      }, match));
    }
    return clone({
      version: TRUSTED_FLIGHT_SOURCE_REGISTRY_VERSION,
      phase: PHASE,
      providerId: id || "unknown_provider",
      providerName: "Unknown provider",
      providerType: "unknown",
      accessMode: "blocked",
      status: "blocked",
      readinessDecision: "blocked",
      sourceBlocked: true,
      unknownProviderBlocked: true,
      productionProvider: "disabled",
      canUseNetwork: false,
      canUseApiKey: false,
      canSaveApiKey: false,
      canReadApiKey: false,
      canConnectEndpoint: false,
      bookingUrl: false,
      payment: false,
      order: false,
      identityUpload: false,
      realProvider: false,
      redacted: true
    });
  }

  function evaluateTrustedFlightSourceReadiness(providerId) {
    const source = getTrustedFlightSourceById(providerId);
    return clone({
      version: TRUSTED_FLIGHT_SOURCE_REGISTRY_VERSION,
      phase: PHASE,
      providerId: source.providerId,
      providerName: source.providerName,
      providerType: source.providerType,
      readinessDecision: source.sourceBlocked ? "blocked" : source.accessMode,
      accessMode: source.accessMode,
      productionProvider: "disabled",
      canUseNetwork: false,
      canUseApiKey: false,
      canConnectEndpoint: false,
      canReturnBookingUrl: false,
      canPay: false,
      canCreateOrder: false,
      canUploadIdentity: false,
      sourceBlocked: source.sourceBlocked === true,
      unknownProviderBlocked: source.unknownProviderBlocked === true,
      redacted: true
    });
  }

  function getTrustedFlightSourceRegistryAuditDraft() {
    const registry = getTrustedFlightSourceRegistry();
    const manualSearchOnlyCount = registry.trustedSources.filter(function (item) {
      return item.accessMode === "manual_search_only";
    }).length;
    const fixtureOnlyCount = registry.trustedSources.filter(function (item) {
      return item.accessMode === "fixture_only";
    }).length;
    return clone({
      eventType: "TRUSTED_FLIGHT_SOURCE_REGISTRY_DRAFT",
      version: TRUSTED_FLIGHT_SOURCE_REGISTRY_VERSION,
      phase: PHASE,
      trustedSourceCount: registry.trustedSources.length,
      manualSearchOnlyCount: manualSearchOnlyCount,
      fixtureOnlyCount: fixtureOnlyCount,
      productionProviderDisabledCount: registry.trustedSources.length,
      bookingUrlDisplayedCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      realProviderCallCount: 0,
      networkAttemptCount: 0,
      redacted: true
    });
  }

  function assertTrustedFlightSourceRegistrySafe(value) {
    const registry = value && typeof value === "object" ? value : getTrustedFlightSourceRegistry();
    if (registry.redacted !== true) throw new Error("trusted flight source registry must stay redacted");
    if (registry.productionProvider !== "disabled") throw new Error("production provider must be disabled");
    if (registry.canUseNetwork !== false || registry.canUseApiKey !== false || registry.canConnectEndpoint !== false) throw new Error("trusted flight source registry must block network and credentials");
    if (registry.canReturnBookingUrl !== false || registry.canPay !== false || registry.canCreateOrder !== false || registry.canUploadIdentity !== false) throw new Error("trusted flight source registry must block booking/payment/order/identity upload");
    const serialized = JSON.stringify(registry);
    if (/bookingUrl|payment|order|identityUpload|apiKey|token|endpoint/i.test(serialized) && /disabled|false/.test(serialized) === false) throw new Error("trusted flight source registry leaked unsafe surface");
    return true;
  }

  window.WeishanTrustedFlightSourceRegistry = {
    TRUSTED_FLIGHT_SOURCE_REGISTRY_VERSION,
    PHASE,
    getTrustedFlightSourceRegistry,
    getTrustedFlightSourceById,
    evaluateTrustedFlightSourceReadiness,
    getTrustedFlightSourceRegistryAuditDraft,
    assertTrustedFlightSourceRegistrySafe
  };
})();
