(function(){
  const BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION = "4.1.4";

  const bookingUrlSafetyFields = [
    "providerId",
    "providerName",
    "sourceUrlHost",
    "sourceHostDisplayName",
    "bookingUrlHost",
    "bookingUrlPathCategory",
    "redirectChainHostList",
    "urlScheme",
    "linkIntent",
    "reviewState",
    "updatedAt",
    "readonlyEvidence",
    "redacted: true"
  ];

  const domainSafetyRules = [
    "只允许 https",
    "必须 exact host match",
    "必须匹配 provider endpoint allowlist gate",
    "必须匹配 provider result source label gate",
    "unknown host 阻断",
    "short URL 阻断",
    "redirect chain 阻断",
    "credential query params 阻断",
    "token / apiKey / secret 参数阻断",
    "PII query params 阻断",
    "passport / identity / passenger 参数阻断",
    "payment path 阻断",
    "checkout path 阻断",
    "order path 阻断",
    "identity upload path 阻断",
    "non-https 阻断",
    "localhost 阻断",
    "private IP 阻断",
    "IP literal host 阻断",
    "unicode homograph / punycode risk 阻断",
    "raw provider payload 阻断"
  ];

  const forbiddenUrlTypes = [
    "bookingUrl 当前禁止展示",
    "checkoutUrl 始终禁止",
    "paymentUrl 始终禁止",
    "orderUrl 始终禁止",
    "identityUploadUrl 始终禁止",
    "passengerFormUrl 始终禁止",
    "bankCardFormUrl 始终禁止",
    "providerWriteActionUrl 始终禁止",
    "rawProviderUrlWithSecrets 始终禁止"
  ];

  const visiblePolicy = [
    "当前版本不显示真实 bookingUrl",
    "当前版本不生成 bookingUrl",
    "当前版本不提供预订按钮",
    "当前版本不提供付款按钮",
    "当前版本不提供下单按钮",
    "当前版本只允许外部搜索入口保持人工跳转",
    "外部搜索入口不得自动点击",
    "外部搜索入口不得伪装为 provider bookingUrl"
  ];

  const riskScan = [
    "bookingUrlRiskScanDraft",
    "nonHttpsDetected",
    "unknownHostDetected",
    "shortUrlDetected",
    "redirectChainDetected",
    "credentialParamsDetected",
    "piiParamsDetected",
    "paymentPathDetected",
    "checkoutPathDetected",
    "orderPathDetected",
    "identityPathDetected",
    "rawProviderPayloadDetected",
    "redacted: true"
  ];

  const linkage = [
    "provider result source label gate",
    "price integrity / taxes / fees gate",
    "只读 provider result schema gate",
    "只读 provider sandbox gate",
    "provider endpoint allowlist gate",
    "key 生命周期",
    "密钥脱敏规则",
    "本机安全存储",
    "API 绑定准备状态",
    "manual provider review workflow"
  ];

  const commerceBookingUrlDomainSafetyGateContract = {
    version:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
    moduleName:"booking_url_domain_safety_gate",
    phase:"booking_url_domain_safety_gate",
    gateStatus:"closed",
    mode:"draft_only",
    bookingUrlDisplay:"disabled",
    bookingUrlGeneration:"disabled",
    bookingUrlClick:"disabled",
    redirectFollow:"disabled",
    realProviderBookingLink:"disabled",
    realNetwork:"disabled",
    orderMode:"forbidden",
    paymentMode:"forbidden",
    checkoutMode:"forbidden",
    capabilities:{
      canShowBookingUrlDomainSafetyGate:true,
      canShowFutureSafetyFields:true,
      canShowDomainSafetyRules:true,
      canShowForbiddenUrlTypes:true,
      canShowVisiblePolicy:true,
      canShowRiskScanDraft:true,
      canShowAuditDraft:true,
      canDisplayBookingUrl:false,
      canGenerateBookingUrl:false,
      canClickBookingUrl:false,
      canFollowRedirect:false,
      canUseRealProviderBookingLink:false,
      canUseNetwork:false,
      canConnectEndpoint:false,
      canCreateOrder:false,
      canPay:false,
      canCheckout:false,
      canUploadIdentity:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false
    },
    display:{
      title:"bookingUrl domain safety gate",
      establishedLine:"bookingUrl domain safety gate：gate 已建立",
      gateStatusLine:"status: closed",
      modeLine:"mode: draft only",
      bookingUrlDisplayLine:"bookingUrl display disabled",
      bookingUrlGenerationLine:"bookingUrl generation disabled",
      bookingUrlClickLine:"bookingUrl click disabled",
      redirectFollowLine:"redirect follow disabled",
      providerBookingLinkLine:"real provider booking link disabled",
      networkLine:"real network disabled",
      safetyLine:"no order / no payment / no checkout"
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildBookingUrlSafetyFieldsDraft(){
    return {
      version:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
      fields:bookingUrlSafetyFields.slice(),
      currentStatus:"draft_only",
      redacted:true
    };
  }

  function buildBookingUrlDomainSafetyRulesDraft(){
    return {
      version:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
      rules:domainSafetyRules.slice(),
      httpsOnly:true,
      exactHostMatchRequired:true,
      allowlistGateRequired:true,
      sourceLabelGateRequired:true,
      redacted:true
    };
  }

  function buildBookingUrlForbiddenUrlTypesDraft(){
    return {
      version:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
      forbiddenUrlTypes:forbiddenUrlTypes.slice(),
      currentStatus:"all_blocked",
      redacted:true
    };
  }

  function buildBookingUrlVisiblePolicyDraft(){
    return {
      version:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
      policy:visiblePolicy.slice(),
      externalSearchManualOnly:true,
      redacted:true
    };
  }

  function buildBookingUrlRiskScanDraft(){
    return {
      version:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
      bookingUrlRiskScanDraft:riskScan.slice(),
      currentRiskLevel:"blocked",
      redacted:true
    };
  }

  function buildBookingUrlSafetyAuditDraft(){
    return {
      version:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
      bookingUrlSafetyAuditDraft:{
        eventType:"BOOKING_URL_DOMAIN_SAFETY_EVALUATION_DRAFT",
        schemaVersion:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
        gateState:"closed",
        blockedReason:"booking_url_domain_safety_gate_closed",
        bookingUrlHost:"none",
        sourceUrlHost:"none",
        linkIntent:"none",
        resultObservedAt:"none",
        redacted:true
      },
      allowedFields:["eventType", "schemaVersion", "gateState", "blockedReason", "bookingUrlHost", "sourceUrlHost", "linkIntent", "resultObservedAt", "redacted"],
      forbiddenFields:["rawProviderUrlWithSecrets", "bookingUrl", "checkoutUrl", "paymentUrl", "orderUrl", "apiKey", "token", "secret", "identity"],
      redacted:true
    };
  }

  function evaluateBookingUrlDomainSafetyDraft(input){
    const data = input && typeof input === "object" ? input : {};
    const missing = ["providerId", "providerName", "sourceUrlHost", "bookingUrlHost", "readonlyEvidence"].filter(function(key){ return !data[key]; });
    return {
      version:BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
      allowed:false,
      gateStatus:"closed",
      mode:"draft_only",
      decision:"blocked",
      blockedReason:missing.length ? "missing_" + missing[0] : "booking_url_domain_safety_gate_closed",
      missingFields:missing,
      canDisplayBookingUrl:false,
      canGenerateBookingUrl:false,
      canClickBookingUrl:false,
      canUseNetwork:false,
      canCreateOrder:false,
      canPay:false,
      redacted:true
    };
  }

  function assertBookingUrlDomainSafetyGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commerceBookingUrlDomainSafetyGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "closed") throw new Error("bookingUrl domain safety gate must stay closed");
    if (target.mode !== "draft_only") throw new Error("bookingUrl domain safety gate must stay draft only");
    [
      ["bookingUrlDisplay", "disabled"],
      ["bookingUrlGeneration", "disabled"],
      ["bookingUrlClick", "disabled"],
      ["redirectFollow", "disabled"],
      ["realProviderBookingLink", "disabled"],
      ["realNetwork", "disabled"],
      ["orderMode", "forbidden"],
      ["paymentMode", "forbidden"],
      ["checkoutMode", "forbidden"]
    ].forEach(function(pair){
      if (target[pair[0]] !== pair[1]) throw new Error(pair[0] + " must be " + pair[1]);
    });
    [
      "canDisplayBookingUrl",
      "canGenerateBookingUrl",
      "canClickBookingUrl",
      "canFollowRedirect",
      "canUseRealProviderBookingLink",
      "canUseNetwork",
      "canConnectEndpoint",
      "canCreateOrder",
      "canPay",
      "canCheckout",
      "canUploadIdentity",
      "canInputApiKey",
      "canSaveApiKey",
      "canReadApiKey"
    ].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must be false");
    });
    const evaluation = evaluateBookingUrlDomainSafetyDraft({ providerName:"draft", bookingUrl:"https://example.invalid/checkout?token=secret" });
    if (evaluation.allowed !== false || evaluation.canDisplayBookingUrl !== false || evaluation.canUseNetwork !== false) {
      throw new Error("bookingUrl domain safety evaluation must remain blocked");
    }
    return true;
  }

  function buildBookingUrlDomainSafetyGateDisplay(gate){
    const base = Object.assign({}, commerceBookingUrlDomainSafetyGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, clone(base), {
      safetyFieldsDraft:buildBookingUrlSafetyFieldsDraft(),
      domainSafetyRules:buildBookingUrlDomainSafetyRulesDraft(),
      forbiddenUrlTypes:buildBookingUrlForbiddenUrlTypesDraft(),
      visiblePolicy:buildBookingUrlVisiblePolicyDraft(),
      riskScan:buildBookingUrlRiskScanDraft(),
      audit:buildBookingUrlSafetyAuditDraft(),
      linkage:linkage.slice(),
      evaluation:evaluateBookingUrlDomainSafetyDraft({})
    });
  }

  window.WeishanCommerceBookingUrlDomainSafetyGate = {
    BOOKING_URL_DOMAIN_SAFETY_GATE_VERSION,
    commerceBookingUrlDomainSafetyGateContract,
    buildBookingUrlSafetyFieldsDraft,
    buildBookingUrlDomainSafetyRulesDraft,
    buildBookingUrlForbiddenUrlTypesDraft,
    buildBookingUrlVisiblePolicyDraft,
    buildBookingUrlRiskScanDraft,
    buildBookingUrlSafetyAuditDraft,
    evaluateBookingUrlDomainSafetyDraft,
    assertBookingUrlDomainSafetyGateSafe,
    buildBookingUrlDomainSafetyGateDisplay
  };
})();
