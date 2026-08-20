;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const PRICE_CONDITIONS = Object.freeze(["COUPON", "MEMBERSHIP", "NEW_USER", "APP_ONLY", "LOGIN_ONLY", "SUBSCRIPTION", "GROUP_BUY", "TRADE_IN", "FINANCING", "BUNDLE", "LOYALTY", "REGION_SPECIFIC", "QUANTITY", "SHIPPING_EXCLUSIVE", "TAX_EXCLUSIVE"]);
  const INCLUSION_STATES = Object.freeze(["INCLUDED", "EXCLUDED", "UNKNOWN"]);
  const CONDITIONS = Object.freeze(["NEW", "USED", "REFURBISHED", "UNKNOWN"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function safety() {
    return { userDecisionRequired:true, executionGate:"CLOSED", authorizesExecution:false, executed:false, productionTraffic:false, productionAffected:false, checkout:false, payment:false, order:false, booking:false, ticketing:false, WEISHAN_PAYS_PROVIDER:false, PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false };
  }
  function failure(code) {
    return deepFreeze(Object.assign({ success:false, error:{ code:code, stage:"PRODUCT_FEED_NORMALIZATION", recoverable:true, message:"Product feed offer could not be normalized safely." } }, safety()));
  }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function get(record, field) { return field ? record[field] : null; }
  function number(value) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null; }
  function currency(value) { const result = text(value).toUpperCase(); return /^[A-Z]{3}$/.test(result) ? result : null; }
  function timestamp(value, fallback) {
    const result = text(value);
    if (!result) return fallback || "UNKNOWN";
    if (result && Number.isFinite(Date.parse(result))) return result;
    return null;
  }
  function enumValue(value, allowed, fallback) { const normalized = text(value).toUpperCase(); return allowed.indexOf(normalized) >= 0 ? normalized : fallback; }
  function normalizeIdentity(record, mappings, descriptor) {
    const identity = {};
    ["gtin", "ean", "upc", "isbn", "mpn", "manufacturer", "merchantSku", "networkProductId"].forEach(function (key) {
      const value = text(get(record, mappings[key]));
      if (value) identity[key] = value;
    });
    let basis = "NONE";
    if (identity.gtin || identity.ean || identity.upc || identity.isbn) basis = "GLOBAL_IDENTIFIER";
    else if (identity.mpn && identity.manufacturer) basis = "MANUFACTURER_PART";
    else if (identity.merchantSku && descriptor.merchant) basis = "MERCHANT_SCOPED_SKU";
    else if (identity.networkProductId && descriptor.network) basis = "NETWORK_SCOPED_PRODUCT";
    return { identity:identity, basis:basis, exactEligible:basis === "GLOBAL_IDENTIFIER" || basis === "MANUFACTURER_PART" };
  }
  function evidenceIdentity(identity) {
    const output = {};
    ["gtin", "ean", "upc", "isbn", "mpn"].forEach(function (key) { if (identity[key]) output[key] = identity[key]; });
    if (identity.networkProductId) output.providerProductId = identity.networkProductId;
    if (identity.merchantSku) output.sku = identity.merchantSku;
    return output;
  }
  function normalizePriceConditions(value) {
    if (value === null || value === undefined || value === "") return [];
    if (!Array.isArray(value)) return null;
    const normalized = value.map(function (item) { return text(item).toUpperCase(); });
    return normalized.every(function (item) { return PRICE_CONDITIONS.indexOf(item) >= 0; }) ? Array.from(new Set(normalized)).sort() : null;
  }
  function normalizeCommercial(record) {
    const commercial = record.commercialMetadata;
    if (!commercial || typeof commercial !== "object" || Array.isArray(commercial)) return {};
    const output = {};
    ["commission", "epc", "payout", "conversion", "affiliateRate"].forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(commercial, key) && ["string", "number"].indexOf(typeof commercial[key]) >= 0) output[key] = commercial[key];
    });
    return output;
  }
  function normalizeFeedOffer(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    const adapterApi = window.WeishanGlobalCommerceFeedAdapterContract || {};
    const evidenceApi = window.WeishanGlobalCommercePriceEvidence || {};
    if (typeof security.clonePlain !== "function" || typeof adapterApi.createAdapterContract !== "function" || typeof evidenceApi.createPriceEvidence !== "function") return failure("FEED_FOUNDATION_DEPENDENCY_UNAVAILABLE");
    const checked = security.clonePlain(input);
    if (!checked.success) return failure("FEED_RECORD_INPUT_REJECTED");
    const source = checked.value;
    const contractResult = adapterApi.createAdapterContract(source.adapterContract);
    if (!contractResult.success) return failure("ADAPTER_CONTRACT_INVALID");
    const contract = contractResult.contract;
    const descriptor = contract.sourceDescriptor;
    const recordCheck = security.clonePlain(source.record, { maxRows:50, maxFields:80, maxFieldLength:20000 });
    if (!recordCheck.success) return failure("FEED_RECORD_REJECTED");
    const record = recordCheck.value;
    const mappings = contract.fieldMappings;
    const identityResult = normalizeIdentity(record, mappings, descriptor);
    if (identityResult.basis === "NONE") return failure("PRODUCT_IDENTITY_REQUIRED");
    const currentPrice = number(get(record, mappings.currentPrice));
    const salePrice = number(get(record, mappings.salePrice));
    const listPrice = number(get(record, mappings.listPrice));
    const observedPrice = salePrice !== null ? salePrice : currentPrice;
    if (observedPrice === null) return failure("CURRENT_PRICE_REQUIRED");
    const isoCurrency = currency(get(record, mappings.currency));
    if (!isoCurrency) return failure("CURRENCY_NORMALIZATION_REQUIRED");
    const priceConditions = normalizePriceConditions(get(record, mappings.priceConditions));
    if (!priceConditions) return failure("PRICE_CONDITION_INVALID");
    const handoffUrlValue = get(record, mappings.handoffUrl);
    const handoff = contract.handoffType === "NONE" ? { success:true, url:null } : security.validateHttpsUrl(handoffUrlValue, contract.endpointHostPolicy.allowedHosts);
    if (!handoff.success) return failure("HANDOFF_NOT_AUTHORIZED");
    const canonicalValue = get(record, mappings.canonicalProductUrl);
    const canonical = canonicalValue ? security.validateHttpsUrl(canonicalValue, contract.endpointHostPolicy.allowedHosts) : { success:true, url:null };
    if (!canonical.success) return failure("CANONICAL_PRODUCT_URL_NOT_AUTHORIZED");
    const rawAvailability = text(get(record, mappings.availability));
    const mappedAvailability = text(contract.availabilityMapping[rawAvailability]).toUpperCase();
    const availability = contract.availabilityAuthority && ["IN_STOCK", "OUT_OF_STOCK", "LIMITED", "PREORDER", "BACKORDER"].indexOf(mappedAvailability) >= 0 ? mappedAvailability : "UNKNOWN";
    const rawCondition = text(get(record, mappings.itemCondition));
    const itemCondition = enumValue(contract.itemConditionMapping[rawCondition], CONDITIONS, "UNKNOWN");
    const shipping = enumValue(get(record, mappings.shippingInclusion), INCLUSION_STATES, "UNKNOWN");
    const tax = enumValue(get(record, mappings.taxInclusion), INCLUSION_STATES, "UNKNOWN");
    const observedAt = timestamp(get(record, mappings.observedAt), descriptor.retrievedAt === "UNKNOWN" ? null : descriptor.retrievedAt);
    if (!observedAt || observedAt === "UNKNOWN" || descriptor.retrievedAt === "UNKNOWN") return failure("OBSERVATION_TIMESTAMP_REQUIRED");
    const providerUpdatedAt = timestamp(get(record, mappings.providerUpdatedAt), descriptor.providerUpdatedAt);
    const feedGeneratedAt = timestamp(get(record, mappings.feedGeneratedAt), descriptor.feedGeneratedAt);
    if (!providerUpdatedAt || !feedGeneratedAt) return failure("PROVIDER_TIMESTAMP_INVALID");
    const variants = {
      size:text(get(record, mappings.variantSize)) || null, color:text(get(record, mappings.variantColor)) || null,
      storage:text(get(record, mappings.variantStorage)) || null, configuration:text(get(record, mappings.variantConfiguration)) || null,
      region:text(get(record, mappings.variantRegion)) || null
    };
    const merchant = text(get(record, mappings.merchant)) || descriptor.merchant;
    const seller = text(get(record, mappings.seller)) || null;
    const offerId = text(get(record, mappings.offerId));
    const evidenceId = [descriptor.sourceId, descriptor.feedId, identityResult.basis, Object.values(identityResult.identity).join("-"), offerId || observedAt].join(":");
    const comparisonAllowed = descriptor.comparisonPermission === "ALLOWED" && descriptor.displayPermission === "ALLOWED" && descriptor.providerCostPolicy === "FREE_AUTHORIZED" && identityResult.exactEligible && itemCondition === "NEW" && priceConditions.length === 0;
    const evidence = evidenceApi.createPriceEvidence({
      evidenceId:evidenceId, provider:descriptor.provider, sourceClass:"AUTHORIZED_NETWORK_PRODUCT_FEED", evidenceType:"AUTHORIZED_AFFILIATE_CATALOG",
      productIdentity:evidenceIdentity(identityResult.identity), productName:text(get(record, mappings.productName)) || null,
      itemCondition:itemCondition, merchantIdentity:merchant, price:observedPrice, currency:isoCurrency,
      observedAt:observedAt, retrievedAt:descriptor.retrievedAt, providerUpdatedAt:providerUpdatedAt === "UNKNOWN" ? null : providerUpdatedAt,
      sourceObservationDate:null, availability:availability, availabilityAuthority:contract.availabilityAuthority && availability !== "UNKNOWN",
      purchaseAuthority:false, handoffUrl:handoff.url, handoffType:contract.handoffType,
      comparisonEligible:comparisonAllowed, priceConditions:priceConditions, priceConditionsVerified:contract.priceConditionsComplete,
      sourcePolicy:{ sourceId:descriptor.sourceId, authority:"AUTHORIZED_CATALOG", reviewState:descriptor.authorizationClass,
        allowedUse:"READ_ONLY_PRICE_EVIDENCE", cachingRequirement:descriptor.cachePermission, attributionRequired:descriptor.attributionRequirement === "REQUIRED",
        displayAuthorization:comparisonAllowed ? "AUTHORIZED_FOR_COMPARISON" : "NOT_AUTHORIZED_FOR_COMPARISON", allowedHandoffHosts:contract.endpointHostPolicy.allowedHosts },
      provenance:{ sourceUrl:descriptor.sourceUrl, sourceRecordId:offerId || null, extractionMethod:"PROVIDER_ADAPTER_EXPLICIT_FIELD_MAPPING" }
    });
    if (!evidence.success) return failure(evidence.error && evidence.error.code || "PRICE_EVIDENCE_MAPPING_FAILED");
    const provenance = {
      network:descriptor.network, merchant:merchant, seller:seller, program:descriptor.program, sourceId:descriptor.sourceId,
      feedId:descriptor.feedId, productIdentity:identityResult.identity, offerId:offerId || null, sourceUrl:descriptor.sourceUrl,
      canonicalProductUrl:canonical.url, handoffUrl:handoff.url
    };
    return deepFreeze(Object.assign({ success:true, offer:{
      evidenceId:evidenceId, provider:descriptor.provider, network:descriptor.network, merchant:merchant, seller:seller,
      productName:text(get(record, mappings.productName)) || null, productIdentity:identityResult.identity,
      identityBasis:identityResult.basis, exactSameProductEligible:identityResult.exactEligible, variants:variants,
      price:observedPrice, priceType:salePrice !== null ? "SALE" : "CURRENT", listPrice:listPrice,
      currency:isoCurrency, itemCondition:itemCondition, availability:availability,
      quantity:number(get(record, mappings.quantity)), minimumOrderQuantity:number(get(record, mappings.minimumOrderQuantity)),
      priceConditions:priceConditions, conditionalPrice:priceConditions.length > 0,
      shippingInclusion:shipping, taxInclusion:tax, landedPrice:null,
      observedAt:observedAt, retrievedAt:descriptor.retrievedAt, providerUpdatedAt:providerUpdatedAt,
      feedGeneratedAt:feedGeneratedAt, handoffType:contract.handoffType, handoffUrl:handoff.url,
      comparisonPermission:descriptor.comparisonPermission, displayPermission:descriptor.displayPermission,
      cachePermission:descriptor.cachePermission, attributionRequirement:descriptor.attributionRequirement,
      providerCostPolicy:descriptor.providerCostPolicy,
      providerEligibility:descriptor.providerCostPolicy === "FREE_AUTHORIZED" ? "ELIGIBLE" : descriptor.providerCostPolicy,
      comparisonEligible:comparisonAllowed, currentPurchaseAuthority:false, liveOffer:false,
      provenance:provenance
    }, evidence:evidence.evidence, commercialMetadata:normalizeCommercial(record) }, safety()));
  }
  function identityKey(offer) {
    const identity = offer.productIdentity || {};
    return Object.keys(identity).sort().map(function (key) { return key + "=" + identity[key]; }).join("|");
  }
  function reconcileObservations(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    const checked = typeof security.clonePlain === "function" ? security.clonePlain(input) : failure("FEED_SECURITY_UNAVAILABLE");
    if (!checked.success || !Array.isArray(checked.value)) return failure("OBSERVATION_SET_INVALID");
    const records = checked.value.filter(function (item) { return item && item.success === true && item.offer; }).sort(function (a, b) { return a.offer.evidenceId.localeCompare(b.offer.evidenceId); });
    const groups = new Map();
    records.forEach(function (item) {
      const offer = item.offer;
      const key = [offer.network, offer.merchant, identityKey(offer), offer.provenance.feedId, offer.observedAt].join("::");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const results = [];
    Array.from(groups.keys()).sort().forEach(function (key) {
      const items = groups.get(key);
      const currencies = Array.from(new Set(items.map(function (item) { return item.offer.currency; })));
      const priceSignatures = Array.from(new Set(items.map(function (item) { return [item.offer.price, item.offer.priceType, JSON.stringify(item.offer.priceConditions)].join("|"); })));
      let status = "UNIQUE_OBSERVATION";
      if (currencies.length > 1) status = "CURRENCY_NORMALIZATION_REQUIRED";
      else if (priceSignatures.length > 1) status = "PRICE_EVIDENCE_CONFLICT";
      else if (items.length > 1) status = "DUPLICATE_OBSERVATION";
      results.push({ key:key, status:status, observations:items });
    });
    return deepFreeze(Object.assign({ success:true, groups:results, groupCount:results.length, observationCount:records.length }, safety()));
  }
  function invalidateSourceObservations(input, sourceId) {
    const id = text(sourceId);
    if (!id || !Array.isArray(input)) return failure("REVOCATION_INPUT_INVALID");
    const output = input.map(function (item) {
      const matches = item && item.success && item.offer && item.offer.provenance && item.offer.provenance.sourceId === id;
      return { observation:item, active:!matches, invalidationReason:matches ? "SOURCE_REVOKED" : null };
    });
    return deepFreeze(Object.assign({ success:true, sourceId:id, observations:output, deletedCount:0 }, safety()));
  }

  window.WeishanGlobalCommerceFeedNormalizer = Object.freeze({
    VERSION, PRICE_CONDITIONS, INCLUSION_STATES, CONDITIONS, normalizeFeedOffer, reconcileObservations, invalidateSourceObservations
  });
})();
