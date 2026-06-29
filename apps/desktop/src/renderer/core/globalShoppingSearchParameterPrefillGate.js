;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE_VERSION = "2.1.99";
  const GATE_NAME = "global_shopping_search_parameter_prefill_gate_v1";
  const ITEM_TYPES = ["flight", "hotel", "product", "local_service", "unknown"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function numberOrNull(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  function bool(value, fallback) { return value == null ? fallback === true : value === true; }
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
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function buildPrefillCandidate(input) {
    const safe = obj(input);
    const prefill = obj(safe.prefillCandidate);
    const allowed = obj(prefill.allowedParameters);
    const itemType = text(prefill.itemType || safe.itemType || "unknown");
    return {
      prefillId:text(prefill.prefillId || safe.prefillId || "prefill_candidate_001"),
      itemType:ITEM_TYPES.indexOf(itemType) >= 0 ? itemType : "unknown",
      allowedParameters:{
        origin:text(allowed.origin || safe.origin || ""),
        destination:text(allowed.destination || safe.destination || ""),
        departureDate:text(allowed.departureDate || safe.departureDate || ""),
        returnDate:text(allowed.returnDate || safe.returnDate || ""),
        passengerCount:numberOrNull(allowed.passengerCount != null ? allowed.passengerCount : safe.passengerCount),
        cabinClass:text(allowed.cabinClass || safe.cabinClass || ""),
        directOnly:allowed.directOnly == null ? null : allowed.directOnly === true,
        hotelCheckIn:text(allowed.hotelCheckIn || safe.hotelCheckIn || ""),
        hotelCheckOut:text(allowed.hotelCheckOut || safe.hotelCheckOut || ""),
        roomCount:numberOrNull(allowed.roomCount != null ? allowed.roomCount : safe.roomCount),
        guestCount:numberOrNull(allowed.guestCount != null ? allowed.guestCount : safe.guestCount),
        productBrand:text(allowed.productBrand || safe.productBrand || ""),
        productModel:text(allowed.productModel || safe.productModel || ""),
        productSku:text(allowed.productSku || safe.productSku || ""),
        quantity:numberOrNull(allowed.quantity != null ? allowed.quantity : safe.quantity),
        nonSensitivePreference:text(allowed.nonSensitivePreference || safe.nonSensitivePreference || "")
      },
      deniedParameters:{
        realName:true,
        phone:true,
        email:true,
        passport:true,
        idCard:true,
        bankCard:true,
        paymentCredential:true,
        platformPassword:true,
        platformAccountToken:true,
        address:true
      },
      canBuildRealUrl:bool(prefill.canBuildRealUrl, false),
      canOpenExternalNow:bool(prefill.canOpenExternalNow, false),
      canSubmitForm:bool(prefill.canSubmitForm, false),
      canAutoFillSensitiveData:bool(prefill.canAutoFillSensitiveData, false),
      canStorePrefillProfile:bool(prefill.canStorePrefillProfile, false),
      userMustConfirmOnPlatform:bool(prefill.userMustConfirmOnPlatform, true)
    };
  }
  function hasSensitivePrefill(input) {
    const safe = obj(input);
    const prefill = obj(safe.prefillCandidate);
    return [
      safe.realName, safe.phone, safe.email, safe.passport, safe.idCard, safe.bankCard, safe.paymentCredential,
      safe.platformPassword, safe.platformAccountToken, safe.address,
      prefill.realName, prefill.phone, prefill.email, prefill.passport, prefill.idCard, prefill.bankCard, prefill.paymentCredential,
      prefill.platformPassword, prefill.platformAccountToken, prefill.address,
      obj(prefill.allowedParameters).realName, obj(prefill.allowedParameters).phone, obj(prefill.allowedParameters).email,
      obj(prefill.allowedParameters).passport, obj(prefill.allowedParameters).idCard, obj(prefill.allowedParameters).bankCard,
      obj(prefill.allowedParameters).paymentCredential, obj(prefill.allowedParameters).platformPassword,
      obj(prefill.allowedParameters).platformAccountToken, obj(prefill.allowedParameters).address
    ].some(function (value) { return value != null && value !== "" && value !== false; });
  }
  function evaluateGlobalShoppingSearchParameterPrefill(input) {
    const candidate = buildPrefillCandidate(input || {});
    const blockedReasons = [];
    if (hasSensitivePrefill(input || {})) blockedReasons.push("sensitive_prefill_detected");
    if (candidate.canBuildRealUrl === true || obj(input).realUrlBuild === true) blockedReasons.push("real_url_build_detected");
    if (candidate.canOpenExternalNow === true || obj(input).openExternal === true || obj(input).windowOpen === true) blockedReasons.push("external_open_detected");
    if (candidate.canSubmitForm === true || obj(input).submitForm === true) blockedReasons.push("submit_form_detected");
    if (candidate.canAutoFillSensitiveData === true || obj(input).sensitiveAutofill === true) blockedReasons.push("sensitive_autofill_detected");
    if (candidate.canStorePrefillProfile === true || obj(input).profileStorage === true) blockedReasons.push("prefill_profile_storage_detected");
    if (obj(input).bookingUrl || obj(input).checkoutUrl || obj(input).paymentUrl || obj(input).orderUrl) blockedReasons.push("transaction_url_detected");

    const health = {
      hasAllowedSearchParameters:Object.keys(candidate.allowedParameters).length > 0,
      deniesIdentityFields:true,
      deniesPaymentFields:true,
      deniesPlatformCredentialFields:true,
      deniesAddressField:true,
      noRealUrlBuild:candidate.canBuildRealUrl !== true,
      noExternalOpen:candidate.canOpenExternalNow !== true,
      noSubmitForm:candidate.canSubmitForm !== true,
      noSensitiveAutofill:candidate.canAutoFillSensitiveData !== true,
      noProfileStorage:candidate.canStorePrefillProfile !== true
    };

    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE_VERSION,
      status:blockedReasons.length ? "blocked" : "safe",
      prefillCandidate:candidate,
      prefillHealth:health,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingSearchParameterPrefillRows(input) {
    const gate = evaluateGlobalShoppingSearchParameterPrefill(input || {});
    const allowed = gate.prefillCandidate.allowedParameters;
    return clone([
      row("item_type", "商品类型", gate.prefillCandidate.itemType || "unknown", "pass"),
      row("flight_params", "flight 非敏感参数", [allowed.origin, allowed.destination, allowed.departureDate, allowed.returnDate, allowed.passengerCount, allowed.cabinClass].filter(function (item) { return item != null && item !== ""; }).join(" / ") || "none", "pass"),
      row("hotel_params", "hotel 非敏感参数", [allowed.hotelCheckIn, allowed.hotelCheckOut, allowed.roomCount, allowed.guestCount].filter(function (item) { return item != null && item !== ""; }).join(" / ") || "none", "pass"),
      row("product_params", "product 非敏感参数", [allowed.productBrand, allowed.productModel, allowed.productSku, allowed.quantity].filter(function (item) { return item != null && item !== ""; }).join(" / ") || "none", "pass"),
      row("preferences", "非敏感偏好", allowed.nonSensitivePreference || "none", "pass"),
      row("identity_block", "身份字段", "realName / phone / email / passport / idCard blocked", "pass"),
      row("payment_block", "支付字段", "bankCard / paymentCredential blocked", "pass"),
      row("credential_block", "平台凭据", "platformPassword / platformAccountToken blocked", "pass"),
      row("address_block", "地址字段", "address blocked", "pass"),
      row("execution_block", "执行边界", "no real URL / no external open / no submit / no profile storage", gate.blockedReasons.length ? "blocked" : "pass")
    ]);
  }
  function sanitizeGlobalShoppingSearchParameterPrefillGate(gate) {
    const safe = obj(gate);
    const evaluation = evaluateGlobalShoppingSearchParameterPrefill(safe);
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE_VERSION,
      status:/^(safe|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status,
      prefillCandidate:evaluation.prefillCandidate,
      prefillHealth:evaluation.prefillHealth,
      rows:toArray(safe.rows).length ? toArray(safe.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingSearchParameterPrefillRows(evaluation),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"搜索参数预填闸门",
        resultLabel:evaluation.status === "safe" ? "预填边界安全" : (evaluation.status === "needs_review" ? "预填边界仍需复核" : "预填边界已阻断"),
        caveat:"Weishan 仅可携带非敏感搜索条件，用户仍需在平台自行确认价格、填写必要资料并完成下单。",
        redacted:true
      },
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingSearchParameterPrefillGate(input) {
    try {
      return sanitizeGlobalShoppingSearchParameterPrefillGate(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSearchParameterPrefillGate({ status:"failed_safe", blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingSearchParameterPrefillGateAuditDraft(input) {
    const gate = buildGlobalShoppingSearchParameterPrefillGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE_VERSION,
      status:gate.status,
      rowCount:gate.rows.length,
      blockedReasonCount:gate.blockedReasons.length,
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

  window.WeishanGlobalShoppingSearchParameterPrefillGate = {
    GLOBAL_SHOPPING_SEARCH_PARAMETER_PREFILL_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingSearchParameterPrefillGate,
    evaluateGlobalShoppingSearchParameterPrefill,
    buildGlobalShoppingSearchParameterPrefillRows,
    buildGlobalShoppingSearchParameterPrefillGateAuditDraft,
    sanitizeGlobalShoppingSearchParameterPrefillGate
  };
})();
