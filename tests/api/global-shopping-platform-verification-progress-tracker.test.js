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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingPlatformVerificationProgressTracker.js");
  const api = windowRef.WeishanGlobalShoppingPlatformVerificationProgressTracker;
  assert.equal(api.GLOBAL_SHOPPING_PLATFORM_VERIFICATION_PROGRESS_TRACKER_VERSION, "4.2.3");
  const ready = api.buildGlobalShoppingPlatformVerificationProgressTracker({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "平台核对进度追踪");
  assert.equal(ready.progressRows.some((row) => row.label === "支付方式"), true);
  assert.equal(ready.userFacingSummary.resultLabel, "平台核对进度已准备");
  assert.equal(ready.userFacingSummary.caveat.includes("不保存勾选"), true);
  assert.equal(api.buildGlobalShoppingPlatformVerificationProgressTracker({ progressStored:true }).status, "blocked");
}

main();
