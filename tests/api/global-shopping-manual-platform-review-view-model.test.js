const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingManualPlatformReviewViewModel.js");
  const api = windowRef.WeishanGlobalShoppingManualPlatformReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_VIEW_MODEL_VERSION, "2.2.7");
  const ready = api.buildGlobalShoppingManualPlatformReviewViewModel({
    manualPlatformReviewCockpitSummary:{ status:"ready", userFacingSummary:{ resultLabel:"手动平台复核驾驶舱已准备", redacted:true }, redacted:true },
    handoffAcceptanceWalkthroughSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接包接受演练已准备", redacted:true }, redacted:true },
    platformRealityCheckBoardSummary:{ status:"ready", userFacingSummary:{ resultLabel:"平台真实页面复核清单已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "手动平台复核与现实检查");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.disclosureRows.some((row) => row.value === "Weishan 不替用户做最终决定"), true);
  assert.equal(api.buildGlobalShoppingManualPlatformReviewViewModel({ windowOpen:true }).status, "blocked");
}

main();
