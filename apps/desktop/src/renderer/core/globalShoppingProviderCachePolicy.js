;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CACHE_POLICY_VERSION = "4.2.8";
  const POLICY_NAME = "global_shopping_provider_cache_policy_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function policyFor(type) {
    if (type === "metadata") return { cacheable:true, ttl:86400, reason:"metadata_changes_slowly" };
    if (type === "price") return { cacheable:true, ttl:300, reason:"price_short_lived_reference_only" };
    if (type === "availability") return { cacheable:true, ttl:180, reason:"availability_short_lived_reference_only" };
    if (type === "tax") return { cacheable:true, ttl:3600, reason:"tax_estimate_reference_only" };
    return { cacheable:false, ttl:0, reason:"unknown_data_type" };
  }

  function buildGlobalShoppingProviderCachePolicy(input) {
    const safe = input && typeof input === "object" ? input : {};
    const dataType = text(safe.dataType || "");
    const policy = policyFor(dataType);
    return clone({
      policyName:POLICY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CACHE_POLICY_VERSION,
      providerId:text(safe.providerId || ""),
      dataType:dataType,
      cacheable:policy.cacheable,
      ttl:policy.ttl,
      reason:policy.reason,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderCachePolicy = {
    GLOBAL_SHOPPING_PROVIDER_CACHE_POLICY_VERSION,
    POLICY_NAME,
    buildGlobalShoppingProviderCachePolicy
  };
})();
