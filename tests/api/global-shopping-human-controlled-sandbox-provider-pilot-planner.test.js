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
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxPilotControlRoom.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderIncidentDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingProductionBlockerMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPilotControlViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingHumanApprovalSimulationGate.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderLaunchDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRollbackPlan.js",
    "apps/desktop/src/renderer/core/globalShoppingHumanControlledSandboxProviderPilotPlanner.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingHumanControlledSandboxProviderPilotPlanner;
  assert.equal(api.GLOBAL_SHOPPING_HUMAN_CONTROLLED_SANDBOX_PROVIDER_PILOT_PLANNER_VERSION, "2.6.0");

  const ready = api.buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true } },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true } },
    providerPilotControlViewModelSummary:{ status:"ready", title:"Provider Sandbox Pilot 控制与阻断", redacted:true },
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true } },
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    sandboxProviderRollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.plannerName, "global_shopping_human_controlled_sandbox_provider_pilot_planner_v1");
  assert.equal(ready.pilotPlanStages.length, 7);
  assert.equal(ready.plannerSummary.readyForKillSwitchDrill, true);
  assert.equal(ready.rows.some((item) => item.value.includes("不启动真实 provider")), true);

  const needsReview = api.buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner({
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true } },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 事故演练已准备", redacted:true } },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true } },
    providerPilotControlViewModelSummary:{ status:"ready", title:"Provider Sandbox Pilot 控制与阻断", redacted:true },
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true } },
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    sandboxProviderRollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } },
    startRealProvider:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingHumanControlledSandboxProviderPilotPlannerAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_HUMAN_CONTROLLED_SANDBOX_PROVIDER_PILOT_PLANNER PASS");
}

main();
