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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderPublicTrustClosureCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderPublicTrustClosureCenter;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_PUBLIC_TRUST_CLOSURE_CENTER_VERSION, "4.1.4");
  const ready = api.buildGlobalShoppingProviderPublicTrustClosureCenter({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    userFacingSafetyReceiptSummary:readySummary("User-Facing Safety Receipt", "User-Facing Safety Receipt 已准备"),
    offlineReleaseCandidateClosurePackSummary:readySummary("Offline Release Candidate Closure Pack", "Offline Release Candidate Closure Pack 已准备"),
    providerNoProductionGuaranteeMatrixSummary:readySummary("Provider No-Production Guarantee Matrix", "Provider No-Production Guarantee Matrix 已准备"),
    providerDistributionClosureViewModelSummary:readySummary("Provider Distribution Closure Review", "Provider Distribution Closure Review 已准备")
  });
  assert.equal(ready.centerName, "global_shopping_provider_public_trust_closure_center_v1");
  assert.equal(ready.appVersion, "4.1.4");
  assert.equal(ready.status, "ready");
  assert.equal(ready.centerMode, "trust_closure_only");
  assert.equal(ready.closureSummary.readyForOfflineReleaseMemorySnapshot, true);
  assert.equal(ready.userFacingSummary.resultLabel, "Provider Public Trust Closure Center 已准备");
  assert.equal(ready.rows.some((row) => row.value === "Provider Distribution Closure Review 已准备"), true);
  assert.equal(JSON.stringify(ready).includes("token"), false);
  const needsReview = api.buildGlobalShoppingProviderPublicTrustClosureCenter({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.closureSummary.readyForOfflineReleaseMemorySnapshot, false);
  const blocked = api.buildGlobalShoppingProviderPublicTrustClosureCenter({
    providerDistributionFreezeConsoleSummary:readySummary("Provider Distribution Freeze Console", "Provider Distribution Freeze Console 已准备"),
    provider:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("provider_detected"), true);
  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderPublicTrustClosureCenterAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_PUBLIC_TRUST_CLOSURE_CENTER PASS");
}

main();
