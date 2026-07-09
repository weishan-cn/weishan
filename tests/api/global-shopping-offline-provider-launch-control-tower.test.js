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
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineProviderLaunchControlTower.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineProviderLaunchControlTower;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_PROVIDER_LAUNCH_CONTROL_TOWER_VERSION, "4.2.7");

  const ready = api.buildGlobalShoppingOfflineProviderLaunchControlTower({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter 安全回归守卫已准备"),
    providerOfflineLaunchChecklistSummary:readySummary("Provider Offline Launch Checklist", "离线 Launch Checklist 已准备"),
    providerOfflineLaunchViewModelSummary:{ status:"ready", title:"Provider 离线 Launch 决策与安全守卫", userFacingSummary:{ title:"Provider 离线 Launch 决策与安全守卫", resultLabel:"离线 Launch 视图已准备", redacted:true }, rows:[{ rowId:"view", label:"Launch View", value:"离线 Launch 视图已准备", status:"pass", redacted:true }], redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.7");
  assert.equal(ready.controlBoundary.canCreateRelease, false);
  assert.equal(ready.controlSummary.humanLaunchControlReviewRequired, true);
  assert.equal(JSON.stringify(ready).includes("token"), false);

  const needsReview = api.buildGlobalShoppingOfflineProviderLaunchControlTower({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineProviderLaunchControlTower({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter 安全回归守卫已准备"),
    providerOfflineLaunchChecklistSummary:readySummary("Provider Offline Launch Checklist", "离线 Launch Checklist 已准备"),
    providerOfflineLaunchViewModelSummary:{ status:"ready", title:"Provider 离线 Launch 决策与安全守卫", userFacingSummary:{ resultLabel:"离线 Launch 视图已准备", redacted:true }, rows:[{ rowId:"view", label:"Launch View", value:"离线 Launch 视图已准备", status:"pass", redacted:true }], redacted:true },
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_OFFLINE_PROVIDER_LAUNCH_CONTROL_TOWER PASS");
}

main();
