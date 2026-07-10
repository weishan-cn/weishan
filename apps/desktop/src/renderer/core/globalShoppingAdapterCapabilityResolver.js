;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ADAPTER_CAPABILITY_RESOLVER_VERSION = "4.2.8";
  const RESOLVER_NAME = "global_shopping_adapter_capability_resolver_v1";

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

  function capabilityApi() {
    return window.WeishanGlobalShoppingProviderCapabilityModel || {};
  }

  function buildCapabilityModel(input) {
    const api = capabilityApi();
    if (typeof api.buildGlobalShoppingProviderCapabilityModel === "function") {
      return api.buildGlobalShoppingProviderCapabilityModel(input);
    }
    return {
      search:"planned",
      price:"planned",
      availability:"planned",
      officialProduct:"disabled",
      taxInfo:"disabled",
      shippingEstimate:"planned"
    };
  }

  function enabled(status) {
    return status === "available" || status === "planned";
  }

  function buildGlobalShoppingAdapterCapabilityResult(input) {
    const safe = obj(input);
    const provider = obj(safe.providerId ? safe : safe.provider);
    const categories = toArray(provider.categories);
    const capabilityModel = obj(safe.capabilityModel && typeof safe.capabilityModel === "object" ? safe.capabilityModel : buildCapabilityModel(provider));
    const result = {
      resolverName:RESOLVER_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_CAPABILITY_RESOLVER_VERSION,
      providerId:text(provider.providerId || safe.providerId || ""),
      productSearch:categories.indexOf("product") >= 0 && enabled(capabilityModel.search),
      flightSearch:categories.indexOf("flight") >= 0 && enabled(capabilityModel.search),
      hotelSearch:categories.indexOf("hotel") >= 0 && enabled(capabilityModel.search),
      price:enabled(capabilityModel.price),
      availability:enabled(capabilityModel.availability),
      shippingEstimate:enabled(capabilityModel.shippingEstimate),
      taxEstimate:enabled(capabilityModel.taxInfo),
      officialUrl:enabled(capabilityModel.officialProduct) || enabled(capabilityModel.search),
      healthCheck:true,
      adapterStatus:"planned"
    };
    result.searchCategories = ["productSearch", "flightSearch", "hotelSearch"].filter(function (key) {
      return result[key];
    });
    result.availableData = ["price", "availability", "shippingEstimate", "taxEstimate", "officialUrl", "healthCheck"].filter(function (key) {
      return result[key];
    });
    result.adapterStatus = result.searchCategories.length ? "sandbox_ready" : "planned";
    result.redacted = true;
    return clone(result);
  }

  window.WeishanGlobalShoppingAdapterCapabilityResolver = {
    GLOBAL_SHOPPING_ADAPTER_CAPABILITY_RESOLVER_VERSION,
    RESOLVER_NAME,
    buildGlobalShoppingAdapterCapabilityResult
  };
})();
