;(function () {
  "use strict";

  const PROVIDER_SANDBOX_RESPONSE_SCHEMA_GATE_VERSION = "2.1.61";
  const SCHEMA_VERSION = "provider_result_schema_v1";
  const ALLOWED_RESULT_TYPES = ["flight_offer", "provider_notice", "no_result", "blocked_result", "schema_error"];
  const REQUIRED_FIELDS = ["providerId", "providerName", "providerCategory", "resultType", "sourceType", "sourceUrlHost", "updatedAt", "readonlyEvidence", "sandboxOnly", "redacted"];
  const FORBIDDEN_FIELDS = ["bookingUrl", "checkoutUrl", "paymentUrl", "orderUrl", "createOrderUrl", "holdBookingUrl", "passengerIdentity", "passportNumber", "identityNumber", "bankCardNumber", "paymentToken", "rawApiKey", "rawSecret", "rawToken", "rawHeaders", "rawRequest", "rawResponse", "rawProviderPayload", "rawProviderPayloadWithSecrets", "providerAuth", "authorizationHeader", "credentialQueryParams"];
  const ALLOWED_NON_DISPLAY_FIELDS = ["price", "currency", "taxesAndFees", "availability", "providerReferenceId"];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function text(value) { return String(value === undefined || value === null ? "" : value).trim(); }
  function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj || {}, key); }
  function missingRequiredFields(input) {
    return REQUIRED_FIELDS.filter(function (field) {
      if (field === "sandboxOnly") return !input || input.sandboxOnly !== true;
      if (field === "redacted") return !input || input.redacted !== true;
      return !text(input && input[field]);
    });
  }
  function forbiddenFieldHits(input) {
    return FORBIDDEN_FIELDS.filter(function (field) { return hasOwn(input, field); });
  }
  function buildAuditDraft(input, result) {
    const safe = result || {};
    return clone({
      eventType: "SANDBOX_RESPONSE_SCHEMA_GATE_DRAFT",
      providerCategory: text(input && input.providerCategory) || "flight",
      providerId: text(input && input.providerId) || "flight_provider",
      schemaVersion: SCHEMA_VERSION,
      validationDecision: safe.validationDecision || "blocked",
      missingRequiredFieldCount: (safe.missingRequiredFields || []).length,
      forbiddenFieldHitCount: (safe.forbiddenFieldHits || []).length,
      blockedReason: (safe.blockedReasons || [])[0] || "none",
      ordinaryResultExposureCount: 0,
      priceExposureCount: 0,
      availabilityExposureCount: 0,
      bookingUrlExposureCount: 0,
      rawPayloadExposureCount: 0,
      realPriceDisplayedCount: 0,
      realProviderCallCount: 0,
      networkAttemptCount: 0,
      redacted: true
    });
  }
  function validateSandboxResponseSchema(responseInput) {
    const response = responseInput && typeof responseInput === "object" ? responseInput : {};
    const missing = missingRequiredFields(response);
    const hits = forbiddenFieldHits(response);
    const blockedReasons = [];
    if (missing.length) blockedReasons.push("missing required fields");
    if (hits.length) blockedReasons.push("forbidden fields present");
    if (ALLOWED_RESULT_TYPES.indexOf(text(response.resultType)) === -1) blockedReasons.push("resultType not allowed");
    const decision = blockedReasons.length ? "blocked" : "pass";
    const result = {
      version: PROVIDER_SANDBOX_RESPONSE_SCHEMA_GATE_VERSION,
      gateName: "provider_sandbox_response_schema_gate",
      status: "schema validation only",
      mode: "console-only",
      schemaVersion: SCHEMA_VERSION,
      validationDecision: decision,
      blockedReasons,
      withheldReasons: decision === "pass" ? ["schema pass is console-only and withheld from ordinary result surface"] : [],
      forbiddenFieldHits: hits,
      missingRequiredFields: missing,
      ordinaryResultExposure: "disabled",
      priceExposure: "disabled",
      availabilityExposure: "disabled",
      bookingUrlExposure: "disabled",
      rawPayloadExposure: "forbidden",
      redacted: true
    };
    result.auditDraft = buildAuditDraft(response, result);
    return clone(result);
  }
  function buildValidSandboxResponse(overrides) {
    return clone(Object.assign({
      providerId: "flight_provider",
      providerName: "Flight Provider Sandbox",
      providerCategory: "flight",
      resultType: "flight_offer",
      sourceType: "sandbox_provider",
      sourceUrlHost: "provider-sandbox.invalid",
      title: "Sandbox flight offer shape only",
      currency: "CNY",
      price: 0,
      taxesAndFees: "withheld",
      availability: "withheld",
      updatedAt: "2026-06-20T00:00:00.000Z",
      readonlyEvidence: "simulated sandbox response schema validation only",
      providerReferenceId: "sandbox-ref-redacted",
      sandboxOnly: true,
      redacted: true
    }, overrides || {}));
  }
  function buildProviderSandboxResponseSchemaGateDraft() {
    const sample = buildValidSandboxResponse();
    const validation = validateSandboxResponseSchema(sample);
    const blockedExample = validateSandboxResponseSchema(Object.assign({}, sample, { bookingUrl: "https://provider-sandbox.invalid/book" }));
    return clone({
      version: PROVIDER_SANDBOX_RESPONSE_SCHEMA_GATE_VERSION,
      gateName: "provider_sandbox_response_schema_gate",
      status: "schema validation only",
      mode: "console-only",
      schemaVersion: SCHEMA_VERSION,
      requiredFields: REQUIRED_FIELDS,
      allowedResultTypes: ALLOWED_RESULT_TYPES,
      allowedButNotDisplayedFields: ALLOWED_NON_DISPLAY_FIELDS,
      forbiddenFields: FORBIDDEN_FIELDS,
      sampleValidSandboxResponse: sample,
      validationExample: validation,
      sampleBlockedResponseReasons: blockedExample.blockedReasons,
      auditDraft: validation.auditDraft,
      ordinaryResultExposure: "disabled",
      priceExposure: "disabled",
      availabilityExposure: "disabled",
      bookingUrlExposure: "disabled",
      rawPayloadExposure: "forbidden",
      redacted: true
    });
  }
  function assertSandboxResponseSchemaGateSafe(value) {
    const decision = value && value.gateName ? value : validateSandboxResponseSchema(value || buildValidSandboxResponse());
    if (decision.redacted !== true) throw new Error("sandbox response schema gate must stay redacted");
    if (decision.ordinaryResultExposure !== "disabled" || decision.priceExposure !== "disabled" || decision.availabilityExposure !== "disabled" || decision.bookingUrlExposure !== "disabled") throw new Error("sandbox response exposure must stay disabled");
    if (decision.rawPayloadExposure !== "forbidden") throw new Error("raw payload exposure must stay forbidden");
    const audit = decision.auditDraft || {};
    ["ordinaryResultExposureCount", "priceExposureCount", "availabilityExposureCount", "bookingUrlExposureCount", "rawPayloadExposureCount", "realPriceDisplayedCount", "realProviderCallCount", "networkAttemptCount"].forEach(function (key) {
      if ((audit[key] || 0) !== 0) throw new Error(key + " must stay zero");
    });
    return true;
  }

  window.WeishanProviderSandboxResponseSchemaGate = {
    PROVIDER_SANDBOX_RESPONSE_SCHEMA_GATE_VERSION,
    SCHEMA_VERSION,
    REQUIRED_FIELDS,
    FORBIDDEN_FIELDS,
    ALLOWED_RESULT_TYPES,
    buildValidSandboxResponse,
    validateSandboxResponseSchema,
    buildProviderSandboxResponseSchemaGateDraft,
    buildAuditDraft,
    assertSandboxResponseSchemaGateSafe
  };
})();
