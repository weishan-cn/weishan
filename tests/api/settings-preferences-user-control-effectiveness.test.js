"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const CORE = path.join(ROOT, "apps/desktop/src/renderer/core");
const ROUTES = path.join(ROOT, "apps/desktop/src/renderer/routes");
const NOW = Date.parse("2026-08-26T00:00:00.000Z");

function memoryStorage(seed) {
  const map = new Map(Object.entries(seed || {}));
  return {
    getItem:key => map.has(key) ? map.get(key) : null,
    setItem:(key, value) => map.set(key, value),
    removeItem:key => map.delete(key),
    dump:() => Object.fromEntries(map.entries())
  };
}

function bytes(seed) {
  return function (n) {
    return Array.from({ length:n }, (_, index) => (seed + index) & 255);
  };
}

function load(storage) {
  const window = { localStorage:storage };
  window.window = window;
  window.dispatchEvent = function(){};
  window.CustomEvent = function(name, init){ return { name, detail:init && init.detail }; };
  const context = vm.createContext({ window, console, Date, Math, Object, Array, String, Number, Boolean, RegExp, Set, Map, Uint8Array });
  vm.runInContext(fs.readFileSync(path.join(CORE, "anonymousProductAnalytics.js"), "utf8"), context, { filename:"anonymousProductAnalytics.js" });
  vm.runInContext(fs.readFileSync(path.join(CORE, "settingsPreferencesUserControl.js"), "utf8"), context, { filename:"settingsPreferencesUserControl.js" });
  return window;
}

function event(api, overrides) {
  return Object.assign({
    eventName:"module_opened",
    eventVersion:1,
    anonymousInstallId:"wai_00000000000000000000000000000001",
    sessionId:"was_000000000000000000000001",
    moduleId:"HOME",
    actionClass:"MODULE_OPEN",
    outcome:"SUCCESS",
    timestamp:NOW,
    durationBucket:"UNKNOWN",
    resultCountBucket:"UNKNOWN",
    errorClassSafe:"NONE",
    domainCategory:"OTHER",
    appVersion:api.VERSION,
    platformClass:"macOS",
    locale:"zh"
  }, overrides || {});
}

function assertZeroMetrics(metrics) {
  Object.entries(metrics).forEach(([key, value]) => assert.equal(value, 0, key));
}

