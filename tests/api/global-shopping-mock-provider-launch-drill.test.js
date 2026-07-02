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
    "apps/desktop/src/renderer/core/globalShoppingMockProviderAdapterRegistryRuntime.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderContractReplayHarness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingHumanApprovalSimulationGate.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderLaunchDrill.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingMockProviderLaunchDrill;
  assert.equal(api.GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL_VERSION, "4.0.2");

  const ready = api.buildGlobalShoppingMockProviderLaunchDrill({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true } },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true } }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.drillName, "global_shopping_mock_provider_launch_drill_v1");
  assert.equal(ready.drillBoundary.canStartRealProvider, false);
  assert.equal(ready.drillSummary.readyForRollbackPlanReview, true);
  assert.equal(ready.rows.some((item) => item.label.includes("Mock 启动边界")), true);

  const needsReview = api.buildGlobalShoppingMockProviderLaunchDrill({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingMockProviderLaunchDrill({
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Mock Adapter 注册运行时已准备", redacted:true } },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 合同回放器已准备", redacted:true } },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 启动准备总闸门已准备", redacted:true } },
    humanApprovalSimulationGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"审批模拟闸门已准备", redacted:true } },
    generateEndpoint:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingMockProviderLaunchDrillAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL PASS");
}

main();
