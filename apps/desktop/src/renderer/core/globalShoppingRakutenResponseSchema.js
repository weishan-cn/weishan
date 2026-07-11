;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_RESPONSE_SCHEMA_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_rakuten_response_schema_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildSchemas() {
    return {
      searchProducts:{
        topLevelFields:["count", "page", "hits", "pageCount", "items"],
        itemFields:["itemName", "itemPrice", "itemUrl", "shopName", "shopUrl"],
        formatVersion:2,
        source:"official_rakuten_web_service_docs"
      },
      searchHotels:{
        topLevelFields:["pagingInfo", "hotels"],
        itemFields:["hotelNo", "hotelName", "hotelInformationUrl", "hotelMinCharge", "reviewAverage", "hotelThumbnailUrl", "address1", "address2"],
        formatVersion:2,
        source:"official_rakuten_web_service_docs"
      }
    };
  }

  function buildGlobalShoppingRakutenResponseSchema(input) {
    const safe = input && typeof input === "object" ? input : {};
    const operation = text(safe.operation || "");
    const schemas = buildSchemas();
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_RESPONSE_SCHEMA_VERSION,
      providerId:text(safe.providerId || "rakuten_japan"),
      schemas:schemas,
      operation:operation && schemas[operation] ? schemas[operation] : null,
      responseType:"json_or_xml",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRakutenResponseSchema = {
    GLOBAL_SHOPPING_RAKUTEN_RESPONSE_SCHEMA_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRakutenResponseSchema
  };
})();
