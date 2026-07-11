;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RAKUTEN_REQUEST_SCHEMA_VERSION = "4.2.8";
  const MODEL_NAME = "global_shopping_rakuten_request_schema_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function buildOperationMap() {
    return {
      searchProducts:{
        endpointName:"rakuten_ichiba_item_search",
        endpointUrl:"https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701",
        authType:"app_id_access_key",
        requiredParameters:["applicationId", "accessKey", "keyword"],
        optionalParameters:["affiliateId", "format", "formatVersion", "elements", "hits", "page", "sort", "minPrice", "maxPrice", "availability", "shipOverseasFlag", "postageFlag"],
        categories:["product"],
        source:"official_rakuten_web_service_docs"
      },
      searchHotels:{
        endpointName:"rakuten_travel_keyword_hotel_search",
        endpointUrl:"https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426",
        authType:"app_id_access_key",
        requiredParameters:["applicationId", "accessKey", "keyword"],
        optionalParameters:["affiliateId", "format", "formatVersion", "elements", "hits", "page", "middleClassCode", "searchField", "hotelChainCode", "responseType", "sort"],
        categories:["hotel"],
        source:"official_rakuten_web_service_docs"
      }
    };
  }

  function buildGlobalShoppingRakutenRequestSchema(input) {
    const safe = input && typeof input === "object" ? input : {};
    const operation = text(safe.operation || "");
    const operations = buildOperationMap();
    const selected = operation && operations[operation] ? operations[operation] : null;
    return clone({
      modelName:MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_RAKUTEN_REQUEST_SCHEMA_VERSION,
      providerId:text(safe.providerId || "rakuten_japan"),
      operations:operations,
      operation:selected,
      supportedOperations:Object.keys(operations),
      networkExecutionEnabled:false,
      transactionEnabled:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingRakutenRequestSchema = {
    GLOBAL_SHOPPING_RAKUTEN_REQUEST_SCHEMA_VERSION,
    MODEL_NAME,
    buildGlobalShoppingRakutenRequestSchema
  };
})();
