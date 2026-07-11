;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_FIELD_MAPPING_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_rakuten_field_mapping_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildMappings() {
    return {
      searchProducts:{
        title:"itemName",
        price:"itemPrice",
        priceLabel:"itemPrice",
        currency:"request_currency_or_JPY",
        targetUrl:"itemUrl",
        providerName:"shopName",
        providerUrl:"shopUrl",
        category:"product"
      },
      searchHotels:{
        title:"hotelName",
        price:"hotelMinCharge",
        priceLabel:"hotelMinCharge",
        currency:"request_currency_or_JPY",
        targetUrl:"hotelInformationUrl",
        providerName:"hotelName",
        imageUrl:"hotelThumbnailUrl",
        category:"hotel"
      }
    };
  }

  function buildGlobalShoppingRakutenFieldMapping(input) {
    const safe = input && typeof input === "object" ? input : {};
    const operation = text(safe.operation || "");
    const mappings = buildMappings();
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_FIELD_MAPPING_VERSION,
      providerId:text(safe.providerId || "rakuten_japan"),
      mappings:mappings,
      operation:operation && mappings[operation] ? mappings[operation] : null,
      inferredFields:["currency"],
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRakutenFieldMapping = {
    GLOBAL_SHOPPING_RAKUTEN_FIELD_MAPPING_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRakutenFieldMapping
  };
})();
