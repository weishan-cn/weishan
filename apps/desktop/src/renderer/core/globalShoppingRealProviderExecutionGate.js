;(function () {
  "use strict";

  const GLOBAL_SHOPPING_REAL_PROVIDER_EXECUTION_GATE_VERSION = "4.2.8";
  const GATE_NAME = "global_shopping_real_provider_execution_gate_v1";
  const ALLOWED_MODES = ["real_provider_readonly", "sandbox", "external_link_only", "blocked"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }

  function featureFlagApi() { return window.WeishanGlobalShoppingProviderFeatureFlag || {}; }
  function configurationApi() { return window.WeishanGlobalShoppingProviderConfigurationSchema || {}; }
  function versionRegistryApi() { return window.WeishanGlobalShoppingProviderVersionRegistry || {}; }
  function productionReadinessApi() { return window.WeishanGlobalShoppingProviderProductionReadiness || {}; }
  function permissionApi() { return window.WeishanGlobalShoppingProviderPermissionModel || {}; }

  function buildFeatureFlag(input) {
    return typeof featureFlagApi().buildGlobalShoppingProviderFeatureFlag === "function"
      ? featureFlagApi().buildGlobalShoppingProviderFeatureFlag(input)
      : { enabled:false, flagState:"disabled", effectiveState:"disabled", reason:"feature_flag_unavailable" };
  }

  function buildConfiguration(input) {
    return typeof configurationApi().buildGlobalShoppingProviderConfigurationSchema === "function"
      ? configurationApi().buildGlobalShoppingProviderConfigurationSchema(input)
      : { valid:false, status:"draft", invalidReason:"configuration_schema_unavailable" };
  }

  function buildVersion(providerId) {
    return typeof versionRegistryApi().getGlobalShoppingProviderVersionRecord === "function"
      ? versionRegistryApi().getGlobalShoppingProviderVersionRecord({ providerId:providerId })
      : { status:"testing", adapterVersion:"planned", contractVersion:"planned" };
  }

  function buildPermission(providerId) {
    return typeof permissionApi().buildGlobalShoppingProviderPermissionModel === "function"
      ? permissionApi().buildGlobalShoppingProviderPermissionModel({
        providerId:providerId,
        operation:"searchProducts",
        mode:"real_provider_readonly"
      })
      : { allowed:false, reason:"permission_model_unavailable" };
  }

  function buildProductionReadiness(input) {
    return typeof productionReadinessApi().buildGlobalShoppingProviderProductionReadiness === "function"
      ? productionReadinessApi().buildGlobalShoppingProviderProductionReadiness(input)
      : { ready:false, readinessLevel:"unknown", blockers:["production_readiness_unavailable"], warnings:[] };
  }

  function normalizeStatus(status) {
    const safe = obj(status);
    return {
      connected:safe.connected === true,
      readinessLevel:text(safe.readinessLevel || "unknown"),
      executionMode:text(safe.executionMode || "external_link_only"),
      providerId:text(safe.providerId || "rakuten_japan")
    };
  }

  async function buildGlobalShoppingRealProviderExecutionGate(input) {
    const safe = obj(input);
    const providerId = text(safe.providerId || "rakuten_japan");
    const category = text(safe.category || "product");
    const region = text(safe.region || safe.destinationCountry || "JP");
    const explicitUserEnabled = safe.userEnabled === true || safe.explicitUserAction === true;
    const bridge = window.weishanGlobalShopping;
    const status = normalizeStatus(
      bridge && typeof bridge.getRakutenReadonlyStatus === "function"
        ? await bridge.getRakutenReadonlyStatus()
        : {}
    );
    const configuration = buildConfiguration({
      providerId:providerId,
      name:"Rakuten",
      category:category,
      regions:["JP"],
      languages:["ja", "en"],
      capabilities:["search", "price", "availability", "officialProduct"],
      officialDomains:["rakuten.co.jp", "travel.rakuten.com"],
      status:"sandbox",
      adapterVersion:"4.2.8-rakuten-main-readonly",
      contractVersion:"4.2.8"
    });
    const featureFlag = buildFeatureFlag({
      providerId:providerId,
      providerEnabled:true,
      enabledRegions:["JP"],
      enabledCategories:["product"],
      region:region,
      category:category,
      experimentEnabled:true
    });
    const version = buildVersion(providerId);
    const permission = buildPermission(providerId);
    const endpointAllowlistVerified = text(safe.endpointHost || "openapi.rakuten.co.jp") === "openapi.rakuten.co.jp";
    const credentialAvailable = status.connected === true;
    const regionAllowed = !region || region === "JP";
    const categoryAllowed = category === "product";
    const productionReadiness = buildProductionReadiness({
      providerId:providerId,
      configuration:configuration,
      featureFlag:featureFlag,
      version:version,
      permissionAllowed:permission.allowed === true && credentialAvailable === true,
      transactionAllowed:false,
      compliance:{ allowed:true, reason:"real_provider_read_only_allowed" },
      realProviderPreparation:{
        status:"documented",
        stage:"real_provider_preparation",
        transactionEnabled:false,
        credentialStorageAllowed:false
      },
      adapterStatus:{
        status:"testing",
        stage:"sandbox"
      }
    });

    const blockers = [];
    if (!explicitUserEnabled) blockers.push("user_not_enabled");
    if (configuration.valid !== true) blockers.push(text(configuration.invalidReason || "configuration_invalid"));
    if (featureFlag.enabled !== true) blockers.push(text(featureFlag.reason || "feature_flag_disabled"));
    if (!/^(active|testing)$/.test(text(version.status || ""))) blockers.push("version_not_allowed");
    if (permission.allowed !== true) blockers.push("permission_denied");
    if (!credentialAvailable) blockers.push("credential_unavailable");
    if (!regionAllowed) blockers.push("region_not_allowed");
    if (!categoryAllowed) blockers.push("category_not_allowed");
    if (!endpointAllowlistVerified) blockers.push("endpoint_not_allowlisted");
    if (text(productionReadiness.readinessLevel || "") === "blocked") blockers.push("production_readiness_blocked");

    let mode = "external_link_only";
    if (blockers.length === 0 && status.executionMode === "real_provider_readonly") {
      mode = "real_provider_readonly";
    } else if (featureFlag.enabled === true && configuration.valid === true && /^(active|testing)$/.test(text(version.status || ""))) {
      mode = credentialAvailable ? "sandbox" : "external_link_only";
    }
    if (ALLOWED_MODES.indexOf(mode) < 0) mode = "blocked";

    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_REAL_PROVIDER_EXECUTION_GATE_VERSION,
      providerId:providerId,
      mode:mode,
      userEnabled:explicitUserEnabled,
      connected:credentialAvailable,
      endpointAllowlistVerified:endpointAllowlistVerified,
      regionAllowed:regionAllowed,
      categoryAllowed:categoryAllowed,
      configuration:configuration,
      featureFlag:featureFlag,
      version:version,
      permission:permission,
      productionReadiness:productionReadiness,
      blockers:blockers,
      status:status,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRealProviderExecutionGate = {
    GLOBAL_SHOPPING_REAL_PROVIDER_EXECUTION_GATE_VERSION,
    GATE_NAME,
    ALLOWED_MODES,
    buildGlobalShoppingRealProviderExecutionGate
  };
})();
