(function(){
  const CATEGORY_LABELS = {
    flight:"机票",
    product:"商品",
    hotel:"酒店",
    ticket:"票务",
    service:"服务预约"
  };

  const TEMPLATE_IDS = {
    flight:"global_flight_search_template",
    product:"global_product_search_template",
    hotel:"global_hotel_search_template",
    ticket:"global_ticket_search_template",
    service:"global_service_search_template"
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

  function templateId(category){
    const next = normalizeCategory(category);
    return TEMPLATE_IDS[next] || TEMPLATE_IDS.product;
  }

  function defaultConnector(category){
    const next = normalizeCategory(category);
    const label = CATEGORY_LABELS[next] || "采购";
    return {
      connectorId:templateId(next),
      providerId:next + "-provider-disabled",
      category:next,
      displayName:label + "只读搜索模板",
      connectorType:"readonly_search",
      enabled:false,
      configured:false,
      networkAllowed:false,
      requiresApiKey:true,
      hasApiKey:false,
      regions:[],
      countries:[],
      languages:[],
      currencies:[],
      supportedRegions:[],
      supportedCountries:[],
      supportedLanguages:[],
      supportedCurrencies:[],
      complianceRegion:"unknown",
      dataSourceType:"template_disabled",
      connectorStatus:"not_configured",
      reasonWhenUnavailable:"Provider Connector 未启用：暂未配置真实" + label + "搜索源",
      supportsSearch:false,
      supportsPrice:false,
      supportsBookingUrl:false,
      supportsCheckoutUrl:false,
      supportsCreateOrder:false,
      supportsPayment:false,
      supportsIdentityStorage:false,
      connect:function(){
        return Promise.resolve({
          ok:false,
          connectorStatus:"not_configured",
          reason:"connector_not_enabled",
          realExecution:false
        });
      },
      search:function(){
        return Promise.resolve({
          ok:false,
          searchStatus:"no_provider",
          reason:"connector_not_enabled",
          candidates:[],
          realExecution:false
        });
      },
      normalize:function(rawResult){
        return rawResult || null;
      },
      validate:function(result){
        const item = result || {};
        return {
          valid:item.isRealProviderResult === true &&
            Number.isFinite(Number(item.totalPrice)) &&
            Number(item.totalPrice) >= 0 &&
            !!String(item.currency || "").trim() &&
            !!String(item.url || item.bookingUrl || "").trim(),
          reason:"readonly_connector_validation_only"
        };
      }
    };
  }

  function hasManualFixtureConnector(settings){
    const cfg = settings || {};
    return cfg.enabled === true &&
      cfg.providerMode === "manualProvider" &&
      cfg.apiKeyConfigured === true &&
      !!(window.WeishanCommerceSearchProvider && typeof window.WeishanCommerceSearchProvider.search === "function");
  }

  function hasOpenRouterFixtureConnector(settings){
    const cfg = settings || {};
    return cfg.enabled === true &&
      cfg.providerMode === "openRouterModels" &&
      cfg.apiKeyConfigured === true &&
      !!(window.WeishanOpenRouterModelsProvider && (typeof window.WeishanOpenRouterModelsProvider.fetchModels === "function" || typeof window.WeishanOpenRouterModelsProvider.search === "function"));
  }

  function createFixtureConnector(category, settings){
    const next = normalizeCategory(category);
    const base = defaultConnector(next);
    const isProduct = next === "product";
    return Object.assign({}, base, {
      enabled:true,
      configured:true,
      networkAllowed:true,
      hasApiKey:true,
      regions:["global"],
      countries:["CN", "US"],
      languages:["zh-CN", "en"],
      currencies:["CNY", "USD"],
      supportedRegions:["global"],
      supportedCountries:["CN", "US"],
      supportedLanguages:["zh-CN", "en"],
      supportedCurrencies:["CNY", "USD"],
      complianceRegion:"global",
      dataSourceType:"test_fixture_provider",
      connectorStatus:"ready_for_fixture_validation",
      reasonWhenUnavailable:"",
      supportsSearch:true,
      supportsPrice:true,
      supportsBookingUrl:!isProduct,
      supportsCheckoutUrl:isProduct,
      supportsCreateOrder:false,
      supportsPayment:false,
      supportsIdentityStorage:false,
      displayName:sanitizeText(settings && settings.providerName || base.displayName, 80)
    });
  }

  function getCommerceProviderConnector(category, settings){
    const raw = String(category || "");
    const cfg = settings || {};
    if (hasManualFixtureConnector(cfg)) return createFixtureConnector(raw, cfg);
    if (raw === "aiModelPricing" && hasOpenRouterFixtureConnector(cfg)) {
      return Object.assign(createFixtureConnector("service", cfg), {
        connectorId:"global_service_search_template",
        providerId:"openrouter-models-test-provider",
        category:"aiModelPricing",
        supportsBookingUrl:false,
        supportsCheckoutUrl:false,
        displayName:"OpenRouter 只读模型目录测试连接器"
      });
    }
    return defaultConnector(raw);
  }

  function getCommerceConnectorHealth(category, settings){
    const connector = getCommerceProviderConnector(category, settings);
    return {
      connectorId:sanitizeText(connector.connectorId || "", 80),
      providerId:sanitizeText(connector.providerId || "", 80),
      category:normalizeCategory(connector.category),
      displayName:sanitizeText(connector.displayName || "", 100),
      connectorStatus:connector.connectorStatus || "not_configured",
      connectorEnabled:connector.enabled === true,
      connectorConfigured:connector.configured === true,
      connectorNetworkAllowed:connector.networkAllowed === true,
      connectorType:connector.connectorType || "readonly_search",
      connectorReasonWhenUnavailable:connector.reasonWhenUnavailable || "",
      requiresApiKey:connector.requiresApiKey === true,
      hasApiKey:connector.hasApiKey === true,
      supportedRegions:Array.isArray(connector.supportedRegions) ? connector.supportedRegions : [],
      supportedCountries:Array.isArray(connector.supportedCountries) ? connector.supportedCountries : [],
      supportedLanguages:Array.isArray(connector.supportedLanguages) ? connector.supportedLanguages : [],
      supportedCurrencies:Array.isArray(connector.supportedCurrencies) ? connector.supportedCurrencies : [],
      complianceRegion:connector.complianceRegion || "unknown",
      dataSourceType:connector.dataSourceType || "template_disabled",
      supportsSearch:connector.supportsSearch === true,
      supportsPrice:connector.supportsPrice === true,
      supportsBookingUrl:connector.supportsBookingUrl === true,
      supportsCheckoutUrl:connector.supportsCheckoutUrl === true,
      supportsCreateOrder:false,
      supportsPayment:false,
      supportsIdentityStorage:false
    };
  }

  window.WeishanCommerceProviderConnector = {
    normalizeCategory,
    templateId,
    defaultConnector,
    getCommerceProviderConnector,
    getCommerceConnectorHealth
  };
})();
