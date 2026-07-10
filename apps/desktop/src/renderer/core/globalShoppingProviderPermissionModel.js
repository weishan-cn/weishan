;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_PERMISSION_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_provider_permission_model_v1";
  const PERMISSIONS = [
    "search",
    "price_read",
    "availability_read",
    "shipping_read",
    "tax_read",
    "metadata_read",
    "order_create",
    "payment",
    "checkout"
  ];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function disabledPermission(permission) {
    return {
      permission:permission,
      status:"disabled",
      allowed:false,
      reason:"default_disabled"
    };
  }

  function operationPermission(operation) {
    const map = {
      searchProducts:"search",
      searchFlights:"search",
      searchHotels:"search",
      getPrice:"price_read",
      getAvailability:"availability_read",
      getShippingEstimate:"shipping_read",
      getTaxEstimate:"tax_read",
      getOfficialUrl:"metadata_read",
      healthCheck:"metadata_read",
      syncMetadata:"metadata_read",
      validateSource:"metadata_read",
      getDataTimestamp:"metadata_read"
    };
    return map[text(operation)] || "";
  }

  function buildGlobalShoppingProviderPermissionModel(input) {
    const safe = obj(input);
    const mode = text(safe.mode || "default_disabled");
    const byPermission = {};
    PERMISSIONS.forEach(function (permission) {
      byPermission[permission] = disabledPermission(permission);
    });
    if (mode === "read_only_sandbox") {
      ["search", "price_read", "availability_read", "shipping_read", "tax_read", "metadata_read"].forEach(function (permission) {
        byPermission[permission] = {
          permission:permission,
          status:"read_only_allowed",
          allowed:true,
          reason:"sandbox_read_only"
        };
      });
    }
    const requestedOperation = text(safe.operation || "");
    const requiredPermission = operationPermission(requestedOperation);
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PERMISSION_MODEL_VERSION,
      mode:mode,
      providerId:text(safe.providerId || ""),
      requestedOperation:requestedOperation,
      requiredPermission:requiredPermission,
      permissions:PERMISSIONS.map(function (permission) {
        return byPermission[permission];
      }),
      allowed:requiredPermission ? byPermission[requiredPermission].allowed === true : false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderPermissionModel = {
    GLOBAL_SHOPPING_PROVIDER_PERMISSION_MODEL_VERSION,
    MODEL_NAME,
    PERMISSIONS,
    buildGlobalShoppingProviderPermissionModel,
    operationPermission
  };
})();
