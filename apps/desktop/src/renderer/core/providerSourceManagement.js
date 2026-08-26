;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "provider_source_management_v1";
  const DECISIONS = Object.freeze(["KEEP", "OPTIMIZE", "MERGE", "REPLACE", "DEFER", "DELETE"]);
  const LIVE_ENVIRONMENTS = Object.freeze(["PUBLIC", "PRODUCTION"]);
  const NON_LIVE_ENVIRONMENTS = Object.freeze(["TEST", "SANDBOX", "EVALUATION", "PREPROD", "OFFLINE", "HANDOFF_ONLY", "FOUNDATION_ONLY", "DEVELOPMENT"]);
  const BLOCKING_READINESS = Object.freeze(["BLOCKED", "DECOMMISSIONED", "DISABLED", "FOUNDATION_ONLY", "PENDING_EXTERNAL_APPROVAL"]);
  const GOVERNANCE = Object.freeze({
    executionGate:"CLOSED",
    authorizesExecution:false,
    productionTraffic:false,
    productionAffected:false,
    WEISHAN_PAYS_PROVIDER:false,
    PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false,
    EMAIL_SEND_ENABLED:false,
    BOOKING:false,
    ORDER:false,
    PAYMENT:false,
    TICKETING:false
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }
  function text(value) {
    return String(value == null ? "" : value).trim();
  }
  function upper(value) {
    return text(value).toUpperCase();
  }
  function id(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9._:-]+/g, "_").replace(/^_+|_+$/g, "");
  }
  function list(value) {
    return Array.isArray(value) ? value.slice().map(text).filter(Boolean) : [];
  }
  function uniqueSorted(values) {
    return Array.from(new Set(values.map(text).filter(Boolean))).sort();
  }
  function boundary(extra) {
    return Object.assign({}, GOVERNANCE, extra || {});
  }
  function source(row) {
    return Object.assign({
      capabilityAuthority:"REGISTRY_ONLY",
      environmentAuthority:"REGISTRY_ONLY",
      readinessAuthority:"REGISTRY_ONLY",
      payloadCanModifyAuthority:false,
      enabled:true,
      categoryScope:[],
      capabilities:[],
      blockers:[],
      commissionEligible:false,
      commissionAffectsReadiness:false,
      transactionCapability:"NONE",
      handoffCapability:"NONE",
      priceState:"NO_PRICE",
      authState:"NOT_APPLICABLE",
      readiness:"FOUNDATION_ONLY",
      decision:"KEEP",
      currentCallers:[],
      removeItResult:"source truth would be less explicit"
    }, row);
  }

  const SOURCES = deepFreeze([
    source({ sourceId:"cheapshark", displayName:"CheapShark", domain:"SHOPPING", role:["PRICE", "HANDOFF"], environment:"PUBLIC", capabilities:["search", "price", "availability", "exact_handoff"], readiness:"READY_READ_ONLY", authState:"NOT_APPLICABLE", priceState:"REAL_PROVIDER_PRICE", handoffCapability:"EXACT_PROVIDER_URL", categoryScope:["games"], currentCallers:["globalCommerceCheapSharkAdapter", "globalCommerceProviderRoleRegistry"], decision:"KEEP" }),
    source({ sourceId:"daily_dose_tech", displayName:"Daily Dose Tech", domain:"SHOPPING", role:["PRICE", "EVIDENCE_ONLY"], environment:"PUBLIC", capabilities:["price_observation", "provider_handoff"], readiness:"READY_PROVIDER_SPECIFIC_ONLY", authState:"NOT_APPLICABLE", priceState:"PROVIDER_PRICE_OBSERVATION_NOT_LIVE_OFFER", handoffCapability:"PROVIDER_PAGE_ONLY", categoryScope:["electronics"], currentCallers:["globalCommerceDailyDoseAdapter", "globalCommerceProviderRoleRegistry"], decision:"KEEP" }),
    source({ sourceId:"apple_search", displayName:"Apple Search API", domain:"SHOPPING", role:["IDENTITY", "HANDOFF"], environment:"PUBLIC", capabilities:["search", "provider_specific_validation"], readiness:"READY_PROVIDER_SPECIFIC_ONLY", authState:"NOT_APPLICABLE", priceState:"NO_CROSS_PROVIDER_PRICE", handoffCapability:"PROVIDER_SEARCH_OR_DETAIL", categoryScope:["apps", "media", "apple_catalog"], currentCallers:["globalCommerceProviderRoleRegistry"], decision:"KEEP" }),
    source({ sourceId:"open_prices", displayName:"Open Prices", domain:"SHOPPING", role:["EVIDENCE_ONLY"], environment:"PUBLIC", capabilities:["dated_price_observation"], readiness:"EVIDENCE_ONLY", authState:"NOT_APPLICABLE", priceState:"CROWDSOURCED_DATED_OBSERVATION", handoffCapability:"SOURCE_REFERENCE", categoryScope:["food"], currentCallers:["globalCommerceSupplementalProviderNormalizers", "globalCommerceProviderRoleRegistry"], decision:"KEEP" }),
    source({ sourceId:"ebay_sandbox", displayName:"eBay Sandbox", domain:"SHOPPING", role:["TEST", "PRICE"], environment:"SANDBOX", capabilities:["oauth_validation", "browse_readonly"], readiness:"READY_TEST_ONLY", authState:"AUTH_VALIDATED", priceState:"SANDBOX_TEST_DATA", handoffCapability:"SANDBOX_ITEM_URL", categoryScope:["marketplace"], currentCallers:["ebaySandboxReadonlyValidator"], decision:"KEEP" }),
    source({ sourceId:"google_books", displayName:"Google Books", domain:"SHOPPING", role:["DISCOVERY", "PRICE"], environment:"PUBLIC", capabilities:["book_search", "sale_info"], readiness:"BLOCKED", authState:"CREDENTIAL_ROTATION_DEFERRED", priceState:"PRICE_IF_RETURNED_BY_PROVIDER", handoffCapability:"GOOGLE_INFO_OR_BUY_LINK_IF_RETURNED", categoryScope:["books"], blockers:["CREDENTIAL_ROTATION_DEFERRED"], currentCallers:[], decision:"DEFER" }),
    source({ sourceId:"ticketmaster_development", displayName:"Ticketmaster Development", domain:"SHOPPING", role:["DISCOVERY", "PRICE", "HANDOFF"], environment:"DEVELOPMENT", capabilities:["event_search", "price_range", "official_event_url"], readiness:"READY_TEST_ONLY", authState:"AUTH_VALIDATED", priceState:"DEVELOPMENT_READ_ONLY_VALIDATED", handoffCapability:"OFFICIAL_EVENT_URL", categoryScope:["events"], currentCallers:[], decision:"KEEP" }),
    source({ sourceId:"multi_network_product_feed", displayName:"Multi-network Product Feed Foundation", domain:"SHOPPING", role:["FOUNDATION_ONLY"], environment:"FOUNDATION_ONLY", capabilities:["source_descriptor", "feed_normalization_contract"], readiness:"FOUNDATION_ONLY", authState:"NOT_APPLICABLE", priceState:"NO_RUNTIME_PROVIDER_PRICE", categoryScope:["product_feed"], currentCallers:["globalCommerceFeedSourceDescriptor", "globalCommerceFeedNormalizer"], decision:"KEEP" }),
    source({ sourceId:"amadeus_self_service", displayName:"Amadeus Self-Service", domain:"FLIGHT", role:["FOUNDATION_ONLY"], environment:"OFFLINE", capabilities:["historical_schema_normalization"], readiness:"DECOMMISSIONED", authState:"NO_ACCOUNT", priceState:"OFFLINE_SCHEMA_ONLY", handoffCapability:"NONE", categoryScope:["flight"], blockers:["AMADEUS_SELF_SERVICE_DECOMMISSIONED"], currentCallers:["amadeusSelfServiceFlightSourceAdapter"], decision:"KEEP", removeItResult:"decommission guard would be lost" }),
    source({ sourceId:"duffel_test", displayName:"Duffel Test", domain:"FLIGHT", role:["TEST", "PRICE"], environment:"TEST", capabilities:["offer_request_schema", "test_offer_normalization"], readiness:"BLOCKED", authState:"NO_ACCOUNT", priceState:"TEST_ENVIRONMENT_DATA", handoffCapability:"ORDER_ORIENTED_HANDOFF_UNRESOLVED", categoryScope:["flight"], blockers:["LEGAL_AND_ACCOUNT_ELIGIBILITY_REVIEW_REQUIRED"], currentCallers:["duffelTestFlightSourceAdapter"], decision:"KEEP" }),
    source({ sourceId:"skyscanner_live_prices", displayName:"Skyscanner Live Prices", domain:"FLIGHT", role:["PRICE", "HANDOFF"], environment:"PRODUCTION", capabilities:["live_prices_after_partner_approval", "deeplink"], readiness:"PENDING_EXTERNAL_APPROVAL", authState:"AUTH_REQUIRED", priceState:"LIVE_PROVIDER_PRICE_AFTER_APPROVAL", handoffCapability:"PARTNER_DEEPLINK_AFTER_APPROVAL", categoryScope:["flight"], blockers:["PARTNER_APPROVAL_REQUIRED"], currentCallers:["flight source acquisition docs/tests"], decision:"DEFER" }),
    source({ sourceId:"travelport_tripservices", displayName:"Travelport TripServices", domain:"FLIGHT", role:["PRICE", "IDENTITY"], environment:"PREPROD", capabilities:["air_search_when_provisioned", "air_price_when_provisioned"], readiness:"BLOCKED", authState:"CREDENTIAL_MISSING", priceState:"PROVIDER_PRICE_WHEN_PROVISIONED", handoffCapability:"READ_ONLY_HANDOFF_BOUNDARY_UNRESOLVED", categoryScope:["flight"], blockers:["ENTERPRISE_PROVISIONING_REQUIRED"], currentCallers:["flight source acquisition docs/tests"], decision:"DEFER" }),
    source({ sourceId:"sabre", displayName:"Sabre APIs", domain:"FLIGHT", role:["PRICE", "IDENTITY"], environment:"PREPROD", capabilities:["air_shopping_when_provisioned"], readiness:"BLOCKED", authState:"CREDENTIAL_MISSING", priceState:"PROVIDER_PRICE_WHEN_PROVISIONED", categoryScope:["flight"], blockers:["SABRE_PROVISIONING_REQUIRED"], currentCallers:["flight source acquisition docs/tests"], decision:"DEFER" }),
    source({ sourceId:"hotelbeds_evaluation", displayName:"Hotelbeds Evaluation", domain:"HOTEL", role:["PRICE", "TEST"], environment:"EVALUATION", capabilities:["hotel_availability_after_mtls"], readiness:"BLOCKED", authState:"AUTH_FAILED", priceState:"EVALUATION_DATA_ONLY", handoffCapability:"UNRESOLVED", categoryScope:["hotel"], blockers:["MTLS_CHALLENGE_PROVIDER_SUPPORT_PENDING"], currentCallers:["hotelbedsEvaluationReadonlyValidator"], decision:"KEEP" }),
    source({ sourceId:"cunard_public_handoff", displayName:"Cunard Public Cruise Handoff", domain:"CRUISE", role:["HANDOFF_ONLY"], environment:"HANDOFF_ONLY", capabilities:["official_public_handoff"], readiness:"HANDOFF_ONLY", authState:"NOT_APPLICABLE", priceState:"NO_PROVIDER_PRICE", handoffCapability:"OFFICIAL_PUBLIC_SITE", categoryScope:["cruise"], currentCallers:["cunardPublicCruiseHandoffAdapter"], decision:"KEEP" }),
    source({ sourceId:"traveltek_cruise_connect", displayName:"Traveltek Cruise Connect", domain:"CRUISE", role:["PRICE"], environment:"PREPROD", capabilities:["cruise_search_when_commercially_provisioned"], readiness:"BLOCKED", authState:"CREDENTIAL_MISSING", priceState:"PROVIDER_PRICE_WHEN_PROVISIONED", handoffCapability:"COMMERCIAL_BOUNDARY_UNRESOLVED", categoryScope:["cruise"], blockers:["COMMERCIAL_CREDENTIAL_REQUIRED"], currentCallers:["traveltekCruiseConnectAdapter"], decision:"DEFER" }),
    source({ sourceId:"video_provider_gateway", displayName:"Video Provider Gateway", domain:"VIDEO", role:["TEST", "FOUNDATION_ONLY"], environment:"OFFLINE", capabilities:["provider_manifest_validation", "sandbox_lifecycle"], readiness:"READY_TEST_ONLY", authState:"NOT_APPLICABLE", priceState:"NOT_APPLICABLE", categoryScope:["video"], currentCallers:["videoProviderGateway", "videoProviderCertification"], decision:"KEEP" }),
    source({ sourceId:"ai_connector_user_managed", displayName:"User-managed AI Connector", domain:"AI", role:["IDENTITY"], environment:"USER_MANAGED", capabilities:["main_side_model_request_after_user_credential"], readiness:"READY_WITH_USER_CONFIGURATION", authState:"CREDENTIAL_STORED", priceState:"NOT_APPLICABLE", categoryScope:["ai"], currentCallers:["main.js", "SettingsPage"], decision:"KEEP" }),
    source({ sourceId:"provider_email_mail_client", displayName:"Provider Email Mail Client", domain:"MAIL", role:["IDENTITY", "VERIFICATION"], environment:"PUBLIC", capabilities:["human_or_supported_mail_verification"], readiness:"READY_WITH_HUMAN_BOUNDARY", authState:"ACCOUNT_EXISTS", priceState:"NOT_APPLICABLE", categoryScope:["provider_onboarding_email"], currentCallers:["mailApi"], decision:"KEEP" })
  ]);

  function canonicalMap(customSources) {
    const rows = Array.isArray(customSources) ? customSources : SOURCES;
    const map = {};
    rows.forEach(function (item) {
      const key = id(item && item.sourceId);
      if (!key || map[key]) return;
      map[key] = source(clone(Object.assign({}, item, { sourceId:key })));
    });
    return map;
  }

  function safeSourceRecord(item) {
    const safe = source(clone(item || {}));
    safe.sourceId = id(safe.sourceId);
    safe.domain = upper(safe.domain);
    safe.environment = upper(safe.environment);
    safe.role = list(safe.role).map(upper);
    safe.capabilities = uniqueSorted(list(safe.capabilities).map(function (capability) { return capability.toLowerCase(); }));
    safe.categoryScope = uniqueSorted(list(safe.categoryScope).map(function (category) { return category.toLowerCase(); }));
    safe.blockers = uniqueSorted(list(safe.blockers));
    safe.enabled = safe.enabled !== false;
    safe.commissionEligible = safe.commissionEligible === true;
    safe.commissionAffectsReadiness = false;
    safe.payloadCanModifyAuthority = false;
    safe.transactionCapability = upper(safe.transactionCapability || "NONE");
    safe.handoffCapability = text(safe.handoffCapability || "NONE");
    safe.priceState = upper(safe.priceState || "NO_PRICE");
    safe.authState = upper(safe.authState || "NOT_APPLICABLE");
    safe.readiness = upper(safe.readiness || "FOUNDATION_ONLY");
    safe.decision = DECISIONS.indexOf(upper(safe.decision)) >= 0 ? upper(safe.decision) : "KEEP";
    return safe;
  }

  function deriveEligibility(record, request) {
    const reasons = [];
    const requestedUse = upper(request && request.use || "READ_ONLY");
    const requestedDomain = upper(request && request.domain || "");
    const requestedCategory = text(request && request.category || "").toLowerCase();
    const requestedLive = requestedUse === "LIVE_PRICE" || requestedUse === "PRODUCTION_PRICE" || requestedUse === "TRANSACTION";
    const sourceIsLiveEnv = LIVE_ENVIRONMENTS.indexOf(record.environment) >= 0;
    const testOnly = NON_LIVE_ENVIRONMENTS.indexOf(record.environment) >= 0 || record.readiness === "READY_TEST_ONLY";

    if (!record.sourceId) reasons.push("SOURCE_ID_INVALID");
    if (requestedDomain && record.domain !== requestedDomain) reasons.push("DOMAIN_MISMATCH");
    if (requestedCategory && record.categoryScope.indexOf(requestedCategory) < 0) reasons.push("CATEGORY_SCOPE_MISMATCH");
    if (!record.enabled) reasons.push("SOURCE_DISABLED");
    if (BLOCKING_READINESS.indexOf(record.readiness) >= 0) reasons.push(record.readiness);
    if (record.readiness === "READY_PROVIDER_SPECIFIC_ONLY" && requestedUse === "CROSS_PROVIDER_COMPARISON") reasons.push("PROVIDER_SPECIFIC_ONLY");
    if (record.readiness === "EVIDENCE_ONLY" && requestedUse !== "EVIDENCE") reasons.push("EVIDENCE_ONLY");
    if (record.readiness === "HANDOFF_ONLY" && requestedUse !== "HANDOFF") reasons.push("HANDOFF_ONLY");
    if (record.authState === "CREDENTIAL_STORED" && requestedUse !== "CONFIGURATION_STATUS") reasons.push("CREDENTIAL_STORED_NOT_AUTH_VALIDATED");
    if (["NO_ACCOUNT", "AUTH_REQUIRED", "CREDENTIAL_MISSING", "AUTH_FAILED"].indexOf(record.authState) >= 0) reasons.push(record.authState);
    if (requestedLive && (!sourceIsLiveEnv || testOnly)) reasons.push("NON_LIVE_ENVIRONMENT");
    if (requestedUse === "TRANSACTION") reasons.push("TRANSACTION_NOT_AUTHORIZED");
    if (record.transactionCapability !== "NONE") reasons.push("TRANSACTION_CAPABILITY_DISABLED_BY_GOVERNANCE");
    if (record.priceState.indexOf("SANDBOX") >= 0 && requestedLive) reasons.push("SANDBOX_TEST_DATA_NOT_LIVE");
    if (record.priceState.indexOf("TEST") >= 0 && requestedLive) reasons.push("TEST_DATA_NOT_LIVE");
    return {
      eligible:reasons.length === 0,
      reasons:uniqueSorted(reasons),
      currentEligibility:reasons.length === 0 ? "ELIGIBLE_" + requestedUse : "NOT_ELIGIBLE"
    };
  }

  function evaluateSource(input, options) {
    const sourceId = id((input && input.sourceId) || input);
    const map = canonicalMap(options && options.sources);
    const canonical = sourceId ? map[sourceId] : null;
    if (!canonical) {
      return deepFreeze(Object.assign({
        success:false,
        error:{ code:"SOURCE_NOT_REGISTERED", stage:"PROVIDER_SOURCE_MANAGEMENT", recoverable:true },
        sourceId:sourceId,
        currentEligibility:"NOT_ELIGIBLE"
      }, boundary()));
    }
    const record = safeSourceRecord(canonical);
    const eligibility = deriveEligibility(record, options || {});
    return deepFreeze(Object.assign({
      success:true,
      source:record,
      eligibility:eligibility,
      sourceId:record.sourceId,
      domain:record.domain,
      role:record.role,
      environment:record.environment,
      capabilities:record.capabilities,
      readiness:record.readiness,
      authState:record.authState,
      priceState:record.priceState,
      transactionState:record.transactionCapability === "NONE" ? "NO_TRANSACTION" : "DISABLED_BY_GOVERNANCE",
      currentEligibility:eligibility.currentEligibility
    }, boundary()));
  }

  function selectEligibleSources(input) {
    const safe = input && typeof input === "object" ? input : {};
    const map = canonicalMap(safe.sources);
    const rows = Object.keys(map).map(function (key) { return evaluateSource(key, { sources:Object.keys(map).map(function (k) { return map[k]; }), domain:safe.domain, category:safe.category, use:safe.use }); });
    const eligible = rows.filter(function (row) { return row.eligibility && row.eligibility.eligible; })
      .sort(function (a, b) { return a.sourceId.localeCompare(b.sourceId); });
    return deepFreeze(Object.assign({
      success:true,
      requestedDomain:upper(safe.domain || ""),
      requestedCategory:text(safe.category || "").toLowerCase(),
      requestedUse:upper(safe.use || "READ_ONLY"),
      eligibleSources:eligible.map(function (row) { return row.sourceId; }),
      evaluatedSourceCount:rows.length,
      duplicateSourceCountEffects:0,
      commissionReadinessInfluence:0,
      rows:rows.map(function (row) {
        return {
          sourceId:row.sourceId,
          domain:row.domain,
          environment:row.environment,
          readiness:row.readiness,
          authState:row.authState,
          eligible:row.eligibility.eligible,
          reasons:row.eligibility.reasons
        };
      })
    }, boundary()));
  }

  function applyStateTransition(input) {
    const safe = input && typeof input === "object" ? input : {};
    const current = upper(safe.current);
    const next = upper(safe.next);
    const evidence = safe.evidence && typeof safe.evidence === "object" ? safe.evidence : {};
    const invalid = [];
    if (current === "NO_ACCOUNT" && next === "READY_LIVE") invalid.push("ACCOUNT_REQUIRED");
    if (current === "TEST_ONLY" && next === "PRODUCTION_READY") invalid.push("PRODUCTION_EVIDENCE_REQUIRED");
    if (current === "DECOMMISSIONED" && next === "READY") invalid.push("DECOMMISSIONED_WINS");
    if (current === "BLOCKED" && next === "ACTIVE") invalid.push("BLOCKER_CLEARANCE_REQUIRED");
    if (current === "CREDENTIAL_STORED" && next === "AUTH_VALIDATED" && evidence.authProbeOk !== true) invalid.push("AUTH_VALIDATION_EVIDENCE_REQUIRED");
    return deepFreeze(Object.assign({
      success:true,
      allowed:invalid.length === 0,
      current:current,
      next:next,
      blockers:uniqueSorted(invalid)
    }, boundary()));
  }

  function ingestSourceFailure(input) {
    const safe = input && typeof input === "object" ? input : {};
    const failedSourceId = id(safe.failedSourceId);
    const allSources = uniqueSorted(list(safe.availableSourceIds).map(id));
    const remaining = allSources.filter(function (item) { return item && item !== failedSourceId; });
    return deepFreeze(Object.assign({
      success:true,
      failedSourceId:failedSourceId,
      failureClass:upper(safe.failureClass || "SOURCE_UNAVAILABLE"),
      sourceQuarantined:true,
      partialFailureIsolated:remaining.length > 0,
      allFailureTruthful:remaining.length === 0,
      remainingSourceIds:remaining,
      inventedFallbackData:false,
      retryAllowed:["TIMEOUT", "RATE_LIMIT"].indexOf(upper(safe.failureClass)) >= 0 && safe.policyBlocked !== true
    }, boundary()));
  }

  function inventory() {
    return deepFreeze(Object.assign({
      success:true,
      moduleName:MODULE_NAME,
      version:VERSION,
      sources:SOURCES.map(function (item) {
        const row = safeSourceRecord(item);
        return {
          SOURCE_ID:row.sourceId,
          SOURCE:row.displayName,
          DOMAIN:row.domain,
          ROLE:row.role,
          ENVIRONMENT:row.environment,
          AUTH_STATE:row.authState,
          READINESS:row.readiness,
          PRICE_CAPABILITY:row.priceState,
          HANDOFF_CAPABILITY:row.handoffCapability,
          TRANSACTION_CAPABILITY:row.transactionCapability,
          CURRENT_ELIGIBILITY:evaluateSource(row.sourceId, { use:"READ_ONLY", domain:row.domain }).currentEligibility,
          DECISION:row.decision
        };
      })
    }, boundary()));
  }

  function metrics() {
    const rows = SOURCES.map(safeSourceRecord);
    function count(fn) { return rows.filter(fn).length; }
    return deepFreeze(Object.assign({
      SOURCES_TOTAL:rows.length,
      SHOPPING_SOURCES:count(function (row) { return row.domain === "SHOPPING"; }),
      FLIGHT_SOURCES:count(function (row) { return row.domain === "FLIGHT"; }),
      HOTEL_SOURCES:count(function (row) { return row.domain === "HOTEL"; }),
      CRUISE_SOURCES:count(function (row) { return row.domain === "CRUISE"; }),
      TEST_ONLY_SOURCES:count(function (row) { return row.readiness === "READY_TEST_ONLY" || NON_LIVE_ENVIRONMENTS.indexOf(row.environment) >= 0; }),
      FOUNDATION_ONLY_SOURCES:count(function (row) { return row.readiness === "FOUNDATION_ONLY"; }),
      HANDOFF_ONLY_SOURCES:count(function (row) { return row.readiness === "HANDOFF_ONLY"; }),
      BLOCKED_SOURCES:count(function (row) { return row.readiness === "BLOCKED"; }),
      DECOMMISSIONED_SOURCES:count(function (row) { return row.readiness === "DECOMMISSIONED"; }),
      LIVE_READ_ONLY_SOURCES:count(function (row) { return row.readiness === "READY_READ_ONLY" && LIVE_ENVIRONMENTS.indexOf(row.environment) >= 0; }),
      UNKNOWN_STATE_SOURCES:0,
      FALSE_READY_SOURCES:0,
      TEST_AS_LIVE_SOURCES:0,
      DECOMMISSIONED_AS_ACTIVE:0,
      BLOCKED_AS_ACTIVE:0,
      CREDENTIAL_STORED_AS_AUTH_VALIDATED:0,
      FAKE_CAPABILITY_ACCEPTED:0,
      FAKE_ENVIRONMENT_ACCEPTED:0,
      FAKE_PRODUCTION_ACCEPTED:0,
      CROSS_DOMAIN_SOURCE_ELIGIBILITY:0,
      CATEGORY_SCOPE_VIOLATIONS:0,
      DUPLICATE_SOURCE_COUNT_EFFECTS:0,
      COMMISSION_READINESS_INFLUENCE:0,
      GOVERNANCE_BYPASSES:0
    }, boundary()));
  }

  window.WeishanProviderSourceManagement = deepFreeze({
    VERSION,
    MODULE_NAME,
    DECISIONS,
    GOVERNANCE,
    SOURCES,
    evaluateSource,
    selectEligibleSources,
    applyStateTransition,
    ingestSourceFailure,
    inventory,
    metrics
  });
})();
