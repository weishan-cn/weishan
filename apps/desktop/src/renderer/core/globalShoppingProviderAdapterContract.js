;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION = "4.2.8";
  const CONTRACT_NAME = "global_shopping_provider_adapter_contract_v1";
  const METHOD_NAMES = [
    "searchProducts",
    "searchFlights",
    "searchHotels",
    "getPrice",
    "getAvailability",
    "getShippingEstimate",
    "getTaxEstimate",
    "getOfficialUrl",
    "healthCheck",
    "syncMetadata",
    "validateSource",
    "getDataTimestamp"
  ];

  function realProviderLayerApi() {
    return window.WeishanGlobalShoppingRakutenRealProviderAdapterContractLayer || {};
  }
  function rakutenRealAdapterApi() {
    return window.WeishanGlobalShoppingRakutenRealProviderAdapter || {};
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function plannedMethod(name) {
    return {
      method:name,
      status:"planned",
      available:false,
      networkEnabled:false,
      providerConnected:false,
      readOnlyPreparation:true,
      sourceType:"sandbox",
      dataConfidence:"mock",
      gatewayMetadata:{
        gatewayMode:"sandbox_only",
        providerReady:false,
        reason:"gateway_not_connected"
      },
      permissionCheck:{
        requiredPermission:name === "searchProducts" || name === "searchFlights" || name === "searchHotels"
          ? "search"
          : (name === "getPrice"
            ? "price_read"
            : (name === "getAvailability"
              ? "availability_read"
              : (name === "getShippingEstimate"
                ? "shipping_read"
                : (name === "getTaxEstimate" ? "tax_read" : "metadata_read")))),
        allowed:false,
        reason:"default_disabled"
      },
      requestContext:{
        networkEnabled:false,
        credentialRead:false,
        requestPolicy:"sandbox_read_only_only"
      }
    };
  }

  function buildGlobalShoppingProviderAdapterContract(input) {
    const safe = input && typeof input === "object" ? input : {};
    const providerId = text(safe.providerId || "");
    const realProviderPreparation = providerId === "rakuten_japan" && typeof realProviderLayerApi().buildGlobalShoppingRakutenRealProviderAdapterContractLayer === "function"
      ? realProviderLayerApi().buildGlobalShoppingRakutenRealProviderAdapterContractLayer({ providerId:providerId, operation:"searchProducts" })
      : {
        providerId:providerId,
        status:"sandbox_only",
        stage:"sandbox_only",
        networkExecutionEnabled:false,
        transactionEnabled:false,
        credentialStorageAllowed:false,
        blockers:[],
        warnings:[]
      };
    const contract = {
      contractName:CONTRACT_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION,
      providerId:providerId,
      searchProducts:plannedMethod("searchProducts"),
      searchFlights:plannedMethod("searchFlights"),
      searchHotels:plannedMethod("searchHotels"),
      getPrice:plannedMethod("getPrice"),
      getAvailability:plannedMethod("getAvailability"),
      getShippingEstimate:plannedMethod("getShippingEstimate"),
      getTaxEstimate:plannedMethod("getTaxEstimate"),
      getOfficialUrl:plannedMethod("getOfficialUrl"),
      healthCheck:plannedMethod("healthCheck"),
      syncMetadata:plannedMethod("syncMetadata"),
      validateSource:plannedMethod("validateSource"),
      getDataTimestamp:plannedMethod("getDataTimestamp"),
      methods:METHOD_NAMES.slice(),
      realProviderPreparation:clone(realProviderPreparation),
      redacted:true
    };
    return clone(contract);
  }

  function createGlobalShoppingProviderAdapter(input) {
    const contract = buildGlobalShoppingProviderAdapterContract(input);
    const adapter = {
      contractName:contract.contractName,
      appVersion:contract.appVersion,
      providerId:contract.providerId
    };
    METHOD_NAMES.forEach(function (name) {
      adapter[name] = function () {
        return clone(contract[name]);
      };
    });
    return adapter;
  }

  function resultTimestamp(result) {
    const safe = result && typeof result === "object" ? result : {};
    if (text(safe.timestamp || "")) return text(safe.timestamp || "");
    const first = Array.isArray(safe.results) && safe.results[0] && typeof safe.results[0] === "object" ? safe.results[0] : {};
    return text(first.timestamp || "");
  }

  function resultConfidence(result) {
    const safe = result && typeof result === "object" ? result : {};
    if (text(safe.confidence || safe.dataConfidence || "")) return text(safe.confidence || safe.dataConfidence || "");
    const first = Array.isArray(safe.results) && safe.results[0] && typeof safe.results[0] === "object" ? safe.results[0] : {};
    return text(first.confidence || first.dataConfidence || "");
  }

  function resultProviderId(result) {
    const safe = result && typeof result === "object" ? result : {};
    if (text(safe.providerId || "")) return text(safe.providerId || "");
    const first = Array.isArray(safe.results) && safe.results[0] && typeof safe.results[0] === "object" ? safe.results[0] : {};
    return text(first.providerId || "");
  }

  function resultSourceType(result) {
    const safe = result && typeof result === "object" ? result : {};
    if (text(safe.sourceType || "")) return text(safe.sourceType || "");
    const first = Array.isArray(safe.results) && safe.results[0] && typeof safe.results[0] === "object" ? safe.results[0] : {};
    return text(first.sourceType || "");
  }

  function validateAdapterContract(input) {
    const safe = input && typeof input === "object" ? input : {};
    const adapter = safe.adapter && typeof safe.adapter === "object" ? safe.adapter : null;
    const providerId = text(safe.providerId || (adapter && adapter.providerId) || "");
    const operation = text(safe.operation || "searchProducts");
    const payload = safe.payload && typeof safe.payload === "object" ? safe.payload : { query:"sandbox" };
    const requiredMethods = [operation, "getPrice", "getAvailability", "getOfficialUrl", "healthCheck"];
    const errors = [];
    if (!adapter) errors.push("adapter_missing");
    requiredMethods.forEach(function (name) {
      if (!adapter || typeof adapter[name] !== "function") errors.push(name + "_missing");
    });
    if (errors.length) {
      return clone({
        contractName:CONTRACT_NAME,
        appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION,
        providerId:providerId,
        valid:false,
        errors:errors,
        checkedMethods:requiredMethods,
        redacted:true
      });
    }
    const searchResult = adapter[operation](payload);
    const priceResult = adapter.getPrice(payload);
    const availabilityResult = adapter.getAvailability(payload);
    const officialUrlResult = adapter.getOfficialUrl(payload);
    const sampleResults = [searchResult, priceResult, availabilityResult, officialUrlResult];
    sampleResults.forEach(function (result, index) {
      const methodName = requiredMethods[index];
      if (resultProviderId(result) !== providerId) errors.push(methodName + "_providerId_invalid");
      if (resultSourceType(result) !== "sandbox") errors.push(methodName + "_sourceType_invalid");
      if (resultConfidence(result) !== "mock") errors.push(methodName + "_confidence_invalid");
      if (!resultTimestamp(result)) errors.push(methodName + "_timestamp_missing");
    });
    return clone({
      contractName:CONTRACT_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION,
      providerId:providerId,
      valid:errors.length === 0,
      errors:errors,
      checkedMethods:requiredMethods,
      providerPreparationStatus:text(obj(buildGlobalShoppingProviderAdapterContract({ providerId:providerId })).realProviderPreparation.status || ""),
      redacted:true
    });
  }

  async function validateRealProviderAdapterContractAsync(input) {
    const safe = input && typeof input === "object" ? input : {};
    const adapter = safe.adapter && typeof safe.adapter === "object" ? safe.adapter : null;
    const providerId = text(safe.providerId || (adapter && adapter.providerId) || "");
    const operation = text(safe.operation || "searchProducts");
    const payload = safe.payload && typeof safe.payload === "object" ? safe.payload : { keyword:"rakuten" };
    const errors = [];
    const requiredMethods = [operation, "getPrice", "getAvailability", "getOfficialUrl", "healthCheck"];
    const contract = buildGlobalShoppingProviderAdapterContract({ providerId:providerId });
    if (providerId !== "rakuten_japan") errors.push("real_provider_not_supported");
    if (text(obj(contract.realProviderPreparation).status || "") !== "documented") errors.push("real_provider_preparation_missing");
    if (!adapter) errors.push("adapter_missing");
    requiredMethods.forEach(function (name) {
      if (!adapter || typeof adapter[name] !== "function") errors.push(name + "_missing");
    });
    if (errors.length) {
      return clone({
        contractName:CONTRACT_NAME,
        appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION,
        providerId:providerId,
        valid:false,
        mode:"real_provider_readonly",
        errors:errors,
        checkedMethods:requiredMethods,
        providerPreparationStatus:text(obj(contract.realProviderPreparation).status || ""),
        redacted:true
      });
    }
    const productResult = await adapter[operation](payload);
    const healthResult = await adapter.healthCheck(payload);
    if (text(obj(productResult).sourceType || "") !== "rakuten_api") errors.push(operation + "_sourceType_invalid");
    if (productResult && obj(productResult).error && /runtime_credentials_missing|real_provider_readonly_not_approved/.test(text(obj(productResult.error).message || ""))) {
      errors.push(operation + "_runtime_not_ready");
    }
    if (healthResult && text(obj(healthResult).sourceType || "") !== "rakuten_api") errors.push("healthCheck_sourceType_invalid");
    return clone({
      contractName:CONTRACT_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION,
      providerId:providerId,
      valid:errors.length === 0,
      mode:"real_provider_readonly",
      errors:errors,
      checkedMethods:requiredMethods,
      providerPreparationStatus:text(obj(contract.realProviderPreparation).status || ""),
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderAdapterContract = {
    GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION,
    CONTRACT_NAME,
    METHOD_NAMES,
    buildGlobalShoppingProviderAdapterContract,
    createGlobalShoppingProviderAdapter,
    validateAdapterContract,
    validateRealProviderAdapterContractAsync
  };
})();
