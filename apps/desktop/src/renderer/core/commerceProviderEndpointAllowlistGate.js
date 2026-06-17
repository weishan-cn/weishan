(function(){
  const ALLOWLIST_GATE_VERSION = "2.1.0";

  const providerCategories = {
    flightProviders:["Google Flights", "Trip.com / 携程", "Skyscanner", "Kayak", "Expedia"],
    hotelProviders:["Booking", "Agoda", "Trip.com / 携程"],
    commerceProviders:["Amazon", "eBay", "Walmart", "京东", "淘宝", "天猫", "拼多多"],
    localServiceProviders:["本地服务候选平台"]
  };

  const candidateDomains = [
    { domain:"google.com/travel/flights", status:"external_search_only", endpointType:"not_api_endpoint" },
    { domain:"trip.com", status:"candidate_domain_unverified" },
    { domain:"skyscanner.com", status:"candidate_domain_unverified" },
    { domain:"kayak.com", status:"candidate_domain_unverified" },
    { domain:"expediagroup.com", status:"candidate_partner_domain_unverified" },
    { domain:"booking.com", status:"candidate_domain_unverified" },
    { domain:"amazon.com", status:"candidate_domain_unverified" },
    { domain:"ebay.com", status:"candidate_domain_unverified" },
    { domain:"walmart.com", status:"candidate_domain_unverified" },
    { domain:"jd.com", status:"candidate_domain_unverified" },
    { domain:"taobao.com", status:"candidate_domain_unverified" },
    { domain:"tmall.com", status:"candidate_domain_unverified" },
    { domain:"pinduoduo.com", status:"candidate_domain_unverified" }
  ];

  const blockedEndpointRules = [
    "non_https",
    "ip_address_endpoint",
    "localhost_endpoint",
    "127.0.0.1_endpoint",
    "0.0.0.0_endpoint",
    "short_url",
    "unknown_domain",
    "suspicious_typo_domain",
    "credential_query_params",
    "api_key query params",
    "token query params",
    "secret query params",
    "password query params",
    "not_allowlisted",
    "manual_review_required",
    "terms_review_missing",
    "api_docs_review_missing",
    "readonly_review_missing",
    "payment_endpoint_blocked",
    "order_endpoint_blocked",
    "identity_upload_endpoint_blocked"
  ];

  const riskSignals = [
    "non_https",
    "ip_address_endpoint",
    "localhost_endpoint",
    "unknown_domain",
    "short_url",
    "suspicious_typo_domain",
    "credential_query_params",
    "auth_header_required",
    "write_permission_required",
    "order_permission_required",
    "payment_permission_required",
    "identity_upload_required",
    "missing_api_docs_review",
    "missing_terms_review",
    "missing_manual_approval"
  ];

  const readonlyAllowedFutureActions = [
    "search inventory",
    "read price",
    "read availability",
    "read provider source",
    "read updatedAt",
    "read taxes / fees",
    "read baggage / shipping / refund fields"
  ];

  const readonlyForbiddenActions = [
    "create order",
    "hold booking",
    "submit passenger identity",
    "submit passport",
    "submit bank card",
    "submit payment",
    "auto purchase",
    "auto checkout",
    "write user data to provider",
    "upload documents"
  ];

  const auditEvents = [
    "ENDPOINT_EVALUATION_DRAFT",
    "ENDPOINT_BLOCKED_NOT_HTTPS",
    "ENDPOINT_BLOCKED_IP_ADDRESS",
    "ENDPOINT_BLOCKED_LOCALHOST",
    "ENDPOINT_BLOCKED_SHORT_URL",
    "ENDPOINT_BLOCKED_UNKNOWN_DOMAIN",
    "ENDPOINT_BLOCKED_CREDENTIAL_QUERY",
    "ENDPOINT_BLOCKED_NOT_ALLOWLISTED",
    "ENDPOINT_BLOCKED_MANUAL_REVIEW_REQUIRED",
    "ENDPOINT_BLOCKED_WRITE_PERMISSION",
    "ENDPOINT_BLOCKED_ORDER_PERMISSION",
    "ENDPOINT_BLOCKED_PAYMENT_PERMISSION",
    "ENDPOINT_BLOCKED_IDENTITY_UPLOAD",
    "PROVIDER_READONLY_GATE_BLOCKED",
    "PROVIDER_SANDBOX_GATE_PENDING"
  ];

  const auditRules = [
    "不记录真实 API key",
    "不记录 secret",
    "不记录 token",
    "不记录 authorization header",
    "不记录 credential query params",
    "endpoint URL 记录前必须脱敏",
    "只记录 providerId / hostname / decision / blockedReason / timestamp",
    "所有事件必须 redacted: true"
  ];

  const providerDefaultStatus = {
    endpointStatus:"draft_only",
    officialDomainVerified:false,
    apiDocsReviewed:false,
    termsReviewed:false,
    networkEnabled:false,
    canConnect:false,
    canReturnPrice:false,
    canReturnBookingUrl:false,
    canCreateOrder:false,
    canPay:false
  };

  const commerceProviderEndpointAllowlistGateContract = {
    gateVersion:ALLOWLIST_GATE_VERSION,
    phase:"provider_endpoint_allowlist_gate",
    gateStatus:"closed",
    allowlistStatus:"draft",
    endpointConnection:"disabled",
    networkMode:"disabled",
    providerSandbox:"disabled",
    realPrice:"disabled",
    bookingUrl:"disabled",
    orderMode:"disabled",
    paymentMode:"disabled",
    identityUpload:"disabled",
    capabilities:{
      canBuildAllowlistDraft:true,
      canNormalizeEndpointDraft:true,
      canEvaluateEndpointDraft:true,
      canScanEndpointRiskDraft:true,
      canBuildReadonlyGateDraft:true,
      canBuildAuditEventsDraft:true,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false,
      canConnectRealEndpoint:false,
      canTestConnection:false,
      canUseNetwork:false,
      canUseProviderSandbox:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false
    },
    display:{
      title:"provider endpoint allowlist 闸门",
      establishedLine:"endpoint allowlist 闸门：已建立",
      gateStatusLine:"闸门状态：关闭",
      allowlistStatusLine:"allowlist 状态：草案",
      endpointConnectionLine:"真实 endpoint 连接：未开放",
      networkLine:"真实网络请求：未开放",
      providerSandboxLine:"provider sandbox：未开放",
      priceLine:"真实价格读取：未开放",
      bookingUrlLine:"bookingUrl 读取：未开放",
      orderLine:"下单：禁止",
      paymentLine:"付款：禁止",
      identityLine:"身份上传：禁止",
      nextStepLine:"下一步：只读 provider sandbox gate",
      safetyLine:"当前版本仍不能连接真实 endpoint、不能测试连接、不能联网、不能读取真实价格"
    }
  };

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function buildProviderEndpointCategoriesDraft(){
    return clone(providerCategories);
  }

  function buildProviderAllowedDomainDraft(){
    return candidateDomains.map((item) => Object.assign({}, item, providerDefaultStatus));
  }

  function buildBlockedEndpointRules(){
    return blockedEndpointRules.slice();
  }

  function normalizeEndpointDraft(url){
    const raw = String(url || "").trim();
    const sanitized = raw.replace(/([?&](?:api_key|token|secret|password|access_token|refresh_token)=)[^&#]*/gi, "$1[REDACTED_CREDENTIAL_PARAMS]");
    let parsed = null;
    try { parsed = raw ? new URL(raw) : null; } catch (err) { parsed = null; }
    const hostname = parsed ? parsed.hostname.toLowerCase() : "";
    const isHttps = parsed ? parsed.protocol === "https:" : false;
    const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
    const hasCredentialQueryParams = /[?&](api_key|token|secret|password|access_token|refresh_token)=/i.test(raw);
    return {
      rawInputPresent:!!raw,
      sanitizedUrl:sanitized,
      hostname,
      protocol:parsed ? parsed.protocol.replace(":", "") : "",
      isHttps,
      isIp,
      isLocalhost,
      hasCredentialQueryParams,
      normalizedForAudit:{ hostname, redacted:true }
    };
  }

  function evaluateProviderEndpointAllowlistDraft(input){
    const data = input && typeof input === "object" ? input : {};
    const normalized = normalizeEndpointDraft(data.endpointUrl || data.url || "");
    const blockedReasons = [];
    if (!normalized.isHttps) blockedReasons.push("ENDPOINT_BLOCKED_NOT_HTTPS");
    if (normalized.isIp) blockedReasons.push("ENDPOINT_BLOCKED_IP_ADDRESS");
    if (normalized.isLocalhost) blockedReasons.push("ENDPOINT_BLOCKED_LOCALHOST");
    if (normalized.hasCredentialQueryParams) blockedReasons.push("ENDPOINT_BLOCKED_CREDENTIAL_QUERY");
    blockedReasons.push("ENDPOINT_BLOCKED_NOT_ALLOWLISTED", "ENDPOINT_BLOCKED_MANUAL_REVIEW_REQUIRED", "PROVIDER_READONLY_GATE_BLOCKED", "PROVIDER_SANDBOX_GATE_PENDING");
    return {
      gateVersion:ALLOWLIST_GATE_VERSION,
      providerId:String(data.providerId || "provider-draft"),
      decision:"blocked",
      endpointStatus:"draft_only",
      normalized,
      blockedReasons:Array.from(new Set(blockedReasons)),
      canConnect:false,
      canUseNetwork:false,
      canTestConnection:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      redacted:true
    };
  }

  function buildEndpointRiskScanDraft(){
    return {
      scanVersion:ALLOWLIST_GATE_VERSION,
      scanStatus:"draft_only",
      riskSignals:riskSignals.slice(),
      canUseNetwork:false,
      canReadApiKey:false,
      canConnectEndpoint:false,
      redacted:true
    };
  }

  function buildProviderReadOnlyGateDraft(){
    return {
      gateVersion:ALLOWLIST_GATE_VERSION,
      gateStatus:"blocked",
      allowedFutureActions:readonlyAllowedFutureActions.slice(),
      forbiddenActions:readonlyForbiddenActions.slice(),
      canUseProviderSandbox:false,
      canConnectRealEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false
    };
  }

  function buildProviderEndpointAuditEventsDraft(){
    return {
      auditVersion:ALLOWLIST_GATE_VERSION,
      auditStatus:"draft_only",
      events:auditEvents.slice(),
      rules:auditRules.slice(),
      redacted:true,
      allowedFields:["providerId", "hostname", "decision", "blockedReason", "timestamp"],
      forbiddenFields:["real API key", "secret", "token", "authorization header", "credential query params"]
    };
  }

  function assertProviderEndpointAllowlistGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commerceProviderEndpointAllowlistGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "closed") throw new Error("provider endpoint allowlist gate must stay closed");
    if (target.allowlistStatus !== "draft") throw new Error("provider endpoint allowlist must stay draft");
    ["canInputApiKey", "canSaveApiKey", "canReadApiKey", "canConnectRealEndpoint", "canTestConnection", "canUseNetwork", "canUseProviderSandbox", "canReturnPrice", "canReturnBookingUrl", "canCreateOrder", "canPay", "canUploadIdentity"].forEach((key) => {
      if (caps[key] !== false) throw new Error(key + " must be false");
    });
    const evaluation = evaluateProviderEndpointAllowlistDraft({ endpointUrl:"https://example.invalid/api?api_key=dummy" });
    if (evaluation.decision !== "blocked" || evaluation.canUseNetwork !== false || evaluation.canReturnPrice !== false || evaluation.canReturnBookingUrl !== false) {
      throw new Error("endpoint evaluation must remain blocked");
    }
    return true;
  }

  function buildProviderEndpointAllowlistGateDisplay(gate){
    const base = Object.assign({}, commerceProviderEndpointAllowlistGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, base, {
      categories:buildProviderEndpointCategoriesDraft(),
      candidateDomains:buildProviderAllowedDomainDraft(),
      blockedRules:buildBlockedEndpointRules(),
      riskScan:buildEndpointRiskScanDraft(),
      readonlyGate:buildProviderReadOnlyGateDraft(),
      audit:buildProviderEndpointAuditEventsDraft(),
      sampleEvaluation:evaluateProviderEndpointAllowlistDraft({ providerId:"flight-provider-draft", endpointUrl:"https://trip.com/api/search?api_key=dummy" })
    });
  }

  window.WeishanCommerceProviderEndpointAllowlistGate = {
    ALLOWLIST_GATE_VERSION,
    commerceProviderEndpointAllowlistGateContract,
    buildProviderEndpointCategoriesDraft,
    buildProviderAllowedDomainDraft,
    buildBlockedEndpointRules,
    normalizeEndpointDraft,
    evaluateProviderEndpointAllowlistDraft,
    buildEndpointRiskScanDraft,
    buildProviderReadOnlyGateDraft,
    buildProviderEndpointAuditEventsDraft,
    assertProviderEndpointAllowlistGateSafe,
    buildProviderEndpointAllowlistGateDisplay
  };
})();
