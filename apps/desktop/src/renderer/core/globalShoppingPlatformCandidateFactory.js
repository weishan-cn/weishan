;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PLATFORM_CANDIDATE_FACTORY_VERSION = "4.2.7";
  const FACTORY_NAME = "global_shopping_platform_candidate_factory_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function encode(value) { return encodeURIComponent(String(value == null ? "" : value).trim()); }
  function modelApi() { return window.WeishanGlobalShoppingReadOnlySearchResultModel || {}; }
  function buildModel(input) {
    return typeof modelApi().buildGlobalShoppingReadOnlySearchResultModel === "function"
      ? modelApi().buildGlobalShoppingReadOnlySearchResultModel(input)
      : input;
  }
  function normalizeCategory(value) {
    const category = text(value || "product");
    if (category === "ecommerce") return "product";
    return /^(product|flight|hotel)$/.test(category) ? category : "product";
  }
  function extractQuery(input) {
    const safe = obj(input);
    const normalized = obj(safe.normalizedFields);
    return text(
      normalized.productQuery
      || normalized.normalizedQuery
      || normalized.need
      || safe.inputSummary
      || safe.query
      || "全球购搜索"
    );
  }
  function flightQuery(fields, fallback) {
    const origin = text(fields.originText || fields.origin || "");
    const destination = text(fields.destinationText || fields.destination || "");
    const dateText = text(fields.dateText || fields.timing || "");
    return [origin, destination, dateText].filter(Boolean).join(" ").trim() || fallback;
  }
  function hotelQuery(fields, fallback) {
    return text(fields.destinationText || fields.destination || fallback || "酒店搜索");
  }
  function productQuery(fields, fallback) {
    return text(fields.productQuery || fields.normalizedQuery || fallback || "商品搜索");
  }
  function recommendationReason(platformName, category, isOfficial) {
    if (isOfficial) return platformName + " 提供官方入口，适合先核对最终实时价格与规则。";
    if (category === "flight") return platformName + " 适合先比较航班时刻、税费说明与退改条件。";
    if (category === "hotel") return platformName + " 适合先比较位置、取消政策与含税费用。";
    return platformName + " 适合先比较商品价格说明、费用备注与平台可信度。";
  }
  function productCandidates(query) {
    return [
      { platformName:"Apple 官方", isOfficial:true, sourceType:"official", trustLevel:"high", targetUrl:"https://www.apple.com/cn/search/" + encode(query), feeNote:"价格与促销以官网页面为准" },
      { platformName:"京东", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://search.jd.com/Search?keyword=" + encode(query), feeNote:"配送、优惠和到手价以平台页面为准" },
      { platformName:"天猫", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://list.tmall.com/search_product.htm?q=" + encode(query), feeNote:"活动价、运费和店铺规则以平台页面为准" },
      { platformName:"淘宝", isOfficial:false, sourceType:"major_platform", trustLevel:"medium", targetUrl:"https://s.taobao.com/search?q=" + encode(query), feeNote:"店铺差异较大，请核对评价与售后规则" },
      { platformName:"Amazon", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://www.amazon.com/s?k=" + encode(query), feeNote:"跨境运费、税费与汇率以平台页面为准" },
      { platformName:"Best Buy", isOfficial:false, sourceType:"major_platform", trustLevel:"medium", targetUrl:"https://www.bestbuy.com/site/searchpage.jsp?st=" + encode(query), feeNote:"区域库存、配送范围与税费以平台页面为准" },
      { platformName:"eBay", isOfficial:false, sourceType:"aggregator", trustLevel:"review", targetUrl:"https://www.ebay.com/sch/i.html?_nkw=" + encode(query), feeNote:"卖家差异较大，请重点核对信誉与运费" },
      { platformName:"Google Shopping", isOfficial:false, sourceType:"aggregator", trustLevel:"review", targetUrl:"https://www.google.com/search?tbm=shop&q=" + encode(query), feeNote:"聚合结果仅供筛选，价格以落地平台页面为准" }
    ];
  }
  function flightCandidates(query) {
    return [
      { platformName:"Google Flights", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://www.google.com/travel/flights?q=" + encode(query), feeNote:"票价、税费和舱位以平台页面为准" },
      { platformName:"Trip.com", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://www.trip.com/flights/" + "?keyword=" + encode(query), feeNote:"退改签、行李与税费以平台页面为准" },
      { platformName:"携程", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://flights.ctrip.com/online/list/oneway-" + encode(query), feeNote:"票价、行李和退改规则以平台页面为准" },
      { platformName:"Skyscanner", isOfficial:false, sourceType:"major_platform", trustLevel:"medium", targetUrl:"https://www.skyscanner.com/transport/flights/?q=" + encode(query), feeNote:"聚合结果需再核对落地平台与最终税费" },
      { platformName:"Kayak", isOfficial:false, sourceType:"major_platform", trustLevel:"medium", targetUrl:"https://www.kayak.com/flights/" + encode(query), feeNote:"价格与落地商家规则以平台页面为准" },
      { platformName:"Expedia", isOfficial:false, sourceType:"major_platform", trustLevel:"medium", targetUrl:"https://www.expedia.com/Flights-Search?trip=oneway&keyword=" + encode(query), feeNote:"最终价格与附加费用以平台页面为准" },
      { platformName:"中国国航", isOfficial:true, sourceType:"official", trustLevel:"high", targetUrl:"https://www.airchina.com.cn/" , feeNote:"官网适合核对最终直连价格与退改规则" },
      { platformName:"东方航空", isOfficial:true, sourceType:"official", trustLevel:"high", targetUrl:"https://www.ceair.com/" , feeNote:"官网适合核对最终实时票价与航班规则" }
    ];
  }
  function hotelCandidates(query) {
    return [
      { platformName:"Booking.com", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://www.booking.com/searchresults.zh-cn.html?ss=" + encode(query), feeNote:"房价、含税费用和取消政策以平台页面为准" },
      { platformName:"Agoda", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://www.agoda.com/zh-cn/search?textToSearch=" + encode(query), feeNote:"最终含税费用和房型规则以平台页面为准" },
      { platformName:"Hotels.com", isOfficial:false, sourceType:"major_platform", trustLevel:"medium", targetUrl:"https://www.hotels.com/Hotel-Search?destination=" + encode(query), feeNote:"房价、税费和取消政策以平台页面为准" },
      { platformName:"Trip.com 酒店", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://www.trip.com/hotels/list?keyword=" + encode(query), feeNote:"价格、早餐和取消政策以平台页面为准" },
      { platformName:"携程酒店", isOfficial:false, sourceType:"major_platform", trustLevel:"high", targetUrl:"https://hotels.ctrip.com/hotels/list?keyword=" + encode(query), feeNote:"房价、税费和确认规则以平台页面为准" },
      { platformName:"Expedia Hotels", isOfficial:false, sourceType:"major_platform", trustLevel:"medium", targetUrl:"https://www.expedia.com/Hotel-Search?destination=" + encode(query), feeNote:"价格与附加费用以平台页面为准" },
      { platformName:"Marriott 官方", isOfficial:true, sourceType:"official", trustLevel:"high", targetUrl:"https://www.marriott.com/search/findHotels.mi?destinationAddress.country=" + encode(query), feeNote:"官网适合核对会员价、早餐和取消政策" },
      { platformName:"Hilton 官方", isOfficial:true, sourceType:"official", trustLevel:"high", targetUrl:"https://www.hilton.com/en/search/?query=" + encode(query), feeNote:"官网适合核对最终实时房价与政策" }
    ];
  }
  function buildGlobalShoppingPlatformCandidates(input) {
    const safe = obj(input);
    const category = normalizeCategory(safe.category);
    const normalizedFields = obj(safe.normalizedFields);
    const query = category === "flight" ? flightQuery(normalizedFields, extractQuery(safe)) : (category === "hotel" ? hotelQuery(normalizedFields, extractQuery(safe)) : productQuery(normalizedFields, extractQuery(safe)));
    const source = category === "flight" ? flightCandidates(query) : (category === "hotel" ? hotelCandidates(query) : productCandidates(query));
    return clone(source.slice(0, 10).map(function (item, index) {
      return buildModel({
        platformName:item.platformName,
        title:query,
        price:null,
        priceLabel:category === "product" ? "价格以平台页面为准" : "到平台查看实时价格",
        currency:"",
        isOfficial:item.isOfficial,
        targetUrl:item.targetUrl,
        feeNote:item.feeNote,
        riskNote:"Weishan 只做只读搜索、分析、比价和跳转，不收款、不代下单、不保存账号密码。",
        recommendationReason:recommendationReason(item.platformName, category, item.isOfficial),
        category:category,
        sourceType:item.sourceType,
        trustLevel:item.trustLevel,
        sourceRank:index + 1
      });
    }));
  }

  window.WeishanGlobalShoppingPlatformCandidateFactory = {
    GLOBAL_SHOPPING_PLATFORM_CANDIDATE_FACTORY_VERSION,
    FACTORY_NAME,
    buildGlobalShoppingPlatformCandidates
  };
})();
