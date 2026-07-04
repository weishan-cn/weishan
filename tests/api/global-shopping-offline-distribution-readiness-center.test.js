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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineDistributionReadinessCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineDistributionReadinessCenter;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_DISTRIBUTION_READINESS_CENTER_VERSION, "4.2.6");
  const ready = api.buildGlobalShoppingOfflineDistributionReadinessCenter({
    centerMode:"offline_mock",
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    finalReadinessHandoffSimulatorSummary:readySummary("Final Readiness Handoff Simulator", "Final Readiness Handoff Simulator 已准备"),
    providerGovernanceClosureEvidenceLedgerSummary:readySummary("Provider Governance Closure Evidence Ledger", "Provider Governance Closure Evidence Ledger 已准备"),
    providerGovernanceClosureViewModelSummary:readySummary("Provider Governance Closure Review", "Provider Governance Closure Review 已准备")
  });
  assert.equal(ready.centerName, "global_shopping_offline_distribution_readiness_center_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.centerMode, "offline_mock");
  assert.equal(ready.userFacingSummary.title, "Offline Distribution Readiness Center");
  assert.equal(ready.distributionSummary.readyForNoActivationEnforcementLedger, true);
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.payment, false);
  assert.equal(ready.safety.order, false);
  assert.equal(ready.rows.some((row) => row.label === "Offline Provider Governance Closure Board"), true);
  const needsReview = api.buildGlobalShoppingOfflineDistributionReadinessCenter({});
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.distributionSummary.needsReviewPanelCount > 0, true);
  const blocked = api.buildGlobalShoppingOfflineDistributionReadinessCenter({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    finalReadinessHandoffSimulatorSummary:readySummary("Final Readiness Handoff Simulator", "Final Readiness Handoff Simulator 已准备"),
    providerGovernanceClosureEvidenceLedgerSummary:readySummary("Provider Governance Closure Evidence Ledger", "Provider Governance Closure Evidence Ledger 已准备"),
    providerGovernanceClosureViewModelSummary:readySummary("Provider Governance Closure Review", "Provider Governance Closure Review 已准备"),
    createDistributionPackage:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("distribution_package_detected"), true);
  const json = JSON.stringify(api.buildGlobalShoppingOfflineDistributionReadinessCenter({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_OFFLINE_DISTRIBUTION_READINESS_CENTER PASS");
}

main();
