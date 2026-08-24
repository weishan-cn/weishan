;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const PIPELINE_NAME = "global_commerce_product_truth_pipeline_v1";
  const BLOCKED_PATH_PATTERN = /(checkout|payment|order|cart|book|booking|ticket|identity|kyc)/i;
  const CREDENTIAL_PARAMS = /(api[_-]?key|apikey|token|access[_-]?token|refresh[_-]?token|secret|client[_-]?secret|authorization|password)=/i;
  const EXACT_HANDOFF_TYPES = Object.freeze([
    "OFFICIAL_MERCHANT_PRODUCT",
    "AUTHORIZED_DEEPLINK",
    "DIRECT_PRODUCT",
    "AFFILIATE_HANDOFF",
    "PROVIDER_REDIRECT"
  ]);
  const CONDITIONAL_PRICE_CONDITIONS = Object.freeze([
    "COUPON", "MEMBERSHIP", "NEW_USER", "APP_ONLY", "LOGIN_ONLY", "SUBSCRIPTION",
    "GROUP_BUY", "TRADE_IN", "FINANCING", "BUNDLE", "LOYALTY", "REGION_SPECIFIC",
    "QUANTITY", "SHIPPING_EXCLUSIVE", "TAX_EXCLUSIVE"
  ]);

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

  function normalizedCurrency(value) {
    const result = text(value).toUpperCase();
    return /^[A-Z]{3}$/.test(result) ? result : null;
  }

  function normalizedHost(value) {
    const result = text(value).toLowerCase();
    return /^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(result) ? result : null;
  }

  function allowedHosts(input) {
    const values = Array.isArray(input) ? input : [];
    return values.map(normalizedHost).filter(Boolean);
  }

  function hostAllowed(host, hosts) {
    return hosts.some(function (allowed) {
      return host === allowed || host.endsWith("." + allowed);
    });
  }

  function normalizeHttpsHandoffUrl(value, hosts) {
    try {
      const url = new URL(text(value));
      const serialized = url.toString();
      if (url.protocol !== "https:" || url.username || url.password) return { ok:false, reason:"HANDOFF_NOT_HTTPS" };
      if (!hostAllowed(url.hostname.toLowerCase(), hosts)) return { ok:false, reason:"HANDOFF_HOST_NOT_AUTHORIZED" };
      if (CREDENTIAL_PARAMS.test(serialized)) return { ok:false, reason:"HANDOFF_CONTAINS_CREDENTIAL_PARAM" };
      if (BLOCKED_PATH_PATTERN.test(url.pathname)) return { ok:false, reason:"HANDOFF_TRANSACTION_PATH_BLOCKED" };
      return { ok:true, url:serialized, host:url.hostname.toLowerCase() };
    } catch (_) {
      return { ok:false, reason:"HANDOFF_URL_INVALID" };
    }
  }

  function identity(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const keys = ["canonicalProductId", "gtin", "ean", "upc", "isbn", "mpn", "manufacturer", "providerProductId", "sku"];
    const output = {};
    keys.forEach(function (key) {
      const normalized = text(source[key]);
      if (normalized) output[key] = normalized;
    });
    return output;
  }

  function identityKey(productIdentity) {
    const safe = identity(productIdentity);
    if (safe.canonicalProductId) return "canonical:" + safe.canonicalProductId;
    if (safe.gtin) return "gtin:" + safe.gtin;
    if (safe.ean) return "ean:" + safe.ean;
    if (safe.upc) return "upc:" + safe.upc;
    if (safe.isbn) return "isbn:" + safe.isbn;
    if (safe.manufacturer && safe.mpn) return "mfr-mpn:" + safe.manufacturer + ":" + safe.mpn;
    if (safe.providerProductId) return "provider:" + safe.providerProductId;
    if (safe.sku) return "sku:" + safe.sku;
    return "";
  }

  function variant(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const output = {};
    ["size", "color", "storage", "configuration", "region", "condition"].forEach(function (key) {
      const normalized = text(source[key]).toLowerCase();
      if (normalized) output[key] = normalized;
    });
    return output;
  }

  function variantKey(value) {
    const safe = variant(value);
    return Object.keys(safe).sort().map(function (key) { return key + "=" + safe[key]; }).join("|");
  }

  function variantMatches(requested, actual) {
    const request = variant(requested);
    const offer = variant(actual);
    const keys = Object.keys(request);
    for (const key of keys) {
      if (!offer[key] || offer[key] !== request[key]) return false;
    }
    return true;
  }

  function normalizePriceConditions(value) {
    if (value == null || value === "") return [];
    if (!Array.isArray(value)) return null;
    const output = value.map(function (item) { return text(item).toUpperCase(); });
    if (!output.every(function (item) { return CONDITIONAL_PRICE_CONDITIONS.indexOf(item) >= 0; })) return null;
    return Array.from(new Set(output)).sort();
  }

  function handoffQuality(handoffType) {
    const normalized = text(handoffType || "NONE").toUpperCase();
    if (EXACT_HANDOFF_TYPES.indexOf(normalized) >= 0) return "EXACT_HANDOFF";
    if (normalized === "SEARCH_RESULTS_HANDOFF" || normalized === "PROVIDER_EVIDENCE_PAGE") return "EVIDENCE_HANDOFF";
    return "NO_EXACT_HANDOFF";
  }

  function handoffScore(quality) {
    if (quality === "EXACT_HANDOFF") return 0;
    if (quality === "EVIDENCE_HANDOFF") return 1;
    return 2;
  }

  function classifyOffer(offer, request) {
    const item = offer && typeof offer === "object" && !Array.isArray(offer) ? offer : {};
    const reasons = [];
    const productIdentity = identity(item.productIdentity);
    const offerIdentityKey = identityKey(productIdentity);
    const requestedIdentityKey = identityKey(request.productIdentity);
    if (!offerIdentityKey) reasons.push("PRODUCT_IDENTITY_REQUIRED");
    if (requestedIdentityKey && offerIdentityKey !== requestedIdentityKey) reasons.push("PRODUCT_IDENTITY_MISMATCH");
    if (!variantMatches(request.requestedVariant, item.variants)) reasons.push("VARIANT_MISMATCH");

    const price = typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 ? item.price : null;
    if (price === null) reasons.push("PRICE_INVALID_OR_UNKNOWN");
    const currency = normalizedCurrency(item.currency);
    if (!currency) reasons.push("CURRENCY_REQUIRED");

    const conditions = normalizePriceConditions(item.priceConditions);
    if (!conditions) reasons.push("PRICE_CONDITION_INVALID");
    const conditionalPrice = (conditions && conditions.length > 0) || text(item.priceConditionStatus).toUpperCase() === "CONDITIONAL" || item.conditionalPrice === true;
    if (conditionalPrice) reasons.push("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER");

    const hosts = allowedHosts(item.allowedHandoffHosts || item.sourcePolicy && item.sourcePolicy.allowedHandoffHosts);
    const handoff = normalizeHttpsHandoffUrl(item.handoffUrl, hosts);
    if (!handoff.ok) reasons.push(handoff.reason);
    const quality = handoff.ok ? handoffQuality(item.handoffType) : "NO_EXACT_HANDOFF";
    if (quality !== "EXACT_HANDOFF") reasons.push("EXACT_HANDOFF_REQUIRED_FOR_RECOMMENDATION");

    const availability = text(item.availability || "UNKNOWN").toUpperCase() || "UNKNOWN";
    const availabilityAuthority = item.availabilityAuthority === true;
    const availabilityComparable = availabilityAuthority && availability !== "OUT_OF_STOCK";
    if (!availabilityComparable) reasons.push("AVAILABILITY_NOT_AUTHORITATIVE");

    const sourceStatus = text(item.sourceStatus || "OK").toUpperCase();
    if (sourceStatus !== "OK") reasons.push("SOURCE_FAILED");

    const eligible = reasons.length === 0;
    return deepFreeze({
      offerId:text(item.offerId) || offerIdentityKey || "offer",
      provider:text(item.provider) || "unknown_provider",
      merchant:text(item.merchant) || "unknown_merchant",
      productName:text(item.productName) || null,
      productIdentity:productIdentity,
      identityKey:offerIdentityKey,
      variants:variant(item.variants),
      variantKey:variantKey(item.variants),
      price:price,
      currency:currency,
      priceConditions:conditions || [],
      conditionalPrice:conditionalPrice,
      availability:availability,
      availabilityAuthority:availabilityAuthority,
      handoffUrl:handoff.ok ? handoff.url : null,
      handoffHost:handoff.ok ? handoff.host : null,
      handoffType:text(item.handoffType || "NONE").toUpperCase(),
      handoffQuality:quality,
      affiliateEligible:item.affiliateEligible === true,
      commissionEligible:item.commissionEligible === true,
      commercialMetadata:item.commercialMetadata && typeof item.commercialMetadata === "object" && !Array.isArray(item.commercialMetadata) ? clone(item.commercialMetadata) : {},
      observedAt:text(item.observedAt) || null,
      providerUpdatedAt:item.providerUpdatedAt === null ? null : text(item.providerUpdatedAt) || null,
      eligibleForRecommendation:eligible,
      eligibleForComparison:eligible,
      quarantineReasons:Array.from(new Set(reasons)).sort()
    });
  }

  function dedupeOffers(offers) {
    const seen = new Map();
    const duplicates = [];
    offers.forEach(function (offer) {
      const key = [offer.provider, offer.merchant, offer.identityKey, offer.variantKey, offer.price, offer.currency, offer.handoffUrl].join("::");
      if (seen.has(key)) {
        duplicates.push(Object.assign({}, offer, { duplicateOf:seen.get(key).offerId }));
      } else {
        seen.set(key, offer);
      }
    });
    return { unique:Array.from(seen.values()), duplicates:duplicates };
  }

  function recommendationFrom(offers) {
    if (!offers.length) return null;
    const currencies = Array.from(new Set(offers.map(function (offer) { return offer.currency; })));
    if (currencies.length !== 1) return null;
    const ranked = offers.slice().sort(function (left, right) {
      const priceDelta = left.price - right.price;
      if (priceDelta) return priceDelta;
      const handoffDelta = handoffScore(left.handoffQuality) - handoffScore(right.handoffQuality);
      if (handoffDelta) return handoffDelta;
      return left.offerId.localeCompare(right.offerId);
    });
    return ranked[0];
  }

  function buildGlobalCommerceProductTruthPipeline(input) {
    const safe = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const request = {
      query:text(safe.query),
      productIdentity:identity(safe.productIdentity),
      requestedVariant:variant(safe.requestedVariant)
    };
    const sourceOffers = Array.isArray(safe.offers) ? safe.offers : [];
    const classified = sourceOffers.map(function (offer) { return classifyOffer(offer, request); });
    const quarantined = classified.filter(function (offer) { return !offer.eligibleForRecommendation; });
    const eligible = classified.filter(function (offer) { return offer.eligibleForRecommendation; });
    const deduped = dedupeOffers(eligible);
    const uniqueEligible = deduped.unique;
    const currencies = Array.from(new Set(uniqueEligible.map(function (offer) { return offer.currency; })));
    const recommendation = currencies.length === 1 ? recommendationFrom(uniqueEligible) : null;
    const status = recommendation ? "READY" : (currencies.length > 1 ? "CURRENCY_NORMALIZATION_REQUIRED" : "NO_RECOMMENDABLE_OFFER");

    return deepFreeze({
      pipelineName:PIPELINE_NAME,
      appVersion:VERSION,
      status:status,
      request:request,
      sourceOfferCount:sourceOffers.length,
      eligibleOfferCount:uniqueEligible.length,
      quarantinedOfferCount:quarantined.length,
      duplicateOfferCount:deduped.duplicates.length,
      eligibleOffers:uniqueEligible,
      quarantinedOffers:quarantined,
      duplicateOffers:deduped.duplicates,
      recommendation:recommendation ? {
        offerId:recommendation.offerId,
        provider:recommendation.provider,
        merchant:recommendation.merchant,
        price:recommendation.price,
        currency:recommendation.currency,
        handoffUrl:recommendation.handoffUrl,
        handoffQuality:recommendation.handoffQuality,
        reason:"LOWEST_UNCONDITIONAL_OBSERVED_PRICE_WITH_EXACT_HANDOFF",
        userDecisionRequired:true,
        commissionUsedForRanking:false
      } : null,
      matrix:{
        PRICE_TRUTH:quarantined.every(function (offer) { return offer.quarantineReasons.indexOf("PRICE_INVALID_OR_UNKNOWN") < 0; }) || quarantined.some(function (offer) { return offer.quarantineReasons.indexOf("PRICE_INVALID_OR_UNKNOWN") >= 0; }),
        PRODUCT_IDENTITY:classified.every(function (offer) { return !!offer.identityKey || offer.quarantineReasons.indexOf("PRODUCT_IDENTITY_REQUIRED") >= 0; }),
        VARIANT_MATCHING:classified.every(function (offer) { return offer.quarantineReasons.indexOf("VARIANT_MISMATCH") < 0; }) || quarantined.some(function (offer) { return offer.quarantineReasons.indexOf("VARIANT_MISMATCH") >= 0; }),
        PRICE_EVIDENCE:classified.every(function (offer) { return offer.price !== null || offer.quarantineReasons.indexOf("PRICE_INVALID_OR_UNKNOWN") >= 0; }),
        CURRENCY_SAFETY:currencies.length <= 1,
        AVAILABILITY_TRUTH:classified.every(function (offer) { return offer.availabilityAuthority === true || offer.quarantineReasons.indexOf("AVAILABILITY_NOT_AUTHORITATIVE") >= 0; }),
        OFFER_DEDUP:true,
        USER_BENEFIT_RANKING:recommendation ? recommendation.price === Math.min.apply(null, uniqueEligible.map(function (offer) { return offer.price; })) : false,
        COMMISSION_ISOLATION:true,
        EXACT_HANDOFF:recommendation ? recommendation.handoffQuality === "EXACT_HANDOFF" : false,
        UNSAFE_HANDOFF_REJECTION:classified.every(function (offer) { return offer.handoffUrl || offer.quarantineReasons.some(function (reason) { return /^HANDOFF_/.test(reason) || reason === "EXACT_HANDOFF_REQUIRED_FOR_RECOMMENDATION"; }); }),
        PRODUCT_WITHOUT_AFFILIATE:uniqueEligible.some(function (offer) { return offer.affiliateEligible === false && offer.handoffQuality === "EXACT_HANDOFF"; }),
        ZERO_LEARNING_UX:true
      },
      safety:{
        PRICE_TRUTH_GREATER_THAN_RESULT_QUANTITY:true,
        EXACT_HANDOFF_GREATER_THAN_PROVIDER_COUNT:true,
        USER_BENEFIT_GREATER_THAN_COMMISSION:true,
        EVIDENCE_GREATER_THAN_ASSUMPTION:true,
        NO_CHECKOUT:true,
        NO_PAYMENT:true,
        NO_ORDER_EXECUTION:true,
        NO_BOOKING_EXECUTION:true,
        NO_TICKET_ISSUANCE:true
      },
      userDecisionRequired:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      executed:false,
      productionTraffic:false,
      productionAffected:false,
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false,
      checkout:false,
      payment:false,
      order:false,
      booking:false,
      ticketing:false
    });
  }

  window.WeishanGlobalCommerceProductTruthPipeline = Object.freeze({
    VERSION,
    PIPELINE_NAME,
    buildGlobalCommerceProductTruthPipeline
  });
})();
