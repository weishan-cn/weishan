;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_ERROR_MAPPING_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_rakuten_error_mapping_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildGlobalShoppingRakutenErrorMapping(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_ERROR_MAPPING_VERSION,
      providerId:text(safe.providerId || "rakuten_japan"),
      mappings:[
        { providerSignal:"missing_or_invalid_parameter", normalizedCategory:"validation", retryable:false, source:"official_doc_parameter_requirements" },
        { providerSignal:"identical_request_temporarily_unavailable", normalizedCategory:"rate_limit", retryable:true, source:"official_doc_burst_warning" },
        { providerSignal:"authorization_not_approved", normalizedCategory:"unauthorized", retryable:false, source:"design_inference_for_app_id_access_key" },
        { providerSignal:"provider_service_unavailable", normalizedCategory:"unavailable", retryable:true, source:"design_inference_for_gateway_normalization" }
      ],
      networkExecutionEnabled:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRakutenErrorMapping = {
    GLOBAL_SHOPPING_RAKUTEN_ERROR_MAPPING_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRakutenErrorMapping
  };
})();
