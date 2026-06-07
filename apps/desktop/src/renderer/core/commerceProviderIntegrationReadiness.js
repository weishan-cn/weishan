(function(){
  const READINESS_VERSION = "2.0.48";
  const PHASE = "provider_integration_readiness_summary";
  const DEFAULT_STATUS = "not_ready";
  const SUMMARY_MODE = "pre_connection_readiness";
  const DEFAULT_REASON = "provider_integration_not_ready";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function defaultOverall(){
    return {
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
      reason:DEFAULT_REASON
    };
  }

  function defaultGates(){
    return {
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

  function getProviderIntegrationReadiness(providerId, providerHealth){
    const overall = defaultOverall();
    return clone(Object.assign({}, overall, {
      readinessVersion:READINESS_VERSION,
      phase:PHASE,
      providerId:String(providerId || providerHealth && providerHealth.providerId || "provider-disabled"),
      defaultStatus:DEFAULT_STATUS,
      readinessStatus:DEFAULT_STATUS,
      summaryMode:SUMMARY_MODE,
      reason:DEFAULT_REASON,
      overall,
      gates:defaultGates(),
      safety:defaultSafety()
    }));
  }

  function getProviderIntegrationReadinessSummary(providerHealth){
    return getProviderIntegrationReadiness(providerHealth && providerHealth.providerId || "", providerHealth || {});
  }

  function canProceedToProviderIntegration(){
    return false;
  }

  function explainProviderIntegrationBlockers(){
    return [
      "provider_integration_not_ready",
      "all_gates_required_before_real_provider_connection"
    ];
  }

  function toProviderIntegrationReadinessDisplayStatus(status){
    const map = {
      not_ready:"未准备好",
      pre_connection_readiness:"接入前准备总览",
      provider_integration_not_ready:"真实 provider 接入尚未准备好",
      required:"已要求",
      not_verified:"未确认",
      not_completed:"未完成",
      not_reviewed:"未审查",
      profile_only_not_connected:"仅建档，尚未接入",
      not_configured:"未配置",
      not_run:"未运行",
      blocked:"已阻断",
      not_granted:"未完成",
      unavailable:"不可用",
      disabled:"未启用"
    };
    return map[String(status || "")] || "未准备好";
  }

  function getProviderIntegrationReadinessDisplayModel(readiness){
    const next = readiness || getProviderIntegrationReadiness();
    const gates = next.gates || defaultGates();
    return {
      title:"Provider 接入准备总览",
      subtitle:"真实 provider 接入前必须完成所有 gate。当前尚未准备好接入任何真实 provider。",
      statusRows:[
        ["总体状态", toProviderIntegrationReadinessDisplayStatus(next.readinessStatus || DEFAULT_STATUS)],
        ["真实 provider", "不可接入"],
        ["API key", "不可使用"],
        ["网络请求", "未启用"],
        ["真实结果", "不可返回"],
        ["真实价格", "不可用"],
        ["测试价格", "不可用"],
        ["精确跳转", "未启用"],
        ["支付 / 下单", "不支持"],
        ["证件 / 银行卡", "不保存"]
      ],
      gateRows:[
        ["全球采购标准", toProviderIntegrationReadinessDisplayStatus(gates.globalCommerceStandard || "required")],
        ["当地法律合规", toProviderIntegrationReadinessDisplayStatus(gates.localLawCompliance || "not_verified")],
        ["Provider Onboarding", toProviderIntegrationReadinessDisplayStatus(gates.providerOnboarding || "not_completed")],
        ["Provider Approval", toProviderIntegrationReadinessDisplayStatus(gates.providerApproval || "not_reviewed")],
        ["只读 Connector Stub", toProviderIntegrationReadinessDisplayStatus(gates.readOnlyConnectorStub || "not_ready")],
        ["Provider Stub Profile", toProviderIntegrationReadinessDisplayStatus(gates.providerStubProfile || "profile_only_not_connected")],
        ["密钥安全方案", toProviderIntegrationReadinessDisplayStatus(gates.secretStorage || "not_configured")],
        ["Sandbox Dry Run", toProviderIntegrationReadinessDisplayStatus(gates.sandboxDryRun || "not_run")],
        ["Connector Gate", toProviderIntegrationReadinessDisplayStatus(gates.connectorGate || "blocked")],
        ["人工批准", toProviderIntegrationReadinessDisplayStatus(gates.humanApproval || "not_granted")]
      ],
      note:"该面板只是接入准备总览，不会打开任何 connector。当前不会访问 eBay 或任何真实 provider，不会读取 API key，不会连接 endpoint，不会发起网络请求，不会返回商品、价格或跳转链接。"
    };
  }

  window.WeishanCommerceProviderIntegrationReadiness = {
    READINESS_VERSION,
    PHASE,
    DEFAULT_STATUS,
    SUMMARY_MODE,
    DEFAULT_REASON,
    getProviderIntegrationReadiness,
    getProviderIntegrationReadinessSummary,
    getProviderIntegrationReadinessDisplayModel,
    canProceedToProviderIntegration,
    explainProviderIntegrationBlockers,
    toProviderIntegrationReadinessDisplayStatus
  };
})();
