;(function () {
  "use strict";

  const GLOBAL_SHOPPING_JUMP_TO_PLATFORM_BOUNDARY_VERSION = "3.2.0";
  const BOUNDARY_NAME = "global_shopping_jump_to_platform_boundary_v1";
  const SUMMARY_CAVEAT = "Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety() {
    return {
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
    };
  }
  function buildBoundary(input) {
    const safe = obj(input);
    const overrides = obj(safe.handoffBoundary);
    return {
      canShowPlatformCandidate: overrides.canShowPlatformCandidate !== false,
      canCarrySearchParameters: overrides.canCarrySearchParameters !== false,
      canShowJumpConfirmation: overrides.canShowJumpConfirmation !== false,
      canOpenExternalPlatformNow: overrides.canOpenExternalPlatformNow === true,
      canSubmitOrder: overrides.canSubmitOrder === true,
      canPay: overrides.canPay === true,
      canTicket: overrides.canTicket === true,
      canStorePlatformAccount: overrides.canStorePlatformAccount === true,
      canStoreIdentityDocument: overrides.canStoreIdentityDocument === true,
      canStoreBankCard: overrides.canStoreBankCard === true,
      canStorePaymentCredential: overrides.canStorePaymentCredential === true,
      userCompletesCheckoutOnPlatform: overrides.userCompletesCheckoutOnPlatform !== false,
      platformRealtimePageIsSourceOfTruth: overrides.platformRealtimePageIsSourceOfTruth !== false
    };
  }
  function buildPrefillPolicy(input) {
    const safe = obj(input);
    const overrides = obj(safe.prefillPolicy);
    return {
      allowOriginDestinationDatePeople: overrides.allowOriginDestinationDatePeople !== false,
      allowProductModelSkuQuantity: overrides.allowProductModelSkuQuantity !== false,
      allowHotelDatesRoomGuestCount: overrides.allowHotelDatesRoomGuestCount !== false,
      allowNonSensitivePreference: overrides.allowNonSensitivePreference !== false,
      denyRealName: overrides.denyRealName !== false,
      denyPhone: overrides.denyPhone !== false,
      denyEmail: overrides.denyEmail !== false,
      denyPassport: overrides.denyPassport !== false,
      denyIdCard: overrides.denyIdCard !== false,
      denyBankCard: overrides.denyBankCard !== false,
      denyPaymentCredential: overrides.denyPaymentCredential !== false,
      denyPlatformPassword: overrides.denyPlatformPassword !== false
    };
  }
  function evaluateGlobalShoppingJumpBoundary(input) {
    const handoffBoundary = buildBoundary(input);
    const prefillPolicy = buildPrefillPolicy(input);
    const blockedReasons = [];

    if (handoffBoundary.canOpenExternalPlatformNow) blockedReasons.push("open_external_platform");
    if (handoffBoundary.canSubmitOrder) blockedReasons.push("submit_order");
    if (handoffBoundary.canPay) blockedReasons.push("pay");
    if (handoffBoundary.canTicket) blockedReasons.push("ticket");
    if (handoffBoundary.canStorePlatformAccount) blockedReasons.push("store_platform_account");
    if (handoffBoundary.canStoreIdentityDocument) blockedReasons.push("store_identity_document");
    if (handoffBoundary.canStoreBankCard) blockedReasons.push("store_bank_card");
    if (handoffBoundary.canStorePaymentCredential) blockedReasons.push("store_payment_credential");
    if (!handoffBoundary.userCompletesCheckoutOnPlatform) blockedReasons.push("user_must_complete_checkout_on_platform");
    if (!handoffBoundary.platformRealtimePageIsSourceOfTruth) blockedReasons.push("platform_page_source_of_truth_required");
    ["denyRealName", "denyPhone", "denyEmail", "denyPassport", "denyIdCard", "denyBankCard", "denyPaymentCredential", "denyPlatformPassword"].forEach(function (key) {
      if (prefillPolicy[key] !== true) blockedReasons.push(key);
    });

    let status = "safe";
    if (blockedReasons.length) status = "blocked";
    else if (!handoffBoundary.canShowPlatformCandidate || !handoffBoundary.canCarrySearchParameters || !handoffBoundary.canShowJumpConfirmation) status = "needs_review";

    return clone({
      status:status,
      handoffBoundary:handoffBoundary,
      prefillPolicy:prefillPolicy,
      blockedReasons:blockedReasons,
      safeToProceedWithJumpToPlatformMvp:status === "safe",
      redacted:true
    });
  }
  function buildGlobalShoppingJumpBoundaryRows(input) {
    const evaluation = evaluateGlobalShoppingJumpBoundary(input || {});
    const handoffBoundary = evaluation.handoffBoundary;
    const prefillPolicy = evaluation.prefillPolicy;
    return clone([
      row("platform_candidates", "平台候选展示", handoffBoundary.canShowPlatformCandidate ? "允许展示合法平台候选价" : "平台候选展示仍需复核", handoffBoundary.canShowPlatformCandidate ? "pass" : "warning"),
      row("search_prefill", "搜索条件带入", handoffBoundary.canCarrySearchParameters ? "仅带入非敏感搜索条件" : "搜索条件带入仍需复核", handoffBoundary.canCarrySearchParameters ? "pass" : "warning"),
      row("jump_confirmation", "跳转前确认", handoffBoundary.canShowJumpConfirmation ? "跳转前会提示用户自行确认" : "跳转确认仍需复核", handoffBoundary.canShowJumpConfirmation ? "pass" : "warning"),
      row("user_checkout", "平台自行下单", handoffBoundary.userCompletesCheckoutOnPlatform ? "用户需在平台自行完成下单" : "平台自行下单边界已失守", handoffBoundary.userCompletesCheckoutOnPlatform ? "pass" : "blocked"),
      row("source_of_truth", "平台实时页为准", handoffBoundary.platformRealtimePageIsSourceOfTruth ? "价格以平台实时页面为准" : "平台实时页为准边界已失守", handoffBoundary.platformRealtimePageIsSourceOfTruth ? "pass" : "blocked"),
      row("no_open_external", "不直接打开外部平台", handoffBoundary.canOpenExternalPlatformNow ? "检测到直接打开外部平台风险" : "不会自动打开外部平台", handoffBoundary.canOpenExternalPlatformNow ? "blocked" : "pass"),
      row("no_order_pay_ticket", "不提交订单/付款/出票", handoffBoundary.canSubmitOrder || handoffBoundary.canPay || handoffBoundary.canTicket ? "检测到交易能力风险" : "不提交订单、不付款、不出票", handoffBoundary.canSubmitOrder || handoffBoundary.canPay || handoffBoundary.canTicket ? "blocked" : "pass"),
      row("deny_sensitive_identity", "敏感身份字段", prefillPolicy.denyRealName && prefillPolicy.denyPassport && prefillPolicy.denyIdCard ? "拒绝真实姓名/证件字段" : "敏感身份字段边界已失守", prefillPolicy.denyRealName && prefillPolicy.denyPassport && prefillPolicy.denyIdCard ? "pass" : "blocked"),
      row("deny_payment", "支付字段", prefillPolicy.denyBankCard && prefillPolicy.denyPaymentCredential && prefillPolicy.denyPlatformPassword ? "拒绝银行卡/支付凭据/平台密码" : "支付字段边界已失守", prefillPolicy.denyBankCard && prefillPolicy.denyPaymentCredential && prefillPolicy.denyPlatformPassword ? "pass" : "blocked"),
      row("allow_non_sensitive", "非敏感偏好", prefillPolicy.allowNonSensitivePreference ? "允许带入非敏感偏好" : "非敏感偏好带入仍需复核", prefillPolicy.allowNonSensitivePreference ? "pass" : "warning")
    ]);
  }
  function sanitizeGlobalShoppingJumpToPlatformBoundary(boundary) {
    const safeBoundary = obj(boundary);
    const evaluation = evaluateGlobalShoppingJumpBoundary(safeBoundary);
    const safeStatus = /^(safe|needs_review|blocked|failed_safe)$/.test(safeBoundary.status) ? safeBoundary.status : evaluation.status;
    return clone({
      boundaryName:BOUNDARY_NAME,
      appVersion:GLOBAL_SHOPPING_JUMP_TO_PLATFORM_BOUNDARY_VERSION,
      status:safeStatus,
      handoffBoundary:evaluation.handoffBoundary,
      prefillPolicy:evaluation.prefillPolicy,
      rows:toArray(safeBoundary.rows).length ? toArray(safeBoundary.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingJumpBoundaryRows(evaluation),
      blockedReasons:toArray(safeBoundary.blockedReasons).map(text),
      userFacingSummary:{
        title:"跳转至平台自行下单边界",
        resultLabel:safeStatus === "safe" ? "跳转边界安全" : safeStatus === "needs_review" ? "跳转边界仍需复核" : "跳转边界已阻断",
        caveat:SUMMARY_CAVEAT,
        redacted:true
      },
      safety:Object.assign(safety(), obj(safeBoundary.safety)),
      safeToProceedWithJumpToPlatformMvp:safeBoundary.safeToProceedWithJumpToPlatformMvp === true || evaluation.safeToProceedWithJumpToPlatformMvp === true,
      redacted:true
    });
  }
  function buildGlobalShoppingJumpToPlatformBoundary(input) {
    try {
      const evaluation = evaluateGlobalShoppingJumpBoundary(input || {});
      return sanitizeGlobalShoppingJumpToPlatformBoundary({
        status:evaluation.status,
        rows:buildGlobalShoppingJumpBoundaryRows(evaluation),
        blockedReasons:evaluation.blockedReasons,
        safeToProceedWithJumpToPlatformMvp:evaluation.safeToProceedWithJumpToPlatformMvp
      });
    } catch (error) {
      return sanitizeGlobalShoppingJumpToPlatformBoundary({
        status:"failed_safe",
        rows:[],
        blockedReasons:["failed_safe"]
      });
    }
  }
  function buildGlobalShoppingJumpToPlatformBoundaryAuditDraft(input) {
    const boundary = buildGlobalShoppingJumpToPlatformBoundary(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_JUMP_TO_PLATFORM_BOUNDARY_AUDIT_DRAFT",
      boundaryName:BOUNDARY_NAME,
      appVersion:GLOBAL_SHOPPING_JUMP_TO_PLATFORM_BOUNDARY_VERSION,
      status:boundary.status,
      rowCount:boundary.rows.length,
      blockedReasonCount:boundary.blockedReasons.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      secretStored:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingJumpToPlatformBoundary = {
    GLOBAL_SHOPPING_JUMP_TO_PLATFORM_BOUNDARY_VERSION,
    BOUNDARY_NAME,
    buildGlobalShoppingJumpToPlatformBoundary,
    evaluateGlobalShoppingJumpBoundary,
    buildGlobalShoppingJumpBoundaryRows,
    buildGlobalShoppingJumpToPlatformBoundaryAuditDraft,
    sanitizeGlobalShoppingJumpToPlatformBoundary
  };
})();
