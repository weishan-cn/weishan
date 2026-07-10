;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_RATE_LIMIT_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_provider_rate_limit_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildGlobalShoppingProviderRateLimitModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_RATE_LIMIT_MODEL_VERSION,
      providerId:text(safe.providerId || ""),
      limit:Number.isFinite(Number(safe.limit)) ? Number(safe.limit) : 0,
      window:text(safe.window || "sandbox"),
      remaining:Number.isFinite(Number(safe.remaining)) ? Number(safe.remaining) : 0,
      resetAt:text(safe.resetAt || "sandbox_only"),
      sourceType:"sandbox",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderRateLimitModel = {
    GLOBAL_SHOPPING_PROVIDER_RATE_LIMIT_MODEL_VERSION,
    MODEL_NAME,
    buildGlobalShoppingProviderRateLimitModel
  };
})();
