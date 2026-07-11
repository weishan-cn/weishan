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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRakutenAuditTrace.js");
  const api = windowRef.WeishanGlobalShoppingRakutenAuditTrace;
  const result = api.buildGlobalShoppingRakutenAuditTrace({ operation:"searchProducts", endpointName:"rakuten_ichiba_item_search" });

  assert.equal(result.executionMode, "design_only");
  assert.equal(result.networkExecuted, false);
  assert.equal(result.credentialValuesStored, false);
  console.log("GLOBAL_SHOPPING_RAKUTEN_AUDIT_TRACE PASS");
}

main();
