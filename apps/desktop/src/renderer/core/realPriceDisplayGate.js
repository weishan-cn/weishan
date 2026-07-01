;(function () {
  "use strict";

  const REAL_PRICE_DISPLAY_GATE_VERSION = "3.3.0";
  const REQUIRED_BADGES = ["来源平台", "更新时间", "币种", "税费状态", "费用状态", "运费状态", "库存/余票可靠性", "最终以平台页面为准"];
  const FORBIDDEN_ACTIONS = ["bookingUrl", "payment", "order", "checkout", "identityUpload"];
  const FORBIDDEN_FIELDS = ["bookingUrl", "checkoutUrl", "paymentUrl", "orderUrl", "createOrderUrl", "holdBookingUrl", "rawProviderPayload", "rawHeaders", "rawResponse", "rawRequest", "payment", "order", "checkout", "identityUpload"];
  const BLOCKED_QUOTE_TYPES = ["ai_estimate", "mock_price", "demo_price", "fake_price", "scraped_unknown_price", "public_search_snippet_price", "manual_user_entered_price"];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function text(value) { return String(value === undefined || value === null ? "" : value).trim(); }
  function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj || {}, key); }
  function forbiddenHits(input) { return FORBIDDEN_FIELDS.filter(function (field) { return hasOwn(input, field); }); }
  function riskText(input) { return /\b(fake|mock|demo|ai estimate|ai estimated|estimated price)\b|AI 估价|估算价格|模拟价格|示例价格|约\s*¥|最低价\s*¥/i.test(JSON.stringify(input || {})); }
  function evaluateRealPriceDisplay(input) {
    const raw = input && typeof input === "object" ? input : {};
    const candidate = raw.normalizedProviderResult || raw.candidate || raw;
    const integrity = raw.priceIntegrityValidation || {};
    const surface = text(raw.displaySurface || "ordinary_result_card") || "ordinary_result_card";
    const blockedReasons = [];
    const withheldReasons = [];
    const quoteType = text(candidate.quoteType);

    if (forbiddenHits(candidate).length) blockedReasons.push("bookingUrl/payment/order/checkout/raw field present");
    if (BLOCKED_QUOTE_TYPES.includes(quoteType) || riskText(candidate)) blockedReasons.push("fake/mock/demo/AI/estimated price blocked");
    if (integrity.validationDecision === "blocked") blockedReasons.push("price integrity blocked");
    if (integrity.validationDecision !== "pass" && integrity.validationDecision !== undefined) withheldReasons.push("price integrity not pass");
    if (candidate.resultSchemaValidationDecision !== "pass") blockedReasons.push("result schema validation not pass");
    if (candidate.sourceLabelValidationDecision !== "pass") blockedReasons.push("source label validation not pass");
    if (quoteType === "user_bound_api_readonly_price" || quoteType === "provider_readonly_price") {
      withheldReasons.push("real credential not connected");
      withheldReasons.push("manual provider review pending");
    }
    if (quoteType && quoteType !== "sandbox_verified_price" && withheldReasons.length === 0 && blockedReasons.length === 0) withheldReasons.push("quoteType currently withheld");

    let displayDecision = "blocked";
    if (blockedReasons.length) displayDecision = "blocked";
    else if (withheldReasons.length) displayDecision = "withheld";
    else if (quoteType === "sandbox_verified_price" && integrity.validationDecision === "pass") {
      displayDecision = surface === "ordinary_result_card" ? "allow_guarded_price_card" : "allow";
    } else {
      displayDecision = "withheld";
      withheldReasons.push("display prerequisites incomplete");
    }

    const result = {
      version: REAL_PRICE_DISPLAY_GATE_VERSION,
      gateName: "real_price_display_gate",
      status: "guarded real price display only",
      displayDecision,
      displaySurface: surface,
      blockedReasons: Array.from(new Set(blockedReasons)),
      withheldReasons: Array.from(new Set(withheldReasons)),
      requiredBadges: REQUIRED_BADGES.slice(),
      requiredBadgesPresent: displayDecision === "allow" || displayDecision === "allow_guarded_price_card",
      finalPageDisclaimerPresent: Boolean(text(candidate.finalPageDisclaimer)),
      forbiddenActions: FORBIDDEN_ACTIONS.slice(),
      redacted: true
    };
    result.auditDraft = buildRealPriceDisplayAuditDraft(candidate, result);
    return clone(result);
  }
  function buildRealPriceDisplayAuditDraft(candidate, decision) {
    const safe = decision || {};
    return clone({
      eventType: "REAL_PRICE_DISPLAY_GATE_DRAFT",
      providerCategory: text(candidate && candidate.providerCategory) || "flight",
      providerId: text(candidate && candidate.providerId) || "flight_provider",
      quoteType: text(candidate && candidate.quoteType) || "missing",
      displayDecision: safe.displayDecision || "blocked",
      displaySurface: safe.displaySurface || "ordinary_result_card",
      requiredBadgesPresent: safe.requiredBadgesPresent === true,
      finalPageDisclaimerPresent: safe.finalPageDisclaimerPresent === true,
      guardedPriceCardDisplayedCount: safe.displayDecision === "allow_guarded_price_card" || safe.displayDecision === "allow" ? 1 : 0,
      productionPriceDisplayedCount: 0,
      bookingUrlDisplayedCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      rawProviderPayloadDisplayedCount: 0,
      redacted: true
    });
  }
  function buildGuardedPriceCard(candidateInput, displayDecisionInput) {
    const candidate = candidateInput && typeof candidateInput === "object" ? candidateInput : {};
    const decision = displayDecisionInput && typeof displayDecisionInput === "object" ? displayDecisionInput : evaluateRealPriceDisplay({ candidate, priceIntegrityValidation:{ validationDecision:"pass" }, displaySurface:"ordinary_result_card" });
    if (decision.displayDecision !== "allow_guarded_price_card" && decision.displayDecision !== "allow") {
      return clone({ visible:false, title:decision.displayDecision === "blocked" ? "价格结果已阻断" : "价格已隐藏", reasons:decision.blockedReasons && decision.blockedReasons.length ? decision.blockedReasons : decision.withheldReasons || [], redacted:true });
    }
    return clone({
      visible: true,
      title: "已验证真实价格",
      badge: "Sandbox/Test Provider Price · 非生产成交价",
      providerName: candidate.providerName,
      sourceUrlHost: candidate.sourceUrlHost,
      sourceHostDisplayName: candidate.sourceHostDisplayName,
      updatedAt: candidate.updatedAt,
      priceObservedAt: candidate.priceObservedAt,
      currency: candidate.currency,
      baseFare: candidate.baseFare === undefined || candidate.baseFare === null || candidate.baseFare === "" ? "未单独提供" : candidate.baseFare,
      taxes: candidate.taxes === undefined || candidate.taxes === null || candidate.taxes === "" ? "未单独提供" : candidate.taxes,
      fees: candidate.fees === undefined || candidate.fees === null || candidate.fees === "" ? "未单独提供" : candidate.fees,
      total: candidate.total,
      taxIncluded: candidate.taxIncluded,
      feesIncluded: candidate.feesIncluded,
      shippingIncluded: candidate.shippingIncluded,
      inventoryStatus: candidate.inventoryStatus,
      inventoryReliability: candidate.inventoryReliability,
      readonlyEvidence: candidate.readonlyEvidence,
      finalPageDisclaimer: candidate.finalPageDisclaimer || "最终价格、税费、库存/余票、退改签和行李规则，以平台页面为准。",
      forbiddenActions: FORBIDDEN_ACTIONS.slice(),
      redacted: true
    });
  }
  function buildRealPriceDisplayGateDraft() {
    const priceApi = window.WeishanPriceIntegrityTaxesFeesGateV1;
    const candidate = priceApi && typeof priceApi.buildSandboxVerifiedPriceCandidate === "function"
      ? priceApi.buildSandboxVerifiedPriceCandidate()
      : { providerId:"flight_provider", providerName:"Flight Provider Sandbox", providerCategory:"flight", quoteType:"sandbox_verified_price", resultSchemaValidationDecision:"pass", sourceLabelValidationDecision:"pass", currency:"CNY", total:1010, updatedAt:"2026-06-20T00:00:00.000Z", priceObservedAt:"2026-06-20T00:00:00.000Z", readonlyEvidence:"sandbox/test provider response shape validation only", finalPageDisclaimer:"最终以平台页面为准", redacted:true };
    const integrity = priceApi && typeof priceApi.validatePriceIntegrityTaxesFees === "function" ? priceApi.validatePriceIntegrityTaxesFees(candidate) : { validationDecision:"pass" };
    const allowed = evaluateRealPriceDisplay({ candidate, priceIntegrityValidation:integrity, displaySurface:"ordinary_result_card" });
    const withheld = evaluateRealPriceDisplay({ candidate:Object.assign({}, candidate, { quoteType:"provider_readonly_price" }), priceIntegrityValidation:Object.assign({}, integrity, { validationDecision:"withheld" }), displaySurface:"ordinary_result_card" });
    const blocked = evaluateRealPriceDisplay({ candidate:Object.assign({}, candidate, { quoteType:"fake_price", bookingUrl:"https://provider-sandbox.invalid/book" }), priceIntegrityValidation:Object.assign({}, integrity, { validationDecision:"blocked" }), displaySurface:"ordinary_result_card" });
    return clone({
      version: REAL_PRICE_DISPLAY_GATE_VERSION,
      gateName: "real_price_display_gate",
      status: "guarded real price display only",
      sandboxTestPriceDisplay: "guarded only",
      productionPriceDisplay: "disabled",
      ordinaryResultDisplay: "guarded card only",
      bookingUrl: "disabled",
      payment: "disabled",
      order: "disabled",
      identityUpload: "disabled",
      rawPayload: "forbidden",
      displayDecisionRules: ["sandbox_verified_price + schema pass + source label pass + price integrity pass -> guarded card", "user_bound_api_readonly_price -> withheld", "provider_readonly_price -> withheld", "fake/mock/demo/AI/estimated -> blocked", "bookingUrl/payment/order/checkout -> blocked"],
      requiredBadges: REQUIRED_BADGES.slice(),
      forbiddenActions: FORBIDDEN_ACTIONS.slice(),
      guardedPriceCardExample: buildGuardedPriceCard(candidate, allowed),
      withheldPriceExample: buildGuardedPriceCard(candidate, withheld),
      blockedPriceExample: buildGuardedPriceCard(candidate, blocked),
      auditDraft: allowed.auditDraft,
      redacted: true
    });
  }
  function assertRealPriceDisplayGateSafe(value) {
    const decision = value && value.gateName ? value : evaluateRealPriceDisplay(value || {});
    const audit = decision.auditDraft || {};
    if (decision.redacted !== true || audit.redacted !== true) throw new Error("real price display gate must stay redacted");
    ["productionPriceDisplayedCount", "bookingUrlDisplayedCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount", "rawProviderPayloadDisplayedCount"].forEach(function (key) {
      if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero");
    });
    return true;
  }

  window.WeishanRealPriceDisplayGate = {
    REAL_PRICE_DISPLAY_GATE_VERSION,
    REQUIRED_BADGES,
    FORBIDDEN_ACTIONS,
    evaluateRealPriceDisplay,
    buildRealPriceDisplayAuditDraft,
    buildGuardedPriceCard,
    buildRealPriceDisplayGateDraft,
    assertRealPriceDisplayGateSafe
  };
})();
