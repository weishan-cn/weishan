;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PRICE_FEED_GATE_VERSION = "4.2.4";
  const GATE_NAME = "global_shopping_sandbox_price_feed_gate_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label || ""), value:text(value || ""), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
  function evaluateGlobalShoppingSandboxPriceFeedGate(input) {
    const safe = obj(input);
    const adapterSummary = obj(safe.legalProviderFixtureSummary || safe.legalProviderFixtureAdapterSummary || safe.globalShoppingLegalProviderFixtureAdapterSummary);
    const credentialSummary = obj(safe.providerCredentialSafetySummary || safe.providerCredentialSafetyReviewSummary);
    const normalizedSourceInputs = toArray(safe.normalizedSourceInputs || adapterSummary.normalizedSourceInputs);
    const health = {
      fixtureAdapterReady:adapterSummary.status === "ready",
      credentialSafetyReady:credentialSummary.status === "ready",
      hasNormalizedSourceInputs:normalizedSourceInputs.length > 0,
      fixtureOnly:normalizedSourceInputs.every(function (item) { return obj(item).fixtureOnly === true; }),
      sandboxOnly:normalizedSourceInputs.every(function (item) { return obj(item).sandboxOnly === true; }),
      readOnly:normalizedSourceInputs.every(function (item) { return obj(item).readOnly === true; }),
      noProductionProvider:safe.productionProvider !== true,
      noRawResponsePersistence:safe.rawResponseStored !== true,
      noLiveFetch:safe.canFetchLivePrice !== true && safe.liveFetch !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noCheckout:safe.checkout !== true,
      noPayment:safe.payment !== true,
      noTicketing:safe.ticketing !== true
    };
    const blockedReasons = [];
    if (safe.productionProvider === true) blockedReasons.push("production_provider_detected");
    if (safe.rawResponseStored === true) blockedReasons.push("raw_response_persistence_detected");
    if (safe.canFetchLivePrice === true || safe.liveFetch === true) blockedReasons.push("live_fetch_detected");
    if (safe.openExternal === true || safe.windowOpen === true) blockedReasons.push("external_open_detected");
    if (safe.checkout === true || safe.payment === true || safe.ticketing === true) blockedReasons.push("transaction_capability_detected");
    if (adapterSummary.status === "blocked") blockedReasons.push("fixture_adapter_blocked");
    if (credentialSummary.status === "blocked") blockedReasons.push("credential_safety_blocked");
    let status = "ready";
    if (blockedReasons.length) status = "blocked";
    else if (!health.fixtureAdapterReady || !health.credentialSafetyReady || !health.hasNormalizedSourceInputs || !health.fixtureOnly || !health.sandboxOnly || !health.readOnly) status = "needs_review";
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PRICE_FEED_GATE_VERSION,
      status:status,
      sandboxPriceFeed:{
        feedMode:"fixture_sandbox",
        fixtureOnly:true,
        sandboxOnly:true,
        readOnly:true,
        canEnterPriceNormalizer:status === "ready",
        canEnterOfficialAnchor:status === "ready",
        canEnterDuplicateMerge:status === "ready",
        canEnterCoveredLowestBoard:status === "ready"
      },
      sandboxPriceFeedHealth:health,
      legalProviderFixtureSummary:adapterSummary,
      providerCredentialSafetySummary:credentialSummary,
      normalizedSourceInputs:normalizedSourceInputs,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxPriceFeedRows(input) {
    const model = evaluateGlobalShoppingSandboxPriceFeedGate(input || {});
    const health = model.sandboxPriceFeedHealth;
    return clone([
      row("fixture_adapter", "Provider fixture", health.fixtureAdapterReady ? "Provider fixture 已准备" : "Provider fixture 仍需复核", health.fixtureAdapterReady ? "pass" : "warning"),
      row("credential_safety", "凭据安全", health.credentialSafetyReady ? "Provider 凭据边界安全" : "Provider 凭据边界仍需复核", health.credentialSafetyReady ? "pass" : "warning"),
      row("feed_shape", "Sandbox 价格 Feed", health.hasNormalizedSourceInputs ? String(model.normalizedSourceInputs.length) + " 个 normalized source input" : "仍需补充 feed", health.hasNormalizedSourceInputs ? "pass" : "warning"),
      row("feed_boundary", "Feed 边界", health.fixtureOnly && health.sandboxOnly && health.readOnly ? "Fixture feed 可进入价格归一化" : "Feed 边界仍需复核", health.fixtureOnly && health.sandboxOnly && health.readOnly ? "pass" : "warning"),
      row("no_live_fetch", "实时请求", health.noLiveFetch ? "不请求网络" : "检测到实时请求风险", health.noLiveFetch ? "pass" : "blocked"),
      row("no_raw_response", "原始响应", health.noRawResponsePersistence ? "不保存 raw provider response" : "检测到原始响应持久化风险", health.noRawResponsePersistence ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noExternalOpen && health.noCheckout && health.noPayment && health.noTicketing ? "不打开真实平台 / 不付款 / 不下单 / 不出票" : "检测到交易能力风险", health.noExternalOpen && health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingSandboxPriceFeedGate(gate) {
    const safe = obj(gate);
    const evaluation = evaluateGlobalShoppingSandboxPriceFeedGate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PRICE_FEED_GATE_VERSION,
      status:status,
      sandboxPriceFeed:evaluation.sandboxPriceFeed,
      sandboxPriceFeedHealth:evaluation.sandboxPriceFeedHealth,
      legalProviderFixtureSummary:clone(evaluation.legalProviderFixtureSummary || null),
      providerCredentialSafetySummary:clone(evaluation.providerCredentialSafetySummary || null),
      normalizedSourceInputs:clone(evaluation.normalizedSourceInputs),
      rows:toArray(safe.rows).length ? toArray(safe.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingSandboxPriceFeedRows(evaluation),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Sandbox 价格 Feed 闸门",
        resultLabel:status === "ready" ? "Sandbox 价格 Feed 已准备" : (status === "needs_review" ? "Sandbox 价格 Feed 仍需复核" : "Sandbox 价格 Feed 已阻断"),
        caveat:"当前只允许 fixture / sandbox 价格 feed 进入只读价格归一化链路，不请求真实 provider，不代表真实价格或交易能力。",
        redacted:true
      },
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxPriceFeedGate(input) {
    try {
      return sanitizeGlobalShoppingSandboxPriceFeedGate(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxPriceFeedGate({ status:"failed_safe", blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingSandboxPriceFeedGateAuditDraft(input) {
    const model = buildGlobalShoppingSandboxPriceFeedGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PRICE_FEED_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PRICE_FEED_GATE_VERSION,
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

  window.WeishanGlobalShoppingSandboxPriceFeedGate = {
    GLOBAL_SHOPPING_SANDBOX_PRICE_FEED_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingSandboxPriceFeedGate,
    evaluateGlobalShoppingSandboxPriceFeedGate,
    buildGlobalShoppingSandboxPriceFeedRows,
    buildGlobalShoppingSandboxPriceFeedGateAuditDraft,
    sanitizeGlobalShoppingSandboxPriceFeedGate
  };
})();
