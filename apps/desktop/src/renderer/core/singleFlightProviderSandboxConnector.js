;(function () {
  "use strict";

  const SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_VERSION = "4.2.8";
  const CONNECTOR_NAME = "single_flight_provider_sandbox_connector_v1";
  const FALLBACK_PROVIDER_IDS = ["google_flights_search", "trip_com_ctrip_search"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getRegistryApi() {
    return window.WeishanTrustedFlightSourceRegistry || {};
  }

  function getCredentialApi() {
    return window.WeishanProviderCredentialReadinessPanel || {};
  }

  function getTrustedProviderIds() {
    const api = getRegistryApi();
    if (typeof api.getTrustedFlightSourceRegistry === "function") {
      const registry = api.getTrustedFlightSourceRegistry() || {};
      const sources = Array.isArray(registry.trustedSources) ? registry.trustedSources : [];
      const ids = sources.map(function (source) { return text(source && source.providerId); }).filter(Boolean);
      if (ids.length) return ids;
    }
    return FALLBACK_PROVIDER_IDS.slice();
  }

  function getTrustedSource(providerId) {
    const id = text(providerId || "google_flights_search");
    const api = getRegistryApi();
    if (typeof api.getTrustedFlightSourceById === "function") {
      const source = api.getTrustedFlightSourceById(id);
      if (source && source.providerId === id) return source;
    }
    if (FALLBACK_PROVIDER_IDS.includes(id)) {
      return { providerId:id, providerName:id === "trip_com_ctrip_search" ? "Trip.com / Ctrip" : "Google Flights", providerType:"flight_search", productionProvider:"disabled", redacted:true };
    }
    return null;
  }

  function normalizeProviderMode(providerMode) {
    const mode = text(providerMode || "fixture");
    if (mode === "sandbox" || mode === "sandbox_read_only") return "sandbox_read_only";
    if (mode === "production" || mode === "production_disabled") return "production_disabled";
    return "fixture";
  }

  function normalizeProviderId(options) {
    const safe = options && typeof options === "object" ? options : {};
    const mode = normalizeProviderMode(safe.providerMode || safe.mode);
    if (safe.providerId) return text(safe.providerId);
    return mode === "fixture" ? "google_flights_search" : "google_flights_search";
  }

  function isRestricted(input) {
    const safe = input && typeof input === "object" ? input : {};
    return safe.restrictedCategory === true || safe.restrictedCategoryDecision === "blocked" || safe.category === "restricted_provider";
  }

  function baseSafety() {
    return { booking:false, payment:false, order:false, identityUpload:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false };
  }

  function evaluateSingleFlightProviderSandboxReadiness(options) {
    const safe = options && typeof options === "object" ? options : {};
    const providerMode = normalizeProviderMode(safe.providerMode || safe.mode);
    const providerId = normalizeProviderId(safe);
    const source = getTrustedSource(providerId);
    const trustedProvider = !!source && getTrustedProviderIds().includes(providerId);
    const credentialApi = getCredentialApi();
    const credentialReadiness = typeof credentialApi.evaluateProviderCredentialReadiness === "function"
      ? credentialApi.evaluateProviderCredentialReadiness(Object.assign({}, safe, { providerMode:providerMode, providerId:providerId }))
      : { status:providerMode === "fixture" ? "fixture_ready" : "disabled", hasSecureCredentialReference:safe.hasSecureCredentialReference === true, sandboxDryRunEnabled:safe.sandboxDryRunEnabled === true || safe.dryRunEnabled === true, networkDryRunAllowed:providerMode === "sandbox_read_only" && safe.networkDryRunAllowed === true, productionProviderEnabled:false, canAttemptReadOnlyRefresh:providerMode === "fixture", missingRequirements:[], redacted:true };
    const sandboxDryRunEnabled = credentialReadiness.sandboxDryRunEnabled === true;
    const hasSecureCredentialReference = credentialReadiness.hasSecureCredentialReference === true;
    const restricted = isRestricted(safe);
    let status = "disabled";
    let decision = "disabled";
    let reason = "sandbox connector disabled";
    let networkAllowed = false;

    if (restricted) {
      status = "blocked";
      decision = "blocked_restricted_category";
      reason = "restricted category blocked";
    } else if (!trustedProvider) {
      status = "blocked";
      decision = "blocked_unknown_provider";
      reason = "unknown provider blocked";
    } else if (providerMode === "production_disabled") {
      status = "disabled";
      decision = "production_disabled";
      reason = "production provider disabled";
    } else if (providerMode === "sandbox_read_only") {
      if (credentialReadiness.status !== "sandbox_ready") {
        status = "disabled";
        decision = !sandboxDryRunEnabled ? "disabled_missing_sandbox_dry_run" : "disabled_missing_secure_credential_reference";
        reason = "sandbox read-only mode requires credential readiness";
      } else {
        status = "sandbox_ready";
        decision = "sandbox_read_only_ready";
        reason = "sandbox read-only evidence ready";
        networkAllowed = credentialReadiness.networkDryRunAllowed === true;
      }
    } else {
      status = "fixture_ready";
      decision = "fixture_read_only_ready";
      reason = "fixture read-only evidence ready";
    }

    return clone(Object.assign({
      connectorName: CONNECTOR_NAME,
      appVersion: SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_VERSION,
      providerId: providerId,
      providerName: text(source && source.providerName || providerId || "unknown provider"),
      providerMode: providerMode,
      status: status,
      decision: decision,
      reason: reason,
      sandboxDryRunEnabled: sandboxDryRunEnabled,
      hasSecureCredentialReference: hasSecureCredentialReference,
      credentialReadiness: credentialReadiness,
      trustedProvider: trustedProvider,
      networkAllowed: networkAllowed,
      networkDryRunAllowed: networkAllowed,
      canAttemptReadOnlyRefresh: credentialReadiness.canAttemptReadOnlyRefresh === true && status !== "blocked",
      productionProviderEnabled: false,
      readOnly: true,
      canUseFixtureEvidence: status === "fixture_ready",
      canUseSandboxReadOnlyEvidence: status === "sandbox_ready",
      canReplaceMainResultCard: false,
      userFacingRealPriceEnabled: false,
      showableAsRealPrice: false,
      redacted: true
    }, baseSafety()));
  }

  function getSingleFlightProviderSandboxConnectorStatus(options) {
    return evaluateSingleFlightProviderSandboxReadiness(options);
  }

  function normalizeRequest(request) {
    const safe = request && typeof request === "object" ? request : {};
    return {
      origin: text(safe.origin || "上海"),
      destination: text(safe.destination || "成都"),
      departureDate: text(safe.departureDate || "2026-07-15"),
      tripType: text(safe.tripType || "one_way"),
      passengerCount: number(safe.passengerCount, 1),
      cabinClass: text(safe.cabinClass || "economy"),
      directOnly: safe.directOnly === true,
      sortIntent: text(safe.sortIntent || "低价优先"),
      restrictedCategoryDecision: text(safe.restrictedCategoryDecision || "allow")
    };
  }

  function buildQuotePayload(request, readiness, quoteStatus) {
    const safeRequest = normalizeRequest(request);
    const sandbox = readiness.providerMode === "sandbox_read_only";
    const source = sandbox ? "sandbox_read_only_stub" : "fixture_read_only";
    return clone(Object.assign({
      connectorName: CONNECTOR_NAME,
      appVersion: SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_VERSION,
      status: quoteStatus || (sandbox ? "sandbox_read_only_stub_ready" : "fixture_ready"),
      providerId: readiness.providerId,
      providerName: readiness.providerName,
      providerMode: readiness.providerMode,
      fareSource: source,
      handoffType: "registry_gate_required",
      refreshAttemptId: readiness.providerMode === "sandbox_read_only" ? "sandbox-read-only-refresh-001" : "fixture-refresh-001",
      refreshStatus: quoteStatus || (sandbox ? "sandbox_read_only_stub_ready" : "fixture_ready"),
      route: safeRequest.origin + " -> " + safeRequest.destination,
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
      redacted: true
    }, baseSafety()));
  }

  function fetchSingleFlightProviderSandboxQuote(request, options) {
    const readiness = evaluateSingleFlightProviderSandboxReadiness(Object.assign({}, options || {}, { restrictedCategoryDecision:(request && request.restrictedCategoryDecision) || (options && options.restrictedCategoryDecision) || "allow" }));
    if (readiness.status === "blocked") return buildQuotePayload(request, readiness, readiness.decision);
    if (readiness.providerMode === "production_disabled") return buildQuotePayload(request, readiness, "production_disabled");
    if (readiness.providerMode === "sandbox_read_only") {
      if (readiness.status !== "sandbox_ready") return buildQuotePayload(request, readiness, readiness.decision);
      if (readiness.networkAllowed !== true) return buildQuotePayload(request, readiness, "sandbox_ready_but_network_disabled");
      return buildQuotePayload(request, readiness, "sandbox_read_only_adapter_stub_ready");
    }
    return buildQuotePayload(request, readiness, "fixture_ready");
  }

  function buildSingleFlightProviderSandboxConnectorAuditDraft(options) {
    const readiness = evaluateSingleFlightProviderSandboxReadiness(options);
    return clone({
      eventType: "SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_AUDIT_DRAFT",
      connectorName: CONNECTOR_NAME,
      appVersion: SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_VERSION,
      providerId: readiness.providerId,
      providerName: readiness.providerName,
      providerMode: readiness.providerMode,
      status: readiness.status,
      decision: readiness.decision,
      reason: readiness.reason,
      sandboxDryRunEnabled: readiness.sandboxDryRunEnabled === true,
      hasSecureCredentialReference: readiness.hasSecureCredentialReference === true,
      networkAllowed: readiness.networkAllowed === true,
      networkDryRunAllowed: readiness.networkDryRunAllowed === true,
      credentialReadinessStatus: readiness.credentialReadiness && readiness.credentialReadiness.status || "disabled",
      productionProviderEnabled: false,
      readOnly: true,
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
    });
  }

  window.WeishanSingleFlightProviderSandboxConnector = {
    SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_VERSION,
    CONNECTOR_NAME,
    getSingleFlightProviderSandboxConnectorStatus,
    evaluateSingleFlightProviderSandboxReadiness,
    fetchSingleFlightProviderSandboxQuote,
    buildSingleFlightProviderSandboxConnectorAuditDraft
  };
})();
