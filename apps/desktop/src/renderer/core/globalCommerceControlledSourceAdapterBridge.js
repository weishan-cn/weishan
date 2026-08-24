;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const BRIDGE_NAME = "global_commerce_controlled_source_adapter_bridge_v1";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function sourceDefinitions() {
    return {
      cheapshark:{
        sourceId:"cheapshark",
        sourceRole:"CONTROLLED_READONLY_GAME_PRICE_SOURCE",
        roles:["PRODUCT_IDENTITY", "PRICE_EVIDENCE", "AVAILABILITY_EVIDENCE", "EXACT_HANDOFF"],
        authorityPolicy:"TRUSTED_CONTROLLED_READONLY_PROVIDER_PRICE",
        supportsIdentity:"YES",
        supportsVariant:"PARTIAL",
        supportsPrice:"YES",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["US"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"CONTROLLED_READONLY_IMPLEMENTED",
        adapterImplementationStatus:"IMPLEMENTED",
        maximumEvidenceAuthority:"PROVIDER_PRICE_OBSERVATION",
        priceAuthority:"AUTHORITATIVE",
        freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:86400, maxRecentAgeSeconds:604800 },
        allowedHandoffHosts:["www.cheapshark.com"],
        limitations:[
          "Game/platform/edition semantics must remain scoped to CheapShark game identity.",
          "Provider deal observation is not a checkout guarantee.",
          "Availability means observed deal availability, not merchant stock authority."
        ]
      },
      daily_dose_tech:{
        sourceId:"daily_dose_tech",
        sourceRole:"PROVIDER_SPECIFIC_PRICE_OBSERVATION_SOURCE",
        roles:["PRODUCT_IDENTITY", "PRICE_EVIDENCE", "PROVIDER_HANDOFF"],
        authorityPolicy:"PROVIDER_SPECIFIC_OBSERVATION_ONLY",
        supportsIdentity:"PARTIAL",
        supportsVariant:"PARTIAL",
        supportsPrice:"YES",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["GLOBAL"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"CONTROLLED_READONLY_IMPLEMENTED",
        adapterImplementationStatus:"IMPLEMENTED",
        maximumEvidenceAuthority:"PROVIDER_SPECIFIC_PRICE_OBSERVATION",
        priceAuthority:"INDICATIVE",
        freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:3600, maxRecentAgeSeconds:86400 },
        allowedHandoffHosts:["dailydose.tech"],
        limitations:["Provider-specific observations are not same-provider or cross-provider comparison authority."]
      },
      open_prices:{
        sourceId:"open_prices",
        sourceRole:"PUBLIC_PRICE_EVIDENCE_SOURCE",
        roles:["PRICE_EVIDENCE"],
        authorityPolicy:"OPEN_PUBLIC_EVIDENCE_LIMITED",
        supportsIdentity:"PARTIAL",
        supportsVariant:"PARTIAL",
        supportsPrice:"PARTIAL",
        supportsCurrency:"YES",
        supportsAvailability:"NO",
        supportsHandoff:"PARTIAL",
        supportedMarkets:["EU", "GLOBAL"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"OFFLINE_EVIDENCE_FOUNDATION",
        adapterImplementationStatus:"IMPLEMENTED_LIMITED",
        maximumEvidenceAuthority:"INDICATIVE_PRICE_OBSERVATION",
        priceAuthority:"INDICATIVE",
        freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:3600, maxRecentAgeSeconds:86400 },
        allowedHandoffHosts:[],
        limitations:["Open public evidence cannot self-upgrade into current merchant authoritative price."]
      },
      multi_network_product_feed:{
        sourceId:"multi_network_product_feed",
        sourceRole:"AUTHORIZED_FEED_EVIDENCE_FOUNDATION",
        roles:["PRODUCT_IDENTITY", "PRICE_EVIDENCE", "HANDOFF_EVIDENCE"],
        authorityPolicy:"ADAPTER_CONTRACT_REQUIRED",
        supportsIdentity:"YES",
        supportsVariant:"YES",
        supportsPrice:"YES",
        supportsCurrency:"YES",
        supportsAvailability:"PARTIAL",
        supportsHandoff:"YES",
        supportedMarkets:["ADAPTER_DEFINED"],
        commercialRelationshipOptional:true,
        controlledReadStatus:"OFFLINE_FOUNDATION_ONLY",
        adapterImplementationStatus:"FOUNDATION_READY",
        maximumEvidenceAuthority:"ADAPTER_CONTRACT_LIMITED",
        priceAuthority:"UNKNOWN",
        freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:null, maxRecentAgeSeconds:null },
        allowedHandoffHosts:[],
        limitations:["Specific network permissions and hosts must be declared by a reviewed adapter contract."]
      }
    };
  }

  function safety() {
    return {
      userDecisionRequired:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionTraffic:false,
      productionAffected:false,
      checkout:false,
      payment:false,
      order:false,
      booking:false,
      ticketing:false,
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    };
  }

  function failure(code, details) {
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:"FAILED",
      code:code,
      details:Array.isArray(details) ? details.slice() : []
    }, safety()));
  }

  function buildSourceCapabilityInventory() {
    const definitions = sourceDefinitions();
    const sources = Object.keys(definitions).sort().map(function (key) {
      const source = definitions[key];
      return {
        SOURCE_ID:source.sourceId,
        SOURCE_ROLE:source.sourceRole,
        PRODUCT_IDENTITY:source.supportsIdentity,
        VARIANT:source.supportsVariant,
        PRICE:source.supportsPrice,
        CURRENCY:source.supportsCurrency,
        AVAILABILITY:source.supportsAvailability,
        HANDOFF:source.supportsHandoff,
        AUTHORITY:source.authorityPolicy,
        CONTROLLED_READ_STATUS:source.controlledReadStatus,
        ADAPTER_IMPLEMENTATION_STATUS:source.adapterImplementationStatus,
        LIMITATIONS:source.limitations.slice()
      };
    });
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:"READY",
      sources:sources,
      sourceCount:sources.length,
      credentialsIncluded:false
    }, safety()));
  }

  function steamProductIdentity(value) {
    const normalized = text(value);
    if (normalized.startsWith("steam:")) {
      return { canonicalProductId:normalized, providerProductId:normalized.slice(6) };
    }
    return normalized ? { canonicalProductId:normalized } : {};
  }

  function cheapSharkVariant(offer) {
    const safe = obj(offer);
    const inputCondition = text(safe.itemCondition || safe.condition || "NEW").toLowerCase();
    return {
      platform:"steam",
      edition:text(safe.edition || "standard").toLowerCase() || "standard",
      condition:inputCondition || "new"
    };
  }

  function normalizeCheapSharkOffer(rawOffer, source) {
    const offer = obj(rawOffer);
    const price = numberOrNull(offer.price);
    const currency = text(offer.currency).toUpperCase();
    const dealId = text(offer.offerId || offer.dealID);
    return {
      sourceId:source.sourceId,
      sourceRole:source.sourceRole,
      sourceItemId:dealId,
      offerId:dealId,
      provider:source.sourceId,
      merchant:text(offer.merchant),
      productName:text(offer.productName),
      productIdentity:steamProductIdentity(offer.canonicalProductIdentity),
      variants:cheapSharkVariant(offer),
      price:price,
      currency:currency,
      priceConditions:array(offer.priceConditions),
      priceConditionStatus:"UNCONDITIONAL",
      market:text(offer.market || "US"),
      shipping:0,
      tax:0,
      fees:0,
      landedTotal:price,
      availability:text(offer.availabilityStatus) === "OFFER_OBSERVED" ? "IN_STOCK" : "UNKNOWN",
      availabilityAuthority:text(offer.availabilityStatus) === "OFFER_OBSERVED",
      sourceStatus:text(offer.sourceStatus || "OK").toUpperCase(),
      handoffType:"PROVIDER_REDIRECT",
      handoffUrl:text(offer.handoffUrl),
      allowedHandoffHosts:source.allowedHandoffHosts.slice(),
      sourcePolicy:{
        priceAuthority:source.priceAuthority,
        freshnessPolicy:clone(source.freshnessPolicy),
        allowedHandoffHosts:source.allowedHandoffHosts.slice()
      },
      affiliateEligible:false,
      commissionEligible:false,
      commercialMetadata:clone(obj(offer.commercialMetadata)),
      observedAt:text(offer.observedAt),
      providerUpdatedAt:offer.providerUpdatedAt === null ? null : text(offer.providerUpdatedAt),
      provenance:{
        sourceRecord:dealId,
        adapterName:"global_commerce_cheapshark_controlled_readonly_adapter_v1",
        maximumEvidenceAuthority:source.maximumEvidenceAuthority,
        rawAuthorityClaimIgnored:offer.verified === true || offer.authoritative === true || text(offer.handoffConfidence)
      }
    };
  }

  function normalizeSourceOffers(input) {
    const safe = obj(input);
    const sourceId = text(safe.sourceId);
    const definitions = sourceDefinitions();
    const source = definitions[sourceId];
    if (!source) return failure("SOURCE_NOT_TRUSTED", [sourceId || "missing_source_id"]);
    if (sourceId !== "cheapshark") return failure("SOURCE_BRIDGE_NOT_IMPLEMENTED", [sourceId]);
    const offers = array(safe.offers || obj(safe.sourceResult).offers);
    const normalizedOffers = offers.map(function (offer) { return normalizeCheapSharkOffer(offer, source); });
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:"READY",
      source:clone(source),
      normalizedOffers:normalizedOffers,
      normalizedOfferCount:normalizedOffers.length
    }, safety()));
  }

  function buildProductTruthFlow(input) {
    const safe = obj(input);
    const normalized = normalizeSourceOffers(safe);
    if (normalized.status !== "READY") return normalized;
    const productTruth = window.WeishanGlobalCommerceProductTruthPipeline || {};
    if (typeof productTruth.buildGlobalCommerceProductTruthPipeline !== "function") {
      return failure("PRODUCT_TRUTH_PIPELINE_UNAVAILABLE");
    }
    const result = productTruth.buildGlobalCommerceProductTruthPipeline({
      query:safe.query,
      productIdentity:safe.productIdentity,
      requestedVariant:safe.requestedVariant,
      offers:normalized.normalizedOffers,
      now:safe.now
    });
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:result.status === "READY" ? "PRODUCT_TRUTH_READY" : result.status,
      sourceId:normalized.source.sourceId,
      sourceRole:normalized.source.sourceRole,
      source:normalized.source,
      adapterResult:{
        normalizedOfferCount:normalized.normalizedOfferCount,
        sourceRole:normalized.source.sourceRole
      },
      productTruth:result,
      trace:result.recommendation ? {
        sourceId:normalized.source.sourceId,
        sourceRecord:result.recommendation.offerId,
        adapter:"CONTROLLED_SOURCE_ADAPTER_BRIDGE",
        productTruthClassification:"ELIGIBLE",
        comparisonDecision:result.recommendation.reason,
        handoff:result.recommendation.handoffQuality
      } : null,
      controlledAdapterReady:true,
      productionReady:false
    }, safety()));
  }

  function buildAdapterReadinessChecklist(input) {
    const safe = obj(input);
    const sourceId = text(safe.sourceId);
    const source = sourceDefinitions()[sourceId];
    if (!source) return failure("SOURCE_NOT_TRUSTED", [sourceId || "missing_source_id"]);
    const identityReady = source.supportsIdentity === "YES" || source.supportsIdentity === "PARTIAL";
    const priceReady = source.supportsPrice === "YES" || source.supportsPrice === "PARTIAL";
    const handoffReady = source.supportsHandoff === "YES" || source.supportsHandoff === "PARTIAL";
    const productTruthReady = source.sourceId === "cheapshark" && identityReady && priceReady && handoffReady;
    return deepFreeze(Object.assign({
      bridgeName:BRIDGE_NAME,
      appVersion:VERSION,
      status:"READY",
      sourceId:source.sourceId,
      readiness:{
        IDENTITY_READY:identityReady,
        PRICE_READY:priceReady,
        HANDOFF_READY:handoffReady,
        PRODUCT_TRUTH_READY:productTruthReady,
        CONTROLLED_ADAPTER_READY:productTruthReady,
        PRODUCTION_READY:false
      },
      limitations:source.limitations.slice()
    }, safety()));
  }

  window.WeishanGlobalCommerceControlledSourceAdapterBridge = Object.freeze({
    VERSION,
    BRIDGE_NAME,
    buildSourceCapabilityInventory,
    normalizeSourceOffers,
    buildProductTruthFlow,
    buildAdapterReadinessChecklist
  });
})();
