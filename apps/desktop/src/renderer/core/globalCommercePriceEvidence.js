;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODEL_NAME = "global_commerce_price_evidence_v1";
  const EVIDENCE_TYPES = Object.freeze([
    "OFFICIAL_LIVE_API",
    "OFFICIAL_PROVIDER_FEED",
    "MERCHANT_OFFICIAL_FEED",
    "MERCHANT_PUBLIC_STRUCTURED_OFFER",
    "AUTHORIZED_AFFILIATE_CATALOG",
    "PRICE_OBSERVATION_EVIDENCE"
  ]);
  const AUTHORITIES = Object.freeze([
    "AUTHORITATIVE_PROVIDER",
    "OFFICIAL_MERCHANT",
    "AUTHORIZED_CATALOG",
    "PUBLIC_MERCHANT_EVIDENCE",
    "HISTORICAL_OBSERVATION"
  ]);
  const AVAILABILITY = Object.freeze(["IN_STOCK", "OUT_OF_STOCK", "LIMITED", "PREORDER", "BACKORDER", "UNKNOWN"]);
  const CONDITIONS = Object.freeze([
    "MEMBERSHIP", "COUPON", "NEW_USER", "APP_ONLY", "TRADE_IN", "REGION_SPECIFIC",
    "LOGIN_ONLY", "TAX_EXCLUSIVE", "SHIPPING_EXCLUSIVE", "BUNDLE"
  ]);
  const HANDOFF_TYPES = Object.freeze([
    "OFFICIAL_MERCHANT_PRODUCT", "PROVIDER_REDIRECT", "AUTHORIZED_DEEPLINK", "PROVIDER_EVIDENCE_PAGE", "NONE"
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function failure(code, detail) {
    return deepFreeze({
      success:false,
      error:{ code:code, stage:"PRICE_EVIDENCE", recoverable:true, detail:detail || code },
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionTraffic:false,
      productionAffected:false
    });
  }

  function guard(input) {
    const api = window.WeishanGlobalCommerceInputGuard || {};
    return typeof api.guardAndCloneCommerceInput === "function"
      ? api.guardAndCloneCommerceInput(input)
      : failure("COMMERCE_INPUT_REJECTED", "input_guard_unavailable");
  }

  function text(value) { return String(value == null ? "" : value).trim(); }
  function validEnum(value, allowed) { return allowed.indexOf(text(value)) >= 0 ? text(value) : null; }
  function validIso(value) {
    const normalized = text(value);
    return normalized && Number.isFinite(Date.parse(normalized)) ? normalized : null;
  }
  function validCurrency(value) {
    const normalized = text(value).toUpperCase();
    return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
  }
  function validHost(host) {
    const normalized = text(host).toLowerCase();
    return /^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(normalized) ? normalized : null;
  }
  function validHttpsUrl(value, allowedHosts) {
    try {
      const parsed = new URL(text(value));
      return parsed.protocol === "https:" && !parsed.username && !parsed.password &&
        allowedHosts.indexOf(parsed.hostname.toLowerCase()) >= 0 ? parsed.toString() : null;
    } catch (_) {
      return null;
    }
  }
  function normalizedIdentity(value) {
    const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const keys = ["gtin", "ean", "upc", "isbn", "mpn", "providerProductId", "sku"];
    const output = {};
    keys.forEach(function (key) {
      const normalized = text(input[key]);
      if (normalized) output[key] = normalized;
    });
    return Object.keys(output).length ? output : null;
  }
  function sourcePriority(evidenceType) {
    return {
      OFFICIAL_LIVE_API:1,
      OFFICIAL_PROVIDER_FEED:2,
      MERCHANT_OFFICIAL_FEED:2,
      MERCHANT_PUBLIC_STRUCTURED_OFFER:3,
      AUTHORIZED_AFFILIATE_CATALOG:4,
      PRICE_OBSERVATION_EVIDENCE:5
    }[evidenceType] || null;
  }
  function freshness(providerUpdatedAt, sourceObservationDate, now) {
    if (!providerUpdatedAt) {
      return sourceObservationDate ? { status:"HISTORICAL_OBSERVATION", ageSeconds:null } : { status:"UNKNOWN", ageSeconds:null };
    }
    const freshnessApi = window.WeishanGlobalShoppingPriceFreshnessModel || {};
    if (typeof freshnessApi.buildGlobalShoppingPriceFreshnessModel === "function") {
      const model = freshnessApi.buildGlobalShoppingPriceFreshnessModel({ fetchedAt:providerUpdatedAt, now:now });
      return { status:String(model.freshnessLevel || "unknown").toUpperCase(), ageSeconds:model.ageSeconds };
    }
    return { status:"KNOWN", ageSeconds:null };
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
      ticketing:false
    };
  }

  function createPriceEvidence(input) {
    const checked = guard(input);
    if (!checked.success) return failure("COMMERCE_INPUT_REJECTED", "input_rejected");
    const source = checked.value;
    if (!source || typeof source !== "object" || Array.isArray(source)) return failure("EVIDENCE_INPUT_INVALID");

    const evidenceType = validEnum(source.evidenceType, EVIDENCE_TYPES);
    if (!evidenceType) return failure("EVIDENCE_TYPE_INVALID");
    const identity = normalizedIdentity(source.productIdentity);
    if (!identity) return failure("PRODUCT_IDENTITY_REQUIRED", "title_only_identity_is_not_sufficient");
    if (typeof source.price !== "number" || !Number.isFinite(source.price) || source.price < 0) return failure("PRICE_INVALID");
    const currency = validCurrency(source.currency);
    if (!currency) return failure("CURRENCY_REQUIRED");

    const policy = source.sourcePolicy && typeof source.sourcePolicy === "object" && !Array.isArray(source.sourcePolicy)
      ? source.sourcePolicy : {};
    const sourceId = text(policy.sourceId);
    const authority = validEnum(policy.authority, AUTHORITIES);
    const reviewState = text(policy.reviewState);
    const allowedUse = text(policy.allowedUse);
    const displayAuthorization = text(policy.displayAuthorization);
    const allowedHandoffHosts = Array.isArray(policy.allowedHandoffHosts)
      ? policy.allowedHandoffHosts.map(validHost).filter(Boolean) : [];
    if (!sourceId || !authority || !reviewState || !allowedUse || !displayAuthorization) {
      return failure("SOURCE_POLICY_INCOMPLETE");
    }

    const retrievedAt = validIso(source.retrievedAt);
    const observedAt = validIso(source.observedAt);
    const providerUpdatedAt = source.providerUpdatedAt === null ? null : validIso(source.providerUpdatedAt);
    const sourceObservationDate = source.sourceObservationDate === null ? null : validIso(source.sourceObservationDate);
    if (!retrievedAt || !observedAt || (source.providerUpdatedAt !== null && !providerUpdatedAt) ||
        (source.sourceObservationDate !== null && !sourceObservationDate)) return failure("TIMESTAMP_INVALID");

    const declaredAvailability = validEnum(source.availability, AVAILABILITY) || "UNKNOWN";
    const availabilityAuthority = source.availabilityAuthority === true;
    const availability = availabilityAuthority ? declaredAvailability : "UNKNOWN";
    const purchaseAuthority = source.purchaseAuthority === true;
    const conditions = Array.isArray(source.priceConditions)
      ? source.priceConditions.map(function (item) { return validEnum(item, CONDITIONS); }).filter(Boolean) : [];
    if (Array.isArray(source.priceConditions) && conditions.length !== source.priceConditions.length) return failure("PRICE_CONDITION_INVALID");
    const conditionStatus = conditions.length ? "CONDITIONAL" : (source.priceConditionsVerified === true ? "UNCONDITIONAL_VERIFIED" : "PRICE_CONDITIONS_UNKNOWN");

    const handoffType = validEnum(source.handoffType || "NONE", HANDOFF_TYPES);
    if (!handoffType) return failure("HANDOFF_TYPE_INVALID");
    const handoffUrl = handoffType === "NONE" ? null : validHttpsUrl(source.handoffUrl, allowedHandoffHosts);
    if (handoffType !== "NONE" && !handoffUrl) return failure("HANDOFF_NOT_AUTHORIZED");

    const provenance = source.provenance && typeof source.provenance === "object" && !Array.isArray(source.provenance)
      ? source.provenance : {};
    if (!text(provenance.sourceUrl) || !validHttpsUrl(provenance.sourceUrl, allowedHandoffHosts)) {
      return failure("PROVENANCE_INVALID");
    }
    const priceFreshness = freshness(providerUpdatedAt, sourceObservationDate, source.now);
    const comparisonEligible = source.comparisonEligible === true &&
      displayAuthorization === "AUTHORIZED_FOR_COMPARISON" && conditionStatus !== "PRICE_CONDITIONS_UNKNOWN";

    return deepFreeze({
      success:true,
      evidence:Object.assign({
        modelName:MODEL_NAME,
        appVersion:VERSION,
        evidenceId:text(source.evidenceId) || [sourceId, evidenceType, observedAt, String(source.price), currency].join(":"),
        provider:text(source.provider) || sourceId,
        sourceId:sourceId,
        sourceClass:text(source.sourceClass) || "PRICE_EVIDENCE_SOURCE",
        evidenceType:evidenceType,
        sourcePriority:sourcePriority(evidenceType),
        productIdentity:identity,
        productName:text(source.productName) || null,
        itemCondition:text(source.itemCondition) || null,
        merchantIdentity:text(source.merchantIdentity) || null,
        price:source.price,
        currency:currency,
        observedAt:observedAt,
        retrievedAt:retrievedAt,
        providerUpdatedAt:providerUpdatedAt,
        sourceObservationDate:sourceObservationDate,
        freshnessStatus:priceFreshness.status,
        freshnessAgeSeconds:priceFreshness.ageSeconds,
        availability:availability,
        availabilityAuthority:availabilityAuthority,
        purchaseAuthority:purchaseAuthority,
        handoffUrl:handoffUrl,
        handoffType:handoffType,
        comparisonEligible:comparisonEligible,
        authorizationScope:displayAuthorization,
        priceConditions:conditions,
        priceConditionStatus:conditionStatus,
        sourcePolicy:{
          sourceId:sourceId,
          authority:authority,
          reviewState:reviewState,
          allowedUse:allowedUse,
          cachingRequirement:text(policy.cachingRequirement) || "UNKNOWN",
          attributionRequired:policy.attributionRequired === true,
          displayAuthorization:displayAuthorization,
          allowedHandoffHosts:allowedHandoffHosts
        },
        provenance:{
          sourceUrl:validHttpsUrl(provenance.sourceUrl, allowedHandoffHosts),
          sourceRecordId:text(provenance.sourceRecordId) || null,
          extractionMethod:text(provenance.extractionMethod) || "NORMALIZED_PROVIDER_RECORD",
          retrievedAt:retrievedAt,
          providerTimestampUsed:providerUpdatedAt !== null,
          retrievalTimeIsProviderFreshness:false
        }
      }, safety())
    });
  }

  window.WeishanGlobalCommercePriceEvidence = Object.freeze({
    VERSION,
    MODEL_NAME,
    EVIDENCE_TYPES,
    AUTHORITIES,
    AVAILABILITY,
    CONDITIONS,
    HANDOFF_TYPES,
    createPriceEvidence
  });
})();
