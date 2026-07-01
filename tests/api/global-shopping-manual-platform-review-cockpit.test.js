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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingManualPlatformReviewCockpit.js");
  const api = windowRef.WeishanGlobalShoppingManualPlatformReviewCockpit;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_COCKPIT_VERSION, "3.8.0");
  const ready = api.buildGlobalShoppingManualPlatformReviewCockpit({
    handoffPacketViewModelSummary:{ status:"ready", title:"只读交接包与安全预检", redacted:true },
    platformHandoffSimulationViewModelSummary:{ status:"ready", title:"只读平台交接模拟", redacted:true },
    readOnlyHandoffPacketPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接包预览已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "手动平台复核驾驶舱");
  assert.equal(ready.userFacingSummary.resultLabel, "手动平台复核驾驶舱已准备");
  assert.equal(ready.reviewRows.length >= 5, true);
  assert.equal(api.buildGlobalShoppingManualPlatformReviewCockpit({ openExternal:true }).status, "blocked");
}

main();
