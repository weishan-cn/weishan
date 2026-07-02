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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineLaunchReadinessFinalizer.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineLaunchReadinessFinalizer;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_LAUNCH_READINESS_FINALIZER_VERSION, "4.0.4");
  const ready = api.buildGlobalShoppingOfflineLaunchReadinessFinalizer({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    offlineReleaseMemorySnapshotSummary:readySummary("Offline Release Memory Snapshot", "Offline Release Memory Snapshot 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    verifyE2eBuildSummary:{ status:"ready", title:"Verify / E2E / Build Summary", userFacingSummary:{ resultLabel:"Verify / E2E / Build 已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.finalizerName, "global_shopping_offline_launch_readiness_finalizer_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Offline Launch Readiness Finalizer 已准备");
  assert.equal(ready.offlineLaunchReadinessFinalizerSummary.readyForUserSafePublicClaimVerifier, true);
  assert.equal(ready.offlineLaunchReadinessFinalizerSections.length, 5);
  const needsReview = api.buildGlobalShoppingOfflineLaunchReadinessFinalizer({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingOfflineLaunchReadinessFinalizer({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    offlineReleaseMemorySnapshotSummary:readySummary("Offline Release Memory Snapshot", "Offline Release Memory Snapshot 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    verifyE2eBuildSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Verify / E2E / Build 已准备", redacted:true }, redacted:true },
    activateSandbox:true
  });
  assert.equal(blocked.status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingOfflineLaunchReadinessFinalizerAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_OFFLINE_LAUNCH_READINESS_FINALIZER PASS");
}

main();
