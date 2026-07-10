;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PROVIDER_ADAPTER_VERSION = "4.2.8";
  const ADAPTER_NAME = "global_shopping_sandbox_provider_adapter_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function contractApi() {
    return window.WeishanGlobalShoppingProviderAdapterContract || {};
  }

  function resolverApi() {
    return window.WeishanGlobalShoppingAdapterCapabilityResolver || {};
  }

  function contractFor(input) {
    const api = contractApi();
    if (typeof api.buildGlobalShoppingProviderAdapterContract === "function") {
      return api.buildGlobalShoppingProviderAdapterContract(input);
    }
    return {};
  }

  function capabilityFor(input) {
    const api = resolverApi();
    if (typeof api.buildGlobalShoppingAdapterCapabilityResult === "function") {
      return api.buildGlobalShoppingAdapterCapabilityResult(input);
    }
    return {};
  }

  function timeValue(input) {
    const value = text(input && input.capturedAt || "");
    return value || new Date().toISOString();
  }

  function queryValue(input, fallback) {
    return text(input && input.query || fallback || "平台搜索");
  }

  function templateUrl(provider, category, query) {
    const templates = obj(provider.searchTemplates);
    const base = text(templates[category] || templates.product || templates.flight || templates.hotel || "");
    return base ? base.replace(/\{query\}/g, encodeURIComponent(query)) : "";
  }

  function searchPayload(provider, category, input, capabilities) {
    const query = queryValue(input, "平台搜索");
    const supported = category === "product"
      ? capabilities.productSearch
      : (category === "flight" ? capabilities.flightSearch : capabilities.hotelSearch);
    if (!supported) {
      return contractFor({ providerId:provider.providerId })[
        category === "product" ? "searchProducts" : (category === "flight" ? "searchFlights" : "searchHotels")
      ];
    }
    return {
      providerId:text(provider.providerId || ""),
      status:"sandbox",
      available:true,
      sourceType:"sandbox",
      dataConfidence:"mock",
      networkEnabled:false,
      providerConnected:false,
      readOnlyPreparation:true,
      category:category,
      results:[{
        providerId:text(provider.providerId || ""),
        title:query,
        category:category,
        price:null,
        currency:text(input && input.currency || ""),
        availability:category === "hotel" ? "available" : (category === "flight" ? "limited" : "unknown"),
        officialUrl:templateUrl(provider, category, query),
        timestamp:timeValue(input),
        confidence:"mock"
      }],
      redacted:true
    };
  }

  function detailPayload(provider, method, input, capabilities) {
    if (method === "getPrice" && !capabilities.price) return contractFor({ providerId:provider.providerId }).getPrice;
    if (method === "getAvailability" && !capabilities.availability) return contractFor({ providerId:provider.providerId }).getAvailability;
    if (method === "getShippingEstimate" && !capabilities.shippingEstimate) return contractFor({ providerId:provider.providerId }).getShippingEstimate;
    if (method === "getTaxEstimate" && !capabilities.taxEstimate) return contractFor({ providerId:provider.providerId }).getTaxEstimate;
    if (method === "getOfficialUrl" && !capabilities.officialUrl) return contractFor({ providerId:provider.providerId }).getOfficialUrl;
    return {
      providerId:text(provider.providerId || ""),
      status:"sandbox",
      available:true,
      sourceType:"sandbox",
      dataConfidence:"mock",
      networkEnabled:false,
      providerConnected:false,
      readOnlyPreparation:true,
      timestamp:timeValue(input),
      currency:text(input && input.currency || ""),
      officialUrl:templateUrl(provider, text(input && input.category || "product"), queryValue(input, "平台搜索")),
      availabilityStatus:method === "getAvailability" ? "unknown" : undefined,
      price:null,
      note:"只返回 sandbox 占位结构，不代表真实平台结果。",
      redacted:true
    };
  }

  function createGlobalShoppingSandboxProviderAdapter(input) {
    const safe = obj(input);
    const provider = obj(safe.provider);
    const capabilities = capabilityFor({
      provider:provider,
      capabilityModel:safe.capabilityModel
    });
    return {
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_ADAPTER_VERSION,
      providerId:text(provider.providerId || safe.providerId || ""),
      searchProducts:function (params) {
        return clone(searchPayload(provider, "product", params, capabilities));
      },
      searchFlights:function (params) {
        return clone(searchPayload(provider, "flight", params, capabilities));
      },
      searchHotels:function (params) {
        return clone(searchPayload(provider, "hotel", params, capabilities));
      },
      getPrice:function (params) {
        return clone(detailPayload(provider, "getPrice", params, capabilities));
      },
      getAvailability:function (params) {
        return clone(detailPayload(provider, "getAvailability", params, capabilities));
      },
      getShippingEstimate:function (params) {
        return clone(detailPayload(provider, "getShippingEstimate", params, capabilities));
      },
      getTaxEstimate:function (params) {
        return clone(detailPayload(provider, "getTaxEstimate", params, capabilities));
      },
      getOfficialUrl:function (params) {
        return clone(detailPayload(provider, "getOfficialUrl", params, capabilities));
      },
      healthCheck:function () {
        return clone({
          providerId:text(provider.providerId || safe.providerId || ""),
          status:"sandbox",
          available:true,
          sourceType:"sandbox",
          dataConfidence:"mock",
          networkEnabled:false,
          providerConnected:false,
          readOnlyPreparation:true,
          note:"sandbox adapter 可用，但未连接真实 Provider。",
          redacted:true
        });
      }
    };
  }

  window.WeishanGlobalShoppingSandboxProviderAdapter = {
    GLOBAL_SHOPPING_SANDBOX_PROVIDER_ADAPTER_VERSION,
    ADAPTER_NAME,
    createGlobalShoppingSandboxProviderAdapter
  };
})();
