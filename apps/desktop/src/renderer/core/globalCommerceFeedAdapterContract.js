;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const FEED_FORMATS = Object.freeze(["JSON", "CSV", "XML"]);
  const CREDENTIAL_REQUIREMENTS = Object.freeze(["NONE", "SERVICE_MANAGED", "UNKNOWN"]);
  const CACHE_MODES = Object.freeze(["NO_CACHE", "TTL", "INTERMEDIATE_ONLY", "DELETE_ON_REVOCATION"]);
  const HANDOFF_TYPES = Object.freeze(["DIRECT_PRODUCT", "AUTHORIZED_DEEPLINK", "AFFILIATE_HANDOFF", "SEARCH_RESULTS_HANDOFF", "NONE"]);
  const AVAILABILITY_VALUES = Object.freeze(["IN_STOCK", "OUT_OF_STOCK", "LIMITED", "PREORDER", "BACKORDER", "UNKNOWN"]);
  const CONDITION_VALUES = Object.freeze(["NEW", "USED", "REFURBISHED", "UNKNOWN"]);
  const REQUIRED_MAPPING_KEYS = Object.freeze([
    "productName", "gtin", "ean", "upc", "isbn", "mpn", "manufacturer", "merchantSku", "networkProductId",
    "canonicalProductUrl", "variantSize", "variantColor", "variantStorage", "variantConfiguration", "variantRegion",
    "merchant", "seller", "currentPrice", "salePrice", "listPrice", "currency", "itemCondition", "availability",
    "quantity", "minimumOrderQuantity", "priceConditions", "shippingInclusion", "taxInclusion", "handoffUrl",
    "observedAt", "providerUpdatedAt", "feedGeneratedAt", "offerId"
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function failure(code) {
    return deepFreeze({ success:false, error:{ code:code, stage:"FEED_ADAPTER_CONTRACT", recoverable:true }, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, productionAffected:false });
  }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function enumValue(value, allowed) { const normalized = text(value).toUpperCase(); return allowed.indexOf(normalized) >= 0 ? normalized : null; }
  function fieldName(value) { return value === null ? null : (/^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(text(value)) ? text(value) : undefined); }
  function normalizedHosts(values, security) {
    if (!Array.isArray(values) || !values.length) return null;
    const hosts = Array.from(new Set(values.map(function (host) { return text(host).toLowerCase(); }))).sort();
    return hosts.every(function (host) { return security.validateHttpsUrl("https://" + host + "/", [host]).success; }) ? hosts : null;
  }
  function mappingValuesValid(mapping, allowed) {
    const keys = Object.keys(mapping || {});
    return keys.length > 0 && keys.every(function (key) { return allowed.indexOf(text(mapping[key]).toUpperCase()) >= 0; });
  }
  function createAdapterContract(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    const descriptorApi = window.WeishanGlobalCommerceFeedSourceDescriptor || {};
    if (typeof security.clonePlain !== "function" || typeof descriptorApi.createSourceDescriptor !== "function") return failure("FEED_FOUNDATION_DEPENDENCY_UNAVAILABLE");
    const checked = security.clonePlain(input);
    if (!checked.success) return failure("ADAPTER_CONTRACT_INPUT_REJECTED");
    const source = checked.value;
    if (!text(source.contractId) || !text(source.adapterVersion)) return failure("ADAPTER_IDENTITY_REQUIRED");
    const identity = source.sourceDescriptor;
    const descriptor = descriptorApi.createSourceDescriptor(identity);
    if (!descriptor.success) return failure("SOURCE_DESCRIPTOR_INVALID");
    const format = enumValue(source.feedFormat, FEED_FORMATS);
    const credentialRequirement = enumValue(source.credentialRequirement, CREDENTIAL_REQUIREMENTS);
    const handoffType = enumValue(source.handoffType, HANDOFF_TYPES);
    if (!format || !credentialRequirement || !handoffType) return failure("ADAPTER_DECLARATION_INCOMPLETE");
    if (!source.fieldMappings || typeof source.fieldMappings !== "object") return failure("FIELD_MAPPINGS_REQUIRED");
    const fieldMappings = {};
    for (const key of REQUIRED_MAPPING_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(source.fieldMappings, key)) return failure("FIELD_MAPPING_NOT_EXPLICIT");
      const normalized = fieldName(source.fieldMappings[key]);
      if (normalized === undefined) return failure("FIELD_MAPPING_INVALID");
      fieldMappings[key] = normalized;
    }
    const hosts = normalizedHosts(source.endpointHostPolicy && source.endpointHostPolicy.allowedHosts, security);
    if (!hosts) return failure("ENDPOINT_HOST_POLICY_INVALID");
    const rawLimit = Number(source.rawResponseLimits && source.rawResponseLimits.maxBytes);
    const rowLimit = Number(source.rawResponseLimits && source.rawResponseLimits.maxRows);
    if (!Number.isSafeInteger(rawLimit) || rawLimit < 1024 || rawLimit > security.DEFAULT_LIMITS.maxBytes || !Number.isSafeInteger(rowLimit) || rowLimit < 1 || rowLimit > security.DEFAULT_LIMITS.maxRows) return failure("RAW_RESPONSE_LIMITS_INVALID");
    const cacheMode = enumValue(source.cachePolicy && source.cachePolicy.mode, CACHE_MODES);
    const ttlSeconds = source.cachePolicy && source.cachePolicy.ttlSeconds;
    if (!cacheMode || (cacheMode === "TTL" && (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 2592000)) || (cacheMode !== "TTL" && ttlSeconds !== null)) return failure("CACHE_POLICY_INVALID");
    const rate = source.rateLimitMetadata || {};
    if (!Number.isSafeInteger(rate.maxRequests) || rate.maxRequests < 1 || !Number.isSafeInteger(rate.windowSeconds) || rate.windowSeconds < 1 || rate.automaticPolling !== false) return failure("RATE_LIMIT_METADATA_INVALID");
    if (typeof source.priceConditionsComplete !== "boolean" || typeof source.availabilityAuthority !== "boolean") return failure("SEMANTIC_AUTHORITY_DECLARATION_REQUIRED");
    if (!mappingValuesValid(source.availabilityMapping, AVAILABILITY_VALUES) || !mappingValuesValid(source.itemConditionMapping, CONDITION_VALUES)) return failure("SEMANTIC_MAPPING_INVALID");
    return deepFreeze({ success:true, contract:{
      contractId:text(source.contractId), adapterVersion:text(source.adapterVersion), sourceDescriptor:descriptor.descriptor,
      endpointHostPolicy:{ allowedHosts:hosts, redirects:"VALIDATE_EACH_HOP", arbitraryHostAllowed:false },
      credentialRequirement:credentialRequirement, feedFormat:format, fieldMappings:fieldMappings,
      availabilityMapping:Object.assign({}, source.availabilityMapping || {}), itemConditionMapping:Object.assign({}, source.itemConditionMapping || {}),
      priceConditionsComplete:source.priceConditionsComplete, availabilityAuthority:source.availabilityAuthority,
      handoffType:handoffType, attributionMetadata:Object.assign({}, source.attributionMetadata || {}),
      rateLimitMetadata:{ maxRequests:rate.maxRequests, windowSeconds:rate.windowSeconds, automaticPolling:false },
      rawResponseLimits:{ maxBytes:rawLimit, maxRows:rowLimit }, cachePolicy:{ mode:cacheMode, ttlSeconds:ttlSeconds },
      productIdentityMapping:"EXPLICIT_FIELDS_ONLY", priceMapping:"EXPLICIT_CURRENT_OR_SALE_ONLY", timestampMapping:"NO_RETRIEVAL_AS_PROVIDER_FRESHNESS",
      networkDownloadImplemented:false, scheduledPolling:false, productionTraffic:false,
      executionGate:"CLOSED", authorizesExecution:false, executed:false, productionAffected:false,
      WEISHAN_PAYS_PROVIDER:false, PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    } });
  }

  window.WeishanGlobalCommerceFeedAdapterContract = Object.freeze({
    VERSION, FEED_FORMATS, CREDENTIAL_REQUIREMENTS, CACHE_MODES, HANDOFF_TYPES, REQUIRED_MAPPING_KEYS, createAdapterContract
  });
})();
