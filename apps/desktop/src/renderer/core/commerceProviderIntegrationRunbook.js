(function(){
  const RUNBOOK_VERSION = "2.0.48";
  const PHASE = "provider_integration_manual_approval_runbook";
  const DEFAULT_STATUS = "manual_approval_required";
  const RUNBOOK_MODE = "pre_real_provider_connection";
  const DEFAULT_REASON = "provider_manual_approval_runbook_required";

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function defaultRequiredBeforeApproval(){
    return {
      globalCommerceStandard:true,
      localLawComplianceGate:true,
      providerOnboardingChecklist:true,
      providerApprovalWorkflow:true,
      readOnlyConnectorStub:true,
      providerStubProfile:true,
      providerSecretStoragePlan:true,
      providerSandboxDryRun:true,
      connectorGate:true,
      integrationReadinessSummary:true,
      humanApproval:true
    };
  }

  function defaultApprovalStages(){
    return {
      scopeReview:"not_started",
      providerTermsReview:"not_started",
      localLawReview:"not_started",
      privacyReview:"not_started",
      apiDocsReview:"not_started",
      endpointReview:"not_started",
      apiKeyStorageReview:"not_started",
      requestResponseShapeReview:"not_started",
      rateLimitReview:"not_started",
      priceFeeFieldReview:"not_started",
      redirectPolicyReview:"not_started",
      noPaymentReview:"not_started",
      noOrderSubmitReview:"not_started",
      identityStorageReview:"not_started",
      rollbackPlanReview:"not_started",
      finalHumanApproval:"not_started"
    };
  }

  function defaultCapabilities(){
    return {
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
      noBypassLocalLaw:true,
      rollbackRequired:true,
      manualFinalApprovalRequired:true
    };
  }

  function getProviderIntegrationRunbook(providerId, providerHealth){
    const capabilities = defaultCapabilities();
    return clone(Object.assign({}, capabilities, {
      runbookVersion:RUNBOOK_VERSION,
      phase:PHASE,
      providerId:String(providerId || providerHealth && providerHealth.providerId || "provider-disabled"),
      defaultStatus:DEFAULT_STATUS,
      runbookStatus:DEFAULT_STATUS,
      runbookMode:RUNBOOK_MODE,
      reason:DEFAULT_REASON,
      appliesBefore:[
        "endpoint_connection",
        "api_key_use",
        "network_search",
        "real_result_display",
        "real_price_display",
        "redirect_enablement",
        "checkout_enablement",
        "payment_enablement",
        "order_submit_enablement"
      ],
      requiredBeforeApproval:defaultRequiredBeforeApproval(),
      approvalStages:defaultApprovalStages(),
      capabilities,
      safety:defaultSafety()
    }));
  }

  function getProviderIntegrationRunbookStatus(providerId, providerHealth){
    return getProviderIntegrationRunbook(providerId, providerHealth);
  }

  function canApproveProviderIntegration(){
    return false;
  }

  function canProceedAfterManualApproval(){
    return false;
  }

  function explainProviderIntegrationRunbookBlockers(){
    return [
      "provider_manual_approval_runbook_required",
      "all_manual_approval_stages_required_before_real_provider_connection",
      "separate_version_required_for_real_provider_connection"
    ];
  }

  function toProviderIntegrationRunbookDisplayStatus(status){
    const map = {
      manual_approval_required:"需要人工审批",
      pre_real_provider_connection:"真实接入前运行手册",
      not_started:"未开始",
      blocked:"已阻断",
      not_ready:"未准备好",
      not_reviewed:"未审查",
      not_configured:"未配置",
      not_run:"未运行",
      required:"已要求",
      unavailable:"不可用",
      disabled:"未启用",
      provider_manual_approval_runbook_required:"需要完成人工审批运行手册",
      all_manual_approval_stages_required_before_real_provider_connection:"真实接入前必须完成全部人工审批阶段",
      separate_version_required_for_real_provider_connection:"真实 provider 接入必须另起版本单独 review"
    };
    return map[String(status || "")] || "需要人工审批";
  }

  function getProviderIntegrationRunbookDisplayModel(runbook){
    const next = runbook || getProviderIntegrationRunbook();
    const stages = next.approvalStages || defaultApprovalStages();
    return {
      title:"Provider 接入人工审批手册",
      subtitle:"真实 provider 接入前必须完成人工审批与运行手册确认。当前不会批准任何真实 provider 接入。",
      statusRows:[
        ["手册状态", toProviderIntegrationRunbookDisplayStatus(next.runbookStatus || DEFAULT_STATUS)],
        ["手册模式", toProviderIntegrationRunbookDisplayStatus(next.runbookMode || RUNBOOK_MODE)],
        ["真实 provider", "不可批准"],
        ["Endpoint", "不可连接"],
        ["API key", "不可使用"],
        ["网络请求", "未启用"],
        ["真实结果", "不可返回"],
        ["真实价格", "不可用"],
        ["测试价格", "不可用"],
        ["精确跳转", "未启用"],
        ["支付 / 下单", "不支持"],
        ["证件 / 银行卡", "不保存"],
        ["回滚方案", "必须准备"],
        ["最终人工批准", "未完成"]
      ],
      approvalRows:[
        ["范围审查", toProviderIntegrationRunbookDisplayStatus(stages.scopeReview || "not_started")],
        ["Provider 条款审查", toProviderIntegrationRunbookDisplayStatus(stages.providerTermsReview || "not_started")],
        ["当地法律审查", toProviderIntegrationRunbookDisplayStatus(stages.localLawReview || "not_started")],
        ["隐私审查", toProviderIntegrationRunbookDisplayStatus(stages.privacyReview || "not_started")],
        ["API 文档审查", toProviderIntegrationRunbookDisplayStatus(stages.apiDocsReview || "not_started")],
        ["Endpoint 审查", toProviderIntegrationRunbookDisplayStatus(stages.endpointReview || "not_started")],
        ["API key 存储审查", toProviderIntegrationRunbookDisplayStatus(stages.apiKeyStorageReview || "not_started")],
        ["请求 / 响应结构审查", toProviderIntegrationRunbookDisplayStatus(stages.requestResponseShapeReview || "not_started")],
        ["频率限制审查", toProviderIntegrationRunbookDisplayStatus(stages.rateLimitReview || "not_started")],
        ["价格 / 税费 / 运费字段审查", toProviderIntegrationRunbookDisplayStatus(stages.priceFeeFieldReview || "not_started")],
        ["跳转策略审查", toProviderIntegrationRunbookDisplayStatus(stages.redirectPolicyReview || "not_started")],
        ["不付款确认", toProviderIntegrationRunbookDisplayStatus(stages.noPaymentReview || "not_started")],
        ["不提交订单确认", toProviderIntegrationRunbookDisplayStatus(stages.noOrderSubmitReview || "not_started")],
        ["不保存证件 / 银行卡确认", toProviderIntegrationRunbookDisplayStatus(stages.identityStorageReview || "not_started")],
        ["回滚方案审查", toProviderIntegrationRunbookDisplayStatus(stages.rollbackPlanReview || "not_started")],
        ["最终人工批准", toProviderIntegrationRunbookDisplayStatus(stages.finalHumanApproval || "not_started")]
      ],
      note:"该手册只是接入前人工审批流程，不会打开任何 connector。当前不会访问 eBay 或任何真实 provider，不会读取 API key，不会连接 endpoint，不会发起网络请求，不会返回商品、价格或跳转链接。真正接入必须另起版本单独 review。"
    };
  }

  window.WeishanCommerceProviderIntegrationRunbook = {
    RUNBOOK_VERSION,
    PHASE,
    DEFAULT_STATUS,
    RUNBOOK_MODE,
    DEFAULT_REASON,
    getProviderIntegrationRunbook,
    getProviderIntegrationRunbookStatus,
    getProviderIntegrationRunbookDisplayModel,
    canApproveProviderIntegration,
    canProceedAfterManualApproval,
    explainProviderIntegrationRunbookBlockers,
    toProviderIntegrationRunbookDisplayStatus
  };
})();
