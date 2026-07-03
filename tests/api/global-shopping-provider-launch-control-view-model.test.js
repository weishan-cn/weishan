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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderLaunchControlViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderLaunchControlViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_LAUNCH_CONTROL_VIEW_MODEL_VERSION, "4.1.6");

  const ready = api.buildGlobalShoppingProviderLaunchControlViewModel({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备"),
    adapterPolicyEngineSummary:readySummary("Adapter Policy Engine", "Adapter 策略引擎已准备"),
    humanReleaseEvidenceTimelineSummary:readySummary("Human Release Evidence Timeline", "人工发布证据时间线已准备"),
    sandboxActivationFinalReviewBoardSummary:readySummary("Sandbox Activation Final Review Board", "Sandbox 激活终审板已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Launch Control Tower");
  assert.equal(ready.cards[0].label, "Launch Control");
  assert.equal(ready.safeToProceedWithHumanLaunchControlReview, true);

  const needsReview = api.buildGlobalShoppingProviderLaunchControlViewModel({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithHumanLaunchControlReview, false);

  const blocked = api.buildGlobalShoppingProviderLaunchControlViewModel({
    offlineProviderLaunchControlTowerSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"离线 Launch 控制已阻断", redacted:true }, rows:[{ rowId:"r1", label:"Offline Provider Launch Control Tower", value:"离线 Launch 控制已阻断", status:"blocked", redacted:true }], redacted:true }
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_LAUNCH_CONTROL_VIEW_MODEL PASS");
}

main();
