;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_REQUEST_ENVELOPE_BUILDER_VERSION = "2.2.5";
  const BUILDER_NAME = "global_shopping_provider_request_envelope_builder_v1";
  const RESULT_LABELS = {
    ready:"请求封装已准备",
    needs_review:"请求封装仍需复核",
    blocked:"请求封装已阻断",
    failed_safe:"请求封装已阻断"
  };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function present(value) { return value === true || (typeof value === "string" && value.trim().length > 0); }
  function envelopeId() { return "provider_envelope_read_only_v2_1_96"; }
  function requestMode(input) {
    const value = text(obj(input).requestMode || "sandbox_ready");
    return /^(disabled|dry_run|sandbox_ready)$/.test(value) ? value : "";
  }
  function searchParameters(input) {
    const safe = obj(input);
    return {
      itemType:text(safe.itemType || ""),
      origin:text(safe.origin || ""),
      destination:text(safe.destination || ""),
      departureDate:text(safe.departureDate || ""),
      returnDate:text(safe.returnDate || ""),
      passengerCount:safe.passengerCount == null ? null : Number(safe.passengerCount),
      cabinClass:text(safe.cabinClass || ""),
      directOnly:safe.directOnly === true,
      hotelCheckIn:text(safe.hotelCheckIn || ""),
      hotelCheckOut:text(safe.hotelCheckOut || ""),
      roomCount:safe.roomCount == null ? null : Number(safe.roomCount),
      guestCount:safe.guestCount == null ? null : Number(safe.guestCount),
      productBrand:text(safe.productBrand || ""),
      productModel:text(safe.productModel || ""),
      productSku:text(safe.productSku || ""),
      quantity:safe.quantity == null ? null : Number(safe.quantity),
      nonSensitivePreference:text(safe.nonSensitivePreference || "")
    };
  }
  function redactedContext(input) {
    const safe = obj(input);
    return {
      userRegion:text(safe.userRegion || ""),
      destinationRegion:text(safe.destinationRegion || ""),
      currency:text(safe.currency || ""),
      locale:text(safe.locale || ""),
      requestCreatedAt:text(safe.requestCreatedAt || "redacted_now"),
      redacted:true
    };
  }
  function evaluateGlobalShoppingProviderRequestEnvelope(input) {
    const safe = obj(input);
    const envelope = {
      envelopeId:text(safe.envelopeId || envelopeId()),
      providerId:text(safe.providerId || ""),
      providerName:text(safe.providerName || ""),
      requestMode:requestMode(safe),
      readOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      canSendRequestNow:false,
      canCallNetwork:false,
      canAttachRealApiKey:false,
      canAttachProductionCredential:false,
      carriesOnlyNonSensitiveSearchParameters:true,
      carriesUserIdentity:false,
      carriesPlatformCredential:false,
      carriesPaymentData:false,
      carriesRawUserText:false,
      carriesBookingUrl:false,
      carriesCheckoutUrl:false,
      carriesPaymentUrl:false,
      carriesOrderUrl:false,
      allowedSearchParameters:searchParameters(safe),
      redactedContext:redactedContext(safe)
    };
    const hasAllowedSearchParameters = Object.values(envelope.allowedSearchParameters).some(function (value) {
      return value === true || value === 0 || (typeof value === "number" && !Number.isNaN(value)) || (typeof value === "string" && value.trim().length > 0);
    });
    const hasRedactedContext = Object.values(envelope.redactedContext).some(function (value) {
      return value === true || (typeof value === "string" && value.trim().length > 0);
    });
    const health = {
      hasProviderId:!!envelope.providerId,
      hasRequestMode:!!envelope.requestMode,
      hasAllowedSearchParameters:hasAllowedSearchParameters,
      hasRedactedContext:hasRedactedContext,
      noNetworkSend:safe.canSendRequestNow !== true && safe.sendRequestNow !== true,
      noRealApiKey:safe.realApiKeyPresent !== true && safe.realApiKeyDetected !== true,
      noProductionCredential:safe.productionCredentialPresent !== true && safe.productionCredentialDetected !== true,
      noUserIdentity:safe.userIdentityDetected !== true && safe.realNamePresent !== true && safe.phonePresent !== true && safe.emailPresent !== true,
      noPlatformCredential:safe.platformCredentialDetected !== true && safe.platformAccountPresent !== true && safe.platformPasswordPresent !== true,
      noPaymentData:safe.paymentDataDetected !== true && safe.cardPresent !== true,
      noRawUserText:safe.rawUserTextDetected !== true && safe.rawUserTextPresent !== true,
      noTransactionUrl:present(safe.bookingUrl) || present(safe.checkoutUrl) || present(safe.paymentUrl) || present(safe.orderUrl) ? false : true
    };
    const blockedReasons = [];
    if (!health.noNetworkSend) blockedReasons.push("request_send_detected");
    if (!health.noRealApiKey) blockedReasons.push("real_api_key_detected");
    if (!health.noProductionCredential) blockedReasons.push("production_credential_detected");
    if (!health.noUserIdentity) blockedReasons.push("user_identity_detected");
    if (!health.noPlatformCredential) blockedReasons.push("platform_credential_detected");
    if (!health.noPaymentData) blockedReasons.push("payment_data_detected");
    if (!health.noRawUserText) blockedReasons.push("raw_user_text_detected");
    if (!health.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    const needsReview = !blockedReasons.length && (!health.hasProviderId || !health.hasRequestMode || !health.hasAllowedSearchParameters || !health.hasRedactedContext);
    return clone({
      requestEnvelope:envelope,
      envelopeHealth:health,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderRequestEnvelope(input) {
    return clone(evaluateGlobalShoppingProviderRequestEnvelope(input || {}).requestEnvelope);
  }
  function buildGlobalShoppingProviderRequestEnvelopeRows(input) {
    const evaluation = evaluateGlobalShoppingProviderRequestEnvelope(input || {});
    const health = evaluation.envelopeHealth;
    return clone([
      row("provider", "Provider 标识", health.hasProviderId ? "Provider 已脱敏标识" : "仍需补充", health.hasProviderId ? "pass" : "warning"),
      row("request_mode", "请求模式", health.hasRequestMode ? "仅允许 disabled / dry_run / sandbox_ready" : "仍需补充", health.hasRequestMode ? "pass" : "warning"),
      row("search_parameters", "搜索参数", health.hasAllowedSearchParameters ? "仅携带非敏感搜索参数" : "仍需补充", health.hasAllowedSearchParameters ? "pass" : "warning"),
      row("redacted_context", "脱敏上下文", health.hasRedactedContext ? "仅携带 redacted context" : "仍需补充", health.hasRedactedContext ? "pass" : "warning"),
      row("request_send", "发送行为", health.noNetworkSend ? "请求封装不发送真实请求" : "已阻断", health.noNetworkSend ? "pass" : "blocked"),
      row("data_boundary", "数据边界", health.noRealApiKey && health.noProductionCredential && health.noUserIdentity && health.noPlatformCredential && health.noPaymentData && health.noRawUserText && health.noTransactionUrl ? "不带真实密钥 / 身份 / 平台账号 / 支付数据 / raw user text / 交易 URL" : "已阻断风险", health.noRealApiKey && health.noProductionCredential && health.noUserIdentity && health.noPlatformCredential && health.noPaymentData && health.noRawUserText && health.noTransactionUrl ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingProviderRequestEnvelopeBuilder(builder) {
    const safe = obj(builder);
    const evaluation = evaluateGlobalShoppingProviderRequestEnvelope(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      builderName:BUILDER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_REQUEST_ENVELOPE_BUILDER_VERSION,
      status:status,
      requestEnvelope:clone(evaluation.requestEnvelope),
      envelopeHealth:clone(evaluation.envelopeHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderRequestEnvelopeRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider 请求封装",
        resultLabel:RESULT_LABELS[status] || RESULT_LABELS.failed_safe,
        caveat:"本轮只构建只读 dry-run 请求封装，不发送真实 provider 请求，不携带真实密钥或敏感资料。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderRequestEnvelopeBuilder(input) {
    try {
      return sanitizeGlobalShoppingProviderRequestEnvelopeBuilder(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderRequestEnvelopeBuilder({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingProviderRequestEnvelopeBuilderAuditDraft(input) {
    const builder = buildGlobalShoppingProviderRequestEnvelopeBuilder(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_REQUEST_ENVELOPE_BUILDER_AUDIT_DRAFT",
      builderName:BUILDER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_REQUEST_ENVELOPE_BUILDER_VERSION,
      status:builder.status,
      rowCount:builder.rows.length,
      blockedReasons:builder.blockedReasons,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderRequestEnvelopeBuilder = {
    GLOBAL_SHOPPING_PROVIDER_REQUEST_ENVELOPE_BUILDER_VERSION,
    BUILDER_NAME,
    buildGlobalShoppingProviderRequestEnvelopeBuilder,
    buildGlobalShoppingProviderRequestEnvelope,
    evaluateGlobalShoppingProviderRequestEnvelope,
    buildGlobalShoppingProviderRequestEnvelopeRows,
    buildGlobalShoppingProviderRequestEnvelopeBuilderAuditDraft,
    sanitizeGlobalShoppingProviderRequestEnvelopeBuilder
  };
})();
