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
    if (raw === "aiModelPricing") return "service";
    if (/^(flight|product|hotel|ticket|service)$/.test(raw)) return raw;
    return "product";
  }

  function sanitizeText(value, max){
    return String(value || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie|card\s*number|银行卡|身份证|护照|passport|id\s*number)\s*[:=：]\s*[^,\s;，。]+/gi, "$1=[redacted]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max || 120);
  }

  function defaultProviderConfig(category){
    const next = normalizeCategory(category);
    const label = CATEGORY_LABELS[next] || "采购";
    return {
      providerId:next + "-provider-disabled",
      category:next,
      enabled:false,
      configured:false,
      requiresApiKey:true,
      apiKeyEnvName:"WEISHAN_COMMERCE_" + next.toUpperCase() + "_KEY",
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
      reasonWhenUnavailable:"暂未配置真实" + label + "搜索源"
    };
  }

  function hasManualProvider(settings){
    const cfg = settings || {};
    return cfg.enabled === true &&
      cfg.providerMode === "manualProvider" &&
      cfg.apiKeyConfigured === true &&
      !!(window.WeishanCommerceSearchProvider && typeof window.WeishanCommerceSearchProvider.search === "function");
  }

  function hasOpenRouterTestProvider(settings){
    const cfg = settings || {};
    return cfg.enabled === true &&
      cfg.providerMode === "openRouterModels" &&
      cfg.apiKeyConfigured === true &&
      !!(window.WeishanOpenRouterModelsProvider && (typeof window.WeishanOpenRouterModelsProvider.fetchModels === "function" || typeof window.WeishanOpenRouterModelsProvider.search === "function"));
  }

  function createConfiguredTestConfig(category, settings){
    const next = normalizeCategory(category);
    const base = defaultProviderConfig(next);
    const isProduct = next === "product";
    return Object.assign({}, base, {
      enabled:true,
      configured:true,
      hasApiKey:true,
      configSource:"local_config",
      allowNetworkSearch:true,
      allowReturnPrice:true,
      allowBookingUrl:!isProduct,
      allowCheckoutUrl:isProduct,
      allowCreateOrder:false,
      allowPay:false,
      allowSaveIdentity:false,
      configStatus:"ready",
      reasonWhenUnavailable:"",
      providerId:sanitizeText(settings && settings.providerName || base.providerId, 80)
    });
  }

  function getCommerceProviderConfig(category, settings){
    const raw = String(category || "");
    const cfg = settings || {};
    if (hasManualProvider(cfg)) return createConfiguredTestConfig(raw, cfg);
    if (raw === "aiModelPricing" && hasOpenRouterTestProvider(cfg)) {
      return Object.assign(createConfiguredTestConfig("service", cfg), {
        providerId:"openrouter-models-test-provider",
        category:"aiModelPricing",
        allowBookingUrl:false,
        allowCheckoutUrl:false
      });
    }
    return defaultProviderConfig(raw);
  }

  function getCommerceProviderConfigRegistry(){
    return ["flight", "product", "hotel", "ticket", "service"].map((category) => getCommerceProviderConfig(category, null));
  }

  function getCommerceProviderConfigHealth(category, settings){
    const config = getCommerceProviderConfig(category, settings);
    const ready = config.enabled === true &&
      config.configured === true &&
      config.hasApiKey === true &&
      config.allowNetworkSearch === true &&
      config.allowReturnPrice === true;
    return {
      configStatus:ready ? "ready" : "not_configured",
      providerConfig:config,
      hasApiKey:config.hasApiKey === true,
      allowNetworkSearch:config.allowNetworkSearch === true,
      allowReturnPrice:config.allowReturnPrice === true,
      allowBookingUrl:config.allowBookingUrl === true,
      allowCheckoutUrl:config.allowCheckoutUrl === true,
      allowCreateOrder:false,
      allowPay:false,
      allowSaveIdentity:false,
      canShowPrice:ready,
      canShowBookingButton:ready && config.allowBookingUrl === true,
      canShowCheckoutButton:ready && config.allowCheckoutUrl === true,
      reasonWhenUnavailable:ready ? "" : config.reasonWhenUnavailable || "provider_config_not_ready"
    };
  }

  window.WeishanCommerceProviderConfig = {
    normalizeCategory,
    defaultProviderConfig,
    getCommerceProviderConfig,
    getCommerceProviderConfigRegistry,
    getCommerceProviderConfigHealth
  };
})();
