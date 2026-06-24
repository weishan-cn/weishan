(function(){
  const READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION = "2.1.81";

  const resultTypes = [
    "flight_offer",
    "hotel_offer",
    "product_offer",
    "local_service_offer",
    "ticket_offer",
    "provider_notice",
    "no_result",
    "blocked_result",
    "schema_error"
  ];

  const commonAllowedFields = [
    "resultId",
    "resultType",
    "providerId",
    "providerName",
    "providerCategory",
    "sourceType",
    "sourceUrlHost",
    "title",
    "description",
    "currency",
    "price",
    "priceDisplayMode",
    "taxesAndFees",
    "totalPrice",
    "availability",
    "updatedAt",
    "providerReferenceId",
    "readonlyEvidence",
    "riskLevel",
    "redacted",
    "sandboxOnly",
    "draftOnly"
  ];

  const flightAllowedFields = [
    "origin",
    "destination",
    "departureDate",
    "returnDate",
    "carrierName",
    "flightNumber",
    "cabinClass",
    "baggageInfo",
    "refundPolicy",
    "duration",
    "stops"
  ];

  const hotelAllowedFields = [
    "city",
    "checkInDate",
    "checkOutDate",
    "hotelName",
    "roomType",
    "cancellationPolicy",
    "breakfastIncluded",
    "locationSummary"
  ];

  const productAllowedFields = [
    "productName",
    "brand",
    "model",
    "specs",
    "shippingInfo",
    "sellerName",
    "warrantyInfo"
  ];

  const localServiceAllowedFields = [
    "serviceName",
    "locationSummary",
    "availableDate",
    "timeSlot",
    "ticketType",
    "refundPolicy"
  ];

  const currentDisabledFields = [
    "price",
    "totalPrice",
    "taxesAndFees",
    "availability",
    "bookingUrl",
    "sourceUrl",
    "rawProviderPayload"
  ];

  const alwaysForbiddenFields = [
    "bookingUrl",
    "checkoutUrl",
    "paymentUrl",
    "orderUrl",
    "createOrderUrl",
    "holdBookingUrl",
    "passengerIdentity",
    "passportNumber",
    "identityNumber",
    "bankCardNumber",
    "paymentToken",
    "rawApiKey",
    "rawSecret",
    "rawToken",
    "rawHeaders",
    "rawRequest",
    "rawResponse",
    "rawProviderPayload",
    "rawProviderPayloadWithSecrets",
    "providerAuth",
    "authorizationHeader",
    "credentialQueryParams"
  ];

  const sourceBlockedIf = [
    "providerId 缺失：阻断",
    "providerName 缺失：阻断",
    "sourceUrlHost 缺失：阻断",
    "updatedAt 缺失：阻断",
    "readonlyEvidence 缺失：阻断",
    "sourceUrlHost 不在 allowlist 草案内：阻断",
    "provider 未人工审查：阻断",
    "endpoint 未人工审查：阻断",
    "result 来自 raw AI 估算：阻断",
    "result 来自未知网站：阻断",
    "result 来自短链接：阻断"
  ];

  const bookingUrlAlwaysForbiddenIf = [
    "unknown domain：阻断",
    "short URL：阻断",
    "credential query params：阻断",
    "payment URL：阻断",
    "checkout URL：阻断",
    "create order URL：阻断",
    "identity upload URL：阻断",
    "auto purchase URL：阻断"
  ];

  const riskSignals = [
    "result_missing_provider_id",
    "result_missing_provider_name",
    "source_url_host_missing",
    "updated_at_missing",
    "readonly_evidence_missing",
    "source_host_not_allowlisted",
    "result_from_unknown_site",
    "result_from_short_url",
    "result_from_raw_ai_estimate",
    "price_is_estimated",
    "price_is_mock",
    "price_is_demo",
    "price_is_fake",
    "booking_url_present",
    "raw_payload_present",
    "payment_field_present",
    "order_field_present",
    "passenger_identity_present",
    "bank_card_present"
  ];

  const auditEvents = [
    "READONLY_RESULT_SCHEMA_EVALUATION_DRAFT",
    "READONLY_RESULT_BLOCKED_GATE_CLOSED",
    "READONLY_RESULT_BLOCKED_PRICE_DISPLAY_DISABLED",
    "READONLY_RESULT_BLOCKED_BOOKING_URL_DISABLED",
    "READONLY_RESULT_BLOCKED_RAW_PAYLOAD",
    "READONLY_RESULT_BLOCKED_UNKNOWN_SOURCE",
    "READONLY_RESULT_BLOCKED_MISSING_PROVIDER_ID",
    "READONLY_RESULT_BLOCKED_MISSING_UPDATED_AT",
    "READONLY_RESULT_BLOCKED_MISSING_EVIDENCE",
    "READONLY_RESULT_BLOCKED_FAKE_PRICE",
    "READONLY_RESULT_BLOCKED_MOCK_PRICE",
    "READONLY_RESULT_BLOCKED_DEMO_PRICE",
    "READONLY_RESULT_BLOCKED_AI_ESTIMATE",
    "READONLY_RESULT_BLOCKED_PAYMENT_FIELD",
    "READONLY_RESULT_BLOCKED_IDENTITY_FIELD",
    "READONLY_RESULT_SCHEMA_DRAFT_CREATED"
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
    "不记录 bookingUrl",
    "不记录 checkoutUrl",
    "不记录 paymentUrl",
    "只记录 providerId / resultType / decision / blockedReason / timestamp",
    "所有事件必须 redacted: true"
  ];

  const commerceReadonlyProviderResultSchemaGateContract = {
    version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
    moduleName:"readonly_provider_result_schema_gate",
    phase:"readonly_provider_result_schema_gate",
    gateStatus:"closed",
    schemaStatus:"draft_only",
    realProviderResultRead:"disabled",
    realPriceDisplay:"disabled",
    realAvailabilityDisplay:"disabled",
    realBookingUrlDisplay:"disabled",
    rawProviderPayloadDisplay:"forbidden",
    realProviderConnection:"disabled",
    realEndpointConnection:"disabled",
    realNetworkRequest:"disabled",
    realSandboxRun:"disabled",
    realOrder:"forbidden",
    realPayment:"forbidden",
    realIdentityUpload:"forbidden",
    apiKeyInput:"disabled",
    apiKeyStorage:"disabled",
    apiKeyRead:"disabled",
    connectionTest:"disabled",
    capabilities:{
      canShowResultSchemaGate:true,
      canShowResultTypeDraft:true,
      canShowFieldAllowlist:true,
      canShowFieldBlocklist:true,
      canShowPriceIntegrityRules:true,
      canShowSourceIntegrityRules:true,
      canShowBookingUrlRules:true,
      canShowRawPayloadRules:true,
      canShowResultRiskScan:true,
      canShowResultAuditEvents:true,
      canEvaluateResultSchemaDraft:true,
      canReadRealProviderResult:false,
      canDisplayRealPrice:false,
      canDisplayRealAvailability:false,
      canDisplayBookingUrl:false,
      canDisplayRawProviderPayload:false,
      canRunRealSandbox:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canTestConnection:false,
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
      title:"只读 provider result schema gate",
      establishedLine:"只读 provider result schema gate：已建立",
      gateStatusLine:"gate 状态：关闭 / closed",
      schemaStatusLine:"schema 状态：草案 / draft",
      realProviderResultLine:"真实 provider result 读取：未开放",
      realPriceLine:"真实价格显示：未开放",
      availabilityLine:"availability 显示：未开放",
      bookingUrlLine:"bookingUrl 显示：未开放",
      rawPayloadLine:"raw provider payload 显示：禁止",
      realSandboxLine:"真实 sandbox 运行：未开放",
      endpointLine:"真实 endpoint 连接：未开放",
      networkLine:"真实网络请求：未开放",
      orderLine:"下单：禁止",
      paymentLine:"付款：禁止",
      identityLine:"身份上传：禁止",
      nextStepLine:"下一步：provider result source label gate",
      safetyLine:"当前版本仍不能读取真实 provider result、不能显示真实价格、不能显示 bookingUrl。"
    }
  };

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function buildReadonlyProviderResultTypesDraft(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      resultTypes:resultTypes.slice(),
      currentEnabledTypes:["none"],
      currentDraftOnlyTypes:resultTypes.slice(),
      currentStatus:"draft_only"
    };
  }

  function buildReadonlyResultFieldAllowlist(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      commonAllowedFields:commonAllowedFields.slice(),
      flightAllowedFields:flightAllowedFields.slice(),
      hotelAllowedFields:hotelAllowedFields.slice(),
      productAllowedFields:productAllowedFields.slice(),
      localServiceAllowedFields:localServiceAllowedFields.slice(),
      currentEnabledFields:["none"],
      currentDisabledFields:currentDisabledFields.slice(),
      note:"字段仅为未来只读 result schema 草案，当前版本全部禁用真实读取。"
    };
  }

  function buildReadonlyResultFieldBlocklist(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      alwaysForbiddenFields:alwaysForbiddenFields.slice(),
      canDisplayForbiddenFields:false,
      canPersistForbiddenFields:false
    };
  }

  function buildPriceIntegrityRulesDraft(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      priceRequiredFutureFields:["providerId", "providerName", "sourceType", "currency", "price", "priceDisplayMode", "updatedAt", "readonlyEvidence"],
      priceRecommendedFutureFields:["taxesAndFees", "totalPrice", "baggageInfo", "refundPolicy", "availability"],
      priceBlockedIfMissing:["providerId", "providerName", "currency", "updatedAt", "readonlyEvidence"],
      priceDisplayModes:["hidden_current_version", "provider_reported_future", "taxes_unknown_future", "total_known_future", "estimate_forbidden"],
      currentPriceDisplayMode:"hidden_current_version",
      currentRules:[
        "当前版本不得显示任何真实价格",
        "当前版本不得显示估算价格",
        "当前版本不得显示 mock/demo/fake 价格",
        "当前版本不得显示最低价",
        "当前版本不得显示约 ¥xxx",
        "当前版本只能显示“暂无真实价格结果”"
      ]
    };
  }

  function buildSourceIntegrityRulesDraft(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      requiredFutureSourceFields:["providerId", "providerName", "providerCategory", "sourceType", "sourceUrlHost", "updatedAt", "readonlyEvidence"],
      sourceBlockedIf:sourceBlockedIf.slice(),
      currentRules:[
        "当前版本不展示真实 provider result",
        "当前版本不展示未知网站结果",
        "当前版本不展示 AI 生成域名",
        "当前版本只展示外部搜索入口和暂无真实价格说明"
      ]
    };
  }

  function buildBookingUrlRulesDraft(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      bookingUrlCurrentStatus:"disabled",
      displayForbidden:true,
      generationForbidden:true,
      futureRequirements:[
        "必须来自已审查 provider",
        "必须来自 allowlist host",
        "必须是 HTTPS",
        "不得包含 credential query params",
        "不得指向 payment / checkout / create order 页面",
        "不得自动提交订单",
        "跳转前必须仍由用户主动点击"
      ],
      alwaysForbiddenIf:bookingUrlAlwaysForbiddenIf.slice()
    };
  }

  function buildRawPayloadRulesDraft(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      rawPayloadDisplay:"forbidden",
      rawPayloadForbiddenReasons:[
        "可能包含 API key",
        "可能包含 token",
        "可能包含 authorization header",
        "可能包含 passenger identity",
        "可能包含 payment data",
        "可能包含 provider internal fields",
        "可能包含 booking or checkout URLs"
      ],
      rawPayloadAllowedFor:["none"],
      safeDebugFutureAlternative:[
        "redacted field summary only",
        "no raw JSON display",
        "no raw headers display",
        "no raw response body display"
      ]
    };
  }

  function evaluateReadonlyProviderResultSchemaDraft(input){
    const data = input && typeof input === "object" ? input : {};
    const rawText = JSON.stringify(data).toLowerCase();
    const fakePriceDetected = /fake|mock|demo|estimate|估算|示例/.test(rawText);
    const bookingUrlDetected = Object.prototype.hasOwnProperty.call(data, "bookingUrl") || /bookingurl|checkouturl|paymenturl|orderurl/.test(rawText);
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      resultType:String(data.resultType || "blocked_result"),
      providerId:String(data.providerId || "provider-draft"),
      allowed:false,
      gateStatus:"closed",
      schemaStatus:"draft_only",
      decision:"blocked",
      reason:fakePriceDetected ? "readonly_provider_result_fake_price_blocked" : bookingUrlDetected ? "readonly_provider_result_booking_url_blocked" : "readonly_provider_result_schema_gate_closed",
      canReadRealProviderResult:false,
      canDisplayRealPrice:false,
      canDisplayRealAvailability:false,
      canDisplayBookingUrl:false,
      canDisplayRawProviderPayload:false,
      canRunRealSandbox:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      nextStep:"provider_result_source_label_gate",
      redacted:true
    };
  }

  function buildResultRiskScanDraft(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      riskSignals:riskSignals.slice(),
      currentRiskLevel:"blocked",
      canReadRealProviderResult:false,
      canDisplayRealPrice:false,
      canDisplayBookingUrl:false,
      redacted:true
    };
  }

  function buildResultAuditEventsDraft(){
    return {
      version:READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
      auditStatus:"draft_only",
      events:auditEvents.slice(),
      auditRules:auditRules.slice(),
      allowedFields:["providerId", "resultType", "decision", "blockedReason", "timestamp"],
      forbiddenFields:["real API key", "secret", "token", "authorization header", "credential query params", "raw provider payload", "passenger identity", "passport", "bank card", "bookingUrl", "checkoutUrl", "paymentUrl"],
      redacted:true
    };
  }

  function assertReadonlyProviderResultSchemaGateSafe(gate){
    const target = gate && typeof gate === "object" ? gate : commerceReadonlyProviderResultSchemaGateContract;
    const caps = target.capabilities || {};
    if (target.gateStatus !== "closed") throw new Error("readonly provider result schema gate must stay closed");
    if (target.schemaStatus !== "draft_only") throw new Error("readonly provider result schema must stay draft only");
    [
      ["realProviderResultRead", "disabled"],
      ["realPriceDisplay", "disabled"],
      ["realAvailabilityDisplay", "disabled"],
      ["realBookingUrlDisplay", "disabled"],
      ["rawProviderPayloadDisplay", "forbidden"],
      ["realProviderConnection", "disabled"],
      ["realEndpointConnection", "disabled"],
      ["realNetworkRequest", "disabled"],
      ["realSandboxRun", "disabled"],
      ["realOrder", "forbidden"],
      ["realPayment", "forbidden"],
      ["realIdentityUpload", "forbidden"],
      ["apiKeyInput", "disabled"],
      ["apiKeyStorage", "disabled"],
      ["apiKeyRead", "disabled"],
      ["connectionTest", "disabled"]
    ].forEach(function(pair){
      if (target[pair[0]] !== pair[1]) throw new Error(pair[0] + " must be " + pair[1]);
    });
    [
      "canReadRealProviderResult",
      "canDisplayRealPrice",
      "canDisplayRealAvailability",
      "canDisplayBookingUrl",
      "canDisplayRawProviderPayload",
      "canRunRealSandbox",
      "canConnectEndpoint",
      "canUseNetwork",
      "canTestConnection",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canInputApiKey",
      "canSaveApiKey",
      "canReadApiKey",
      "canUseKeychain",
      "canUseSafeStorage",
      "canUseEncryptedLocalStore",
      "canWriteEnv",
      "canWriteLocalStorage",
      "canWriteSessionStorage",
      "canWriteLogs"
    ].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must be false");
    });
    const fake = evaluateReadonlyProviderResultSchemaDraft({ resultType:"flight_offer", providerId:"dummy", price:"demo price", bookingUrl:"https://example.invalid/checkout" });
    if (fake.allowed !== false || fake.canDisplayRealPrice !== false || fake.canDisplayBookingUrl !== false || fake.canUseNetwork !== false) {
      throw new Error("readonly provider result schema evaluation must remain blocked");
    }
    return true;
  }

  function buildReadonlyProviderResultSchemaGateDisplay(gate){
    const base = Object.assign({}, commerceReadonlyProviderResultSchemaGateContract, gate && typeof gate === "object" ? gate : {});
    return Object.assign({}, base, {
      resultTypesDraft:buildReadonlyProviderResultTypesDraft(),
      fieldAllowlist:buildReadonlyResultFieldAllowlist(),
      fieldBlocklist:buildReadonlyResultFieldBlocklist(),
      priceIntegrityRules:buildPriceIntegrityRulesDraft(),
      sourceIntegrityRules:buildSourceIntegrityRulesDraft(),
      bookingUrlRules:buildBookingUrlRulesDraft(),
      rawPayloadRules:buildRawPayloadRulesDraft(),
      riskScan:buildResultRiskScanDraft(),
      audit:buildResultAuditEventsDraft(),
      evaluation:evaluateReadonlyProviderResultSchemaDraft({ resultType:"flight_offer", providerId:"flight-provider-draft" })
    });
  }

  window.WeishanCommerceReadonlyProviderResultSchemaGate = {
    READONLY_PROVIDER_RESULT_SCHEMA_GATE_VERSION,
    commerceReadonlyProviderResultSchemaGateContract,
    buildReadonlyProviderResultTypesDraft,
    buildReadonlyResultFieldAllowlist,
    buildReadonlyResultFieldBlocklist,
    buildPriceIntegrityRulesDraft,
    buildSourceIntegrityRulesDraft,
    buildBookingUrlRulesDraft,
    buildRawPayloadRulesDraft,
    evaluateReadonlyProviderResultSchemaDraft,
    buildResultRiskScanDraft,
    buildResultAuditEventsDraft,
    assertReadonlyProviderResultSchemaGateSafe,
    buildReadonlyProviderResultSchemaGateDisplay
  };
})();
