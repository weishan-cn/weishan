;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_PREFERENCE_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_user_preference_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function bool(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }

  function buildGlobalShoppingUserPreferenceModel(input) {
    const safe = obj(input);
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_USER_PREFERENCE_MODEL_VERSION,
      preferredCountry:text(safe.preferredCountry || ""),
      preferredProvider:text(safe.preferredProvider || ""),
      cheapestFirst:bool(safe.cheapestFirst, true),
      officialOnly:bool(safe.officialOnly, false),
      fastestDelivery:bool(safe.fastestDelivery, false),
      lowestRisk:bool(safe.lowestRisk, true),
      explicitPreferenceSource:text(safe.explicitPreferenceSource || "default_model"),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingUserPreferenceModel = {
    GLOBAL_SHOPPING_USER_PREFERENCE_MODEL_VERSION,
    MODEL_NAME,
    buildGlobalShoppingUserPreferenceModel
  };
})();
