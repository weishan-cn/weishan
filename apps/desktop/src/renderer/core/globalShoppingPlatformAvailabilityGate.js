;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE_VERSION = "4.0.2";
  const GATE_NAME = "global_shopping_platform_availability_gate_v1";

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
  function buildPlatformCandidate(input) {
    const safe = obj(input);
    const platform = obj(safe.platformCandidate);
    const sourceType = text(platform.sourceType || safe.sourceType || "");
    const itemType = text(platform.itemType || safe.itemType || "unknown");
    const relationType = text(platform.relationType || safe.relationType || "unknown");
    return {
      sourceName:text(platform.sourceName || safe.sourceName || "Sandbox Platform"),
      sourceType:/^(official|authorized|major_platform|aggregator|partner|affiliate|fixture)$/.test(sourceType) ? sourceType : "",
      allowedDomain:text(platform.allowedDomain || safe.allowedDomain || ""),
      itemType:/^(flight|hotel|product|local_service|unknown)$/.test(itemType) ? itemType : "unknown",
      relationType:/^(official|partner|affiliate|unknown)$/.test(relationType) ? relationType : "unknown",
      regionCode:text(platform.regionCode || safe.regionCode || "CN"),
      fixtureOnly:bool(platform.fixtureOnly, true),
      sandboxOnly:bool(platform.sandboxOnly, true),
      readOnly:bool(platform.readOnly, true),
      disabledToOpen:bool(platform.disabledToOpen, true),
      productionProviderDisabled:bool(platform.productionProviderDisabled, true)
    };
  }
  function evaluateGlobalShoppingPlatformAvailability(input) {
    const safe = obj(input);
    const candidate = buildPlatformCandidate(safe);
    const blockedReasons = [];
    const restricted = safe.restrictedCategory === true || text(safe.category || safe.procurementCategory || "") === "restricted_or_blocked";
    const highRisk = safe.highRiskCategory === true;
    const productionEnabled = safe.productionProvider === true || safe.realProvider === true || candidate.productionProviderDisabled !== true;
    const realUrls = Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl);
    const hasPartnerPolicy = obj(safe.partnerLinkPolicySummary).status ? true : obj(safe.partnerLinkPolicy).status ? true : false;

    if (restricted) blockedReasons.push("restricted_category_blocked");
    if (highRisk) blockedReasons.push("high_risk_category_blocked");
    if (productionEnabled) blockedReasons.push("production_provider_enabled");
    if (safe.openExternal === true || safe.windowOpen === true) blockedReasons.push("external_open_detected");
    if (realUrls) blockedReasons.push("real_transaction_url_detected");
    if (safe.payment === true || safe.order === true || safe.ticketing === true) blockedReasons.push("transaction_capability_detected");
    if (!candidate.fixtureOnly || !candidate.sandboxOnly || !candidate.readOnly || !candidate.disabledToOpen) blockedReasons.push("platform_candidate_not_read_only");

    const health = {
      hasAllowedDomain:Boolean(candidate.allowedDomain),
      hasSourceType:Boolean(candidate.sourceType),
      hasItemType:candidate.itemType !== "unknown",
      readOnlyDisabledToOpen:candidate.fixtureOnly === true && candidate.sandboxOnly === true && candidate.readOnly === true && candidate.disabledToOpen === true,
      productionProviderDisabled:candidate.productionProviderDisabled === true,
      noRestrictedCategory:restricted !== true,
      noHighRiskCategory:highRisk !== true,
      hasPartnerPolicy:hasPartnerPolicy,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noRealUrl:realUrls !== true,
      noPayment:safe.payment !== true,
      noOrder:safe.order !== true,
      noTicketing:safe.ticketing !== true
    };

    let status = "available";
    if (blockedReasons.length) status = "blocked";
    else if (!health.hasAllowedDomain || !health.hasSourceType || !health.hasItemType || !health.hasPartnerPolicy) status = "needs_review";

    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE_VERSION,
      status:status,
      platformCandidate:candidate,
      availabilityHealth:health,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingPlatformAvailabilityRows(input) {
    const gate = evaluateGlobalShoppingPlatformAvailability(input || {});
    const health = gate.availabilityHealth;
    return clone([
      row("platform", "平台候选", gate.platformCandidate.sourceName || "仍需复核", health.hasAllowedDomain ? "pass" : "warning"),
      row("domain", "允许域名", gate.platformCandidate.allowedDomain || "仍需复核", health.hasAllowedDomain ? "pass" : "warning"),
      row("source_type", "来源类型", gate.platformCandidate.sourceType || "仍需复核", health.hasSourceType ? "pass" : "warning"),
      row("item_type", "适用品类", gate.platformCandidate.itemType || "unknown", health.hasItemType ? "pass" : "warning"),
      row("display_boundary", "展示边界", health.readOnlyDisabledToOpen ? "fixture/sandbox/readOnly/disabledToOpen" : "展示边界异常", health.readOnlyDisabledToOpen ? "pass" : "blocked"),
      row("provider_boundary", "Provider 边界", health.productionProviderDisabled ? "真实 provider 仍禁用" : "检测到真实 provider 风险", health.productionProviderDisabled ? "pass" : "blocked"),
      row("category_boundary", "品类边界", health.noRestrictedCategory && health.noHighRiskCategory ? "当前品类可进入只读候选展示" : "当前品类不可展示", health.noRestrictedCategory && health.noHighRiskCategory ? "pass" : "blocked"),
      row("partner_policy", "合作链接政策", health.hasPartnerPolicy ? "已接入合作/联盟链接政策" : "仍需补充政策", health.hasPartnerPolicy ? "pass" : "warning"),
      row("open_boundary", "外跳能力", health.noExternalOpen ? "当前不打开真实平台" : "检测到外跳能力", health.noExternalOpen ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noRealUrl && health.noPayment && health.noOrder && health.noTicketing ? "无真实交易链接 / 不付款 / 不下单 / 不出票" : "检测到交易能力风险", health.noRealUrl && health.noPayment && health.noOrder && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingPlatformAvailabilityGate(gate) {
    const safe = obj(gate);
    const evaluation = evaluateGlobalShoppingPlatformAvailability(safe);
    const safeStatus = /^(available|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE_VERSION,
      status:safeStatus,
      platformCandidate:evaluation.platformCandidate,
      availabilityHealth:evaluation.availabilityHealth,
      rows:toArray(safe.rows).length ? toArray(safe.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingPlatformAvailabilityRows(evaluation),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"平台可用性",
        resultLabel:safeStatus === "available" ? "平台候选可展示" : (safeStatus === "needs_review" ? "平台可用性仍需复核" : "平台可用性已阻断"),
        caveat:"平台可用不代表官方背书、不代表最低价，也不代表当前可以直接打开、下单、付款或出票。",
        redacted:true
      },
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingPlatformAvailabilityGate(input) {
    try {
      return sanitizeGlobalShoppingPlatformAvailabilityGate(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingPlatformAvailabilityGate({ status:"failed_safe", blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingPlatformAvailabilityGateAuditDraft(input) {
    const gate = buildGlobalShoppingPlatformAvailabilityGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE_VERSION,
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

  window.WeishanGlobalShoppingPlatformAvailabilityGate = {
    GLOBAL_SHOPPING_PLATFORM_AVAILABILITY_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingPlatformAvailabilityGate,
    evaluateGlobalShoppingPlatformAvailability,
    buildGlobalShoppingPlatformAvailabilityRows,
    buildGlobalShoppingPlatformAvailabilityGateAuditDraft,
    sanitizeGlobalShoppingPlatformAvailabilityGate
  };
})();
