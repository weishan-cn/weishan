;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_VERSION_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_shopping_provider_version_registry_v1";
  const ALLOWED_STATUSES = ["active", "testing", "deprecated", "disabled"];

  const VERSION_REGISTRY = {
    amazon_us:{ adapterVersion:"4.2.8-sandbox", contractVersion:"4.2.8", compatibility:"sandbox_only", status:"testing" },
    amazon_japan:{ adapterVersion:"4.2.8-sandbox", contractVersion:"4.2.8", compatibility:"sandbox_only", status:"testing" },
    rakuten_japan:{ adapterVersion:"4.2.8-rakuten-prep", contractVersion:"4.2.8-rakuten-contract", compatibility:"sandbox_with_real_contract_prep", status:"testing" },
    booking:{ adapterVersion:"4.2.8-sandbox", contractVersion:"4.2.8", compatibility:"sandbox_only", status:"testing" }
  };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function sanitizeStatus(value) {
    const safe = text(value || "testing");
    return ALLOWED_STATUSES.indexOf(safe) >= 0 ? safe : "testing";
  }

  function getGlobalShoppingProviderVersionRecord(input) {
    const providerId = text(obj(input).providerId || input || "");
    const record = obj(VERSION_REGISTRY[providerId]);
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_VERSION_REGISTRY_VERSION,
      providerId:providerId,
      adapterVersion:text(record.adapterVersion || "planned"),
      contractVersion:text(record.contractVersion || "4.2.8"),
      compatibility:text(record.compatibility || "unknown"),
      status:sanitizeStatus(record.status || "testing"),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderVersionRegistry = {
    GLOBAL_SHOPPING_PROVIDER_VERSION_REGISTRY_VERSION,
    REGISTRY_NAME,
    ALLOWED_STATUSES,
    getGlobalShoppingProviderVersionRecord
  };
})();
