;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_SANDBOX_ADAPTER_VERSION = "4.2.8";
  const ADAPTER_NAME = "global_shopping_rakuten_sandbox_adapter_v1";

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
    return text(obj(input).query || "Rakuten sandbox search");
  }

  function createGlobalShoppingRakutenSandboxAdapter(input) {
    const safe = obj(input);
    const providerId = text(obj(safe.provider).providerId || safe.providerId || "rakuten_japan");
    return {
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_SANDBOX_ADAPTER_VERSION,
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
            title:q + " - Rakuten Sandbox",
            category:"product",
            price:null,
            currency:text(obj(params).currency || "JPY"),
            availability:"limited",
            officialUrl:"https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(q) + "/",
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
          currency:text(obj(params).currency || "JPY"),
          sourceType:"sandbox",
          dataConfidence:"mock",
          timestamp:now(params),
          note:"模拟价格结构，最终价格请以 Rakuten 页面为准。",
          redacted:true
        });
      },
      getAvailability:function (params) {
        return clone({
          providerId:providerId,
          status:"sandbox",
          available:true,
          availabilityStatus:"limited",
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
          officialUrl:"https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(query(params)) + "/",
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
          note:"Rakuten sandbox adapter ready; no real provider connection.",
          redacted:true
        });
      }
    };
  }

  window.WeishanGlobalShoppingRakutenSandboxAdapter = {
    GLOBAL_SHOPPING_RAKUTEN_SANDBOX_ADAPTER_VERSION,
    ADAPTER_NAME,
    createGlobalShoppingRakutenSandboxAdapter,
    createGlobalShoppingSandboxAdapter:createGlobalShoppingRakutenSandboxAdapter
  };
})();
