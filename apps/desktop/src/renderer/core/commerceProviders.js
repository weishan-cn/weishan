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

  function configApi(){
    return window.WeishanCommerceProviderConfig || null;
  }

  function defaultConfig(category, settings){
    const api = configApi();
    if (api && api.getCommerceProviderConfig) return api.getCommerceProviderConfig(category, settings);
    const next = normalizeCategory(category);
    return {
      providerId:next + "-provider-disabled",
      category:next,
      enabled:false,
      configured:false,
      hasApiKey:false,
      configSource:"disabled",
      allowNetworkSearch:false,
      allowReturnPrice:false,
      allowBookingUrl:false,
      allowCheckoutUrl:false,
      allowCreateOrder:false,
      allowPay:false,
      allowSaveIdentity:false,
      configStatus:"not_configured",
      reasonWhenUnavailable:"暂未配置真实搜索源"
    };
  }

  function configFields(config){
    const next = config || {};
    return {
      configStatus:next.configStatus || "not_configured",
      hasApiKey:next.hasApiKey === true,
      allowNetworkSearch:next.allowNetworkSearch === true,
      allowReturnPrice:next.allowReturnPrice === true,
      allowBookingUrl:next.allowBookingUrl === true,
      allowCheckoutUrl:next.allowCheckoutUrl === true,
      allowCreateOrder:false,
      allowPay:false,
      allowSaveIdentity:false
    };
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
    const config = defaultConfig(next, null);
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
      adapterHealth:"not_configured",
      configStatus:"not_configured",
      hasApiKey:false,
      allowNetworkSearch:false,
      allowReturnPrice:false,
      allowBookingUrl:false,
      allowCheckoutUrl:false,
      allowCreateOrder:false,
      allowPay:false,
      allowSaveIdentity:false,
      configHealth:configFields(config)
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
    const config = defaultConfig(next, cfg);
    if (config.enabled !== true || config.configured !== true || config.hasApiKey !== true || config.allowNetworkSearch !== true || config.allowReturnPrice !== true) return null;
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
      adapterHealth:"ready",
      configStatus:"ready",
      hasApiKey:true,
      allowNetworkSearch:true,
      allowReturnPrice:true,
      allowBookingUrl:config.allowBookingUrl === true,
      allowCheckoutUrl:config.allowCheckoutUrl === true,
      allowCreateOrder:false,
      allowPay:false,
      allowSaveIdentity:false,
      configHealth:configFields(config)
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
      configHealth:provider.configHealth || configFields(provider),
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
