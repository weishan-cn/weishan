;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_HANDOFF_VIEW_MODEL_VERSION = "3.4.0";
  const VIEW_MODEL_NAME = "global_shopping_sandbox_handoff_view_model_v1";
  const CAVEAT = "本轮仅展示 Sandbox 跳转候选、平台可用性与 provider fixture 安全准备状态，不打开真实平台。平台页面才是实时价格与最终下单地点。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
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
  function card(cardId, label, value) {
    return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true };
  }
  function api(name) { return window[name] || {}; }
  function sandboxDeepLinkSummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.sandboxDeepLinkCandidateSummary)).length) return obj(safe.sandboxDeepLinkCandidateSummary);
    const sandboxApi = api("WeishanGlobalShoppingSandboxDeepLinkCandidate");
    return typeof sandboxApi.buildGlobalShoppingSandboxDeepLinkCandidate === "function" ? sandboxApi.buildGlobalShoppingSandboxDeepLinkCandidate(safe) : {};
  }
  function platformAvailabilitySummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.platformAvailabilitySummary)).length) return obj(safe.platformAvailabilitySummary);
    const gateApi = api("WeishanGlobalShoppingPlatformAvailabilityGate");
    return typeof gateApi.buildGlobalShoppingPlatformAvailabilityGate === "function" ? gateApi.buildGlobalShoppingPlatformAvailabilityGate(safe) : {};
  }
  function partnerLinkPolicySummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.partnerLinkPolicySummary)).length) return obj(safe.partnerLinkPolicySummary);
    const policyApi = api("WeishanGlobalShoppingPartnerLinkPolicy");
    return typeof policyApi.buildGlobalShoppingPartnerLinkPolicy === "function" ? policyApi.buildGlobalShoppingPartnerLinkPolicy(safe) : {};
  }
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
  function sandboxPriceFeedSummary(input, legal, credential) {
    const safe = obj(input);
    if (Object.keys(obj(safe.sandboxPriceFeedSummary)).length) return obj(safe.sandboxPriceFeedSummary);
    const gateApi = api("WeishanGlobalShoppingSandboxPriceFeedGate");
    return typeof gateApi.buildGlobalShoppingSandboxPriceFeedGate === "function"
      ? gateApi.buildGlobalShoppingSandboxPriceFeedGate(Object.assign({}, safe, {
        legalProviderFixtureSummary:legal,
        providerCredentialSafetySummary:credential,
        normalizedSourceInputs:legal && legal.normalizedSourceInputs || []
      }))
      : {};
  }
  function buildGlobalShoppingSandboxHandoffCards(input) {
    const sandbox = sandboxDeepLinkSummary(input || {});
    const availability = platformAvailabilitySummary(input || {});
    const partner = partnerLinkPolicySummary(input || {});
    const legal = legalProviderFixtureSummary(input || {});
    const credential = providerCredentialSafetySummary(input || {});
    const feed = sandboxPriceFeedSummary(input || {}, legal, credential);
    return clone([
      card("sandbox_candidate", "Sandbox 跳转候选", obj(obj(sandbox).userFacingSummary).resultLabel || "仍需复核"),
      card("platform_availability", "平台可用性", obj(obj(availability).userFacingSummary).resultLabel || "仍需复核"),
      card("partner_policy", "合作/联盟链接政策", obj(obj(partner).userFacingSummary).resultLabel || "仍需复核"),
      card("provider_fixture", "Provider Fixture", obj(obj(legal).userFacingSummary).resultLabel || "仍需复核"),
      card("credential_safety", "凭据安全", obj(obj(credential).userFacingSummary).resultLabel || "仍需复核"),
      card("sandbox_price_feed", "Sandbox 价格 Feed", obj(obj(feed).userFacingSummary).resultLabel || "仍需复核"),
      card("checkout_boundary", "平台自行下单", "用户需在平台自行确认价格、登录、填写资料并完成下单")
    ]);
  }
  function buildGlobalShoppingPlatformAvailabilityRowsForView(input) {
    const availability = platformAvailabilitySummary(input || {});
    return clone(toArray(availability.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingPartnerPolicyRowsForView(input) {
    const partner = partnerLinkPolicySummary(input || {});
    return clone(toArray(partner.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingSandboxHandoffRows(input) {
    const sandbox = sandboxDeepLinkSummary(input || {});
    return clone(toArray(sandbox.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function sanitizeGlobalShoppingSandboxHandoffViewModel(viewModel) {
    const safe = obj(viewModel);
    const sandbox = sandboxDeepLinkSummary(safe);
    const availability = platformAvailabilitySummary(safe);
    const partner = partnerLinkPolicySummary(safe);
    const legal = legalProviderFixtureSummary(safe);
    const credential = providerCredentialSafetySummary(safe);
    const feed = sandboxPriceFeedSummary(safe, legal, credential);
    const blocked = sandbox.status === "blocked" || availability.status === "blocked" || partner.status === "blocked" || legal.status === "blocked" || credential.status === "blocked" || feed.status === "blocked";
    const needsReview = !blocked && (sandbox.status === "needs_review" || availability.status === "needs_review" || partner.status === "needs_review" || legal.status === "needs_review" || credential.status === "needs_review" || feed.status === "needs_review");
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_HANDOFF_VIEW_MODEL_VERSION,
      status:status,
      title:"Sandbox 跳转候选与平台可用性",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingSandboxHandoffCards(safe),
      sandboxRows:toArray(safe.sandboxRows).length ? toArray(safe.sandboxRows) : buildGlobalShoppingSandboxHandoffRows(safe),
      platformAvailabilityRows:toArray(safe.platformAvailabilityRows).length ? toArray(safe.platformAvailabilityRows) : buildGlobalShoppingPlatformAvailabilityRowsForView(safe),
      partnerPolicyRows:toArray(safe.partnerPolicyRows).length ? toArray(safe.partnerPolicyRows) : buildGlobalShoppingPartnerPolicyRowsForView(safe),
      caveat:CAVEAT,
      sandboxDeepLinkCandidateSummary:clone(sandbox),
      platformAvailabilitySummary:clone(availability),
      partnerLinkPolicySummary:clone(partner),
      legalProviderFixtureSummary:clone(legal),
      providerCredentialSafetySummary:clone(credential),
      sandboxPriceFeedSummary:clone(feed),
      sandboxDeepLinkStatus:text(sandbox.status || ""),
      platformAvailabilityStatus:text(availability.status || ""),
      partnerLinkPolicyStatus:text(partner.status || ""),
      legalProviderFixtureStatus:text(legal.status || ""),
      providerCredentialSafetyStatus:text(credential.status || ""),
      sandboxPriceFeedStatus:text(feed.status || ""),
      safeToProceedWithReadOnlyPriceProviderSandbox:legal.status === "ready" && credential.status === "ready" && feed.status === "ready",
      safeToProceedWithPartnerFixtureAdapter:sandbox.status === "ready" && availability.status === "available" && partner.status === "compliant" && legal.status === "ready" && credential.status === "ready" && feed.status === "ready",
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxHandoffViewModel(input) {
    try {
      return sanitizeGlobalShoppingSandboxHandoffViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxHandoffViewModel({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingSandboxHandoffViewModelAuditDraft(input) {
    const model = buildGlobalShoppingSandboxHandoffViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_HANDOFF_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_HANDOFF_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
      sandboxRowCount:model.sandboxRows.length,
      platformRowCount:model.platformAvailabilityRows.length,
      partnerRowCount:model.partnerPolicyRows.length,
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

  window.WeishanGlobalShoppingSandboxHandoffViewModel = {
    GLOBAL_SHOPPING_SANDBOX_HANDOFF_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingSandboxHandoffViewModel,
    buildGlobalShoppingSandboxHandoffCards,
    buildGlobalShoppingSandboxHandoffRows,
    buildGlobalShoppingPlatformAvailabilityRowsForView,
    buildGlobalShoppingPartnerPolicyRowsForView,
    buildGlobalShoppingSandboxHandoffViewModelAuditDraft,
    sanitizeGlobalShoppingSandboxHandoffViewModel
  };
})();
