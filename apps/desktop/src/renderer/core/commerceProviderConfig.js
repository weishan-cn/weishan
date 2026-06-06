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
      connectorStatus:"not_configured",
      connectorEnabled:false,
      connectorConfigured:false,
      connectorNetworkAllowed:false,
      connectorType:"readonly_search",
      connectorReasonWhenUnavailable:"Provider Connector 未启用：暂未配置真实" + label + "搜索源",
      sandboxMode:"dry_run",
      providerReadinessStatus:"blocked_before_network",
      supportedRegions:[],
      supportedCountries:[],
      supportedLanguages:[],
      supportedCurrencies:[],
      globalProviderType:"unknown",
      complianceRegion:"unknown",
      requiresUserAccount:false,
      requiresIdentityDocument:false,
      requiresPaymentMethod:false,
      supportsReadOnlySearch:false,
      supportsCrossBorderSearch:false,
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
      connectorStatus:"ready_for_fixture_validation",
      connectorEnabled:true,
      connectorConfigured:true,
      connectorNetworkAllowed:true,
      connectorType:"readonly_search",
      connectorReasonWhenUnavailable:"",
      sandboxMode:"dry_run",
      providerReadinessStatus:"ready_for_fixture_validation",
      supportedRegions:["global"],
      supportedCountries:["CN", "US"],
      supportedLanguages:["zh-CN", "en"],
      supportedCurrencies:["CNY", "USD"],
      globalProviderType:"search_api",
      complianceRegion:"global",
      requiresUserAccount:false,
      requiresIdentityDocument:false,
      requiresPaymentMethod:false,
      supportsReadOnlySearch:true,
      supportsCrossBorderSearch:true,
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
      connectorStatus:config.connectorStatus || "not_configured",
      connectorEnabled:config.connectorEnabled === true,
      connectorConfigured:config.connectorConfigured === true,
      connectorNetworkAllowed:config.connectorNetworkAllowed === true,
      connectorType:config.connectorType || "readonly_search",
      connectorReasonWhenUnavailable:config.connectorReasonWhenUnavailable || "",
      sandboxMode:config.sandboxMode || "dry_run",
      providerReadinessStatus:ready ? "ready_for_fixture_validation" : "blocked_before_network",
      supportedRegions:Array.isArray(config.supportedRegions) ? config.supportedRegions : [],
      supportedCountries:Array.isArray(config.supportedCountries) ? config.supportedCountries : [],
      supportedLanguages:Array.isArray(config.supportedLanguages) ? config.supportedLanguages : [],
      supportedCurrencies:Array.isArray(config.supportedCurrencies) ? config.supportedCurrencies : [],
      globalProviderType:config.globalProviderType || "unknown",
      complianceRegion:config.complianceRegion || "unknown",
      requiresUserAccount:config.requiresUserAccount === true,
      requiresIdentityDocument:config.requiresIdentityDocument === true,
      requiresPaymentMethod:config.requiresPaymentMethod === true,
      supportsReadOnlySearch:config.supportsReadOnlySearch === true,
      supportsCrossBorderSearch:config.supportsCrossBorderSearch === true,
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
