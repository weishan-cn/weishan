const fs = require("fs");
const path = require("path");

const LIMITED_BETA_PREFERENCE_STORE_VERSION = "4.2.3";
const PREFERENCE_STORE_FILE = "limited-beta-preferences.v1.json";

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}

function text(value) {
  return String(value === undefined || value === null ? "" : value).trim().slice(0, 160);
}

function defaultPreference(action, actor, reason) {
  return {
    schemaVersion: LIMITED_BETA_PREFERENCE_STORE_VERSION,
    preferenceVersion: 1,
    globalLimitedBetaEnabled: true,
    categoryOverrides: {
      flight: true,
      product: false,
      hotel: false,
      local_service: false,
      ticket_or_activity: false,
      restricted_or_blocked: false
    },
    providerOverrides: {
      flight_provider: true
    },
    surfaceOverrides: {
      ordinary_result_card: true,
      provider_console: true,
      sandbox_console: true
    },
    killSwitchState: "enabled",
    rollbackState: "not_needed",
    lastAction: action || "initial_default",
    reason: text(reason) || "flight limited beta safe default",
    actor: actor || "system_guard",
    updatedAt: nowIso(),
    requiresUserConfirmationForRestore: true,
    restoreConfirmationPending: false,
    allowedBetaScope: "flight_only",
    paymentDisabled: true,
    orderDisabled: true,
    bookingUrlDisabled: true,
    identityUploadDisabled: true,
    redacted: true
  };
}

function countersTemplate() {
  return {
    restoreAttemptCount: 0,
    restoreConfirmedCount: 0,
    restoreBlockedCount: 0,
    unsafePreferenceBlockedCount: 0,
    localStorageWriteCount: 0,
    sessionStorageWriteCount: 0,
    envWriteCount: 0,
    secretPersistedCount: 0,
    endpointPersistedCount: 0,
    rawPayloadPersistedCount: 0
  };
}

function sanitizePreference(input, meta) {
  const raw = input && typeof input === "object" ? clone(input) : null;
  const safeFallbackApplied = raw === null || raw.schemaVersion !== LIMITED_BETA_PREFERENCE_STORE_VERSION;
  const base = defaultPreference(
    safeFallbackApplied ? "auto_recovered_invalid_state" : raw.lastAction,
    safeFallbackApplied ? "system_guard" : raw.actor,
    safeFallbackApplied ? "invalid preference recovered to safe default" : raw.reason
  );
  const next = Object.assign({}, base, raw || {});
  const categories = Object.assign({}, base.categoryOverrides, (raw && raw.categoryOverrides) || {});
  categories.product = false;
  categories.hotel = false;
  categories.local_service = false;
  categories.ticket_or_activity = false;
  categories.restricted_or_blocked = false;
  categories.flight = next.globalLimitedBetaEnabled === true && (next.killSwitchState === "enabled" || next.lastAction === "restore_confirmed");
  const provider = Object.assign({}, base.providerOverrides, (raw && raw.providerOverrides) || {});
  provider.flight_provider = categories.flight === true;
  const surfaces = Object.assign({}, base.surfaceOverrides, (raw && raw.surfaceOverrides) || {});
  surfaces.ordinary_result_card = categories.flight === true;
  surfaces.provider_console = categories.flight === true;
  surfaces.sandbox_console = categories.flight === true;
  let killSwitchState = ["enabled", "disabled", "forced_off", "rollback_active"].includes(next.killSwitchState) ? next.killSwitchState : "disabled";
  let rollbackState = ["not_needed", "rollback_active", "forced_off"].includes(next.rollbackState) ? next.rollbackState : "not_needed";
  if (killSwitchState === "rollback_active") rollbackState = "rollback_active";
  if (killSwitchState === "forced_off") rollbackState = "forced_off";
  if (next.globalLimitedBetaEnabled !== true) {
    categories.flight = false;
    provider.flight_provider = false;
    surfaces.ordinary_result_card = false;
    surfaces.provider_console = false;
    surfaces.sandbox_console = false;
    if (killSwitchState === "enabled") killSwitchState = "disabled";
  }
  return {
    schemaVersion: LIMITED_BETA_PREFERENCE_STORE_VERSION,
    preferenceVersion: 1,
    globalLimitedBetaEnabled: categories.flight === true,
    categoryOverrides: categories,
    providerOverrides: provider,
    surfaceOverrides: surfaces,
    killSwitchState,
    rollbackState,
    lastAction: text(next.lastAction) || (safeFallbackApplied ? "auto_recovered_invalid_state" : "initial_default"),
    reason: text(next.reason) || "limited beta preference updated",
    actor: ["local_user", "system_guard", "test"].includes(next.actor) ? next.actor : "system_guard",
    updatedAt: text(next.updatedAt) || nowIso(),
    requiresUserConfirmationForRestore: true,
    restoreConfirmationPending: next.restoreConfirmationPending === true,
    allowedBetaScope: "flight_only",
    paymentDisabled: true,
    orderDisabled: true,
    bookingUrlDisabled: true,
    identityUploadDisabled: true,
    redacted: true,
    persistedPreferenceValid: safeFallbackApplied === false,
    safeFallbackApplied: safeFallbackApplied === true || Boolean(meta && meta.safeFallbackApplied)
  };
}

