;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CONFIGURATION_SCHEMA_VERSION = "4.2.8";
  const SCHEMA_NAME = "global_shopping_provider_configuration_schema_v1";
  const ALLOWED_STATUSES = ["draft", "sandbox", "ready", "disabled", "deprecated"];

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

  function sanitizeStatus(value) {
    const safe = text(value || "draft");
    return ALLOWED_STATUSES.indexOf(safe) >= 0 ? safe : "draft";
  }

  function forbiddenKeys(input) {
    return Object.keys(obj(input)).filter(function (key) {
      return /(secret|token|credential|password|api[_-]?key)/i.test(String(key || ""));
    });
  }

  function buildGlobalShoppingProviderConfigurationSchema(input) {
    const safe = obj(input);
    const status = sanitizeStatus(safe.status || "draft");
    const detectedForbiddenKeys = forbiddenKeys(safe);
    return clone({
      schemaName:SCHEMA_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CONFIGURATION_SCHEMA_VERSION,
      providerId:text(safe.providerId || ""),
      name:text(safe.name || ""),
      category:text(safe.category || "product"),
      regions:toArray(safe.regions),
      languages:toArray(safe.languages),
      capabilities:toArray(safe.capabilities),
      officialDomains:toArray(safe.officialDomains),
      status:status,
      adapterVersion:text(safe.adapterVersion || "planned"),
      contractVersion:text(safe.contractVersion || "planned"),
      invalidReason:detectedForbiddenKeys.length ? "sensitive_field_detected" : (!text(safe.providerId || "") ? "provider_id_required" : ""),
      forbiddenKeys:detectedForbiddenKeys,
      containsSensitiveFields:detectedForbiddenKeys.length > 0,
      valid:detectedForbiddenKeys.length === 0 && !!text(safe.providerId || ""),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderConfigurationSchema = {
    GLOBAL_SHOPPING_PROVIDER_CONFIGURATION_SCHEMA_VERSION,
    SCHEMA_NAME,
    ALLOWED_STATUSES,
    buildGlobalShoppingProviderConfigurationSchema
  };
})();
