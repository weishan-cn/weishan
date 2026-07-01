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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingManualActivationCommandCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingManualActivationCommandCenter;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_ACTIVATION_COMMAND_CENTER_VERSION, "3.1.0");

  const ready = api.buildGlobalShoppingManualActivationCommandCenter({
    providerSandboxReadinessWorkbenchSummary:readySummary("Provider Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备"),
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "离线场景实验室已准备"),
    readOnlyProviderAdapterSdkSkeletonSummary:readySummary("Read-Only Provider Adapter SDK Skeleton", "只读 Adapter SDK 骨架已准备"),
    manualActivationDryRunChecklistSummary:readySummary("人工激活 Dry-run 检查清单", "激活 Dry-run 检查清单已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("人工 Provider 激活交接包", "人工 Provider 激活交接包已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "Release Freeze Gate 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Manual Activation Command Center");
  assert.equal(ready.userFacingSummary.resultLabel, "人工激活指挥中心已准备");
  assert.equal(ready.commandSummary.readyForHumanSandboxActivationDecision, true);

  const needsReview = api.buildGlobalShoppingManualActivationCommandCenter({
    providerSandboxReadinessWorkbenchSummary:readySummary("Provider Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualActivationCommandCenter({
    providerSandboxReadinessWorkbenchSummary:readySummary("Provider Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备"),
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "离线场景实验室已准备"),
    readOnlyProviderAdapterSdkSkeletonSummary:readySummary("Read-Only Provider Adapter SDK Skeleton", "只读 Adapter SDK 骨架已准备"),
    manualActivationDryRunChecklistSummary:readySummary("人工激活 Dry-run 检查清单", "激活 Dry-run 检查清单已准备"),
    manualProviderActivationHandoffPacketSummary:readySummary("人工 Provider 激活交接包", "人工 Provider 激活交接包已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "Release Freeze Gate 已准备"),
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");

  const json = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(json), false);
  console.log("GLOBAL_SHOPPING_MANUAL_ACTIVATION_COMMAND_CENTER PASS");
}

main();
