(function(){
  const READONLY_PROVIDER_SANDBOX_GATE_VERSION = "2.1.63";

  const readonlyScope = [
    "search_inventory",
    "read_price",
    "read_availability",
    "read_provider_source",
    "read_updated_at",
    "read_taxes_and_fees_if_provided",
    "read_baggage_or_shipping_or_refund_if_provided"
  ];

  const requestFields = [
    "providerId",
    "providerName",
    "providerCategory",
    "endpointAlias",
    "endpointHost",
    "requestPurpose",
    "readonlyScope",
    "queryType",
    "origin",
    "destination",
    "checkInDate",
    "checkOutDate",
    "departureDate",
    "returnDate",
    "passengers",
    "currency",
    "locale",
    "region",
    "providerSource",
    "requestedFields",
    "redactionMode",
    "auditMode"
  ];

  const requestForbiddenFields = [
    "apiKey",
    "apiSecret",
    "accessToken",
    "refreshToken",
    "authorization",
    "password",
    "passportNumber",
    "identityNumber",
    "bankCardNumber",
    "paymentToken",
    "orderPayload",
    "checkoutPayload"
  ];

  const responseFieldsAllowedFuture = [
    "providerId",
    "providerName",
    "providerCategory",
    "sourceType",
    "resultType",
    "title",
    "price",
    "currency",
    "taxesAndFees",
    "availability",
    "updatedAt",
    "baggageInfo",
    "refundPolicy",
    "shippingInfo",
    "sourceUrlHost",
    "providerReferenceId",
    "readonlyEvidence",
    "redacted: true",
    "sandboxOnly: true"
  ];

  const responseFieldsForbidden = [
    "bookingUrl",
    "checkoutUrl",
    "paymentUrl",
    "orderId",
    "paymentId",
    "passengerIdentity",
    "passportNumber",
    "bankCardNumber",
    "rawApiKey",
    "rawToken",
    "rawHeaders",
    "rawProviderPayloadWithSecrets"
  ];

  const allowedReadOnlyFields = [
    "providerId",
    "providerName",
    "providerCategory",
    "sourceType",
    "title",
    "price",
    "currency",
    "taxesAndFees",
    "availability",
    "updatedAt",
    "baggageInfo",
    "refundPolicy",
    "shippingInfo",
    "sourceUrlHost",
    "readonlyEvidence"
  ];

  const currentDisabledFields = [
    "price",
    "availability",
    "taxesAndFees",
    "baggageInfo",
    "refundPolicy",
    "shippingInfo"
  ];

  const alwaysForbiddenActions = [
    "create_order",
    "hold_booking",
    "submit_passenger_identity",
    "submit_passport",
    "submit_bank_card",
    "submit_payment",
    "auto_purchase",
    "auto_checkout",
    "write_user_data_to_provider",
    "upload_documents",
    "modify_provider_account",
    "cancel_order",
    "refund_order",
    "change_booking"
  ];

  const requiredBeforeSandboxRun = [
    "endpoint allowlist gate established",
    "endpoint manually reviewed",
    "provider terms reviewed",
    "API docs reviewed",
    "readonly scope reviewed",
    "key storage interface ready",
    "key redaction rules established",
    "lifecycle draft established",
    "audit events established",
    "manual approval completed"
  ];

  const currentMissingRequirements = [
    "endpoint manually reviewed",
    "provider terms reviewed",
    "API docs reviewed",
    "readonly scope reviewed",
    "key storage implementation",
    "real key not available",
    "endpoint connection disabled",
    "network disabled",
    "manual approval missing"
  ];

  const riskSignals = [
    "endpoint_not_manually_reviewed",
    "provider_terms_missing",
    "api_docs_missing",
    "readonly_scope_missing",
    "write_permission_detected",
    "order_permission_detected",
    "payment_permission_detected",
    "identity_upload_detected",
    "credential_in_url_detected",
    "auth_header_unredacted",
    "raw_provider_payload_contains_secret",
    "booking_url_present",
    "checkout_url_present",
    "payment_url_present",
    "price_without_source",
    "price_without_updated_at",
    "unknown_provider_source"
  ];

  const auditEvents = [
    "READONLY_SANDBOX_EVALUATION_DRAFT",
    "READONLY_SANDBOX_BLOCKED_GATE_CLOSED",
    "READONLY_SANDBOX_BLOCKED_ENDPOINT_NOT_REVIEWED",
    "READONLY_SANDBOX_BLOCKED_TERMS_NOT_REVIEWED",
    "READONLY_SANDBOX_BLOCKED_API_DOCS_NOT_REVIEWED",
    "READONLY_SANDBOX_BLOCKED_SCOPE_NOT_READONLY",
    "READONLY_SANDBOX_BLOCKED_NETWORK_DISABLED",
    "READONLY_SANDBOX_BLOCKED_SECRET_RISK",
    "READONLY_SANDBOX_BLOCKED_WRITE_ACTION",
    "READONLY_SANDBOX_BLOCKED_PAYMENT_ACTION",
    "READONLY_SANDBOX_BLOCKED_IDENTITY_UPLOAD",
    "READONLY_SANDBOX_SCHEMA_DRAFT_CREATED",
    "READONLY_SANDBOX_RESULT_BLOCKED"
  ];

  const auditRules = [
    "不记录真实 API key",
    "不记录 secret",
    "不记录 token",
    "不记录 authorization header",
    "不记录 credential query params",
    "不记录 raw provider payload",
    "不记录 passenger identity",
    "不记录 passport",
    "不记录 bank card",
    "只记录 providerId / endpointHost / decision / blockedReason / timestamp",
    "所有事件必须 redacted: true"
  ];

  const commerceReadonlyProviderSandboxGateContract = {
    version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
    moduleName:"readonly_provider_sandbox_gate",
    phase:"readonly_provider_sandbox_gate",
    gateStatus:"closed",
    sandboxStatus:"draft_only",
    realSandboxRun:"disabled",
    realProviderConnection:"disabled",
    realEndpointConnection:"disabled",
    realNetworkRequest:"disabled",
    realPriceRead:"disabled",
    realAvailabilityRead:"disabled",
    realBookingUrlRead:"disabled",
    realOrder:"forbidden",
    realPayment:"forbidden",
    realIdentityUpload:"forbidden",
    apiKeyInput:"disabled",
    apiKeyStorage:"disabled",
    apiKeyRead:"disabled",
    connectionTest:"disabled",
    capabilities:{
      canShowReadonlySandboxGate:true,
      canShowSandboxRequestDraft:true,
      canShowSandboxResponseDraft:true,
      canShowReadonlyFieldAllowlist:true,
      canShowWriteActionBlocklist:true,
      canShowSandboxRunConditions:true,
      canShowSandboxBlockedReasons:true,
      canShowSandboxRiskScan:true,
      canShowSandboxAuditEvents:true,
      canEvaluateSandboxDraft:true,
      canRunRealSandbox:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canTestConnection:false,
      canReturnPrice:false,
      canReturnAvailability:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false,
      canUseKeychain:false,
      canUseSafeStorage:false,
      canUseEncryptedLocalStore:false,
      canWriteEnv:false,
      canWriteLocalStorage:false,
      canWriteSessionStorage:false,
      canWriteLogs:false
    },
    display:{
      title:"只读 provider sandbox gate",
      establishedLine:"只读 provider sandbox gate：已建立",
      gateStatusLine:"gate 状态：关闭",
      sandboxStatusLine:"sandbox 状态：草案",
      realSandboxRunLine:"真实 sandbox 运行：未开放",
      realProviderConnectionLine:"真实 provider 连接：未开放",
      endpointConnectionLine:"真实 endpoint 连接：未开放",
      networkLine:"真实网络请求：未开放",
      priceLine:"真实价格读取：未开放",
      availabilityLine:"availability 读取：未开放",
      bookingUrlLine:"bookingUrl 读取：未开放",
      orderLine:"下单：禁止",
      paymentLine:"付款：禁止",
      identityLine:"身份上传：禁止",
      nextStepLine:"下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate",
      safetyLine:"当前版本仍不能运行真实 sandbox、不能连接真实 endpoint、不能联网、不能读取真实价格"
    }
  };

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function buildReadonlySandboxStageDraft(){
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      stages:[
        "endpoint_allowlist_required",
        "provider_terms_review_required",
        "api_docs_review_required",
        "readonly_scope_review_required",
        "sandbox_request_schema_required",
        "sandbox_response_schema_required",
        "field_mapping_required",
        "redaction_required",
        "audit_required",
        "manual_approval_required",
        "sandbox_ready",
        "sandbox_blocked"
      ],
      currentStage:"sandbox_blocked",
      stageStatus:{
        endpoint_allowlist_required:"established",
        provider_terms_review_required:"pending",
        api_docs_review_required:"pending",
        readonly_scope_review_required:"pending",
        sandbox_request_schema_required:"draft",
        sandbox_response_schema_required:"draft",
        field_mapping_required:"draft",
        redaction_required:"established",
        audit_required:"established",
        manual_approval_required:"pending",
        sandbox_ready:false,
        sandbox_blocked:true
      }
    };
  }

  function buildSandboxRequestDraft(){
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      requestFields:requestFields.slice(),
      readonlyScope:readonlyScope.slice(),
      requestForbiddenFields:requestForbiddenFields.slice(),
      canUseRealApiKey:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      redacted:true,
      draftOnly:true
    };
  }

  function buildSandboxResponseDraft(){
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      responseFieldsAllowedFuture:responseFieldsAllowedFuture.slice(),
      responseFieldsForbidden:responseFieldsForbidden.slice(),
      canReturnResponse:false,
      canReturnPrice:false,
      canReturnAvailability:false,
      canReturnBookingUrl:false,
      sandboxOnly:true,
      draftOnly:true,
      redacted:true
    };
  }

  function buildReadonlyFieldAllowlist(){
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      allowedReadOnlyFields:allowedReadOnlyFields.slice(),
      currentEnabledFields:["none"],
      currentDisabledFields:currentDisabledFields.slice(),
      note:"字段可在未来只读沙箱里读取，但当前版本仍全部禁用。"
    };
  }

  function buildWriteActionBlocklist(){
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      alwaysForbiddenActions:alwaysForbiddenActions.map((action) => ({ action, forbidden:true })),
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false
    };
  }

  function buildSandboxRunConditions(){
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      requiredBeforeSandboxRun:requiredBeforeSandboxRun.slice(),
      currentMissingRequirements:currentMissingRequirements.slice(),
      sandboxRunCurrentDecision:{
        allowed:false,
        decision:"blocked",
        reason:"readonly_provider_sandbox_gate_closed"
      }
    };
  }

  function buildSandboxRiskScanDraft(){
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      riskSignals:riskSignals.slice(),
      currentRiskLevel:"blocked",
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      redacted:true
    };
  }

  function buildSandboxAuditEventsDraft(){
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      auditStatus:"draft_only",
      events:auditEvents.slice(),
      auditRules:auditRules.slice(),
      redacted:true,
      allowedFields:["providerId", "endpointHost", "decision", "blockedReason", "timestamp"],
      forbiddenFields:["real API key", "secret", "token", "authorization header", "credential query params", "raw provider payload", "passenger identity", "passport", "bank card"]
    };
  }

  function evaluateReadonlyProviderSandboxGate(input){
    const data = input && typeof input === "object" ? input : {};
    return {
      version:READONLY_PROVIDER_SANDBOX_GATE_VERSION,
      providerId:String(data.providerId || "provider-draft"),
      endpointHost:String(data.endpointHost || ""),
      allowed:false,
      gateStatus:"closed",
      sandboxStatus:"draft_only",
      decision:"blocked",
      reason:"readonly_provider_sandbox_gate_closed",
      canRunRealSandbox:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnAvailability:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      nextStep:"readonly_provider_result_schema_gate",
      redacted:true
    };
  }

  function assertReadonlyProviderSandboxGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commerceReadonlyProviderSandboxGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "closed") throw new Error("readonly provider sandbox gate must stay closed");
    if (target.sandboxStatus !== "draft_only") throw new Error("readonly provider sandbox gate must stay draft only");
    [
      "canRunRealSandbox",
      "canConnectEndpoint",
      "canUseNetwork",
      "canTestConnection",
      "canReturnPrice",
      "canReturnAvailability",
      "canReturnBookingUrl",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canInputApiKey",
      "canSaveApiKey",
      "canReadApiKey",
      "canUseKeychain",
      "canUseSafeStorage",
      "canWriteEnv",
      "canWriteLocalStorage",
      "canWriteSessionStorage",
      "canWriteLogs"
    ].forEach((key) => {
      if (caps[key] !== false) throw new Error(key + " must be false");
    });
    const evaluation = evaluateReadonlyProviderSandboxGate({ providerId:"dummy", endpointHost:"example.invalid" });
    if (evaluation.allowed !== false || evaluation.decision !== "blocked" || evaluation.canUseNetwork !== false || evaluation.canReturnPrice !== false) {
      throw new Error("readonly provider sandbox evaluation must remain blocked");
    }
    return true;
  }

  function buildReadonlyProviderSandboxGateDisplay(gate){
    const base = Object.assign({}, commerceReadonlyProviderSandboxGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, base, {
      stageDraft:buildReadonlySandboxStageDraft(),
      requestDraft:buildSandboxRequestDraft(),
      responseDraft:buildSandboxResponseDraft(),
      fieldAllowlist:buildReadonlyFieldAllowlist(),
      writeActionBlocklist:buildWriteActionBlocklist(),
      runConditions:buildSandboxRunConditions(),
      riskScan:buildSandboxRiskScanDraft(),
      audit:buildSandboxAuditEventsDraft(),
      evaluation:evaluateReadonlyProviderSandboxGate({ providerId:"flight-provider-draft", endpointHost:"trip.com" })
    });
  }

  window.WeishanCommerceReadonlyProviderSandboxGate = {
    READONLY_PROVIDER_SANDBOX_GATE_VERSION,
    commerceReadonlyProviderSandboxGateContract,
    buildReadonlySandboxStageDraft,
    buildSandboxRequestDraft,
    buildSandboxResponseDraft,
    buildReadonlyFieldAllowlist,
    buildWriteActionBlocklist,
    buildSandboxRunConditions,
    buildSandboxRiskScanDraft,
    buildSandboxAuditEventsDraft,
    evaluateReadonlyProviderSandboxGate,
    assertReadonlyProviderSandboxGateSafe,
    buildReadonlyProviderSandboxGateDisplay
  };
})();
