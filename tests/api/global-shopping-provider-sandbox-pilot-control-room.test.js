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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderSandboxPilotControlRoom.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxPilotControlRoom;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_PILOT_CONTROL_ROOM_VERSION, "3.2.0");

  const ready = api.buildGlobalShoppingProviderSandboxPilotControlRoom({
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true } },
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    sandboxProviderRollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } },
    providerLaunchSimulationViewModelSummary:{ status:"ready", title:"Provider 启动模拟与回滚预案", redacted:true },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true } },
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.roomName, "global_shopping_provider_sandbox_pilot_control_room_v1");
  assert.equal(ready.userFacingSummary.title, "Provider Sandbox Pilot 控制室");
  assert.equal(ready.controlPanels.length, 7);
  assert.equal(ready.controlSummary.readyForMockIncidentDrill, true);
  assert.equal(ready.rows.some((item) => item.value.includes("不启动真实 provider")), true);

  const needsReview = api.buildGlobalShoppingProviderSandboxPilotControlRoom({
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderSandboxPilotControlRoom({
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true } },
    mockProviderLaunchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock 启动演练已准备", redacted:true } },
    sandboxProviderRollbackPlanSummary:{ status:"ready", userFacingSummary:{ resultLabel:"回滚预案已准备", redacted:true } },
    providerLaunchSimulationViewModelSummary:{ status:"ready", title:"Provider 启动模拟与回滚预案", redacted:true },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true } },
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } },
    startRealProvider:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderSandboxPilotControlRoomAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_PILOT_CONTROL_ROOM PASS");
}

main();
