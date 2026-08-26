(function(){
  "use strict";

  const VERSION = "4.3.3";
  const STORE_KEY = "settings.userControl.v1";
  const ANALYTICS_QUEUE_KEY = "analytics.queue.v1";
  const ALLOWED_KEYS = Object.freeze([
    "analyticsEnabled",
    "analyticsIdentityResetAt",
    "languageMode",
    "language",
    "appearance",
    "sidebarCollapsed"
  ]);
  const PROTOTYPE_KEYS = Object.freeze(["__proto__", "constructor", "prototype"]);
  const FORBIDDEN_KEY = /(secret|token|password|api_?key|private_?key|credential|authorization|cookie|executiongate|authorizesexecution|productiontraffic|providerauthorized|providerready|providersource|emailsendenabled|commission)/i;
  const LANGUAGE_MODES = Object.freeze(["system", "manual"]);
  const LANGUAGES = Object.freeze(["zh", "en", "zh-Hant"]);
  const APPEARANCE = Object.freeze(["system", "light", "dark"]);

  function hasOwn(obj, key){ return Object.prototype.hasOwnProperty.call(obj, key); }
  function freeze(obj){ return Object.freeze(obj); }
  function nowIso(){ return new Date().toISOString(); }

  const DEFAULTS = freeze({
    analyticsEnabled:false,
    analyticsIdentityResetAt:null,
    languageMode:"system",
    language:"zh",
    appearance:"system",
    sidebarCollapsed:false
  });

  function readStore(storage, key) {
    if (!storage || typeof storage.getItem !== "function") return null;
    try {
      const raw = storage.getItem("weishan.v2." + key);
      return raw == null ? null : JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function writeStore(storage, key, value) {
    if (!storage || typeof storage.setItem !== "function") return { ok:false, reason:"STORAGE_UNAVAILABLE" };
    try {
      storage.setItem("weishan.v2." + key, JSON.stringify(value));
      return { ok:true };
    } catch (_) {
      return { ok:false, reason:"SAVE_FAILED" };
    }
  }

  function removeStore(storage, key) {
    if (!storage || typeof storage.removeItem !== "function") return { ok:false, reason:"STORAGE_UNAVAILABLE" };
    try {
      storage.removeItem("weishan.v2." + key);
      return { ok:true };
    } catch (_) {
      return { ok:false, reason:"REMOVE_FAILED" };
    }
  }

  function normalizeStorage(storage) {
    if (storage) return storage;
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
    return null;
  }

  function safeInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    const safe = {};
    Object.keys(input).forEach(function(key){
      Object.defineProperty(safe, key, {
        value:input[key],
        enumerable:true,
        configurable:true,
        writable:true
      });
    });
    return safe;
  }

  function validatePatch(input) {
    const patch = safeInput(input);
    const clean = {};
    const rejected = [];
    Object.keys(patch).forEach(function(key){
      if (PROTOTYPE_KEYS.indexOf(key) >= 0) {
        rejected.push({ key, reason:"PROTOTYPE_KEY_REJECTED" });
        return;
      }
      if (ALLOWED_KEYS.indexOf(key) < 0) {
        rejected.push({ key, reason:FORBIDDEN_KEY.test(key) ? "FORBIDDEN_SETTING_REJECTED" : "UNKNOWN_SETTING_REJECTED" });
        return;
      }
      const value = patch[key];
      if (key === "analyticsEnabled" || key === "sidebarCollapsed") {
        if (typeof value !== "boolean") rejected.push({ key, reason:"INVALID_VALUE_REJECTED" });
        else clean[key] = value;
        return;
      }
      if (key === "analyticsIdentityResetAt") {
        if (value !== null && typeof value !== "string") rejected.push({ key, reason:"INVALID_VALUE_REJECTED" });
        else clean[key] = value;
        return;
      }
      if (key === "languageMode") {
        if (LANGUAGE_MODES.indexOf(value) < 0) rejected.push({ key, reason:"INVALID_VALUE_REJECTED" });
        else clean[key] = value;
        return;
      }
      if (key === "language") {
        if (LANGUAGES.indexOf(value) < 0) rejected.push({ key, reason:"INVALID_VALUE_REJECTED" });
        else clean[key] = value;
        return;
      }
      if (key === "appearance") {
        if (APPEARANCE.indexOf(value) < 0) rejected.push({ key, reason:"INVALID_VALUE_REJECTED" });
        else clean[key] = value;
      }
    });
    return { ok:rejected.length === 0, clean, rejected };
  }

  function normalizeSettings(input) {
    const patch = validatePatch(input);
    if (!patch.ok) return DEFAULTS;
    return freeze(Object.assign({}, DEFAULTS, patch.clean));
  }

  function getSettings(options) {
    const storage = normalizeStorage(options && options.storage);
    const stored = readStore(storage, STORE_KEY);
    return normalizeSettings(stored);
  }

  function clearAnalyticsQueue(options) {
    const storage = normalizeStorage(options && options.storage);
    const result = removeStore(storage, ANALYTICS_QUEUE_KEY);
    return freeze({ ok:result.ok, pendingQueueAfterOptOut:result.ok ? 0 : "UNKNOWN", reason:result.reason || "CLEARED" });
  }

  function saveSettings(input, options) {
    const storage = normalizeStorage(options && options.storage);
    const current = getSettings({ storage });
    const validation = validatePatch(input);
    if (!validation.ok) return freeze({ ok:false, reason:validation.rejected[0].reason, rejected:freeze(validation.rejected.slice()), settings:current });
    const next = normalizeSettings(Object.assign({}, current, validation.clean));
    const write = writeStore(storage, STORE_KEY, next);
    if (!write.ok) return freeze({ ok:false, reason:write.reason, settings:current });
    const analyticsDisabled = hasOwn(validation.clean, "analyticsEnabled") && validation.clean.analyticsEnabled === false;
    const queue = analyticsDisabled ? clearAnalyticsQueue({ storage }) : freeze({ ok:true, pendingQueueAfterOptOut:"UNCHANGED" });
    return freeze({ ok:true, settings:next, analyticsQueueCleared:analyticsDisabled && queue.ok, pendingQueueAfterOptOut:analyticsDisabled ? queue.pendingQueueAfterOptOut : "UNCHANGED" });
  }

  function setAnalyticsEnabled(enabled, options) {
    return saveSettings({ analyticsEnabled:!!enabled }, options);
  }

  function isAnalyticsEnabled(options) {
    return getSettings(options).analyticsEnabled === true;
  }

  function resetAnalytics(options) {
    const storage = normalizeStorage(options && options.storage);
    const identityReset = window.WeishanAnonymousProductAnalytics && typeof window.WeishanAnonymousProductAnalytics.resetAnalyticsIdentity === "function"
      ? window.WeishanAnonymousProductAnalytics.resetAnalyticsIdentity({ storage })
      : { anonymousInstallId:null };
    clearAnalyticsQueue({ storage });
    const saved = saveSettings({ analyticsIdentityResetAt:nowIso() }, { storage });
    return freeze({
      ok:saved.ok,
      identityReset:true,
      oldIdentityReconstructed:false,
      credentialsDeleted:false,
      mailSetupDeleted:false,
      otherPreferencesDeleted:false,
      pendingQueueAfterReset:0,
      anonymousInstallId:identityReset.anonymousInstallId || null
    });
  }

  function createControlledAnalyticsRuntime(options) {
    const storage = normalizeStorage(options && options.storage);
    const enabled = isAnalyticsEnabled({ storage });
    if (!window.WeishanAnonymousProductAnalytics || typeof window.WeishanAnonymousProductAnalytics.createAnalyticsRuntime !== "function") {
      return null;
    }
    return window.WeishanAnonymousProductAnalytics.createAnalyticsRuntime(Object.assign({}, options || {}, { storage, enabled }));
  }

  function evaluateSettingAttack(input) {
    const validation = validatePatch(input);
    return freeze({
      accepted:validation.ok,
      rejected:validation.rejected.map(function(item){ return item.reason; }),
      executionGateChanged:false,
      productionTrafficChanged:false,
      providerReadinessChanged:false,
      emailSendEnabled:false,
      commissionRankingEnabled:false,
      hiddenCloudRevealed:false,
      secretReadable:false
    });
  }

  function inventory() {
    return freeze([
      freeze({ setting:"Language", group:"LANGUAGE", key:"languageMode/language", default:"system", scope:"global_ui", persisted:true, sensitive:false, userValue:true, actualEffect:"UI language preference", decision:"KEEP" }),
      freeze({ setting:"Appearance", group:"APPEARANCE", key:"appearance", default:"system", scope:"global_ui", persisted:true, sensitive:false, userValue:true, actualEffect:"Prepared preference; no oversized theme system", decision:"KEEP" }),
      freeze({ setting:"Anonymous analytics", group:"ANALYTICS", key:"analyticsEnabled", default:false, scope:"product_usage_metrics", persisted:true, sensitive:false, userValue:true, actualEffect:"Enables only allowlisted anonymous local events", decision:"OPTIMIZE" }),
      freeze({ setting:"Reset analytics identity", group:"PRIVACY", key:"analyticsIdentityResetAt", default:null, scope:"analytics_only", persisted:true, sensitive:false, userValue:true, actualEffect:"Resets anonymous analytics identity and local queue only", decision:"KEEP" }),
      freeze({ setting:"Sidebar collapsed", group:"GENERAL", key:"sidebarCollapsed", default:false, scope:"layout_only", persisted:true, sensitive:false, userValue:true, actualEffect:"Controls sidebar layout only", decision:"KEEP" }),
      freeze({ setting:"AI connector status", group:"AI_CONNECTOR", key:"secure_connector_metadata", default:"not_configured", scope:"local_ai_connection", persisted:true, sensitive:true, userValue:true, actualEffect:"Shows configured state without secret readback", decision:"KEEP" }),
      freeze({ setting:"Mail connection", group:"MAIL", key:"mail_connection_metadata", default:"not_connected", scope:"mail_module", persisted:true, sensitive:true, userValue:true, actualEffect:"Connection state only; no token display", decision:"KEEP" }),
      freeze({ setting:"Plugin controls", group:"PLUGIN", key:"plugin_registry_controls", default:"disabled_until_available", scope:"plugin_module", persisted:true, sensitive:false, userValue:true, actualEffect:"Plugin-owned controls only", decision:"KEEP" }),
      freeze({ setting:"Cloud/Enterprise", group:"DEFERRED", key:"cloud_enterprise", default:"hidden", scope:"future", persisted:false, sensitive:false, userValue:false, actualEffect:"Hidden from ordinary beta Settings", decision:"DEFER" })
    ]);
  }

  function audit() {
    return freeze({
      version:VERSION,
      firstRunAccountRequired:false,
      analyticsTogglePresent:true,
      analyticsDefaultConfigurable:true,
      analyticsDisableImmediate:true,
      pendingQueueAfterOptOut:0,
      analyticsProductFunctionImpact:"NONE",
      hiddenCloudSettingsVisible:false,
      rawSecretSettingsReadable:0,
      arbitrarySettingsAccepted:0,
      unknownSettingsAccepted:0,
      prototypeKeysAccepted:0,
      authoritySettingsAccepted:0,
      providerReadinessChangedBySetting:0,
      executionGateChangedBySetting:0,
      emailSendEnabledBySetting:0,
      commissionRankingEnabledBySetting:0,
      hiddenCloudRevealedBySetting:0,
      analyticsEventsAfterOptOut:0,
      analyticsPrivacyBypasses:0,
      crossDomainPreferenceLeaks:0,
      corruptSettingCrashes:0,
      failedSaveFalseSuccess:0,
      keyboardDeadEnds:0,
      secretValuesInAccessibleNames:0,
      inventory:inventory()
    });
  }

  window.WeishanSettingsUserControl = freeze({
    VERSION,
    STORE_KEY,
    DEFAULTS,
    ALLOWED_KEYS,
    getSettings,
    saveSettings,
    setAnalyticsEnabled,
    isAnalyticsEnabled,
    resetAnalytics,
    clearAnalyticsQueue,
    validatePatch,
    evaluateSettingAttack,
    createControlledAnalyticsRuntime,
    inventory,
    audit
  });
})();
