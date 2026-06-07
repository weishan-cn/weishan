(function(){
  const STUB_VERSION = "2.0.41";
  const PHASE = "read_only_connector_stub_framework";
  const DEFAULT_STATUS = "stub_not_ready";
  const CONNECTOR_MODE = "read_only";
  const APPROVED_FOR_STUB = "approved_for_stub";
  const DEFAULT_REASON = "provider_approval_required_before_stub";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeCategory(category){
    const raw = String(category || "");
    if (raw === "ecommerce") return "product";
    if (raw === "ticketing") return "ticket";
    if (raw === "serviceBooking") return "service";
    if (/^(flight|product|hotel|ticket|service)$/.test(raw)) return raw;
    return "product";
  }

  function defaultCapabilities(canBuildStub){
    return {
      canBuildStub:canBuildStub === true,
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

  function getReadOnlyConnectorStubPolicy(category, providerId){
    const nextCategory = normalizeCategory(category);
    return clone({
      stubVersion:STUB_VERSION,
      phase:PHASE,
      defaultStatus:DEFAULT_STATUS,
      connectorMode:CONNECTOR_MODE,
      allowedAfterApprovalStatus:APPROVED_FOR_STUB,
      category:nextCategory,
      providerId:String(providerId || nextCategory + "-provider-disabled"),
      requiresProviderApproval:true,
      requiresLocalLawCompliance:true,
      requiresOnboardingChecklist:true,
      requiresConfigGate:true,
      requiresAdapterGate:true,
      requiresSandboxGate:true,
      requiresConnectorGate:true,
      capabilities:defaultCapabilities(false),
      safety:defaultSafety()
    });
  }

  function getApprovalStatus(approvalHealth){
    return String(approvalHealth && approvalHealth.approvalStatus || "not_reviewed");
  }

  function getReadOnlyConnectorStubStatus(category, providerId, approvalHealth){
    const policy = getReadOnlyConnectorStubPolicy(category, providerId);
    const approvedForStub = getApprovalStatus(approvalHealth) === APPROVED_FOR_STUB;
    const capabilities = defaultCapabilities(approvedForStub);
    return Object.assign({}, policy, {
      stubStatus:approvedForStub ? "stub_development_allowed" : DEFAULT_STATUS,
      canBuildStub:capabilities.canBuildStub,
      canExecuteStub:false,
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
      reason:approvedForStub ? "approved_for_stub_structure_only" : DEFAULT_REASON,
      capabilities,
      safety:defaultSafety()
    });
  }

  function canBuildReadOnlyConnectorStub(category, providerId, approvalHealth){
    return getReadOnlyConnectorStubStatus(category, providerId, approvalHealth).canBuildStub === true;
  }

  function canExecuteReadOnlyConnectorStub(category, providerId, approvalHealth){
    return getReadOnlyConnectorStubStatus(category, providerId, approvalHealth).canExecuteStub === true;
  }

  function explainReadOnlyConnectorStubBlockReason(category, providerId, approvalHealth){
    return getReadOnlyConnectorStubStatus(category, providerId, approvalHealth).reason || DEFAULT_REASON;
  }

  function toReadOnlyConnectorStubDisplayStatus(status){
    const raw = String(status || "");
    const map = {
      stub_not_ready:"未准备",
      stub_development_allowed:"已获准开发结构",
      read_only:"只读",
      not_granted:"未授予",
      disabled:"未启用",
      unavailable:"不可用",
      blocked:"已阻断",
      structure_only:"仅允许结构开发"
    };
    return map[raw] || "未准备";
  }

  window.WeishanCommerceReadOnlyConnectorStub = {
    STUB_VERSION,
    PHASE,
    DEFAULT_STATUS,
    CONNECTOR_MODE,
    APPROVED_FOR_STUB,
    DEFAULT_REASON,
    getReadOnlyConnectorStubPolicy,
    getReadOnlyConnectorStubStatus,
    canBuildReadOnlyConnectorStub,
    canExecuteReadOnlyConnectorStub,
    explainReadOnlyConnectorStubBlockReason,
    toReadOnlyConnectorStubDisplayStatus
  };
})();
