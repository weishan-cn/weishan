;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_RESPONSE_NORMALIZER_VERSION = "4.2.8";
  const NORMALIZER_NAME = "global_shopping_provider_response_normalizer_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function safeUrl(value) {
    try {
      const parsed = new URL(String(value || "").trim());
      const combined = parsed.pathname + parsed.search + parsed.hash;
      if (!/^https?:$/.test(parsed.protocol)) return "";
      if (/checkout|payment|order|submit/i.test(combined)) return "";
      return parsed.toString();
    } catch (_) {
      return "";
    }
  }

  function normalizeItem(input, fallback) {
    const item = obj(input);
    const defaults = obj(fallback);
    return {
      providerId:text(item.providerId || defaults.providerId || ""),
      title:text(item.title || defaults.title || ""),
      category:text(item.category || defaults.category || "product"),
      price:Number.isFinite(Number(item.price)) ? Number(item.price) : null,
      currency:text(item.currency || defaults.currency || ""),
      availability:text(item.availability || item.availabilityStatus || defaults.availability || "unknown"),
      officialUrl:safeUrl(item.officialUrl || defaults.officialUrl || ""),
      sourceType:text(item.sourceType || defaults.sourceType || "sandbox"),
      timestamp:text(item.timestamp || defaults.timestamp || ""),
      confidence:text(item.confidence || defaults.confidence || "mock")
    };
  }

  function buildGlobalShoppingNormalizedProviderResponse(input) {
    const safe = obj(input);
    const response = obj(safe.response);
    const fallback = {
      providerId:text(safe.providerId || response.providerId || ""),
      title:text(safe.title || ""),
      category:text(safe.category || response.category || "product"),
      currency:text(safe.currency || response.currency || ""),
      availability:text(response.availability || "unknown"),
      officialUrl:text(safe.officialUrl || response.officialUrl || ""),
      sourceType:text(response.sourceType || "sandbox"),
      timestamp:text(response.timestamp || ""),
      confidence:text(response.dataConfidence || "mock")
    };
    const items = toArray(response.results).map(function (item) {
      return normalizeItem(item, fallback);
    });
    return clone({
      normalizerName:NORMALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_RESPONSE_NORMALIZER_VERSION,
      providerId:fallback.providerId,
      sourceType:fallback.sourceType || "sandbox",
      normalizedResults:items.length ? items : [normalizeItem(response, fallback)],
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderResponseNormalizer = {
    GLOBAL_SHOPPING_PROVIDER_RESPONSE_NORMALIZER_VERSION,
    NORMALIZER_NAME,
    buildGlobalShoppingNormalizedProviderResponse
  };
})();
