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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderNoProductionGuaranteeMatrix.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_NO_PRODUCTION_GUARANTEE_MATRIX_VERSION, "4.0.3");
  const ready = api.buildGlobalShoppingProviderNoProductionGuaranteeMatrix({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    userFacingSafetyReceiptSummary:readySummary("User-Facing Safety Receipt", "User-Facing Safety Receipt 已准备"),
    offlineReleaseCandidateClosurePackSummary:readySummary("Offline Release Candidate Closure Pack", "Offline Release Candidate Closure Pack 已准备"),
    providerSafetyDistributionMatrixSummary:readySummary("Provider Safety Distribution Matrix", "Provider Safety Distribution Matrix 已准备")
  });
  assert.equal(ready.matrixName, "global_shopping_provider_no_production_guarantee_matrix_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider No-Production Guarantee Matrix");
  assert.equal(ready.noProductionSummary.readyForProviderDistributionClosureViewModel, true);
  assert.equal(api.buildGlobalShoppingProviderNoProductionGuaranteeMatrix({}).status, "needs_review");
  const blocked = api.buildGlobalShoppingProviderNoProductionGuaranteeMatrix({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    userFacingSafetyReceiptSummary:readySummary("User-Facing Safety Receipt", "User-Facing Safety Receipt 已准备"),
    offlineReleaseCandidateClosurePackSummary:readySummary("Offline Release Candidate Closure Pack", "Offline Release Candidate Closure Pack 已准备"),
    providerSafetyDistributionMatrixSummary:readySummary("Provider Safety Distribution Matrix", "Provider Safety Distribution Matrix 已准备"),
    switchProductionProvider:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("production_provider_switch_detected"), true);
  console.log("GLOBAL_SHOPPING_PROVIDER_NO_PRODUCTION_GUARANTEE_MATRIX PASS");
}

main();
