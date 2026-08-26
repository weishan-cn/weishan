"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const CORE = path.join(ROOT, "apps/desktop/src/renderer/core");
const NOW = Date.parse("2026-08-26T00:00:00.000Z");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, Date, Math, Object, Array, String, Number, Boolean, RegExp, Set, Map, Uint8Array });
  vm.runInContext(fs.readFileSync(path.join(CORE, "anonymousProductAnalytics.js"), "utf8"), context, { filename:"anonymousProductAnalytics.js" });
  return window.WeishanAnonymousProductAnalytics;
}

function bytes(seed) {
  return function (n) {
    return Array.from({ length:n }, (_, index) => (seed + index) & 255);
  };
}

function baseEvent(api, overrides) {
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

function assertRejected(api, mutation, reason) {
  const result = api.validateAnalyticsEvent(baseEvent(api, mutation), { now:NOW });
  assert.equal(result.accepted, false, JSON.stringify(mutation));
  if (reason) assert.equal(result.reason, reason);
}

function assertZeroMetrics(metrics) {
  Object.entries(metrics).forEach(([key, value]) => assert.equal(value, 0, key));
}

function field(key, value) {
  const result = {};
  result[key] = value;
  return result;
}

function makeEvent(api, install, session, moduleId, eventName, actionClass, outcome, dayOffset) {
  return baseEvent(api, {
    eventName,
    anonymousInstallId:"wai_" + String(install).padStart(32, "0"),
    sessionId:"was_" + String(session).padStart(24, "0"),
    moduleId,
    actionClass,
    outcome,
    timestamp:NOW - dayOffset * 24 * 60 * 60 * 1000,
    domainCategory:["SHOPPING", "FLIGHT", "HOTEL", "CRUISE", "MAIL"].includes(moduleId) ? moduleId : "OTHER",
    durationBucket:"S_1_3",
    resultCountBucket:"TWO_TO_FIVE",
    errorClassSafe:outcome === "FAILURE" ? "NO_COVERAGE" : "NONE"
  });
}

function main() {
  const api = load();
  assert.ok(api, "analytics module should load");

  const index = fs.readFileSync(path.join(ROOT, "apps/desktop/src/index.html"), "utf8");
  const verify = fs.readFileSync(path.join(ROOT, "scripts/verify.js"), "utf8");
  const doc = fs.readFileSync(path.join(ROOT, "docs/architecture/anonymous-product-analytics.md"), "utf8");
  assert.match(index, /anonymousProductAnalytics\.js\?v=4\.3\.2/);
  assert.match(verify, /anonymous-product-analytics-effectiveness\.test\.js/);
  assert.match(doc, /MEASURE THE PRODUCT/);
  assert.match(doc, /DO NOT MONITOR THE PERSON/);

  const identity = api.initializeAnalyticsIdentity({ randomBytes:bytes(1) });
  assert.match(identity.anonymousInstallId, /^wai_[a-f0-9]{32}$/);
  assert.equal(identity.derivedFromHardware, false);
  assert.equal(identity.derivedFromEmail, false);
  assert.equal(identity.derivedFromIp, false);
  assert.equal(identity.fingerprinting, false);
  const storage = new Map();
  const adapter = {
    getItem:key => storage.get(key),
    setItem:(key, value) => storage.set(key, value)
  };
  const stableA = api.initializeAnalyticsIdentity({ storage:adapter, randomBytes:bytes(5) });
  const stableB = api.initializeAnalyticsIdentity({ storage:adapter, randomBytes:bytes(9) });
  assert.equal(stableA.anonymousInstallId, stableB.anonymousInstallId);
  const reset = api.resetAnalyticsIdentity({ storage:adapter, randomBytes:bytes(33) });
  assert.notEqual(reset.anonymousInstallId, stableA.anonymousInstallId);
  assert.equal(reset.oldIdentityReconstructed, false);

  const accepted = api.validateAnalyticsEvent(baseEvent(api, { eventName:"search_completed", moduleId:"SHOPPING", actionClass:"SEARCH", outcome:"SUCCESS", domainCategory:"SHOPPING", resultCountBucket:"SIX_TO_TWENTY" }), { now:NOW });
  assert.equal(accepted.accepted, true);
  assert.deepEqual(Object.keys(accepted.event).sort(), ["actionClass", "anonymousInstallId", "appVersion", "day", "domainCategory", "durationBucket", "errorClassSafe", "eventName", "eventVersion", "locale", "moduleId", "outcome", "platformClass", "resultCountBucket", "sessionId", "timestamp"].sort());
  assert.equal(Object.prototype.hasOwnProperty.call(accepted.event, "queryText"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(accepted.event, "url"), false);

  [
    [field("rawQuery", "compare my private cart"), "FORBIDDEN_FIELD"],
    [field("queryText", "成都到东京"), "FORBIDDEN_FIELD"],
    [field("email", "api" + "@weishan.ai"), "FORBIDDEN_FIELD"],
    [field("phone", "+86" + "13980705580"), "FORBIDDEN_FIELD"],
    [field("personName", "weibo luo"), "FORBIDDEN_FIELD"],
    [field("subject", "invoice"), "FORBIDDEN_FIELD"],
    [field("body", "mail body"), "FORBIDDEN_FIELD"],
    [field("sender", "a" + "@example.com"), "FORBIDDEN_FIELD"],
    [field("recipient", "b" + "@example.com"), "FORBIDDEN_FIELD"],
    [field("attachmentName", "invoice.pdf"), "FORBIDDEN_FIELD"],
    [field("apiKey", "AIza" + "Sy-synthetic"), "FORBIDDEN_FIELD"],
    [field("token", "Bearer " + "abc.def.ghi"), "FORBIDDEN_FIELD"],
    [field("password", "password" + ": hidden"), "FORBIDDEN_FIELD"],
    [field("otp", "123" + "456"), "FORBIDDEN_FIELD"],
    [field("authorization", "Bearer " + "abc"), "FORBIDDEN_FIELD"],
    [field("cookie", "sid=x"), "FORBIDDEN_FIELD"],
    [field("privateKey", "-----BEGIN " + "RSA " + "PRIVATE KEY-----"), "FORBIDDEN_FIELD"],
    [field("url", "https://" + "example.com/private?token=x"), "FORBIDDEN_FIELD"],
    [field("ipAddress", "127.0.0.1"), "FORBIDDEN_FIELD"],
    [field("macAddress", "00:11:22:33:44:55"), "FORBIDDEN_FIELD"],
    [field("machineId", "machine-guid"), "FORBIDDEN_FIELD"],
    [field("username", "localuser"), "FORBIDDEN_FIELD"],
    [field("preciseLocation", "lat,lng"), "FORBIDDEN_FIELD"],
    [field("arbitraryMetadata", "anything"), "UNKNOWN_PROPERTY"],
    [field("trusted", true), "UNKNOWN_PROPERTY"],
    [field("production", true), "UNKNOWN_PROPERTY"],
    [field("authorized", true), "UNKNOWN_PROPERTY"],
    [field("admin", true), "UNKNOWN_PROPERTY"],
    [field("paid", true), "UNKNOWN_PROPERTY"],
    [field("executionGate", "OPEN"), "UNKNOWN_PROPERTY"],
    [field("eventName", "unknown_event"), "UNKNOWN_EVENT"],
    [field("moduleId", "RANDOM_MODULE"), "UNKNOWN_MODULE"],
    [field("errorClassSafe", "token" + "=synthetic"), "FORBIDDEN_VALUE"],
    [field("domainCategory", "https://" + "example.com/private?token=x"), "FORBIDDEN_VALUE"]
  ].forEach(([mutation, reason]) => assertRejected(api, mutation, reason));
  const prototypeAttack = JSON.parse("{\"eventName\":\"module_opened\",\"eventVersion\":1,\"anonymousInstallId\":\"wai_00000000000000000000000000000001\",\"sessionId\":\"was_000000000000000000000001\",\"moduleId\":\"HOME\",\"actionClass\":\"MODULE_OPEN\",\"outcome\":\"SUCCESS\",\"timestamp\":" + NOW + ",\"__proto__\":{\"polluted\":true}}");
  assert.equal(api.validateAnalyticsEvent(prototypeAttack, { now:NOW }).accepted, false);
  assertRejected(api, { appVersion:"x".repeat(200) }, "FORBIDDEN_VALUE");
  assertRejected(api, { timestamp:Date.parse("3026-01-01T00:00:00.000Z") }, "INVALID_TIMESTAMP");

  const queue = api.createEventQueue({ max:100 });
  for (let i = 0; i < 150; i += 1) queue.push(baseEvent(api, { timestamp:NOW + i }));
  const queueSnapshot = queue.snapshot();
  assert.equal(queueSnapshot.max, 100);
  assert.equal(queueSnapshot.size, 100);
  assert.equal(queueSnapshot.droppedByBound, 50);
  assert.equal(queueSnapshot.productBlocked, false);

  const runtimeDisabled = api.createAnalyticsRuntime({ enabled:false, now:NOW, randomBytes:bytes(7) });
  assert.equal(runtimeDisabled.track({ eventName:"module_opened", moduleId:"HOME", actionClass:"MODULE_OPEN", outcome:"SUCCESS" }).accepted, false);
  assert.equal(runtimeDisabled.queueSnapshot().size, 0);
  const runtimeEnabled = api.createAnalyticsRuntime({ enabled:true, now:NOW, queueMax:10, randomBytes:bytes(8) });
  for (let i = 0; i < 100; i += 1) {
    const result = runtimeEnabled.track({ eventName:"module_opened", moduleId:"HOME", actionClass:"MODULE_OPEN", outcome:"SUCCESS", timestamp:NOW });
    assert.equal(result.accepted, true);
  }
  const routeAggregate = runtimeEnabled.aggregate();
  assert.equal(routeAggregate.moduleMetrics.find(row => row.moduleId === "HOME").opens, 1, "rerenders should not inflate module opens");
  assert.equal(api.safeTrack({ track:() => { throw new Error("boom"); } }, baseEvent(api)).nonBlocking, true);

  const aggregate = api.aggregateEvents([
    makeEvent(api, 1, 1, "SHOPPING", "module_opened", "MODULE_OPEN", "SUCCESS", 0),
    makeEvent(api, 1, 1, "SHOPPING", "module_opened", "MODULE_OPEN", "SUCCESS", 0),
    makeEvent(api, 1, 2, "SHOPPING", "search_completed", "SEARCH", "SUCCESS", 0),
    makeEvent(api, 1, 3, "SHOPPING", "search_completed", "SEARCH", "SUCCESS", 1),
    makeEvent(api, 2, 4, "FLIGHT", "module_opened", "MODULE_OPEN", "SUCCESS", 0),
    makeEvent(api, 2, 5, "FLIGHT", "search_failed", "SEARCH", "FAILURE", 0),
    makeEvent(api, 3, 6, "MAIL", "mail_today_view_opened", "MAIL", "SUCCESS", 10)
  ], { now:NOW });
  assert.equal(aggregate.dau, 2);
  assert.equal(aggregate.wau, 2);
  assert.equal(aggregate.mau, 3);
  assert.equal(aggregate.uniqueCountErrors, 0);
  const shopping = aggregate.moduleMetrics.find(row => row.moduleId === "SHOPPING");
  assert.equal(shopping.activeInstalls, 1);
  assert.equal(shopping.opens, 1);
  assert.equal(shopping.coreActions, 2);
  assert.equal(shopping.actionsPerActiveInstall, 2);
  assert.equal(shopping.repeatUseRate, 1);
  assert.equal(shopping.successRate, 1);
  const flight = aggregate.moduleMetrics.find(row => row.moduleId === "FLIGHT");
  assert.equal(flight.failureRate, 0.5);

  const priority = {
    highUseHighSuccess:api.prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.55, successRate:0.9, failureRate:0.05, repeatUseRate:0.4, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"NORMAL" }),
    highUseLowSuccess:api.prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.55, successRate:0.3, failureRate:0.6, repeatUseRate:0.35, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"NORMAL" }),
    lowUseHighSuccess:api.prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.05, successRate:0.9, failureRate:0.02, repeatUseRate:0.2, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"NORMAL" }),
    lowUseLowSuccess:api.prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.05, successRate:0.2, failureRate:0.7, repeatUseRate:0.02, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"NORMAL" }),
    essentialLowUse:api.prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.03, successRate:0.4, failureRate:0.2, repeatUseRate:0.05, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"ESSENTIAL" }),
    coverageLimitedLowUse:api.prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.03, successRate:0.4, failureRate:0.2, repeatUseRate:0.05, maturity:"MATURE", coverageLimitation:"PROVIDER_LIMITED", essentiality:"NORMAL" }),
    newModuleLowSample:api.prioritizeModule({ activeInstalls:10, observationDays:2, activeUserShare:0.5, successRate:0.1, failureRate:0.8, repeatUseRate:0, maturity:"NEW", coverageLimitation:"NONE", essentiality:"NORMAL" })
  };
  assert.match(priority.highUseHighSuccess.result, /INVEST_MORE|KEEP_OPTIMIZING/);
  assert.match(priority.highUseLowSuccess.result, /INVESTIGATE|INVEST_MORE/);
  assert.match(priority.lowUseHighSuccess.result, /INVESTIGATE|MAINTAIN/);
  assert.match(priority.lowUseLowSuccess.result, /DEPRIORITIZE|EVALUATE_FOR_REMOVAL/);
  assert.notEqual(priority.essentialLowUse.result, "EVALUATE_FOR_REMOVAL");
  assert.notEqual(priority.coverageLimitedLowUse.reason, "LOW_USE_LOW_SUCCESS_WITH_GUARDS");
  assert.equal(priority.newModuleLowSample.result, "INSUFFICIENT_DATA");
  Object.values(priority).forEach(result => assert.equal(result.automaticMutation, false));

  const isolation = api.evaluateProductResultIsolation(() => ({ answer:"same", recommendation:"same", providerReadiness:"unchanged" }));
  assert.equal(isolation.sameMaterialResult, true);
  assert.equal(isolation.recommendationInfluence, 0);
  assert.equal(isolation.providerStateInfluence, 0);
  assert.equal(isolation.commissionInfluence, 0);
  assert.equal(isolation.analyticsFailureBlocksProduct, 0);

  const inventory = api.eventInventory();
  assert.ok(inventory.length >= 8);
  assert.equal(inventory.some(row => row.EVENT === "button_micro_click" && row.DECISION === "DELETE"), true);
  assert.equal(inventory.some(row => row.EVENT === "future_backend_upload" && row.DECISION === "DEFER"), true);
  assert.ok(api.moduleAudit().length >= 4);

  const suite = api.runAnonymousProductAnalyticsSuite();
  assert.equal(suite.moduleName, "anonymous_product_analytics_v1");
  assert.equal(suite.productResult.FIRST_RUN_ACCOUNT_REQUIRED, "NO");
  assert.equal(suite.productResult.ANONYMOUS_USAGE_MEASUREMENT, "YES");
  assert.equal(suite.productResult.DEVICE_FINGERPRINTING, "NO");
  assert.equal(suite.productResult.QUERY_CONTENT_COLLECTION, "NO");
  assert.equal(suite.productResult.MAIL_CONTENT_COLLECTION, "NO");
  assert.equal(suite.productResult.CREDENTIAL_COLLECTION, "NO");
  assert.equal(suite.productResult.FULL_URL_COLLECTION, "NO");
  assert.equal(suite.productResult.AUTOMATIC_MODULE_DELETION, "NO");
  assertZeroMetrics(suite.highRiskZeroMetrics);
  assert.equal(suite.privacyMetrics.PRIVACY_ATTACK_CASES, suite.privacyMetrics.PRIVACY_ATTACKS_BLOCKED);
  assert.equal(suite.usageMetrics.DAU_EXPECTED, suite.usageMetrics.DAU_ACTUAL);
  assert.equal(suite.usageMetrics.WAU_EXPECTED, suite.usageMetrics.WAU_ACTUAL);
  assert.equal(suite.usageMetrics.MAU_EXPECTED, suite.usageMetrics.MAU_ACTUAL);
  assert.equal(suite.usageMetrics.UNIQUE_COUNT_ERRORS, 0);
  assert.equal(suite.usageMetrics.MODULE_AGGREGATION_ERRORS, 0);
  assert.equal(suite.prioritization.NEW_MODULE_LOW_SAMPLE, "INSUFFICIENT_DATA");
  assert.equal(suite.mutationResult.CRITICAL_MUTATIONS_RUN, suite.mutationResult.MUTATIONS_CAUGHT);
  assert.equal(suite.externalEffects.ANALYTICS_NETWORK_CALLS, 0);
  assert.equal(suite.externalEffects.THIRD_PARTY_ANALYTICS_CALLS, 0);
  assert.equal(suite.externalEffects.PROVIDER_API_CALLS, 0);
  assert.equal(suite.externalEffects.REAL_CREDENTIAL_READS, 0);
  assert.equal(suite.externalEffects.EMAIL_ACTIONS, 0);
  assert.equal(suite.governance.executionGate, "CLOSED");
  assert.equal(suite.governance.authorizesExecution, false);
  assert.equal(suite.governance.EMAIL_SEND_ENABLED, false);

  console.log("ANONYMOUS_PRODUCT_ANALYTICS_EFFECTIVENESS PASS privacy=" + suite.privacyMetrics.PRIVACY_ATTACKS_BLOCKED + "/" + suite.privacyMetrics.PRIVACY_ATTACK_CASES + " dau=" + suite.usageMetrics.DAU_ACTUAL + " wau=" + suite.usageMetrics.WAU_ACTUAL + " mau=" + suite.usageMetrics.MAU_ACTUAL + " queue=bounded mutations=" + suite.mutationResult.MUTATIONS_CAUGHT + "/" + suite.mutationResult.CRITICAL_MUTATIONS_RUN);
}

main();
