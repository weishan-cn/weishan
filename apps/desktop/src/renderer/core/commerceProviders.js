(function(){
  const CATEGORY_LABELS = {
    flight:"机票",
    product:"商品",
    hotel:"酒店",
    ticket:"票务",
    service:"服务预约"
  };

  function normalizeCategory(category){
    const raw = String(category || "");
    if (raw === "ecommerce") return "product";
    if (raw === "ticketing") return "ticket";
    if (raw === "serviceBooking") return "service";
    if (/^(flight|product|hotel|ticket|service)$/.test(raw)) return raw;
    return "product";
  }

  function defaultProvider(category){
    const next = normalizeCategory(category);
    const label = CATEGORY_LABELS[next] || "采购";
    return {
      id:next + "-provider-disabled",
      name:label + "搜索源",
      category:next,
      enabled:false,
      configured:false,
      environment:"renderer",
      sourceType:"manual_disabled",
      supportsBookingUrl:false,
      supportsCheckoutUrl:false,
      supportsPrice:false,
      safetyLevel:"disabled",
      reasonWhenDisabled:"暂未配置真实" + label + "搜索源"
    };
  }

  function getCommerceProviderRegistry(){
    return ["flight", "product", "hotel", "ticket", "service"].map(defaultProvider);
  }

  function getManualProvider(category, settings){
    const next = normalizeCategory(category);
    const cfg = settings || {};
    if (cfg.enabled !== true || cfg.providerMode !== "manualProvider") return null;
    if (!window.WeishanCommerceSearchProvider || typeof window.WeishanCommerceSearchProvider.search !== "function") return null;
    return {
      id:next + "-manual-provider",
      name:String(cfg.providerName || "Manual Commerce Provider"),
      category:next,
      enabled:true,
      configured:true,
      environment:"renderer",
      sourceType:"manual_disabled",
      supportsBookingUrl:next !== "product",
      supportsCheckoutUrl:next === "product",
      supportsPrice:true,
      safetyLevel:"test_or_manual_provider",
      reasonWhenDisabled:""
    };
  }

  function getCommerceProviderHealth(category, settings){
    const next = normalizeCategory(category);
    const manualProvider = getManualProvider(next, settings);
    const provider = manualProvider || defaultProvider(next);
    const hasProvider = provider.enabled === true && provider.configured === true;
    const canShowPrice = hasProvider && provider.supportsPrice === true;
    return {
      category:next,
      categoryLabel:CATEGORY_LABELS[next] || "采购",
      searchStatus:hasProvider ? "ready" : "no_provider",
      hasProvider,
      providerHealth:[provider],
      enabled:provider.enabled === true,
      configured:provider.configured === true,
      reasonWhenDisabled:provider.reasonWhenDisabled || "",
      canShowPrice,
      canShowBookingButton:canShowPrice && provider.supportsBookingUrl === true,
      canShowCheckoutButton:canShowPrice && provider.supportsCheckoutUrl === true
    };
  }

  window.WeishanCommerceProviders = {
    normalizeCategory,
    getCommerceProviderRegistry,
    getCommerceProviderHealth
  };
})();
