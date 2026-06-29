;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE_VERSION = "2.2.8";
  const CANDIDATE_NAME = "global_shopping_sandbox_deep_link_candidate_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function bool(value, fallback) { return value == null ? fallback === true : value === true; }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
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
  function buildCandidate(input) {
    const safe = obj(input);
    const candidate = obj(safe.deepLinkCandidate);
    const sourceType = text(candidate.sourceType || safe.sourceType || obj(obj(safe.platformAvailabilityGate).platformCandidate).sourceType || "fixture");
    const itemType = text(candidate.itemType || safe.itemType || obj(obj(safe.prefillCandidate).itemType).itemType || obj(obj(safe.searchParameterPrefillGate).prefillCandidate).itemType || "unknown");
    return {
      deepLinkId:text(candidate.deepLinkId || safe.deepLinkId || "sandbox_deep_link_candidate_001"),
      sourceName:text(candidate.sourceName || safe.sourceName || obj(obj(safe.platformAvailabilityGate).platformCandidate).sourceName || "Sandbox Platform"),
      sourceType:/^(official|authorized|major_platform|aggregator|partner|affiliate|fixture)$/.test(sourceType) ? sourceType : "fixture",
      allowedDomain:text(candidate.allowedDomain || safe.allowedDomain || obj(obj(safe.platformAvailabilityGate).platformCandidate).allowedDomain || ""),
      itemType:/^(flight|hotel|product|local_service|unknown)$/.test(itemType) ? itemType : "unknown",
      deepLinkMode:/^(disabled|fixture|sandbox)$/.test(text(candidate.deepLinkMode || safe.deepLinkMode || "sandbox")) ? text(candidate.deepLinkMode || safe.deepLinkMode || "sandbox") : "sandbox",
      fixtureOnly:bool(candidate.fixtureOnly, true),
      sandboxOnly:bool(candidate.sandboxOnly, true),
      readOnly:bool(candidate.readOnly, true),
      disabledToOpen:bool(candidate.disabledToOpen, true),
      canOpenExternalNow:bool(candidate.canOpenExternalNow, false),
      canBuildRealBookingUrl:bool(candidate.canBuildRealBookingUrl, false),
      canBuildCheckoutUrl:bool(candidate.canBuildCheckoutUrl, false),
      canBuildPaymentUrl:bool(candidate.canBuildPaymentUrl, false),
      canBuildOrderUrl:bool(candidate.canBuildOrderUrl, false),
      requiresUserConfirmation:bool(candidate.requiresUserConfirmation, true),
      carriesOnlyNonSensitiveSearchParameters:bool(candidate.carriesOnlyNonSensitiveSearchParameters, true),
      userCompletesCheckoutOnPlatform:bool(candidate.userCompletesCheckoutOnPlatform, true),
      platformRealtimePageIsSourceOfTruth:bool(candidate.platformRealtimePageIsSourceOfTruth, true),
      noPaymentHandledByWeishan:bool(candidate.noPaymentHandledByWeishan, true),
      noOrderHandledByWeishan:bool(candidate.noOrderHandledByWeishan, true),
      noTicketingHandledByWeishan:bool(candidate.noTicketingHandledByWeishan, true),
      noAccountCredentialStored:bool(candidate.noAccountCredentialStored, true),
      noIdentityDocumentStored:bool(candidate.noIdentityDocumentStored, true),
      noBankCardStored:bool(candidate.noBankCardStored, true),
      noPaymentCredentialStored:bool(candidate.noPaymentCredentialStored, true),
      sandboxDisplayUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null
    };
  }
  function evaluateGlobalShoppingSandboxDeepLinkCandidate(input) {
    const safe = obj(input);
    const candidate = buildCandidate(safe);
    const prefillSummary = obj(safe.searchParameterPrefillGate || safe.searchParameterPrefillSummary);
    const partnerSummary = obj(safe.partnerLinkPolicy || safe.partnerLinkPolicySummary);
    const platformSummary = obj(safe.platformAvailabilityGate || safe.platformAvailabilitySummary);
    const blockedReasons = [];
    const hasPrefillBoundary = Boolean(prefillSummary.status);
    const hasPartnerPolicy = Boolean(partnerSummary.status);
    const health = {
      hasAllowedDomain:Boolean(candidate.allowedDomain),
      hasSourceType:Boolean(candidate.sourceType),
      hasItemType:candidate.itemType !== "unknown",
      hasPrefillBoundary:hasPrefillBoundary,
      hasUserConfirmation:candidate.requiresUserConfirmation === true,
      hasPartnerPolicy:hasPartnerPolicy,
      noRealUrl:true,
      noExternalOpen:candidate.canOpenExternalNow !== true && safe.openExternal !== true && safe.windowOpen !== true,
      noPayment:candidate.noPaymentHandledByWeishan === true && safe.payment !== true,
      noOrder:candidate.noOrderHandledByWeishan === true && safe.order !== true,
      noTicketing:candidate.noTicketingHandledByWeishan === true && safe.ticketing !== true,
      noSensitiveCarry:candidate.carriesOnlyNonSensitiveSearchParameters === true && prefillSummary.status !== "blocked"
    };

    if (!candidate.fixtureOnly || !candidate.sandboxOnly || !candidate.readOnly || !candidate.disabledToOpen) blockedReasons.push("candidate_not_sandbox_read_only");
    if (candidate.canOpenExternalNow === true || safe.openExternal === true || safe.windowOpen === true) blockedReasons.push("external_open_detected");
    if (candidate.canBuildRealBookingUrl === true || candidate.canBuildCheckoutUrl === true || candidate.canBuildPaymentUrl === true || candidate.canBuildOrderUrl === true) blockedReasons.push("real_transaction_url_build_detected");
    if (safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl) blockedReasons.push("real_transaction_url_detected");
    if (safe.payment === true || safe.order === true || safe.ticketing === true) blockedReasons.push("transaction_capability_detected");
    if (candidate.carriesOnlyNonSensitiveSearchParameters !== true || prefillSummary.status === "blocked") blockedReasons.push("sensitive_prefill_detected");
    if (partnerSummary.status === "blocked") blockedReasons.push("partner_policy_blocked");
    if (platformSummary.status === "blocked") blockedReasons.push("platform_availability_blocked");

    let status = "ready";
    if (blockedReasons.length) status = "blocked";
    else if (!health.hasAllowedDomain || !health.hasSourceType || !health.hasItemType || !health.hasPrefillBoundary || !health.hasPartnerPolicy) status = "needs_review";

    return clone({
      candidateName:CANDIDATE_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE_VERSION,
      status:status,
      deepLinkCandidate:candidate,
      deepLinkHealth:health,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxDeepLinkRows(input) {
    const model = evaluateGlobalShoppingSandboxDeepLinkCandidate(input || {});
    const health = model.deepLinkHealth;
    return clone([
      row("target_platform", "目标平台", model.deepLinkCandidate.sourceName || "仍需复核", health.hasAllowedDomain ? "pass" : "warning"),
      row("allowed_domain", "允许域名", model.deepLinkCandidate.allowedDomain || "仍需复核", health.hasAllowedDomain ? "pass" : "warning"),
      row("source_type", "来源类型", model.deepLinkCandidate.sourceType || "仍需复核", health.hasSourceType ? "pass" : "warning"),
      row("item_type", "适用品类", model.deepLinkCandidate.itemType || "unknown", health.hasItemType ? "pass" : "warning"),
      row("prefill_boundary", "参数边界", health.hasPrefillBoundary && health.noSensitiveCarry ? "仅携带非敏感搜索条件" : "预填边界仍需复核", health.hasPrefillBoundary && health.noSensitiveCarry ? "pass" : "warning"),
      row("partner_policy", "合作链接政策", health.hasPartnerPolicy ? "已接入合作/联盟链接政策" : "仍需补充政策", health.hasPartnerPolicy ? "pass" : "warning"),
      row("deep_link_mode", "跳转模式", model.deepLinkCandidate.deepLinkMode + " / disabledToOpen:true", model.deepLinkCandidate.disabledToOpen === true ? "pass" : "blocked"),
      row("user_confirmation", "用户确认", health.hasUserConfirmation ? "requiresUserConfirmation:true" : "仍需补充确认", health.hasUserConfirmation ? "pass" : "warning"),
      row("realtime_price", "实时价格准绳", model.deepLinkCandidate.platformRealtimePageIsSourceOfTruth ? "平台页面为实时价格准绳" : "边界异常", model.deepLinkCandidate.platformRealtimePageIsSourceOfTruth ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noRealUrl && health.noExternalOpen && health.noPayment && health.noOrder && health.noTicketing ? "不打开真实平台 / 不生成真实交易链接 / 不付款 / 不下单 / 不出票" : "检测到交易能力风险", health.noRealUrl && health.noExternalOpen && health.noPayment && health.noOrder && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingSandboxDeepLinkCandidate(candidate) {
    const safe = obj(candidate);
    const evaluation = evaluateGlobalShoppingSandboxDeepLinkCandidate(safe);
    const safeStatus = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      candidateName:CANDIDATE_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE_VERSION,
      status:safeStatus,
      deepLinkCandidate:evaluation.deepLinkCandidate,
      deepLinkHealth:evaluation.deepLinkHealth,
      rows:toArray(safe.rows).length ? toArray(safe.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingSandboxDeepLinkRows(evaluation),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Sandbox 跳转候选",
        resultLabel:safeStatus === "ready" ? "Sandbox 跳转候选已准备" : (safeStatus === "needs_review" ? "Sandbox 跳转候选仍需复核" : "Sandbox 跳转候选已阻断"),
        caveat:"本轮仅生成只读 sandbox 跳转候选，不打开真实平台，不代表真实下单、付款、出票或锁价能力。",
        redacted:true
      },
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxDeepLinkCandidate(input) {
    try {
      return sanitizeGlobalShoppingSandboxDeepLinkCandidate(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxDeepLinkCandidate({ status:"failed_safe", blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingSandboxDeepLinkCandidateAuditDraft(input) {
    const model = buildGlobalShoppingSandboxDeepLinkCandidate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE_AUDIT_DRAFT",
      candidateName:CANDIDATE_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE_VERSION,
      status:model.status,
      rowCount:model.rows.length,
      blockedReasonCount:model.blockedReasons.length,
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

  window.WeishanGlobalShoppingSandboxDeepLinkCandidate = {
    GLOBAL_SHOPPING_SANDBOX_DEEP_LINK_CANDIDATE_VERSION,
    CANDIDATE_NAME,
    buildGlobalShoppingSandboxDeepLinkCandidate,
    evaluateGlobalShoppingSandboxDeepLinkCandidate,
    buildGlobalShoppingSandboxDeepLinkRows,
    buildGlobalShoppingSandboxDeepLinkCandidateAuditDraft,
    sanitizeGlobalShoppingSandboxDeepLinkCandidate
  };
})();
