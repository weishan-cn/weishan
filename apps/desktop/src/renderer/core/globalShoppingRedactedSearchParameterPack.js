;(function () {
  "use strict";

  const GLOBAL_SHOPPING_REDACTED_SEARCH_PARAMETER_PACK_VERSION = "4.1.6";
  const PACK_NAME = "global_shopping_redacted_search_parameter_pack_v1";
  const ALLOWED_FIELDS = {
    flight:["origin", "destination", "departureDate", "returnDate", "passengerCount", "cabinClass", "directOnly", "currency", "locale", "region"],
    hotel:["destination", "hotelCheckIn", "hotelCheckOut", "roomCount", "guestCount", "currency", "locale", "region"],
    product:["productBrand", "productModel", "productSku", "quantity", "destinationRegion", "currency", "locale", "region"],
    local_service:["serviceCategory", "city", "date", "partySize", "currency", "locale", "region"],
    common:["itemType", "candidateId", "sourceType", "trustLabel", "confidenceLabel"]
  };
  const BLOCKED_FIELDS = {
    realName:"identity",
    phone:"contact",
    email:"contact",
    passport:"identity",
    idCard:"identity",
    bankCard:"payment",
    platformAccount:"credential",
    platformPassword:"credential",
    paymentCredential:"payment",
    address:"location",
    preciseLocation:"location",
    rawUserText:"raw_text",
    apiKey:"secret",
    token:"secret",
    secret:"secret",
    bookingUrl:"transaction",
    checkoutUrl:"transaction",
    paymentUrl:"transaction",
    orderUrl:"transaction"
  };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function mode(value) {
    const next = text(value || "disabled");
    return /^(disabled|parameter_preview|dry_run|sandbox_ready)$/.test(next) ? next : "disabled";
  }
  function sensitivityFor(kind) {
    if (kind === "transaction") return "transaction";
    if (kind === "secret") return "secret";
    if (kind === "raw_text") return "raw_text";
    return "sensitive";
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
  function sourceLabel(input, key) {
    const safe = obj(input);
    if (obj(safe.userConfirmedParameters)[key] != null) return "user_confirmed";
    if (obj(safe.fixtureParameters)[key] != null) return "fixture";
    if (obj(safe.sandboxParameters)[key] != null) return "sandbox";
    return "derived";
  }
  function findValue(input, key) {
    const safe = obj(input);
    const sources = [
      obj(safe.parameters),
      obj(safe.allowedParameterSource),
      obj(safe.searchParameters),
      obj(safe.parameterSource),
      obj(safe.userConfirmedParameters),
      obj(safe.fixtureParameters),
      obj(safe.sandboxParameters),
      safe
    ];
    for (let index = 0; index < sources.length; index += 1) {
      if (sources[index][key] != null && sources[index][key] !== "") return sources[index][key];
    }
    return null;
  }
  function itemType(input) {
    const safe = obj(input);
    return text(safe.itemType || obj(safe.parameters).itemType || obj(safe.searchParameters).itemType || "flight") || "flight";
  }
  function buildAllowedParameters(input) {
    const type = itemType(input);
    const keys = (ALLOWED_FIELDS[type] || []).concat(ALLOWED_FIELDS.common);
    const seen = {};
    return clone(keys.map(function (key) {
      if (seen[key]) return null;
      seen[key] = true;
      const value = findValue(input, key);
      if (value == null || value === "") return null;
      return {
        key:key,
        valueLabel:text(value),
        category:(ALLOWED_FIELDS[type] || []).indexOf(key) >= 0 ? type : "common",
        sensitivity:"non_sensitive",
        source:sourceLabel(input, key),
        redacted:true
      };
    }).filter(Boolean));
  }
  function buildBlockedParameters(input) {
    const safe = obj(input);
    return clone(Object.keys(BLOCKED_FIELDS).map(function (key) {
      const kind = BLOCKED_FIELDS[key];
      const value = findValue(safe, key);
      return {
        key:key,
        reason:text(value == null || value === "" ? "敏感字段禁止进入搜索参数包。" : "检测到敏感字段，已阻断进入搜索参数包。"),
        sensitivity:sensitivityFor(kind),
        blocked:true
      };
    }));
  }
  function buildMissingParameters(input) {
    const type = itemType(input);
    const requiredByType = {
      flight:["origin", "destination", "departureDate"],
      hotel:["destination", "hotelCheckIn", "hotelCheckOut"],
      product:["productBrand", "productModel"],
      local_service:["serviceCategory", "city", "date"]
    };
    return clone((requiredByType[type] || []).filter(function (key) {
      const value = findValue(input, key);
      return value == null || value === "";
    }).map(text));
  }
  function buildUserOnlyParameters(input) {
    const type = itemType(input);
    const userOnly = {
      flight:["seatSelection", "baggageChoice"],
      hotel:["guestName", "guestIdentity"],
      product:["recipientName", "deliveryAddress"],
      local_service:["contactPhone", "onsiteIdentity"]
    };
    return clone((userOnly[type] || []).map(function (key) {
      return { key:text(key), reason:"必须由用户在平台自行填写或确认。", redacted:true };
    }));
  }
  function buildGlobalShoppingRedactedSearchParameterRows(input) {
    return clone(buildAllowedParameters(input).map(function (item) {
      return {
        rowId:text(item.key),
        label:text(item.key),
        value:text(item.valueLabel),
        status:"pass",
        redacted:true
      };
    }));
  }
  function buildGlobalShoppingBlockedSensitiveParameterRows(input) {
    const safe = obj(input);
    return clone(buildBlockedParameters(safe).map(function (item) {
      const present = findValue(safe, item.key) != null && findValue(safe, item.key) !== "";
      return {
        rowId:text(item.key),
        label:text(item.key),
        value:present ? "已阻断敏感字段" : "敏感字段默认禁止",
        status:present ? "blocked" : "pass",
        redacted:true
      };
    }));
  }
  function evaluateGlobalShoppingRedactedSearchParameterPack(input) {
    const safe = obj(input);
    const allowedParameters = buildAllowedParameters(safe);
    const blockedParameters = buildBlockedParameters(safe);
    const missingParameters = buildMissingParameters(safe);
    const userOnlyParameters = buildUserOnlyParameters(safe);
    const blockedReasons = [];
    Object.keys(BLOCKED_FIELDS).forEach(function (key) {
      const value = findValue(safe, key);
      if (value != null && value !== "") blockedReasons.push(key + "_detected");
    });
    if (safe.fileWrite === true || safe.persistPack === true || safe.canPersistPack === true) blockedReasons.push("persistence_detected");
    if (safe.export === true || safe.canExportPack === true || safe.download === true || safe.canDownloadPack === true) blockedReasons.push("export_download_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true || safe.canOpenExternalNow === true) blockedReasons.push("external_open_detected");
    if (safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl) blockedReasons.push("transaction_url_detected");
    const parameterHealth = {
      hasAllowedParameters:allowedParameters.length > 0,
      hasBlockedSensitiveParameters:blockedParameters.length === Object.keys(BLOCKED_FIELDS).length,
      noIdentity:findValue(safe, "realName") == null,
      noPhoneEmail:findValue(safe, "phone") == null && findValue(safe, "email") == null,
      noPassportIdCard:findValue(safe, "passport") == null && findValue(safe, "idCard") == null,
      noBankCardPayment:findValue(safe, "bankCard") == null && findValue(safe, "paymentCredential") == null,
      noPlatformCredential:findValue(safe, "platformAccount") == null && findValue(safe, "platformPassword") == null,
      noPreciseLocation:findValue(safe, "address") == null && findValue(safe, "preciseLocation") == null,
      noRawUserText:findValue(safe, "rawUserText") == null,
      noSecretTokenKey:findValue(safe, "apiKey") == null && findValue(safe, "token") == null && findValue(safe, "secret") == null,
      noTransactionUrl:findValue(safe, "bookingUrl") == null && findValue(safe, "checkoutUrl") == null && findValue(safe, "paymentUrl") == null && findValue(safe, "orderUrl") == null,
      noPersistenceExportDownload:safe.fileWrite !== true && safe.persistPack !== true && safe.canPersistPack !== true && safe.export !== true && safe.canExportPack !== true && safe.download !== true && safe.canDownloadPack !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true && safe.canOpenExternalNow !== true
    };
    const needsReview = !parameterHealth.hasAllowedParameters;
    return clone({
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_REDACTED_SEARCH_PARAMETER_PACK_VERSION,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      parameterBoundary:{
        packId:text(safe.packId || "redacted_search_parameter_pack_v2_2_3"),
        packMode:mode(safe.packMode || (allowedParameters.length ? "parameter_preview" : "disabled")),
        readOnly:true,
        redactedOnly:true,
        searchParametersOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistPack:false,
        canExportPack:false,
        canDownloadPack:false,
        canGenerateRealUrl:false,
        canOpenExternalNow:false,
        canCarryIdentity:false,
        canCarryPlatformCredential:false,
        canCarryPaymentCredential:false,
        canCarryPreciseLocation:false,
        canCarryRawUserText:false
      },
      allowedParameters:allowedParameters,
      blockedParameters:blockedParameters,
      missingParameters:missingParameters,
      userOnlyParameters:userOnlyParameters,
      parameterHealth:parameterHealth,
      rows:buildGlobalShoppingRedactedSearchParameterRows(safe).concat(buildGlobalShoppingBlockedSensitiveParameterRows(safe)),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"脱敏搜索参数包",
        resultLabel:blockedReasons.length ? "搜索参数包已阻断" : (needsReview ? "搜索参数包仍需复核" : "搜索参数包已准备"),
        caveat:"该参数包只包含非敏感搜索条件，不包含身份、联系方式、证件、银行卡、平台账号密码、支付凭证或真实交易链接。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function sanitizeGlobalShoppingRedactedSearchParameterPack(pack) {
    const safe = obj(pack);
    const evaluated = evaluateGlobalShoppingRedactedSearchParameterPack(safe);
    return clone({
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_REDACTED_SEARCH_PARAMETER_PACK_VERSION,
      status:/^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status,
      parameterBoundary:clone(evaluated.parameterBoundary),
      allowedParameters:clone(evaluated.allowedParameters),
      blockedParameters:clone(evaluated.blockedParameters),
      missingParameters:clone(evaluated.missingParameters),
      userOnlyParameters:clone(evaluated.userOnlyParameters),
      parameterHealth:clone(evaluated.parameterHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : clone(evaluated.rows),
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:clone(evaluated.userFacingSummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingRedactedSearchParameterPack(input) {
    try {
      return sanitizeGlobalShoppingRedactedSearchParameterPack(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingRedactedSearchParameterPack({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingRedactedSearchParameterPackAuditDraft(input) {
    const pack = buildGlobalShoppingRedactedSearchParameterPack(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_REDACTED_SEARCH_PARAMETER_PACK_AUDIT_DRAFT",
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_REDACTED_SEARCH_PARAMETER_PACK_VERSION,
      status:pack.status,
      blockedReasonCount:pack.blockedReasons.length,
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

  window.WeishanGlobalShoppingRedactedSearchParameterPack = {
    GLOBAL_SHOPPING_REDACTED_SEARCH_PARAMETER_PACK_VERSION,
    PACK_NAME,
    buildGlobalShoppingRedactedSearchParameterPack,
    evaluateGlobalShoppingRedactedSearchParameterPack,
    buildGlobalShoppingRedactedSearchParameterRows,
    buildGlobalShoppingBlockedSensitiveParameterRows,
    buildGlobalShoppingRedactedSearchParameterPackAuditDraft,
    sanitizeGlobalShoppingRedactedSearchParameterPack
  };
})();
