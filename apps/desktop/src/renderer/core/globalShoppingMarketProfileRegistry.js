;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MARKET_PROFILE_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_shopping_market_profile_registry_v1";

  const PROFILES = {
    US:{
      country:"US",
      languages:["en-US"],
      currency:"USD",
      preferredProviders:["apple_official", "amazon_us", "bestbuy"],
      supportedCategories:["product", "flight", "hotel"],
      taxProfile:"sales_tax_and_import_rules_vary_by_state",
      shoppingBehavior:"official_and_major_marketplaces"
    },
    JP:{
      country:"JP",
      languages:["ja-JP", "en-US"],
      currency:"JPY",
      preferredProviders:["amazon_japan", "rakuten_japan", "trip_com"],
      supportedCategories:["product", "flight", "hotel"],
      taxProfile:"consumption_tax_and_import_review_required",
      shoppingBehavior:"local_marketplaces_and_official_channels"
    },
    CN:{
      country:"CN",
      languages:["zh-CN"],
      currency:"CNY",
      preferredProviders:["jd", "tmall", "ctrip"],
      supportedCategories:["product", "flight", "hotel"],
      taxProfile:"cross_border_tax_rules_require_manual_confirmation",
      shoppingBehavior:"domestic_marketplaces_and_official_channels"
    },
    DE:{
      country:"DE",
      languages:["de-DE", "en-GB"],
      currency:"EUR",
      preferredProviders:["amazon_us", "booking", "trip_com"],
      supportedCategories:["product", "flight", "hotel"],
      taxProfile:"eu_vat_and_import_duty_review_required",
      shoppingBehavior:"eu_platforms_and_official_sites"
    },
    FR:{
      country:"FR",
      languages:["fr-FR", "en-GB"],
      currency:"EUR",
      preferredProviders:["amazon_us", "booking", "expedia_flights"],
      supportedCategories:["product", "flight", "hotel"],
      taxProfile:"eu_vat_and_import_duty_review_required",
      shoppingBehavior:"eu_platforms_and_official_sites"
    },
    SG:{
      country:"SG",
      languages:["en-SG", "zh-CN"],
      currency:"SGD",
      preferredProviders:["trip_com", "agoda", "booking"],
      supportedCategories:["product", "flight", "hotel"],
      taxProfile:"gst_and_import_review_required",
      shoppingBehavior:"regional_platforms_and_official_sites"
    },
    EU:{
      country:"EU",
      languages:["en", "en-GB"],
      currency:"EUR",
      preferredProviders:["booking", "expedia_flights", "trip_com"],
      supportedCategories:["product", "flight", "hotel"],
      taxProfile:"eu_vat_and_import_duty_review_required",
      shoppingBehavior:"regional_platforms_first"
    }
  };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeCountry(value) {
    const raw = text(value || "").toUpperCase();
    return raw || "US";
  }

  function listGlobalShoppingMarketProfiles() {
    return clone(Object.keys(PROFILES).map(function (key) { return PROFILES[key]; }));
  }

  function getGlobalShoppingMarketProfile(input) {
    const safe = input && typeof input === "object" ? input : {};
    const country = normalizeCountry(safe.country || safe.market || "US");
    const profile = PROFILES[country] || PROFILES.US;
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_MARKET_PROFILE_REGISTRY_VERSION,
      marketProfile:profile,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingMarketProfileRegistry = {
    GLOBAL_SHOPPING_MARKET_PROFILE_REGISTRY_VERSION,
    REGISTRY_NAME,
    listGlobalShoppingMarketProfiles,
    getGlobalShoppingMarketProfile
  };
})();
