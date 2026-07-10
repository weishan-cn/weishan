;(function () {
  "use strict";

  const GLOBAL_SHOPPING_REAL_PRICE_RESULT_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_real_price_result_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function numberOrNull(value) {
    const next = Number(value);
    return Number.isFinite(next) ? next : null;
  }

  function buildGlobalShoppingRealPriceResult(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_REAL_PRICE_RESULT_MODEL_VERSION,
      provider:text(safe.provider || ""),
      productTitle:text(safe.productTitle || ""),
      price:numberOrNull(safe.price),
      currency:text(safe.currency || ""),
      availability:text(safe.availability || "visit_platform"),
      timestamp:text(safe.timestamp || ""),
      sourceType:text(safe.sourceType || "future_adapter_placeholder"),
      officialUrl:text(safe.officialUrl || ""),
      trustLevel:text(safe.trustLevel || "review"),
      realtimeFetchEnabled:false,
      providerApiConnected:false,
      readOnlyPreparation:true,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRealPriceResultModel = {
    GLOBAL_SHOPPING_REAL_PRICE_RESULT_MODEL_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRealPriceResult
  };
})();
