;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PRICE_FRESHNESS_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_price_freshness_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function parseTime(value) {
    const iso = text(value);
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : NaN;
  }

  function buildGlobalShoppingPriceFreshnessModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    const fetchedAt = text(safe.fetchedAt || "");
    const fetchedMs = parseTime(fetchedAt);
    const nowMs = Number.isFinite(Date.parse(text(safe.now || ""))) ? Date.parse(text(safe.now || "")) : Date.now();
    if (!fetchedAt || Number.isNaN(fetchedMs)) {
      return clone({
        modelName:MODEL_NAME,
        appVersion:GLOBAL_SHOPPING_PRICE_FRESHNESS_MODEL_VERSION,
        fetchedAt:"",
        ageSeconds:null,
        freshnessLevel:"unknown",
        redacted:true
      });
    }
    const ageSeconds = Math.max(0, Math.round((nowMs - fetchedMs) / 1000));
    const freshnessLevel = ageSeconds <= 300 ? "fresh" : (ageSeconds <= 3600 ? "recent" : "stale");
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PRICE_FRESHNESS_MODEL_VERSION,
      fetchedAt:fetchedAt,
      ageSeconds:ageSeconds,
      freshnessLevel:freshnessLevel,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingPriceFreshnessModel = {
    GLOBAL_SHOPPING_PRICE_FRESHNESS_MODEL_VERSION,
    MODEL_NAME,
    buildGlobalShoppingPriceFreshnessModel
  };
})();
