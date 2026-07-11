;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_REQUEST_POLICY_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_provider_request_policy_v1";

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

  function buildGlobalShoppingProviderRequestPolicy(input) {
    const safe = obj(input);
    const provider = obj(safe.provider);
    const permissionModel = obj(safe.permissionModel);
    const dataPolicy = obj(safe.dataPolicy);
    const regionContext = obj(safe.regionContext);
    const allowReadOnlyRealProvider = safe.allowReadOnlyRealProvider === true;
    const requestedPermission = text(permissionModel.requiredPermission || "");
    const permissionEntry = toArray(permissionModel.permissions).find(function (item) {
      return text(item.permission || "") === requestedPermission;
    }) || {};
    const warnings = [];
    let allowed = true;
    let reason = "sandbox_read_only_allowed";

    if (text(provider.status || "") === "disabled") {
      allowed = false;
      reason = "provider_disabled";
    } else if (text(provider.status || "") === "planned") {
      allowed = false;
      reason = "provider_planned_only";
    } else if (requestedPermission && permissionEntry.allowed !== true) {
      allowed = false;
      reason = "permission_denied";
    }

    const countries = toArray(provider.countries).map(function (item) { return text(item); }).filter(Boolean);
    if (allowed && countries.length && text(regionContext.country || "")) {
      const regionCountry = text(regionContext.country || "");
      if (countries.indexOf(regionCountry) < 0 && countries.indexOf("EU") < 0) {
        warnings.push("provider_region_mismatch");
      }
    }

    if (dataPolicy.noNetwork === false && allowReadOnlyRealProvider !== true) {
      allowed = false;
      reason = "network_policy_blocked";
    }
    if (dataPolicy.noRealProvider === false && allowReadOnlyRealProvider !== true) {
      allowed = false;
      reason = "real_provider_blocked";
    }
    if (dataPolicy.noCredentialRead === false && allowReadOnlyRealProvider !== true) {
      allowed = false;
      reason = "credential_policy_blocked";
    }
    if (dataPolicy.noRawPersistence === false) {
      warnings.push("raw_persistence_requires_review");
    }
    if (allowReadOnlyRealProvider === true) {
      warnings.push("real_provider_readonly_runtime_enabled");
    }

    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_REQUEST_POLICY_VERSION,
      providerId:text(provider.providerId || safe.providerId || ""),
      operation:text(safe.operation || ""),
      allowed:allowed,
      reason:reason,
      warnings:warnings,
      providerStatus:text(provider.status || "unknown"),
      requiredPermission:requestedPermission,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderRequestPolicy = {
    GLOBAL_SHOPPING_PROVIDER_REQUEST_POLICY_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingProviderRequestPolicy
  };
})();
