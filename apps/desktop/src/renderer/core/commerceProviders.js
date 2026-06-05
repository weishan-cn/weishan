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

  function adapterApi(){
    return window.WeishanCommerceProviderAdapter || null;
  }

  function defaultAdapter(category){
    const api = adapterApi();
    if (api && api.getDefaultCommerceProviderAdapter) return api.getDefaultCommerceProviderAdapter(category);
    const next = normalizeCategory(category);
    return {
      providerId:next + "-adapter-disabled",
      category:next,
      displayName:"暂未配置真实搜索适配器",
      mode:"read_only",
      configured:false,
      health:"not_configured",
      capabilities:{
        canSearch:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canReturnCheckoutUrl:false,
        canCreateOrder:false,
        canPay:false,
        canSaveIdentity:false
      }
    };
  }

  function adapterFields(adapter){
    const next = adapter || {};
    return {
      adapterId:String(next.adapterId || next.providerId || ""),
      adapterMode:"read_only",
      adapterConfigured:next.adapterConfigured === true || next.configured === true,
      adapterHealth:next.adapterHealth || next.health || "not_configured"
    };
  }

  function defaultProvider(category){
    const next = normalizeCategory(category);
    const label = CATEGORY_LABELS[next] || "采购";
    const adapter = defaultAdapter(next);
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
      reasonWhenDisabled:"暂未配置真实" + label + "搜索适配器",
      adapterId:adapter.providerId,
      adapterMode:"read_only",
      adapterConfigured:false,
      adapterHealth:"not_configured"
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
    const adapter = defaultAdapter(next);
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
      reasonWhenDisabled:"",
      adapterId:adapter.providerId,
      adapterMode:"read_only",
      adapterConfigured:true,
      adapterHealth:"ready"
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
      adapterHealth:adapterFields(provider),
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
