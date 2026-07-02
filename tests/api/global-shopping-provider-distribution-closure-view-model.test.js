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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderDistributionClosureViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderDistributionClosureViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_CLOSURE_VIEW_MODEL_VERSION, "4.0.1");
  const ready = api.buildGlobalShoppingProviderDistributionClosureViewModel({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    userFacingSafetyReceiptSummary:readySummary("User-Facing Safety Receipt", "User-Facing Safety Receipt 已准备"),
    offlineReleaseCandidateClosurePackSummary:readySummary("Offline Release Candidate Closure Pack", "Offline Release Candidate Closure Pack 已准备"),
    providerNoProductionGuaranteeMatrixSummary:readySummary("Provider No-Production Guarantee Matrix", "Provider No-Production Guarantee Matrix 已准备")
  });
  assert.equal(ready.viewModelName, "global_shopping_provider_distribution_closure_view_model_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Distribution Closure Review");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.safeToProceedWithHumanDistributionClosureReview, true);
  assert.equal(ready.disclosureRows.some((row) => row.value === "No-Production Guarantee 不切换 production provider"), true);
  const needsReview = api.buildGlobalShoppingProviderDistributionClosureViewModel({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithHumanDistributionClosureReview, false);
  const blocked = api.buildGlobalShoppingProviderDistributionClosureViewModel({
    providerDistributionFreezeConsoleSummary:{ status:"blocked", userFacingSummary:{ title:"Provider Distribution Freeze Console", resultLabel:"Provider Distribution Freeze Console 已阻断", redacted:true }, rows:[], redacted:true },
    userFacingSafetyReceiptSummary:readySummary("User-Facing Safety Receipt", "User-Facing Safety Receipt 已准备"),
    offlineReleaseCandidateClosurePackSummary:readySummary("Offline Release Candidate Closure Pack", "Offline Release Candidate Closure Pack 已准备"),
    providerNoProductionGuaranteeMatrixSummary:readySummary("Provider No-Production Guarantee Matrix", "Provider No-Production Guarantee Matrix 已准备")
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.safeToProceedWithHumanDistributionClosureReview, false);
  console.log("GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_CLOSURE_VIEW_MODEL PASS");
}

main();
