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

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
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
    const contract = {
      contractName:CONTRACT_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION,
      providerId:text(safe.providerId || ""),
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
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderAdapterContract = {
    GLOBAL_SHOPPING_PROVIDER_ADAPTER_CONTRACT_VERSION,
    CONTRACT_NAME,
    METHOD_NAMES,
    buildGlobalShoppingProviderAdapterContract,
    createGlobalShoppingProviderAdapter,
    validateAdapterContract
  };
})();
