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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingUserActionBoundaryReceipt.js");
  const api = windowRef.WeishanGlobalShoppingUserActionBoundaryReceipt;
  assert.equal(api.GLOBAL_SHOPPING_USER_ACTION_BOUNDARY_RECEIPT_VERSION, "4.0.1");
  const ready = api.buildGlobalShoppingUserActionBoundaryReceipt({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "用户行动边界回执");
  assert.equal(ready.receiptSections.length, 4);
  assert.equal(api.buildGlobalShoppingUserActionBoundaryReceipt({ createOrder:true }).status, "blocked");
}

main();
