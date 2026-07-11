;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_RATE_LIMIT_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_rakuten_rate_limit_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildGlobalShoppingRakutenRateLimitModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_RATE_LIMIT_MODEL_VERSION,
      providerId:text(safe.providerId || "rakuten_japan"),
      exactLimitKnown:false,
      limit:null,
      window:null,
      policy:"identical_request_burst_sensitive",
      retryStrategy:"exponential_backoff_required",
      source:"official_rakuten_web_service_docs",
      warning:"Official documentation warns that repeated identical requests in a short period can become temporarily unavailable.",
      networkExecutionEnabled:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRakutenRateLimitModel = {
    GLOBAL_SHOPPING_RAKUTEN_RATE_LIMIT_MODEL_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRakutenRateLimitModel
  };
})();
