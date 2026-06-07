(function(){
  const WORKFLOW_VERSION = "2.0.40";
  const PHASE = "provider_approval_workflow";
  const DEFAULT_STATUS = "not_reviewed";
  const BLOCK_REASON = "provider_approval_required";

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

  const STATUSES = [
    "not_reviewed",
    "review_requested",
    "legal_review",
    "api_review",
    "privacy_review",
    "fee_field_review",
    "security_review",
    "approved_for_stub",
    "rejected",
    "blocked"
  ];

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

  function baseApprovalStages(){
    return {
      legalReviewRequired:true,
      apiDocsReviewRequired:true,
      privacyReviewRequired:true,
      feeFieldReviewRequired:true,
      securityReviewRequired:true,
      localLawReviewRequired:true,
      humanApprovalRequired:true
    };
  }

  function baseGates(){
    return {
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
    };
  }

  function baseSafety(){
    return {
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
    };
  }

  function getProviderApprovalWorkflow(category){
    return clone({
      workflowVersion:WORKFLOW_VERSION,
      phase:PHASE,
      category:normalizeCategory(category),
      defaultStatus:DEFAULT_STATUS,
      appliesTo:APPLIES_TO,
      statuses:STATUSES,
      approvalStages:baseApprovalStages(),
      gates:baseGates(),
      safety:baseSafety()
    });
  }

  function getProviderApprovalStatus(category, providerId){
    const workflow = getProviderApprovalWorkflow(category);
    return {
      workflowVersion:workflow.workflowVersion,
      phase:workflow.phase,
      category:workflow.category,
      providerId:String(providerId || workflow.category + "-provider-disabled"),
      approvalStatus:DEFAULT_STATUS,
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
      reason:BLOCK_REASON,
      approvalStages:workflow.approvalStages,
      gates:workflow.gates,
      safety:workflow.safety
    };
  }

  function canRequestProviderApproval(category, providerId){
    return getProviderApprovalStatus(category, providerId).canRequestApproval === true;
  }

  function canStartConnectorStubDevelopment(category, providerId){
    return getProviderApprovalStatus(category, providerId).canStartConnectorStubDevelopment === true;
  }

  function canConfigureProviderApiKey(category, providerId){
    return getProviderApprovalStatus(category, providerId).canConfigureApiKey === true;
  }

  function canConnectProviderEndpoint(category, providerId){
    return getProviderApprovalStatus(category, providerId).canConnectEndpoint === true;
  }

  function explainProviderApprovalBlockReason(category, providerId){
    return getProviderApprovalStatus(category, providerId).reason || BLOCK_REASON;
  }

  function toProviderApprovalDisplayStatus(status){
    const raw = String(status || "");
    const map = {
      not_reviewed:"未审查",
      review_requested:"已请求审查",
      legal_review:"法律条款审查中",
      api_review:"API 文档审查中",
      privacy_review:"隐私政策审查中",
      fee_field_review:"价格/税费/运费字段审查中",
      security_review:"安全审查中",
      approved_for_stub:"已批准开发只读 connector stub",
      rejected:"已拒绝",
      blocked:"已阻断"
    };
    return map[raw] || "未审查";
  }

  window.WeishanCommerceProviderApprovalWorkflow = {
    WORKFLOW_VERSION,
    PHASE,
    DEFAULT_STATUS,
    BLOCK_REASON,
    APPLIES_TO:APPLIES_TO.slice(),
    STATUSES:STATUSES.slice(),
    getProviderApprovalWorkflow,
    getProviderApprovalStatus,
    canRequestProviderApproval,
    canStartConnectorStubDevelopment,
    canConfigureProviderApiKey,
    canConnectProviderEndpoint,
    explainProviderApprovalBlockReason,
    toProviderApprovalDisplayStatus
  };
})();
