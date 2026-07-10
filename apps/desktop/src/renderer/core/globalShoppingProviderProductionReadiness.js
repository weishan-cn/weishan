;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_PRODUCTION_READINESS_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_provider_production_readiness_v1";
  const READINESS_LEVELS = ["ready", "sandbox", "blocked", "unknown"];

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

  function buildGlobalShoppingProviderProductionReadiness(input) {
    const safe = obj(input);
    const configuration = obj(safe.configuration);
    const featureFlag = obj(safe.featureFlag);
    const version = obj(safe.version);
    const compliance = obj(safe.compliance);
    const adapterStatus = obj(safe.adapterStatus);
    const warnings = [];
    const blockers = [];

    const providerId = text(
      safe.providerId ||
      configuration.providerId ||
      version.providerId ||
      adapterStatus.providerId ||
      ""
    );
    const adapterVersion = text(version.adapterVersion || configuration.adapterVersion || "planned");
    const contractVersion = text(version.contractVersion || configuration.contractVersion || "planned");
    const configurationState = text(configuration.status || "");
    const featureFlagState = text(featureFlag.flagState || featureFlag.effectiveState || "");
    const versionState = text(version.status || "");
    const adapterStage = text(
      adapterStatus.stage ||
      adapterStatus.status ||
      (adapterStatus.available === true ? "ready" : "")
    );

    if (configuration.valid !== true) blockers.push(text(configuration.invalidReason || "configuration_invalid"));
    if (configuration.containsSensitiveFields === true) blockers.push("sensitive_field_detected");
    if (!featureFlagState || featureFlag.enabled !== true) blockers.push(text(featureFlag.reason || "feature_flag_disabled"));
    if (versionState === "deprecated" || versionState === "disabled") blockers.push("version_" + versionState);
    if (compliance.allowed === false) blockers.push(text(compliance.reason || "compliance_blocked"));
    if (safe.permissionAllowed === false) blockers.push("permission_denied");
    if (safe.transactionAllowed === true) blockers.push("transaction_permission_forbidden");

    if (versionState === "testing") warnings.push("provider_testing_only");
    if (configurationState === "sandbox") warnings.push("sandbox_configuration");
    if (featureFlagState === "sandbox_enabled") warnings.push("sandbox_flag_enabled");
    if (adapterStage === "sandbox" || adapterStage === "testing" || adapterStage === "planned" || adapterStage === "registry_only") {
      warnings.push("sandbox_adapter_only");
    }
    if (text(version.compatibility || "") === "sandbox_only") warnings.push("sandbox_compatibility_only");

    let readinessLevel = "unknown";
    if (blockers.length) {
      readinessLevel = "blocked";
    } else if (
      configurationState === "ready" &&
      featureFlag.enabled === true &&
      versionState === "active" &&
      adapterStage === "ready" &&
      compliance.allowed !== false
    ) {
      readinessLevel = "ready";
    } else if (
      configuration.valid === true &&
      featureFlag.enabled === true &&
      versionState &&
      versionState !== "deprecated" &&
      versionState !== "disabled"
    ) {
      readinessLevel = "sandbox";
    }

    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PRODUCTION_READINESS_VERSION,
      providerId:providerId,
      adapterVersion:adapterVersion,
      contractVersion:contractVersion,
      configurationState:configurationState || "unknown",
      featureFlagState:featureFlagState || "unknown",
      versionState:versionState || "unknown",
      adapterStatus:adapterStage || "unknown",
      ready:readinessLevel === "ready",
      readinessLevel:READINESS_LEVELS.indexOf(readinessLevel) >= 0 ? readinessLevel : "unknown",
      blockers:blockers,
      warnings:warnings,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderProductionReadiness = {
    GLOBAL_SHOPPING_PROVIDER_PRODUCTION_READINESS_VERSION,
    MODEL_NAME,
    READINESS_LEVELS,
    buildGlobalShoppingProviderProductionReadiness
  };
})();
