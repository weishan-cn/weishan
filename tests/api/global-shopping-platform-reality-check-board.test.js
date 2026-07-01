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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingPlatformRealityCheckBoard.js");
  const api = windowRef.WeishanGlobalShoppingPlatformRealityCheckBoard;
  assert.equal(api.GLOBAL_SHOPPING_PLATFORM_REALITY_CHECK_BOARD_VERSION, "3.5.0");
  const ready = api.buildGlobalShoppingPlatformRealityCheckBoard({
    platformPreflightSafetyGateSummary:{ status:"clear", userFacingSummary:{ resultLabel:"安全预检未触发阻断", redacted:true }, redacted:true },
    userActionBoundaryReceiptSummary:{ status:"ready", userFacingSummary:{ resultLabel:"边界回执已准备", redacted:true }, redacted:true },
    readOnlyPlatformHandoffSimulatorSummary:{ status:"ready", userFacingSummary:{ resultLabel:"只读平台交接模拟已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "平台真实页面复核清单");
  assert.equal(ready.userFacingSummary.resultLabel, "平台真实页面复核清单已准备");
  assert.equal(ready.checklistItems.some((item) => item.summary === "平台页面才是最终依据"), true);
  assert.equal(api.buildGlobalShoppingPlatformRealityCheckBoard({ bookingUrl:"https://blocked.example" }).status, "blocked");
}

main();
