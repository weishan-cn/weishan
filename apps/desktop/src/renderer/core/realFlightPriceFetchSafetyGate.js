;(function () {
  "use strict";

  const REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION = "2.2.6";
  const PHASE = "real_flight_price_fetch_safety_gate_v1";

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

  function connectorReadiness(candidate) {
    const api = getConnectorApi();
    const providerMode = normalizeProviderMode(candidate.providerMode || candidate.mode);
    const input = Object.assign({}, candidate, { providerMode: providerMode, sandboxDryRunEnabled:candidate.sandboxDryRunEnabled === true || candidate.dryRunEnabled === true });
    if (typeof api.evaluateSingleFlightProviderSandboxReadiness === "function") return api.evaluateSingleFlightProviderSandboxReadiness(input);
    return { connectorName:"single_flight_provider_sandbox_connector_v1", appVersion:REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION, providerId:text(candidate.providerId), providerName:text(candidate.providerName || candidate.providerId || "unknown provider"), providerMode:providerMode, status:providerMode === "fixture" ? "fixture_ready" : "disabled", decision:providerMode === "fixture" ? "fixture_read_only_ready" : "disabled", reason:"connector fallback", networkAllowed:false, productionProviderEnabled:false, readOnly:true, booking:false, payment:false, order:false, identityUpload:false, redacted:true };
  }

  function evaluateRealFlightPriceFetchSafety(candidateInput) {
    const candidate = candidateInput && typeof candidateInput === "object" ? candidateInput : {};
    const connector = connectorReadiness(candidate);
    let status = "disabled";
    let decision = connector.decision || "disabled";
    let reason = connector.reason || "connector disabled";
    if (connector.status === "blocked") {
      status = "blocked";
    } else if (connector.status === "fixture_ready") {
      status = "allowed";
      decision = "fixture_provider_allowed";
      reason = "fixture provider allowed";
    } else if (connector.status === "sandbox_ready") {
      status = "allowed";
      decision = connector.networkAllowed === true ? "sandbox_read_only_network_dry_run_allowed" : "sandbox_read_only_ready_network_disabled";
      reason = connector.networkAllowed === true ? "sandbox read-only dry-run allowed" : "sandbox read-only ready but network disabled";
    } else if (connector.providerMode === "production_disabled") {
      status = "disabled";
      decision = "production_disabled";
      reason = "production provider disabled";
    }

    return clone({
      gateName: PHASE,
      appVersion: REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION,
      status: status,
      decision: decision,
      providerId: connector.providerId,
      providerName: connector.providerName,
      providerMode: connector.providerMode,
      reason: reason,
      readOnly: true,
      networkAllowed: connector.networkAllowed === true,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      productionProviderEnabled:false,
      providerConnector: connector,
      redacted: true
    });
  }

  function buildRealFlightPriceFetchSafetyAudit(candidateInput) {
    const safety = evaluateRealFlightPriceFetchSafety(candidateInput);
    return clone({
      eventType: "REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_DRAFT",
      gateName: PHASE,
      appVersion: REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION,
      providerId: safety.providerId,
      providerName: safety.providerName,
      providerMode: safety.providerMode,
      status: safety.status,
      decision: safety.decision,
      reason: safety.reason,
      readOnly: true,
      networkAllowed: safety.networkAllowed === true,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      productionProviderEnabled:false,
      realProviderCallCount: 0,
      realEndpointConnectCount: 0,
      bookingUrlDisplayedCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      redacted: true
    });
  }

  function isRealFlightPriceFetchAllowed(candidateInput) {
    return evaluateRealFlightPriceFetchSafety(candidateInput).status === "allowed";
  }

  function assertRealFlightPriceFetchSafetyGateSafe(value) {
    const gate = value && typeof value === "object" ? value : evaluateRealFlightPriceFetchSafety({ providerId: "google_flights_search", providerMode: "fixture" });
    if (gate.redacted !== true) throw new Error("real flight price fetch safety gate must stay redacted");
    if (gate.readOnly !== true) throw new Error("real flight price fetch safety gate must stay read only");
    if (gate.booking !== false || gate.payment !== false || gate.order !== false || gate.identityUpload !== false) throw new Error("real flight price fetch safety gate must block unsafe actions");
    if (gate.productionProviderEnabled !== false) throw new Error("real flight price fetch safety gate must keep production provider disabled");
    return true;
  }

  window.WeishanRealFlightPriceFetchSafetyGate = {
    REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION,
    PHASE,
    evaluateRealFlightPriceFetchSafety,
    buildRealFlightPriceFetchSafetyAudit,
    isRealFlightPriceFetchAllowed,
    assertRealFlightPriceFetchSafetyGateSafe
  };
})();
