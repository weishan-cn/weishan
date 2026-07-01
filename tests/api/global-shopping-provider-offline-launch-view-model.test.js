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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderOfflineLaunchViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderOfflineLaunchViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_VIEW_MODEL_VERSION, "3.3.0");

  const ready = api.buildGlobalShoppingProviderOfflineLaunchViewModel({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter 安全回归守卫已准备"),
    providerOfflineLaunchChecklistSummary:readySummary("Provider Offline Launch Checklist", "离线 Launch Checklist 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider 离线 Launch 决策与安全守卫");
  assert.equal(ready.cards[0].label, "Launch Decision");
  assert.equal(ready.safeToProceedWithManualOfflineLaunchDecisionReview, true);

  const needsReview = api.buildGlobalShoppingProviderOfflineLaunchViewModel({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualOfflineLaunchDecisionReview, false);

  const blocked = api.buildGlobalShoppingProviderOfflineLaunchViewModel({
    offlineLaunchDecisionSimulatorSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"离线发布决策已阻断", redacted:true }, rows:[{ rowId:"r1", label:"Offline Launch Decision Simulator", value:"离线发布决策已阻断", status:"blocked", redacted:true }], redacted:true }
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_VIEW_MODEL PASS");
}

main();
