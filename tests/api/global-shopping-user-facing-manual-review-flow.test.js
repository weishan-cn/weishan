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

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformReviewCockpit.js",
    "apps/desktop/src/renderer/core/globalShoppingHandoffAcceptanceWalkthrough.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformRealityCheckBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingHandoffPacketViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformPreflightSafetyGate.js",
    "apps/desktop/src/renderer/core/globalShoppingUserActionBoundaryReceipt.js",
    "apps/desktop/src/renderer/core/globalShoppingUserFacingManualReviewFlow.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingUserFacingManualReviewFlow;
  assert.equal(api.GLOBAL_SHOPPING_USER_FACING_MANUAL_REVIEW_FLOW_VERSION, "4.2.2");
  const ready = api.buildGlobalShoppingUserFacingManualReviewFlow({
    manualPlatformReviewCockpitSummary:{ status:"ready", userFacingSummary:{ resultLabel:"手动平台复核驾驶舱已准备", redacted:true }, redacted:true },
    handoffAcceptanceWalkthroughSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接包接受演练已准备", redacted:true }, redacted:true },
    platformRealityCheckBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台真实页面复核清单已准备", redacted:true }, redacted:true },
    handoffPacketViewModelSummary:{ status:"ready", userFacingSummary:{ resultLabel:"只读交接包与安全预检已准备", redacted:true }, redacted:true },
    platformPreflightSafetyGateSummary:{ status:"clear", userFacingSummary:{ resultLabel:"平台预检通过", redacted:true }, redacted:true },
    userActionBoundaryReceiptSummary:{ status:"ready", userFacingSummary:{ resultLabel:"用户边界说明已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "用户手动复核流程");
  assert.equal(ready.flowSteps.length >= 6, true);
  assert.equal(ready.userFacingSummary.resultLabel, "用户手动复核流程已准备");
  assert.equal(ready.userFacingSummary.caveat.includes("不打开平台"), true);
  assert.equal(api.buildGlobalShoppingUserFacingManualReviewFlow({ openExternal:true }).status, "blocked");
}

main();
