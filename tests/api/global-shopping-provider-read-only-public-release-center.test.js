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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderReadOnlyPublicReleaseCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_READ_ONLY_PUBLIC_RELEASE_CENTER_VERSION, "4.0.0");
  const ready = api.buildGlobalShoppingProviderReadOnlyPublicReleaseCenter({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    offlineReleaseMemorySnapshotSummary:readySummary("Offline Release Memory Snapshot", "Offline Release Memory Snapshot 已准备"),
    noProviderExecutionFinalGuardSummary:readySummary("No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备"),
    providerTrustClosureViewModelSummary:readySummary("Provider Trust Closure Review", "Provider Trust Closure Review 已准备")
  });
  assert.equal(ready.centerName, "global_shopping_provider_read_only_public_release_center_v1");
  assert.equal(ready.appVersion, "4.0.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.releaseMode, "public_release_review_only");
  assert.equal(ready.releaseSummary.readyForPublicReview, true);
  assert.equal(ready.userFacingSummary.resultLabel, "Provider Read-Only Public Release Center 已准备");
  assert.equal(ready.rows.some((row) => row.value === "Provider Trust Closure Review 已准备"), true);
  assert.equal(JSON.stringify(ready).includes("token"), false);
  const needsReview = api.buildGlobalShoppingProviderReadOnlyPublicReleaseCenter({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.releaseSummary.readyForPublicReview, false);
  const blocked = api.buildGlobalShoppingProviderReadOnlyPublicReleaseCenter({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    provider:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("provider_detected"), true);
  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderReadOnlyPublicReleaseCenterAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_READ_ONLY_PUBLIC_RELEASE_CENTER PASS");
}

main();
