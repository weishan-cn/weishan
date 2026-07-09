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

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingVaultBoundaryContract.js",
    "apps/desktop/src/renderer/core/globalShoppingLegalApprovalWorkflowBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderContractReplayHarness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingHumanApprovalSimulationGate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingHumanApprovalSimulationGate;
  assert.equal(api.GLOBAL_SHOPPING_HUMAN_APPROVAL_SIMULATION_GATE_VERSION, "4.2.7");

  const ready = api.buildGlobalShoppingHumanApprovalSimulationGate({
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审批流程板已准备", redacted:true } },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true } },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界合同已准备", redacted:true } }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.gateName, "global_shopping_human_approval_simulation_gate_v1");
  assert.equal(ready.approvalBoundary.simulationOnly, true);
  assert.equal(ready.approvalBoundary.canCreateApprovalTask, false);
  assert.equal(ready.approvalSummary.readyForMockLaunchDrill, true);
  assert.equal(ready.approvalHealth.realHumanApprovalStillRequired, true);

  const needsReview = api.buildGlobalShoppingHumanApprovalSimulationGate({
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingHumanApprovalSimulationGate({
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"法务审批流程板已准备", redacted:true } },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true } },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Vault 边界合同已准备", redacted:true } },
    sendEmail:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingHumanApprovalSimulationGateAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_HUMAN_APPROVAL_SIMULATION_GATE PASS");
}

main();
