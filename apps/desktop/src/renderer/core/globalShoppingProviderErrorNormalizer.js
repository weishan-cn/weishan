;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ERROR_NORMALIZER_VERSION = "4.2.8";
  const NORMALIZER_NAME = "global_shopping_provider_error_normalizer_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildGlobalShoppingProviderErrorNormalizer(input) {
    const safe = input && typeof input === "object" ? input : {};
    const code = Number(safe.statusCode || safe.code || 0);
    const message = text(safe.message || safe.error || "");
    let category = "unknown";
    let retryable = false;

    if (/timeout/i.test(message) || code === 408) {
      category = "timeout";
      retryable = true;
    } else if (/rate/i.test(message) || code === 429) {
      category = "rate_limit";
      retryable = true;
    } else if (/unauthorized|forbidden/i.test(message) || code === 401 || code === 403) {
      category = "unauthorized";
      retryable = false;
    } else if (/not\s*found/i.test(message) || code === 404) {
      category = "not_found";
      retryable = false;
    } else if (/unavailable|service/i.test(message) || code === 503 || code === 502) {
      category = "unavailable";
      retryable = true;
    }

    return clone({
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ERROR_NORMALIZER_VERSION,
      code:code || 0,
      category:category,
      retryable:retryable,
      message:message || "provider_error_unknown",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderErrorNormalizer = {
    GLOBAL_SHOPPING_PROVIDER_ERROR_NORMALIZER_VERSION,
    NORMALIZER_NAME,
    buildGlobalShoppingProviderErrorNormalizer
  };
})();
