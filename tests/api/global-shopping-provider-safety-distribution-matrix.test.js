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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderSafetyDistributionMatrix.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderSafetyDistributionMatrix;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SAFETY_DISTRIBUTION_MATRIX_VERSION, "4.0.9");
  const ready = api.buildGlobalShoppingProviderSafetyDistributionMatrix({
    matrixMode:"offline_mock",
    offlineDistributionReadinessCenterSummary:readySummary("Offline Distribution Readiness Center", "Offline Distribution Readiness Center 已准备"),
    noActivationEnforcementLedgerSummary:readySummary("No-Activation Enforcement Ledger", "No-Activation Enforcement Ledger 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "Provider Final Safety Seal 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备")
  });
  assert.equal(ready.matrixName, "global_shopping_provider_safety_distribution_matrix_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.matrixMode, "offline_mock");
  assert.equal(ready.userFacingSummary.title, "Provider Safety Distribution Matrix");
  assert.equal(ready.distributionSummary.readyForProviderDistributionReadinessViewModel, true);
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.payment, false);
  assert.equal(ready.safety.order, false);
  assert.equal(ready.rows.some((row) => row.label === "Final User Trust Summary"), true);
  const needsReview = api.buildGlobalShoppingProviderSafetyDistributionMatrix({});
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.distributionSummary.needsReviewGateCount > 0, true);
  const blocked = api.buildGlobalShoppingProviderSafetyDistributionMatrix({
    offlineDistributionReadinessCenterSummary:readySummary("Offline Distribution Readiness Center", "Offline Distribution Readiness Center 已准备"),
    noActivationEnforcementLedgerSummary:readySummary("No-Activation Enforcement Ledger", "No-Activation Enforcement Ledger 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "Provider Final Safety Seal 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    modifyRuntimeConfig:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("runtime_config_mutation_detected"), true);
  const json = JSON.stringify(api.buildGlobalShoppingProviderSafetyDistributionMatrix({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SAFETY_DISTRIBUTION_MATRIX PASS");
}

main();
