(function(){
  const MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION = "2.1.48";

  const providerReviewObjectFields = [
    "providerId",
    "providerName",
    "providerType",
    "providerRegion",
    "sourceHost",
    "apiDocsStatus",
    "termsStatus",
    "readonlyPermissionStatus",
    "pricingDataPolicyStatus",
    "bookingLinkPolicyStatus",
    "dataRetentionStatus",
    "privacyStatus",
    "piiHandlingStatus",
    "rateLimitStatus",
    "sandboxEvidenceStatus",
    "manualReviewState",
    "reviewerRole",
    "reviewedAt",
    "blockedReason",
    "redacted: true"
  ];

  const reviewStates = [
    "not_started",
    "docs_pending",
    "terms_pending",
    "readonly_permission_pending",
    "privacy_review_pending",
    "security_review_pending",
    "sandbox_evidence_pending",
    "blocked",
    "rejected",
    "approved_for_future_readonly"
  ];

  const manualChecklist = [
    "API 文档是否可审查",
    "服务条款是否允许只读查询",
    "是否禁止 scraping 或自动化访问",
    "是否允许价格数据展示",
    "是否允许税费展示",
    "是否允许 booking link 展示",
    "是否存在写入动作风险",
    "是否涉及身份资料上传",
    "是否涉及银行卡资料",
    "是否有数据保留要求",
    "是否有日志脱敏要求",
    "是否有 rate limit",
    "是否有 sandbox 文档",
    "是否有 provider 联系方式",
    "是否有 credential policy",
    "是否有 privacy policy"
  ];

  const blockedReasons = [
    "缺 API 文档阻断",
    "缺服务条款阻断",
    "缺只读授权阻断",
    "条款禁止自动访问阻断",
    "条款禁止价格展示阻断",
    "缺税费完整性阻断",
    "缺 source label 阻断",
    "缺 endpoint allowlist 阻断",
    "缺 sandbox evidence 阻断",
    "存在写入动作阻断",
    "存在 payment / checkout / order 动作阻断",
    "存在 identity upload 动作阻断",
    "存在银行卡字段阻断"
  ];

  const linkage = [
    "bookingUrl domain safety gate",
    "provider result source label gate",
    "price integrity / taxes / fees gate",
    "只读 provider result schema gate",
    "只读 provider sandbox gate",
    "provider endpoint allowlist gate",
    "API 绑定准备状态",
    "密钥脱敏规则",
    "本机安全存储"
  ];

  const commerceManualProviderReviewWorkflowContract = {
    version:MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
    moduleName:"manual_provider_review_workflow",
    phase:"manual_provider_review_workflow",
    workflowStatus:"draft_only",
    providerApprovalStatus:"none_approved",
    providerReviewStatus:"all_pending",
    manualApproval:"disabled",
    realProviderConnection:"disabled",
    realProviderSandbox:"disabled",
    realPrice:"disabled",
    bookingUrl:"disabled",
    capabilities:{
      canShowManualProviderReviewWorkflow:true,
      canShowProviderReviewObjectDraft:true,
      canShowReviewStateDraft:true,
      canShowManualChecklist:true,
      canShowBlockedReasons:true,
      canShowAuditDraft:true,
      canApproveProvider:false,
      canRejectProvider:false,
      canSubmitReview:false,
      canConnectRealProvider:false,
      canRunRealProviderSandbox:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      canUseNetwork:false,
      canConnectEndpoint:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false
    },
    display:{
      title:"manual provider review workflow",
      establishedLine:"manual provider review workflow：workflow 已建立",
      statusLine:"status: draft only",
      providerApprovalLine:"no provider approved",
      reviewPendingLine:"all provider review pending",
      manualApprovalLine:"manual approval disabled",
      providerConnectionLine:"real provider connection disabled",
      sandboxLine:"real provider sandbox disabled",
      priceLine:"real price disabled",
      bookingUrlLine:"bookingUrl disabled",
      noApprovedLine:"当前没有 provider 处于 approved_for_future_readonly",
      noApproveButtonLine:"UI 不提供 approve 按钮",
      noRejectButtonLine:"UI 不提供 reject 按钮",
      noSubmitReviewLine:"UI 不提供提交审查按钮",
      draftOnlyLine:"当前仅展示只读流程草案"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildManualProviderReviewObjectDraft(){
    return {
      version:MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
      fields:providerReviewObjectFields.slice(),
      currentStatus:"draft_only",
      redacted:true
    };
  }

  function buildManualProviderReviewStateDraft(){
    return {
      version:MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
      states:reviewStates.slice(),
      currentState:"not_started",
      approvedForFutureReadonlyCount:0,
      redacted:true
    };
  }

  function buildManualProviderReviewChecklistDraft(){
    return {
      version:MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
      checklist:manualChecklist.slice(),
      currentStatus:"all_pending",
      redacted:true
    };
  }

  function buildManualProviderReviewBlockedReasonsDraft(){
    return {
      version:MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
      blockedReasons:blockedReasons.slice(),
      currentBlockedReason:"manual_provider_review_workflow_draft_only",
      redacted:true
    };
  }

  function buildManualProviderReviewAuditDraft(){
    return {
      version:MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
      manualProviderReviewAuditDraft:{
        eventType:"MANUAL_PROVIDER_REVIEW_EVALUATION_DRAFT",
        schemaVersion:MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
        workflowState:"draft_only",
        providerId:"none",
        providerName:"none",
        manualReviewState:"not_started",
        blockedReason:"manual_provider_review_workflow_draft_only",
        reviewedAt:"none",
        reviewerRole:"none",
        redacted:true
      },
      allowedFields:["eventType", "schemaVersion", "workflowState", "providerId", "providerName", "manualReviewState", "blockedReason", "reviewedAt", "reviewerRole", "redacted"],
      forbiddenFields:["apiKey", "token", "secret", "raw provider payload", "bookingUrl", "paymentUrl", "checkoutUrl", "identity", "bankCard"],
      redacted:true
    };
  }

  function evaluateManualProviderReviewDraft(input){
    const data = input && typeof input === "object" ? input : {};
    const missing = ["providerId", "providerName", "apiDocsStatus", "termsStatus", "readonlyPermissionStatus", "sandboxEvidenceStatus"].filter(function(key){ return !data[key]; });
    return {
      version:MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
      allowed:false,
      workflowStatus:"draft_only",
      decision:"blocked",
      blockedReason:missing.length ? "missing_" + missing[0] : "manual_provider_review_workflow_draft_only",
      missingFields:missing,
      canApproveProvider:false,
      canSubmitReview:false,
      canConnectRealProvider:false,
      canUseNetwork:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      redacted:true
    };
  }

  function assertManualProviderReviewWorkflowSafe(workflow){
    const target = workflow && typeof workflow === "object" ? workflow : commerceManualProviderReviewWorkflowContract;
    const caps = target.capabilities || {};
    if (target.workflowStatus !== "draft_only") throw new Error("manual provider review workflow must stay draft only");
    [
      ["providerApprovalStatus", "none_approved"],
      ["providerReviewStatus", "all_pending"],
      ["manualApproval", "disabled"],
      ["realProviderConnection", "disabled"],
      ["realProviderSandbox", "disabled"],
      ["realPrice", "disabled"],
      ["bookingUrl", "disabled"]
    ].forEach(function(pair){
      if (target[pair[0]] !== pair[1]) throw new Error(pair[0] + " must be " + pair[1]);
    });
    [
      "canApproveProvider",
      "canRejectProvider",
      "canSubmitReview",
      "canConnectRealProvider",
      "canRunRealProviderSandbox",
      "canDisplayRealPrice",
      "canDisplayBookingUrl",
      "canUseNetwork",
      "canConnectEndpoint",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canInputApiKey",
      "canSaveApiKey",
      "canReadApiKey"
    ].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must be false");
    });
    const evaluation = evaluateManualProviderReviewDraft({ providerName:"draft", manualReviewState:"approved_for_future_readonly" });
    if (evaluation.allowed !== false || evaluation.canApproveProvider !== false || evaluation.canUseNetwork !== false) {
      throw new Error("manual provider review evaluation must remain blocked");
    }
    return true;
  }

  function buildManualProviderReviewWorkflowDisplay(workflow){
    const base = Object.assign({}, commerceManualProviderReviewWorkflowContract, workflow && typeof workflow === "object" ? workflow : {});
    return Object.assign({}, clone(base), {
      providerReviewObjectDraft:buildManualProviderReviewObjectDraft(),
      reviewStateDraft:buildManualProviderReviewStateDraft(),
      checklist:buildManualProviderReviewChecklistDraft(),
      blockedReasons:buildManualProviderReviewBlockedReasonsDraft(),
      audit:buildManualProviderReviewAuditDraft(),
      linkage:linkage.slice(),
      evaluation:evaluateManualProviderReviewDraft({})
    });
  }

  window.WeishanCommerceManualProviderReviewWorkflow = {
    MANUAL_PROVIDER_REVIEW_WORKFLOW_VERSION,
    commerceManualProviderReviewWorkflowContract,
    buildManualProviderReviewObjectDraft,
    buildManualProviderReviewStateDraft,
    buildManualProviderReviewChecklistDraft,
    buildManualProviderReviewBlockedReasonsDraft,
    buildManualProviderReviewAuditDraft,
    evaluateManualProviderReviewDraft,
    assertManualProviderReviewWorkflowSafe,
    buildManualProviderReviewWorkflowDisplay
  };
})();
