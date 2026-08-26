"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/stateCachePersistenceGuard.js",
  "apps/desktop/src/renderer/core/performanceResourceMemoryGuard.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, Date, performance, Map, Set, Object, Array, String, Number, Boolean });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window;
}

function assertZeroMetrics(metrics) {
  Object.keys(metrics).forEach(function (key) {
    assert.equal(metrics[key], 0, key + " should remain zero");
  });
}

function makeOffers(count) {
  return Array.from({ length:count }, function (_, index) {
    return {
      id:"offer-" + index,
      title:"Synthetic Product " + index,
      price:index + 1,
      currency:"USD",
      clientSecret:"must-not-leak",
      rawPayload:{ token:"must-not-leak" }
    };
  });
}

function main() {
  const windowRef = load();
  const api = windowRef.WeishanPerformanceResourceMemoryGuard;
  assert.ok(api, "performance guard should be exposed");

  const tracker = api.createRuntimeResourceTracker({ testProfile:"unit" });
  const before = tracker.snapshot();
  const listenerA = tracker.trackListener("route-a", null, "click", function () {});
  const listenerB = tracker.trackListener("route-b", null, "click", function () {});
  const timerA = tracker.trackTimer("route-a", "timer-a", null);
  const requestA = tracker.startRequest("route-a", "request-a");
  const abortA = tracker.trackAbortController("route-a", { abort:function () { this.aborted = true; }, signal:{ aborted:false } });
  const domA = tracker.trackDomNodes("route-a", 7);
  assert.equal(tracker.snapshot().totals.listeners, 2);
  assert.equal(tracker.snapshot().totals.timers, 1);
  assert.equal(tracker.snapshot().totals.requestMapEntries, 1);
  tracker.releaseOwner("route-a");
  domA.dispose();
  assert.equal(tracker.snapshot().totals.listeners, 1, "releaseOwner must not release another route's listener");
  assert.equal(tracker.snapshot().totals.timers, 0);
  assert.equal(tracker.snapshot().totals.requestMapEntries, 0);
  listenerB.dispose();
  timerA.dispose();
  requestA.complete();
  abortA.dispose();
  const afterCleanup = tracker.cleanupAll();
  assert.deepEqual(afterCleanup.totals, before.totals);

  const routeCycles = api.simulateRouteCycles(100);
  assert.equal(routeCycles.cyclesRun, 100);
  assert.equal(routeCycles.after.totals.listeners, 0);
  assert.equal(routeCycles.after.totals.timers, 0);
  assert.equal(routeCycles.after.totals.abortControllers, 0);
  assert.equal(routeCycles.after.totals.requestMapEntries, 0);
  assert.equal(routeCycles.after.totals.domNodes, 0);
  assert.equal(routeCycles.growth.status, "stable");

  const visible = api.buildVisibleResultWindow(makeOffers(5000), { maxVisible:100 });
  assert.equal(visible.status, "bounded");
  assert.equal(visible.totalItems, 5000);
  assert.equal(visible.visibleCount, 100);
  assert.equal(visible.hiddenCount, 4900);
  assert.equal(visible.secretMaterialPropagated, 0);
  assert.equal(Object.prototype.hasOwnProperty.call(visible.visibleItems[0], "clientSecret"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(visible.visibleItems[0], "rawPayload"), true);
  assert.equal(Object.prototype.hasOwnProperty.call(visible.visibleItems[0].rawPayload, "token"), false);

  const mail100 = api.summarizeMailMetadata(api.buildSyntheticMailMetadata(100), { visibleLimit:25 });
  const mail1000 = api.summarizeMailMetadata(api.buildSyntheticMailMetadata(1000), { visibleLimit:25 });
  const mail10000 = api.summarizeMailMetadata(api.buildSyntheticMailMetadata(10000), { visibleLimit:25, batchSize:500 });
  const mail50000 = api.summarizeMailMetadata(api.buildSyntheticMailMetadata(50000), { visibleLimit:25, batchSize:1000 });
  [mail100, mail1000, mail10000, mail50000].forEach(function (summary) {
    assert.equal(summary.status, "summarized");
    assert.equal(summary.visibleCount, Math.min(25, summary.messageCount));
    assert.equal(summary.rawBodyRetained, false);
    assert.equal(summary.secretMaterialPropagated, 0);
  });
  assert.equal(mail50000.processedCount, 50000);

  const batch = api.processLargeCollection(makeOffers(1000), {
    maxItems:500,
    visibleLimit:50,
    batchSize:125,
    projector:function (item) { return { id:item.id, title:item.title, token:item.clientSecret }; }
  });
  assert.equal(batch.processedCount, 500);
  assert.equal(batch.skippedCount, 500);
  assert.equal(batch.visibleCount, 50);
  assert.equal(batch.secretMaterialPropagated, 0);

  const suite = api.runPerformanceResourceMemorySuite();
  assert.equal(suite.moduleName, "performance_resource_memory_guard_v1");
  assert.equal(suite.after.ROUTE_CYCLES_RUN, 100);
  assert.equal(suite.after.LISTENERS_AFTER, 0);
  assert.equal(suite.after.TIMERS_AFTER, 0);
  assert.equal(suite.after.ABORT_CONTROLLERS_AFTER, 0);
  assert.equal(suite.after.REQUEST_MAP_ENTRIES_AFTER, 0);
  assert.equal(suite.after.DOM_NODES_AFTER, 0);
  assert.equal(suite.after.SHOPPING_5000_VISIBLE_COUNT, 100);
  assert.equal(suite.after.SHOPPING_5000_HIDDEN_COUNT, 4900);
  assert.equal(suite.after.CACHE_5000_OPS_SIZE, 250);
  assert.equal(suite.baseline.ROUTE_100_CYCLES_UNGUARDED_RETAINED_LISTENERS, 100);
  assert.equal(suite.baseline.LARGE_RESULT_UNGUARDED_VISIBLE_ITEMS, 5000);
  assert.equal(suite.baseline.MAIL_10000_UNGUARDED_PRIMARY_SCAN, 10000);
  assertZeroMetrics(suite.zeroMetrics);
  assert.equal(suite.externalEffects.PROVIDER_API_CALLS, 0);
  assert.equal(suite.externalEffects.REAL_CREDENTIAL_READS, 0);
  assert.equal(suite.externalEffects.EMAIL_ACTIONS, 0);
  assert.ok(suite.resourceInventory.length >= 9);
  assert.equal(suite.productResult.MAIL_LARGE_MAILBOX, "OPTIMIZE");
  assert.equal(suite.productResult.LISTENER_LIFECYCLE, "OPTIMIZE");

  console.log("PERFORMANCE_RESOURCE_MEMORY_EFFECTIVENESS PASS routeCycles=100 mail=100/1000/10000/50000 shopping=5000 cache=5000 zeroMetrics=0");
}

main();