function redactedEnvelope(preference, extra) {
  const safe = sanitizePreference(preference || defaultPreference(), extra || {});
  return Object.assign({
    ok: true,
    preference: safe,
    persistedPreferenceLoaded: Boolean(extra && extra.persistedPreferenceLoaded),
    persistedPreferenceValid: safe.persistedPreferenceValid === true,
    safeFallbackApplied: safe.safeFallbackApplied === true,
    storage: "app userData local file",
    fileName: PREFERENCE_STORE_FILE,
    localStorage: "forbidden",
    sessionStorage: "forbidden",
    env: "forbidden",
    redacted: true
  }, extra || {});
}

function createLimitedBetaPreferenceStore(options) {
  const appRef = options && options.app;
  const fsRef = options && options.fs || fs;
  const baseDir = options && options.baseDir || (appRef && typeof appRef.getPath === "function" ? appRef.getPath("userData") : path.join(process.cwd(), ".weishan-user-data"));
  const storeFile = options && options.storeFile || PREFERENCE_STORE_FILE;
  const counters = countersTemplate();
  function storagePath() { return path.join(baseDir, storeFile); }
  function readRaw() {
    try {
      const file = storagePath();
      if (!fsRef.existsSync(file)) return { exists:false, raw:null };
      return { exists:true, raw:JSON.parse(fsRef.readFileSync(file, "utf8")) };
    } catch (_) {
      counters.unsafePreferenceBlockedCount += 1;
      return { exists:true, raw:null, invalid:true };
    }
  }
  function writePreference(preference) {
    const safe = sanitizePreference(preference, {});
    fsRef.mkdirSync(baseDir, { recursive:true });
    fsRef.writeFileSync(storagePath(), JSON.stringify(safe, null, 2));
    return safe;
  }
  function getLimitedBetaPreference() {
    const raw = readRaw();
    if (!raw.exists) {
      const safe = writePreference(defaultPreference());
      return redactedEnvelope(safe, { persistedPreferenceLoaded:true, persistedPreferenceValid:true, safeFallbackApplied:false, action:"initial_default" });
    }
    const safe = sanitizePreference(raw.raw, { safeFallbackApplied:raw.invalid === true });
    if (safe.safeFallbackApplied) writePreference(safe);
    return redactedEnvelope(safe, { persistedPreferenceLoaded:true, persistedPreferenceValid:safe.persistedPreferenceValid === true, safeFallbackApplied:safe.safeFallbackApplied === true, action:safe.lastAction });
  }
  function setLimitedBetaPreferenceDraft(payload) {
    const safe = writePreference(Object.assign({}, (payload && payload.preference) || payload || {}, { updatedAt:nowIso(), actor:text(payload && payload.actor) || "local_user" }));
    return redactedEnvelope(safe, { persistedPreferenceLoaded:true, persistedPreferenceValid:true, action:safe.lastAction });
  }
  function turnOffLimitedBetaPreference(reason) {
    const safe = writePreference(Object.assign(defaultPreference("turn_off", "local_user", reason || "local user disabled limited beta"), {
      globalLimitedBetaEnabled:false,
      categoryOverrides:{ flight:false, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides:{ flight_provider:false },
      surfaceOverrides:{ ordinary_result_card:false, provider_console:false, sandbox_console:false },
      killSwitchState:"disabled",
      rollbackState:"not_needed",
      updatedAt:nowIso()
    }));
    return redactedEnvelope(safe, { persistedPreferenceLoaded:true, persistedPreferenceValid:true, action:"turn_off" });
  }
  function requestRestoreLimitedBetaPreference(reason) {
    counters.restoreAttemptCount += 1;
    const current = getLimitedBetaPreference().preference;
    const safe = writePreference(Object.assign({}, current, {
      lastAction:"restore_requested",
      reason:text(reason) || "restore requested and waiting for confirmation",
      actor:"local_user",
      restoreConfirmationPending:true,
      requiresUserConfirmationForRestore:true,
      updatedAt:nowIso()
    }));
    return redactedEnvelope(safe, { persistedPreferenceLoaded:true, persistedPreferenceValid:true, action:"restore_requested", confirmationRequired:true });
  }
  function confirmRestoreLimitedBetaPreference(reason) {
    counters.restoreConfirmedCount += 1;
    const safe = writePreference(Object.assign(defaultPreference("restore_confirmed", "local_user", reason || "local user confirmed flight limited beta restore"), {
      updatedAt:nowIso(),
      restoreConfirmationPending:false
    }));
    return redactedEnvelope(safe, { persistedPreferenceLoaded:true, persistedPreferenceValid:true, action:"restore_confirmed", confirmationRequired:false });
  }
  function forceRollbackLimitedBetaPreference(reason) {
    const safe = writePreference(Object.assign(defaultPreference("force_rollback", "local_user", reason || "local user forced rollback"), {
      globalLimitedBetaEnabled:false,
      categoryOverrides:{ flight:false, product:false, hotel:false, local_service:false, ticket_or_activity:false, restricted_or_blocked:false },
      providerOverrides:{ flight_provider:false },
      surfaceOverrides:{ ordinary_result_card:false, provider_console:false, sandbox_console:false },
      killSwitchState:"rollback_active",
      rollbackState:"rollback_active",
      updatedAt:nowIso()
    }));
    return redactedEnvelope(safe, { persistedPreferenceLoaded:true, persistedPreferenceValid:true, action:"force_rollback" });
  }
  function clearLimitedBetaPreference() {
    const safe = writePreference(defaultPreference("clear_preferences", "local_user", "preference cleared to safe default"));
    return redactedEnvelope(safe, { persistedPreferenceLoaded:true, persistedPreferenceValid:true, action:"clear_preferences" });
  }
  function getLimitedBetaPreferenceAuditDraft(action) {
    const envelope = getLimitedBetaPreference();
    const pref = envelope.preference;
    return {
      eventType:"LIMITED_BETA_PREFERENCE_PERSISTENCE_AUDIT_DRAFT",
      schemaVersion:LIMITED_BETA_PREFERENCE_STORE_VERSION,
      preferenceVersion:pref.preferenceVersion,
      persistedPreferenceLoaded:envelope.persistedPreferenceLoaded,
      persistedPreferenceValid:envelope.persistedPreferenceValid,
      safeFallbackApplied:envelope.safeFallbackApplied,
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
  return {
    version:LIMITED_BETA_PREFERENCE_STORE_VERSION,
    storeFile,
    storagePath,
    getLimitedBetaPreference,
    setLimitedBetaPreferenceDraft,
    turnOffLimitedBetaPreference,
    requestRestoreLimitedBetaPreference,
    confirmRestoreLimitedBetaPreference,
    forceRollbackLimitedBetaPreference,
    clearLimitedBetaPreference,
    getLimitedBetaPreferenceAuditDraft,
    _testOnly:{ defaultPreference, sanitizePreference, counters }
  };
}

function registerLimitedBetaPreferenceHandlers(ipcMain, options) {
  const service = createLimitedBetaPreferenceStore(options || {});
  ipcMain.handle("limited-beta-preference:get", async () => service.getLimitedBetaPreference());
  ipcMain.handle("limited-beta-preference:set-draft", async (_event, payload) => service.setLimitedBetaPreferenceDraft(payload));
  ipcMain.handle("limited-beta-preference:turn-off", async (_event, payload) => service.turnOffLimitedBetaPreference(payload && payload.reason));
  ipcMain.handle("limited-beta-preference:request-restore", async (_event, payload) => service.requestRestoreLimitedBetaPreference(payload && payload.reason));
  ipcMain.handle("limited-beta-preference:confirm-restore", async (_event, payload) => service.confirmRestoreLimitedBetaPreference(payload && payload.reason));
  ipcMain.handle("limited-beta-preference:force-rollback", async (_event, payload) => service.forceRollbackLimitedBetaPreference(payload && payload.reason));
  ipcMain.handle("limited-beta-preference:clear", async () => service.clearLimitedBetaPreference());
  ipcMain.handle("limited-beta-preference:audit-draft", async (_event, payload) => service.getLimitedBetaPreferenceAuditDraft(payload && payload.action));
  return service;
}

module.exports = {
  LIMITED_BETA_PREFERENCE_STORE_VERSION,
  PREFERENCE_STORE_FILE,
  createLimitedBetaPreferenceStore,
  registerLimitedBetaPreferenceHandlers
};
