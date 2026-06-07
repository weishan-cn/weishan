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

  function onboardingStatus(category){
    const api = onboardingApi();
    if (api && api.getProviderOnboardingStatus) return api.getProviderOnboardingStatus(category);
    return {
      checklistVersion:"2.0.40",
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

  function approvalStatus(category, providerId){
    const api = approvalApi();
    if (api && api.getProviderApprovalStatus) return api.getProviderApprovalStatus(category, providerId);
    return {
      workflowVersion:"2.0.40",
      phase:"provider_approval_workflow",
      approvalStatus:"not_reviewed",
      canRequestApproval:true,
      canStartConnectorStubDevelopment:false,
      canConfigureApiKey:false,
      canConnectEndpoint:false,
      canEnableNetworkSearch:false,
      canDisplayPrice:false,
      canRedirect:false,
      reason:"provider_approval_required"
    };
  }

  function connectorStubStatus(category, providerId, approvalHealth){
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

  function providerStubProfileStatus(providerId){
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

  function providerSecretStorageStatus(providerId){
    const api = secretStorageApi();
    if (api && api.getProviderSecretStorageStatus) return api.getProviderSecretStorageStatus(providerId || "provider-disabled");
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

  function providerSandboxDryRunStatus(providerId, providerHealth){
    const api = sandboxDryRunApi();
    if (api && api.getProviderSandboxDryRunStatus) return api.getProviderSandboxDryRunStatus(providerId || "provider-disabled", providerHealth);
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

  function connectorGateStatus(providerId){
    const api = connectorGateApi();
    if (api && api.getCommerceConnectorGateStatus) return api.getCommerceConnectorGateStatus(providerId || "provider-disabled");
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

  function providerIntegrationReadiness(providerId, providerHealth){
    const api = integrationReadinessApi();
    if (api && api.getProviderIntegrationReadiness) return api.getProviderIntegrationReadiness(providerId || "provider-disabled", providerHealth || {});
    return {
      readinessVersion:"2.0.47",
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
    return api && api.getProductProviderSafetySwitches ? api.getProductProviderSafetySwitches() : {
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

  function defaultProviderConfig(category){
    const next = normalizeCategory(category);
    const label = CATEGORY_LABELS[next] || "采购";
    const providerId = next === "product" ? "product_search_readonly_candidate" : next + "-provider-disabled";
    const approval = approvalStatus(next, providerId);
    const stub = connectorStubStatus(next, providerId, approval);
    const secret = providerSecretStorageStatus(providerId);
    const dryRun = providerSandboxDryRunStatus(providerId);
    const gate = connectorGateStatus(providerId);
    const readiness = providerIntegrationReadiness(providerId, { connectorGateHealth:gate });
    const base = {
      providerId,
      category:next,
      providerIntegrationReadiness:readiness,
      providerIntegrationReadinessStatus:readiness.readinessStatus || "not_ready",
      providerIntegrationSummaryMode:readiness.summaryMode || "pre_connection_readiness",
      canProceedToProviderIntegration:false,
      providerSecretHealth:secret,
      providerSecretStatus:secret.secretStatus || "not_configured",
      providerSecretStorageMode:secret.storageMode || "secure_storage_required",
      canInputProviderApiKey:false,
      canSaveProviderApiKey:false,
      canReadProviderApiKey:false,
      canUseProviderApiKeyForNetwork:false,
      providerSandboxDryRunHealth:dryRun,
      providerSandboxDryRunStatus:dryRun.dryRunStatus || "not_run",
      providerSandboxDryRunMode:dryRun.dryRunMode || "offline_sandbox",
      canRunProviderSandboxDryRun:false,
      canUseSandboxRealEndpoint:false,
      canUseSandboxApiKey:false,
      canReturnSandboxResults:false,
      connectorGateHealth:gate,
      connectorGateStatus:gate.connectorGateStatus || "blocked",
      connectorGateMode:gate.gateMode || "final_pre_connection_gate",
      canOpenCommerceConnector:false,
      connectorStubHealth:stub,
      connectorStubStatus:stub.stubStatus || "stub_not_ready",
      connectorStubMode:stub.connectorMode || "read_only",
      canBuildReadOnlyConnectorStub:stub.canBuildStub === true,
      canExecuteReadOnlyConnectorStub:stub.canExecuteStub === true,
      approvalStatus:approval.approvalStatus || "not_reviewed",
      providerApprovalRequired:true,
      canRequestApproval:approval.canRequestApproval !== false,
      canStartConnectorStubDevelopment:approval.canStartConnectorStubDevelopment === true,
      canConfigureApiKey:approval.canConfigureApiKey === true,
      canEnableNetworkSearch:approval.canEnableNetworkSearch === true,
      canRedirect:approval.canRedirect === true,
      approvalHealth:approval,
      onboardingStatus:"not_reviewed",
      providerOnboardingRequired:true,
      canStartConnectorDevelopment:false,
      canConnectEndpoint:false,
      canDisplayPrice:false,
      providerStatus:next === "product" ? "candidate_not_connected" : "disabled",
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
      reasonWhenUnavailable:"暂未配置真实" + label + "搜索源",
      providerOnboardingStatus:onboardingStatus(next)
    };
    if (next === "product") {
      const candidate = productCandidateReadiness();
      const pool = poolReadiness();
      const profileHealth = providerStubProfileStatus(candidate.selectedFirstCandidate || "ebay_browse_api");
      const productGate = connectorGateStatus(candidate.selectedFirstCandidate || "ebay_browse_api");
      const productIntegrationReadiness = providerIntegrationReadiness(candidate.selectedFirstCandidate || "ebay_browse_api", { connectorGateHealth:productGate });
      return Object.assign({}, base, productSafetySwitches(), {
        connectorType:"readonly_product_search",
        connectorStatus:"not_connected",
        providerReadinessStatus:"not_ready",
        readinessStatus:"not_ready",
        selectedFirstCandidate:candidate.selectedFirstCandidate,
        selectedCandidateName:candidate.selectedName,
        selectedStatus:candidate.selectedStatus,
        selectedWording:candidate.selectedWording || "product_search_trial_candidate_one",
        globalProviderPoolPhase:pool.phase,
        globalProviderPoolReadiness:pool,
        endpointConnected:false,
        canSearchNow:false,
        canReturnPriceNow:false,
        canRedirectNow:false,
        reasonWhenUnavailable:"全球多源 provider 候选池准备中，尚未接入真实只读搜索源",
        reasonWhenDisabled:"全球多源 provider 候选池准备中，尚未接入真实只读搜索源",
        productProviderProfile:productProfile(),
        productProviderReadiness:productReadiness(),
        productProviderCandidateReadiness:candidate,
        providerStubProfileHealth:profileHealth,
        providerSecretHealth:providerSecretStorageStatus(candidate.selectedFirstCandidate || "ebay_browse_api"),
        providerSandboxDryRunHealth:providerSandboxDryRunStatus(candidate.selectedFirstCandidate || "ebay_browse_api"),
        connectorGateHealth:productGate,
        providerIntegrationReadiness:productIntegrationReadiness,
        providerIntegrationReadinessStatus:productIntegrationReadiness.readinessStatus || "not_ready",
        providerIntegrationSummaryMode:productIntegrationReadiness.summaryMode || "pre_connection_readiness",
        providerOnboardingStatus:onboardingStatus(next)
      });
    }
    return base;
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
    }, isProduct ? {
      productProviderEnabled:true,
      productProviderConfigured:true,
      productProviderHasApiKey:true,
      productProviderNetworkAllowed:true,
      productProviderPriceAllowed:true,
      productProviderRedirectAllowed:true,
      productProviderReadOnlyOnly:true,
      productProviderNoCheckout:true,
      productProviderNoPayment:true,
      productProviderNoIdentityStorage:true,
      productProviderReadiness:productReadiness({
        productProviderEnabled:true,
        productProviderConfigured:true,
        productProviderHasApiKey:true,
        productProviderNetworkAllowed:true,
        productProviderPriceAllowed:true,
        productProviderRedirectAllowed:true,
        productProviderReadOnlyOnly:true,
        productProviderNoCheckout:true,
        productProviderNoPayment:true,
        productProviderNoIdentityStorage:true
      })
    } : {});
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
    const approval = config.approvalHealth || approvalStatus(config.category, config.providerId);
    const stub = config.connectorStubHealth || connectorStubStatus(config.category, config.providerId, approval);
    const gate = config.connectorGateHealth || connectorGateStatus(config.selectedFirstCandidate || config.providerId);
    const readiness = config.providerIntegrationReadiness || providerIntegrationReadiness(config.selectedFirstCandidate || config.providerId, config);
    return {
      configStatus:ready ? "ready" : "not_configured",
      providerConfig:config,
      providerIntegrationReadiness:readiness,
      providerIntegrationReadinessStatus:readiness.readinessStatus || "not_ready",
      providerIntegrationSummaryMode:readiness.summaryMode || "pre_connection_readiness",
      canProceedToProviderIntegration:false,
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
      approvalStatus:approval.approvalStatus || "not_reviewed",
      connectorStubHealth:stub,
      connectorStubStatus:stub.stubStatus || "stub_not_ready",
      connectorStubMode:stub.connectorMode || "read_only",
      canBuildReadOnlyConnectorStub:stub.canBuildStub === true,
      canExecuteReadOnlyConnectorStub:stub.canExecuteStub === true,
      providerApprovalRequired:true,
      canRequestApproval:approval.canRequestApproval !== false,
      canStartConnectorStubDevelopment:approval.canStartConnectorStubDevelopment === true,
      canConfigureApiKey:approval.canConfigureApiKey === true,
      canConnectEndpoint:approval.canConnectEndpoint === true,
      canEnableNetworkSearch:approval.canEnableNetworkSearch === true,
      canRedirect:approval.canRedirect === true,
      approvalHealth:approval,
      canShowPrice:ready,
      canShowBookingButton:ready && config.allowBookingUrl === true,
      canShowCheckoutButton:ready && config.allowCheckoutUrl === true,
      productProviderEnabled:config.productProviderEnabled === true,
      productProviderConfigured:config.productProviderConfigured === true,
      productProviderHasApiKey:config.productProviderHasApiKey === true,
      productProviderNetworkAllowed:config.productProviderNetworkAllowed === true,
      productProviderPriceAllowed:config.productProviderPriceAllowed === true,
      productProviderRedirectAllowed:config.productProviderRedirectAllowed === true,
      productProviderReadOnlyOnly:config.productProviderReadOnlyOnly !== false,
      productProviderNoCheckout:config.productProviderNoCheckout !== false,
      productProviderNoPayment:config.productProviderNoPayment !== false,
      productProviderNoIdentityStorage:config.productProviderNoIdentityStorage !== false,
      productProviderProfile:config.productProviderProfile || productProfile(),
      productProviderReadiness:config.productProviderReadiness || productReadiness(config),
      providerStubProfileHealth:config.providerStubProfileHealth || providerStubProfileStatus(config.selectedFirstCandidate || "ebay_browse_api"),
      providerSecretHealth:config.providerSecretHealth || providerSecretStorageStatus(config.selectedFirstCandidate || config.providerId),
      providerSandboxDryRunHealth:config.providerSandboxDryRunHealth || providerSandboxDryRunStatus(config.selectedFirstCandidate || config.providerId),
      connectorGateHealth:gate,
      connectorGateStatus:gate.connectorGateStatus || "blocked",
      connectorGateMode:gate.gateMode || "final_pre_connection_gate",
      canOpenCommerceConnector:gate.canOpenConnector === true,
      reasonWhenUnavailable:ready ? "" : config.reasonWhenUnavailable || "provider_config_not_ready"
    };
  }

  window.WeishanCommerceProviderConfig = {
    normalizeCategory,
    productSafetySwitches,
    productReadiness,
    productProfile,
    defaultProviderConfig,
    getCommerceProviderConfig,
    getCommerceProviderConfigRegistry,
    getCommerceProviderConfigHealth,
    getProviderStubProfileStatus:providerStubProfileStatus,
    getProviderSecretStorageStatus:providerSecretStorageStatus,
    getProviderSandboxDryRunStatus:providerSandboxDryRunStatus,
    getCommerceConnectorGateStatus:connectorGateStatus,
    getProviderIntegrationReadiness:providerIntegrationReadiness,
    getReadOnlyConnectorStubStatus:connectorStubStatus
  };
})();
