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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingUserVisibleSafetyBoundaryExplainer.js"]);
  const api = windowRef.WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer;
  assert.equal(api.GLOBAL_SHOPPING_USER_VISIBLE_SAFETY_BOUNDARY_EXPLAINER_VERSION, "4.2.6");
  const ready = api.buildGlobalShoppingUserVisibleSafetyBoundaryExplainer({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    offlineReleaseMemorySnapshotSummary:readySummary("Offline Release Memory Snapshot", "Offline Release Memory Snapshot 已准备"),
    noProviderExecutionFinalGuardSummary:readySummary("No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 已准备"),
    userFacingSafetyReceiptSummary:readySummary("User-Facing Safety Receipt", "User-Facing Safety Receipt 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备")
  });
  assert.equal(ready.explainerName, "global_shopping_user_visible_safety_boundary_explainer_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.explainerSummary.readyForProviderTrustClosureViewModel, true);
  assert.equal(ready.userFacingSummary.resultLabel, "User-Visible Safety Boundary Explainer 已准备");
  const needsReview = api.buildGlobalShoppingUserVisibleSafetyBoundaryExplainer({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingUserVisibleSafetyBoundaryExplainer({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    endorsementClaim:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("endorsement_claim_detected"), true);
  const safeJson = JSON.stringify(api.buildGlobalShoppingUserVisibleSafetyBoundaryExplainerAuditDraft({ token:"abc", checkoutUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_USER_VISIBLE_SAFETY_BOUNDARY_EXPLAINER PASS");
}

main();
