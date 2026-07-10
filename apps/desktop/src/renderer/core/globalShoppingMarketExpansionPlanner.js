;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MARKET_EXPANSION_PLANNER_VERSION = "4.2.8";
  const ENGINE_NAME = "global_shopping_market_expansion_planner_v1";
  const DEFAULT_CATEGORIES = ["product", "flight", "hotel"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function toArray(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function marketApi() {
    return window.WeishanGlobalShoppingMarketProfileRegistry || {};
  }

  function onboardingApi() {
    return window.WeishanGlobalShoppingProviderOnboardingRegistry || {};
  }

  function marketProfile(country) {
    if (typeof marketApi().getGlobalShoppingMarketProfile === "function") {
      return marketApi().getGlobalShoppingMarketProfile({ country:country }).marketProfile;
    }
    return null;
  }

  function onboardingRecords() {
    return typeof onboardingApi().listGlobalShoppingProviderOnboardingRecords === "function"
      ? onboardingApi().listGlobalShoppingProviderOnboardingRecords()
      : [];
  }

  function buildGlobalShoppingMarketExpansionPlan(input) {
    const country = text((input && input.country) || "US").toUpperCase();
    const profile = marketProfile(country) || { supportedCategories:DEFAULT_CATEGORIES, preferredProviders:[] };
    const records = onboardingRecords().filter(function (item) {
      return toArray(item.countries).indexOf(country) >= 0;
    });
    const coveredCategories = {};
    records.forEach(function (item) {
      toArray(item.categories).forEach(function (category) {
        coveredCategories[category] = true;
      });
    });
    const missingCategories = toArray(profile.supportedCategories || DEFAULT_CATEGORIES).filter(function (category) {
      return !coveredCategories[category];
    });
    const priority = missingCategories.length >= 2 ? "high" : (missingCategories.length === 1 ? "medium" : "low");
    return clone({
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_MARKET_EXPANSION_PLANNER_VERSION,
      country:country,
      missingCategories:missingCategories,
      recommendedProviders:toArray(profile.preferredProviders),
      priority:priority,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingMarketExpansionPlanner = {
    GLOBAL_SHOPPING_MARKET_EXPANSION_PLANNER_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingMarketExpansionPlan
  };
})();
