;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const SOURCE_TYPES = Object.freeze(["NETWORK_PRODUCT_FEED", "AUTHORIZED_AFFILIATE_CATALOG", "MERCHANT_FEED", "SYNTHETIC_FIXTURE"]);
  const COMPARISON_PERMISSIONS = Object.freeze(["ALLOWED", "UNCLEAR", "RESTRICTED", "PROHIBITED"]);
  const DISPLAY_PERMISSIONS = Object.freeze(["ALLOWED", "UNCLEAR", "RESTRICTED"]);
  const CACHE_PERMISSIONS = Object.freeze(["ALLOWED", "LIMITED", "UNCLEAR", "PROHIBITED"]);
  const REQUIREMENTS = Object.freeze(["REQUIRED", "OPTIONAL", "NOT_REQUIRED", "PROHIBITED", "UNKNOWN"]);
  const PROVIDER_COST_POLICIES = Object.freeze(["FREE_AUTHORIZED", "PAID_PROVIDER_DEFERRED", "UNKNOWN"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function failure(code) {
    return deepFreeze({ success:false, error:{ code:code, stage:"FEED_SOURCE_DESCRIPTOR", recoverable:true }, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, productionAffected:false });
  }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function id(value) {
    const normalized = text(value);
    return normalized && normalized.length <= 160 && !/[\u0000-\u001f\u007f]/.test(normalized) ? normalized : null;
  }
  function enumValue(value, allowed) { const normalized = text(value).toUpperCase(); return allowed.indexOf(normalized) >= 0 ? normalized : null; }
  function timestamp(value) {
    if (value === null || text(value).toUpperCase() === "UNKNOWN" || text(value) === "") return "UNKNOWN";
    return Number.isFinite(Date.parse(text(value))) ? text(value) : null;
  }
  function allowedHosts(values, security) {
    if (!Array.isArray(values) || !values.length) return null;
    const normalized = Array.from(new Set(values.map(function (host) { return text(host).toLowerCase(); }))).sort();
    return normalized.every(function (host) {
      return security.validateHttpsUrl("https://" + host + "/", [host]).success;
    }) ? normalized : null;
  }
  function createSourceDescriptor(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    if (typeof security.clonePlain !== "function") return failure("FEED_SECURITY_UNAVAILABLE");
    const checked = security.clonePlain(input);
    if (!checked.success) return failure("SOURCE_DESCRIPTOR_INPUT_REJECTED");
    const source = checked.value;
    const fields = {
      sourceId:id(source.sourceId), provider:id(source.provider), network:id(source.network), merchant:id(source.merchant),
      program:id(source.program), environment:id(source.environment), feedId:id(source.feedId),
      sourceType:enumValue(source.sourceType, SOURCE_TYPES), authorizationClass:id(source.authorizationClass),
      comparisonPermission:enumValue(source.comparisonPermission, COMPARISON_PERMISSIONS),
      displayPermission:enumValue(source.displayPermission, DISPLAY_PERMISSIONS),
      cachePermission:enumValue(source.cachePermission, CACHE_PERMISSIONS),
      providerCostPolicy:enumValue(source.providerCostPolicy, PROVIDER_COST_POLICIES),
      attributionRequirement:enumValue(source.attributionRequirement, REQUIREMENTS),
      handoffRequirement:enumValue(source.handoffRequirement, REQUIREMENTS),
      retrievedAt:timestamp(source.retrievedAt), providerUpdatedAt:timestamp(source.providerUpdatedAt), feedGeneratedAt:timestamp(source.feedGeneratedAt)
    };
    if (Object.keys(fields).some(function (key) { return !fields[key]; }) || fields.retrievedAt === "UNKNOWN") return failure("SOURCE_DESCRIPTOR_INCOMPLETE");
    const hosts = allowedHosts(source.allowedSourceHosts, security);
    if (!hosts) return failure("SOURCE_HOST_POLICY_INVALID");
    const sourceUrl = security.validateHttpsUrl(source.sourceUrl, hosts);
    if (!sourceUrl.success) return failure("SOURCE_URL_NOT_ALLOWED");
    return deepFreeze({ success:true, descriptor:Object.assign(fields, {
      sourceUrl:sourceUrl.url,
      allowedSourceHosts:hosts,
      providerTimestampKnown:fields.providerUpdatedAt !== "UNKNOWN",
      feedTimestampKnown:fields.feedGeneratedAt !== "UNKNOWN",
      networkIsMerchant:fields.network === fields.merchant,
      executionGate:"CLOSED", authorizesExecution:false, executed:false, productionTraffic:false, productionAffected:false,
      WEISHAN_PAYS_PROVIDER:false, PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    }) });
  }

  window.WeishanGlobalCommerceFeedSourceDescriptor = Object.freeze({
    VERSION, SOURCE_TYPES, COMPARISON_PERMISSIONS, DISPLAY_PERMISSIONS, CACHE_PERMISSIONS, REQUIREMENTS, PROVIDER_COST_POLICIES, createSourceDescriptor
  });
})();
