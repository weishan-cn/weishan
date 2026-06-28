;(function () {
  "use strict";

  const PRICE_INTEGRITY_TAXES_FEES_GATE_V1_VERSION = "2.1.93";
  const REQUIRED_FIELDS = [
    "providerId",
    "providerName",
    "providerCategory",
    "sourceUrlHost",
    "sourceHostDisplayName",
    "sourceType",
    "sourceTrustState",
    "resultSchemaValidationDecision",
    "sourceLabelValidationDecision",
    "currency",
    "total",
    "priceObservedAt",
    "updatedAt",
    "readonlyEvidence",
    "taxIncluded",
    "feesIncluded",
    "shippingIncluded",
    "inventoryStatus",
    "inventoryReliability",
    "finalPageDisclaimer",
    "redacted"
  ];
  const ALLOWED_QUOTE_TYPES = ["sandbox_verified_price", "user_bound_api_readonly_price", "provider_readonly_price"];
  const CURRENTLY_PASSABLE_QUOTE_TYPES = ["sandbox_verified_price"];
  const CURRENTLY_WITHHELD_QUOTE_TYPES = ["user_bound_api_readonly_price", "provider_readonly_price"];
  const BLOCKED_QUOTE_TYPES = ["ai_estimate", "mock_price", "demo_price", "fake_price", "scraped_unknown_price", "public_search_snippet_price", "manual_user_entered_price"];
  const FORBIDDEN_FIELDS = ["bookingUrl", "checkoutUrl", "paymentUrl", "orderUrl", "createOrderUrl", "holdBookingUrl", "rawProviderPayload", "rawHeaders", "rawResponse", "rawRequest", "payment", "order", "checkout", "identityUpload", "passengerIdentity", "passportNumber", "bankCardNumber"];
  const RISK_TEXT_RE = /\b(fake|mock|demo|ai estimate|ai estimated|estimated price)\b|AI 估价|估算价格|模拟价格|示例价格|约\s*¥|最低价\s*¥/i;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function text(value) { return String(value === undefined || value === null ? "" : value).trim(); }
  function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj || {}, key); }
  function isValidCurrency(value) { return /^[A-Z]{3}$/.test(text(value)); }
  function isValidAmount(value) {
    if (typeof value === "number") return Number.isFinite(value) && value >= 0;
    if (value && typeof value === "object") return isValidCurrency(value.currency || "CNY") && Number.isFinite(Number(value.amount)) && Number(value.amount) >= 0;
    return false;
  }
  function includesRiskText(value) { return RISK_TEXT_RE.test(JSON.stringify(value || {})); }
  function forbiddenFieldHits(input) { return FORBIDDEN_FIELDS.filter(function (field) { return hasOwn(input, field); }); }
  function missingRequiredFields(input) {
    return REQUIRED_FIELDS.filter(function (field) {
      if (field === "redacted") return !input || input.redacted !== true;
      return !text(input && input[field]) && input && input[field] !== false && input && input[field] !== 0;
    });
  }
  function completenessState(candidate) {
    const taxKnown = candidate.taxIncluded === true || candidate.taxIncluded === false;
    const feeKnown = candidate.feesIncluded === true || candidate.feesIncluded === false;
    const shipping = text(candidate.shippingIncluded);
    return {
      taxFeeCompleteness: taxKnown && feeKnown ? "complete" : "unknown_with_warning",
      shippingCompleteness: shipping === "not_applicable" || shipping === "true" || shipping === "false" ? "complete" : "unknown_with_warning",
      inventoryReliability: text(candidate.inventoryReliability) || "missing",
      sourceCompleteness: candidate.sourceLabelValidationDecision === "pass" && candidate.resultSchemaValidationDecision === "pass" ? "complete" : "blocked_or_withheld"
    };
  }
  function buildAuditDraft(candidate, decision) {
    const safe = decision || {};
    const blocked = safe.blockedReasons || [];
    return clone({
      eventType: "PRICE_INTEGRITY_TAXES_FEES_GATE_V1_DRAFT",
      providerCategory: text(candidate && candidate.providerCategory) || "flight",
      providerId: text(candidate && candidate.providerId) || "flight_provider",
      quoteType: text(candidate && candidate.quoteType) || "missing",
      validationDecision: safe.validationDecision || "blocked",
      displayEligibility: safe.displayEligibility || "blocked",
      blockedReasons: blocked,
      withheldReasons: safe.withheldReasons || [],
      requiredFieldsMissing: safe.requiredFieldsMissing || [],
      taxFeeCompleteness: safe.taxFeeCompleteness || "missing",
      shippingCompleteness: safe.shippingCompleteness || "missing",
      inventoryReliability: safe.inventoryReliability || "missing",
      sourceCompleteness: safe.sourceCompleteness || "missing",
      fakePriceBlockedCount: blocked.includes("fake/mock/demo/AI/estimated price blocked") && text(candidate && candidate.quoteType) === "fake_price" ? 1 : 0,
      mockPriceBlockedCount: blocked.includes("fake/mock/demo/AI/estimated price blocked") && text(candidate && candidate.quoteType) === "mock_price" ? 1 : 0,
      demoPriceBlockedCount: blocked.includes("fake/mock/demo/AI/estimated price blocked") && text(candidate && candidate.quoteType) === "demo_price" ? 1 : 0,
      aiEstimateBlockedCount: blocked.includes("fake/mock/demo/AI/estimated price blocked") && text(candidate && candidate.quoteType) === "ai_estimate" ? 1 : 0,
      estimatedPriceBlockedCount: blocked.includes("fake/mock/demo/AI/estimated price blocked") ? 1 : 0,
      bookingUrlBlockedCount: blocked.includes("bookingUrl/payment/order/checkout/identity field present") ? 1 : 0,
      paymentFieldBlockedCount: blocked.includes("bookingUrl/payment/order/checkout/identity field present") ? 1 : 0,
      orderFieldBlockedCount: blocked.includes("bookingUrl/payment/order/checkout/identity field present") ? 1 : 0,
      identityFieldBlockedCount: blocked.includes("bookingUrl/payment/order/checkout/identity field present") ? 1 : 0,
      priceDisplayedCount: safe.validationDecision === "pass" ? 1 : 0,
      redacted: true
    });
  }
  function validatePriceIntegrityTaxesFees(candidateInput) {
    const candidate = candidateInput && typeof candidateInput === "object" ? candidateInput : {};
    const blockedReasons = [];
    const withheldReasons = [];
    const missing = missingRequiredFields(candidate);
    const forbidden = forbiddenFieldHits(candidate);
    const quoteType = text(candidate.quoteType);

    if (forbidden.length) blockedReasons.push("bookingUrl/payment/order/checkout/identity field present");
    if (BLOCKED_QUOTE_TYPES.includes(quoteType) || includesRiskText(candidate)) blockedReasons.push("fake/mock/demo/AI/estimated price blocked");
    if (quoteType && !ALLOWED_QUOTE_TYPES.includes(quoteType)) blockedReasons.push("quoteType not allowed");
    if (candidate.sourceLabelValidationDecision !== "pass") blockedReasons.push("source label validation not pass");
    if (candidate.resultSchemaValidationDecision !== "pass" && candidate.resultSchemaValidationDecision !== "withheld-console-only") blockedReasons.push("result schema validation not pass");
    if (candidate.rawProviderPayload || candidate.rawHeaders || candidate.rawResponse || candidate.rawRequest) blockedReasons.push("raw payload/header/request/response present");

    if (missing.length) withheldReasons.push("missing required fields");
    if (!isValidCurrency(candidate.currency)) withheldReasons.push("missing or invalid currency");
    if (!isValidAmount(candidate.total)) withheldReasons.push("missing or invalid total");
    if (!text(candidate.updatedAt)) withheldReasons.push("missing updatedAt");
    if (!text(candidate.priceObservedAt)) withheldReasons.push("missing priceObservedAt");
    if (!text(candidate.readonlyEvidence)) withheldReasons.push("missing readonlyEvidence");
    if (CURRENTLY_WITHHELD_QUOTE_TYPES.includes(quoteType)) {
      withheldReasons.push("real credential not connected");
      withheldReasons.push("manual provider review pending");
    }
    if (!CURRENTLY_PASSABLE_QUOTE_TYPES.includes(quoteType) && ALLOWED_QUOTE_TYPES.includes(quoteType)) withheldReasons.push("quoteType currently withheld");

    const completeness = completenessState(candidate);
    const validationDecision = blockedReasons.length ? "blocked" : (withheldReasons.length ? "withheld" : "pass");
    const result = {
      version: PRICE_INTEGRITY_TAXES_FEES_GATE_V1_VERSION,
      gateName: "price_integrity_taxes_fees_gate_v1",
      status: "price integrity validation only",
      schemaVersion: "price_integrity_v1",
      validationDecision,
      displayEligibility: validationDecision === "pass" ? "eligible_for_guarded_display" : validationDecision,
      blockedReasons: Array.from(new Set(blockedReasons)),
      withheldReasons: Array.from(new Set(withheldReasons)),
      requiredFieldsMissing: missing,
      taxFeeCompleteness: completeness.taxFeeCompleteness,
      shippingCompleteness: completeness.shippingCompleteness,
      inventoryReliability: completeness.inventoryReliability,
      sourceCompleteness: completeness.sourceCompleteness,
      finalPageDisclaimerRequired: true,
      redacted: true
    };
    result.auditDraft = buildAuditDraft(candidate, result);
    return clone(result);
  }
  function buildSandboxVerifiedPriceCandidate(overrides) {
    return clone(Object.assign({
      providerId: "flight_provider",
      providerName: "Flight Provider Sandbox",
      providerCategory: "flight",
      sourceUrlHost: "provider-sandbox.invalid",
      sourceHostDisplayName: "Provider Sandbox",
      sourceType: "sandbox_provider",
      sourceTrustState: "sandbox_verified",
      resultSchemaValidationDecision: "pass",
      sourceLabelValidationDecision: "pass",
      currency: "CNY",
      baseFare: 860,
      taxes: 120,
      fees: 30,
      total: 1010,
      taxIncluded: true,
      feesIncluded: true,
      shippingIncluded: "not_applicable",
      inventoryStatus: "provider_reported",
      inventoryReliability: "provider_reported",
      priceObservedAt: "2026-06-20T00:00:00.000Z",
      updatedAt: "2026-06-20T00:00:00.000Z",
      readonlyEvidence: "sandbox/test provider response shape validation only",
      quoteType: "sandbox_verified_price",
      priceDisplayMode: "guarded_price_card",
      finalPageDisclaimer: "最终价格、税费、库存/余票、退改签和行李规则，以平台页面为准。",
      redacted: true
    }, overrides || {}));
  }
  function buildPriceIntegrityTaxesFeesGateV1Draft() {
    const pass = buildSandboxVerifiedPriceCandidate();
    const withheld = buildSandboxVerifiedPriceCandidate({ currency: "", quoteType: "provider_readonly_price" });
    const blocked = buildSandboxVerifiedPriceCandidate({ quoteType: "fake_price", total: "fake price", bookingUrl: "https://provider-sandbox.invalid/book" });
    return clone({
      version: PRICE_INTEGRITY_TAXES_FEES_GATE_V1_VERSION,
      gateName: "price_integrity_taxes_fees_gate_v1",
      status: "price integrity validation only",
      schemaVersion: "price_integrity_v1",
      allowedQuoteTypes: ALLOWED_QUOTE_TYPES,
      currentlyPassableQuoteTypes: CURRENTLY_PASSABLE_QUOTE_TYPES,
      currentlyWithheldQuoteTypes: CURRENTLY_WITHHELD_QUOTE_TYPES,
      blockedQuoteTypes: BLOCKED_QUOTE_TYPES,
      requiredFields: REQUIRED_FIELDS,
      withheldRules: ["missing currency -> price withheld", "missing total -> price withheld", "missing updatedAt -> price withheld", "missing priceObservedAt -> price withheld", "missing readonlyEvidence -> price withheld", "real credential not connected -> price withheld", "manual provider review pending -> price withheld"],
      blockedRules: ["source label not pass -> blocked", "schema validation not pass -> blocked", "fake/mock/demo/AI/estimated price -> blocked", "bookingUrl/payment/order/checkout/identity field -> blocked", "raw payload/header/request/response -> blocked"],
      samplePassCandidate: pass,
      samplePassValidation: validatePriceIntegrityTaxesFees(pass),
      sampleWithheldCandidate: withheld,
      sampleWithheldValidation: validatePriceIntegrityTaxesFees(withheld),
      sampleBlockedCandidate: blocked,
      sampleBlockedValidation: validatePriceIntegrityTaxesFees(blocked),
      auditDraft: validatePriceIntegrityTaxesFees(pass).auditDraft,
      redacted: true
    });
  }
  function assertPriceIntegrityTaxesFeesGateV1Safe(value) {
    const decision = value && value.gateName ? value : validatePriceIntegrityTaxesFees(value || buildSandboxVerifiedPriceCandidate());
    if (!["pass", "withheld", "blocked"].includes(decision.validationDecision)) throw new Error("invalid price integrity decision");
    if (decision.redacted !== true || !decision.auditDraft || decision.auditDraft.redacted !== true) throw new Error("price integrity gate must stay redacted");
    const blocked = validatePriceIntegrityTaxesFees(buildSandboxVerifiedPriceCandidate({ quoteType: "fake_price", total: "AI estimate", bookingUrl: "https://provider-sandbox.invalid/book" }));
    if (blocked.validationDecision !== "blocked") throw new Error("fake/booking price candidate must be blocked");
    return true;
  }

  window.WeishanPriceIntegrityTaxesFeesGateV1 = {
    PRICE_INTEGRITY_TAXES_FEES_GATE_V1_VERSION,
    REQUIRED_FIELDS,
    ALLOWED_QUOTE_TYPES,
    CURRENTLY_PASSABLE_QUOTE_TYPES,
    CURRENTLY_WITHHELD_QUOTE_TYPES,
    BLOCKED_QUOTE_TYPES,
    FORBIDDEN_FIELDS,
    buildSandboxVerifiedPriceCandidate,
    validatePriceIntegrityTaxesFees,
    buildPriceIntegrityTaxesFeesGateV1Draft,
    buildAuditDraft,
    assertPriceIntegrityTaxesFeesGateV1Safe
  };
})();