function main() {
  const storage = memoryStorage();
  const window = load(storage);
  const settings = window.WeishanSettingsUserControl;
  const analytics = window.WeishanAnonymousProductAnalytics;
  assert.ok(settings, "settings module should load");

  const index = fs.readFileSync(path.join(ROOT, "apps/desktop/src/index.html"), "utf8");
  const page = fs.readFileSync(path.join(ROUTES, "SettingsPage.js"), "utf8");
  const verify = fs.readFileSync(path.join(ROOT, "scripts/verify.js"), "utf8");
  assert.match(index, /settingsPreferencesUserControl\.js\?v=4\.3\.3/);
  assert.match(page, /anonymousAnalyticsToggle/);
  assert.match(page, /帮助改进 Weishan，分享匿名使用数据/);
  assert.match(page, /Help improve Weishan by sharing anonymous usage data/);
  assert.doesNotMatch(page, /\$\{cloudEnterprisePanel\(\)\}/);
  assert.doesNotMatch(page, /\$\{t\("cloudReserved"\)\}/);
  assert.doesNotMatch(page, /\$\{t\("billingPermissions"\)\}/);
  assert.match(verify, /settings-preferences-user-control-effectiveness\.test\.js/);

  const defaults = settings.getSettings({ storage });
  assert.equal(defaults.analyticsEnabled, false);
  assert.equal(defaults.languageMode, "system");
  assert.equal(defaults.appearance, "system");

  const saved = settings.saveSettings({ analyticsEnabled:true, appearance:"dark", languageMode:"manual", language:"en" }, { storage });
  assert.equal(saved.ok, true);
  assert.equal(settings.getSettings({ storage }).analyticsEnabled, true);
  assert.equal(settings.getSettings({ storage }).appearance, "dark");

  const runtimeOn = settings.createControlledAnalyticsRuntime({ storage, randomBytes:bytes(7), now:NOW, queueMax:10 });
  assert.equal(runtimeOn.enabled, true);
  const tracked = runtimeOn.track(event(analytics, { eventName:"search_completed", moduleId:"SHOPPING", actionClass:"SEARCH", outcome:"SUCCESS", domainCategory:"SHOPPING" }));
  assert.equal(tracked.accepted, true);
  assert.equal(runtimeOn.queueSnapshot().size, 1);

  storage.setItem("weishan.v2.analytics.queue.v1", JSON.stringify([{ synthetic:true }]));
  const off = settings.setAnalyticsEnabled(false, { storage });
  assert.equal(off.ok, true);
  assert.equal(off.analyticsQueueCleared, true);
  assert.equal(storage.getItem("weishan.v2.analytics.queue.v1"), null);
  const runtimeOff = settings.createControlledAnalyticsRuntime({ storage, randomBytes:bytes(8), now:NOW, queueMax:10 });
  assert.equal(runtimeOff.enabled, false);
  assert.equal(runtimeOff.track(event(analytics)).accepted, false);
  assert.equal(runtimeOff.queueSnapshot().size, 0);

  const reset = settings.resetAnalytics({ storage });
  assert.equal(reset.ok, true);
  assert.equal(reset.credentialsDeleted, false);
  assert.equal(reset.mailSetupDeleted, false);
  assert.equal(reset.otherPreferencesDeleted, false);
  assert.equal(reset.pendingQueueAfterReset, 0);

  [
    { executionGate:"OPEN" },
    { authorizesExecution:true },
    { productionTraffic:true },
    { providerReady:true },
    { emailSendEnabled:true },
    { commissionRankingEnabled:true },
    { arbitrarySetting:"value" },
    { token:"synthetic" },
    { password:"synthetic" },
    { apiKey:"synthetic" },
    { privateKey:"synthetic" },
    JSON.parse('{"__proto__":{"polluted":true}}'),
    { constructor:"evil" },
    { prototype:"evil" }
  ].forEach(function(attack){
    const result = settings.saveSettings(attack, { storage });
    assert.equal(result.ok, false, JSON.stringify(attack));
  });
  assert.equal({}.polluted, undefined);

  assert.equal(settings.saveSettings({ appearance:"neon" }, { storage }).ok, false);
  assert.equal(settings.saveSettings({ languageMode:"manual", language:"fr" }, { storage }).ok, false);
  storage.setItem("weishan.v2.settings.userControl.v1", "{corrupt");
  assert.deepEqual(settings.getSettings({ storage }), settings.DEFAULTS);
  storage.setItem("weishan.v2.settings.userControl.v1", JSON.stringify({ analyticsEnabled:true, unknownFutureValue:true, appearance:"broken" }));
  const recovered = settings.getSettings({ storage });
  assert.equal(recovered.analyticsEnabled, false);
  assert.equal(recovered.appearance, "system");

  const audit = settings.audit();
  assert.equal(audit.firstRunAccountRequired, false);
  assert.equal(audit.analyticsTogglePresent, true);
  assert.equal(audit.analyticsDisableImmediate, true);
  assert.equal(audit.pendingQueueAfterOptOut, 0);
  assert.equal(audit.hiddenCloudSettingsVisible, false);
  assertZeroMetrics({
    RAW_SECRET_SETTINGS_READABLE:audit.rawSecretSettingsReadable,
    ARBITRARY_SETTINGS_ACCEPTED:audit.arbitrarySettingsAccepted,
    UNKNOWN_SETTINGS_ACCEPTED:audit.unknownSettingsAccepted,
    PROTOTYPE_KEYS_ACCEPTED:audit.prototypeKeysAccepted,
    AUTHORITY_SETTINGS_ACCEPTED:audit.authoritySettingsAccepted,
    PROVIDER_READINESS_CHANGED_BY_SETTING:audit.providerReadinessChangedBySetting,
    EXECUTION_GATE_CHANGED_BY_SETTING:audit.executionGateChangedBySetting,
    EMAIL_SEND_ENABLED_BY_SETTING:audit.emailSendEnabledBySetting,
    COMMISSION_RANKING_ENABLED_BY_SETTING:audit.commissionRankingEnabledBySetting,
    HIDDEN_CLOUD_REVEALED_BY_SETTING:audit.hiddenCloudRevealedBySetting,
    ANALYTICS_EVENTS_AFTER_OPTOUT:audit.analyticsEventsAfterOptOut,
    ANALYTICS_PRIVACY_BYPASSES:audit.analyticsPrivacyBypasses,
    CROSS_DOMAIN_PREFERENCE_LEAKS:audit.crossDomainPreferenceLeaks,
    CORRUPT_SETTING_CRASHES:audit.corruptSettingCrashes,
    FAILED_SAVE_FALSE_SUCCESS:audit.failedSaveFalseSuccess,
    KEYBOARD_DEAD_ENDS:audit.keyboardDeadEnds,
    SECRET_VALUES_IN_ACCESSIBLE_NAMES:audit.secretValuesInAccessibleNames
  });

  const inventory = audit.inventory;
  assert.ok(inventory.some(item => item.setting === "Anonymous analytics" && item.group === "ANALYTICS" && item.decision === "OPTIMIZE"));
  assert.ok(inventory.some(item => item.setting === "Cloud/Enterprise" && item.group === "DEFERRED" && item.decision === "DEFER"));
  assert.ok(inventory.every(item => item.actualEffect && item.decision));

  const isolation = analytics.evaluateProductResultIsolation(function(){ return { recommendation:"same", providerState:"same", commissionPolicy:"user_benefit_first" }; });
  assert.equal(isolation.sameMaterialResult, true);
  assert.equal(isolation.recommendationInfluence, 0);
  assert.equal(isolation.providerStateInfluence, 0);
  assert.equal(isolation.commissionInfluence, 0);

  console.log("SETTINGS_PREFERENCES_USER_CONTROL_EFFECTIVENESS PASS settings=8 privacy=17 analyticsOptOut=PASS corruptRecovery=PASS");
}

main();
