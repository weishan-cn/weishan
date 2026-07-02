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
    rows:[{ rowId:"row_1", label:title, value:resultLabel, status:"pass", redacted:true }],
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
    "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceClosureViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderGovernanceClosureViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_VIEW_MODEL_VERSION, "4.0.2");
  const ready = api.buildGlobalShoppingProviderGovernanceClosureViewModel({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备"),
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    finalReadinessHandoffSimulatorSummary:readySummary("Final Readiness Handoff Simulator", "Final Readiness Handoff Simulator 已准备"),
    providerGovernanceClosureEvidenceLedgerSummary:readySummary("Provider Governance Closure Evidence Ledger", "Provider Governance Closure Evidence Ledger 已准备")
  });
  assert.equal(ready.viewModelName, "global_shopping_provider_governance_closure_view_model_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Governance Closure Review");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.safeToProceedWithHumanGovernanceClosureReview, true);
  assert.equal(ready.disclosureRows.some((row) => row.value.includes("不保存真实 evidence")), true);

  const needsReview = api.buildGlobalShoppingProviderGovernanceClosureViewModel({
    offlineProviderGovernanceClosureBoardSummary:readySummary("Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithHumanGovernanceClosureReview, false);

  const blocked = api.buildGlobalShoppingProviderGovernanceClosureViewModel({
    offlineProviderGovernanceClosureBoardSummary:{ status:"blocked", userFacingSummary:{ title:"Offline Provider Governance Closure Board", resultLabel:"Offline Provider Governance Closure Board 已阻断", redacted:true }, rows:[], redacted:true },
    noActivationComplianceSealSummary:readySummary("No-Activation Compliance Seal", "No-Activation Compliance Seal 已准备"),
    finalReadinessHandoffSimulatorSummary:readySummary("Final Readiness Handoff Simulator", "Final Readiness Handoff Simulator 已准备"),
    providerGovernanceClosureEvidenceLedgerSummary:readySummary("Provider Governance Closure Evidence Ledger", "Provider Governance Closure Evidence Ledger 已准备")
  });
  assert.equal(blocked.status, "blocked");

  const json = JSON.stringify(api.buildGlobalShoppingProviderGovernanceClosureViewModel({ token:"abc", paymentUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_VIEW_MODEL PASS");
}

main();
