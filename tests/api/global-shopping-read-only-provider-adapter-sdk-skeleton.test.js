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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderAdapterSdkSkeleton.js"]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_PROVIDER_ADAPTER_SDK_SKELETON_VERSION, "3.0.0");

  const ready = api.buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton({
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "离线场景实验室已准备"),
    providerContractReplayHarnessSummary:readySummary("Provider 合同回放器", "Provider 合同回放器已准备"),
    vaultBoundaryContractSummary:readySummary("Vault 边界合同", "Vault 边界合同已准备"),
    sandboxAdapterContractTestbedSummary:readySummary("Sandbox Adapter 合同测试台", "Adapter 合同测试台已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Read-Only Provider Adapter SDK Skeleton");
  assert.equal(ready.userFacingSummary.resultLabel, "只读 Adapter SDK 骨架已准备");
  assert.equal(ready.sdkSummary.readyForManualActivationCommandCenter, true);

  const needsReview = api.buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton({
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "离线场景实验室已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton({
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "离线场景实验室已准备"),
    providerContractReplayHarnessSummary:readySummary("Provider 合同回放器", "Provider 合同回放器已准备"),
    vaultBoundaryContractSummary:readySummary("Vault 边界合同", "Vault 边界合同已准备"),
    sandboxAdapterContractTestbedSummary:readySummary("Sandbox Adapter 合同测试台", "Adapter 合同测试台已准备"),
    importRealProviderSdk:true
  });
  assert.equal(blocked.status, "blocked");

  const json = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(json), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_PROVIDER_ADAPTER_SDK_SKELETON PASS");
}

main();
