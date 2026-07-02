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

function buildReadySummary(status, title, resultLabel) {
  return {
    status,
    userFacingSummary:{ title, resultLabel, redacted:true },
    redacted:true
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingOfflineSandboxTraceInspector.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderResultNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingManualActivationDryRunChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxDryRunViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION, "4.0.1");

  const ready = api.buildGlobalShoppingProviderSandboxDryRunViewModel({
    offlineSandboxTraceInspectorSummary:buildReadySummary("ready", "离线 Sandbox Trace 检查器", "离线 Trace 检查已准备"),
    mockProviderResultNormalizerSummary:buildReadySummary("ready", "Mock Provider 结果归一化器", "Mock 结果归一化已准备"),
    manualActivationDryRunChecklistSummary:buildReadySummary("ready", "人工激活 Dry-run 检查清单", "激活 Dry-run 检查清单已准备")
  });
  assert.equal(ready.appVersion, "4.0.1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Sandbox 离线 Dry-run");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.offlineTraceRows.length > 0, true);
  assert.equal(ready.mockResultRows.length > 0, true);
  assert.equal(ready.activationDryRunRows.length > 0, true);
  assert.equal(ready.disclosureRows.length, 4);
  assert.match(ready.caveat, /离线 dry-run/);

  const needsReview = api.buildGlobalShoppingProviderSandboxDryRunViewModel({
    offlineSandboxTraceInspectorSummary:buildReadySummary("ready", "离线 Sandbox Trace 检查器", "离线 Trace 检查已准备"),
    mockProviderResultNormalizerSummary:buildReadySummary("ready", "Mock Provider 结果归一化器", "Mock 结果归一化已准备")
  });
  assert.equal(needsReview.status, "ready");

  const blocked = api.buildGlobalShoppingProviderSandboxDryRunViewModel({
    offlineSandboxTraceInspectorSummary:buildReadySummary("ready", "离线 Sandbox Trace 检查器", "离线 Trace 检查已准备"),
    mockProviderResultNormalizerSummary:buildReadySummary("ready", "Mock Provider 结果归一化器", "Mock 结果归一化已准备"),
    manualActivationDryRunChecklistSummary:buildReadySummary("ready", "人工激活 Dry-run 检查清单", "激活 Dry-run 检查清单已准备"),
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL PASS");
}

main();
