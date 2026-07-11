;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_AUTH_ABSTRACTION_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_rakuten_auth_abstraction_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function forbiddenKeys(input) {
    return Object.keys(obj(input)).filter(function (key) {
      return /(secret|token|password|credential)/i.test(String(key || ""));
    });
  }

  function buildGlobalShoppingRakutenAuthAbstraction(input) {
    const safe = obj(input);
    const flaggedKeys = forbiddenKeys(safe);
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_AUTH_ABSTRACTION_VERSION,
      providerId:text(safe.providerId || "rakuten_japan"),
      authType:"app_id_access_key",
      oauthSupported:false,
      oauthDesignStatus:"not_required_for_documented_search_apis",
      requiredFields:[
        { name:"applicationId", location:"query", persisted:false, runtimeOnly:true },
        { name:"accessKey", location:"header_or_query", persisted:false, runtimeOnly:true }
      ],
      optionalFields:[
        { name:"affiliateId", location:"query", persisted:false, runtimeOnly:true }
      ],
      securityBoundary:{
        storesAccessKey:false,
        storesPassword:false,
        storesOauthToken:false,
        storesThirdPartyLogin:false,
        runtimeReadOnly:true
      },
      invalidReason:flaggedKeys.length ? "sensitive_runtime_value_forbidden" : "",
      forbiddenKeys:flaggedKeys,
      valid:flaggedKeys.length === 0,
      source:"official_rakuten_web_service_docs",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRakutenAuthAbstraction = {
    GLOBAL_SHOPPING_RAKUTEN_AUTH_ABSTRACTION_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRakutenAuthAbstraction
  };
})();
