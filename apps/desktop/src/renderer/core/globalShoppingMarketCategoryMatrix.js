;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MARKET_CATEGORY_MATRIX_VERSION = "4.2.8";
  const MATRIX_NAME = "global_shopping_market_category_matrix_v1";

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

  function providerRegistryApi() {
    return window.WeishanGlobalShoppingProviderRegistry || {};
  }

  function categoryApi() {
    return window.WeishanGlobalShoppingCategoryIntelligenceModel || {};
  }

  function providers() {
    const api = providerRegistryApi();
    return typeof api.listGlobalShoppingProviders === "function" ? toArray(api.listGlobalShoppingProviders()) : [];
  }

  function buildCategory(input) {
    const api = categoryApi();
    return typeof api.getGlobalShoppingCategoryIntelligence === "function"
      ? obj(api.getGlobalShoppingCategoryIntelligence(input).categoryIntelligence)
      : { categoryId:"electronics", providers:[] };
  }

  function buildGlobalShoppingMarketCategoryMatrix(input) {
    const safe = obj(input);
    const market = text(safe.market || safe.country || "");
    const category = buildCategory({ categoryId:safe.categoryId, query:safe.query });
    const rows = providers().filter(function (provider) {
      const countries = toArray(provider.countries);
      const categories = toArray(provider.categories);
      return (!market || countries.indexOf(market) >= 0 || (market !== "EU" && countries.indexOf("EU") >= 0))
        && (!category.categoryId || categories.indexOf(category.categoryId === "electronics" ? "product" : category.categoryId) >= 0 || categories.indexOf(category.categoryId) >= 0);
    }).map(function (provider) {
      return {
        market:market || "GLOBAL",
        categoryId:category.categoryId,
        providerId:text(provider.providerId || ""),
        providerName:text(provider.name || "")
      };
    });
    return clone({
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_MARKET_CATEGORY_MATRIX_VERSION,
      rows:rows,
      rowCount:rows.length,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingMarketCategoryMatrix = {
    GLOBAL_SHOPPING_MARKET_CATEGORY_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingMarketCategoryMatrix
  };
})();
