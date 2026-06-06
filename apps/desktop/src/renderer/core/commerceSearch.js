(function(){
  const COMMERCE_SEARCH_SETTINGS_KEY = "weishan:commerceSearch:settings:v1";
  const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
  const CHEAPEST_REDIRECT_MODE = "cheapest_redirect";

  function nowIso(){
    return new Date().toISOString();
  }

  function storage(){
    try { return window.localStorage || null; } catch (_) { return null; }
  }

  function sanitizeText(value, max){
    return String(value || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie|card\s*number|银行卡|身份证|护照|passport|id\s*number)\s*[:=：]\s*[^,\s;，。]+/gi, "$1=[redacted]")
      .replace(/(^|[^\w-])(\d{13,19})(?=$|[^\w-])/g, "$1[redacted-card]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max || 180);
  }

  function resultCategory(category){
    const raw = String(category || "");
    if (raw === "ecommerce") return "product";
    if (raw === "ticketing") return "ticket";
    if (raw === "serviceBooking") return "service";
    if (/^(flight|product|hotel|ticket|service)$/.test(raw)) return raw;
    return raw || "product";
  }

  function providersApi(){
    return window.WeishanCommerceProviders || null;
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

  function getProviderOnboardingStatus(category){
    const api = onboardingApi();
    if (api && api.getProviderOnboardingStatus) return api.getProviderOnboardingStatus(category);
    return {
      checklistVersion:"2.0.36",
      phase:"provider_onboarding_checklist",
      category:resultCategory(category),
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

  function locationPolicyApi(){
    return window.WeishanCommerceLocationPolicy || null;
  }

  function locationHealth(){
    const api = locationPolicyApi();
    if (api && api.locationHealthForCommerce) return api.locationHealthForCommerce();
    return {
      locationPermissionMode:"off",
      locationPermissionStatus:"not_requested",
      shippingDestination:{ country:"", region:"", city:"", postalCode:"", source:"unknown", configured:false },
      shippingDestinationRequiredForAccuratePrice:true,
      hasShippingDestination:false,
      locationRequiredForAccuratePrice:false,
      hasPreciseLocation:false,
      canCalculateAccurateLandedCost:false,
      canShowAccuratePrice:false,
      canShowRedirectButton:false,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      landedCostAccuracy:"blocked_shipping_destination_required",
      searchStatus:"shipping_destination_required",
      reason:"shipping_destination_required_for_accurate_landed_cost",
      privacy:{
        storeRawCoordinates:false,
        logRawCoordinates:false,
        shareWithThirdParty:false,
        useForAds:false,
        useForTracking:false
      }
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

  function getProductProviderReadiness(input){
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
      poolReason:"provider_pool_not_connected",
      safetySwitches:productSafetySwitches()
    };
  }

  function getProductProviderProfile(){
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

  function getGlobalProviderPoolReadiness(){
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

  function getProductProviderCandidateReadiness(){
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
      reason:"provider_candidate_selected_not_connected",
      poolReadiness:getGlobalProviderPoolReadiness()
    };
  }

  function defaultConfig(category, settings){
    const api = configApi();
    if (api && api.getCommerceProviderConfig) return api.getCommerceProviderConfig(category, settings);
    const next = resultCategory(category);
    const productDefaults = next === "product" ? productSafetySwitches() : {};
    const productCandidate = next === "product" ? getProductProviderCandidateReadiness() : null;
    const pool = next === "product" ? getGlobalProviderPoolReadiness() : null;
    return Object.assign({
      providerId:next === "product" ? "product_search_readonly_candidate" : next + "-provider-disabled",
      category:next,
      onboardingStatus:"not_reviewed",
      providerOnboardingRequired:true,
      canStartConnectorDevelopment:false,
      canConnectEndpoint:false,
      canDisplayPrice:false,
      providerStatus:next === "product" ? "candidate_not_connected" : "disabled",
      selectedFirstCandidate:productCandidate && productCandidate.selectedFirstCandidate || undefined,
      selectedCandidateName:productCandidate && productCandidate.selectedName || undefined,
      selectedStatus:productCandidate && productCandidate.selectedStatus || undefined,
      selectedWording:productCandidate && (productCandidate.selectedWording || "product_search_trial_candidate_one") || undefined,
      globalProviderPoolPhase:pool && pool.phase || undefined,
      endpointConnected:false,
      canSearchNow:false,
      canReturnPriceNow:false,
      canRedirectNow:false,
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
      productProviderProfile:next === "product" ? getProductProviderProfile() : undefined,
      productProviderReadiness:next === "product" ? getProductProviderReadiness(productDefaults) : undefined,
      productProviderCandidateReadiness:productCandidate || undefined,
      globalProviderPoolReadiness:pool || undefined,
      providerOnboardingStatus:getProviderOnboardingStatus(next)
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
      productProviderProfile:next.productProviderProfile || getProductProviderProfile(),
      productProviderReadiness:next.productProviderReadiness || getProductProviderReadiness(next),
      productProviderCandidateReadiness:next.productProviderCandidateReadiness || getProductProviderCandidateReadiness(),
      globalProviderPoolReadiness:next.globalProviderPoolReadiness || getGlobalProviderPoolReadiness()
    };
  }

  function onboardingFields(onboarding){
    const next = onboarding || {};
    const safety = next.safety || {};
    return {
      checklistVersion:next.checklistVersion || "2.0.36",
      phase:next.phase || "provider_onboarding_checklist",
      onboardingStatus:next.onboardingStatus || next.status || "not_reviewed",
      status:next.status || next.onboardingStatus || "not_reviewed",
      providerOnboardingRequired:next.providerOnboardingRequired !== false,
      requiredBeforeConnection:next.requiredBeforeConnection !== false,
      canStartConnectorDevelopment:next.canStartConnectorDevelopment === true,
      canConfigureApiKey:next.canConfigureApiKey === true,
      canConnectEndpoint:next.canConnectEndpoint === true,
      canEnableNetworkSearch:next.canEnableNetworkSearch === true,
      canDisplayPrice:next.canDisplayPrice === true,
      reason:next.reason || "provider_onboarding_required",
      safety:{
        noRealEndpoint:safety.noRealEndpoint !== false,
        noApiKey:safety.noApiKey !== false,
        noNetworkSearch:safety.noNetworkSearch !== false,
        noPriceDisplay:safety.noPriceDisplay !== false,
        noCheckout:safety.noCheckout !== false,
        noPayment:safety.noPayment !== false,
        noOrderSubmit:safety.noOrderSubmit !== false,
        noIdentityStorage:safety.noIdentityStorage !== false
      }
    };
  }

  function defaultConnector(category, settings){
    const api = connectorApi();
    if (api && api.getCommerceProviderConnector) return api.getCommerceProviderConnector(category, settings);
    const next = resultCategory(category);
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

  function sandboxFields(category, settings, config, connector){
    const api = sandboxApi();
    if (api && api.getCommerceProviderSandbox) return api.getCommerceProviderSandbox(category, settings, config, config, defaultAdapter(category), connector || defaultConnector(category, settings));
    return {
      category:resultCategory(category),
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

  function isProviderSandboxReady(sandbox){
    return !!(sandbox && sandbox.canProceedToRealSearch === true && sandbox.canCallProvider === true && sandbox.sandboxMode === "dry_run");
  }

  function isProviderConnectorReady(connector){
    const next = connectorFields(connector);
    return next.connectorEnabled === true &&
      next.connectorConfigured === true &&
      next.connectorNetworkAllowed === true &&
      next.supportsSearch === true &&
      next.supportsPrice === true;
  }

  function isProviderConfigReady(config){
    return !!(config &&
      config.enabled === true &&
      config.configured === true &&
      config.hasApiKey === true &&
      config.allowNetworkSearch === true &&
      config.allowReturnPrice === true);
  }

  function isProductSearchRequest(request){
    return resultCategory(request && request.category) === "product";
  }

  function productProviderBlockedResult(request, providerHealth, providerConfig, connectorHealth, sandbox){
    const readiness = getProductProviderReadiness(providerConfig);
    const pool = getGlobalProviderPoolReadiness();
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    return {
      ok:false,
      code:"COMMERCE_PRODUCT_PROVIDER_NOT_CONNECTED",
      message:"provider_pool_not_connected",
      reason:pool.reason || readiness.reason || "provider_pool_not_connected",
      request,
      searchStatus:"no_provider",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth:onboarding,
      sandboxHealth:sandbox,
      dryRunHealth:sandbox,
      productProviderReadiness:readiness,
      globalProviderPoolReadiness:pool,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function shippingDestinationRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox){
    const health = locationHealth();
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    return {
      ok:false,
      code:"COMMERCE_SHIPPING_DESTINATION_REQUIRED",
      message:"需要设置收货目的地以计算精确最低到手价。",
      reason:"shipping_destination_required_for_accurate_landed_cost",
      request,
      searchStatus:"shipping_destination_required",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth:onboarding,
      sandboxHealth:sandbox,
      dryRunHealth:sandbox,
      locationHealth:health,
      landedCostAccuracy:"blocked_shipping_destination_required",
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function defaultAdapter(category){
    const api = adapterApi();
    if (api && api.getDefaultCommerceProviderAdapter) return api.getDefaultCommerceProviderAdapter(category);
    const next = resultCategory(category);
    return {
      providerId:next + "-adapter-disabled",
      mode:"read_only",
      configured:false,
      health:"not_configured"
    };
  }

  function defaultSettings(){
    return {
      enabled:false,
      providerName:"",
      providerMode:"disabled",
      endpointUrl:"",
      apiKeyConfigured:false,
      lastCheckedAt:""
    };
  }

  function getCommerceSearchSettings(){
    const s = storage();
    if (!s) return defaultSettings();
    try {
      return Object.assign(defaultSettings(), JSON.parse(s.getItem(COMMERCE_SEARCH_SETTINGS_KEY) || "{}"));
    } catch (_) {
      return defaultSettings();
    }
  }

  function saveCommerceSearchSettings(settings){
    const next = Object.assign(defaultSettings(), settings || {}, { lastCheckedAt:nowIso() });
    next.enabled = next.enabled === true;
    next.apiKeyConfigured = next.apiKeyConfigured === true;
    next.providerMode = /^(customEndpoint|manualProvider|openRouterModels)$/.test(next.providerMode) ? next.providerMode : "disabled";
    next.providerName = sanitizeText(next.providerName || "", 80);
    next.endpointUrl = sanitizeText(next.endpointUrl || "", 240);
    const s = storage();
    try { if (s) s.setItem(COMMERCE_SEARCH_SETTINGS_KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  function hasCommerceSearchProvider(settings){
    const next = Object.assign(defaultSettings(), settings || getCommerceSearchSettings());
    if (!next.enabled) return false;
    const config = defaultConfig("product", next);
    const manualConfigReady = isProviderConfigReady(config);
    if (next.providerMode === "manualProvider") {
      return manualConfigReady && !!(window.WeishanCommerceSearchProvider && typeof window.WeishanCommerceSearchProvider.search === "function");
    }
    if (next.providerMode === "customEndpoint") return false;
    if (next.providerMode === "openRouterModels") return false;
    return false;
  }

  function fallbackProviderHealth(category, settings){
    const next = resultCategory(category);
    const configured = hasCommerceSearchProvider(settings);
    const isProduct = next === "product";
    const adapter = defaultAdapter(next);
    const config = defaultConfig(next, settings);
    const connector = defaultConnector(next, settings);
    const cFields = connectorFields(connector);
    const onboarding = getProviderOnboardingStatus(next);
    const oFields = onboardingFields(onboarding);
    const configReady = isProviderConfigReady(config);
    const connectorReady = isProviderConnectorReady(connector);
    const sandbox = sandboxFields(next, settings, config, connector);
    return {
      category:next,
      categoryLabel:isProduct ? "商品" : next === "flight" ? "机票" : next,
      searchStatus:configured && configReady && connectorReady ? "ready" : "no_provider",
      hasProvider:configured && configReady && connectorReady,
      providerHealth:[{
        id:next + (configured ? "-manual-provider" : "-provider-disabled"),
        name:configured ? String(settings && settings.providerName || "Manual Commerce Provider") : "暂未配置真实搜索适配器",
        category:next,
        enabled:configured,
        configured,
        environment:"renderer",
        sourceType:configured ? "manual_disabled" : "manual_disabled",
        supportsBookingUrl:configured && !isProduct,
        supportsCheckoutUrl:configured && isProduct,
        supportsPrice:configured,
        safetyLevel:configured ? "test_or_manual_provider" : "disabled",
        reasonWhenDisabled:configured ? "" : "暂未配置真实搜索适配器",
        onboardingStatus:oFields.onboardingStatus,
        providerOnboardingRequired:oFields.providerOnboardingRequired,
        canStartConnectorDevelopment:oFields.canStartConnectorDevelopment,
        canConnectEndpoint:oFields.canConnectEndpoint,
        canDisplayPrice:oFields.canDisplayPrice,
        onboardingHealth:oFields,
        adapterId:adapter.providerId,
        adapterMode:"read_only",
        adapterConfigured:configured,
        adapterHealth:configured ? "ready" : "not_configured",
        connectorId:cFields.connectorId,
        connectorStatus:cFields.connectorStatus,
        connectorEnabled:cFields.connectorEnabled,
        connectorConfigured:cFields.connectorConfigured,
        connectorNetworkAllowed:cFields.connectorNetworkAllowed,
        connectorType:cFields.connectorType,
        connectorReasonWhenUnavailable:cFields.connectorReasonWhenUnavailable,
        configStatus:configReady ? "ready" : "not_configured",
        hasApiKey:config.hasApiKey === true,
        allowNetworkSearch:config.allowNetworkSearch === true,
        allowReturnPrice:config.allowReturnPrice === true,
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
        requiresUserAccount:config.requiresUserAccount === true,
        requiresIdentityDocument:config.requiresIdentityDocument === true,
        requiresPaymentMethod:config.requiresPaymentMethod === true,
        supportsReadOnlySearch:config.supportsReadOnlySearch === true,
        supportsCrossBorderSearch:config.supportsCrossBorderSearch === true,
        configHealth:configFields(config),
        connectorHealth:cFields,
        sandboxHealth:sandbox
      }],
      adapterHealth:{
        adapterId:adapter.providerId,
        adapterMode:"read_only",
        adapterConfigured:configured,
        adapterHealth:configured ? "ready" : "not_configured"
      },
      connectorHealth:cFields,
      configHealth:configFields(config),
      onboardingHealth:oFields,
      sandboxHealth:sandbox,
      dryRunHealth:sandbox,
      enabled:configured && configReady && connectorReady,
      configured:configured && configReady && connectorReady,
      reasonWhenDisabled:configured && configReady && connectorReady ? "" : cFields.connectorReasonWhenUnavailable || config.reasonWhenUnavailable || "provider_config_not_ready",
      reason:oFields.reason || (connectorReady ? "provider_config_not_ready" : "connector_not_enabled"),
      canShowPrice:configured && configReady && connectorReady,
      canShowBookingButton:configured && configReady && connectorReady && config.allowBookingUrl === true,
      canShowCheckoutButton:configured && configReady && connectorReady && config.allowCheckoutUrl === true
    };
  }

  function getCommerceProviderRegistry(){
    const api = providersApi();
    return api && api.getCommerceProviderRegistry ? api.getCommerceProviderRegistry() : ["flight", "product", "hotel", "ticket", "service"].map((category) => fallbackProviderHealth(category, defaultSettings()).providerHealth[0]);
  }

  function getCommerceProviderHealth(category, settings){
    const api = providersApi();
    if (api && api.getCommerceProviderHealth) return api.getCommerceProviderHealth(category, settings || getCommerceSearchSettings());
    return fallbackProviderHealth(category, settings || getCommerceSearchSettings());
  }

  function getCommerceProviderConfig(category, settings){
    return defaultConfig(category, settings || getCommerceSearchSettings());
  }

  function getCommerceProviderConnector(category, settings){
    return defaultConnector(category, settings || getCommerceSearchSettings());
  }

  function getCommerceProviderSandbox(category, settings){
    const nextSettings = settings || getCommerceSearchSettings();
    return sandboxFields(category, nextSettings, getCommerceProviderConfig(category, nextSettings), getCommerceProviderConnector(category, nextSettings));
  }

  function isAiModelPricingTask(taskOrRequest){
    return String(taskOrRequest && taskOrRequest.category || "") === "aiModelPricing";
  }

  function missingFieldsForTask(task){
    const category = String(task && task.category || "");
    const text = String(task && task.inputSummary || "");
    const fields = [];
    if (/^(flight|train|hotel|cruise)$/.test(category) && !/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|今天|明天|后天|下周|周[一二三四五六日天])/.test(text)) {
      fields.push(category === "hotel" ? "入住日期" : "出行日期");
    }
    if (category === "privateJet" && !/(飞|到|起飞|机场|from|to)/i.test(text)) fields.push("起降机场");
    return fields;
  }

  function cleanPlaceName(value, side){
    let next = String(value || "");
    if (side === "origin") next = next.replace(/.*?(?:今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/, "");
    return sanitizeText(next
      .replace(/^(帮我|请|想|我要|需要|找|买|购买|订|预定|预订|订票|买票|从|出发|低价|最便宜|的)+/g, "")
      .replace(/(机票|飞机票|航空票|航班|酒店|住宿|火车票|高铁票|邮轮|游轮|公务机|私人飞机|包机|商品|电商|低价|最便宜|的).*$/g, "")
      .trim(), 40);
  }

  function parseRoute(text){
    const raw = String(text || "");
    const match = raw.match(/([\u4e00-\u9fa5A-Za-z]{2,24})\s*(?:到|飞往|飞|去)\s*([\u4e00-\u9fa5A-Za-z]{2,24})/);
    return {
      origin:match ? cleanPlaceName(match[1], "origin") : "",
      destination:match ? cleanPlaceName(match[2], "destination") : ""
    };
  }

  function parseDate(text){
    const raw = String(text || "");
    const match = raw.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天])/);
    return match && match[1] || "";
  }

  function createCommerceSearchRequest(task){
    const route = parseRoute(task && task.inputSummary);
    const category = String(task && task.category || "generalProcurement");
    return {
      taskId:String(task && task.taskId || ""),
      category,
      query:sanitizeText(task && task.inputSummary || "", 240),
      origin:route.origin,
      destination:route.destination,
      date:parseDate(task && task.inputSummary || ""),
      passengers:1,
      currency:category === "aiModelPricing" ? "USD" : "CNY",
      locale:"zh-CN",
      missingFields:missingFieldsForTask(task)
    };
  }

  function validateBookingUrl(url){
    try {
      const raw = String(url || "").trim();
      if (!raw) return null;
      const parsed = new URL(raw);
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function normalizeUrlType(value, category){
    const raw = String(value || "");
    if (/^(booking|checkout|detail)$/.test(raw)) return raw;
    if (category === "flight" || category === "hotel" || category === "ticket" || category === "service") return "booking";
    if (category === "product") return "checkout";
    return "detail";
  }

  function isBlockedSourceType(value){
    return /^(fake|demo|mock|fake_price|demo_price|mock_price|production_mock)$/i.test(String(value || "").trim());
  }

  function isValidTotalPrice(value){
    const num = Number(value);
    return value !== null && value !== "" && Number.isFinite(num) && num >= 0;
  }

  const LANDED_COST_FIELDS = [
    ["itemPrice", "商品价"],
    ["shippingFee", "运费"],
    ["dutyFee", "关税/进口税"],
    ["taxFee", "增值税/VAT/GST/销售税"],
    ["platformFee", "平台服务费"],
    ["paymentFee", "支付手续费"],
    ["brokerageFee", "清关/报关费"],
    ["insuranceFee", "保险/必选服务费"],
    ["requiredExtraFee", "其他必选费用"]
  ];

  function normalizeCertainty(value){
    const raw = String(value || "").trim();
    return /^(confirmed|estimated|unknown)$/.test(raw) ? raw : "unknown";
  }

  function normalizeMoneyPart(value, label, currency){
    const fallbackCurrency = sanitizeText(currency || "", 12);
    if (value && typeof value === "object") {
      const amount = Number(value.amount);
      const certainty = normalizeCertainty(value.certainty);
      return {
        amount:Number.isFinite(amount) && amount >= 0 ? amount : null,
        currency:sanitizeText(value.currency || fallbackCurrency, 12),
        certainty:Number.isFinite(amount) && amount >= 0 ? certainty : "unknown",
        label:sanitizeText(value.label || label, 40)
      };
    }
    const amount = Number(value);
    return {
      amount:Number.isFinite(amount) && amount >= 0 ? amount : null,
      currency:fallbackCurrency,
      certainty:Number.isFinite(amount) && amount >= 0 ? "confirmed" : "unknown",
      label
    };
  }

  function normalizeLandedCostBreakdown(result, context){
    const item = result && typeof result === "object" ? result : {};
    const input = item.landedCostBreakdown && typeof item.landedCostBreakdown === "object" ? item.landedCostBreakdown : {};
    const currency = sanitizeText(item.currency || context && context.currency || "", 12);
    const output = {};
    LANDED_COST_FIELDS.forEach(([key, label]) => {
      const source = input[key] !== undefined ? input[key] : item[key];
      output[key] = normalizeMoneyPart(source, label, currency);
    });
    if ((output.itemPrice.amount === null || output.itemPrice.amount === undefined) && isValidTotalPrice(item.itemPrice || item.price)) {
      output.itemPrice = normalizeMoneyPart(item.itemPrice !== undefined ? item.itemPrice : item.price, "商品价", currency);
    }
    return output;
  }

  function calculateTotalLandedCost(result){
    const item = result && typeof result === "object" ? result : {};
    if (isValidTotalPrice(item.totalLandedCost)) return Number(item.totalLandedCost);
    const breakdown = item.landedCostBreakdown && typeof item.landedCostBreakdown === "object" ? item.landedCostBreakdown : normalizeLandedCostBreakdown(item);
    let total = 0;
    let hasAny = false;
    LANDED_COST_FIELDS.forEach(([key]) => {
      const part = breakdown[key] || {};
      const amount = Number(part.amount);
      if (Number.isFinite(amount) && amount >= 0 && part.certainty !== "unknown") {
        total += amount;
        hasAny = true;
      }
    });
    return hasAny ? total : null;
  }

  function inferLandedCostCompleteness(result, breakdown){
    const explicit = String(result && result.landedCostCompleteness || "");
    if (/^(complete|partial|estimated|unknown)$/.test(explicit)) return explicit;
    const parts = breakdown || normalizeLandedCostBreakdown(result);
    const required = ["itemPrice", "shippingFee", "dutyFee", "taxFee"];
    const unknownRequired = required.some((key) => !parts[key] || parts[key].amount === null || parts[key].certainty === "unknown");
    const estimated = LANDED_COST_FIELDS.some(([key]) => parts[key] && parts[key].certainty === "estimated");
    if (unknownRequired) return "partial";
    return estimated ? "estimated" : "complete";
  }

  function landedCostNotice(completeness, hasEstimatedFees, hasUnknownFees){
    if (completeness === "complete" && !hasEstimatedFees && !hasUnknownFees) {
      return "到手总价已包含 provider 返回的商品价、运费、税费、关税和必选费用。";
    }
    if (hasEstimatedFees || completeness === "estimated") {
      return "预估到手总价包含 provider 返回的预估费用；实际以外部平台和海关结算为准。";
    }
    return "费用条件不完整，实际总价以外部商家页面/海关结算为准。";
  }

  function isDisplayableLandedCostResult(result){
    const item = result || {};
    const total = calculateTotalLandedCost(item);
    return isDisplayableProviderResult(item) &&
      (total === null || Number.isFinite(Number(total))) &&
      !isBlockedSourceType(item.sourceType || item.dataSourceType || "");
  }

  function landedSortValue(result){
    const landed = calculateTotalLandedCost(result);
    if (Number.isFinite(Number(landed))) return Number(landed);
    if (isValidTotalPrice(result && result.totalPrice)) return Number(result.totalPrice);
    return Number.POSITIVE_INFINITY;
  }

  function compareByTotalLandedCost(a, b){
    const costA = landedSortValue(a);
    const costB = landedSortValue(b);
    if (costA !== costB) return costA - costB;
    return String(b && b.rating || "").localeCompare(String(a && a.rating || ""));
  }

  function isDisplayableProviderResult(item){
    const result = item || {};
    const parsedUrl = validateBookingUrl(result.url || result.bookingUrl);
    const urlType = normalizeUrlType(result.urlType, result.category);
    return result.isRealProviderResult === true &&
      !!String(result.provider || result.sourceName || "").trim() &&
      !!String(result.title || "").trim() &&
      isValidTotalPrice(result.totalPrice) &&
      !!String(result.currency || "").trim() &&
      !!parsedUrl &&
      /^(booking|checkout|detail)$/.test(urlType) &&
      !isBlockedSourceType(result.sourceType || result.dataSourceType || "");
  }

  function inferPriceCompleteness(item){
    const text = normalizeExtras(item && item.extras || []).concat([
      item && item.conditions,
      item && item.refundPolicySummary,
      item && item.hiddenFeeNote
    ]).join(" ");
    if (/(不包邮|不含税|不含税费|不含运费|费用条件待复核|费用不明|待复核)/.test(text)) return "provider_conditions_incomplete";
    return /(含税|含税费|包邮|含运费|含服务费|含行李|含基础行李|含城市税)/.test(text) ? "complete_enough" : "provider_conditions_incomplete";
  }

  function normalizeExtras(value){
    if (Array.isArray(value)) return value.map((item) => sanitizeText(item, 100)).filter(Boolean).slice(0, 8);
    if (value && typeof value === "object") {
      return Object.keys(value).slice(0, 8).map((key) => {
        const text = sanitizeText(key, 40) + "：" + sanitizeText(value[key], 80);
        return text.trim();
      }).filter(Boolean);
    }
    return sanitizeText(value || "", 160) ? [sanitizeText(value, 160)] : [];
  }

  function normalizeCommerceResult(candidate, context){
    const item = candidate && typeof candidate === "object" ? candidate : {};
    const category = resultCategory(item.category || context && context.category || "");
    const parsedUrl = validateBookingUrl(item.url || item.bookingUrl);
    const totalPriceRaw = item.totalPrice !== undefined ? item.totalPrice : item.totalLandedCost !== undefined ? item.totalLandedCost : item.price;
    const totalPrice = Number(totalPriceRaw);
    const price = Number(item.price !== undefined ? item.price : totalPriceRaw);
    const currency = sanitizeText(item.currency || "", 12);
    const isRealProviderResult = item.isRealProviderResult === true;
    const urlType = normalizeUrlType(item.urlType, category);
    const provider = sanitizeText(item.provider || item.sourceName || context && context.providerName || "搜索源", 80);
    const sourceCountry = sanitizeText(item.sourceCountry || context && context.sourceCountry || "", 40);
    const destinationCountry = sanitizeText(item.destinationCountry || context && context.destinationCountry || "", 40);
    const breakdown = normalizeLandedCostBreakdown(Object.assign({}, item, { currency }), context || {});
    const calculatedLandedCost = calculateTotalLandedCost(Object.assign({}, item, { landedCostBreakdown:breakdown }));
    const explicitLandedCost = isValidTotalPrice(item.totalLandedCost) ? Number(item.totalLandedCost) : null;
    const totalLandedCost = explicitLandedCost !== null ? explicitLandedCost : calculatedLandedCost;
    const hasEstimatedFees = LANDED_COST_FIELDS.some(([key]) => breakdown[key] && breakdown[key].certainty === "estimated");
    const hasUnknownFees = LANDED_COST_FIELDS.some(([key]) => breakdown[key] && breakdown[key].certainty === "unknown");
    const landedCostCompleteness = inferLandedCostCompleteness(item, breakdown);
    return {
      id:sanitizeText(item.id || item.candidateId || ("commerceResult-" + Math.random().toString(36).slice(2, 8)), 80),
      candidateId:sanitizeText(item.candidateId || item.id || ("commerceResult-" + Math.random().toString(36).slice(2, 8)), 80),
      category,
      title:sanitizeText(item.title || "候选方案", 120),
      provider,
      sourceName:provider,
      price:Number.isFinite(price) && price >= 0 ? price : null,
      currency,
      totalPrice:Number.isFinite(totalPrice) && totalPrice >= 0 ? totalPrice : null,
      totalLandedCost:Number.isFinite(Number(totalLandedCost)) && Number(totalLandedCost) >= 0 ? Number(totalLandedCost) : null,
      landedCostBreakdown:breakdown,
      landedCostCompleteness,
      hasEstimatedFees,
      hasUnknownFees,
      feeNotice:sanitizeText(item.feeNotice || landedCostNotice(landedCostCompleteness, hasEstimatedFees, hasUnknownFees), 220),
      itemPrice:breakdown.itemPrice.amount,
      shippingFee:breakdown.shippingFee.amount,
      dutyFee:breakdown.dutyFee.amount,
      taxFee:breakdown.taxFee.amount,
      platformFee:breakdown.platformFee.amount,
      paymentFee:breakdown.paymentFee.amount,
      brokerageFee:breakdown.brokerageFee.amount,
      insuranceFee:breakdown.insuranceFee.amount,
      requiredExtraFee:breakdown.requiredExtraFee.amount,
      sourceCountry,
      destinationCountry,
      crossBorder:item.crossBorder === true || !!(sourceCountry && destinationCountry && sourceCountry !== destinationCountry),
      url:parsedUrl ? parsedUrl.href : "",
      bookingUrl:parsedUrl ? parsedUrl.href : "",
      urlType,
      redirectMode:CHEAPEST_REDIRECT_MODE,
      sourceType:sanitizeText(item.sourceType || context && context.sourceType || "provider", 60),
      priceCompleteness:inferPriceCompleteness(item),
      bookingUrlHost:parsedUrl ? parsedUrl.host : "",
      conditions:sanitizeText(item.conditions || "", 180),
      extras:normalizeExtras(item.extras || item.extraServices || item.serviceDifferences || item.hiddenFeeNote || ""),
      fetchedAt:sanitizeText(item.fetchedAt || item.collectedAt || nowIso(), 40),
      collectedAt:sanitizeText(item.fetchedAt || item.collectedAt || nowIso(), 40),
      isRealProviderResult,
      isLiveResult:isRealProviderResult,
      priceLabel:sanitizeText(item.priceLabel || (currency && Number.isFinite(totalPrice) ? currency + " " + totalPrice : ""), 120),
      departTime:sanitizeText(item.departTime || "", 80),
      arriveTime:sanitizeText(item.arriveTime || "", 80),
      duration:sanitizeText(item.duration || "", 80),
      refundPolicySummary:sanitizeText(item.refundPolicySummary || "", 160),
      rating:sanitizeText(item.rating || "", 40),
      reputation:sanitizeText(item.reputation || "", 80),
      riskSummary:sanitizeText(item.riskSummary || (!parsedUrl && (item.url || item.bookingUrl) ? "链接不是 https，已阻断打开。" : ""), 160),
      hiddenFeeNote:sanitizeText(item.hiddenFeeNote || "", 160),
      recommendationReason:sanitizeText(item.recommendationReason || "", 180),
      realExecution:false
    };
  }

  function validateOpenRouterModelUrl(url){
    const parsed = validateBookingUrl(url);
    if (!parsed) return null;
    return parsed.host === "openrouter.ai" || parsed.host.endsWith(".openrouter.ai") ? parsed : null;
  }

  function parseTokenPrice(value){
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : null;
  }

  function pricePerMillionValue(value){
    const num = parseTokenPrice(value);
    return num === null ? null : num * 1000000;
  }

  function compactUsd(value){
    const num = Number(value);
    if (!Number.isFinite(num)) return "";
    return "$" + num.toFixed(num >= 1 ? 4 : 6).replace(/0+$/, "").replace(/\.$/, "");
  }

  function pricePerMillionLabel(value){
    const num = pricePerMillionValue(value);
    return num === null ? "价格字段不可解析" : compactUsd(num) + " / 1M tokens";
  }

  function openRouterModelUrl(modelId, rawUrl){
    if (rawUrl) {
      const explicit = validateOpenRouterModelUrl(rawUrl);
      return explicit ? explicit.href : "";
    }
    const explicit = validateOpenRouterModelUrl(rawUrl);
    if (explicit) return explicit.href;
    const safeId = String(modelId || "").trim();
    if (!safeId) return "";
    return "https://openrouter.ai/models/" + encodeURIComponent(safeId);
  }

  function normalizeOpenRouterModel(model){
    const item = model && typeof model === "object" ? model : {};
    const modelId = sanitizeText(item.id || item.slug || "", 120);
    const name = sanitizeText(item.name || modelId || "OpenRouter model", 140);
    const pricing = item.pricing && typeof item.pricing === "object" ? item.pricing : {};
    const promptToken = parseTokenPrice(pricing.prompt);
    const completionToken = parseTokenPrice(pricing.completion);
    const promptMillion = pricePerMillionValue(pricing.prompt);
    const completionMillion = pricePerMillionValue(pricing.completion);
    const hasParsedPricing = promptMillion !== null || completionMillion !== null;
    const price = hasParsedPricing ? (promptMillion || 0) + (completionMillion || 0) : null;
    const contextLength = Number(item.context_length || item.contextLength || 0);
    const bookingUrl = openRouterModelUrl(modelId, item.canonical_url || item.href || item.bookingUrl);
    const parsedUrl = validateOpenRouterModelUrl(bookingUrl);
    const description = sanitizeText(item.description || item.architecture && item.architecture.modality || "", 180);
    return {
      candidateId:modelId || ("openrouterModel-" + Math.random().toString(36).slice(2, 8)),
      sourceName:"OpenRouter",
      title:name,
      modelId,
      category:"aiModelPricing",
      price,
      currency:"USD",
      priceLabel:hasParsedPricing ? "输入：" + pricePerMillionLabel(pricing.prompt) + " · 输出：" + pricePerMillionLabel(pricing.completion) : "价格字段不可解析",
      promptPricePerToken:promptToken === null ? "" : String(promptToken),
      completionPricePerToken:completionToken === null ? "" : String(completionToken),
      promptPricePerMillion:promptMillion === null ? "" : promptMillion,
      completionPricePerMillion:completionMillion === null ? "" : completionMillion,
      inputPriceLabel:pricePerMillionLabel(pricing.prompt),
      outputPriceLabel:pricePerMillionLabel(pricing.completion),
      contextLength:Number.isFinite(contextLength) && contextLength > 0 ? contextLength : "",
      departTime:"",
      arriveTime:"",
      duration:"",
      conditions:[description, contextLength ? "上下文长度 " + contextLength : ""].filter(Boolean).join(" · "),
      refundPolicySummary:"模型调用按平台计费规则结算；无下单或付款动作。",
      rating:"",
      reputation:"OpenRouter 模型目录",
      riskSummary:hasParsedPricing ? "模型价格可能变化，实际调用费用以平台结算为准。" : "价格字段不可解析，未生成价格结论。",
      hiddenFeeNote:"实际成本可能受路由、缓存、最小计费单位或平台规则影响。",
      bookingUrl:parsedUrl ? parsedUrl.href : "",
      url:parsedUrl ? parsedUrl.href : "",
      urlType:"detail",
      bookingUrlHost:parsedUrl ? parsedUrl.host : "",
      recommendationReason:hasParsedPricing ? "按当前结果中的输入/输出综合成本排序；不能视为绝对最优。" : "缺少可解析 pricing 字段，仅展示模型信息，不生成价格推荐。",
      collectedAt:nowIso(),
      isLiveResult:true,
      isRealProviderResult:true,
      realExecution:false
    };
  }

  function sanitizeCommerceCandidate(candidate, context){
    const item = candidate && typeof candidate === "object" ? candidate : {};
    const parsedUrl = validateBookingUrl(item.bookingUrl || item.url);
    const price = Number(item.price);
    const breakdown = normalizeLandedCostBreakdown(item, context || {});
    const landedCost = calculateTotalLandedCost(Object.assign({}, item, { landedCostBreakdown:breakdown }));
    const landedCostCompleteness = inferLandedCostCompleteness(item, breakdown);
    const hasEstimatedFees = LANDED_COST_FIELDS.some(([key]) => breakdown[key] && breakdown[key].certainty === "estimated");
    const hasUnknownFees = LANDED_COST_FIELDS.some(([key]) => breakdown[key] && breakdown[key].certainty === "unknown");
    return {
      candidateId:sanitizeText(item.candidateId || ("commerceCandidate-" + Math.random().toString(36).slice(2, 8)), 80),
      sourceName:sanitizeText(item.sourceName || item.provider || "搜索源", 80),
      title:sanitizeText(item.title || "候选方案", 120),
      modelId:sanitizeText(item.modelId || "", 120),
      category:sanitizeText(item.category || context && context.category || "", 60),
      price:Number.isFinite(price) && price >= 0 ? price : null,
      currency:sanitizeText(item.currency || context && context.currency || "CNY", 12),
      totalPrice:isValidTotalPrice(item.totalPrice) ? Number(item.totalPrice) : isValidTotalPrice(landedCost) ? Number(landedCost) : Number.isFinite(price) && price >= 0 ? price : null,
      totalLandedCost:Number.isFinite(Number(landedCost)) && Number(landedCost) >= 0 ? Number(landedCost) : null,
      landedCostBreakdown:breakdown,
      landedCostCompleteness,
      hasEstimatedFees,
      hasUnknownFees,
      feeNotice:sanitizeText(item.feeNotice || landedCostNotice(landedCostCompleteness, hasEstimatedFees, hasUnknownFees), 220),
      itemPrice:breakdown.itemPrice.amount,
      shippingFee:breakdown.shippingFee.amount,
      dutyFee:breakdown.dutyFee.amount,
      taxFee:breakdown.taxFee.amount,
      platformFee:breakdown.platformFee.amount,
      paymentFee:breakdown.paymentFee.amount,
      brokerageFee:breakdown.brokerageFee.amount,
      insuranceFee:breakdown.insuranceFee.amount,
      requiredExtraFee:breakdown.requiredExtraFee.amount,
      sourceCountry:sanitizeText(item.sourceCountry || context && context.sourceCountry || "", 40),
      destinationCountry:sanitizeText(item.destinationCountry || context && context.destinationCountry || "", 40),
      crossBorder:item.crossBorder === true || !!(item.sourceCountry && item.destinationCountry && item.sourceCountry !== item.destinationCountry),
      priceLabel:sanitizeText(item.priceLabel || (Number.isFinite(price) && price >= 0 ? String(item.currency || context && context.currency || "CNY") + " " + price : ""), 120),
      promptPricePerToken:item.promptPricePerToken === undefined ? "" : sanitizeText(item.promptPricePerToken, 40),
      completionPricePerToken:item.completionPricePerToken === undefined ? "" : sanitizeText(item.completionPricePerToken, 40),
      promptPricePerMillion:item.promptPricePerMillion === undefined || item.promptPricePerMillion === "" ? "" : Number(item.promptPricePerMillion),
      completionPricePerMillion:item.completionPricePerMillion === undefined || item.completionPricePerMillion === "" ? "" : Number(item.completionPricePerMillion),
      inputPriceLabel:sanitizeText(item.inputPriceLabel || "", 80),
      outputPriceLabel:sanitizeText(item.outputPriceLabel || "", 80),
      contextLength:item.contextLength === undefined || item.contextLength === "" ? "" : Number(item.contextLength),
      departTime:sanitizeText(item.departTime || "", 80),
      arriveTime:sanitizeText(item.arriveTime || "", 80),
      duration:sanitizeText(item.duration || "", 80),
      conditions:sanitizeText(item.conditions || "", 160),
      refundPolicySummary:sanitizeText(item.refundPolicySummary || "", 160),
      rating:sanitizeText(item.rating || "", 40),
      reputation:sanitizeText(item.reputation || "", 80),
      riskSummary:sanitizeText(item.riskSummary || (!parsedUrl && item.bookingUrl ? "预订链接不是 https，已阻断打开。" : ""), 160),
      hiddenFeeNote:sanitizeText(item.hiddenFeeNote || "", 160),
      bookingUrl:parsedUrl ? parsedUrl.href : "",
      url:parsedUrl ? parsedUrl.href : "",
      urlType:normalizeUrlType(item.urlType, resultCategory(item.category || context && context.category || "")),
      redirectMode:CHEAPEST_REDIRECT_MODE,
      sourceType:sanitizeText(item.sourceType || item.dataSourceType || "provider", 60),
      priceCompleteness:item.priceCompleteness || inferPriceCompleteness(item),
      bookingUrlHost:parsedUrl ? parsedUrl.host : "",
      recommendationReason:sanitizeText(item.recommendationReason || "", 180),
      collectedAt:sanitizeText(item.collectedAt || nowIso(), 40),
      isLiveResult:item.isLiveResult !== false,
      isRealProviderResult:item.isRealProviderResult === true || item.isLiveResult === true,
      realExecution:false
    };
  }

  function normalizeCommerceSearchResults(raw, context){
    const source = raw && raw.candidates ? raw.candidates : raw;
    const candidates = (Array.isArray(source) ? source : [])
      .map((item) => normalizeCommerceResult(item, context || {}))
      .filter((item) => {
        if (isAiModelPricingTask(context) && item.modelId) return true;
        return isDisplayableLandedCostResult(item);
      })
      .map((item) => Object.assign(sanitizeCommerceCandidate(item, context || {}), item));
    return {
      ok:true,
      providerName:sanitizeText(raw && raw.providerName || context && context.providerName || "", 80),
      candidates,
      collectedAt:nowIso()
    };
  }

  function validateProviderResponseForSandbox(items){
    const api = sandboxApi();
    if (api && api.validateProviderResponse) return api.validateProviderResponse(items);
    return {
      schemaValidationStatus:Array.isArray(items) ? "pass" : "fail",
      candidateCount:Array.isArray(items) ? items.length : 0,
      validCandidateCount:Array.isArray(items) ? items.length : 0,
      invalidCandidateCount:0
    };
  }

  function modelCost(candidate){
    const prompt = Number.isFinite(Number(candidate && candidate.promptPricePerMillion)) ? Number(candidate.promptPricePerMillion) : Number.POSITIVE_INFINITY;
    const completion = Number.isFinite(Number(candidate && candidate.completionPricePerMillion)) ? Number(candidate.completionPricePerMillion) : Number.POSITIVE_INFINITY;
    return prompt + completion;
  }

  function sortCommerceCandidates(candidates){
    return (Array.isArray(candidates) ? candidates.slice() : []).sort((a, b) => {
      if (String(a && a.category || b && b.category || "") === "aiModelPricing") {
        const costA = modelCost(a);
        const costB = modelCost(b);
        if (costA !== costB) return costA - costB;
        const ctxA = Number.isFinite(Number(a && a.contextLength)) ? Number(a.contextLength) : 0;
        const ctxB = Number.isFinite(Number(b && b.contextLength)) ? Number(b.contextLength) : 0;
        if (ctxA !== ctxB) return ctxB - ctxA;
      }
      return compareByTotalLandedCost(a, b);
    });
  }

  function createRecommendationFromCandidates(candidates){
    const sorted = sortCommerceCandidates(candidates);
    const top = sorted[0] || null;
    if (!top) {
      return {
        title:"",
        reason:"没有可用候选方案。未生成价格或推荐结论。",
        riskSummary:"搜索源未返回可展示价格。",
        priceMayChange:true
      };
    }
    return {
      candidateId:top.candidateId,
      title:top.title,
      sourceName:top.sourceName,
      price:top.price,
      totalPrice:top.totalPrice || top.price,
      totalLandedCost:top.totalLandedCost || top.totalPrice || top.price,
      currency:top.currency,
      priceLabel:top.priceLabel,
      promptPricePerMillion:top.promptPricePerMillion || "",
      completionPricePerMillion:top.completionPricePerMillion || "",
      inputPriceLabel:top.inputPriceLabel || "",
      outputPriceLabel:top.outputPriceLabel || "",
      reason:top.recommendationReason || (top.category === "aiModelPricing" ? "按当前结果中的输入/输出综合成本排序；不能视为绝对最优。" : "同等条件下按当前可比结果中的到手总价排序；不代表全网最低或保证最低。"),
      riskSummary:top.riskSummary || "价格可能变化，预订前仍需用户确认。",
      priceMayChange:true
    };
  }

  function createCommerceSearchHistoryPayload(action, payload){
    const data = payload || {};
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];
    const sorted = sortCommerceCandidates(candidates);
    const lowest = sorted[0] || {};
    return {
      schemaVersion:"weishan.task.v1",
      module:"commerceAgent",
      action:String(action || "commerceAgent.search").replace(/^commerceAgent\./, ""),
      taskId:sanitizeText(data.taskId || "", 80),
      category:sanitizeText(data.category || "", 60),
      inputSummary:sanitizeText(data.inputSummary || data.query || "", 240),
      candidateCount:candidates.length,
      lowestPrice:lowest.price || "",
      lowestLandedCost:lowest.totalLandedCost || lowest.totalPrice || "",
      lowestPromptPricePerMillion:lowest.promptPricePerMillion || "",
      lowestCompletionPricePerMillion:lowest.completionPricePerMillion || "",
      currency:lowest.currency || data.currency || "",
      providerName:sanitizeText(data.providerName || "", 80),
      resultStatus:sanitizeText(data.resultStatus || "", 80),
      realExecution:false,
      createdAt:nowIso()
    };
  }

  function normalizeOpenRouterModelsResponse(raw){
    const source = raw && Array.isArray(raw.data) ? raw.data : raw && Array.isArray(raw.models) ? raw.models : Array.isArray(raw) ? raw : [];
    const candidates = source.map(normalizeOpenRouterModel).filter((item) => item.modelId);
    return {
      ok:true,
      providerName:"OpenRouter",
      candidates,
      collectedAt:nowIso()
    };
  }

  async function fetchOpenRouterModels(){
    if (window.WeishanOpenRouterModelsProvider && typeof window.WeishanOpenRouterModelsProvider.fetchModels === "function") {
      return window.WeishanOpenRouterModelsProvider.fetchModels();
    }
    if (window.WeishanOpenRouterModelsProvider && typeof window.WeishanOpenRouterModelsProvider.search === "function") {
      return window.WeishanOpenRouterModelsProvider.search();
    }
    if (typeof fetch !== "function") throw new Error("OpenRouter models fetch is unavailable.");
    const res = await fetch(OPENROUTER_MODELS_URL, {
      method:"GET",
      headers:{ "Accept":"application/json" }
    });
    if (!res || !res.ok) throw new Error("OpenRouter models API unavailable.");
    return res.json();
  }

  async function searchOpenRouterModels(request){
    try {
      const raw = await fetchOpenRouterModels();
      const normalized = normalizeOpenRouterModelsResponse(raw);
      const candidates = sortCommerceCandidates(normalized.candidates);
      return {
        ok:true,
        providerName:"OpenRouter",
        request,
        candidates,
        recommendation:createRecommendationFromCandidates(candidates),
        realExecution:false
      };
    } catch (_) {
      return {
        ok:false,
        code:"OPENROUTER_MODELS_UNAVAILABLE",
        message:"OpenRouter 搜索源不可用，无法返回真实价格。",
        providerName:"OpenRouter",
        request,
        candidates:[]
      };
    }
  }

  async function searchCommerceCandidates(task){
    const settings = getCommerceSearchSettings();
    const request = createCommerceSearchRequest(task);
    const providerHealth = getCommerceProviderHealth(request.category, settings);
    const providerConfig = getCommerceProviderConfig(request.category, settings);
    const providerConnector = getCommerceProviderConnector(request.category, settings);
    const configReady = isProviderConfigReady(providerConfig);
    const connectorReady = isProviderConnectorReady(providerConnector);
    const connectorHealth = connectorFields(providerConnector);
    const onboardingHealth = onboardingFields(getProviderOnboardingStatus(request.category));
    const sandbox = getCommerceProviderSandbox(request.category, settings);
    if (isProductSearchRequest(request) && locationHealth().hasShippingDestination !== true) {
      return shippingDestinationRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox);
    }
    if (isProductSearchRequest(request) && !getProductProviderReadiness(providerConfig).ready) {
      return productProviderBlockedResult(request, providerHealth, providerConfig, connectorHealth, sandbox);
    }
    if (isAiModelPricingTask(request)) {
      const aiConfig = getCommerceProviderConfig("aiModelPricing", settings);
      const aiConnector = getCommerceProviderConnector("aiModelPricing", settings);
      const aiConnectorReady = isProviderConnectorReady(aiConnector);
      const aiConnectorHealth = connectorFields(aiConnector);
      const aiSandbox = getCommerceProviderSandbox("aiModelPricing", settings);
      if (!isProviderConfigReady(aiConfig) || !aiConnectorReady || !isProviderSandboxReady(aiSandbox)) {
        return {
          ok:false,
          code:"COMMERCE_PROVIDER_CONFIG_NOT_READY",
          message:"provider_config_not_ready",
          reason:aiConnectorReady ? "provider_dry_run_blocked" : "connector_not_enabled",
          request,
          searchStatus:"no_provider",
          providerHealth:providerHealth.providerHealth,
          configHealth:configFields(aiConfig),
          connectorHealth:aiConnectorHealth,
          onboardingHealth:onboardingFields(getProviderOnboardingStatus("aiModelPricing")),
          sandboxHealth:aiSandbox,
          dryRunHealth:aiSandbox,
          canShowPrice:false,
          canShowBookingButton:false,
          canShowCheckoutButton:false,
          candidates:[]
        };
      }
      return searchOpenRouterModels(request);
    }
    if (!hasCommerceSearchProvider(settings) || !configReady || !connectorReady || !isProviderSandboxReady(sandbox)) {
      return {
        ok:false,
        code:"COMMERCE_PROVIDER_CONFIG_NOT_READY",
        message:"provider_config_not_ready",
        reason:connectorReady ? "provider_dry_run_blocked" : "connector_not_enabled",
        request,
        searchStatus:"no_provider",
        providerHealth:providerHealth.providerHealth,
        configHealth:configFields(providerConfig),
        connectorHealth,
        onboardingHealth,
        sandboxHealth:sandbox,
        dryRunHealth:sandbox,
        canShowPrice:false,
        canShowBookingButton:false,
        canShowCheckoutButton:false,
        candidates:[]
      };
    }
    if (request.missingFields && request.missingFields.length) {
      return {
        ok:false,
        code:"COMMERCE_MISSING_FIELDS",
        message:"搜索条件缺失：" + request.missingFields.join("、"),
        request,
        providerHealth:providerHealth.providerHealth,
        configHealth:configFields(providerConfig),
        connectorHealth,
        onboardingHealth,
        sandboxHealth:sandbox,
        dryRunHealth:sandbox,
        canShowPrice:false,
        canShowBookingButton:false,
        canShowCheckoutButton:false,
        candidates:[]
      };
    }
    if (settings.providerMode === "manualProvider") {
      const raw = await window.WeishanCommerceSearchProvider.search(request);
      const normalized = normalizeCommerceSearchResults(raw, Object.assign({}, request, { providerName:settings.providerName || raw && raw.providerName || "manualProvider" }));
      const sandboxValidation = validateProviderResponseForSandbox(normalized.candidates || []);
      const candidates = sortCommerceCandidates(normalized.candidates).slice(0, 3);
      return {
        ok:candidates.length > 0,
        code:candidates.length > 0 ? "" : "COMMERCE_NO_RESULTS",
        message:candidates.length > 0 ? "" : "搜索源未返回可展示结果。",
        providerName:settings.providerName || normalized.providerName || "manualProvider",
        request,
        searchStatus:candidates.length > 0 ? "completed" : "no_results",
        providerHealth:providerHealth.providerHealth,
        configHealth:configFields(providerConfig),
        connectorHealth,
        onboardingHealth,
        sandboxHealth:Object.assign({}, sandbox, sandboxValidation),
        dryRunHealth:Object.assign({}, sandbox, sandboxValidation),
        canShowPrice:candidates.length > 0,
        canShowBookingButton:candidates.length > 0 && providerHealth.canShowBookingButton === true,
        canShowCheckoutButton:candidates.length > 0 && providerHealth.canShowCheckoutButton === true,
        redirectMode:CHEAPEST_REDIRECT_MODE,
        cheapestRedirect:true,
        candidates,
        recommendation:createRecommendationFromCandidates(candidates),
        realExecution:false
      };
    }
    return {
      ok:false,
      code:"COMMERCE_NO_PROVIDER",
      message:providerHealth.reasonWhenDisabled || "搜索适配器未配置，无法返回真实价格。",
      reason:"provider_config_not_ready",
      request,
      searchStatus:"no_provider",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth,
      sandboxHealth:sandbox,
      dryRunHealth:sandbox,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  window.WeishanCommerceSearch = {
    COMMERCE_SEARCH_SETTINGS_KEY,
    getCommerceSearchSettings,
    saveCommerceSearchSettings,
    hasCommerceSearchProvider,
    getCommerceProviderRegistry,
    getCommerceProviderHealth,
    getCommerceProviderConfig,
    getCommerceProviderConnector,
    getCommerceProviderSandbox,
    getProviderOnboardingStatus,
    locationHealthForCommerce:locationHealth,
    isProviderConfigReady,
    isProviderConnectorReady,
    getProductProviderReadiness,
    getProductProviderProfile,
    createCommerceSearchRequest,
    CHEAPEST_REDIRECT_MODE,
    isDisplayableProviderResult,
    isDisplayableLandedCostResult,
    normalizeLandedCostBreakdown,
    calculateTotalLandedCost,
    compareByTotalLandedCost,
    normalizeCommerceSearchResults,
    sortCommerceCandidates,
    createRecommendationFromCandidates,
    validateBookingUrl,
    validateOpenRouterModelUrl,
    sanitizeCommerceCandidate,
    normalizeCommerceResult,
    normalizeOpenRouterModel,
    normalizeOpenRouterModelsResponse,
    createCommerceSearchHistoryPayload,
    searchCommerceCandidates
  };
})();
