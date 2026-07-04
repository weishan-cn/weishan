(function(){
  const PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION = "4.2.5";

  const sourceLabelRequiredFields = [
    "providerId",
    "providerName",
    "sourceType",
    "sourceUrlHost",
    "sourceHostDisplayName",
    "providerRegion",
    "updatedAt",
    "resultObservedAt",
    "readonlyEvidence",
    "evidenceType",
    "sourceTrustState",
    "redacted: true"
  ];

  const sourceTypesDraft = [
    "user_bound_api",
    "weishan_readonly_provider",
    "public_search",
    "manual_reviewed_source",
    "blocked_unknown_source",
    "no_provider"
  ];

  const visibleSourceLabelDraft = [
    "来源：未接入真实 provider",
    "Provider：未绑定 / 未连接",
    "Source host：未连接真实来源",
    "Updated at：无真实更新时间",
    "Evidence：readonlyEvidence draft only",
    "Trust state：closed / pending review"
  ];

  const sourceLabelBlockRules = [
    "缺 providerId 阻断",
    "缺 providerName 阻断",
    "缺 sourceUrlHost 阻断",
    "缺 updatedAt 阻断",
    "缺 readonlyEvidence 阻断",
    "unknown host 阻断",
    "short URL 阻断",
    "credential query params 阻断",
    "token / apiKey / secret 参数阻断",
    "raw provider URL with secrets 阻断",
    "raw provider payload 阻断"
  ];

  const sourceLabelLinkage = [
    "只读 provider result schema gate",
    "只读 provider sandbox gate",
    "provider endpoint allowlist gate",
    "key 生命周期",
    "密钥脱敏规则",
    "本机安全存储",
    "API 绑定准备状态"
  ];

  const commerceProviderResultSourceLabelGateContract = {
    version:PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
    moduleName:"provider_result_source_label_gate",
    phase:"provider_result_source_label_gate",
    gateStatus:"closed",
    mode:"draft_only",
    realProviderSourceLabel:"disabled",
    realProviderResultRead:"disabled",
    realNetwork:"disabled",
    realEndpointConnection:"disabled",
    realProviderConnection:"disabled",
    realPriceDisplay:"disabled",
    realAvailabilityDisplay:"disabled",
    realBookingUrlDisplay:"disabled",
    rawProviderPayloadDisplay:"forbidden",
    capabilities:{
      canShowSourceLabelGate:true,
      canShowRequiredFieldsDraft:true,
      canShowSourceTypeDraft:true,
      canShowVisibleLabelDraft:true,
      canShowBlockRules:true,
      canShowAuditDraft:true,
      canShowGateLinkage:true,
      canReadRealProviderResult:false,
      canDisplayRealSourceLabel:false,
      canUseNetwork:false,
      canConnectEndpoint:false,
      canDisplayRealPrice:false,
      canDisplayRealAvailability:false,
      canDisplayBookingUrl:false,
      canDisplayRawProviderPayload:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false
    },
    display:{
      title:"provider result source label gate",
      establishedLine:"provider result source label gate：已建立",
      gateStatusLine:"gate 状态：关闭 / closed",
      modeLine:"mode: draft only",
      sourceLabelLine:"real provider source label 未开放",
      providerResultLine:"real provider result 未读取",
      networkLine:"real network disabled",
      safetyLine:"当前版本仍不读取真实 provider result，不显示真实来源标签，不联网，不显示真实价格。"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildProviderResultSourceLabelRequiredFieldsDraft(){
    return {
      version:PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
      requiredFields:sourceLabelRequiredFields.slice(),
      currentStatus:"draft_only",
      redacted:true
    };
  }

  function buildProviderResultSourceTypeDraft(){
    return {
      version:PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
      sourceTypes:sourceTypesDraft.slice(),
      currentEnabledTypes:["no_provider"],
      currentBlockedTypes:["user_bound_api", "weishan_readonly_provider", "public_search", "manual_reviewed_source", "blocked_unknown_source"],
      redacted:true
    };
  }

  function buildProviderResultVisibleSourceLabelDraft(){
    return {
      version:PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
      labels:visibleSourceLabelDraft.slice(),
      currentStatus:"no_real_provider_connected",
      redacted:true
    };
  }

  function buildProviderResultSourceLabelBlockRules(){
    return {
      version:PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
      rules:sourceLabelBlockRules.slice(),
      unknownHost:"blocked",
      shortUrl:"blocked",
      credentialQueryParams:"blocked",
      rawProviderPayload:"blocked",
      redacted:true
    };
  }

  function buildProviderResultSourceLabelAuditDraft(){
    return {
      version:PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
      sourceLabelAuditDraft:{
        eventType:"SOURCE_LABEL_GATE_EVALUATION_DRAFT",
        schemaVersion:PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
        gateState:"closed",
        blockedReason:"source_label_gate_closed",
        sourceUrlHost:"none",
        resultObservedAt:"none",
        redacted:true
      },
      allowedFields:["eventType", "schemaVersion", "gateState", "blockedReason", "sourceUrlHost", "resultObservedAt", "redacted"],
      forbiddenFields:["raw provider URL with secrets", "raw provider payload", "apiKey", "token", "secret", "authorization header"],
      redacted:true
    };
  }

  function evaluateProviderResultSourceLabelDraft(input){
    const data = input && typeof input === "object" ? input : {};
    const missing = ["providerId", "providerName", "sourceUrlHost", "updatedAt", "readonlyEvidence"].filter(function(key){ return !data[key]; });
    return {
      version:PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
      allowed:false,
      gateStatus:"closed",
      mode:"draft_only",
      decision:"blocked",
      blockedReason:missing.length ? "missing_" + missing[0] : "provider_result_source_label_gate_closed",
      missingFields:missing,
      canReadRealProviderResult:false,
      canUseNetwork:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      redacted:true
    };
  }

  function assertProviderResultSourceLabelGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commerceProviderResultSourceLabelGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "closed") throw new Error("provider result source label gate must stay closed");
    if (target.mode !== "draft_only") throw new Error("provider result source label gate must stay draft only");
    [
      ["realProviderSourceLabel", "disabled"],
      ["realProviderResultRead", "disabled"],
      ["realNetwork", "disabled"],
      ["realEndpointConnection", "disabled"],
      ["realProviderConnection", "disabled"],
      ["realPriceDisplay", "disabled"],
      ["realAvailabilityDisplay", "disabled"],
      ["realBookingUrlDisplay", "disabled"],
      ["rawProviderPayloadDisplay", "forbidden"]
    ].forEach(function(pair){
      if (target[pair[0]] !== pair[1]) throw new Error(pair[0] + " must be " + pair[1]);
    });
    [
      "canReadRealProviderResult",
      "canDisplayRealSourceLabel",
      "canUseNetwork",
      "canConnectEndpoint",
      "canDisplayRealPrice",
      "canDisplayRealAvailability",
      "canDisplayBookingUrl",
      "canDisplayRawProviderPayload",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canInputApiKey",
      "canSaveApiKey",
      "canReadApiKey"
    ].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must be false");
    });
    const evaluation = evaluateProviderResultSourceLabelDraft({ providerName:"draft" });
    if (evaluation.allowed !== false || evaluation.canUseNetwork !== false || evaluation.canDisplayBookingUrl !== false) {
      throw new Error("provider result source label evaluation must remain blocked");
    }
    return true;
  }

  function buildProviderResultSourceLabelGateDisplay(gate){
    const base = Object.assign({}, commerceProviderResultSourceLabelGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, clone(base), {
      requiredFieldsDraft:buildProviderResultSourceLabelRequiredFieldsDraft(),
      sourceTypeDraft:buildProviderResultSourceTypeDraft(),
      visibleSourceLabelDraft:buildProviderResultVisibleSourceLabelDraft(),
      blockRules:buildProviderResultSourceLabelBlockRules(),
      audit:buildProviderResultSourceLabelAuditDraft(),
      linkage:sourceLabelLinkage.slice(),
      evaluation:evaluateProviderResultSourceLabelDraft({})
    });
  }

  window.WeishanCommerceProviderResultSourceLabelGate = {
    PROVIDER_RESULT_SOURCE_LABEL_GATE_VERSION,
    commerceProviderResultSourceLabelGateContract,
    buildProviderResultSourceLabelRequiredFieldsDraft,
    buildProviderResultSourceTypeDraft,
    buildProviderResultVisibleSourceLabelDraft,
    buildProviderResultSourceLabelBlockRules,
    buildProviderResultSourceLabelAuditDraft,
    evaluateProviderResultSourceLabelDraft,
    assertProviderResultSourceLabelGateSafe,
    buildProviderResultSourceLabelGateDisplay
  };
})();
