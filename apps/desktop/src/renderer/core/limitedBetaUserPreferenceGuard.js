;(function () {
  "use strict";

  const LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION = "3.3.0";
  const counters = { restoreAttemptCount:0, restoreConfirmedCount:0, restoreBlockedCount:0, unsafePreferenceBlockedCount:0 };
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value === undefined || value === null ? "" : value).trim(); }
  function preferenceFrom(input) {
    const persistence = window.WeishanLimitedBetaPreferencePersistence;
    const raw = input && input.persistedPreference || (persistence && persistence.getCurrentPreferenceSync ? persistence.getCurrentPreferenceSync() : null);
    if (!raw || raw.schemaVersion !== LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION) return { malformed:true, preference:raw || null };
    return { malformed:false, preference:raw };
  }
  function evaluateLimitedBetaUserPreferenceGuard(input) {
    const data = input && typeof input === "object" ? input : {};
    const parsed = preferenceFrom(data);
    const pref = parsed.preference || {};
    const requestCategory = text(data.currentRequestCategory || data.requestCategory || data.providerCategory || "flight");
    const providerId = text(data.providerId || "flight_provider");
    const restrictedDecision = text(data.restrictedDecision || "allow");
    const rollbackDecision = text(data.rollbackDecision || (data.rollbackDecisionObject && data.rollbackDecisionObject.rollbackDecision) || pref.rollbackState || "not_needed");
    const userConfirmationState = text(data.userConfirmationState || "missing");
    const blockedReasons = [];
    let decision = "allow";
    let confirmationRequired = false;
    let safeFallbackApplied = parsed.malformed === true;
    if (parsed.malformed) blockedReasons.push("malformed preference");
    if (requestCategory !== "flight") blockedReasons.push("non-flight category blocked");
    if (providerId !== "flight_provider") blockedReasons.push("non-flight provider blocked");
    if (restrictedDecision === "blocked") blockedReasons.push("restricted category blocked");
    if (rollbackDecision === "rollback_active" || rollbackDecision === "forced_off") blockedReasons.push("rollback guard active");
    if (pref.globalLimitedBetaEnabled === false) blockedReasons.push("global limited beta disabled by user preference");
    if (["disabled", "forced_off", "rollback_active"].includes(pref.killSwitchState)) blockedReasons.push("kill switch disabled by persisted preference");
    if (pref.restoreConfirmationPending === true && userConfirmationState !== "confirmed") {
      confirmationRequired = true;
      counters.restoreBlockedCount += 1;
    }
    const categories = pref.categoryOverrides || {};
    if (categories.product === true || categories.hotel === true || categories.local_service === true || categories.ticket_or_activity === true || categories.restricted_or_blocked === true) {
      blockedReasons.push("unsafe non-flight preference override blocked");
      counters.unsafePreferenceBlockedCount += 1;
    }
    if (pref.paymentDisabled !== true || pref.orderDisabled !== true || pref.bookingUrlDisabled !== true || pref.identityUploadDisabled !== true) {
      blockedReasons.push("transaction flag attempted by preference");
      counters.unsafePreferenceBlockedCount += 1;
    }
    if (confirmationRequired) decision = "confirmation_required";
    else if (blockedReasons.length) decision = pref.globalLimitedBetaEnabled === false || pref.killSwitchState === "disabled" ? "withheld" : "blocked";
    return clone({
      gateName:"limited_beta_user_preference_guard",
      status:"user preference guard active",
      preferenceDecision:decision,
      blockedReason:blockedReasons.join("; ") || "none",
      confirmationRequired,
      persistedPreferenceLoaded:parsed.malformed === false,
      persistedPreferenceValid:parsed.malformed === false,
      safeFallbackApplied,
      allowedBetaScope:"flight_only",
      paymentDisabled:true,
      orderDisabled:true,
      bookingUrlDisabled:true,
      identityUploadDisabled:true,
      auditDraft:getLimitedBetaUserPreferenceGuardAuditDraft(decision, confirmationRequired, userConfirmationState, blockedReasons, safeFallbackApplied),
      redacted:true
    });
  }
  function getLimitedBetaUserPreferenceGuardAuditDraft(decision, confirmationRequired, userConfirmationState, blockedReasons, safeFallbackApplied) {
    return {
      eventType:"LIMITED_BETA_USER_PREFERENCE_GUARD_AUDIT_DRAFT",
      schemaVersion:LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION,
      preferenceDecision:decision || "allow",
      confirmationRequired:confirmationRequired === true,
      userConfirmationState:userConfirmationState || "missing",
      blockedReason:(blockedReasons || []).join("; ") || "none",
      allowedBetaScope:"flight_only",
      restrictedCategoryBlocked:true,
      nonFlightCategoryBlocked:true,
      paymentDisabled:true,
      orderDisabled:true,
      bookingUrlDisabled:true,
      identityUploadDisabled:true,
      restoreAttemptCount:counters.restoreAttemptCount,
      restoreConfirmedCount:counters.restoreConfirmedCount,
      restoreBlockedCount:counters.restoreBlockedCount,
      unsafePreferenceBlockedCount:counters.unsafePreferenceBlockedCount + (safeFallbackApplied ? 1 : 0),
      redacted:true
    };
  }
  function buildLimitedBetaUserPreferenceGuardDraft() {
    const persistence = window.WeishanLimitedBetaPreferencePersistence;
    const pref = persistence && persistence.getCurrentPreferenceSync ? persistence.getCurrentPreferenceSync() : null;
    const decision = evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:pref, currentRequestCategory:"flight", providerId:"flight_provider", userConfirmationState:pref && pref.restoreConfirmationPending ? "missing" : "confirmed" });
    return clone({
      version:LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION,
      status:"user preference guard active",
      restoreRule:"restore requires confirmation",
      safetyRule:"user preference cannot override safety gates",
      allowedBetaScope:"flight only",
      productBeta:"blocked",
      hotelBeta:"blocked",
      restricted:"blocked",
      bookingUrl:"disabled",
      payment:"disabled",
      order:"disabled",
      identityUpload:"disabled",
      decision,
      auditDraft:decision.auditDraft,
      redacted:true
    });
  }
  function assertLimitedBetaUserPreferenceGuardSafe() {
    const product = evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:{ schemaVersion:LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION, globalLimitedBetaEnabled:true, killSwitchState:"enabled", rollbackState:"not_needed", categoryOverrides:{ flight:true, product:true }, paymentDisabled:true, orderDisabled:true, bookingUrlDisabled:true, identityUploadDisabled:true }, currentRequestCategory:"product", providerId:"product_provider", userConfirmationState:"confirmed" });
    if (product.preferenceDecision === "allow") throw new Error("product beta must stay blocked");
    const restore = evaluateLimitedBetaUserPreferenceGuard({ persistedPreference:{ schemaVersion:LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION, globalLimitedBetaEnabled:true, killSwitchState:"enabled", rollbackState:"not_needed", restoreConfirmationPending:true, categoryOverrides:{ flight:true, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false }, paymentDisabled:true, orderDisabled:true, bookingUrlDisabled:true, identityUploadDisabled:true }, currentRequestCategory:"flight", providerId:"flight_provider", userConfirmationState:"missing" });
    if (restore.preferenceDecision !== "confirmation_required") throw new Error("restore must require confirmation");
    return true;
  }
  window.WeishanLimitedBetaUserPreferenceGuard = {
    LIMITED_BETA_USER_PREFERENCE_GUARD_VERSION,
    evaluateLimitedBetaUserPreferenceGuard,
    getLimitedBetaUserPreferenceGuardAuditDraft,
    buildLimitedBetaUserPreferenceGuardDraft,
    assertLimitedBetaUserPreferenceGuardSafe,
    _testOnly:{ counters }
  };
})();
