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

  function sandboxApi(){
    return window.WeishanCommerceProviderSandbox || null;
  }

  function connectorApi(){
    return window.WeishanCommerceProviderConnector || null;
  }

  function productSelectionApi(){
    return window.WeishanCommerceProductProviderSelection || null;
  }

  function productCandidateApi(){
    return window.WeishanCommerceProductProviderCandidate || null;
  }

  function poolApi(){
    return window.WeishanCommerceGlobalProviderPool || null;
  }

  function onboardingApi(){
    return window.WeishanCommerceProviderOnboardingChecklist || null;
  }

  function onboardingStatus(category){
    const api = onboardingApi();
    if (api && api.getProviderOnboardingStatus) return api.getProviderOnboardingStatus(category);
    return {
      checklistVersion:"2.0.36",
      phase:"provider_onboarding_checklist",
      category:normalizeCategory(category),
      onboardingStatus:"not_reviewed",
      status:"not_reviewed",
      providerOnboardingRequired:true,
      requiredBeforeConnection:true,
      canStartConnectorDevelopment:false,
      canConfigureApiKey:false,
      canConnectEndpoint:false,
      canEnableNetworkSearch:false,
      canDisplayPrice:false,
      reason:"provider_onboarding_required",
      safety:{
        noRealEndpoint:true,
        noApiKey:true,
        noNetworkSearch:true,
        noPriceDisplay:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true
      }
    };
  }

  function poolReadiness(){
    const api = poolApi();
    if (api && api.getCommerceGlobalProviderPoolReadiness) return api.getCommerceGlobalProviderPoolReadiness();
    return {
      poolVersion:"2.0.31",
      phase:"multi_source_provider_pool_not_connected",
      ready:false,
      connected:false,
      networkAllowed:false,
      canSearchNow:false,
      canReturnPriceNow:false,
      canRedirectNow:false,
      maxDisplayedResults:3,
      reason:"provider_pool_not_connected"
    };
  }

  function productCandidateReadiness(){
    const api = productCandidateApi();
    if (api && api.getProductProviderCandidateReadiness) return api.getProductProviderCandidateReadiness();
    return {
      selectedFirstCandidate:"ebay_browse_api",
      selectedName:"eBay Browse API",
      selectedStatus:"selected_not_connected",
      selectedWording:"product_search_trial_candidate_one",
      ready:false,
      endpointConnected:false,
      apiKeyConfigured:false,
      networkAllowed:false,
      canSearchNow:false,
      canReturnPriceNow:false,
      canRedirectNow:false,
      canCheckout:false,
      canPay:false,
      canStoreIdentity:false,
      reason:"provider_candidate_selected_not_connected"
    };
  }

  function productSafetySwitches(){
    const api = productSelectionApi();
    if (api && api.getProductProviderSafetySwitches) return api.getProductProviderSafetySwitches();
    return {
      productProviderEnabled:false,
      productProviderConfigured:false,
      productProviderHasApiKey:false,
      productProviderNetworkAllowed:false,
      productProviderPriceAllowed:false,
      productProviderRedirectAllowed:false,
      productProviderReadOnlyOnly:true,
      productProviderNoCheckout:true,
      productProviderNoPayment:true,
      productProviderNoIdentityStorage:true
    };
  }

  function productReadiness(input){
    const api = productSelectionApi();
    if (api && api.getProductProviderReadiness) return api.getProductProviderReadiness(input || productSafetySwitches());
    return {
      providerId:"product_search_readonly_candidate",
      category:"product",
      selectionStatus:"selection_ready_not_connected",
      ready:false,
      canSearch:false,
      canReturnPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canStoreIdentity:false,
      reason:"product_provider_not_connected",
      safetySwitches:productSafetySwitches()
    };
  }

  function productProfile(){
    const api = productSelectionApi();
    if (api && api.getProductProviderProfile) return api.getProductProviderProfile();
    return {
      providerId:"product_search_readonly_candidate",
      category:"product",
      selectionStatus:"selection_ready_not_connected",
      connectionStatus:"not_connected",
      readinessStatus:"not_ready",
      providerEndpoint:"",
      networkEndpoint:"",
      enabled:false,
      configured:false,
      networkAllowed:false,
      priceAllowed:false,
      redirectAllowed:false,
      checkoutAllowed:false,
      paymentAllowed:false,
      identityStorageAllowed:false,
      readOnlyOnly:true,
      reasonWhenUnavailable:"全球多源 provider 候选池准备中，尚未接入真实只读搜索源"
    };
  }

  function defaultConfig(category, settings){
    const api = configApi();
    if (api && api.getCommerceProviderConfig) return api.getCommerceProviderConfig(category, settings);
    const next = normalizeCategory(category);
    const productDefaults = next === "product" ? productSafetySwitches() : {};
    return Object.assign({
      providerId:next === "product" ? "product_search_readonly_candidate" : next + "-provider-disabled",
      category:next,
      onboardingStatus:"not_reviewed",
      providerOnboardingRequired:true,
      canStartConnectorDevelopment:false,
      canConnectEndpoint:false,
      canDisplayPrice:false,
      providerStatus:next === "product" ? "candidate_not_connected" : "disabled",
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
      connectorStatus:next === "product" ? "not_connected" : "not_configured",
      connectorEnabled:false,
      connectorConfigured:false,
      connectorNetworkAllowed:false,
      connectorType:next === "product" ? "readonly_product_search" : "readonly_search",
      connectorReasonWhenUnavailable:next === "product" ? "全球多源 provider 候选池准备中，尚未接入真实只读搜索源" : "Provider Connector 未启用",
      sandboxMode:"dry_run",
      providerReadinessStatus:next === "product" ? "not_ready" : "blocked_before_network",
      configStatus:"not_configured",
      reasonWhenUnavailable:next === "product" ? "全球多源 provider 候选池准备中，尚未接入真实只读搜索源" : "暂未配置真实搜索源",
      productProviderProfile:next === "product" ? productProfile() : undefined,
      productProviderReadiness:next === "product" ? productReadiness(productDefaults) : undefined,
      providerOnboardingStatus:onboardingStatus(next)
    }, productDefaults);
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
      allowSaveIdentity:false,
      connectorStatus:next.connectorStatus || "not_configured",
      connectorEnabled:next.connectorEnabled === true,
      connectorConfigured:next.connectorConfigured === true,
      connectorNetworkAllowed:next.connectorNetworkAllowed === true,
      connectorType:next.connectorType || "readonly_search",
      connectorReasonWhenUnavailable:next.connectorReasonWhenUnavailable || "",
      sandboxMode:next.sandboxMode || "dry_run",
      providerReadinessStatus:next.providerReadinessStatus || "blocked_before_network",
      supportedRegions:Array.isArray(next.supportedRegions) ? next.supportedRegions : [],
      supportedCountries:Array.isArray(next.supportedCountries) ? next.supportedCountries : [],
      supportedLanguages:Array.isArray(next.supportedLanguages) ? next.supportedLanguages : [],
      supportedCurrencies:Array.isArray(next.supportedCurrencies) ? next.supportedCurrencies : [],
      globalProviderType:next.globalProviderType || "unknown",
      complianceRegion:next.complianceRegion || "unknown",
      requiresUserAccount:next.requiresUserAccount === true,
      requiresIdentityDocument:next.requiresIdentityDocument === true,
      requiresPaymentMethod:next.requiresPaymentMethod === true,
      supportsReadOnlySearch:next.supportsReadOnlySearch === true,
      supportsCrossBorderSearch:next.supportsCrossBorderSearch === true,
      productProviderEnabled:next.productProviderEnabled === true,
      productProviderConfigured:next.productProviderConfigured === true,
      productProviderHasApiKey:next.productProviderHasApiKey === true,
      productProviderNetworkAllowed:next.productProviderNetworkAllowed === true,
      productProviderPriceAllowed:next.productProviderPriceAllowed === true,
      productProviderRedirectAllowed:next.productProviderRedirectAllowed === true,
      productProviderReadOnlyOnly:next.productProviderReadOnlyOnly !== false,
      productProviderNoCheckout:next.productProviderNoCheckout !== false,
      productProviderNoPayment:next.productProviderNoPayment !== false,
      productProviderNoIdentityStorage:next.productProviderNoIdentityStorage !== false,
      selectedFirstCandidate:next.selectedFirstCandidate || "ebay_browse_api",
      selectedCandidateName:next.selectedCandidateName || "eBay Browse API",
      selectedStatus:next.selectedStatus || "selected_not_connected",
      selectedWording:next.selectedWording || "product_search_trial_candidate_one",
      globalProviderPoolPhase:next.globalProviderPoolPhase || "multi_source_provider_pool_not_connected",
      endpointConnected:next.endpointConnected === true,
      canSearchNow:next.canSearchNow === true,
      canReturnPriceNow:next.canReturnPriceNow === true,
      canRedirectNow:next.canRedirectNow === true,
      productProviderProfile:next.productProviderProfile || productProfile(),
      productProviderReadiness:next.productProviderReadiness || productReadiness(next),
      productProviderCandidateReadiness:next.productProviderCandidateReadiness || productCandidateReadiness(),
      globalProviderPoolReadiness:next.globalProviderPoolReadiness || poolReadiness(),
      onboardingStatus:next.onboardingStatus || "not_reviewed",
      providerOnboardingRequired:next.providerOnboardingRequired !== false,
      canStartConnectorDevelopment:next.canStartConnectorDevelopment === true,
      canConnectEndpoint:next.canConnectEndpoint === true,
      canDisplayPrice:next.canDisplayPrice === true,
      providerOnboardingStatus:next.providerOnboardingStatus || onboardingStatus(next.category)
    };
  }

  function defaultConnector(category, settings){
    const api = connectorApi();
    if (api && api.getCommerceProviderConnector) return api.getCommerceProviderConnector(category, settings);
    const next = normalizeCategory(category);
    return {
      connectorId:"global_" + next + "_search_template",
      providerId:next + "-provider-disabled",
      category:next,
      displayName:"只读搜索模板",
      connectorType:"readonly_search",
      enabled:false,
      configured:false,
      networkAllowed:false,
      requiresApiKey:true,
      hasApiKey:false,
      supportedRegions:[],
      supportedCountries:[],
      supportedLanguages:[],
      supportedCurrencies:[],
      complianceRegion:"unknown",
      dataSourceType:"template_disabled",
      connectorStatus:"not_configured",
      reasonWhenUnavailable:"Provider Connector 未启用",
      supportsSearch:false,
      supportsPrice:false,
      supportsBookingUrl:false,
      supportsCheckoutUrl:false,
      supportsCreateOrder:false,
      supportsPayment:false,
      supportsIdentityStorage:false
    };
  }

  function connectorFields(connector){
    const next = connector || {};
    return {
      connectorId:String(next.connectorId || ""),
      connectorStatus:next.connectorStatus || "not_configured",
      connectorEnabled:next.enabled === true || next.connectorEnabled === true,
      connectorConfigured:next.configured === true || next.connectorConfigured === true,
      connectorNetworkAllowed:next.networkAllowed === true || next.connectorNetworkAllowed === true,
      connectorType:next.connectorType || "readonly_search",
      connectorReasonWhenUnavailable:next.reasonWhenUnavailable || next.connectorReasonWhenUnavailable || "",
      dataSourceType:next.dataSourceType || "template_disabled",
      supportedRegions:Array.isArray(next.supportedRegions) ? next.supportedRegions : [],
      supportedCountries:Array.isArray(next.supportedCountries) ? next.supportedCountries : [],
      supportedLanguages:Array.isArray(next.supportedLanguages) ? next.supportedLanguages : [],
      supportedCurrencies:Array.isArray(next.supportedCurrencies) ? next.supportedCurrencies : [],
      complianceRegion:next.complianceRegion || "unknown",
      supportsSearch:next.supportsSearch === true,
      supportsPrice:next.supportsPrice === true,
      supportsBookingUrl:next.supportsBookingUrl === true,
      supportsCheckoutUrl:next.supportsCheckoutUrl === true,
      supportsCreateOrder:false,
      supportsPayment:false,
      supportsIdentityStorage:false
    };
  }

  function sandboxFields(category, settings, config, provider, connector){
    const api = sandboxApi();
    if (api && api.getCommerceProviderSandbox) return api.getCommerceProviderSandbox(category, settings, config, provider || config, defaultAdapter(category), connector || defaultConnector(category, settings));
    return {
      category:normalizeCategory(category),
      sandboxMode:"dry_run",
      dryRun:true,
      mode:"read_only",
      globalReady:false,
      networkAllowed:false,
      priceAllowed:false,
      bookingUrlAllowed:false,
      checkoutUrlAllowed:false,
      createOrderAllowed:false,
      paymentAllowed:false,
      identityStorageAllowed:false,
      canProceedToRealSearch:false,
      providerReadinessStatus:"blocked_before_network",
      apiKeyPresent:false,
      networkRequestAllowed:false,
      canCallProvider:false,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      canCreateOrder:false,
      canPay:false,
      canSaveIdentity:false,
      schemaValidationStatus:"not_run",
      reason:"provider_dry_run_blocked",
      reasonWhenBlocked:"Provider sandbox dry-run 未通过：真实搜索未启用",
      globalReadiness:{
        globalReady:false,
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
        supportsCrossBorderSearch:false
      },
      checks:[]
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
    const connector = defaultConnector(next, null);
    const cFields = connectorFields(connector);
    const onboarding = onboardingStatus(next);
    const isProduct = next === "product";
    const productDefaults = isProduct ? productSafetySwitches() : {};
    const candidate = isProduct ? productCandidateReadiness() : null;
    const pool = isProduct ? poolReadiness() : null;
    const providerConnectorFields = isProduct ? Object.assign({}, cFields, {
      connectorStatus:config.connectorStatus || cFields.connectorStatus,
      connectorType:config.connectorType || cFields.connectorType,
      connectorReasonWhenUnavailable:config.connectorReasonWhenUnavailable || cFields.connectorReasonWhenUnavailable
    }) : cFields;
    return Object.assign({
      id:isProduct ? "product_search_readonly_candidate" : next + "-provider-disabled",
      providerId:isProduct ? "product_search_readonly_candidate" : next + "-provider-disabled",
      name:label + "搜索源",
      category:next,
      providerStatus:isProduct ? "candidate_not_connected" : "disabled",
      selectedFirstCandidate:candidate && candidate.selectedFirstCandidate || undefined,
      selectedCandidateName:candidate && candidate.selectedName || undefined,
      selectedStatus:candidate && candidate.selectedStatus || undefined,
      selectedWording:candidate && (candidate.selectedWording || "product_search_trial_candidate_one") || undefined,
      globalProviderPoolPhase:pool && pool.phase || undefined,
      endpointConnected:false,
      canSearchNow:false,
      canReturnPriceNow:false,
      canRedirectNow:false,
      onboardingStatus:onboarding.onboardingStatus || onboarding.status || "not_reviewed",
      providerOnboardingRequired:onboarding.providerOnboardingRequired !== false,
      canStartConnectorDevelopment:onboarding.canStartConnectorDevelopment === true,
      canConnectEndpoint:onboarding.canConnectEndpoint === true,
      canDisplayPrice:onboarding.canDisplayPrice === true,
      enabled:false,
      configured:false,
      environment:"renderer",
      sourceType:"manual_disabled",
      supportsBookingUrl:false,
      supportsCheckoutUrl:false,
      supportsPrice:false,
      safetyLevel:"disabled",
      reasonWhenDisabled:isProduct ? "全球多源 provider 候选池准备中，尚未接入真实只读搜索源" : "暂未配置真实" + label + "搜索适配器",
      adapterId:adapter.providerId,
      adapterMode:"read_only",
      adapterConfigured:false,
      adapterHealth:"not_configured",
      connectorId:providerConnectorFields.connectorId,
      connectorStatus:providerConnectorFields.connectorStatus,
      connectorEnabled:false,
      connectorConfigured:false,
      connectorNetworkAllowed:false,
      connectorType:providerConnectorFields.connectorType,
      connectorReasonWhenUnavailable:providerConnectorFields.connectorReasonWhenUnavailable,
      configStatus:"not_configured",
      hasApiKey:false,
      allowNetworkSearch:false,
      allowReturnPrice:false,
      allowBookingUrl:false,
      allowCheckoutUrl:false,
      allowCreateOrder:false,
      allowPay:false,
      allowSaveIdentity:false,
      supportedRegions:Array.isArray(config.supportedRegions) ? config.supportedRegions : [],
      supportedCountries:Array.isArray(config.supportedCountries) ? config.supportedCountries : [],
      supportedLanguages:Array.isArray(config.supportedLanguages) ? config.supportedLanguages : [],
      supportedCurrencies:Array.isArray(config.supportedCurrencies) ? config.supportedCurrencies : [],
      globalProviderType:config.globalProviderType || "unknown",
      complianceRegion:config.complianceRegion || "unknown",
      requiresUserAccount:false,
      requiresIdentityDocument:false,
      requiresPaymentMethod:false,
      supportsReadOnlySearch:config.supportsReadOnlySearch === true,
      supportsCrossBorderSearch:config.supportsCrossBorderSearch === true,
      configHealth:configFields(config),
      onboardingHealth:onboarding,
      connectorHealth:providerConnectorFields,
      sandboxHealth:sandboxFields(next, null, config, config, connector),
      productProviderProfile:isProduct ? productProfile() : undefined,
      productProviderReadiness:isProduct ? productReadiness(config) : undefined,
      productProviderCandidateReadiness:isProduct ? candidate : undefined,
      globalProviderPoolReadiness:isProduct ? pool : undefined
    }, productDefaults);
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
    const connector = defaultConnector(next, cfg);
    const cFields = connectorFields(connector);
    const onboarding = onboardingStatus(next);
    if (config.enabled !== true || config.configured !== true || config.hasApiKey !== true || config.allowNetworkSearch !== true || config.allowReturnPrice !== true) return null;
    if (cFields.connectorEnabled !== true || cFields.connectorConfigured !== true || cFields.connectorNetworkAllowed !== true || cFields.supportsSearch !== true || cFields.supportsPrice !== true) return null;
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
      onboardingStatus:onboarding.onboardingStatus || onboarding.status || "not_reviewed",
      providerOnboardingRequired:onboarding.providerOnboardingRequired !== false,
      canStartConnectorDevelopment:onboarding.canStartConnectorDevelopment === true,
      canConnectEndpoint:onboarding.canConnectEndpoint === true,
      canDisplayPrice:onboarding.canDisplayPrice === true,
      adapterId:adapter.providerId,
      adapterMode:"read_only",
      adapterConfigured:true,
      adapterHealth:"ready",
      connectorId:cFields.connectorId,
      connectorStatus:cFields.connectorStatus,
      connectorEnabled:cFields.connectorEnabled,
      connectorConfigured:cFields.connectorConfigured,
      connectorNetworkAllowed:cFields.connectorNetworkAllowed,
      connectorType:cFields.connectorType,
      connectorReasonWhenUnavailable:cFields.connectorReasonWhenUnavailable,
      configStatus:"ready",
      hasApiKey:true,
      allowNetworkSearch:true,
      allowReturnPrice:true,
      allowBookingUrl:config.allowBookingUrl === true,
      allowCheckoutUrl:config.allowCheckoutUrl === true,
      allowCreateOrder:false,
      allowPay:false,
      allowSaveIdentity:false,
      supportedRegions:Array.isArray(config.supportedRegions) ? config.supportedRegions : [],
      supportedCountries:Array.isArray(config.supportedCountries) ? config.supportedCountries : [],
      supportedLanguages:Array.isArray(config.supportedLanguages) ? config.supportedLanguages : [],
      supportedCurrencies:Array.isArray(config.supportedCurrencies) ? config.supportedCurrencies : [],
      globalProviderType:config.globalProviderType || "unknown",
      complianceRegion:config.complianceRegion || "unknown",
      requiresUserAccount:false,
      requiresIdentityDocument:false,
      requiresPaymentMethod:false,
      supportsReadOnlySearch:config.supportsReadOnlySearch === true,
      supportsCrossBorderSearch:config.supportsCrossBorderSearch === true,
      configHealth:configFields(config),
      onboardingHealth:onboarding,
      connectorHealth:cFields,
      sandboxHealth:sandboxFields(next, cfg, config, config, connector)
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
      connectorHealth:provider.connectorHealth || connectorFields(provider),
      configHealth:provider.configHealth || configFields(provider),
      onboardingHealth:provider.onboardingHealth || onboardingStatus(next),
      sandboxHealth:provider.sandboxHealth || sandboxFields(next, settings, provider.configHealth, provider, provider.connectorHealth),
      dryRunHealth:provider.sandboxHealth || sandboxFields(next, settings, provider.configHealth, provider, provider.connectorHealth),
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
