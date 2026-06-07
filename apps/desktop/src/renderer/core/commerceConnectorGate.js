(function(){
  const CONNECTOR_GATE_VERSION = "2.0.46";
  const PHASE = "connector_gate_framework";
  const DEFAULT_STATUS = "blocked";
  const GATE_MODE = "final_pre_connection_gate";
  const DEFAULT_REASON = "connector_gate_required";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function defaultRequiredChecks(){
    return {
      globalCommerceStandardPassed:false,
      localLawCompliancePassed:false,
      providerOnboardingCompleted:false,
      providerApprovalGranted:false,
      readOnlyConnectorStubReady:false,
      providerStubProfileReviewed:false,
      secretStorageApproved:false,
      sandboxDryRunPassed:false,
      endpointReviewed:false,
      apiKeyStorageReviewed:false,
      networkPolicyReviewed:false,
      priceFieldReviewed:false,
      redirectPolicyReviewed:false,
      noPaymentConfirmed:false,
      noOrderSubmitConfirmed:false,
      noIdentityStorageConfirmed:false,
      humanApprovalGranted:false
    };
  }

  function defaultCapabilities(){
    return {
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
      noRawGpsStorage:true,
      noBypassLocalLaw:true
    };
  }

  function getCommerceConnectorGatePolicy(providerId){
    return clone({
      connectorGateVersion:CONNECTOR_GATE_VERSION,
      phase:PHASE,
      providerId:String(providerId || "provider-disabled"),
      defaultStatus:DEFAULT_STATUS,
      gateMode:GATE_MODE,
      requiresGlobalCommerceStandard:true,
      requiresLocalLawCompliance:true,
      requiresProviderOnboarding:true,
      requiresProviderApproval:true,
      requiresReadOnlyConnectorStub:true,
      requiresProviderStubProfile:true,
      requiresSecretStoragePlan:true,
      requiresSandboxDryRun:true,
      requiresHumanApproval:true,
      requiredChecks:defaultRequiredChecks(),
      capabilities:defaultCapabilities(),
      safety:defaultSafety()
    });
  }

  function getCommerceConnectorGateStatus(providerId){
    const policy = getCommerceConnectorGatePolicy(providerId);
    const capabilities = defaultCapabilities();
    return Object.assign({}, policy, capabilities, {
      connectorGateStatus:DEFAULT_STATUS,
      gateMode:GATE_MODE,
      reason:DEFAULT_REASON,
      capabilities,
      requiredChecks:defaultRequiredChecks(),
      safety:defaultSafety()
    });
  }

  function canOpenCommerceConnector(){
    return false;
  }

  function canUseConnectorEndpoint(){
    return false;
  }

  function canUseConnectorApiKey(){
    return false;
  }

  function canUseConnectorNetwork(){
    return false;
  }

  function canReturnConnectorResults(){
    return false;
  }

  function explainCommerceConnectorGateBlockReason(){
    return DEFAULT_REASON;
  }

  function toCommerceConnectorGateDisplayStatus(status){
    const map = {
      blocked:"已阻断",
      final_pre_connection_gate:"真实连接前最终闸门",
      connector_gate_required:"需要通过 Connector Gate",
      disabled:"未启用",
      unavailable:"不可用",
      reviewed:"已审查",
      ready:"可进入下一步"
    };
    return map[String(status || "")] || "已阻断";
  }

  window.WeishanCommerceConnectorGate = {
    CONNECTOR_GATE_VERSION,
    PHASE,
    DEFAULT_STATUS,
    GATE_MODE,
    DEFAULT_REASON,
    getCommerceConnectorGatePolicy,
    getCommerceConnectorGateStatus,
    canOpenCommerceConnector,
    canUseConnectorEndpoint,
    canUseConnectorApiKey,
    canUseConnectorNetwork,
    canReturnConnectorResults,
    explainCommerceConnectorGateBlockReason,
    toCommerceConnectorGateDisplayStatus
  };
})();
