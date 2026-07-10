;(function () {
  "use strict";

  const GLOBAL_SHOPPING_DATA_PROVENANCE_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_data_provenance_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function buildGlobalShoppingDataProvenance(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_DATA_PROVENANCE_VERSION,
      decisionId:text(safe.decisionId || ""),
      providerId:text(safe.providerId || ""),
      source:text(safe.source || "sandbox"),
      timestamp:text(safe.timestamp || ""),
      transformations:toArray(safe.transformations).map(function (item) {
        return text(item);
      }).filter(Boolean),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingDataProvenance = {
    GLOBAL_SHOPPING_DATA_PROVENANCE_VERSION,
    MODEL_NAME,
    buildGlobalShoppingDataProvenance
  };
})();
