;(function () {
  "use strict";

  const REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_VERSION = "2.1.28";
  const SCHEMA_VERSION = "provider_result_schema_v1";
  const REQUIRED_FIELDS = ["providerId", "providerName", "providerCategory", "resultType", "sourceType", "sourceUrlHost", "updatedAt", "readonlyEvidence"];
  const ALLOWED_RESULT_TYPES = ["flight_offer", "provider_notice", "no_result", "blocked_result", "schema_error"];
  const ALLOWED_PROVIDER_CATEGORIES = ["flight"];
  const FORBIDDEN_FIELDS = ["bookingUrl", "checkoutUrl", "paymentUrl", "orderUrl", "createOrderUrl", "holdBookingUrl", "rawProviderPayload", "rawHeaders", "rawResponse", "rawRequest", "rawApiKey", "rawSecret", "rawToken", "apiKey", "token", "authorization", "authorizationHeader", "providerAuth", "credentialQueryParams", "passengerIdentity", "passportNumber", "identityNumber", "bankCardNumber", "paymentToken"];
  const PRICE_RISK_RE = /\b(fake|mock|demo|ai estimate|ai estimated|estimated price|估价|模拟价格|示例价格)\b/i;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function text(value) { return String(value === undefined || value === null ? "" : value).trim(); }
  function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj || {}, key); }
  function redactRawCandidate(input) {
    const candidate = clone(input || {});
    FORBIDDEN_FIELDS.forEach(function (field) {
      if (hasOwn(candidate, field)) candidate[field] = "[REDACTED_FORBIDDEN_FIELD]";
    });
    return candidate;
  }
  function missingRequiredFields(input) {
    return REQUIRED_FIELDS.filter(function (field) { return !text(input && input[field]); });
  }
  function forbiddenFieldHits(input) {
    return FORBIDDEN_FIELDS.filter(function (field) { return hasOwn(input, field); });
  }
  function priceRiskHits(input) {
    const joined = JSON.stringify(input || {});
    return PRICE_RISK_RE.test(joined) ? ["fake/mock/demo/AI price blocked"] : [];
  }
  function sourceLabelValidation(input) {
    const gate = window.WeishanProviderResultSourceLabelGate;
    if (gate && typeof gate.validateProviderResultSourceLabel === "function") {
      return gate.validateProviderResultSourceLabel(Object.assign({}, input, {
        sourceHostDisplayName: input.sourceHostDisplayName || "Provider Sandbox",
        providerRegion: input.providerRegion || "sandbox",
        resultObservedAt: input.resultObservedAt || input.updatedAt,
        evidenceType: input.evidenceType || "sandbox_fixture",
        sourceTrustState: input.sourceTrustState || "sandbox_verified",
        redacted: true
      }));
    }
    return { validationDecision: "blocked", blockedReasons: ["source label gate missing"], redacted: true };
  }
  function buildAuditDraft(input, result) {
    const safe = result || {};
    return clone({
      eventType: "REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_DRAFT",
      providerCategory: text(input && input.providerCategory) || "flight",
      providerId: text(input && input.providerId) || "flight_provider",
      schemaVersion: SCHEMA_VERSION,
      validationDecision: safe.validationDecision || "blocked",
      resultDisplayDecision: safe.resultDisplayDecision || "blocked",
      blockedReasons: safe.blockedReasons || [],
      withheldReasons: safe.withheldReasons || [],
      forbiddenFieldHits: safe.forbiddenFieldHits || [],
      missingRequiredFields: safe.missingRequiredFields || [],
      ordinaryResultExposureCount: 0,
      priceExposureCount: 0,
      availabilityExposureCount: 0,
      bookingUrlExposureCount: 0,
      rawPayloadExposureCount: 0,
      realPriceDisplayedCount: 0,
      rawProviderPayloadDisplayedCount: 0,
      paymentAttemptCount: 0,
      orderAttemptCount: 0,
      identityUploadAttemptCount: 0,
      redacted: true
    });
  }
  function validateRealProviderResultSchema(resultInput) {
    const raw = resultInput && typeof resultInput === "object" ? resultInput : {};
    const missing = missingRequiredFields(raw);
    const forbidden = forbiddenFieldHits(raw);
    const priceRisks = priceRiskHits(raw);
    const blockedReasons = [];
    if (missing.length) blockedReasons.push("missing required fields");
    if (ALLOWED_RESULT_TYPES.indexOf(text(raw.resultType)) === -1) blockedReasons.push("resultType not allowed");
    if (ALLOWED_PROVIDER_CATEGORIES.indexOf(text(raw.providerCategory)) === -1) blockedReasons.push("providerCategory not allowed");
    if (forbidden.length) blockedReasons.push("forbidden URL/raw/secret/identity fields present");
    blockedReasons.push.apply(blockedReasons, priceRisks);
    const source = sourceLabelValidation(raw);
    if (source.validationDecision !== "pass") blockedReasons.push("source label validation blocked");
    const pass = blockedReasons.length === 0;
    const result = {
      version: REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_VERSION,
      gateName: "real_provider_result_schema_validation",
      status: "validation gate only",
      mode: "no ordinary result exposure",
      schemaVersion: SCHEMA_VERSION,
      validationPipeline: ["redact raw candidate", "forbidden field scan", "required field scan", "resultType allowlist", "providerCategory allowlist", "source label validation", "price exposure gate", "bookingUrl exposure gate", "ordinary result exposure gate", "audit event"],
      redactedCandidate: redactRawCandidate(raw),
      validationDecision: pass ? "withheld" : "blocked",
      resultDisplayDecision: pass ? "withheld" : "blocked",
      resultDisplayReason: pass ? "schema/source label pass but ordinary result exposure disabled" : "schema validation blocked",
      blockedReasons: Array.from(new Set(blockedReasons)),
      withheldReasons: pass ? ["validated result is console-only", "ordinary result exposure disabled", "price exposure disabled", "bookingUrl exposure disabled"] : [],
      forbiddenFieldHits: forbidden,
      missingRequiredFields: missing,
      sourceLabelValidation: source.validationDecision === "pass" ? "pass" : "blocked",
      ordinaryResultExposure: "disabled",
      priceExposure: "disabled",
      availabilityExposure: "disabled",
      bookingUrlExposure: "disabled",
      rawPayloadExposure: "forbidden",
      realProviderResultDisplay: "disabled",
      realPriceDisplay: "disabled",
      redacted: true
    };
    result.auditDraft = buildAuditDraft(raw, result);
    return clone(result);
  }
  function buildValidRealProviderShapedResult(overrides) {
    return clone(Object.assign({
      providerId: "flight_provider",
      providerName: "Flight Provider Sandbox",
      providerCategory: "flight",
      resultType: "flight_offer",
      sourceType: "sandbox_provider",
      sourceUrlHost: "provider-sandbox.invalid",
      sourceHostDisplayName: "Provider Sandbox",
      providerRegion: "sandbox",
      title: "Real-provider-shaped sandbox result",
      currency: "CNY",
      price: 0,
      taxesAndFees: "withheld",
      availability: "withheld",
      updatedAt: "2026-06-20T00:00:00.000Z",
      resultObservedAt: "2026-06-20T00:00:00.000Z",
      readonlyEvidence: "simulated real-provider-shaped object validation only",
      evidenceType: "sandbox_fixture",
      sourceTrustState: "sandbox_verified",
      redacted: true
    }, overrides || {}));
  }
  function buildRealProviderResultSchemaValidationDraft() {
    const sample = buildValidRealProviderShapedResult();
    const validation = validateRealProviderResultSchema(sample);
    const blocked = validateRealProviderResultSchema(Object.assign({}, sample, { rawProviderPayload: { hidden: true } }));
    return clone({
      version: REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_VERSION,
      gateName: "real_provider_result_schema_validation",
      status: "validation gate only",
      mode: "no ordinary result exposure",
      schemaVersion: SCHEMA_VERSION,
      validationPipeline: validation.validationPipeline,
      blockedResultExamples: blocked.blockedReasons,
      withheldResultPolicy: validation.withheldReasons,
      resultDisplayDecision: validation.resultDisplayDecision,
      auditDraft: validation.auditDraft,
      realProviderResultDisplay: "disabled",
      realPriceDisplay: "disabled",
      availabilityDisplay: "disabled",
      bookingUrlDisplay: "disabled",
      rawProviderPayloadDisplay: "forbidden",
      redacted: true
    });
  }
  function assertRealProviderResultSchemaValidationSafe(value) {
    const decision = value && value.gateName ? value : validateRealProviderResultSchema(value || buildValidRealProviderShapedResult());
    if (decision.redacted !== true) throw new Error("real provider result validation must stay redacted");
    if (decision.ordinaryResultExposure !== "disabled" || decision.priceExposure !== "disabled" || decision.availabilityExposure !== "disabled" || decision.bookingUrlExposure !== "disabled") throw new Error("result exposure must stay disabled");
    const audit = decision.auditDraft || {};
    ["ordinaryResultExposureCount", "priceExposureCount", "availabilityExposureCount", "bookingUrlExposureCount", "rawPayloadExposureCount", "realPriceDisplayedCount", "rawProviderPayloadDisplayedCount", "paymentAttemptCount", "orderAttemptCount", "identityUploadAttemptCount"].forEach(function (key) {
      if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero");
    });
    return true;
  }

  window.WeishanRealProviderResultSchemaValidation = {
    REAL_PROVIDER_RESULT_SCHEMA_VALIDATION_VERSION,
    SCHEMA_VERSION,
    REQUIRED_FIELDS,
    FORBIDDEN_FIELDS,
    validateRealProviderResultSchema,
    buildValidRealProviderShapedResult,
    buildRealProviderResultSchemaValidationDraft,
    buildAuditDraft,
    assertRealProviderResultSchemaValidationSafe
  };
})();
