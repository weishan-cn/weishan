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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderSandboxReadinessWorkbench.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxReadinessWorkbench;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_WORKBENCH_VERSION, "3.0.0");

  const ready = api.buildGlobalShoppingProviderSandboxReadinessWorkbench({
    offlineSandboxTraceInspectorSummary:readySummary("离线 Sandbox Trace 检查器", "离线 Trace 检查已准备"),
    mockProviderResultNormalizerSummary:readySummary("Mock Provider 结果归一化器", "Mock 结果归一化已准备"),
    manualActivationDryRunChecklistSummary:readySummary("人工激活 Dry-run 检查清单", "激活 Dry-run 检查清单已准备"),
    providerSandboxDryRunViewModelSummary:readySummary("Provider Sandbox 离线 Dry-run", "Provider Sandbox 离线 Dry-run 已准备"),
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心", "Sandbox 激活准备中心已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话运行器", "离线 Mock 会话运行器已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("人工 Provider 激活交接包", "人工 Provider 激活交接包已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider Sandbox Readiness Workbench");
  assert.equal(ready.userFacingSummary.resultLabel, "Sandbox Readiness Workbench 已准备");
  assert.equal(ready.rows.length > 0, true);
  assert.equal(ready.workbenchSummary.readyForOfflineScenarioLab, true);

  const needsReview = api.buildGlobalShoppingProviderSandboxReadinessWorkbench({
    offlineSandboxTraceInspectorSummary:readySummary("离线 Sandbox Trace 检查器", "离线 Trace 检查已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderSandboxReadinessWorkbench({
    offlineSandboxTraceInspectorSummary:readySummary("离线 Sandbox Trace 检查器", "离线 Trace 检查已准备"),
    mockProviderResultNormalizerSummary:readySummary("Mock Provider 结果归一化器", "Mock 结果归一化已准备"),
    manualActivationDryRunChecklistSummary:readySummary("人工激活 Dry-run 检查清单", "激活 Dry-run 检查清单已准备"),
    providerSandboxDryRunViewModelSummary:readySummary("Provider Sandbox 离线 Dry-run", "Provider Sandbox 离线 Dry-run 已准备"),
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心", "Sandbox 激活准备中心已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话运行器", "离线 Mock 会话运行器已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("人工 Provider 激活交接包", "人工 Provider 激活交接包已准备"),
    network:true
  });
  assert.equal(blocked.status, "blocked");

  const json = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(json), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_WORKBENCH PASS");
}

main();
