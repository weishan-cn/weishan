;(function () {
  "use strict";

  const GLOBAL_SHOPPING_CATEGORY_INTELLIGENCE_MODEL_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_category_intelligence_model_v1";

  const CATEGORY_REGISTRY = {
    electronics:{
      categoryId:"electronics",
      keywords:["iphone", "手机", "电脑", "laptop", "camera", "switch", "electronics"],
      providers:["apple_official", "amazon_us", "amazon_japan", "bestbuy", "jd", "tmall"],
      marketSupport:["US", "JP", "CN", "DE", "FR"]
    },
    fashion:{
      categoryId:"fashion",
      keywords:["fashion", "服装", "鞋", "bag", "dress"],
      providers:["amazon_us", "rakuten_japan", "tmall", "taobao"],
      marketSupport:["US", "JP", "CN", "EU"]
    },
    beauty:{
      categoryId:"beauty",
      keywords:["beauty", "护肤", "makeup", "cosmetics"],
      providers:["amazon_us", "rakuten_japan", "tmall"],
      marketSupport:["US", "JP", "CN", "EU"]
    },
    food:{
      categoryId:"food",
      keywords:["food", "snack", "零食", "饮料"],
      providers:["amazon_us", "rakuten_japan", "jd", "tmall"],
      marketSupport:["US", "JP", "CN"]
    },
    travel:{
      categoryId:"travel",
      keywords:["travel", "trip", "旅游", "度假"],
      providers:["trip_com", "booking", "expedia_flights"],
      marketSupport:["US", "JP", "CN", "EU", "SG"]
    },
    hotel:{
      categoryId:"hotel",
      keywords:["hotel", "酒店", "住宿"],
      providers:["booking", "trip_com", "agoda", "rakuten_japan"],
      marketSupport:["US", "JP", "CN", "EU", "SG"]
    },
    flight:{
      categoryId:"flight",
      keywords:["flight", "机票", "航班"],
      providers:["google_flights", "trip_com", "skyscanner", "ctrip"],
      marketSupport:["US", "JP", "CN", "EU", "SG"]
    }
  };

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function inferCategory(query) {
    const needle = text(query || "").toLowerCase();
    const match = Object.keys(CATEGORY_REGISTRY).find(function (key) {
      return CATEGORY_REGISTRY[key].keywords.some(function (keyword) {
        return needle.indexOf(String(keyword).toLowerCase()) >= 0;
      });
    });
    return match || "electronics";
  }

  function getGlobalShoppingCategoryIntelligence(input) {
    const categoryId = text((input || {}).categoryId || inferCategory((input || {}).query || "")).toLowerCase();
    const record = CATEGORY_REGISTRY[categoryId] || CATEGORY_REGISTRY.electronics;
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_CATEGORY_INTELLIGENCE_MODEL_VERSION,
      categoryIntelligence:record,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingCategoryIntelligenceModel = {
    GLOBAL_SHOPPING_CATEGORY_INTELLIGENCE_MODEL_VERSION,
    MODEL_NAME,
    getGlobalShoppingCategoryIntelligence
  };
})();
