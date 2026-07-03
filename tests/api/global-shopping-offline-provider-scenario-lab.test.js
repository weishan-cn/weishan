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
    userFacingSummary:{ title, resultLabel, redacted:true },
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineProviderScenarioLab.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineProviderScenarioLab;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB_VERSION, "4.1.3");

  const ready = api.buildGlobalShoppingOfflineProviderScenarioLab({
    providerSandboxReadinessWorkbenchSummary:readySummary("Provider Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话运行器", "离线 Mock 会话运行器已准备"),
    mockProviderResultNormalizerSummary:readySummary("Mock Provider 结果归一化器", "Mock 结果归一化已准备"),
    productionBlockerMatrixSummary:readySummary("Production 阻断矩阵", "Production 阻断矩阵已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Offline Provider Scenario Lab");
  assert.equal(ready.userFacingSummary.resultLabel, "离线场景实验室已准备");
  assert.equal(ready.scenarioSummary.readyForAdapterSdkSkeleton, true);

  const needsReview = api.buildGlobalShoppingOfflineProviderScenarioLab({
    providerSandboxReadinessWorkbenchSummary:readySummary("Provider Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineProviderScenarioLab({
    providerSandboxReadinessWorkbenchSummary:readySummary("Provider Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话运行器", "离线 Mock 会话运行器已准备"),
    mockProviderResultNormalizerSummary:readySummary("Mock Provider 结果归一化器", "Mock 结果归一化已准备"),
    productionBlockerMatrixSummary:readySummary("Production 阻断矩阵", "Production 阻断矩阵已准备"),
    persistRawResponse:true
  });
  assert.equal(blocked.status, "blocked");

  const json = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(json), false);
  console.log("GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB PASS");
}

main();
