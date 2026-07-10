;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_ADAPTER_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_shopping_sandbox_adapter_registry_v1";

  const REGISTRY = [
    {
      providerId:"amazon_us",
      category:"product",
      capabilities:["search", "price_read", "availability_read", "official_url"],
      region:["US", "GLOBAL"],
      status:"sandbox_ready",
      adapterGlobal:"WeishanGlobalShoppingAmazonSandboxAdapter"
    },
    {
      providerId:"rakuten_japan",
      category:"product",
      capabilities:["search", "price_read", "availability_read", "official_url"],
      region:["JP"],
      status:"sandbox_ready",
      adapterGlobal:"WeishanGlobalShoppingRakutenSandboxAdapter"
    },
    {
      providerId:"booking",
      category:"hotel",
      capabilities:["search", "price_read", "availability_read", "official_url"],
      region:["GLOBAL", "JP", "US", "EU"],
      status:"sandbox_ready",
      adapterGlobal:"WeishanGlobalShoppingBookingSandboxAdapter"
    }
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

  function listGlobalShoppingSandboxAdapters() {
    return REGISTRY.map(function (item) {
      return clone(item);
    });
  }

  function findGlobalShoppingSandboxAdapter(input) {
    const safe = obj(input);
    const providerId = text(safe.providerId || input || "");
    const category = text(safe.category || "");
    const match = REGISTRY.find(function (item) {
      return text(item.providerId || "") === providerId
        && (!category || text(item.category || "") === category);
    }) || REGISTRY.find(function (item) {
      return text(item.providerId || "") === providerId;
    }) || null;
    return match ? clone(match) : null;
  }

  window.WeishanGlobalShoppingSandboxAdapterRegistry = {
    GLOBAL_SHOPPING_SANDBOX_ADAPTER_REGISTRY_VERSION,
    REGISTRY_NAME,
    listGlobalShoppingSandboxAdapters,
    findGlobalShoppingSandboxAdapter
  };
})();
