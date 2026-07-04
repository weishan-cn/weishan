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
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingFinalReadinessHandoffSimulator.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingFinalReadinessHandoffSimulator;
  assert.equal(api.GLOBAL_SHOPPING_FINAL_READINESS_HANDOFF_SIMULATOR_VERSION, "4.2.5");
  const ready = api.buildGlobalShoppingFinalReadinessHandoffSimulator({
    simulatorMode:"readonly",
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    readOnlyProviderReadinessCertificateSummary:readySummary("Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("Manual Provider Activation Handoff Packet", "Manual Provider Activation Handoff Packet 已准备"),
    finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "Final Offline Launch Review Console 已准备")
  });
  assert.equal(ready.simulatorName, "global_shopping_final_readiness_handoff_simulator_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.simulatorMode, "readonly");
  assert.equal(ready.handoffSummary.readyForClosureEvidenceLedger, true);
  assert.equal(ready.rows.some((row) => row.label === "Manual Provider Activation Handoff Packet"), true);

  const needsReview = api.buildGlobalShoppingFinalReadinessHandoffSimulator({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingFinalReadinessHandoffSimulator({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    readOnlyProviderReadinessCertificateSummary:readySummary("Read-Only Provider Readiness Certificate", "Read-Only Provider Readiness Certificate 已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("Manual Provider Activation Handoff Packet", "Manual Provider Activation Handoff Packet 已准备"),
    finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "Final Offline Launch Review Console 已准备"),
    executeRealHandoff:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("real_handoff_detected"), true);

  const json = JSON.stringify(api.buildGlobalShoppingFinalReadinessHandoffSimulator({ token:"abc", checkoutUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_FINAL_READINESS_HANDOFF_SIMULATOR PASS");
}

main();
