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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderSandboxMilestoneViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderSandboxMilestoneViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_SANDBOX_MILESTONE_VIEW_MODEL_VERSION, "3.1.0");

  const ready = api.buildGlobalShoppingProviderSandboxMilestoneViewModel({
    providerSandboxReadinessWorkbenchSummary:readySummary("Provider Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备"),
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "离线场景实验室已准备"),
    readOnlyProviderAdapterSdkSkeletonSummary:readySummary("Read-Only Provider Adapter SDK Skeleton", "只读 Adapter SDK 骨架已准备"),
    manualActivationCommandCenterSummary:readySummary("Manual Activation Command Center", "人工激活指挥中心已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Sandbox 里程碑工作台");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.caveat.includes("不接真实 provider"), true);
  assert.equal(ready.disclosureRows.some((item) => item.value.includes("不激活 sandbox")), true);

  const needsReview = api.buildGlobalShoppingProviderSandboxMilestoneViewModel({
    providerSandboxReadinessWorkbenchSummary:readySummary("Provider Sandbox Readiness Workbench", "Sandbox Readiness Workbench 已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderSandboxMilestoneViewModel({
    providerSandboxReadinessWorkbenchSummary:{ status:"blocked", userFacingSummary:{ title:"Provider Sandbox Readiness Workbench", resultLabel:"Sandbox Readiness 已阻断", redacted:true }, redacted:true },
    offlineProviderScenarioLabSummary:readySummary("Offline Provider Scenario Lab", "离线场景实验室已准备"),
    readOnlyProviderAdapterSdkSkeletonSummary:readySummary("Read-Only Provider Adapter SDK Skeleton", "只读 Adapter SDK 骨架已准备"),
    manualActivationCommandCenterSummary:readySummary("Manual Activation Command Center", "人工激活指挥中心已准备")
  });
  assert.equal(blocked.status, "blocked");

  const json = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret)":"[^"]+"/i.test(json), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_SANDBOX_MILESTONE_VIEW_MODEL PASS");
}

main();
