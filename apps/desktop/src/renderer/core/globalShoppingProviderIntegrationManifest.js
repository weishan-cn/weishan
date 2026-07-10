;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_INTEGRATION_MANIFEST_VERSION = "4.2.8";
  const MANIFEST_NAME = "global_shopping_provider_integration_manifest_v1";

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

  function buildGlobalShoppingProviderIntegrationManifest(input) {
    const safe = obj(input);
    return clone({
      manifestName:MANIFEST_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_INTEGRATION_MANIFEST_VERSION,
      providerId:text(safe.providerId || ""),
      officialDomain:text(safe.officialDomain || ""),
      authType:text(safe.authType || "planned"),
      capabilities:toArray(safe.capabilities),
      permissions:toArray(safe.permissions),
      regions:toArray(safe.regions),
      rateLimit:obj(safe.rateLimit),
      dataPolicy:Object.assign({
        noNetwork:true,
        noApiKeyStorage:true,
        noTokenStorage:true,
        readOnlyOnly:true
      }, obj(safe.dataPolicy)),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderIntegrationManifest = {
    GLOBAL_SHOPPING_PROVIDER_INTEGRATION_MANIFEST_VERSION,
    MANIFEST_NAME,
    buildGlobalShoppingProviderIntegrationManifest
  };
})();
