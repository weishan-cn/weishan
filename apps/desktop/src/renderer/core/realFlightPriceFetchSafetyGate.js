;(function () {
  "use strict";

  const REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION = "2.1.43";
  const PHASE = "real_flight_price_fetch_safety_gate_v1";
  const TRUSTED_PROVIDER_IDS = ["real_flight_fixture", "real_flight_sandbox", "google_flights_search", "trip_com_ctrip_search"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function getTrustedRegistryIds() {
    const api = window.WeishanTrustedFlightSourceRegistry || {};
    if (typeof api.getTrustedFlightSourceRegistry === "function") {
      const registry = api.getTrustedFlightSourceRegistry() || {};
      const sources = Array.isArray(registry.trustedSources) ? registry.trustedSources : [];
      return sources.map((source) => text(source && source.providerId)).filter(Boolean);
    }
    return TRUSTED_PROVIDER_IDS.slice();
  }

  function isTrustedProvider(providerId) {
    const id = text(providerId);
    if (!id) return false;
    return getTrustedRegistryIds().includes(id) || TRUSTED_PROVIDER_IDS.includes(id);
  }

  function normalizeProviderMode(providerMode) {
    const mode = text(providerMode);
    if (mode === "sandbox") return "sandbox";
    if (mode === "production" || mode === "production_disabled") return "production_disabled";
    return "fixture";
  }

  function evaluateRealFlightPriceFetchSafety(candidateInput) {
    const candidate = candidateInput && typeof candidateInput === "object" ? candidateInput : {};
    const providerId = text(candidate.providerId);
    const providerName = text(candidate.providerName || providerId || "unknown provider");
    const providerMode = normalizeProviderMode(candidate.providerMode || candidate.mode);
    const restrictedCategory = candidate.restrictedCategoryDecision === "blocked" || candidate.restrictedCategory === true || candidate.category === "restricted_provider";
    const dryRunEnabled = candidate.dryRunEnabled === true;
    const hasSecureCredentialReference = candidate.hasSecureCredentialReference === true;
    const trustedProvider = isTrustedProvider(providerId);
    const blockedReasons = [];
    let status = "disabled";
    let decision = "disabled_missing_secure_credential";
    let reason = "missing secure credential reference";
    let networkAllowed = false;

    if (restrictedCategory) {
      status = "blocked";
      decision = "blocked_restricted_category";
      reason = "restricted category blocked";
      blockedReasons.push(reason);
    } else if (!trustedProvider) {
      status = "blocked";
      decision = "blocked_unknown_provider";
      reason = "unknown provider blocked";
      blockedReasons.push(reason);
    } else if (providerMode === "production_disabled") {
      status = "disabled";
      decision = "production_disabled";
      reason = "production provider disabled";
    } else if (providerMode === "sandbox") {
      if (!hasSecureCredentialReference) {
        status = "disabled";
        decision = "disabled_missing_secure_credential";
        reason = "missing secure credential reference";
      } else if (dryRunEnabled) {
        status = "allowed";
        decision = "sandbox_dry_run_allowed";
        reason = "sandbox dry-run allowed";
        networkAllowed = true;
      } else {
        status = "disabled";
        decision = "disabled_missing_dry_run_flag";
        reason = "sandbox requires dryRunEnabled";
      }
    } else {
      status = "allowed";
      decision = "fixture_provider_allowed";
      reason = "fixture provider allowed";
    }

    return clone({
      gateName: PHASE,
      appVersion: REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION,
      status: status,
      decision: decision,
      providerId: providerId,
      providerName: providerName,
      providerMode: providerMode,
      reason: reason,
      readOnly: true,
      networkAllowed: networkAllowed,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
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
      realProviderCallCount: 0,
      realApiKeyReadCount: 0,
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
    const gate = value && typeof value === "object" ? value : evaluateRealFlightPriceFetchSafety({ providerId: "real_flight_fixture", providerMode: "fixture" });
    if (gate.redacted !== true) throw new Error("real flight price fetch safety gate must stay redacted");
    if (gate.readOnly !== true) throw new Error("real flight price fetch safety gate must stay read only");
    if (gate.booking !== false || gate.payment !== false || gate.order !== false || gate.identityUpload !== false) throw new Error("real flight price fetch safety gate must block booking/payment/order/identity upload");
    if (gate.providerMode === "sandbox" && gate.status === "allowed" && gate.networkAllowed !== true) throw new Error("sandbox dry-run allowed gate must allow network");
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
