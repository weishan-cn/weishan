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
  return { status:"ready", userFacingSummary:{ title, resultLabel, redacted:true }, redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineProviderAdapterContractKit.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineProviderAdapterContractKit;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_PROVIDER_ADAPTER_CONTRACT_KIT_VERSION, "2.7.0");

  const ready = api.buildGlobalShoppingOfflineProviderAdapterContractKit({
    readOnlyProviderAdapterSdkSkeletonSummary:readySummary("只读 Adapter SDK 骨架", "只读 Adapter SDK 骨架已准备"),
    offlineProviderScenarioLabSummary:readySummary("离线场景实验室", "离线场景实验室已准备"),
    providerSandboxReadinessWorkbenchSummary:readySummary("Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备"),
    manualActivationCommandCenterSummary:readySummary("人工激活指挥中心", "人工激活指挥中心已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.kitSummary.readyForMockSandboxQaMatrix, true);
  assert.equal(ready.contractSections.length, 4);
  assert.equal(ready.interfaceRows.length > 0, true);

  const needsReview = api.buildGlobalShoppingOfflineProviderAdapterContractKit({
    readOnlyProviderAdapterSdkSkeletonSummary:readySummary("只读 Adapter SDK 骨架", "只读 Adapter SDK 骨架已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineProviderAdapterContractKit({
    readOnlyProviderAdapterSdkSkeletonSummary:readySummary("只读 Adapter SDK 骨架", "只读 Adapter SDK 骨架已准备"),
    offlineProviderScenarioLabSummary:readySummary("离线场景实验室", "离线场景实验室已准备"),
    providerSandboxReadinessWorkbenchSummary:readySummary("Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备"),
    manualActivationCommandCenterSummary:readySummary("人工激活指挥中心", "人工激活指挥中心已准备"),
    createTag:true
  });
  assert.equal(blocked.status, "blocked");

  const json = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(json), false);
  console.log("GLOBAL_SHOPPING_OFFLINE_PROVIDER_ADAPTER_CONTRACT_KIT PASS");
}

main();
