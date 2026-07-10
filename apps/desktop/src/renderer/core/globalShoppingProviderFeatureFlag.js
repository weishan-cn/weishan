;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_FEATURE_FLAG_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_provider_feature_flag_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function contains(list, value) {
    const safeValue = text(value);
    return !safeValue || !list.length || list.indexOf(safeValue) >= 0;
  }

  function buildGlobalShoppingProviderFeatureFlag(input) {
    const safe = obj(input);
    const enabledRegions = toArray(safe.enabledRegions);
    const enabledCategories = toArray(safe.enabledCategories);
    const enabledExperiments = toArray(safe.enabledExperiments);
    const region = text(safe.region || "");
    const category = text(safe.category || "");
    const experiment = text(safe.experiment || "");
    const providerEnabled = safe.providerEnabled !== false;
    const regionEnabled = contains(enabledRegions, region);
    const categoryEnabled = contains(enabledCategories, category);
    const experimentEnabled = safe.experimentEnabled !== false && contains(enabledExperiments, experiment);
    const enabled = providerEnabled && regionEnabled && categoryEnabled && experimentEnabled;
    let reason = "all_flags_enabled";
    if (!providerEnabled) reason = "provider_disabled";
    else if (!regionEnabled) reason = "region_disabled";
    else if (!categoryEnabled) reason = "category_disabled";
    else if (!experimentEnabled) reason = "experiment_disabled";
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FEATURE_FLAG_VERSION,
      providerId:text(safe.providerId || ""),
      providerEnabled:providerEnabled,
      regionEnabled:regionEnabled,
      categoryEnabled:categoryEnabled,
      experimentEnabled:experimentEnabled,
      enabled:enabled,
      reason:reason,
      flagState:enabled ? "sandbox_enabled" : "disabled",
      effectiveState:enabled ? "sandbox_enabled" : "disabled",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderFeatureFlag = {
    GLOBAL_SHOPPING_PROVIDER_FEATURE_FLAG_VERSION,
    MODEL_NAME,
    buildGlobalShoppingProviderFeatureFlag
  };
})();
