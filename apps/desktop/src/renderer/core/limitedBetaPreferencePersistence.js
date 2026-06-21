;(function () {
  "use strict";

  const LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION = "2.1.34";
  const STORE_FILE = "limited-beta-preferences.v1.json";
  const counters = {
    restoreAttemptCount:0,
    restoreConfirmedCount:0,
    restoreBlockedCount:0,
    unsafePreferenceBlockedCount:0,
    localStorageWriteCount:0,
    sessionStorageWriteCount:0,
    envWriteCount:0,
    secretPersistedCount:0,
    endpointPersistedCount:0,
    rawPayloadPersistedCount:0
  };
  let loaded = false;
  let valid = true;
  let safeFallback = false;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value === undefined || value === null ? "" : value).trim().slice(0, 160); }
  function now() { return new Date().toISOString(); }
  function defaultPreference(action, reason) {
    return {
      schemaVersion:LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION,
      preferenceVersion:1,
      globalLimitedBetaEnabled:true,
      categoryOverrides:{ flight:true, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides:{ flight_provider:true },
      surfaceOverrides:{ ordinary_result_card:true, provider_console:true, sandbox_console:true },
      killSwitchState:"enabled",
      rollbackState:"not_needed",
      lastAction:action || "initial_default",
      reason:text(reason) || "flight limited beta safe default",
      actor:action ? "local_user" : "system_guard",
      updatedAt:now(),
      requiresUserConfirmationForRestore:true,
      restoreConfirmationPending:false,
      allowedBetaScope:"flight_only",
      paymentDisabled:true,
      orderDisabled:true,
      bookingUrlDisabled:true,
      identityUploadDisabled:true,
      redacted:true
    };
  }
  function sanitize(input) {
    const raw = input && typeof input === "object" ? clone(input.preference || input) : null;
    const invalid = !raw || raw.schemaVersion !== LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION;
    if (invalid) {
      counters.unsafePreferenceBlockedCount += raw ? 1 : 0;
      safeFallback = true;
    }
    const base = defaultPreference(invalid ? "auto_recovered_invalid_state" : raw.lastAction, invalid ? "invalid preference recovered" : raw.reason);
    const next = Object.assign({}, base, raw || {});
    const categories = Object.assign({}, base.categoryOverrides, next.categoryOverrides || {});
    categories.product = false;
    categories.hotel = false;
    categories.local_service = false;
    categories.ticket_or_activity = false;
    categories.restricted_or_blocked = false;
    let killSwitchState = ["enabled", "disabled", "forced_off", "rollback_active"].includes(next.killSwitchState) ? next.killSwitchState : "disabled";
    let rollbackState = ["not_needed", "rollback_active", "forced_off"].includes(next.rollbackState) ? next.rollbackState : "not_needed";
    if (killSwitchState === "rollback_active") rollbackState = "rollback_active";
    if (killSwitchState === "forced_off") rollbackState = "forced_off";
    const enabled = next.globalLimitedBetaEnabled === true && killSwitchState === "enabled" && rollbackState === "not_needed";
    categories.flight = enabled;
    const provider = Object.assign({}, base.providerOverrides, next.providerOverrides || {});
    provider.flight_provider = enabled;
    const surfaces = Object.assign({}, base.surfaceOverrides, next.surfaceOverrides || {});
    surfaces.ordinary_result_card = enabled;
    surfaces.provider_console = enabled;
    surfaces.sandbox_console = enabled;
    return {
      schemaVersion:LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION,
      preferenceVersion:1,
      globalLimitedBetaEnabled:enabled,
      categoryOverrides:categories,
      providerOverrides:provider,
      surfaceOverrides:surfaces,
      killSwitchState,
      rollbackState,
      lastAction:text(next.lastAction) || "initial_default",
      reason:text(next.reason) || "limited beta preference updated",
      actor:["local_user", "system_guard", "test"].includes(next.actor) ? next.actor : "system_guard",
      updatedAt:text(next.updatedAt) || now(),
      requiresUserConfirmationForRestore:true,
      restoreConfirmationPending:next.restoreConfirmationPending === true,
      allowedBetaScope:"flight_only",
      paymentDisabled:true,
      orderDisabled:true,
      bookingUrlDisabled:true,
      identityUploadDisabled:true,
      redacted:true
    };
  }
  let currentPreference = defaultPreference();
  function bridge() { return window.weishanLimitedBetaPreference || null; }
  function notify() {
    try { window.dispatchEvent(new CustomEvent("weishan:limited-beta-preference-updated", { detail:buildPersistenceDraft() })); } catch (_) {}
  }
  function applyEnvelope(envelope) {
    loaded = Boolean(envelope && envelope.persistedPreferenceLoaded);
    valid = envelope && envelope.persistedPreferenceValid !== false;
    safeFallback = safeFallback || Boolean(envelope && envelope.safeFallbackApplied);
    currentPreference = sanitize(envelope && (envelope.preference || envelope));
    return clone(currentPreference);
  }
  function persist(method, payload, optimistic) {
    if (optimistic) currentPreference = sanitize(optimistic);
    notify();
    const api = bridge();
    if (!api || typeof api[method] !== "function") return Promise.resolve(buildPersistenceDraft());
    return api[method](payload || {}).then(function (envelope) {
      applyEnvelope(envelope);
      notify();
      return buildPersistenceDraft();
    }).catch(function () {
      safeFallback = true;
      notify();
      return buildPersistenceDraft();
    });
  }
  function loadPersistedPreference() {
    const api = bridge();
    if (!api || typeof api.getLimitedBetaPreference !== "function") {
      loaded = false;
      valid = true;
      notify();
      return Promise.resolve(buildPersistenceDraft());
    }
    return api.getLimitedBetaPreference().then(function (envelope) {
      applyEnvelope(envelope);
      notify();
      return buildPersistenceDraft();
    }).catch(function () {
      safeFallback = true;
      notify();
      return buildPersistenceDraft();
    });
  }
  function turnOffLimitedBetaPreference(reason) {
    return persist("turnOffLimitedBetaPreference", { reason:text(reason) }, Object.assign(defaultPreference("turn_off", reason), {
      globalLimitedBetaEnabled:false,
      categoryOverrides:{ flight:false, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides:{ flight_provider:false },
      surfaceOverrides:{ ordinary_result_card:false, provider_console:false, sandbox_console:false },
      killSwitchState:"disabled"
    }));
  }
  function requestRestoreLimitedBetaPreference(reason) {
    counters.restoreAttemptCount += 1;
    const next = Object.assign({}, currentPreference, { lastAction:"restore_requested", reason:text(reason) || "restore requested", actor:"local_user", restoreConfirmationPending:true, updatedAt:now() });
    return persist("requestRestoreLimitedBetaPreference", { reason:text(reason) }, next);
  }
  function confirmRestoreLimitedBetaPreference(reason) {
    counters.restoreConfirmedCount += 1;
    return persist("confirmRestoreLimitedBetaPreference", { reason:text(reason) }, defaultPreference("restore_confirmed", reason || "restore confirmed"));
  }
  function forceRollbackLimitedBetaPreference(reason) {
    return persist("forceRollbackLimitedBetaPreference", { reason:text(reason) }, Object.assign(defaultPreference("force_rollback", reason), {
      globalLimitedBetaEnabled:false,
      categoryOverrides:{ flight:false, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides:{ flight_provider:false },
      surfaceOverrides:{ ordinary_result_card:false, provider_console:false, sandbox_console:false },
      killSwitchState:"rollback_active",
      rollbackState:"rollback_active"
    }));
  }
  function clearLimitedBetaPreference() {
    return persist("clearLimitedBetaPreference", {}, defaultPreference("clear_preferences", "preference cleared to safe default"));
  }
  function buildPersistenceDraft() {
    const pref = sanitize(currentPreference);
    return {
      version:LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION,
      status:"local preference persistence active",
      schemaVersion:LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION,
      storage:"app userData local file",
      fileName:STORE_FILE,
      localStorage:"forbidden",
      sessionStorage:"forbidden",
      env:"forbidden",
      persistedPreferenceLoaded:loaded,
      persistedPreferenceValid:valid,
      safeFallbackApplied:safeFallback,
      preference:pref,
      globalLimitedBetaEnabled:pref.globalLimitedBetaEnabled,
      flightBeta:pref.categoryOverrides.flight === true,
      productBeta:false,
      hotelBeta:false,
      restrictedBeta:false,
      killSwitchState:pref.killSwitchState,
      rollbackState:pref.rollbackState,
      lastAction:pref.lastAction,
      updatedAt:pref.updatedAt,
      requiresUserConfirmationForRestore:true,
      auditDraft:getLimitedBetaPreferenceAuditDraft(pref.lastAction),
      redacted:true
    };
  }
  function getLimitedBetaPreferenceAuditDraft(action) {
    const pref = sanitize(currentPreference);
    return {
      eventType:"LIMITED_BETA_PREFERENCE_PERSISTENCE_AUDIT_DRAFT",
      schemaVersion:LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION,
      preferenceVersion:pref.preferenceVersion,
      persistedPreferenceLoaded:loaded,
      persistedPreferenceValid:valid,
      safeFallbackApplied:safeFallback,
      action:text(action) || pref.lastAction,
      actor:pref.actor,
      reason:pref.reason,
      globalLimitedBetaEnabled:pref.globalLimitedBetaEnabled,
      flightBetaEnabled:pref.categoryOverrides.flight === true,
      productBetaEnabled:false,
      hotelBetaEnabled:false,
      restrictedBetaEnabled:false,
      killSwitchState:pref.killSwitchState,
      rollbackState:pref.rollbackState,
      updatedAt:pref.updatedAt,
      localStorageWriteCount:counters.localStorageWriteCount,
      sessionStorageWriteCount:counters.sessionStorageWriteCount,
      envWriteCount:counters.envWriteCount,
      secretPersistedCount:counters.secretPersistedCount,
      endpointPersistedCount:counters.endpointPersistedCount,
      rawPayloadPersistedCount:counters.rawPayloadPersistedCount,
      redacted:true
    };
  }
  function exportRedactedPreferenceSummary() {
    const draft = buildPersistenceDraft();
    return JSON.stringify({
      schemaVersion:draft.schemaVersion,
      globalLimitedBetaEnabled:draft.globalLimitedBetaEnabled,
      flightBeta:draft.flightBeta,
      productBeta:false,
      hotelBeta:false,
      restrictedBeta:false,
      killSwitchState:draft.killSwitchState,
      rollbackState:draft.rollbackState,
      storage:draft.storage,
      localStorage:"forbidden",
      sessionStorage:"forbidden",
      env:"forbidden",
      redacted:true
    }, null, 2);
  }
  window.WeishanLimitedBetaPreferencePersistence = {
    LIMITED_BETA_PREFERENCE_PERSISTENCE_VERSION,
    getCurrentPreferenceSync:function(){ return clone(currentPreference); },
    applyEnvelope,
    loadPersistedPreference,
    turnOffLimitedBetaPreference,
    requestRestoreLimitedBetaPreference,
    confirmRestoreLimitedBetaPreference,
    forceRollbackLimitedBetaPreference,
    clearLimitedBetaPreference,
    buildPersistenceDraft,
    getLimitedBetaPreferenceAuditDraft,
    exportRedactedPreferenceSummary,
    _testOnly:{ sanitize, defaultPreference, counters }
  };
  loadPersistedPreference();
})();
