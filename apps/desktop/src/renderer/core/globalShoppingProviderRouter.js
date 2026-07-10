;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ROUTER_VERSION = "4.2.8";
  const ROUTER_NAME = "global_shopping_provider_router_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function registryApi() {
    return window.WeishanGlobalShoppingProviderRegistry || {};
  }

  function rankingApi() {
    return window.WeishanGlobalShoppingProviderRankingEngine || {};
  }

  function resolverApi() {
    return window.WeishanGlobalShoppingAdapterCapabilityResolver || {};
  }

  function contractApi() {
    return window.WeishanGlobalShoppingProviderAdapterContract || {};
  }

  function providers() {
    return typeof registryApi().listGlobalShoppingProviders === "function"
      ? registryApi().listGlobalShoppingProviders()
      : [];
  }

  function buildCapabilityResult(provider) {
    return typeof resolverApi().buildGlobalShoppingAdapterCapabilityResult === "function"
      ? resolverApi().buildGlobalShoppingAdapterCapabilityResult({ provider:provider })
      : null;
  }

  function buildContract(provider) {
    return typeof contractApi().buildGlobalShoppingProviderAdapterContract === "function"
      ? contractApi().buildGlobalShoppingProviderAdapterContract({ providerId:provider.providerId })
      : null;
  }

  function buildGlobalShoppingProviderRoute(input) {
    const safe = obj(input);
    const shoppingContext = obj(safe.shoppingContext);
    const userIntent = obj(safe.userIntent);
    const category = text(userIntent.category || "product");
    const eligibleProviders = providers().filter(function (provider) {
      return provider.categories.indexOf(category) >= 0 && provider.status === "registry_only";
    });
    const rankingResult = typeof rankingApi().buildGlobalShoppingRankedProviderList === "function"
      ? rankingApi().buildGlobalShoppingRankedProviderList({
        shoppingContext:shoppingContext,
        userIntent:{ category:category, query:text(userIntent.query || "") },
        providers:eligibleProviders,
        userPreference:safe.userPreference
      })
      : { rankedProviders:eligibleProviders };
    const results = Array.isArray(rankingResult.rankedProviders) ? rankingResult.rankedProviders.map(function (provider) {
      const adapterCapability = buildCapabilityResult(provider);
      const adapterContract = buildContract(provider);
      return Object.assign({}, provider, {
        adapterCapability:adapterCapability,
        adapterStatus:adapterContract ? {
          contractName:adapterContract.contractName,
          status:"planned",
          available:false,
          sourceType:"sandbox"
        } : null
      });
    }) : [];
    return clone({
      routerName:ROUTER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ROUTER_VERSION,
      shoppingContext:shoppingContext,
      userIntent:{
        category:category,
        query:text(userIntent.query || "")
      },
      candidateProviders:results,
      candidateCount:results.length,
      weights:rankingResult.weights || null,
      routeSummary:results.length
        ? "已按地区、语言、币种、品类和可信度生成候选 Provider 列表，并补充 sandbox adapter 适配能力。"
        : "当前上下文下没有可用的只读 Provider 候选。",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderRouter = {
    GLOBAL_SHOPPING_PROVIDER_ROUTER_VERSION,
    ROUTER_NAME,
    buildGlobalShoppingProviderRoute
  };
})();
