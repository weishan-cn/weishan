(function(){
  const DRY_RUN_VERSION = "2.0.45";
  const PHASE = "provider_sandbox_dry_run_framework";
  const DEFAULT_STATUS = "not_run";
  const DRY_RUN_MODE = "offline_sandbox";
  const DEFAULT_REASON = "provider_sandbox_dry_run_required";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function defaultDryRunChecks(){
    return {
      requestShapeReviewed:false,
      responseShapeReviewed:false,
      errorHandlingReviewed:false,
      timeoutHandlingReviewed:false,
      rateLimitHandlingReviewed:false,
      paginationReviewed:false,
      priceFieldReviewed:false,
      taxFeeShippingFieldReviewed:false,
      redirectUrlReviewed:false,
      privacyReviewed:false,
      noPaymentConfirmed:false,
      noOrderSubmitConfirmed:false,
      noIdentityStorageConfirmed:false
    };
  }

  function defaultCapabilities(){
    return {
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
      canStoreIdentity:false
    };
  }

  function defaultSafety(){
    return {
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
      noRawGpsStorage:true
    };
  }

  function getProviderSandboxDryRunPolicy(providerId){
    return clone({
      dryRunVersion:DRY_RUN_VERSION,
      phase:PHASE,
      providerId:String(providerId || "provider-disabled"),
      defaultStatus:DEFAULT_STATUS,
      dryRunMode:DRY_RUN_MODE,
      requiresGlobalCommerceStandard:true,
      requiresLocalLawCompliance:true,
      requiresProviderOnboarding:true,
      requiresProviderApproval:true,
      requiresReadOnlyConnectorStub:true,
      requiresProviderStubProfile:true,
      requiresSecretStoragePlan:true,
      requiresHumanApproval:true,
      dryRunChecks:defaultDryRunChecks(),
      capabilities:defaultCapabilities(),
      safety:defaultSafety()
    });
  }

  function getProviderSandboxDryRunStatus(providerId){
    const policy = getProviderSandboxDryRunPolicy(providerId);
    const capabilities = defaultCapabilities();
    return Object.assign({}, policy, capabilities, {
      dryRunStatus:DEFAULT_STATUS,
      dryRunMode:DRY_RUN_MODE,
      reason:DEFAULT_REASON,
      capabilities,
      dryRunChecks:defaultDryRunChecks(),
      safety:defaultSafety()
    });
  }

  function canRunProviderSandboxDryRun(){
    return false;
  }

  function canUseSandboxRealEndpoint(){
    return false;
  }

  function canUseSandboxApiKey(){
    return false;
  }

  function canReturnSandboxResults(){
    return false;
  }

  function explainProviderSandboxDryRunBlockReason(){
    return DEFAULT_REASON;
  }

  function toProviderSandboxDryRunDisplayStatus(status){
    const map = {
      not_run:"未运行",
      offline_sandbox:"离线沙箱",
      provider_sandbox_dry_run_required:"需要完成离线沙箱空跑",
      disabled:"未启用",
      unavailable:"不可用",
      blocked:"已阻断",
      reviewed:"已审查"
    };
    return map[String(status || "")] || "未运行";
  }

  window.WeishanCommerceProviderSandboxDryRun = {
    DRY_RUN_VERSION,
    PHASE,
    DEFAULT_STATUS,
    DRY_RUN_MODE,
    DEFAULT_REASON,
    getProviderSandboxDryRunPolicy,
    getProviderSandboxDryRunStatus,
    canRunProviderSandboxDryRun,
    canUseSandboxRealEndpoint,
    canUseSandboxApiKey,
    canReturnSandboxResults,
    explainProviderSandboxDryRunBlockReason,
    toProviderSandboxDryRunDisplayStatus
  };
})();
