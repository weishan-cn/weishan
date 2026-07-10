;(function () {
  "use strict";

  const GLOBAL_SHOPPING_AMAZON_SANDBOX_ADAPTER_VERSION = "4.2.8";
  const ADAPTER_NAME = "global_shopping_amazon_sandbox_adapter_v1";

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

  function planned(providerId, key) {
    const api = contractApi();
    if (typeof api.buildGlobalShoppingProviderAdapterContract === "function") {
      return api.buildGlobalShoppingProviderAdapterContract({ providerId:providerId })[key];
    }
    return {
      providerId:providerId,
      status:"planned",
      available:false,
      sourceType:"sandbox",
      dataConfidence:"mock"
    };
  }

  function now(input) {
    return text(obj(input).capturedAt || "") || new Date().toISOString();
  }

  function query(input) {
    return text(obj(input).query || "Amazon sandbox search");
  }

  function createGlobalShoppingAmazonSandboxAdapter(input) {
    const safe = obj(input);
    const providerId = text(obj(safe.provider).providerId || safe.providerId || "amazon_us");
    return {
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_SHOPPING_AMAZON_SANDBOX_ADAPTER_VERSION,
      providerId:providerId,
      searchProducts:function (params) {
        const q = query(params);
        return clone({
          providerId:providerId,
          status:"sandbox",
          available:true,
          sourceType:"sandbox",
          dataConfidence:"mock",
          timestamp:now(params),
          results:[{
            providerId:providerId,
            title:q + " - Amazon Sandbox",
            category:"product",
            price:null,
            currency:text(obj(params).currency || "USD"),
            availability:"unknown",
            officialUrl:"https://www.amazon.com/s?k=" + encodeURIComponent(q),
            sourceType:"sandbox",
            timestamp:now(params),
            confidence:"mock"
          }],
          redacted:true
        });
      },
      searchFlights:function () { return clone(planned(providerId, "searchFlights")); },
      searchHotels:function () { return clone(planned(providerId, "searchHotels")); },
      getPrice:function (params) {
        return clone({
          providerId:providerId,
          status:"sandbox",
          available:true,
          price:null,
          currency:text(obj(params).currency || "USD"),
          sourceType:"sandbox",
          dataConfidence:"mock",
          timestamp:now(params),
          note:"模拟价格结构，最终价格请以 Amazon 官方页面为准。",
          redacted:true
        });
      },
      getAvailability:function (params) {
        return clone({
          providerId:providerId,
          status:"sandbox",
          available:true,
          availabilityStatus:"unknown",
          sourceType:"sandbox",
          dataConfidence:"mock",
          timestamp:now(params),
          redacted:true
        });
      },
      getShippingEstimate:function () { return clone(planned(providerId, "getShippingEstimate")); },
      getTaxEstimate:function () { return clone(planned(providerId, "getTaxEstimate")); },
      getOfficialUrl:function (params) {
        return clone({
          providerId:providerId,
          status:"sandbox",
          available:true,
          officialUrl:"https://www.amazon.com/s?k=" + encodeURIComponent(query(params)),
          sourceType:"sandbox",
          dataConfidence:"mock",
          timestamp:now(params),
          redacted:true
        });
      },
      healthCheck:function () {
        return clone({
          providerId:providerId,
          status:"sandbox",
          available:true,
          sourceType:"sandbox",
          dataConfidence:"mock",
          timestamp:new Date().toISOString(),
          note:"Amazon sandbox adapter ready; no real provider connection.",
          redacted:true
        });
      }
    };
  }

  window.WeishanGlobalShoppingAmazonSandboxAdapter = {
    GLOBAL_SHOPPING_AMAZON_SANDBOX_ADAPTER_VERSION,
    ADAPTER_NAME,
    createGlobalShoppingAmazonSandboxAdapter,
    createGlobalShoppingSandboxAdapter:createGlobalShoppingAmazonSandboxAdapter
  };
})();
