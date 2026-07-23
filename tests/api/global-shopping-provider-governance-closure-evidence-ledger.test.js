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
    "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceClosureEvidenceLedger.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderGovernanceClosureEvidenceLedger;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_EVIDENCE_LEDGER_VERSION, "4.2.8");
  const ready = api.buildGlobalShoppingProviderGovernanceClosureEvidenceLedger({
    ledgerMode:"readonly",
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    finalReadinessHandoffSimulatorSummary:readySummary("Final Readiness Handoff Simulator", "Final Readiness Handoff Simulator 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    verifyE2eBuildSummary:{ status:"ready", userFacingSummary:{ title:"verify/e2e/build summary", resultLabel:"verify/e2e/build 已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.ledgerName, "global_shopping_provider_governance_closure_evidence_ledger_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.ledgerMode, "readonly");
  assert.equal(ready.ledgerSummary.readyForGovernanceClosureViewModel, true);
  assert.equal(ready.rows.some((row) => row.label === "verify/e2e/build summary"), true);

  const needsReview = api.buildGlobalShoppingProviderGovernanceClosureEvidenceLedger({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderGovernanceClosureEvidenceLedger({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    finalReadinessHandoffSimulatorSummary:readySummary("Final Readiness Handoff Simulator", "Final Readiness Handoff Simulator 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    verifyE2eBuildSummary:{ status:"ready", userFacingSummary:{ title:"verify/e2e/build summary", resultLabel:"verify/e2e/build 已准备", redacted:true }, redacted:true },
    persistLedger:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("ledger_persistence_detected"), true);

  const json = JSON.stringify(api.buildGlobalShoppingProviderGovernanceClosureEvidenceLedger({ secret:"abc", orderUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_EVIDENCE_LEDGER PASS");
}

main();
