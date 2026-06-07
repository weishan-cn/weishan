(function(){
  const SECRET_PLAN_VERSION = "2.0.44";
  const PHASE = "provider_secret_storage_plan";
  const DEFAULT_STATUS = "not_configured";
  const STORAGE_MODE = "secure_storage_required";
  const DEFAULT_REASON = "provider_secret_storage_not_approved";

  const APPLIES_TO = [
    "product_marketplace",
    "official_brand_site",
    "hotel_ota",
    "hotel_official_site",
    "flight_ota",
    "airline_official_site",
    "ticketing_platform",
    "local_service_platform"
  ];

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function defaultStoragePolicy(){
    return {
      useSecureStorage:true,
      allowPlaintextInRepo:false,
      allowPlaintextInUi:false,
      allowPlaintextInLogs:false,
      allowPlaintextInLocalStorage:false,
      allowPlaintextInSessionStorage:false,
      allowPlaintextInQueryString:false,
      allowPlaintextInErrorMessage:false,
      redactOnDisplay:true,
      redactOnExport:true
    };
  }

  function defaultGates(){
    return {
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
    };
  }

  function defaultRequiredBeforeKeyUse(){
    return {
      globalCommerceStandard:true,
      localLawComplianceGate:true,
      providerOnboardingChecklist:true,
      providerApprovalWorkflow:true,
      approvedForStub:true,
      readOnlyConnectorStub:true,
      providerStubProfile:true,
      securityStorageReview:true,
      secretStorageReview:true,
      endpointReview:true,
      sandboxDryRun:true,
      connectorGate:true,
      humanApproval:true
    };
  }

  function defaultSafety(){
    return {
      noRealApiKey:true,
      noPlaintextSecret:true,
      noSecretLogging:true,
      noSecretInUi:true,
      noSecretInGit:true,
      noSecretInEnvCommit:true,
      noNetworkSearch:true,
      noRealEndpoint:true,
      noRealPrice:true,
      noFakeDemoMockPrice:true,
      noRedirect:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true
    };
  }

  function getProviderSecretStoragePlan(providerId){
    return clone({
      secretPlanVersion:SECRET_PLAN_VERSION,
      phase:PHASE,
      providerId:String(providerId || "provider-disabled"),
      defaultStatus:DEFAULT_STATUS,
      appliesTo:APPLIES_TO,
      storagePolicy:defaultStoragePolicy(),
      gates:defaultGates(),
      requiredBeforeKeyUse:defaultRequiredBeforeKeyUse(),
      safety:defaultSafety()
    });
  }

  function getProviderSecretStorageStatus(providerId){
    const plan = getProviderSecretStoragePlan(providerId);
    return {
      secretPlanVersion:plan.secretPlanVersion,
      phase:plan.phase,
      providerId:plan.providerId,
      secretStatus:DEFAULT_STATUS,
      storageMode:STORAGE_MODE,
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
      reason:DEFAULT_REASON,
      storagePolicy:plan.storagePolicy,
      gates:plan.gates,
      requiredBeforeKeyUse:plan.requiredBeforeKeyUse,
      safety:plan.safety
    };
  }

  function canInputProviderApiKey(){
    return false;
  }

  function canSaveProviderApiKey(){
    return false;
  }

  function canUseProviderApiKey(){
    return false;
  }

  function maskProviderSecret(secretLikeValue){
    const raw = String(secretLikeValue || "").trim();
    return raw ? "[redacted]" : "未配置";
  }

  function explainProviderSecretStorageBlockReason(){
    return DEFAULT_REASON;
  }

  function toProviderSecretStorageDisplayStatus(status){
    const map = {
      not_configured:"未配置",
      secure_storage_required:"需要安全存储",
      provider_secret_storage_not_approved:"安全存储方案未审查",
      disabled:"未开放",
      unavailable:"不可用",
      blocked:"已阻断",
      redacted:"[redacted]"
    };
    return map[String(status || "")] || "未配置";
  }

  window.WeishanCommerceProviderSecretStoragePlan = {
    SECRET_PLAN_VERSION,
    PHASE,
    DEFAULT_STATUS,
    STORAGE_MODE,
    DEFAULT_REASON,
    APPLIES_TO:APPLIES_TO.slice(),
    getProviderSecretStoragePlan,
    getProviderSecretStorageStatus,
    canInputProviderApiKey,
    canSaveProviderApiKey,
    canUseProviderApiKey,
    maskProviderSecret,
    explainProviderSecretStorageBlockReason,
    toProviderSecretStorageDisplayStatus
  };
})();
