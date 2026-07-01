;(function () {
  "use strict";

  const LIMITED_BETA_ROLLBACK_GUARD_VERSION = "3.6.0";
  const URL_FIELDS = ["bookingUrl", "checkoutUrl", "paymentUrl", "orderUrl", "createOrderUrl", "holdBookingUrl"];
  const IDENTITY_FIELDS = ["identityUpload", "passengerIdentity", "passport", "passportNumber", "bankCard", "bankCardNumber"];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value === undefined || value === null ? "" : value).trim();
  }

  function hasAny(object, fields) {
    return fields.some(function (field) { return object[field] !== undefined && object[field] !== null && object[field] !== ""; });
  }

  function isPass(value) {
    return ["pass", "allowed", "approved", "approved_for_limited_beta", "allow_limited_beta_price_card"].includes(text(value).toLowerCase());
  }

  function detectTriggers(input) {
    const value = input && typeof input === "object" ? input : {};
    const candidate = value.candidate || value.normalizedProviderResult || value;
    const triggers = [];
    const category = text(candidate.providerCategory || value.providerCategory);
    const providerId = text(candidate.providerId || value.providerId);
    const raw = JSON.stringify(candidate);

    if (hasAny(candidate, URL_FIELDS)) triggers.push("bookingUrl/payment/order url present");
    if (hasAny(candidate, IDENTITY_FIELDS)) triggers.push("identity upload field present");
    if (/production endpoint|https:\/\/api\.|prod[_-]?key|production key/i.test(raw)) triggers.push("production endpoint or key risk detected");
    if (providerId && providerId !== "flight_provider") triggers.push("unknown provider or non-flight provider");
    if (["restricted", "restricted_provider", "restricted_or_blocked"].includes(category)) triggers.push("restricted category");
    if (category && category !== "flight") triggers.push("non-flight category tries beta");
    if (!isPass(value.schemaValidation && value.schemaValidation.validationDecision || candidate.resultSchemaValidationDecision || "pass")) triggers.push("schema validation not pass");
    if (!isPass(value.sourceLabelValidation && value.sourceLabelValidation.validationDecision || candidate.sourceLabelValidationDecision || "pass")) triggers.push("source label not pass");
    if (!isPass(value.priceIntegrityValidation && value.priceIntegrityValidation.validationDecision || "pass")) triggers.push("price integrity not pass");
    if (value.manualProviderReview && value.manualProviderReview.manualReviewState && value.manualProviderReview.manualReviewState !== "approved_for_limited_beta") triggers.push("manual review not approved_for_limited_beta");
    if (value.killSwitchState === "forced_off" || value.killSwitchState === "rollback_active" || value.killSwitchForcedOff === true) triggers.push("kill switch forced_off");
    if (value.noSecretPersistenceFail === true) triggers.push("no-secret persistence fail");
    if (value.networkAttemptDetected === true || candidate.networkAttemptDetected === true) triggers.push("network attempt detected");
    if (candidate.rawProviderPayload) triggers.push("raw provider payload present");
    if (/fake|mock|demo|AI 估价|ai estimate|estimated price|约\s*¥|最低价\s*¥/i.test(raw)) triggers.push("fake/mock/demo/AI price detected");
    return Array.from(new Set(triggers));
  }

  function evaluateLimitedBetaRollbackGuard(input) {
    const triggers = detectTriggers(input);
    const rollback = triggers.length > 0;
    return clone({
      version: LIMITED_BETA_ROLLBACK_GUARD_VERSION,
      status: "rollback protection active",
      rollbackDecision: rollback ? "rollback_active" : "not_needed",
      rollbackReason: rollback ? triggers[0] : "none",
      triggerName: rollback ? triggers[0] : "none",
      triggers,
      hiddenSurfaces: rollback ? ["ordinary_result_card", "provider_console", "sandbox_console"] : [],
      fallbackSurface: "offline_planning_only",
      ordinaryResultFallback: "暂无真实价格结果",
      priceCardHidden: rollback,
      bookingUrlHidden: true,
      paymentDisabled: true,
      orderDisabled: true,
      identityUploadDisabled: true,
      auditRequired: true,
      redacted: true
    });
  }

  function buildRollbackAuditDraft(decisionInput) {
    const decision = decisionInput && typeof decisionInput === "object" ? decisionInput : evaluateLimitedBetaRollbackGuard({});
    return clone({
      eventType: "LIMITED_BETA_ROLLBACK_GUARD_AUDIT_DRAFT",
      schemaVersion: LIMITED_BETA_ROLLBACK_GUARD_VERSION,
      rollbackDecision: decision.rollbackDecision,
      rollbackReason: decision.rollbackReason,
      triggerName: decision.triggerName,
      priceCardHidden: decision.priceCardHidden,
      fallbackSurface: decision.fallbackSurface,
      ordinaryResultFallback: decision.ordinaryResultFallback,
      bookingUrlHidden: true,
      paymentDisabled: true,
      orderDisabled: true,
      identityUploadDisabled: true,
      networkAttemptCount: (decision.triggers || []).includes("network attempt detected") ? 1 : 0,
      rawPayloadDetectedCount: (decision.triggers || []).includes("raw provider payload present") ? 1 : 0,
      fakePriceDetectedCount: (decision.triggers || []).includes("fake/mock/demo/AI price detected") ? 1 : 0,
      bookingUrlDetectedCount: (decision.triggers || []).includes("bookingUrl/payment/order url present") ? 1 : 0,
      paymentFieldDetectedCount: (decision.triggers || []).includes("bookingUrl/payment/order url present") ? 1 : 0,
      identityFieldDetectedCount: (decision.triggers || []).includes("identity upload field present") ? 1 : 0,
      redacted: true
    });
  }

  function buildLimitedBetaRollbackGuardDraft() {
    const safe = evaluateLimitedBetaRollbackGuard({
      providerId:"flight_provider",
      providerCategory:"flight",
      schemaValidation:{ validationDecision:"pass" },
      sourceLabelValidation:{ validationDecision:"pass" },
      priceIntegrityValidation:{ validationDecision:"pass" },
      manualProviderReview:{ manualReviewState:"approved_for_limited_beta" }
    });
    const unsafe = evaluateLimitedBetaRollbackGuard({ providerId:"flight_provider", providerCategory:"flight", bookingUrl:"https://blocked.invalid/booking" });
    return clone({
      version: LIMITED_BETA_ROLLBACK_GUARD_VERSION,
      status: "rollback protection active",
      triggers: [
        "bookingUrl trigger: enabled",
        "payment/order trigger: enabled",
        "identity upload trigger: enabled",
        "restricted category trigger: enabled",
        "non-flight beta trigger: enabled",
        "schema/source/price gate fail trigger: enabled",
        "network attempt trigger: enabled",
        "raw payload trigger: enabled",
        "fake/mock/demo/AI price trigger: enabled"
      ],
      currentRollbackDecision: safe,
      rollbackExample: unsafe,
      fallbackSurface: "offline_planning_only",
      auditDraft: buildRollbackAuditDraft(unsafe),
      redacted: true
    });
  }

  function assertLimitedBetaRollbackGuardSafe(value) {
    const draft = value && typeof value === "object" ? value : buildLimitedBetaRollbackGuardDraft();
    const audit = draft.auditDraft || {};
    const booking = evaluateLimitedBetaRollbackGuard({ providerCategory:"flight", providerId:"flight_provider", bookingUrl:"https://blocked.invalid" });
    const product = evaluateLimitedBetaRollbackGuard({ providerCategory:"product", providerId:"product_provider" });
    if (booking.rollbackDecision !== "rollback_active") throw new Error("bookingUrl must trigger rollback");
    if (product.rollbackDecision !== "rollback_active") throw new Error("product beta attempt must trigger rollback");
    if (draft.currentRollbackDecision.fallbackSurface !== "offline_planning_only") throw new Error("fallback must stay offline planning only");
    if (audit.bookingUrlHidden !== true || audit.paymentDisabled !== true || audit.orderDisabled !== true || audit.identityUploadDisabled !== true) {
      throw new Error("rollback audit must keep transaction surfaces disabled");
    }
    return true;
  }

  window.WeishanLimitedBetaRollbackGuard = {
    LIMITED_BETA_ROLLBACK_GUARD_VERSION,
    evaluateLimitedBetaRollbackGuard,
    buildRollbackAuditDraft,
    buildLimitedBetaRollbackGuardDraft,
    assertLimitedBetaRollbackGuardSafe
  };
})();
