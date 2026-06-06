(function(){
  const POOL_VERSION = "2.0.31";
  const PHASE = "multi_source_provider_pool_not_connected";
  const STRATEGY = "compare_multiple_sources_before_redirect";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function baseSafety(){
    return {
      noRealEndpoint:true,
      noApiKey:true,
      noNetworkSearch:true,
      noPriceDisplay:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true
    };
  }

  function category(id, label, examples){
    return {
      category:id,
      label,
      examples:examples.slice(),
      status:"candidate_pool_not_connected"
    };
  }

  function getCommerceGlobalProviderPool(){
    return clone({
      poolVersion:POOL_VERSION,
      phase:PHASE,
      strategy:STRATEGY,
      maxDisplayedResults:3,
      resultPolicy:{
        sortBy:"total_landed_cost_or_booking_total",
        showOnlyLowestComparableResults:true,
        requireRealProviderResult:true,
        requireExternalProviderUrl:true,
        noInternalCheckout:true,
        noAutoPay:true,
        noAutoOrder:true,
        noIdentityStorage:true
      },
      providerCategories:[
        category("product_marketplace", "商品电商平台", ["eBay", "Amazon", "Walmart", "京东", "天猫", "淘宝", "拼多多"]),
        category("official_brand_site", "品牌/商品官网", ["Apple", "Huawei", "Nike", "Samsung"]),
        category("hotel_ota", "酒店 OTA", ["Booking", "Agoda", "Expedia", "携程"]),
        category("hotel_official_site", "酒店官网", ["Marriott", "Hilton", "Hyatt"]),
        category("flight_ota", "机票 OTA", ["Expedia", "Trip.com", "携程"]),
        category("airline_official_site", "航司官网", ["United", "Delta", "Air China", "Singapore Airlines"]),
        category("ticketing_platform", "票务平台", ["Ticketmaster", "大麦", "Eventbrite"]),
        category("local_service_platform", "本地服务预约平台", ["regional service apps"])
      ],
      safety:baseSafety()
    });
  }

  function getCommerceGlobalProviderPoolReadiness(){
    const pool = getCommerceGlobalProviderPool();
    return {
      poolVersion:pool.poolVersion,
      phase:pool.phase,
      strategy:pool.strategy,
      ready:false,
      connected:false,
      networkAllowed:false,
      canSearchNow:false,
      canReturnPriceNow:false,
      canRedirectNow:false,
      maxDisplayedResults:pool.maxDisplayedResults,
      reason:"provider_pool_not_connected",
      safety:pool.safety,
      providerCategoryCount:pool.providerCategories.length
    };
  }

  window.WeishanCommerceGlobalProviderPool = {
    POOL_VERSION,
    PHASE,
    STRATEGY,
    getCommerceGlobalProviderPool,
    getCommerceGlobalProviderPoolReadiness
  };
})();
