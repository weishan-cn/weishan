const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function readySummary(title, resultLabel) {
  return {
    status:"ready",
    title,
    userFacingSummary:{ title, resultLabel, redacted:true },
    rows:[{ rowId:title.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label:title, value:resultLabel, status:"pass", redacted:true }],
    bookingUrl:null,
    checkoutUrl:null,
    paymentUrl:null,
    orderUrl:null,
    payment:false,
    order:false,
    ticketing:false,
    autoOpen:false,
    autoRefresh:false,
    fileWrite:false,
    download:false,
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineReleaseMemorySnapshot.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineReleaseMemorySnapshot;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_RELEASE_MEMORY_SNAPSHOT_VERSION, "4.1.6");
  const ready = api.buildGlobalShoppingOfflineReleaseMemorySnapshot({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    verifyE2eBuildSummary:{ status:"ready", title:"verify/e2e/build Summary", userFacingSummary:{ title:"verify/e2e/build Summary", resultLabel:"verify/e2e/build Summary 已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.snapshotName, "global_shopping_offline_release_memory_snapshot_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.snapshotMode, "memory_snapshot_only");
  assert.equal(ready.snapshotSummary.readyForNoProviderExecutionFinalGuard, true);
  assert.equal(ready.userFacingSummary.resultLabel, "Offline Release Memory Snapshot 已准备");
  const needsReview = api.buildGlobalShoppingOfflineReleaseMemorySnapshot({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.snapshotSummary.readyForNoProviderExecutionFinalGuard, false);
  const blocked = api.buildGlobalShoppingOfflineReleaseMemorySnapshot({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    persistMemorySnapshot:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("memory_snapshot_persistence_detected"), true);
  const safeJson = JSON.stringify(api.buildGlobalShoppingOfflineReleaseMemorySnapshotAuditDraft({ token:"abc", orderUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_OFFLINE_RELEASE_MEMORY_SNAPSHOT PASS");
}

main();
