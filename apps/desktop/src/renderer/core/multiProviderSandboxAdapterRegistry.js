;(function () {
  "use strict";

  const MULTI_PROVIDER_SANDBOX_ADAPTER_REGISTRY_VERSION = "2.1.91";
  const REGISTRY_NAME = "multi_provider_sandbox_adapter_registry_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function getTrustedRegistryApi() {
    return window.WeishanTrustedFlightSourceRegistry || {};
  }

  function trustedUrl(providerId, fallback) {
    const trustedApi = getTrustedRegistryApi();
    const source = typeof trustedApi.getTrustedFlightSourceById === "function" ? trustedApi.getTrustedFlightSourceById(providerId) : null;
    return text((source && source.safeProviderHandoffUrl) || fallback || "");
  }

  function profiles() {
    return [
      {
        providerId: "flight_provider_trusted_fixture",
        providerName: "Trusted Flight Fixture",
        adapterType: "fixture_read_only",
        providerMode: "fixture",
        status: "fixture_ready",
        responseShape: "weishan_normalized_quote",
        safeProviderHandoffUrl: trustedUrl("google_flights_search", "https://www.google.com/travel/flights"),
        capabilities: {
          importResponse: true,
          normalizeQuote: true,
          sandboxDryRun: false,
          productionApi: false,
          booking: false,
          payment: false,
          order: false,
          identityUpload: false
        },
        redacted: true
      },
      {
        providerId: "google_flights_search",
        providerName: "Google Flights",
        adapterType: "search_handoff_only",
        providerMode: "manual_search_only",
        status: "handoff_only",
        responseShape: "no_price_reading",
        safeProviderHandoffUrl: trustedUrl("google_flights_search", "https://www.google.com/travel/flights"),
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
        redacted: true
      },
      {
        providerId: "trip_com_sandbox_stub",
        providerName: "Trip.com Sandbox Stub",
        adapterType: "sandbox_read_only_stub",
        providerMode: "sandbox_read_only",
        status: "stub_ready",
        responseShape: "trip_com_stub_quote",
        safeProviderHandoffUrl: trustedUrl("trip_com_ctrip_search", "https://www.trip.com/flights/search"),
        capabilities: {
          importResponse: true,
          normalizeQuote: true,
          sandboxDryRun: true,
          productionApi: false,
          booking: false,
          payment: false,
          order: false,
          identityUpload: false
        },
        redacted: true
      },
      {
        providerId: "airline_official_sandbox_stub",
        providerName: "Airline Official Sandbox Stub",
        adapterType: "sandbox_read_only_stub",
        providerMode: "sandbox_read_only",
        status: "stub_ready",
        responseShape: "airline_official_stub_quote",
        safeProviderHandoffUrl: trustedUrl("google_flights_search", "https://www.google.com/travel/flights"),
        capabilities: {
          importResponse: true,
          normalizeQuote: true,
          sandboxDryRun: true,
          productionApi: false,
          booking: false,
          payment: false,
          order: false,
          identityUpload: false
        },
        redacted: true
      }
    ];
  }

  function getProfile(providerId) {
    const id = text(providerId);
    const match = profiles().find(function (profile) {
      return profile.providerId === id;
    });
    if (match) {
      return clone(Object.assign({}, match, {
        safeProviderHandoffReady: !!text(match.safeProviderHandoffUrl),
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false,
        productionApi: false,
        redacted: true
      }));
    }
    return clone({
      providerId: id || "unknown_provider",
      providerName: id || "Unknown provider",
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
      productionProvider: false,
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

  function getMultiProviderSandboxAdapterRegistry() {
    return clone({
      registryName: REGISTRY_NAME,
      appVersion: MULTI_PROVIDER_SANDBOX_ADAPTER_REGISTRY_VERSION,
      productionProviderEnabled: false,
      providers: profiles().map(function (profile) {
        return clone(profile);
      }),
      redacted: true
    });
  }

  function evaluateSandboxAdapterReadiness(providerId, options) {
    const profile = getProfile(providerId);
    const safeOptions = options && typeof options === "object" ? options : {};
    const productionProviderEnabled = safeOptions.productionProviderEnabled === true;
    const supported = profile.status !== "blocked";
    return clone({
      registryName: REGISTRY_NAME,
      appVersion: MULTI_PROVIDER_SANDBOX_ADAPTER_REGISTRY_VERSION,
      providerId: profile.providerId,
      providerName: profile.providerName,
      adapterType: profile.adapterType,
      providerMode: profile.providerMode,
      status: supported ? profile.status : "blocked",
      readinessDecision: supported ? profile.status : "blocked",
      responseShape: profile.responseShape,
      safeProviderHandoffUrl: profile.safeProviderHandoffUrl || null,
      safeProviderHandoffReady: !!profile.safeProviderHandoffUrl,
      productionProviderEnabled: false,
      productionProviderRequested: productionProviderEnabled,
      capabilities: clone(profile.capabilities || {}),
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      unknownProviderBlocked: supported ? false : true,
      redacted: true
    });
  }

  function buildMultiProviderSandboxAdapterRegistryAuditDraft(options) {
    const registry = getMultiProviderSandboxAdapterRegistry();
    const providers = Array.isArray(registry.providers) ? registry.providers : [];
    const safeOptions = options && typeof options === "object" ? options : {};
    return clone({
      eventType: "MULTI_PROVIDER_SANDBOX_ADAPTER_REGISTRY_DRAFT",
      registryName: REGISTRY_NAME,
      appVersion: MULTI_PROVIDER_SANDBOX_ADAPTER_REGISTRY_VERSION,
      providerCount: providers.length,
      providerIds: providers.map(function (provider) { return provider.providerId; }),
      providerNames: providers.map(function (provider) { return provider.providerName; }),
      adapterTypes: providers.map(function (provider) { return provider.adapterType; }),
      providerModes: providers.map(function (provider) { return provider.providerMode; }),
      responseShapes: providers.map(function (provider) { return provider.responseShape; }),
      productionProviderEnabled: false,
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

  window.WeishanMultiProviderSandboxAdapterRegistry = {
    MULTI_PROVIDER_SANDBOX_ADAPTER_REGISTRY_VERSION,
    REGISTRY_NAME,
    getMultiProviderSandboxAdapterRegistry,
    getSandboxAdapterProfile: getProfile,
    evaluateSandboxAdapterReadiness,
    buildMultiProviderSandboxAdapterRegistryAuditDraft
  };
})();
