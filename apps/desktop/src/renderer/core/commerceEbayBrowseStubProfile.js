(function(){
  const PROFILE_VERSION = "2.0.43";
  const PROVIDER_ID = "ebay_browse_api";
  const PROVIDER_NAME = "eBay Browse API";
  const PROFILE_STATUS = "profile_only_not_connected";
  const DEFAULT_REASON = "provider_stub_profile_only";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function defaultConnectionState(){
    return {
      endpointConnected:false,
      apiKeyConfigured:false,
      networkAllowed:false,
      canSearchNow:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirectNow:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false
    };
  }

  function defaultSafety(){
    return {
      noRealEndpoint:true,
      noApiKey:true,
      noNetworkSearch:true,
      noRealPrice:true,
      noFakeDemoMockPrice:true,
      noRedirect:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true,
      noRawGpsStorage:true
    };
  }

  function getEbayBrowseStubProfile(){
    return clone({
      profileVersion:PROFILE_VERSION,
      phase:"provider_stub_profile",
      providerId:PROVIDER_ID,
      providerName:PROVIDER_NAME,
      providerCategory:"product_marketplace",
      profileStatus:PROFILE_STATUS,
      connectorMode:"read_only",
      intendedUse:"product_search_candidate",
      allowedUse:[
        "candidate_profile",
        "approval_review",
        "read_only_stub_design"
      ],
      blockedUse:[
        "real_endpoint_connection",
        "real_api_key_configuration",
        "real_network_search",
        "real_price_display",
        "redirect_to_provider",
        "checkout",
        "payment",
        "order_submit",
        "identity_storage"
      ],
      requiredBeforeConnection:{
        globalCommerceStandard:true,
        localLawComplianceGate:true,
        providerOnboardingChecklist:true,
        providerApprovalWorkflow:true,
        approvedForStub:true,
        readOnlyConnectorStub:true,
        apiKeyStorageReview:true,
        endpointReview:true,
        sandboxDryRun:true,
        connectorGate:true,
        humanApproval:true
      },
      connectionState:defaultConnectionState(),
      safety:defaultSafety()
    });
  }

  function getProviderStubProfile(providerId){
    const raw = String(providerId || PROVIDER_ID);
    if (raw === PROVIDER_ID) return getEbayBrowseStubProfile();
    return null;
  }

  function getProviderStubProfileStatus(providerId){
    const profile = getProviderStubProfile(providerId) || getEbayBrowseStubProfile();
    return {
      profileVersion:profile.profileVersion,
      providerId:profile.providerId,
      providerName:profile.providerName,
      profileStatus:profile.profileStatus,
      connectorMode:profile.connectorMode,
      canUseForReview:true,
      canConnectEndpoint:false,
      canConfigureApiKey:false,
      canUseNetwork:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      reason:DEFAULT_REASON
    };
  }

  function canUseProviderStubProfile(providerId){
    return !!getProviderStubProfile(providerId);
  }

  function canConnectProviderFromProfile(){
    return false;
  }

  function explainProviderStubProfileBlockReason(){
    return DEFAULT_REASON;
  }

  function toProviderStubProfileDisplayStatus(status){
    const map = {
      profile_only_not_connected:"仅建档，尚未接入",
      provider_stub_profile_only:"仅用于候选档案和审查",
      read_only:"只读",
      unavailable:"不可用",
      disabled:"未启用",
      blocked:"已阻断"
    };
    return map[String(status || "")] || "仅建档，尚未接入";
  }

  window.WeishanCommerceEbayBrowseStubProfile = {
    PROFILE_VERSION,
    PROVIDER_ID,
    PROVIDER_NAME,
    PROFILE_STATUS,
    DEFAULT_REASON,
    getEbayBrowseStubProfile,
    getProviderStubProfile,
    getProviderStubProfileStatus,
    canUseProviderStubProfile,
    canConnectProviderFromProfile,
    explainProviderStubProfileBlockReason,
    toProviderStubProfileDisplayStatus
  };
})();
