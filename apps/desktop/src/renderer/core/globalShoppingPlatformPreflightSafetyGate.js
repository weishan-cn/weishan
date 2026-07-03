;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PLATFORM_PREFLIGHT_SAFETY_GATE_VERSION = "4.1.4";
  const GATE_NAME = "global_shopping_platform_preflight_safety_gate_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function mode(value) {
    const next = text(value || "disabled");
    return /^(disabled|check_only|dry_run|sandbox_ready)$/.test(next) ? next : "disabled";
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = window[apiName] || {};
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](buildInput || safe) : {};
  }
  function buildGlobalShoppingPlatformPreflightSafetyRows(input) {
    const safe = obj(input);
    const packet = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    return clone([
      { rowId:"handoff_packet", label:"交接包预览", value:text(obj(packet.userFacingSummary).resultLabel || "交接包预览仍需复核"), status:statusOf(packet) === "ready" ? "pass" : "warning", redacted:true },
      { rowId:"parameter_pack", label:"搜索参数包", value:safe.noSensitiveCarry === false ? "检测到敏感内容风险" : "未检测到敏感携带", status:safe.noSensitiveCarry === false ? "blocked" : "pass", redacted:true },
      { rowId:"external_open", label:"外部打开", value:safe.noExternalOpen === false ? "检测到外部打开风险" : "未触发外部打开", status:safe.noExternalOpen === false ? "blocked" : "pass", redacted:true },
      { rowId:"platform_authority", label:"平台最终依据", value:safe.platformFinalAuthorityVisible === false ? "仍需明确平台实时页面为准" : "平台实时页面为最终依据", status:safe.platformFinalAuthorityVisible === false ? "warning" : "pass", redacted:true }
    ]);
  }
  function buildGlobalShoppingPlatformPreflightBlockedReasonRows(input) {
    const safe = obj(input);
    const reasons = toArray(safe.blockedReasons);
    return clone(reasons.map(function (reason) {
      return { rowId:text(reason), label:"阻断原因", value:text(reason), status:"blocked", redacted:true };
    }));
  }
  function evaluateGlobalShoppingPlatformPreflightSafety(input) {
    const safe = obj(input);
    const packet = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    const pack = resolveSummary(safe, "redactedSearchParameterPackSummary", "WeishanGlobalShoppingRedactedSearchParameterPack", "buildGlobalShoppingRedactedSearchParameterPack", safe);
    const checklist = resolveSummary(safe, "userConfirmationChecklistSummary", "WeishanGlobalShoppingUserConfirmationChecklist", "buildGlobalShoppingUserConfirmationChecklist", safe);
    const decisionReview = obj(safe.sandboxDecisionReviewViewModelSummary || safe.sandboxDecisionReviewViewModel);
    const blockedReasons = [];
    const noRealUrl = !safe.bookingUrl && !safe.checkoutUrl && !safe.paymentUrl && !safe.orderUrl && safe.canGenerateRealUrl !== true;
    const noExternalOpen = safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true && safe.canOpenExternalNow !== true;
    const noDownloadExport = safe.download !== true && safe.export !== true && safe.canDownload !== true && safe.canExport !== true;
    const noSensitiveCarry = safe.identityIncluded !== true && safe.realNameStored !== true && safe.phoneStored !== true && safe.emailStored !== true && safe.platformCredentialIncluded !== true && safe.platformAccountIncluded !== true && safe.platformPasswordIncluded !== true && safe.paymentCredentialIncluded !== true && safe.paymentCredentialStored !== true;
    const noTransactionUrl = !safe.bookingUrl && !safe.checkoutUrl && !safe.paymentUrl && !safe.orderUrl;
    const noCheckoutPaymentTicketingOrder = safe.checkout !== true && safe.payment !== true && safe.ticketing !== true && safe.order !== true && safe.createOrder !== true && safe.canCheckout !== true && safe.canPay !== true && safe.canTicket !== true && safe.canCreateOrder !== true;
    const noForbiddenClaims = safe.claimsLowestPrice !== true && safe.claimsBestPrice !== true && safe.claimsLockedPrice !== true && safe.claimsAvailability !== true && safe.claimsBookability !== true && safe.claimsOfficialEndorsement !== true;
    const userBoundaryVisible = safe.userBoundaryVisible !== false;
    const platformFinalAuthorityVisible = safe.platformFinalAuthorityVisible !== false;
    if (!noRealUrl) blockedReasons.push("real_url_detected");
    if (!noExternalOpen) blockedReasons.push("external_open_detected");
    if (!noDownloadExport) blockedReasons.push("download_export_detected");
    if (!noSensitiveCarry) blockedReasons.push("sensitive_carry_detected");
    if (!noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!noCheckoutPaymentTicketingOrder) blockedReasons.push("transaction_capability_detected");
    if (!noForbiddenClaims) blockedReasons.push("forbidden_claim_detected");
    const preflightState = {
      handoffPacketReady:statusOf(packet) === "ready",
      parameterPackReady:statusOf(pack) === "ready",
      userChecklistReady:statusOf(checklist) === "ready",
      decisionReviewReady:Object.keys(decisionReview).length > 0,
      noRealUrl:noRealUrl,
      noExternalOpen:noExternalOpen,
      noDownloadExport:noDownloadExport,
      noSensitiveCarry:noSensitiveCarry,
      noTransactionUrl:noTransactionUrl,
      noCheckoutPaymentTicketingOrder:noCheckoutPaymentTicketingOrder,
      noForbiddenClaims:noForbiddenClaims,
      userBoundaryVisible:userBoundaryVisible,
      platformFinalAuthorityVisible:platformFinalAuthorityVisible
    };
    const needsReview = !preflightState.handoffPacketReady || !preflightState.parameterPackReady || !preflightState.userChecklistReady || !preflightState.decisionReviewReady || !preflightState.userBoundaryVisible || !preflightState.platformFinalAuthorityVisible;
    const clear = !blockedReasons.length && !needsReview;
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_PREFLIGHT_SAFETY_GATE_VERSION,
      status:blockedReasons.length ? "blocked" : (clear ? "clear" : "needs_review"),
      preflightBoundary:{
        preflightId:text(safe.preflightId || "platform_preflight_safety_gate_v2_2_4"),
        preflightMode:mode(safe.preflightMode || (clear ? "sandbox_ready" : "check_only")),
        checkOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canOpenExternalNow:false,
        canGenerateRealUrl:false,
        canDownload:false,
        canExport:false,
        canPersistUserDecision:false,
        canCarryIdentity:false,
        canCarryPlatformCredential:false,
        canCarryPaymentCredential:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      preflightState:preflightState,
      rows:buildGlobalShoppingPlatformPreflightSafetyRows(Object.assign({}, safe, preflightState)).concat(buildGlobalShoppingPlatformPreflightBlockedReasonRows({ blockedReasons:blockedReasons })),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"平台跳转前安全预检",
        resultLabel:blockedReasons.length ? "安全预检已阻断" : (clear ? "安全预检未触发阻断" : "安全预检仍需复核"),
        caveat:"该预检只检查跳转前边界，不打开平台，不生成链接，不替用户提交任何资料或订单。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function sanitizeGlobalShoppingPlatformPreflightSafetyGate(gate) {
    const safe = obj(gate);
    const evaluated = evaluateGlobalShoppingPlatformPreflightSafety(safe);
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_PREFLIGHT_SAFETY_GATE_VERSION,
      status:/^(clear|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status,
      preflightBoundary:clone(evaluated.preflightBoundary),
      preflightState:clone(evaluated.preflightState),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : clone(evaluated.rows),
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:clone(evaluated.userFacingSummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingPlatformPreflightSafetyGate(input) {
    try {
      return sanitizeGlobalShoppingPlatformPreflightSafetyGate(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPlatformPreflightSafetyGate({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingPlatformPreflightSafetyGateAuditDraft(input) {
    const gate = buildGlobalShoppingPlatformPreflightSafetyGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PLATFORM_PREFLIGHT_SAFETY_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_PREFLIGHT_SAFETY_GATE_VERSION,
      status:gate.status,
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

  window.WeishanGlobalShoppingPlatformPreflightSafetyGate = {
    GLOBAL_SHOPPING_PLATFORM_PREFLIGHT_SAFETY_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingPlatformPreflightSafetyGate,
    evaluateGlobalShoppingPlatformPreflightSafety,
    buildGlobalShoppingPlatformPreflightSafetyRows,
    buildGlobalShoppingPlatformPreflightBlockedReasonRows,
    buildGlobalShoppingPlatformPreflightSafetyGateAuditDraft,
    sanitizeGlobalShoppingPlatformPreflightSafetyGate
  };
})();
