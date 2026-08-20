;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const SOURCE_CLASSES = Object.freeze(["GDS", "NDC_AGGREGATOR", "METASEARCH", "OTA", "AIRLINE_DIRECT_NDC", "SYNTHETIC_FIXTURE"]);
  const CONTENT_CLASSES = Object.freeze(["ATPCO", "NDC", "LCC", "PRIVATE_CONTENT", "OTA_CONTENT", "METASEARCH_CONTENT", "MIXED", "UNKNOWN"]);
  const REAL_FARE_CAPABILITIES = Object.freeze(["LIVE", "INDICATIVE_ONLY", "TEST_ONLY", "UNKNOWN"]);
  const AVAILABILITY_AUTHORITIES = Object.freeze(["AUTHORITATIVE", "LIMITED_SIGNAL", "NONE"]);
  const CURRENCY_AUTHORITIES = Object.freeze(["AUTHORITATIVE", "PROVIDER_SUPPLIED", "UNKNOWN"]);
  const COMPARISON_PERMISSIONS = Object.freeze(["ALLOWED", "UNCLEAR", "RESTRICTED", "PROHIBITED"]);
  const METASEARCH_PERMISSIONS = Object.freeze(["ALLOWED", "UNCLEAR", "PROHIBITED"]);
  const DISPLAY_PERMISSIONS = Object.freeze(["ALLOWED", "UNCLEAR", "RESTRICTED"]);
  const CACHE_PERMISSIONS = Object.freeze(["ALLOWED", "LIMITED", "UNCLEAR", "PROHIBITED"]);
  const HANDOFF_CAPABILITIES = Object.freeze(["ALLOWED", "UNCLEAR", "NONE"]);
  const CREDENTIAL_REQUIREMENTS = Object.freeze(["NONE", "SERVICE_MANAGED", "UNKNOWN"]);
  const COST_POLICIES = Object.freeze(["FREE_AUTHORIZED", "LAYER_3_DEFERRED", "UNKNOWN"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function boundary() {
    return { executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, productionAffected:false,
      BOOKING:false, ORDER:false, PAYMENT:false, TICKETING:false, TICKET_ISSUANCE:false,
      WEISHAN_PAYS_PROVIDER:false, PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false };
  }
  function failure(code) {
    return deepFreeze(Object.assign({ success:false, error:{ code:code, stage:"FLIGHT_PROVIDER_POLICY", recoverable:true, message:"Flight provider policy was rejected safely." } }, boundary()));
  }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function identifier(value) { const result = text(value); return result && result.length <= 160 && !/[\u0000-\u001f\u007f]/.test(result) ? result : null; }
  function valueIn(value, allowed) { const normalized = text(value).toUpperCase(); return allowed.indexOf(normalized) >= 0 ? normalized : null; }
  function hostPolicy(input, security) {
    const values = input && input.allowedHosts;
    if (!Array.isArray(values) || !values.length) return null;
    const hosts = Array.from(new Set(values.map(function (host) { return text(host).toLowerCase(); }))).sort();
    if (!hosts.every(function (host) { return security.validateHttpsUrl("https://" + host + "/", [host]).success; })) return null;
    const maxResponseBytes = Number(input.maxResponseBytes);
    const maxRetries = Number(input.maxRetries);
    if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes < 1024 || maxResponseBytes > 1048576) return null;
    if (!Number.isSafeInteger(maxRetries) || maxRetries < 0 || maxRetries > 2 || input.automaticRetry !== false) return null;
    return { allowedHosts:hosts, arbitraryBaseUrlAllowed:false, redirectFollowing:false, maxResponseBytes:maxResponseBytes, maxRetries:maxRetries, automaticRetry:false };
  }
  function createFlightProviderPolicy(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    if (typeof security.clonePlain !== "function" || typeof security.validateHttpsUrl !== "function") return failure("SECURITY_DEPENDENCY_UNAVAILABLE");
    const checked = security.clonePlain(input);
    if (!checked.success) return failure("PROVIDER_POLICY_INPUT_REJECTED");
    const source = checked.value;
    const provider = identifier(source.provider);
    const environment = identifier(source.environment);
    const authorizationClass = identifier(source.authorizationClass);
    const credentialStoreReference = identifier(source.credentialStoreReference);
    const policy = {
      provider:provider,
      environment:environment,
      sourceClass:valueIn(source.sourceClass, SOURCE_CLASSES),
      contentSourceClass:valueIn(source.contentSourceClass, CONTENT_CLASSES),
      realFareCapability:valueIn(source.realFareCapability, REAL_FARE_CAPABILITIES),
      availabilityAuthority:valueIn(source.availabilityAuthority, AVAILABILITY_AUTHORITIES),
      currencyAuthority:valueIn(source.currencyAuthority, CURRENCY_AUTHORITIES),
      handoffCapability:valueIn(source.handoffCapability, HANDOFF_CAPABILITIES),
      comparisonPermission:valueIn(source.comparisonPermission, COMPARISON_PERMISSIONS),
      displayPermission:valueIn(source.displayPermission, DISPLAY_PERMISSIONS),
      cachePermission:valueIn(source.cachePermission, CACHE_PERMISSIONS),
      metasearchPermission:valueIn(source.metasearchPermission, METASEARCH_PERMISSIONS),
      credentialRequirement:valueIn(source.credentialRequirement, CREDENTIAL_REQUIREMENTS),
      costPolicy:valueIn(source.costPolicy, COST_POLICIES),
      authorizationClass:authorizationClass
    };
    if (!provider || !environment || !authorizationClass || Object.keys(policy).some(function (key) { return !policy[key]; })) return failure("PROVIDER_POLICY_INCOMPLETE");
    if (source.bookingCapabilityPresentButDisabled !== true) return failure("BOOKING_CAPABILITY_MUST_BE_DISABLED");
    if (policy.credentialRequirement === "SERVICE_MANAGED" && !credentialStoreReference) return failure("CREDENTIAL_STORE_REFERENCE_REQUIRED");
    if (policy.credentialRequirement !== "SERVICE_MANAGED" && credentialStoreReference) return failure("CREDENTIAL_REFERENCE_NOT_ALLOWED");
    const transportPolicy = hostPolicy(source.transportPolicy, security);
    if (!transportPolicy) return failure("TRANSPORT_POLICY_INVALID");
    const rate = source.rateLimit || {};
    if (!Number.isSafeInteger(rate.maxRequests) || rate.maxRequests < 1 || !Number.isSafeInteger(rate.windowSeconds) || rate.windowSeconds < 1 || rate.scheduledPolling !== false) return failure("RATE_LIMIT_POLICY_INVALID");
    return deepFreeze(Object.assign({ success:true, policy:Object.assign(policy, {
      credentialStoreReference:credentialStoreReference || null,
      bookingCapabilityPresentButDisabled:true,
      transportPolicy:transportPolicy,
      rateLimit:{ maxRequests:rate.maxRequests, windowSeconds:rate.windowSeconds, scheduledPolling:false },
      networkTransportImplemented:false,
      rendererSecretAccess:false,
      rawResponsePersistence:false
    }, boundary()) }, boundary()));
  }

  window.WeishanFlightShoppingProviderPolicy = Object.freeze({
    VERSION, SOURCE_CLASSES, CONTENT_CLASSES, REAL_FARE_CAPABILITIES, AVAILABILITY_AUTHORITIES, CURRENCY_AUTHORITIES,
    COMPARISON_PERMISSIONS, METASEARCH_PERMISSIONS, DISPLAY_PERMISSIONS, CACHE_PERMISSIONS, HANDOFF_CAPABILITIES,
    CREDENTIAL_REQUIREMENTS, COST_POLICIES, createFlightProviderPolicy
  });
})();
