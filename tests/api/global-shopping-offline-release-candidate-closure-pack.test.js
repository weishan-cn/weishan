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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineReleaseCandidateClosurePack.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineReleaseCandidateClosurePack;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_CLOSURE_PACK_VERSION, "4.0.7");
  const ready = api.buildGlobalShoppingOfflineReleaseCandidateClosurePack({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    userFacingSafetyReceiptSummary:readySummary("User-Facing Safety Receipt", "User-Facing Safety Receipt 已准备"),
    providerDistributionReadinessViewModelSummary:readySummary("Provider Distribution Readiness Review", "Provider Distribution Readiness Review 已准备")
  });
  assert.equal(ready.closurePackName, "global_shopping_offline_release_candidate_closure_pack_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Offline Release Candidate Closure Pack");
  assert.equal(ready.closureSummary.readyForNoProductionGuaranteeMatrix, true);
  assert.equal(api.buildGlobalShoppingOfflineReleaseCandidateClosurePack({}).status, "needs_review");
  const blocked = api.buildGlobalShoppingOfflineReleaseCandidateClosurePack({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    userFacingSafetyReceiptSummary:readySummary("User-Facing Safety Receipt", "User-Facing Safety Receipt 已准备"),
    providerDistributionReadinessViewModelSummary:readySummary("Provider Distribution Readiness Review", "Provider Distribution Readiness Review 已准备"),
    generateRealClosureFile:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("real_closure_file_detected"), true);
  console.log("GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_CLOSURE_PACK PASS");
}

main();
