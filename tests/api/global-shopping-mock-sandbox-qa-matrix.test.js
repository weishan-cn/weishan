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

function readySummary(title, resultLabel, status = "ready") {
  return { status, userFacingSummary:{ title, resultLabel, redacted:true }, redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingMockSandboxQaMatrix.js"]);
  const api = windowRef.WeishanGlobalShoppingMockSandboxQaMatrix;
  assert.equal(api.GLOBAL_SHOPPING_MOCK_SANDBOX_QA_MATRIX_VERSION, "2.6.0");

  const ready = api.buildGlobalShoppingMockSandboxQaMatrix({
    offlineProviderAdapterContractKitSummary:readySummary("离线 Adapter 合同套件", "离线 Adapter 合同套件已准备"),
    offlineProviderScenarioLabSummary:readySummary("离线场景实验室", "离线场景实验室已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话运行器", "离线 Mock 会话运行器已准备"),
    mockProviderResultNormalizerSummary:readySummary("Mock 结果归一化器", "Mock 结果归一化器已准备"),
    safetySentinelSummary:{ status:"pass", userFacingSummary:{ title:"Safety Sentinel", resultLabel:"Safety Sentinel 已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.qaSummary.readyForHumanActivationRunbook, true);
  assert.equal(ready.qaCategories.length, 5);

  const needsReview = api.buildGlobalShoppingMockSandboxQaMatrix({
    offlineProviderAdapterContractKitSummary:readySummary("离线 Adapter 合同套件", "离线 Adapter 合同套件已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingMockSandboxQaMatrix({
    offlineProviderAdapterContractKitSummary:readySummary("离线 Adapter 合同套件", "离线 Adapter 合同套件已准备"),
    offlineProviderScenarioLabSummary:readySummary("离线场景实验室", "离线场景实验室已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话运行器", "离线 Mock 会话运行器已准备"),
    mockProviderResultNormalizerSummary:readySummary("Mock 结果归一化器", "Mock 结果归一化器已准备"),
    safetySentinelSummary:{ status:"pass", userFacingSummary:{ title:"Safety Sentinel", resultLabel:"Safety Sentinel 已准备", redacted:true }, redacted:true },
    processRealProviderResponse:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_MOCK_SANDBOX_QA_MATRIX PASS");
}

main();
