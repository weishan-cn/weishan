;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER_CONTRACT_LAYER_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_rakuten_real_provider_adapter_contract_layer_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function authApi() { return window.WeishanGlobalShoppingRakutenAuthAbstraction || {}; }
  function requestApi() { return window.WeishanGlobalShoppingRakutenRequestSchema || {}; }
  function responseApi() { return window.WeishanGlobalShoppingRakutenResponseSchema || {}; }
  function fieldApi() { return window.WeishanGlobalShoppingRakutenFieldMapping || {}; }
  function rateLimitApi() { return window.WeishanGlobalShoppingRakutenRateLimitModel || {}; }
  function errorApi() { return window.WeishanGlobalShoppingRakutenErrorMapping || {}; }
  function auditApi() { return window.WeishanGlobalShoppingRakutenAuditTrace || {}; }

  function buildOr(api, method, input, fallback) {
    return typeof api[method] === "function" ? api[method](input) : fallback;
  }

  function buildGlobalShoppingRakutenRealProviderAdapterContractLayer(input) {
    const safe = input && typeof input === "object" ? input : {};
    const providerId = text(safe.providerId || "rakuten_japan");
    const operation = text(safe.operation || "searchProducts");
    const authentication = buildOr(authApi(), "buildGlobalShoppingRakutenAuthAbstraction", { providerId:providerId }, { valid:false, authType:"unknown" });
    const requestSchema = buildOr(requestApi(), "buildGlobalShoppingRakutenRequestSchema", { providerId:providerId, operation:operation }, { operation:null, operations:{} });
    const responseSchema = buildOr(responseApi(), "buildGlobalShoppingRakutenResponseSchema", { providerId:providerId, operation:operation }, { operation:null, schemas:{} });
    const fieldMapping = buildOr(fieldApi(), "buildGlobalShoppingRakutenFieldMapping", { providerId:providerId, operation:operation }, { operation:null, mappings:{} });
    const rateLimitModel = buildOr(rateLimitApi(), "buildGlobalShoppingRakutenRateLimitModel", { providerId:providerId }, { exactLimitKnown:false });
    const errorMapping = buildOr(errorApi(), "buildGlobalShoppingRakutenErrorMapping", { providerId:providerId }, { mappings:[] });
    const auditTrace = buildOr(auditApi(), "buildGlobalShoppingRakutenAuditTrace", {
      providerId:providerId,
      operation:operation,
      endpointName:text((requestSchema.operation || {}).endpointName || ""),
      authMode:text(authentication.authType || "")
    }, { providerId:providerId, operation:operation, executionMode:"design_only" });

    const blockers = [];
    const warnings = [];
    if (authentication.valid !== true) blockers.push(text(authentication.invalidReason || "auth_model_invalid"));
    if (!requestSchema.operation) blockers.push("request_schema_missing");
    if (!responseSchema.operation) blockers.push("response_schema_missing");
    if (!fieldMapping.operation) blockers.push("field_mapping_missing");
    if (rateLimitModel.exactLimitKnown !== true) warnings.push("rate_limit_exact_threshold_unknown");
    warnings.push("sandbox_and_production_must_remain_separate");
    warnings.push("no_checkout_payment_order_enabled");

    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER_CONTRACT_LAYER_VERSION,
      providerId:providerId,
      operation:operation,
      status:blockers.length ? "blocked" : "documented",
      stage:"real_provider_preparation",
      authentication:authentication,
      requestSchema:requestSchema,
      responseSchema:responseSchema,
      fieldMapping:fieldMapping,
      rateLimitModel:rateLimitModel,
      errorMapping:errorMapping,
      auditTrace:auditTrace,
      networkExecutionEnabled:false,
      transactionEnabled:false,
      credentialStorageAllowed:false,
      oauthSupported:false,
      blockers:blockers,
      warnings:warnings,
      source:"official_rakuten_web_service_docs_plus_local_design_mapping",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRakutenRealProviderAdapterContractLayer = {
    GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER_CONTRACT_LAYER_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRakutenRealProviderAdapterContractLayer
  };
})();
