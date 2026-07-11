;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_rakuten_audit_trace_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildGlobalShoppingRakutenAuditTrace(input) {
    const safe = obj(input);
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE_VERSION,
      providerId:text(safe.providerId || "rakuten_japan"),
      operation:text(safe.operation || ""),
      endpointName:text(safe.endpointName || ""),
      authMode:text(safe.authMode || "app_id_access_key"),
      requestSchemaVersion:text(safe.requestSchemaVersion || GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE_VERSION),
      responseSchemaVersion:text(safe.responseSchemaVersion || GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE_VERSION),
      fieldMappingVersion:text(safe.fieldMappingVersion || GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE_VERSION),
      rateLimitVersion:text(safe.rateLimitVersion || GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE_VERSION),
      errorMappingVersion:text(safe.errorMappingVersion || GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE_VERSION),
      executionMode:"design_only",
      networkExecuted:false,
      credentialValuesStored:false,
      oauthTokenStored:false,
      passwordStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRakutenAuditTrace = {
    GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRakutenAuditTrace
  };
})();
