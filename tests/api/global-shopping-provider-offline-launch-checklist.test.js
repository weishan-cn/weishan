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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderOfflineLaunchChecklist.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderOfflineLaunchChecklist;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_CHECKLIST_VERSION, "3.0.0");

  const ready = api.buildGlobalShoppingProviderOfflineLaunchChecklist({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter 安全回归守卫已准备"),
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.checklistBoundary.canPersistChecklistResult, false);
  assert.equal(ready.checklistSummary.manualLaunchReviewRequired, true);

  const needsReview = api.buildGlobalShoppingProviderOfflineLaunchChecklist({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderOfflineLaunchChecklist({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    adapterSecurityRegressionGuardSummary:readySummary("Adapter Security Regression Guard", "Adapter 安全回归守卫已准备"),
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_OFFLINE_LAUNCH_CHECKLIST PASS");
}

main();
