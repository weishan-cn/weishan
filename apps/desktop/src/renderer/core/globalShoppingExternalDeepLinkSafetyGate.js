;(function () {
  "use strict";

  const GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE_VERSION = "4.1.9";
  const GATE_NAME = "global_shopping_external_deep_link_safety_gate_v1";
  const REALTIME_DISCLOSURE = "价格以跳转后平台实时页面为准";
  const SELF_CHECKOUT_DISCLOSURE = "用户需在平台自行确认价格、登录、填写资料并完成下单";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
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
  function disclosureText(input) {
    const parts = [
      text(obj(input).disclosureText || ""),
      text(obj(input).userFacingSummary && obj(obj(input).userFacingSummary).caveat || ""),
      text(obj(input).caveat || "")
    ].filter(Boolean);
    return parts.join(" ");
  }
  function buildCandidate(input) {
    const safe = obj(input);
    const candidate = obj(safe.deepLinkCandidate);
    const sourceType = text(candidate.sourceType || safe.sourceType || "");
    const deepLinkStatus = candidate.deepLinkStatus || (safe.sandboxUrl ? "sandbox" : (safe.fixtureUrl ? "fixture" : "disabled"));
    return {
      deepLinkId:text(candidate.deepLinkId || safe.deepLinkId || "deep_link_candidate_001"),
      sourceName:text(candidate.sourceName || safe.sourceName || obj(safe.platformCandidate).sourceName || "Sandbox Platform"),
      sourceType:/^(official|authorized|major_platform|aggregator|fixture)$/.test(sourceType) ? sourceType : "",
      allowedDomain:text(candidate.allowedDomain || safe.allowedDomain || ""),
      deepLinkStatus:/^(disabled|fixture|sandbox|blocked)$/.test(deepLinkStatus) ? deepLinkStatus : "disabled",
      fixtureOnly:bool(candidate.fixtureOnly, true),
      sandboxOnly:bool(candidate.sandboxOnly, true),
      readOnly:bool(candidate.readOnly, true),
      canOpenExternalNow:bool(candidate.canOpenExternalNow, false),
      requiresUserConfirmation:bool(candidate.requiresUserConfirmation, true),
      platformRealtimePageIsSourceOfTruth:bool(candidate.platformRealtimePageIsSourceOfTruth, true),
      userCompletesCheckoutOnPlatform:bool(candidate.userCompletesCheckoutOnPlatform, true),
      noPaymentHandledByWeishan:bool(candidate.noPaymentHandledByWeishan, true),
      noOrderHandledByWeishan:bool(candidate.noOrderHandledByWeishan, true),
      noTicketingHandledByWeishan:bool(candidate.noTicketingHandledByWeishan, true),
      noAccountCredentialStored:bool(candidate.noAccountCredentialStored, true),
      noIdentityDocumentStored:bool(candidate.noIdentityDocumentStored, true),
      noBankCardStored:bool(candidate.noBankCardStored, true),
      noPaymentCredentialStored:bool(candidate.noPaymentCredentialStored, true),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null
    };
  }
  function evaluateGlobalShoppingExternalDeepLinkSafety(input) {
    const safe = obj(input);
    const candidate = buildCandidate(safe);
    const copy = disclosureText(safe);
    const blockedReasons = [];
    const hasRealtimePriceDisclosure = copy.indexOf(REALTIME_DISCLOSURE) >= 0 || candidate.platformRealtimePageIsSourceOfTruth === true;
    const hasSelfCheckoutDisclosure = copy.indexOf(SELF_CHECKOUT_DISCLOSURE) >= 0 || candidate.userCompletesCheckoutOnPlatform === true;
    const hasUserConfirmation = candidate.requiresUserConfirmation === true || safe.userConfirmationRequired === true;
    const health = {
      hasAllowedDomain:Boolean(candidate.allowedDomain),
      hasSourceType:Boolean(candidate.sourceType),
      hasUserConfirmation:hasUserConfirmation,
      hasRealtimePriceDisclosure:hasRealtimePriceDisclosure,
      hasSelfCheckoutDisclosure:hasSelfCheckoutDisclosure,
      noOpenExternal:candidate.canOpenExternalNow !== true && safe.openExternal !== true,
      noWindowOpen:safe.windowOpen !== true,
      noRealBookingUrl:true,
      noCheckoutUrl:true,
      noPaymentUrl:true,
      noOrderUrl:true,
      noCredentialStorage:candidate.noAccountCredentialStored === true && candidate.noIdentityDocumentStored === true && candidate.noBankCardStored === true && candidate.noPaymentCredentialStored === true,
      noPayment:candidate.noPaymentHandledByWeishan === true,
      noOrder:candidate.noOrderHandledByWeishan === true,
      noTicketing:candidate.noTicketingHandledByWeishan === true
    };

    if (safe.canOpenExternalNow === true || candidate.canOpenExternalNow === true) blockedReasons.push("can_open_external_now");
    if (safe.windowOpen === true) blockedReasons.push("window_open_capability_detected");
    if (safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl) blockedReasons.push("real_transaction_url_detected");
    if (safe.payment === true || safe.order === true || safe.ticketing === true) blockedReasons.push("trading_capability_detected");
    if (!candidate.fixtureOnly || !candidate.sandboxOnly || !candidate.readOnly) blockedReasons.push("deep_link_candidate_not_read_only_sandbox_fixture");
    if (!candidate.noPaymentHandledByWeishan || !candidate.noOrderHandledByWeishan || !candidate.noTicketingHandledByWeishan) blockedReasons.push("trading_handling_boundary_lost");
    if (!candidate.noAccountCredentialStored || !candidate.noIdentityDocumentStored || !candidate.noBankCardStored || !candidate.noPaymentCredentialStored) blockedReasons.push("credential_storage_boundary_lost");

    let status = "safe";
    if (blockedReasons.length) status = "blocked";
    else if (!health.hasAllowedDomain || !health.hasSourceType || !health.hasUserConfirmation || !health.hasRealtimePriceDisclosure || !health.hasSelfCheckoutDisclosure) status = "needs_review";

    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE_VERSION,
      status:status,
      deepLinkCandidate:candidate,
      safetyHealth:health,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingExternalDeepLinkRows(input) {
    const gate = evaluateGlobalShoppingExternalDeepLinkSafety(input || {});
    const health = gate.safetyHealth;
    return clone([
      row("target_platform", "目标平台", gate.deepLinkCandidate.sourceName || "仍需复核", health.hasAllowedDomain ? "pass" : "warning"),
      row("allowed_domain", "允许域名", gate.deepLinkCandidate.allowedDomain || "仍需复核", health.hasAllowedDomain ? "pass" : "warning"),
      row("source_type", "来源类型", gate.deepLinkCandidate.sourceType || "仍需复核", health.hasSourceType ? "pass" : "warning"),
      row("user_confirmation", "用户确认", health.hasUserConfirmation ? "requiresUserConfirmation:true" : "仍需复核", health.hasUserConfirmation ? "pass" : "warning"),
      row("realtime_price", "平台实时价格为准", health.hasRealtimePriceDisclosure ? REALTIME_DISCLOSURE : "仍需补充说明", health.hasRealtimePriceDisclosure ? "pass" : "warning"),
      row("self_checkout", "平台自行下单", health.hasSelfCheckoutDisclosure ? SELF_CHECKOUT_DISCLOSURE : "仍需补充说明", health.hasSelfCheckoutDisclosure ? "pass" : "warning"),
      row("open_external", "外部打开能力", health.noOpenExternal && health.noWindowOpen ? "当前不打开真实平台" : "检测到外部打开能力", health.noOpenExternal && health.noWindowOpen ? "pass" : "blocked"),
      row("transaction_urls", "交易链接", "bookingUrl:null / checkoutUrl:null / paymentUrl:null / orderUrl:null", health.noRealBookingUrl && health.noCheckoutUrl && health.noPaymentUrl && health.noOrderUrl ? "pass" : "blocked"),
      row("credential_storage", "身份与支付信息存储", health.noCredentialStorage ? "不保存平台账号/证件/银行卡/支付凭证" : "检测到敏感存储风险", health.noCredentialStorage ? "pass" : "blocked"),
      row("trading_boundary", "交易边界", health.noPayment && health.noOrder && health.noTicketing ? "不付款 / 不下单 / 不出票" : "检测到交易能力风险", health.noPayment && health.noOrder && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingExternalDeepLinkSafetyGate(gate) {
    const safe = obj(gate);
    const evaluation = evaluateGlobalShoppingExternalDeepLinkSafety(safe);
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE_VERSION,
      status:/^(safe|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status,
      deepLinkCandidate:evaluation.deepLinkCandidate,
      safetyHealth:evaluation.safetyHealth,
      rows:toArray(safe.rows).length ? toArray(safe.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingExternalDeepLinkRows(evaluation),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"外部平台跳转安全闸门",
        resultLabel:evaluation.status === "safe" ? "跳转安全结构已准备" : (evaluation.status === "needs_review" ? "跳转安全仍需复核" : "跳转已阻断"),
        caveat:"本轮仅生成只读 sandbox 跳转候选，不打开真实平台。用户未来需在对应平台自行确认价格、登录、填写资料并完成下单。",
        redacted:true
      },
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingExternalDeepLinkSafetyGate(input) {
    try {
      return sanitizeGlobalShoppingExternalDeepLinkSafetyGate(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingExternalDeepLinkSafetyGate({ status:"failed_safe", blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingExternalDeepLinkSafetyGateAuditDraft(input) {
    const gate = buildGlobalShoppingExternalDeepLinkSafetyGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE_VERSION,
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

  window.WeishanGlobalShoppingExternalDeepLinkSafetyGate = {
    GLOBAL_SHOPPING_EXTERNAL_DEEP_LINK_SAFETY_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingExternalDeepLinkSafetyGate,
    evaluateGlobalShoppingExternalDeepLinkSafety,
    buildGlobalShoppingExternalDeepLinkRows,
    buildGlobalShoppingExternalDeepLinkSafetyGateAuditDraft,
    sanitizeGlobalShoppingExternalDeepLinkSafetyGate
  };
})();
