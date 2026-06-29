;(function () {
  "use strict";

  const GLOBAL_SHOPPING_LEGAL_PROVIDER_FIXTURE_ADAPTER_VERSION = "2.2.1";
  const ADAPTER_NAME = "global_shopping_legal_provider_fixture_adapter_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback == null ? 0 : fallback);
  }
  function bool(value, fallback) { return value == null ? fallback === true : value === true; }
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
  function normalizeProviderType(value) {
    const safe = text(value || "").toLowerCase();
    return /^(official|authorized|partner|affiliate|aggregator|fixture)$/.test(safe) ? safe : "unknown";
  }
  function normalizeProviderStatus(value) {
    const safe = text(value || "").toLowerCase();
    return /^(disabled|fixture|sandbox|production_disabled)$/.test(safe) ? safe : "fixture";
  }
  function normalizeLegalStatus(value) {
    const safe = text(value || "").toLowerCase();
    return /^(allowed|restricted|blocked|unknown)$/.test(safe) ? safe : "unknown";
  }
  function normalizeItemType(value) {
    const safe = text(value || "").toLowerCase();
    return /^(flight|hotel|product|local_service|unknown)$/.test(safe) ? safe : "unknown";
  }
  function normalizeSourceType(value, providerType) {
    const safe = text(value || providerType || "").toLowerCase();
    return /^(official|authorized|partner|affiliate|aggregator|fixture)$/.test(safe) ? safe : "fixture";
  }
  function normalizeTrustLevel(value, sourceType) {
    const safe = text(value || "").toLowerCase();
    if (/^(high|medium|low)$/.test(safe)) return safe;
    if (sourceType === "official" || sourceType === "authorized") return "high";
    if (sourceType === "partner") return "medium";
    return "low";
  }
  function fixtureItems(input) {
    const safe = obj(input);
    const items = [];
    function pushList(list, fallbackType, fallbackName) {
      toArray(list).forEach(function (item, index) {
        const safeItem = obj(item);
        items.push(Object.assign({}, safeItem, {
          sourceType:normalizeSourceType(safeItem.sourceType || fallbackType, fallbackType),
          sourceName:text(safeItem.sourceName || safeItem.providerName || fallbackName || safe.providerName || ("Fixture Source " + String(index + 1)))
        }));
      });
    }
    if (obj(safe.officialFixturePrice).basePrice || obj(safe.officialFixturePrice).totalPrice || obj(safe.officialFixturePrice).title) {
      pushList([safe.officialFixturePrice], "official", "Official Fixture");
    }
    pushList(safe.authorizedFixturePrices, "authorized", "Authorized Fixture");
    pushList(safe.partnerFixturePrices, "partner", "Partner Fixture");
    pushList(safe.affiliateFixturePrices, "affiliate", "Affiliate Fixture");
    pushList(safe.aggregatorFixturePrices, "aggregator", "Aggregator Fixture");
    pushList(safe.fixturePrices, normalizeSourceType(safe.sourceType || safe.providerType, safe.providerType), safe.providerName || "Fixture Provider");
    return items;
  }
  function normalizedInput(item, index, defaults) {
    const safe = obj(item);
    const sourceType = normalizeSourceType(safe.sourceType, defaults.providerType);
    return {
      sourceId:text(safe.sourceId || safe.fixtureId || (defaults.providerId || "provider") + "_source_" + String(index + 1)),
      sourceName:text(safe.sourceName || safe.providerName || defaults.providerName || ("Fixture Source " + String(index + 1))),
      sourceType:sourceType,
      sourceTrustLevel:normalizeTrustLevel(safe.sourceTrustLevel, sourceType),
      fixtureOnly:true,
      sandboxOnly:true,
      readOnly:true,
      itemType:normalizeItemType(safe.itemType || defaults.itemType),
      title:text(safe.title || safe.routeSummary || safe.itemTitle || "Fixture price candidate"),
      basePrice:number(safe.basePrice, 0),
      taxAmount:number(safe.taxAmount, 0),
      shippingFee:number(safe.shippingFee, 0),
      platformFee:number(safe.platformFee, 0),
      serviceFee:number(safe.serviceFee, 0),
      paymentFee:number(safe.paymentFee, 0),
      baggageFee:number(safe.baggageFee, 0),
      couponDiscount:number(safe.couponDiscount, 0),
      currency:text(safe.currency || "CNY") || "CNY",
      exchangeRate:number(safe.exchangeRate, 1),
      priceIncludesTax:bool(safe.priceIncludesTax, true),
      priceIncludesShipping:bool(safe.priceIncludesShipping, true),
      priceIncludesServiceFee:bool(safe.priceIncludesServiceFee, true),
      lastCheckedAt:text(safe.lastCheckedAt || "fixture-only"),
      caveat:text(safe.caveat || "Fixture feed only; not live, not final, not bookable.")
    };
  }
  function adaptGlobalShoppingLegalProviderFixture(input) {
    const safe = obj(input);
    const providerType = normalizeProviderType(safe.providerType || safe.sourceType);
    const providerStatus = normalizeProviderStatus(safe.providerStatus);
    const normalizedSourceInputs = fixtureItems(safe).slice(0, 8).map(function (item, index) {
      return normalizedInput(item, index, {
        providerId:text(safe.providerId || "provider_fixture"),
        providerName:text(safe.providerName || "Legal Provider Fixture"),
        providerType:providerType,
        itemType:normalizeItemType(safe.itemType)
      });
    });
    return clone({
      providerFixture:{
        providerId:text(safe.providerId || "provider_fixture"),
        providerName:text(safe.providerName || "Legal Provider Fixture"),
        providerType:providerType,
        providerRegion:text(safe.providerRegion || "global"),
        providerLegalStatus:normalizeLegalStatus(safe.providerLegalStatus),
        providerStatus:providerStatus,
        fixtureOnly:true,
        sandboxOnly:true,
        readOnly:true,
        productionDisabled:true,
        canFetchLivePrice:false,
        canReadProductionKey:false,
        canStoreRawResponse:false,
        canOpenExternalNow:false,
        canCheckout:false,
        canPay:false,
        canTicket:false
      },
      normalizedSourceInputs:normalizedSourceInputs
    });
  }
  function adaptGlobalShoppingLegalProviderFixtures(input) {
    return adaptGlobalShoppingLegalProviderFixture(input || {}).normalizedSourceInputs;
  }
  function evaluateGlobalShoppingLegalProviderFixture(input) {
    const adapted = adaptGlobalShoppingLegalProviderFixture(input || {});
    const provider = obj(adapted.providerFixture);
    const sources = toArray(adapted.normalizedSourceInputs);
    const health = {
      hasProviderId:Boolean(provider.providerId),
      hasProviderName:Boolean(provider.providerName),
      hasProviderType:provider.providerType !== "unknown",
      hasLegalStatus:provider.providerLegalStatus !== "unknown",
      hasProviderDisabledOrFixture:/^(disabled|fixture|sandbox|production_disabled)$/.test(provider.providerStatus),
      hasNormalizedSourceInputs:sources.length > 0,
      noProductionProvider:provider.productionDisabled === true && provider.providerStatus !== "production",
      noLiveFetch:provider.canFetchLivePrice === false,
      noProductionKeyRead:provider.canReadProductionKey === false,
      noRawResponsePersistence:provider.canStoreRawResponse === false,
      noExternalOpen:provider.canOpenExternalNow === false,
      noCheckout:provider.canCheckout === false,
      noPayment:provider.canPay === false,
      noTicketing:provider.canTicket === false
    };
    const blockedReasons = [];
    if (provider.providerLegalStatus === "blocked") blockedReasons.push("provider_legal_status_blocked");
    if (provider.providerStatus === "production" || provider.productionDisabled !== true) blockedReasons.push("production_provider_detected");
    if (provider.canFetchLivePrice === true) blockedReasons.push("live_fetch_detected");
    if (provider.canReadProductionKey === true) blockedReasons.push("production_key_read_detected");
    if (provider.canStoreRawResponse === true) blockedReasons.push("raw_response_persistence_detected");
    if (provider.canOpenExternalNow === true) blockedReasons.push("external_open_detected");
    if (provider.canCheckout === true || provider.canPay === true || provider.canTicket === true) blockedReasons.push("transaction_capability_detected");
    let status = "ready";
    if (blockedReasons.length) status = "blocked";
    else if (!health.hasProviderId || !health.hasProviderName || !health.hasProviderType || !health.hasLegalStatus || !health.hasProviderDisabledOrFixture || !health.hasNormalizedSourceInputs) status = "needs_review";
    return clone({
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_SHOPPING_LEGAL_PROVIDER_FIXTURE_ADAPTER_VERSION,
      status:status,
      providerFixture:provider,
      normalizedSourceInputs:sources,
      adapterHealth:health,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingLegalProviderFixtureRows(input) {
    const model = evaluateGlobalShoppingLegalProviderFixture(input || {});
    const provider = model.providerFixture;
    const health = model.adapterHealth;
    return clone([
      row("provider_id", "Provider ID", provider.providerId || "仍需复核", health.hasProviderId ? "pass" : "warning"),
      row("provider_name", "Provider 名称", provider.providerName || "仍需复核", health.hasProviderName ? "pass" : "warning"),
      row("provider_type", "Provider 类型", provider.providerType || "unknown", health.hasProviderType ? "pass" : "warning"),
      row("provider_legal", "法律状态", provider.providerLegalStatus || "unknown", provider.providerLegalStatus === "allowed" ? "pass" : (provider.providerLegalStatus === "restricted" ? "warning" : (provider.providerLegalStatus === "blocked" ? "blocked" : "warning"))),
      row("provider_status", "Provider 状态", provider.providerStatus + " / productionDisabled:true", health.hasProviderDisabledOrFixture ? "pass" : "blocked"),
      row("source_inputs", "Normalized source inputs", health.hasNormalizedSourceInputs ? String(model.normalizedSourceInputs.length) + " 个 fixture source" : "仍需补充 fixture source", health.hasNormalizedSourceInputs ? "pass" : "warning"),
      row("no_live_fetch", "实时请求", health.noLiveFetch ? "不请求网络" : "检测到实时请求风险", health.noLiveFetch ? "pass" : "blocked"),
      row("no_prod_key", "生产密钥", health.noProductionKeyRead ? "不读取生产密钥" : "检测到生产密钥读取风险", health.noProductionKeyRead ? "pass" : "blocked"),
      row("no_raw_response", "原始响应持久化", health.noRawResponsePersistence ? "不保存 raw provider response" : "检测到 raw response 持久化风险", health.noRawResponsePersistence ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noExternalOpen && health.noCheckout && health.noPayment && health.noTicketing ? "不打开真实平台 / 不付款 / 不下单 / 不出票" : "检测到交易能力风险", health.noExternalOpen && health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingLegalProviderFixtureAdapter(adapter) {
    const safe = obj(adapter);
    const evaluation = evaluateGlobalShoppingLegalProviderFixture(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_SHOPPING_LEGAL_PROVIDER_FIXTURE_ADAPTER_VERSION,
      status:status,
      providerFixture:evaluation.providerFixture,
      normalizedSourceInputs:evaluation.normalizedSourceInputs,
      adapterHealth:evaluation.adapterHealth,
      rows:toArray(safe.rows).length ? toArray(safe.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }) : buildGlobalShoppingLegalProviderFixtureRows(evaluation),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"合法 Provider Fixture 适配器",
        resultLabel:status === "ready" ? "Provider fixture 已准备" : (status === "needs_review" ? "Provider fixture 仍需复核" : "Provider fixture 已阻断"),
        caveat:"当前仅处理只读 fixture provider 数据，不请求真实平台，不读取生产密钥，不代表真实价格、可订或可下单能力。",
        redacted:true
      },
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingLegalProviderFixtureAdapter(input) {
    try {
      return sanitizeGlobalShoppingLegalProviderFixtureAdapter(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingLegalProviderFixtureAdapter({ status:"failed_safe", blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingLegalProviderFixtureAdapterAuditDraft(input) {
    const model = buildGlobalShoppingLegalProviderFixtureAdapter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_LEGAL_PROVIDER_FIXTURE_ADAPTER_AUDIT_DRAFT",
      adapterName:ADAPTER_NAME,
      appVersion:GLOBAL_SHOPPING_LEGAL_PROVIDER_FIXTURE_ADAPTER_VERSION,
      status:model.status,
      normalizedSourceInputCount:model.normalizedSourceInputs.length,
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

  window.WeishanGlobalShoppingLegalProviderFixtureAdapter = {
    GLOBAL_SHOPPING_LEGAL_PROVIDER_FIXTURE_ADAPTER_VERSION,
    ADAPTER_NAME,
    buildGlobalShoppingLegalProviderFixtureAdapter,
    adaptGlobalShoppingLegalProviderFixture,
    adaptGlobalShoppingLegalProviderFixtures,
    evaluateGlobalShoppingLegalProviderFixture,
    buildGlobalShoppingLegalProviderFixtureRows,
    buildGlobalShoppingLegalProviderFixtureAdapterAuditDraft,
    sanitizeGlobalShoppingLegalProviderFixtureAdapter
  };
})();
