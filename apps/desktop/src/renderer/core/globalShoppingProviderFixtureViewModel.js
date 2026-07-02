;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_FIXTURE_VIEW_MODEL_VERSION = "4.0.4";
  const VIEW_MODEL_NAME = "global_shopping_provider_fixture_view_model_v1";
  const CAVEAT = "当前只展示合法 Provider fixture、凭据安全复核与 sandbox 价格 feed 状态，不连接真实 production provider，不代表真实价格或交易能力。";

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
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true }; }
  function api(name) { return window[name] || {}; }
  function legalProviderFixtureSummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.legalProviderFixtureSummary)).length) return obj(safe.legalProviderFixtureSummary);
    const adapterApi = api("WeishanGlobalShoppingLegalProviderFixtureAdapter");
    return typeof adapterApi.buildGlobalShoppingLegalProviderFixtureAdapter === "function" ? adapterApi.buildGlobalShoppingLegalProviderFixtureAdapter(safe) : {};
  }
  function providerCredentialSafetySummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.providerCredentialSafetySummary)).length) return obj(safe.providerCredentialSafetySummary);
    const reviewApi = api("WeishanGlobalShoppingProviderCredentialSafetyReview");
    return typeof reviewApi.buildGlobalShoppingProviderCredentialSafetyReview === "function" ? reviewApi.buildGlobalShoppingProviderCredentialSafetyReview(safe) : {};
  }
  function sandboxPriceFeedSummary(input, legalSummary, credentialSummary) {
    const safe = obj(input);
    if (Object.keys(obj(safe.sandboxPriceFeedSummary)).length) return obj(safe.sandboxPriceFeedSummary);
    const gateApi = api("WeishanGlobalShoppingSandboxPriceFeedGate");
    return typeof gateApi.buildGlobalShoppingSandboxPriceFeedGate === "function" ? gateApi.buildGlobalShoppingSandboxPriceFeedGate(Object.assign({}, safe, {
      legalProviderFixtureSummary:legalSummary,
      providerCredentialSafetySummary:credentialSummary,
      normalizedSourceInputs:legalSummary && legalSummary.normalizedSourceInputs || []
    })) : {};
  }
  function buildGlobalShoppingProviderFixtureCards(input) {
    const legal = legalProviderFixtureSummary(input || {});
    const credential = providerCredentialSafetySummary(input || {});
    const feed = sandboxPriceFeedSummary(input || {}, legal, credential);
    return clone([
      card("provider_fixture", "Provider Fixture", obj(obj(legal).userFacingSummary).resultLabel || "Provider fixture 仍需复核"),
      card("credential_safety", "凭据安全", obj(obj(credential).userFacingSummary).resultLabel || "Provider 凭据边界仍需复核"),
      card("sandbox_price_feed", "Sandbox 价格 Feed", obj(obj(feed).userFacingSummary).resultLabel || "Sandbox 价格 Feed 仍需复核"),
      card("feed_pipeline", "价格归一化链路", feed.status === "ready" ? "Fixture feed 可进入价格归一化" : "链路仍需复核")
    ]);
  }
  function sanitizeGlobalShoppingProviderFixtureViewModel(viewModel) {
    const safe = obj(viewModel);
    const legal = legalProviderFixtureSummary(safe);
    const credential = providerCredentialSafetySummary(safe);
    const feed = sandboxPriceFeedSummary(safe, legal, credential);
    const blocked = legal.status === "blocked" || credential.status === "blocked" || feed.status === "blocked";
    const needsReview = !blocked && (legal.status === "needs_review" || credential.status === "needs_review" || feed.status === "needs_review");
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FIXTURE_VIEW_MODEL_VERSION,
      status:status,
      title:"合法 Provider Fixture 与 Sandbox 价格 Feed",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderFixtureCards(safe),
      legalProviderFixtureRows:toArray(safe.legalProviderFixtureRows).length ? toArray(safe.legalProviderFixtureRows) : toArray(legal.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }),
      providerCredentialSafetyRows:toArray(safe.providerCredentialSafetyRows).length ? toArray(safe.providerCredentialSafetyRows) : toArray(credential.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }),
      sandboxPriceFeedRows:toArray(safe.sandboxPriceFeedRows).length ? toArray(safe.sandboxPriceFeedRows) : toArray(feed.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }),
      caveat:CAVEAT,
      legalProviderFixtureSummary:clone(legal),
      providerCredentialSafetySummary:clone(credential),
      sandboxPriceFeedSummary:clone(feed),
      legalProviderFixtureStatus:text(legal.status || ""),
      providerCredentialSafetyStatus:text(credential.status || ""),
      sandboxPriceFeedStatus:text(feed.status || ""),
      safeToProceedWithReadOnlyPriceProviderSandbox:status === "ready" && feed.status === "ready",
      redacted:true
    });
  }
  function buildGlobalShoppingProviderFixtureViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderFixtureViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderFixtureViewModel({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingProviderFixtureViewModelAuditDraft(input) {
    const model = buildGlobalShoppingProviderFixtureViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_FIXTURE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FIXTURE_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
      legalProviderFixtureStatus:model.legalProviderFixtureStatus,
      providerCredentialSafetyStatus:model.providerCredentialSafetyStatus,
      sandboxPriceFeedStatus:model.sandboxPriceFeedStatus,
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

  window.WeishanGlobalShoppingProviderFixtureViewModel = {
    GLOBAL_SHOPPING_PROVIDER_FIXTURE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderFixtureViewModel,
    buildGlobalShoppingProviderFixtureCards,
    buildGlobalShoppingProviderFixtureViewModelAuditDraft,
    sanitizeGlobalShoppingProviderFixtureViewModel
  };
})();
