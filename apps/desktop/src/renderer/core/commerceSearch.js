(function(){
  const COMMERCE_SEARCH_SETTINGS_KEY = "weishan:commerceSearch:settings:v1";
  const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
  const CHEAPEST_REDIRECT_MODE = "cheapest_redirect";
  const PRIJS_PROFEET_SOURCE_ID = "prijsprofeet_public_api";
  const TIENDA_CENTRO_SOURCE_ID = "tienda_centro_public_api";
  const prijsProfeetSearchGenerations = new Map();
  const tiendaCentroSearchGenerations = new Map();

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

  function approvalApi(){
    return window.WeishanCommerceProviderApprovalWorkflow || null;
  }

  function connectorStubApi(){
    return window.WeishanCommerceReadOnlyConnectorStub || null;
  }

  function stubProfileApi(){
    return window.WeishanCommerceEbayBrowseStubProfile || null;
  }

  function secretStorageApi(){
    return window.WeishanCommerceProviderSecretStoragePlan || null;
  }

  function sandboxDryRunApi(){
    return window.WeishanCommerceProviderSandboxDryRun || null;
  }

  function connectorGateApi(){
    return window.WeishanCommerceConnectorGate || null;
  }

  function integrationReadinessApi(){
    return window.WeishanCommerceProviderIntegrationReadiness || null;
  }

  function integrationRunbookApi(){
    return window.WeishanCommerceProviderIntegrationRunbook || null;
  }

  function localLawApi(){
    return window.WeishanCommerceLocalLawCompliance || null;
  }

  function localIntentRouterApi(){
    return window.WeishanCommerceLocalIntentRouter || null;
  }

  function providerGatewayApi(){
    return window.WeishanGlobalShoppingProviderGateway || null;
  }

  function realProviderExecutionGateApi(){
    return window.WeishanGlobalShoppingRealProviderExecutionGate || null;
  }

  function platformCandidateFactoryApi(){
    return window.WeishanGlobalShoppingPlatformCandidateFactory || null;
  }

  function readOnlySearchPresenterApi(){
    return window.WeishanGlobalShoppingReadOnlySearchResultPresenter || null;
  }

  function prijsProfeetReadonlyAdapterApi(){
    return window.WeishanPrijsProfeetReadonlyAdapter || null;
  }

  function tiendaCentroReadonlyAdapterApi(){
    return window.WeishanTiendaCentroReadonlyAdapter || null;
  }

  function getCommerceLocalIntentRoute(input){
    const api = localIntentRouterApi();
    if (api && api.routeCommerceIntentLocally) return api.routeCommerceIntentLocally(input || "");
    return {
      routerVersion:"2.0.49",
      phase:"commerce_local_intent_router",
      routeMode:"local_first",
      routedBy:"local_rules",
      aiUsed:false,
      aiFallbackEligible:false,
      intentCategory:"unknown",
      commerceType:"unknown",
      confidence:"low",
      reason:"unknown_intent",
      canTriggerCommercePlan:false,
      canTriggerRealProviderSearch:false,
      canDisplayRealPrice:false,
      canRedirect:false
    };
  }

  function getLocalLawCompliancePolicy(){
    const api = localLawApi();
    if (api && api.getLocalLawCompliancePolicy) return api.getLocalLawCompliancePolicy();
    return {
      complianceVersion:"2.0.40",
      phase:"local_law_compliance_gate",
      defaultStatus:"not_verified",
      requiredBeforeSearch:true,
      requiredBeforePriceDisplay:true,
      requiredBeforeRedirect:true,
      locationPriority:["precise_location_if_available", "shipping_destination", "service_destination", "manual_region_selection"],
      strictestRuleWins:true,
      unknownLegalityBlocks:true,
      noLegalAdvice:true,
      privacy:{ storeRawCoordinates:false, logRawCoordinates:false, shareWithThirdParty:false, useForAds:false, useForTracking:false },
      regulatedCategories:["cannabis_or_marijuana", "weapons_or_firearms", "controlled_medication", "adult_services", "gambling", "tobacco_or_nicotine", "alcohol", "hazardous_goods", "restricted_financial_products", "regionally_restricted_goods_or_services"],
      safety:{ noRealLegalDatabase:true, noNetworkLegalLookup:true, noPriceDisplayWhenUnverified:true, noRedirectWhenUnverified:true, noCheckout:true, noPayment:true, noOrderSubmit:true, noIdentityStorage:true }
    };
  }

  function evaluateLocalLawCompliance(request, settings){
    const api = localLawApi();
    if (api && api.evaluateLocalLawCompliance) return api.evaluateLocalLawCompliance(request, settings || { locationHealth:locationHealth() });
    return {
      complianceVersion:"2.0.40",
      phase:"local_law_compliance_gate",
      complianceStatus:"not_verified",
      searchStatus:"local_law_compliance_required",
      canSearchProvider:false,
      canDisplayPrice:false,
      canShowRedirectButton:false,
      canCheckout:false,
      canPay:false,
      canStoreIdentity:false,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      strictestRuleWins:true,
      unknownLegalityBlocks:true,
      noLegalAdvice:true,
      reason:"local_law_compliance_not_verified",
      privacy:{ storeRawCoordinates:false, logRawCoordinates:false, shareWithThirdParty:false, useForAds:false, useForTracking:false },
      safety:{ noRealLegalDatabase:true, noNetworkLegalLookup:true, noPriceDisplayWhenUnverified:true, noRedirectWhenUnverified:true, noCheckout:true, noPayment:true, noOrderSubmit:true, noIdentityStorage:true }
    };
  }

  function explainLocalLawBlockReason(result){
    const api = localLawApi();
    if (api && api.explainLocalLawBlockReason) return api.explainLocalLawBlockReason(result);
    return "当地法律合规未确认，未确认前不显示价格、不跳转购买或预订页面。";
  }

  function getProviderOnboardingStatus(category){
    const api = onboardingApi();
    if (api && api.getProviderOnboardingStatus) return api.getProviderOnboardingStatus(category);
    return {
      checklistVersion:"2.0.40",
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

  function getProviderApprovalStatus(category, providerId){
    const api = approvalApi();
    if (api && api.getProviderApprovalStatus) return api.getProviderApprovalStatus(category, providerId);
    return {
      workflowVersion:"2.0.40",
      phase:"provider_approval_workflow",
      category:resultCategory(category),
      providerId:String(providerId || resultCategory(category) + "-provider-disabled"),
      approvalStatus:"not_reviewed",
      canRequestApproval:true,
      canStartConnectorStubDevelopment:false,
      canConfigureApiKey:false,
      canConnectEndpoint:false,
      canEnableNetworkSearch:false,
      canDisplayPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false,
      reason:"provider_approval_required",
      approvalStages:{
        legalReviewRequired:true,
        apiDocsReviewRequired:true,
        privacyReviewRequired:true,
        feeFieldReviewRequired:true,
        securityReviewRequired:true,
        localLawReviewRequired:true,
        humanApprovalRequired:true
      },
      gates:{
        allowConnectorStubDevelopment:false,
        allowApiKeyConfiguration:false,
        allowEndpointConnection:false,
        allowNetworkSearch:false,
        allowPriceDisplay:false,
        allowRedirect:false,
        allowCheckout:false,
        allowPayment:false,
        allowOrderSubmit:false,
        allowIdentityStorage:false
      },
      safety:{
        noRealEndpoint:true,
        noApiKey:true,
        noNetworkSearch:true,
        noPriceDisplay:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noLegalAdvice:true,
        noBypassLocalLaw:true
      }
    };
  }

  function getReadOnlyConnectorStubStatus(category, providerId, approvalHealth){
    const api = connectorStubApi();
    if (api && api.getReadOnlyConnectorStubStatus) return api.getReadOnlyConnectorStubStatus(category, providerId, approvalHealth);
    return {
      stubVersion:"2.0.41",
      phase:"read_only_connector_stub_framework",
      stubStatus:"stub_not_ready",
      connectorMode:"read_only",
      canBuildStub:false,
      canExecuteStub:false,
      canConfigureApiKey:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      reason:"provider_approval_required_before_stub"
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

  function getProviderStubProfileStatus(providerId){
    const api = stubProfileApi();
    if (api && api.getProviderStubProfileStatus) return api.getProviderStubProfileStatus(providerId || "ebay_browse_api");
    return {
      profileVersion:"2.0.43",
      providerId:"ebay_browse_api",
      providerName:"eBay Browse API",
      profileStatus:"profile_only_not_connected",
      connectorMode:"read_only",
      canUseForReview:true,
      canConnectEndpoint:false,
      canConfigureApiKey:false,
      canUseNetwork:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      reason:"provider_stub_profile_only"
    };
  }

  function getProviderSecretStorageStatus(providerId){
    const api = secretStorageApi();
    if (api && api.getProviderSecretStorageStatus) return api.getProviderSecretStorageStatus(providerId || "provider-disabled");
    if (configApi() && configApi().getProviderSecretStorageStatus) return configApi().getProviderSecretStorageStatus(providerId || "provider-disabled");
    return {
      secretPlanVersion:"2.0.44",
      phase:"provider_secret_storage_plan",
      providerId:String(providerId || "provider-disabled"),
      secretStatus:"not_configured",
      storageMode:"secure_storage_required",
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false,
      canUseApiKeyForNetwork:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canEnableNetworkSearch:false,
      canDisplayPrice:false,
      canReturnRealPrice:false,
      canRedirect:false,
      reason:"provider_secret_storage_not_approved"
    };
  }

  function getProviderSandboxDryRunStatus(providerId, providerHealth){
    const api = sandboxDryRunApi();
    if (api && api.getProviderSandboxDryRunStatus) return api.getProviderSandboxDryRunStatus(providerId || "provider-disabled", providerHealth);
    if (configApi() && configApi().getProviderSandboxDryRunStatus) return configApi().getProviderSandboxDryRunStatus(providerId || "provider-disabled", providerHealth);
    return {
      dryRunVersion:"2.0.45",
      phase:"provider_sandbox_dry_run_framework",
      providerId:String(providerId || "provider-disabled"),
      dryRunStatus:"not_run",
      dryRunMode:"offline_sandbox",
      canRunDryRun:false,
      canUseRealEndpoint:false,
      canUseRealApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      reason:"provider_sandbox_dry_run_required"
    };
  }

  function getCommerceConnectorGateStatus(providerId){
    const api = connectorGateApi();
    if (api && api.getCommerceConnectorGateStatus) return api.getCommerceConnectorGateStatus(providerId || "provider-disabled");
    if (configApi() && configApi().getCommerceConnectorGateStatus) return configApi().getCommerceConnectorGateStatus(providerId || "provider-disabled");
    return {
      connectorGateVersion:"2.0.46",
      phase:"connector_gate_framework",
      providerId:String(providerId || "provider-disabled"),
      connectorGateStatus:"blocked",
      gateMode:"final_pre_connection_gate",
      canOpenConnector:false,
      canConnectEndpoint:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false,
      reason:"connector_gate_required",
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noRawGpsStorage:true,
        noBypassLocalLaw:true
      }
    };
  }

  function getProviderIntegrationReadiness(providerId, providerHealth){
    const api = integrationReadinessApi();
    if (api && api.getProviderIntegrationReadiness) return api.getProviderIntegrationReadiness(providerId || "provider-disabled", providerHealth || {});
    if (configApi() && configApi().getProviderIntegrationReadiness) return configApi().getProviderIntegrationReadiness(providerId || "provider-disabled", providerHealth || {});
    return {
      readinessVersion:"2.0.48",
      phase:"provider_integration_readiness_summary",
      providerId:String(providerId || "provider-disabled"),
      defaultStatus:"not_ready",
      readinessStatus:"not_ready",
      summaryMode:"pre_connection_readiness",
      canConnectProvider:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canDisplayRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false,
      reason:"provider_integration_not_ready",
      gates:{
        globalCommerceStandard:"required",
        localLawCompliance:"not_verified",
        providerOnboarding:"not_completed",
        providerApproval:"not_reviewed",
        readOnlyConnectorStub:"not_ready",
        providerStubProfile:"profile_only_not_connected",
        secretStorage:"not_configured",
        sandboxDryRun:"not_run",
        connectorGate:"blocked",
        humanApproval:"not_granted"
      },
      safety:{
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noRawGpsStorage:true,
        noBypassLocalLaw:true
      }
    };
  }

  function getProviderIntegrationRunbook(providerId, providerHealth){
    const api = integrationRunbookApi();
    if (api && api.getProviderIntegrationRunbook) return api.getProviderIntegrationRunbook(providerId || "provider-disabled", providerHealth || {});
    if (configApi() && configApi().getProviderIntegrationRunbook) return configApi().getProviderIntegrationRunbook(providerId || "provider-disabled", providerHealth || {});
    if (providersApi() && providersApi().getProviderIntegrationRunbook) return providersApi().getProviderIntegrationRunbook(providerId || "provider-disabled", providerHealth || {});
    return {
      runbookVersion:"2.0.48",
      phase:"provider_integration_manual_approval_runbook",
      providerId:String(providerId || "provider-disabled"),
      defaultStatus:"manual_approval_required",
      runbookStatus:"manual_approval_required",
      runbookMode:"pre_real_provider_connection",
      canApproveRealProvider:false,
      canConnectEndpoint:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canDisplayRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false,
      reason:"provider_manual_approval_runbook_required"
    };
  }

  function defaultConfig(category, settings){
    const api = configApi();
    if (api && api.getCommerceProviderConfig) return api.getCommerceProviderConfig(category, settings);
    const next = resultCategory(category);
    const productDefaults = next === "product" ? productSafetySwitches() : {};
    const productCandidate = next === "product" ? getProductProviderCandidateReadiness() : null;
    const pool = next === "product" ? getGlobalProviderPoolReadiness() : null;
    const profileHealth = next === "product" ? getProviderStubProfileStatus(productCandidate && productCandidate.selectedFirstCandidate || "ebay_browse_api") : null;
    const approval = approvalFields(getProviderApprovalStatus(next, next === "product" ? "product_search_readonly_candidate" : next + "-provider-disabled"));
    const stub = connectorStubFields(getReadOnlyConnectorStubStatus(next, next === "product" ? "product_search_readonly_candidate" : next + "-provider-disabled", approval));
    const dryRun = providerSandboxDryRunFields(getProviderSandboxDryRunStatus(next === "product" ? "ebay_browse_api" : next + "-provider-disabled"));
    const connectorGate = connectorGateFields(getCommerceConnectorGateStatus(next === "product" ? "ebay_browse_api" : next + "-provider-disabled"));
    const integrationReadiness = providerIntegrationReadinessFields(getProviderIntegrationReadiness(next === "product" ? "ebay_browse_api" : next + "-provider-disabled", { connectorGateHealth:connectorGate }));
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
      approvalStatus:approval.approvalStatus,
      providerApprovalRequired:true,
      canRequestApproval:approval.canRequestApproval,
      canStartConnectorStubDevelopment:approval.canStartConnectorStubDevelopment,
      canConfigureApiKey:approval.canConfigureApiKey,
      canEnableNetworkSearch:approval.canEnableNetworkSearch,
      canRedirect:approval.canRedirect,
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
      providerStubProfileHealth:profileHealth || undefined,
      providerSecretHealth:getProviderSecretStorageStatus(next === "product" ? "ebay_browse_api" : next + "-provider-disabled"),
      providerSandboxDryRunHealth:dryRun,
      connectorGateHealth:connectorGate,
      connectorGateStatus:connectorGate.connectorGateStatus,
      connectorGateMode:connectorGate.gateMode,
      canOpenCommerceConnector:false,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      globalProviderPoolReadiness:pool || undefined,
      approvalHealth:approval,
      connectorStubHealth:stub,
      connectorStubStatus:stub.stubStatus,
      connectorStubMode:stub.connectorMode,
      canBuildReadOnlyConnectorStub:stub.canBuildStub,
      canExecuteReadOnlyConnectorStub:stub.canExecuteStub,
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
      approvalStatus:next.approvalStatus || "not_reviewed",
      providerApprovalRequired:next.providerApprovalRequired !== false,
      canRequestApproval:next.canRequestApproval !== false,
      canStartConnectorStubDevelopment:next.canStartConnectorStubDevelopment === true,
      canConfigureApiKey:next.canConfigureApiKey === true,
      canEnableNetworkSearch:next.canEnableNetworkSearch === true,
      canRedirect:next.canRedirect === true,
      approvalHealth:next.approvalHealth || approvalFields(getProviderApprovalStatus(next.category, next.providerId)),
      productProviderProfile:next.productProviderProfile || getProductProviderProfile(),
      productProviderReadiness:next.productProviderReadiness || getProductProviderReadiness(next),
      productProviderCandidateReadiness:next.productProviderCandidateReadiness || getProductProviderCandidateReadiness(),
      providerStubProfileHealth:next.providerStubProfileHealth || getProviderStubProfileStatus(next.selectedFirstCandidate || "ebay_browse_api"),
      providerSecretHealth:next.providerSecretHealth || getProviderSecretStorageStatus(next.selectedFirstCandidate || next.providerId),
      providerSandboxDryRunHealth:next.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(next.selectedFirstCandidate || next.providerId),
      connectorGateHealth:next.connectorGateHealth || getCommerceConnectorGateStatus(next.selectedFirstCandidate || next.providerId),
      connectorGateStatus:next.connectorGateStatus || next.connectorGateHealth && next.connectorGateHealth.connectorGateStatus || "blocked",
      connectorGateMode:next.connectorGateMode || next.connectorGateHealth && next.connectorGateHealth.gateMode || "final_pre_connection_gate",
      canOpenCommerceConnector:next.canOpenCommerceConnector === true,
      providerIntegrationReadiness:next.providerIntegrationReadiness || getProviderIntegrationReadiness(next.selectedFirstCandidate || next.providerId, next),
      providerIntegrationReadinessStatus:next.providerIntegrationReadinessStatus || next.providerIntegrationReadiness && next.providerIntegrationReadiness.readinessStatus || "not_ready",
      providerIntegrationSummaryMode:next.providerIntegrationSummaryMode || next.providerIntegrationReadiness && next.providerIntegrationReadiness.summaryMode || "pre_connection_readiness",
      canProceedToProviderIntegration:false,
      providerIntegrationRunbook:next.providerIntegrationRunbook || getProviderIntegrationRunbook(next.selectedFirstCandidate || next.providerId, next),
      providerIntegrationRunbookStatus:next.providerIntegrationRunbookStatus || next.providerIntegrationRunbook && next.providerIntegrationRunbook.runbookStatus || "manual_approval_required",
      providerIntegrationRunbookMode:next.providerIntegrationRunbookMode || next.providerIntegrationRunbook && next.providerIntegrationRunbook.runbookMode || "pre_real_provider_connection",
      canApproveProviderIntegration:false,
      canProceedAfterManualApproval:false,
      globalProviderPoolReadiness:next.globalProviderPoolReadiness || getGlobalProviderPoolReadiness()
    };
  }

  function providerStubProfileFields(profile){
    const next = profile || {};
    return {
      profileVersion:next.profileVersion || "2.0.43",
      providerId:next.providerId || "ebay_browse_api",
      providerName:next.providerName || "eBay Browse API",
      profileStatus:next.profileStatus || "profile_only_not_connected",
      connectorMode:next.connectorMode || "read_only",
      canUseForReview:next.canUseForReview !== false,
      canConnectEndpoint:false,
      canConfigureApiKey:false,
      canUseNetwork:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      reason:next.reason || "provider_stub_profile_only"
    };
  }

  function providerSecretFields(secret){
    const next = secret || {};
    const storagePolicy = next.storagePolicy || {};
    const gates = next.gates || {};
    const required = next.requiredBeforeKeyUse || {};
    const safety = next.safety || {};
    return {
      secretPlanVersion:next.secretPlanVersion || "2.0.44",
      phase:next.phase || "provider_secret_storage_plan",
      providerId:next.providerId || "provider-disabled",
      secretStatus:next.secretStatus || "not_configured",
      storageMode:next.storageMode || "secure_storage_required",
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false,
      canUseApiKeyForNetwork:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canEnableNetworkSearch:false,
      canDisplayPrice:false,
      canReturnRealPrice:false,
      canRedirect:false,
      reason:next.reason || "provider_secret_storage_not_approved",
      storagePolicy:{
        useSecureStorage:storagePolicy.useSecureStorage !== false,
        allowPlaintextInRepo:false,
        allowPlaintextInUi:false,
        allowPlaintextInLogs:false,
        allowPlaintextInLocalStorage:false,
        allowPlaintextInSessionStorage:false,
        allowPlaintextInQueryString:false,
        allowPlaintextInErrorMessage:false,
        redactOnDisplay:storagePolicy.redactOnDisplay !== false,
        redactOnExport:storagePolicy.redactOnExport !== false
      },
      gates:{
        allowApiKeyInput:false,
        allowApiKeySave:false,
        allowApiKeyRead:false,
        allowApiKeyUseForNetwork:false,
        allowEndpointConnection:false,
        allowNetworkSearch:false,
        allowPriceDisplay:false,
        allowRedirect:false,
        canInputApiKey:false,
        canSaveApiKey:false,
        canReadApiKey:false,
        canUseApiKeyForNetwork:false,
        canConnectEndpoint:false,
        canEnableNetworkSearch:false,
        canReturnRealPrice:false,
        canRedirect:false
      },
      requiredBeforeKeyUse:{
        globalCommerceStandard:required.globalCommerceStandard !== false,
        localLawComplianceGate:required.localLawComplianceGate !== false,
        providerOnboardingChecklist:required.providerOnboardingChecklist !== false,
        providerApprovalWorkflow:required.providerApprovalWorkflow !== false,
        approvedForStub:required.approvedForStub !== false,
        readOnlyConnectorStub:required.readOnlyConnectorStub !== false,
        providerStubProfile:required.providerStubProfile !== false,
        securityStorageReview:required.securityStorageReview !== false,
        secretStorageReview:required.secretStorageReview !== false,
        endpointReview:required.endpointReview !== false,
        sandboxDryRun:required.sandboxDryRun !== false,
        connectorGate:required.connectorGate !== false,
        humanApproval:required.humanApproval !== false
      },
      safety:{
        noRealApiKey:safety.noRealApiKey !== false,
        noPlaintextSecret:safety.noPlaintextSecret !== false,
        noSecretLogging:safety.noSecretLogging !== false,
        noSecretInUi:safety.noSecretInUi !== false,
        noSecretInGit:safety.noSecretInGit !== false,
        noSecretInEnvCommit:safety.noSecretInEnvCommit !== false,
        noNetworkSearch:safety.noNetworkSearch !== false,
        noRealEndpoint:safety.noRealEndpoint !== false,
        noRealPrice:safety.noRealPrice !== false,
        noFakeDemoMockPrice:safety.noFakeDemoMockPrice !== false,
        noRedirect:safety.noRedirect !== false,
        noCheckout:safety.noCheckout !== false,
        noPayment:safety.noPayment !== false,
        noOrderSubmit:safety.noOrderSubmit !== false,
        noIdentityStorage:safety.noIdentityStorage !== false
      }
    };
  }

  function providerSandboxDryRunFields(dryRun){
    const next = dryRun || {};
    const checks = next.dryRunChecks || {};
    const capabilities = next.capabilities || {};
    const safety = next.safety || {};
    return {
      dryRunVersion:next.dryRunVersion || "2.0.45",
      phase:next.phase || "provider_sandbox_dry_run_framework",
      providerId:next.providerId || "provider-disabled",
      defaultStatus:next.defaultStatus || "not_run",
      dryRunStatus:next.dryRunStatus || "not_run",
      dryRunMode:next.dryRunMode || "offline_sandbox",
      requiresGlobalCommerceStandard:next.requiresGlobalCommerceStandard !== false,
      requiresLocalLawCompliance:next.requiresLocalLawCompliance !== false,
      requiresProviderOnboarding:next.requiresProviderOnboarding !== false,
      requiresProviderApproval:next.requiresProviderApproval !== false,
      requiresReadOnlyConnectorStub:next.requiresReadOnlyConnectorStub !== false,
      requiresProviderStubProfile:next.requiresProviderStubProfile !== false,
      requiresSecretStoragePlan:next.requiresSecretStoragePlan !== false,
      requiresHumanApproval:next.requiresHumanApproval !== false,
      canRunDryRun:false,
      canUseRealEndpoint:false,
      canUseRealApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false,
      reason:next.reason || "provider_sandbox_dry_run_required",
      dryRunChecks:{
        requestShapeReviewed:checks.requestShapeReviewed === true,
        responseShapeReviewed:checks.responseShapeReviewed === true,
        errorHandlingReviewed:checks.errorHandlingReviewed === true,
        timeoutHandlingReviewed:checks.timeoutHandlingReviewed === true,
        rateLimitHandlingReviewed:checks.rateLimitHandlingReviewed === true,
        paginationReviewed:checks.paginationReviewed === true,
        priceFieldReviewed:checks.priceFieldReviewed === true,
        taxFeeShippingFieldReviewed:checks.taxFeeShippingFieldReviewed === true,
        redirectUrlReviewed:checks.redirectUrlReviewed === true,
        privacyReviewed:checks.privacyReviewed === true,
        noPaymentConfirmed:checks.noPaymentConfirmed === true,
        noOrderSubmitConfirmed:checks.noOrderSubmitConfirmed === true,
        noIdentityStorageConfirmed:checks.noIdentityStorageConfirmed === true
      },
      capabilities:{
        canRunDryRun:capabilities.canRunDryRun === true && false,
        canUseRealEndpoint:false,
        canUseRealApiKey:false,
        canUseNetwork:false,
        canReturnRealResults:false,
        canReturnRealPrice:false,
        canReturnMockPrice:false,
        canRedirect:false,
        canCheckout:false,
        canPay:false,
        canSubmitOrder:false,
        canStoreIdentity:false
      },
      safety:{
        noRealEndpoint:safety.noRealEndpoint !== false,
        noRealApiKey:safety.noRealApiKey !== false,
        noNetworkSearch:safety.noNetworkSearch !== false,
        noRealResults:safety.noRealResults !== false,
        noRealPrice:safety.noRealPrice !== false,
        noFakeDemoMockPrice:safety.noFakeDemoMockPrice !== false,
        noRedirect:safety.noRedirect !== false,
        noCheckout:safety.noCheckout !== false,
        noPayment:safety.noPayment !== false,
        noOrderSubmit:safety.noOrderSubmit !== false,
        noIdentityStorage:safety.noIdentityStorage !== false,
        noRawGpsStorage:safety.noRawGpsStorage !== false
      }
    };
  }

  function connectorGateFields(gate){
    const next = gate || {};
    const checks = next.requiredChecks || {};
    const capabilities = next.capabilities || {};
    const safety = next.safety || {};
    return {
      connectorGateVersion:next.connectorGateVersion || "2.0.46",
      phase:next.phase || "connector_gate_framework",
      providerId:next.providerId || "provider-disabled",
      defaultStatus:next.defaultStatus || "blocked",
      connectorGateStatus:next.connectorGateStatus || "blocked",
      gateMode:next.gateMode || "final_pre_connection_gate",
      requiresGlobalCommerceStandard:next.requiresGlobalCommerceStandard !== false,
      requiresLocalLawCompliance:next.requiresLocalLawCompliance !== false,
      requiresProviderOnboarding:next.requiresProviderOnboarding !== false,
      requiresProviderApproval:next.requiresProviderApproval !== false,
      requiresReadOnlyConnectorStub:next.requiresReadOnlyConnectorStub !== false,
      requiresProviderStubProfile:next.requiresProviderStubProfile !== false,
      requiresSecretStoragePlan:next.requiresSecretStoragePlan !== false,
      requiresSandboxDryRun:next.requiresSandboxDryRun !== false,
      requiresHumanApproval:next.requiresHumanApproval !== false,
      canOpenConnector:false,
      canConnectEndpoint:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false,
      reason:next.reason || "connector_gate_required",
      requiredChecks:{
        globalCommerceStandardPassed:checks.globalCommerceStandardPassed === true,
        localLawCompliancePassed:checks.localLawCompliancePassed === true,
        providerOnboardingCompleted:checks.providerOnboardingCompleted === true,
        providerApprovalGranted:checks.providerApprovalGranted === true,
        readOnlyConnectorStubReady:checks.readOnlyConnectorStubReady === true,
        providerStubProfileReviewed:checks.providerStubProfileReviewed === true,
        secretStorageApproved:checks.secretStorageApproved === true,
        sandboxDryRunPassed:checks.sandboxDryRunPassed === true,
        endpointReviewed:checks.endpointReviewed === true,
        apiKeyStorageReviewed:checks.apiKeyStorageReviewed === true,
        networkPolicyReviewed:checks.networkPolicyReviewed === true,
        priceFieldReviewed:checks.priceFieldReviewed === true,
        redirectPolicyReviewed:checks.redirectPolicyReviewed === true,
        noPaymentConfirmed:checks.noPaymentConfirmed === true,
        noOrderSubmitConfirmed:checks.noOrderSubmitConfirmed === true,
        noIdentityStorageConfirmed:checks.noIdentityStorageConfirmed === true,
        humanApprovalGranted:checks.humanApprovalGranted === true
      },
      capabilities:{
        canOpenConnector:capabilities.canOpenConnector === true && false,
        canConnectEndpoint:false,
        canUseApiKey:false,
        canUseNetwork:false,
        canReturnRealResults:false,
        canReturnRealPrice:false,
        canReturnMockPrice:false,
        canRedirect:false,
        canCheckout:false,
        canPay:false,
        canSubmitOrder:false,
        canStoreIdentity:false
      },
      safety:{
        noRealEndpoint:safety.noRealEndpoint !== false,
        noRealApiKey:safety.noRealApiKey !== false,
        noNetworkSearch:safety.noNetworkSearch !== false,
        noRealResults:safety.noRealResults !== false,
        noRealPrice:safety.noRealPrice !== false,
        noFakeDemoMockPrice:safety.noFakeDemoMockPrice !== false,
        noRedirect:safety.noRedirect !== false,
        noCheckout:safety.noCheckout !== false,
        noPayment:safety.noPayment !== false,
        noOrderSubmit:safety.noOrderSubmit !== false,
        noIdentityStorage:safety.noIdentityStorage !== false,
        noRawGpsStorage:safety.noRawGpsStorage !== false,
        noBypassLocalLaw:safety.noBypassLocalLaw !== false
      }
    };
  }

  function providerIntegrationReadinessFields(readiness){
    const next = readiness || {};
    const overall = next.overall || {};
    const gates = next.gates || {};
    const safety = next.safety || {};
    return {
      readinessVersion:next.readinessVersion || "2.0.48",
      phase:next.phase || "provider_integration_readiness_summary",
      providerId:next.providerId || "provider-disabled",
      defaultStatus:next.defaultStatus || "not_ready",
      readinessStatus:next.readinessStatus || "not_ready",
      summaryMode:next.summaryMode || "pre_connection_readiness",
      canConnectProvider:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canDisplayRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false,
      reason:next.reason || "provider_integration_not_ready",
      overall:{
        canConnectProvider:overall.canConnectProvider === true && false,
        canUseApiKey:overall.canUseApiKey === true && false,
        canUseNetwork:overall.canUseNetwork === true && false,
        canReturnRealResults:overall.canReturnRealResults === true && false,
        canDisplayRealPrice:overall.canDisplayRealPrice === true && false,
        canReturnMockPrice:overall.canReturnMockPrice === true && false,
        canRedirect:overall.canRedirect === true && false,
        canCheckout:overall.canCheckout === true && false,
        canPay:overall.canPay === true && false,
        canSubmitOrder:overall.canSubmitOrder === true && false,
        canStoreIdentity:overall.canStoreIdentity === true && false,
        reason:overall.reason || "provider_integration_not_ready"
      },
      gates:{
        globalCommerceStandard:gates.globalCommerceStandard || "required",
        localLawCompliance:gates.localLawCompliance || "not_verified",
        providerOnboarding:gates.providerOnboarding || "not_completed",
        providerApproval:gates.providerApproval || "not_reviewed",
        readOnlyConnectorStub:gates.readOnlyConnectorStub || "not_ready",
        providerStubProfile:gates.providerStubProfile || "profile_only_not_connected",
        secretStorage:gates.secretStorage || "not_configured",
        sandboxDryRun:gates.sandboxDryRun || "not_run",
        connectorGate:gates.connectorGate || "blocked",
        humanApproval:gates.humanApproval || "not_granted"
      },
      safety:{
        noRealEndpoint:safety.noRealEndpoint !== false,
        noRealApiKey:safety.noRealApiKey !== false,
        noNetworkSearch:safety.noNetworkSearch !== false,
        noRealResults:safety.noRealResults !== false,
        noRealPrice:safety.noRealPrice !== false,
        noFakeDemoMockPrice:safety.noFakeDemoMockPrice !== false,
        noRedirect:safety.noRedirect !== false,
        noCheckout:safety.noCheckout !== false,
        noPayment:safety.noPayment !== false,
        noOrderSubmit:safety.noOrderSubmit !== false,
        noIdentityStorage:safety.noIdentityStorage !== false,
        noRawGpsStorage:safety.noRawGpsStorage !== false,
        noBypassLocalLaw:safety.noBypassLocalLaw !== false
      }
    };
  }

  function onboardingFields(onboarding){
    const next = onboarding || {};
    const safety = next.safety || {};
    return {
      checklistVersion:next.checklistVersion || "2.0.40",
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

  function approvalFields(approval){
    const next = approval || {};
    const stages = next.approvalStages || {};
    const gates = next.gates || {};
    const safety = next.safety || {};
    return {
      workflowVersion:next.workflowVersion || "2.0.40",
      phase:next.phase || "provider_approval_workflow",
      approvalStatus:next.approvalStatus || "not_reviewed",
      canRequestApproval:next.canRequestApproval !== false,
      canStartConnectorStubDevelopment:next.canStartConnectorStubDevelopment === true,
      canConfigureApiKey:next.canConfigureApiKey === true,
      canConnectEndpoint:next.canConnectEndpoint === true,
      canEnableNetworkSearch:next.canEnableNetworkSearch === true,
      canDisplayPrice:next.canDisplayPrice === true,
      canRedirect:next.canRedirect === true,
      canCheckout:next.canCheckout === true,
      canPay:next.canPay === true,
      canSubmitOrder:next.canSubmitOrder === true,
      canStoreIdentity:next.canStoreIdentity === true,
      reason:next.reason || "provider_approval_required",
      approvalStages:{
        legalReviewRequired:stages.legalReviewRequired !== false,
        apiDocsReviewRequired:stages.apiDocsReviewRequired !== false,
        privacyReviewRequired:stages.privacyReviewRequired !== false,
        feeFieldReviewRequired:stages.feeFieldReviewRequired !== false,
        securityReviewRequired:stages.securityReviewRequired !== false,
        localLawReviewRequired:stages.localLawReviewRequired !== false,
        humanApprovalRequired:stages.humanApprovalRequired !== false
      },
      gates:{
        allowConnectorStubDevelopment:gates.allowConnectorStubDevelopment === true,
        allowApiKeyConfiguration:gates.allowApiKeyConfiguration === true,
        allowEndpointConnection:gates.allowEndpointConnection === true,
        allowNetworkSearch:gates.allowNetworkSearch === true,
        allowPriceDisplay:gates.allowPriceDisplay === true,
        allowRedirect:gates.allowRedirect === true,
        allowCheckout:gates.allowCheckout === true,
        allowPayment:gates.allowPayment === true,
        allowOrderSubmit:gates.allowOrderSubmit === true,
        allowIdentityStorage:gates.allowIdentityStorage === true
      },
      safety:{
        noRealEndpoint:safety.noRealEndpoint !== false,
        noApiKey:safety.noApiKey !== false,
        noNetworkSearch:safety.noNetworkSearch !== false,
        noPriceDisplay:safety.noPriceDisplay !== false,
        noRedirect:safety.noRedirect !== false,
        noCheckout:safety.noCheckout !== false,
        noPayment:safety.noPayment !== false,
        noOrderSubmit:safety.noOrderSubmit !== false,
        noIdentityStorage:safety.noIdentityStorage !== false,
        noLegalAdvice:safety.noLegalAdvice !== false,
        noBypassLocalLaw:safety.noBypassLocalLaw !== false
      }
    };
  }

  function connectorStubFields(stub){
    const next = stub || {};
    const capabilities = next.capabilities || {};
    const safety = next.safety || {};
    return {
      stubVersion:next.stubVersion || "2.0.41",
      phase:next.phase || "read_only_connector_stub_framework",
      defaultStatus:next.defaultStatus || "stub_not_ready",
      stubStatus:next.stubStatus || next.defaultStatus || "stub_not_ready",
      connectorMode:next.connectorMode || "read_only",
      allowedAfterApprovalStatus:next.allowedAfterApprovalStatus || "approved_for_stub",
      requiresProviderApproval:next.requiresProviderApproval !== false,
      requiresLocalLawCompliance:next.requiresLocalLawCompliance !== false,
      requiresOnboardingChecklist:next.requiresOnboardingChecklist !== false,
      requiresConfigGate:next.requiresConfigGate !== false,
      requiresAdapterGate:next.requiresAdapterGate !== false,
      requiresSandboxGate:next.requiresSandboxGate !== false,
      requiresConnectorGate:next.requiresConnectorGate !== false,
      canBuildStub:next.canBuildStub === true || capabilities.canBuildStub === true,
      canExecuteStub:next.canExecuteStub === true,
      canConfigureApiKey:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false,
      reason:next.reason || "provider_approval_required_before_stub",
      capabilities:{
        canBuildStub:next.canBuildStub === true || capabilities.canBuildStub === true,
        canConfigureApiKey:false,
        canConnectEndpoint:false,
        canUseNetwork:false,
        canReturnRealPrice:false,
        canReturnMockPrice:false,
        canRedirect:false,
        canCheckout:false,
        canPay:false,
        canSubmitOrder:false,
        canStoreIdentity:false
      },
      safety:{
        noRealEndpoint:safety.noRealEndpoint !== false,
        noApiKey:safety.noApiKey !== false,
        noNetworkSearch:safety.noNetworkSearch !== false,
        noRealPrice:safety.noRealPrice !== false,
        noFakeDemoMockPrice:safety.noFakeDemoMockPrice !== false,
        noRedirect:safety.noRedirect !== false,
        noCheckout:safety.noCheckout !== false,
        noPayment:safety.noPayment !== false,
        noOrderSubmit:safety.noOrderSubmit !== false,
        noIdentityStorage:safety.noIdentityStorage !== false,
        noRawGpsStorage:safety.noRawGpsStorage !== false
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

  function isProviderApprovalReady(approval){
    return !!(approval &&
      (approval.approvalStatus === "approved_for_stub" ||
      approval.canConnectEndpoint === true &&
      approval.canEnableNetworkSearch === true &&
      approval.canDisplayPrice === true &&
      approval.canRedirect === true));
  }

  function isReadOnlyConnectorStubExecutable(stub){
    return !!(stub && stub.connectorMode === "read_only" && stub.canExecuteStub === true && stub.canUseNetwork === true && stub.canReturnRealPrice === true && stub.canRedirect === true);
  }

  function isProviderSecretStorageReady(secret){
    return !!(secret &&
      secret.canInputApiKey === true &&
      secret.canSaveApiKey === true &&
      secret.canReadApiKey === true &&
      secret.canUseApiKeyForNetwork === true &&
      secret.canConnectEndpoint === true &&
      secret.canUseNetwork === true &&
      secret.canDisplayPrice === true &&
      secret.canRedirect === true);
  }

  function isProviderSandboxDryRunReady(dryRun){
    return !!(dryRun &&
      dryRun.dryRunStatus === "passed" &&
      dryRun.canRunDryRun === true &&
      dryRun.canUseRealEndpoint === true &&
      dryRun.canUseRealApiKey === true &&
      dryRun.canUseNetwork === true &&
      dryRun.canReturnRealResults === true &&
      dryRun.canReturnRealPrice === true &&
      dryRun.canRedirect === true);
  }

  function isCommerceConnectorGateReady(gate){
    return !!(gate &&
      gate.connectorGateStatus === "passed" &&
      gate.canOpenConnector === true &&
      gate.canConnectEndpoint === true &&
      gate.canUseApiKey === true &&
      gate.canUseNetwork === true &&
      gate.canReturnRealResults === true &&
      gate.canReturnRealPrice === true &&
      gate.canRedirect === true);
  }

  function isFixtureValidationProvider(config, settings){
    const cfg = settings || {};
    return !!(config &&
      config.providerReadinessStatus === "ready_for_fixture_validation" &&
      cfg.providerMode === "manualProvider" &&
      window.WeishanCommerceSearchProvider &&
      typeof window.WeishanCommerceSearchProvider.search === "function");
  }

  function isProductSearchRequest(request){
    return resultCategory(request && request.category) === "product";
  }

  function productProviderBlockedResult(request, providerHealth, providerConfig, connectorHealth, sandbox){
    const readiness = getProductProviderReadiness(providerConfig);
    const pool = getGlobalProviderPoolReadiness();
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    const approval = approvalFields(getProviderApprovalStatus(request && request.category, providerConfig && providerConfig.providerId));
    const stub = connectorStubFields(getReadOnlyConnectorStubStatus(request && request.category, providerConfig && providerConfig.providerId, approval));
    const profile = providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api"));
    const secret = providerSecretFields(providerConfig && providerConfig.providerSecretHealth || getProviderSecretStorageStatus(profile.providerId));
    const sandboxDryRun = providerSandboxDryRunFields(providerConfig && providerConfig.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile.providerId));
    const connectorGate = connectorGateFields(providerConfig && providerConfig.connectorGateHealth || getCommerceConnectorGateStatus(profile.providerId));
    const integrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(profile.providerId, { connectorGateHealth:connectorGate }));
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
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSecretHealth:secret,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
      productProviderReadiness:readiness,
      globalProviderPoolReadiness:pool,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function providerApprovalRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth){
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    const approval = approvalFields(approvalHealth || getProviderApprovalStatus(request && request.category, providerConfig && providerConfig.providerId));
    const stub = connectorStubFields(getReadOnlyConnectorStubStatus(request && request.category, providerConfig && providerConfig.providerId, approval));
    const profile = resultCategory(request && request.category) === "product" ? providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api")) : undefined;
    const secret = providerSecretFields(providerConfig && providerConfig.providerSecretHealth || getProviderSecretStorageStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const sandboxDryRun = providerSandboxDryRunFields(providerConfig && providerConfig.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const connectorGate = connectorGateFields(providerConfig && providerConfig.connectorGateHealth || getCommerceConnectorGateStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const integrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(profile && profile.providerId || providerConfig && providerConfig.providerId, { connectorGateHealth:connectorGate }));
    return {
      ok:false,
      code:"COMMERCE_PROVIDER_APPROVAL_REQUIRED",
      message:"provider_approval_required",
      reason:"provider_approval_required",
      request,
      searchStatus:"no_provider",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth:onboarding,
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSecretHealth:secret,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function readOnlyConnectorStubRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth, stubHealth){
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    const approval = approvalFields(approvalHealth || getProviderApprovalStatus(request && request.category, providerConfig && providerConfig.providerId));
    const stub = connectorStubFields(stubHealth || getReadOnlyConnectorStubStatus(request && request.category, providerConfig && providerConfig.providerId, approval));
    const profile = resultCategory(request && request.category) === "product" ? providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api")) : undefined;
    const secret = providerSecretFields(providerConfig && providerConfig.providerSecretHealth || getProviderSecretStorageStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const sandboxDryRun = providerSandboxDryRunFields(providerConfig && providerConfig.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const connectorGate = connectorGateFields(providerConfig && providerConfig.connectorGateHealth || getCommerceConnectorGateStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const integrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(profile && profile.providerId || providerConfig && providerConfig.providerId, { connectorGateHealth:connectorGate }));
    return {
      ok:false,
      code:"COMMERCE_READ_ONLY_CONNECTOR_STUB_REQUIRED",
      message:"read_only_connector_stub_not_ready",
      reason:stub.reason || "provider_approval_required_before_stub",
      request,
      searchStatus:"no_provider",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth:onboarding,
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSecretHealth:secret,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function providerSecretStorageRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth, stubHealth, secretHealth){
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    const approval = approvalFields(approvalHealth || getProviderApprovalStatus(request && request.category, providerConfig && providerConfig.providerId));
    const stub = connectorStubFields(stubHealth || getReadOnlyConnectorStubStatus(request && request.category, providerConfig && providerConfig.providerId, approval));
    const profile = resultCategory(request && request.category) === "product" ? providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api")) : undefined;
    const secret = providerSecretFields(secretHealth || getProviderSecretStorageStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const sandboxDryRun = providerSandboxDryRunFields(providerConfig && providerConfig.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const connectorGate = connectorGateFields(providerConfig && providerConfig.connectorGateHealth || getCommerceConnectorGateStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const integrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(profile && profile.providerId || providerConfig && providerConfig.providerId, { connectorGateHealth:connectorGate }));
    return {
      ok:false,
      code:"COMMERCE_PROVIDER_SECRET_STORAGE_REQUIRED",
      message:"provider_secret_storage_not_approved",
      reason:secret.reason || "provider_secret_storage_not_approved",
      request,
      searchStatus:"no_provider",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth:onboarding,
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSecretHealth:secret,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function providerSandboxDryRunRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth, stubHealth, secretHealth, dryRunHealth){
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    const approval = approvalFields(approvalHealth || getProviderApprovalStatus(request && request.category, providerConfig && providerConfig.providerId));
    const stub = connectorStubFields(stubHealth || getReadOnlyConnectorStubStatus(request && request.category, providerConfig && providerConfig.providerId, approval));
    const profile = resultCategory(request && request.category) === "product" ? providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api")) : undefined;
    const secret = providerSecretFields(secretHealth || getProviderSecretStorageStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const sandboxDryRun = providerSandboxDryRunFields(dryRunHealth || providerConfig && providerConfig.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const connectorGate = connectorGateFields(providerConfig && providerConfig.connectorGateHealth || getCommerceConnectorGateStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const integrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(profile && profile.providerId || providerConfig && providerConfig.providerId, { connectorGateHealth:connectorGate }));
    return {
      ok:false,
      code:"COMMERCE_PROVIDER_SANDBOX_DRY_RUN_REQUIRED",
      message:"provider_sandbox_dry_run_required",
      reason:sandboxDryRun.reason || "provider_sandbox_dry_run_required",
      request,
      searchStatus:"no_provider",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth:onboarding,
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSecretHealth:secret,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function connectorGateRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth, stubHealth, secretHealth, dryRunHealth, gateHealth){
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    const approval = approvalFields(approvalHealth || getProviderApprovalStatus(request && request.category, providerConfig && providerConfig.providerId));
    const stub = connectorStubFields(stubHealth || getReadOnlyConnectorStubStatus(request && request.category, providerConfig && providerConfig.providerId, approval));
    const profile = resultCategory(request && request.category) === "product" ? providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api")) : undefined;
    const secret = providerSecretFields(secretHealth || getProviderSecretStorageStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const sandboxDryRun = providerSandboxDryRunFields(dryRunHealth || providerConfig && providerConfig.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const connectorGate = connectorGateFields(gateHealth || providerConfig && providerConfig.connectorGateHealth || getCommerceConnectorGateStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const integrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(profile && profile.providerId || providerConfig && providerConfig.providerId, { connectorGateHealth:connectorGate }));
    return {
      ok:false,
      code:"COMMERCE_CONNECTOR_GATE_REQUIRED",
      message:"connector_gate_required",
      reason:connectorGate.reason || "connector_gate_required",
      request,
      searchStatus:"connector_gate_required",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth:onboarding,
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSecretHealth:secret,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function localLawComplianceRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, complianceHealth){
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    const approval = approvalFields(getProviderApprovalStatus(request && request.category, providerConfig && providerConfig.providerId));
    const stub = connectorStubFields(getReadOnlyConnectorStubStatus(request && request.category, providerConfig && providerConfig.providerId, approval));
    const health = complianceHealth || evaluateLocalLawCompliance(request, { locationHealth:locationHealth() });
    const profile = resultCategory(request && request.category) === "product" ? providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api")) : undefined;
    const secret = providerSecretFields(providerConfig && providerConfig.providerSecretHealth || getProviderSecretStorageStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const sandboxDryRun = providerSandboxDryRunFields(providerConfig && providerConfig.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const connectorGate = connectorGateFields(providerConfig && providerConfig.connectorGateHealth || getCommerceConnectorGateStatus(profile && profile.providerId || providerConfig && providerConfig.providerId));
    const integrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(profile && profile.providerId || providerConfig && providerConfig.providerId, { connectorGateHealth:connectorGate }));
    return {
      ok:false,
      code:"COMMERCE_LOCAL_LAW_COMPLIANCE_REQUIRED",
      message:explainLocalLawBlockReason(health),
      reason:"local_law_compliance_not_verified",
      request,
      searchStatus:"local_law_compliance_required",
      providerHealth:providerHealth.providerHealth,
      configHealth:configFields(providerConfig),
      connectorHealth,
      onboardingHealth:onboarding,
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSecretHealth:secret,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
      locationHealth:locationHealth(),
      complianceHealth:health,
      canShowPrice:false,
      canShowBookingButton:false,
      canShowCheckoutButton:false,
      candidates:[]
    };
  }

  function shippingDestinationRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox){
    const health = locationHealth();
    const onboarding = onboardingFields(getProviderOnboardingStatus(request && request.category));
    const approval = approvalFields(getProviderApprovalStatus(request && request.category, providerConfig && providerConfig.providerId));
    const stub = connectorStubFields(getReadOnlyConnectorStubStatus(request && request.category, providerConfig && providerConfig.providerId, approval));
    const profile = providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api"));
    const secret = providerSecretFields(providerConfig && providerConfig.providerSecretHealth || getProviderSecretStorageStatus(profile.providerId));
    const sandboxDryRun = providerSandboxDryRunFields(providerConfig && providerConfig.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile.providerId));
    const connectorGate = connectorGateFields(providerConfig && providerConfig.connectorGateHealth || getCommerceConnectorGateStatus(profile.providerId));
    const integrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(profile.providerId, { connectorGateHealth:connectorGate }));
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
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSecretHealth:secret,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
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
    const approval = approvalFields(getProviderApprovalStatus(next, config.providerId));
    const stub = connectorStubFields(getReadOnlyConnectorStubStatus(next, config.providerId, approval));
    const profile = isProduct ? providerStubProfileFields(config.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api")) : undefined;
    const configReady = isProviderConfigReady(config);
    const connectorReady = isProviderConnectorReady(connector);
    const sandbox = sandboxFields(next, settings, config, connector);
    const sandboxDryRun = providerSandboxDryRunFields(config.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(profile && profile.providerId || config.providerId || next + "-provider-disabled"));
    const connectorGate = connectorGateFields(config.connectorGateHealth || getCommerceConnectorGateStatus(profile && profile.providerId || config.providerId || next + "-provider-disabled"));
    const integrationReadiness = providerIntegrationReadinessFields(config.providerIntegrationReadiness || getProviderIntegrationReadiness(profile && profile.providerId || config.providerId || next + "-provider-disabled", { connectorGateHealth:connectorGate }));
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
        approvalStatus:approval.approvalStatus,
        providerApprovalRequired:true,
        canRequestApproval:approval.canRequestApproval,
        canStartConnectorStubDevelopment:approval.canStartConnectorStubDevelopment,
        canConfigureApiKey:approval.canConfigureApiKey,
        canEnableNetworkSearch:approval.canEnableNetworkSearch,
        canRedirect:approval.canRedirect,
        approvalHealth:approval,
        connectorStubStatus:stub.stubStatus,
        connectorStubMode:stub.connectorMode,
        canBuildReadOnlyConnectorStub:stub.canBuildStub,
        canExecuteReadOnlyConnectorStub:stub.canExecuteStub,
        connectorStubHealth:stub,
        providerStubProfileHealth:profile,
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
        connectorStubHealth:stub,
        providerStubProfileHealth:profile,
        providerSandboxDryRunHealth:sandboxDryRun,
        connectorGateHealth:connectorGate,
        providerIntegrationReadiness:integrationReadiness,
        providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
        providerIntegrationSummaryMode:integrationReadiness.summaryMode,
        canProceedToProviderIntegration:false,
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
      approvalHealth:approval,
      connectorStubHealth:stub,
      providerStubProfileHealth:profile,
      providerSandboxDryRunHealth:sandboxDryRun,
      connectorGateHealth:connectorGate,
      providerIntegrationReadiness:integrationReadiness,
      providerIntegrationReadinessStatus:integrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:integrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      sandboxHealth:sandbox,
      dryRunHealth:sandboxDryRun,
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
    const commerceLocalIntentRoute = task && task.commerceLocalIntentRoute || getCommerceLocalIntentRoute(task && task.inputSummary || "");
    return {
      taskId:String(task && task.taskId || ""),
      category,
      query:sanitizeText(task && task.inputSummary || "", 240),
      commerceLocalIntentRoute,
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

  function toLegacyReadOnlyCandidate(item){
    const safe = item && typeof item === "object" ? item : {};
    return {
      candidateId:sanitizeText(safe.id || safe.platformName || safe.title || "readonly_candidate", 80),
      title:sanitizeText(safe.title || "只读候选结果", 120),
      provider:sanitizeText(safe.platformName || safe.sourceName || "只读来源", 80),
      sourceName:sanitizeText(safe.sourceName || safe.platformName || "只读来源", 80),
      url:sanitizeText(safe.targetUrl || safe.officialUrl || "", 240),
      bookingUrl:null,
      urlType:"external_search",
      price:Number.isFinite(Number(safe.price)) ? Number(safe.price) : null,
      totalPrice:Number.isFinite(Number(safe.price)) ? Number(safe.price) : null,
      currency:sanitizeText(safe.currency || "", 12),
      priceLabel:sanitizeText(safe.priceLabel || "价格以平台页面为准", 120),
      recommendationReason:sanitizeText(safe.recommendationReason || "按平台可信度、搜索相关性和只读边界进行推荐", 180),
      conditions:sanitizeText(safe.feeNote || "", 180),
      riskSummary:sanitizeText(safe.riskNote || "", 180),
      hiddenFeeNote:sanitizeText(safe.feeNote || "", 180),
      extras:[
        safe.isOfficial ? "官网/官方入口" : "",
        safe.trustLevel === "high" ? "高可信度" : (safe.trustLevel === "medium" ? "中等可信度" : "需要复核"),
        safe.realDataValidation && safe.realDataValidation.validationStatus ? "验证：" + safe.realDataValidation.validationStatus : ""
      ].filter(Boolean),
      realExecution:false
    };
  }

  function buildRealProviderReadonlyStatus(input){
    const safe = input && typeof input === "object" ? input : {};
    const providerStatus = sanitizeText(safe.providerStatus || "", 40);
    const mode = sanitizeText(safe.executionMode || safe.mode || "", 40);
    const readinessLevel = sanitizeText(safe.readinessLevel || "", 40);
    let label = "未知";
    let stageLabel = "状态未知";
    let userMessage = sanitizeText(safe.userMessage || "", 160);
    if (providerStatus === "NOT_APPROVED") {
      label = "暂不可用";
      stageLabel = "等待 Provider 批准";
      userMessage = "实时商品数据暂不可用。";
    } else if (mode === "real_provider_readonly") {
      label = "已连接";
      stageLabel = "测试环境";
      userMessage = userMessage || "Rakuten 实时查询已连接，当前通过主进程只读代理返回官方 API 结果。";
    } else if (mode === "external_link_only" && safe.connected === true) {
      label = "暂时不可用";
      stageLabel = "生产准备中";
      userMessage = userMessage || "Rakuten 实时查询暂时不可用，已安全降级到只读候选入口。";
    } else if (mode === "external_link_only") {
      label = "未连接";
      stageLabel = "测试环境";
      userMessage = userMessage || "Rakuten 实时查询尚未连接，当前仅展示只读候选入口。";
    } else if (mode === "sandbox") {
      label = "暂时不可用";
      stageLabel = "测试环境";
      userMessage = userMessage || "Rakuten 实时查询当前处于只读降级模式。";
    } else if (mode === "blocked" || readinessLevel === "blocked") {
      label = "配置无效";
      stageLabel = "状态未知";
      userMessage = userMessage || "Rakuten 实时查询配置未通过安全校验。";
    }
    return {
      providerId:"rakuten_japan",
      providerStatus:providerStatus || "UNAVAILABLE",
      connected:safe.connected === true,
      executionMode:mode || "external_link_only",
      readinessLevel:readinessLevel || "unknown",
      label:label,
      stageLabel:stageLabel,
      adapterVersion:sanitizeText(safe.adapterVersion || "4.2.8-rakuten-main-readonly", 80),
      userMessage:userMessage,
      redacted:true
    };
  }

  function buildReadOnlyPresentation(request, candidates){
    const presenter = readOnlySearchPresenterApi();
    const candidateList = Array.isArray(candidates) ? candidates : [];
    if (!presenter || typeof presenter.buildGlobalShoppingReadOnlySearchResultPresentation !== "function") {
      return {
        topResults:candidateList.slice(0, 3),
        remainingResults:candidateList.slice(3),
        candidateCount:candidateList.length,
        recommendation:null,
        decisionResult:null
      };
    }
    return presenter.buildGlobalShoppingReadOnlySearchResultPresentation({
      category:"product",
      inputSummary:request.query,
      candidates:candidateList
    });
  }

  function buildReadOnlySearchSuccess(request, providerName, candidates, status, options) {
    const settings = options && typeof options === "object" ? options : {};
    const basePresentation = buildReadOnlyPresentation(request, candidates);
    const presentation = settings.singleEvidenceOnly === true ? Object.assign({}, basePresentation, {
      rankingSummary:"当前只展示一条通过价格真实性校验的证据；费用条件不完整，不能据此判断最低价。",
      recommendation:null,
      decisionResult:null,
      comparisonMatrix:null
    }) : basePresentation;
    const topResults = Array.isArray(presentation.topResults) ? presentation.topResults : [];
    const remainingResults = Array.isArray(presentation.remainingResults) ? presentation.remainingResults : [];
    const decisionResult = presentation.decisionResult || null;
    const topLegacy = topResults.map(toLegacyReadOnlyCandidate);
    const recommendation = settings.singleEvidenceOnly === true ? {
      title:"当前价格证据",
      reason:"仅发现一条当前有效的公开只读价格；配送、税费与其他条件未知，不能判定为最低价或完整到手价。",
      riskSummary:"请在零售商页面核验最终价格、库存与适用条件。",
      targetUrl:""
    } : presentation.recommendation || createRecommendationFromCandidates(topLegacy);
    const first = topResults[0] || {};
    return {
      ok:topResults.length > 0,
      code:topResults.length > 0 ? "" : "COMMERCE_NO_RESULTS",
      message:topResults.length > 0 ? "" : sanitizeText(settings.noResultsMessage || "暂无可展示的只读候选结果。", 180),
      providerName:providerName,
      request:request,
      searchStatus:topResults.length > 0 ? "completed" : "no_results",
      canShowPrice:topResults.some((item) => Number.isFinite(Number(item.price))),
      canShowBookingButton:topResults.some((item) => !!String(item.targetUrl || "")),
      canShowCheckoutButton:false,
      candidates:topLegacy,
      recommendation:recommendation,
      readOnlySearchTopResults:topResults,
      readOnlySearchRemainingResults:remainingResults,
      readOnlySearchResultSummary:presentation,
      decisionResult:decisionResult,
      orchestration:presentation.orchestration || null,
      intentClassification:presentation.intentClassification || null,
      entityExtraction:presentation.entityExtraction || null,
      workflowState:presentation.workflowState || null,
      comparisonMatrix:presentation.comparisonMatrix || null,
      realProviderReadonlyStatus:status,
      searchResultSummary:{
        candidateCount:topResults.length,
        source:sanitizeText(settings.source || "rakuten_main_process_readonly", 80),
        mode:status.executionMode || "external_link_only",
        lowestPrice:first.price || "",
        currency:first.currency || ""
      }
    };
  }

  async function searchPrijsProfeetReadonlyProductCandidates(request){
    const bridge = window.weishanGlobalShopping;
    const adapter = prijsProfeetReadonlyAdapterApi();
    if (!bridge || typeof bridge.merchantNativeReadonlySearch !== "function" || !adapter || typeof adapter.normalizeResult !== "function") return null;
    const taskKey = sanitizeText(request.taskId || request.query || "product", 120);
    const nextGeneration = Number(prijsProfeetSearchGenerations.get(taskKey) || 0) + 1;
    prijsProfeetSearchGenerations.set(taskKey, nextGeneration);
    const requestId = taskKey + ":" + String(nextGeneration);
    let raw;
    try {
      raw = await bridge.merchantNativeReadonlySearch(PRIJS_PROFEET_SOURCE_ID, { query:request.query, requestId, limit:1 });
    } catch (_) {
      raw = { ok:false, code:"SOURCE_UNAVAILABLE", requestId, results:[] };
    }
    if (Number(prijsProfeetSearchGenerations.get(taskKey) || 0) !== nextGeneration || sanitizeText(raw && raw.requestId || "", 120) !== requestId) {
      return {
        ok:false,
        code:"COMMERCE_STALE_RESULT_IGNORED",
        message:"较早的价格查询结果已忽略。",
        providerName:"PrijsProfeet",
        request,
        candidates:[]
      };
    }
    const normalized = adapter.normalizeResult(raw, { evaluatedAt:nowIso() });
    const normalizedStatus = normalized && normalized.status
      ? Object.assign({}, normalized.status, { requestCount:Number(normalized.requestCount || 0) })
      : adapter.status({ ok:false });
    if (!normalized || normalized.ok !== true) {
      return {
        ok:false,
        code:"COMMERCE_PROVIDER_UNAVAILABLE",
        message:"PrijsProfeet 当前价格查询暂时不可用，请稍后重试。",
        providerName:"PrijsProfeet",
        request,
        candidates:[],
        canShowPrice:false,
        canShowBookingButton:false,
        canShowCheckoutButton:false,
        realProviderReadonlyStatus:normalizedStatus
      };
    }
    if (!normalized.candidates.length) {
      return {
        ok:false,
        code:"COMMERCE_NO_RESULTS",
        message:"没有找到当前有效、身份与币种完整且带官方零售商链接的价格。",
        providerName:"PrijsProfeet",
        request,
        candidates:[],
        canShowPrice:false,
        canShowBookingButton:false,
        canShowCheckoutButton:false,
        realProviderReadonlyStatus:normalizedStatus
      };
    }
    return buildReadOnlySearchSuccess(request, "PrijsProfeet", normalized.candidates, normalizedStatus, {
      source:"prijsprofeet_main_process_public_readonly",
      singleEvidenceOnly:true,
      noResultsMessage:"没有找到当前有效、身份与币种完整且带官方零售商链接的价格。"
    });
  }

  function isArgentinaDestination(locationState){
    const health = locationState && typeof locationState === "object" ? locationState : {};
    const destination = health.shippingDestination && typeof health.shippingDestination === "object" ? health.shippingDestination : {};
    return /^(?:AR|ARG|Argentina|阿根廷)$/i.test(String(destination.country || "").trim());
  }

  async function searchTiendaCentroReadonlyProductCandidates(request){
    const bridge = window.weishanGlobalShopping;
    const adapter = tiendaCentroReadonlyAdapterApi();
    if (!bridge || typeof bridge.merchantNativeReadonlySearch !== "function" || !adapter || typeof adapter.normalizeResult !== "function") return null;
    const taskKey = sanitizeText(request.taskId || request.query || "product", 120);
    const nextGeneration = Number(tiendaCentroSearchGenerations.get(taskKey) || 0) + 1;
    tiendaCentroSearchGenerations.set(taskKey, nextGeneration);
    const requestId = taskKey + ":" + String(nextGeneration);
    let raw;
    try {
      raw = await bridge.merchantNativeReadonlySearch(TIENDA_CENTRO_SOURCE_ID, { query:request.query, requestId, limit:1 });
    } catch (_) {
      raw = { ok:false, code:"SOURCE_UNAVAILABLE", requestId, results:[] };
    }
    if (Number(tiendaCentroSearchGenerations.get(taskKey) || 0) !== nextGeneration || sanitizeText(raw && raw.requestId || "", 120) !== requestId) {
      return {
        ok:false,
        code:"COMMERCE_STALE_RESULT_IGNORED",
        message:"较早的价格查询结果已忽略。",
        providerName:"Tienda Centro",
        request,
        candidates:[]
      };
    }
    const normalized = adapter.normalizeResult(raw, { evaluatedAt:nowIso() });
    const normalizedStatus = normalized && normalized.status
      ? Object.assign({}, normalized.status, { requestCount:Number(normalized.requestCount || 0) })
      : adapter.status({ ok:false });
    if (!normalized || normalized.ok !== true) {
      return {
        ok:false,
        code:"COMMERCE_PROVIDER_UNAVAILABLE",
        message:"Tienda Centro 当前价格查询暂时不可用，请稍后重试。",
        providerName:"Tienda Centro",
        request,
        candidates:[],
        canShowPrice:false,
        canShowBookingButton:false,
        canShowCheckoutButton:false,
        realProviderReadonlyStatus:normalizedStatus
      };
    }
    if (!normalized.candidates.length) {
      return {
        ok:false,
        code:"COMMERCE_NO_RESULTS",
        message:"没有找到与所查询型号和规格精确匹配、且带商户商品页的当前价格。",
        providerName:"Tienda Centro",
        request,
        candidates:[],
        canShowPrice:false,
        canShowBookingButton:false,
        canShowCheckoutButton:false,
        realProviderReadonlyStatus:normalizedStatus
      };
    }
    return buildReadOnlySearchSuccess(request, "Tienda Centro", normalized.candidates, normalizedStatus, {
      source:"tienda_centro_main_process_public_readonly",
      singleEvidenceOnly:true,
      noResultsMessage:"没有找到与所查询型号和规格精确匹配、且带商户商品页的当前价格。"
    });
  }

  function buildReadOnlyFallbackSearchResult(request, status){
    const factory = platformCandidateFactoryApi();
    const candidates = factory && typeof factory.buildGlobalShoppingPlatformCandidates === "function"
      ? factory.buildGlobalShoppingPlatformCandidates({
        category:"product",
        inputSummary:request.query,
        normalizedFields:{
          keyword:request.query,
          destinationCountry:request.destination || request.destinationCountry || "",
          currency:request.currency
        }
      })
      : [];
    const fallbackStatus = Object.assign({}, status, {
      executionMode:status.executionMode || "external_link_only",
      userMessage:status.userMessage || "Rakuten 实时查询当前不可用，已降级为官方入口与平台候选。"
    });
    return buildReadOnlySearchSuccess(request, "Rakuten", candidates, fallbackStatus);
  }

  async function searchRakutenReadonlyProductCandidates(request){
    const unavailableStatus = buildRealProviderReadonlyStatus({
      providerStatus:"NOT_APPROVED",
      executionMode:"external_link_only"
    });
    return buildReadOnlyFallbackSearchResult(request, unavailableStatus);

    /* Provider commercial approval is required before this dormant integration path can run. */
    const gateApi = realProviderExecutionGateApi();
    const gateway = providerGatewayApi();
    if (!gateApi || typeof gateApi.buildGlobalShoppingRealProviderExecutionGate !== "function" || !gateway || typeof gateway.buildGlobalShoppingProviderGatewayResultAsync !== "function") {
      return null;
    }
    const gate = await gateApi.buildGlobalShoppingRealProviderExecutionGate({
      providerId:"rakuten_japan",
      category:"product",
      region:request.destination || request.destinationCountry || "JP",
      destinationCountry:request.destination || request.destinationCountry || "JP",
      explicitUserAction:true,
      userEnabled:true,
      endpointHost:"openapi.rakuten.co.jp"
    });
    const status = buildRealProviderReadonlyStatus({
      connected:gate.connected,
      executionMode:gate.mode,
      readinessLevel:gate.productionReadiness && gate.productionReadiness.readinessLevel || gate.status && gate.status.readinessLevel || "",
      userMessage:gate.blockers && gate.blockers.length ? "Rakuten 实时查询未满足只读执行条件，已安全降级。" : ""
    });
    if (gate.mode !== "real_provider_readonly") {
      return buildReadOnlyFallbackSearchResult(request, status);
    }
    const gatewayResult = await gateway.buildGlobalShoppingProviderGatewayResultAsync({
      providerId:"rakuten_japan",
      operation:"searchProducts",
      executionMode:"real_provider_readonly",
      category:"product",
      payload:{
        keyword:request.query,
        query:request.query,
        page:1,
        hits:3,
        sort:"standard",
        destinationCountry:request.destination || request.destinationCountry || "JP",
        currency:"JPY",
        category:"product"
      },
      regionContext:{ country:request.destination || request.destinationCountry || "JP" }
    });
    if (gatewayResult && gatewayResult.status === "real_provider_readonly") {
      const normalizedResults = gatewayResult.result && Array.isArray(gatewayResult.result.normalizedResults)
        ? gatewayResult.result.normalizedResults
        : [];
      const readyStatus = Object.assign({}, status, {
        executionMode:"real_provider_readonly",
        label:"已连接",
        stageLabel:"测试环境",
        userMessage:"Rakuten 实时查询已连接，当前显示官方 API 只读结果。"
      });
      return buildReadOnlySearchSuccess(request, "Rakuten", normalizedResults, readyStatus);
    }
    return buildReadOnlyFallbackSearchResult(request, Object.assign({}, status, {
      label:"暂时不可用",
      userMessage:"Rakuten 实时查询暂时不可用，已回退到只读候选入口。"
    }));
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
    const approvalHealth = approvalFields(getProviderApprovalStatus(request.category, providerConfig && providerConfig.providerId));
    const connectorStubHealth = connectorStubFields(getReadOnlyConnectorStubStatus(request.category, providerConfig && providerConfig.providerId, approvalHealth));
    const providerStubProfileHealth = resultCategory(request.category) === "product" ? providerStubProfileFields(providerConfig && providerConfig.providerStubProfileHealth || providerHealth && providerHealth.providerStubProfileHealth || getProviderStubProfileStatus("ebay_browse_api")) : undefined;
    const providerSecretHealth = providerSecretFields(providerConfig && providerConfig.providerSecretHealth || providerHealth && providerHealth.providerSecretHealth || getProviderSecretStorageStatus(providerStubProfileHealth && providerStubProfileHealth.providerId || providerConfig && providerConfig.providerId));
    const providerSandboxDryRunHealth = providerSandboxDryRunFields(providerConfig && providerConfig.providerSandboxDryRunHealth || providerHealth && providerHealth.providerSandboxDryRunHealth || getProviderSandboxDryRunStatus(providerStubProfileHealth && providerStubProfileHealth.providerId || providerConfig && providerConfig.providerId));
    const connectorGateHealth = connectorGateFields(providerConfig && providerConfig.connectorGateHealth || providerHealth && providerHealth.connectorGateHealth || getCommerceConnectorGateStatus(providerStubProfileHealth && providerStubProfileHealth.providerId || providerConfig && providerConfig.providerId));
    const providerIntegrationReadiness = providerIntegrationReadinessFields(providerConfig && providerConfig.providerIntegrationReadiness || providerHealth && providerHealth.providerIntegrationReadiness || getProviderIntegrationReadiness(providerStubProfileHealth && providerStubProfileHealth.providerId || providerConfig && providerConfig.providerId, { connectorGateHealth }));
    const providerIntegrationRunbook = providerConfig && providerConfig.providerIntegrationRunbook || providerHealth && providerHealth.providerIntegrationRunbook || getProviderIntegrationRunbook(providerStubProfileHealth && providerStubProfileHealth.providerId || providerConfig && providerConfig.providerId, { providerIntegrationReadiness, connectorGateHealth });
    const sandbox = getCommerceProviderSandbox(request.category, settings);
    const currentLocationHealth = locationHealth();
    const tiendaCentroDestination = isProductSearchRequest(request) && isArgentinaDestination(currentLocationHealth);
    const prijsProfeetReadonlyReady = isProductSearchRequest(request)
      && !!(window.weishanGlobalShopping
        && typeof window.weishanGlobalShopping.merchantNativeReadonlySearch === "function"
        && prijsProfeetReadonlyAdapterApi()
        && typeof prijsProfeetReadonlyAdapterApi().normalizeResult === "function");
    const tiendaCentroReadonlyReady = isProductSearchRequest(request)
      && !!(window.weishanGlobalShopping
        && typeof window.weishanGlobalShopping.merchantNativeReadonlySearch === "function"
        && tiendaCentroReadonlyAdapterApi()
        && typeof tiendaCentroReadonlyAdapterApi().normalizeResult === "function");
    const approvedReadonlySourcePolicy = tiendaCentroDestination
      ? (tiendaCentroReadonlyReady ? "tienda_centro_public_api" : "")
      : (prijsProfeetReadonlyReady ? "prijsprofeet_public_api" : "");
    const complianceHealth = !isAiModelPricingTask(request) ? evaluateLocalLawCompliance(request, {
      locationHealth:currentLocationHealth,
      approvedReadonlySourcePolicy
    }) : null;
    if (complianceHealth && complianceHealth.canSearchProvider !== true) {
      return localLawComplianceRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, complianceHealth);
    }
    if (isProductSearchRequest(request) && currentLocationHealth.hasShippingDestination !== true) {
      return shippingDestinationRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox);
    }
    if (isProductSearchRequest(request) && !(request.missingFields && request.missingFields.length)) {
      const readonlyResult = (tiendaCentroDestination
        ? await searchTiendaCentroReadonlyProductCandidates(request)
        : await searchPrijsProfeetReadonlyProductCandidates(request))
        || await searchRakutenReadonlyProductCandidates(request);
      if (readonlyResult) {
        return Object.assign({
          providerHealth:providerHealth.providerHealth,
          configHealth:configFields(providerConfig),
          connectorHealth,
          onboardingHealth,
          approvalHealth,
          connectorStubHealth,
          providerStubProfileHealth,
          providerSecretHealth,
          providerSandboxDryRunHealth,
          connectorGateHealth,
          providerIntegrationReadiness,
          providerIntegrationReadinessStatus:providerIntegrationReadiness.readinessStatus,
          providerIntegrationSummaryMode:providerIntegrationReadiness.summaryMode,
          canProceedToProviderIntegration:false,
          providerIntegrationRunbook,
          providerIntegrationRunbookStatus:providerIntegrationRunbook.runbookStatus || "manual_approval_required",
          providerIntegrationRunbookMode:providerIntegrationRunbook.runbookMode || "pre_real_provider_connection",
          canApproveProviderIntegration:false,
          canProceedAfterManualApproval:false,
          sandboxHealth:sandbox,
          dryRunHealth:providerSandboxDryRunHealth
        }, readonlyResult);
      }
    }
    if (isProductSearchRequest(request) && !getProductProviderReadiness(providerConfig).ready) {
      return productProviderBlockedResult(request, providerHealth, providerConfig, connectorHealth, sandbox);
    }
    if (!isAiModelPricingTask(request) && !isProviderApprovalReady(approvalHealth)) {
      return providerApprovalRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth);
    }
    if (!isAiModelPricingTask(request) && !isFixtureValidationProvider(providerConfig, settings) && !isReadOnlyConnectorStubExecutable(connectorStubHealth)) {
      return readOnlyConnectorStubRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth, connectorStubHealth);
    }
    if (!isAiModelPricingTask(request) && !isFixtureValidationProvider(providerConfig, settings) && !isProviderSecretStorageReady(providerSecretHealth)) {
      return providerSecretStorageRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth, connectorStubHealth, providerSecretHealth);
    }
    if (!isAiModelPricingTask(request) && !isFixtureValidationProvider(providerConfig, settings) && !isProviderSandboxDryRunReady(providerSandboxDryRunHealth)) {
      return providerSandboxDryRunRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth, connectorStubHealth, providerSecretHealth, providerSandboxDryRunHealth);
    }
    if (!isAiModelPricingTask(request) && !isFixtureValidationProvider(providerConfig, settings) && !isCommerceConnectorGateReady(connectorGateHealth)) {
      return connectorGateRequiredResult(request, providerHealth, providerConfig, connectorHealth, sandbox, approvalHealth, connectorStubHealth, providerSecretHealth, providerSandboxDryRunHealth, connectorGateHealth);
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
          approvalHealth:approvalFields(getProviderApprovalStatus("aiModelPricing", aiConfig && aiConfig.providerId)),
          connectorStubHealth:connectorStubFields(getReadOnlyConnectorStubStatus("aiModelPricing", aiConfig && aiConfig.providerId, getProviderApprovalStatus("aiModelPricing", aiConfig && aiConfig.providerId))),
          providerSecretHealth:providerSecretFields(getProviderSecretStorageStatus(aiConfig && aiConfig.providerId || "aiModelPricing-provider-disabled")),
          providerSandboxDryRunHealth:providerSandboxDryRunFields(getProviderSandboxDryRunStatus(aiConfig && aiConfig.providerId || "aiModelPricing-provider-disabled")),
          connectorGateHealth:connectorGateFields(getCommerceConnectorGateStatus(aiConfig && aiConfig.providerId || "aiModelPricing-provider-disabled")),
          providerIntegrationReadiness:providerIntegrationReadinessFields(aiConfig && aiConfig.providerIntegrationReadiness || getProviderIntegrationReadiness(aiConfig && aiConfig.providerId || "aiModelPricing-provider-disabled")),
          providerIntegrationReadinessStatus:"not_ready",
          providerIntegrationSummaryMode:"pre_connection_readiness",
          canProceedToProviderIntegration:false,
          providerIntegrationRunbook:getProviderIntegrationRunbook(aiConfig && aiConfig.providerId || "aiModelPricing-provider-disabled"),
          providerIntegrationRunbookStatus:"manual_approval_required",
          providerIntegrationRunbookMode:"pre_real_provider_connection",
          canApproveProviderIntegration:false,
          canProceedAfterManualApproval:false,
          sandboxHealth:aiSandbox,
          dryRunHealth:providerSandboxDryRunFields(getProviderSandboxDryRunStatus(aiConfig && aiConfig.providerId || "aiModelPricing-provider-disabled")),
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
        approvalHealth,
        connectorStubHealth,
        providerStubProfileHealth,
        providerSecretHealth,
        providerSandboxDryRunHealth,
        connectorGateHealth,
        providerIntegrationReadiness,
        providerIntegrationReadinessStatus:providerIntegrationReadiness.readinessStatus,
        providerIntegrationSummaryMode:providerIntegrationReadiness.summaryMode,
        canProceedToProviderIntegration:false,
        providerIntegrationRunbook,
        providerIntegrationRunbookStatus:providerIntegrationRunbook.runbookStatus || "manual_approval_required",
        providerIntegrationRunbookMode:providerIntegrationRunbook.runbookMode || "pre_real_provider_connection",
        canApproveProviderIntegration:false,
        canProceedAfterManualApproval:false,
        sandboxHealth:sandbox,
        dryRunHealth:providerSandboxDryRunHealth,
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
        approvalHealth,
        connectorStubHealth,
        providerStubProfileHealth,
        providerSecretHealth,
        providerSandboxDryRunHealth,
        connectorGateHealth,
        providerIntegrationReadiness,
        providerIntegrationReadinessStatus:providerIntegrationReadiness.readinessStatus,
        providerIntegrationSummaryMode:providerIntegrationReadiness.summaryMode,
        canProceedToProviderIntegration:false,
        providerIntegrationRunbook,
        providerIntegrationRunbookStatus:providerIntegrationRunbook.runbookStatus || "manual_approval_required",
        providerIntegrationRunbookMode:providerIntegrationRunbook.runbookMode || "pre_real_provider_connection",
        canApproveProviderIntegration:false,
        canProceedAfterManualApproval:false,
        sandboxHealth:sandbox,
        dryRunHealth:providerSandboxDryRunHealth,
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
        approvalHealth,
        connectorStubHealth,
        providerStubProfileHealth,
        providerSecretHealth,
        providerSandboxDryRunHealth,
        connectorGateHealth,
        providerIntegrationReadiness,
        providerIntegrationReadinessStatus:providerIntegrationReadiness.readinessStatus,
        providerIntegrationSummaryMode:providerIntegrationReadiness.summaryMode,
        canProceedToProviderIntegration:false,
        providerIntegrationRunbook,
        providerIntegrationRunbookStatus:providerIntegrationRunbook.runbookStatus || "manual_approval_required",
        providerIntegrationRunbookMode:providerIntegrationRunbook.runbookMode || "pre_real_provider_connection",
        canApproveProviderIntegration:false,
        canProceedAfterManualApproval:false,
        sandboxHealth:Object.assign({}, sandbox, sandboxValidation),
        dryRunHealth:providerSandboxDryRunHealth,
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
      approvalHealth,
      connectorStubHealth,
      providerStubProfileHealth,
      providerSecretHealth,
      providerSandboxDryRunHealth,
      connectorGateHealth,
      providerIntegrationReadiness,
      providerIntegrationReadinessStatus:providerIntegrationReadiness.readinessStatus,
      providerIntegrationSummaryMode:providerIntegrationReadiness.summaryMode,
      canProceedToProviderIntegration:false,
      providerIntegrationRunbook,
      providerIntegrationRunbookStatus:providerIntegrationRunbook.runbookStatus || "manual_approval_required",
      providerIntegrationRunbookMode:providerIntegrationRunbook.runbookMode || "pre_real_provider_connection",
      canApproveProviderIntegration:false,
      canProceedAfterManualApproval:false,
      sandboxHealth:sandbox,
      dryRunHealth:providerSandboxDryRunHealth,
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
    getProviderApprovalStatus,
    getReadOnlyConnectorStubStatus,
    getProviderStubProfileStatus,
    getProviderSecretStorageStatus,
    getProviderSandboxDryRunStatus,
    getCommerceConnectorGateStatus,
    getProviderIntegrationReadiness,
    getCommerceLocalIntentRoute,
    locationHealthForCommerce:locationHealth,
    getLocalLawCompliancePolicy,
    evaluateLocalLawCompliance,
    explainLocalLawBlockReason,
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
