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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingUserTrustClosureSummary.js");
  const api = windowRef.WeishanGlobalShoppingUserTrustClosureSummary;
  assert.equal(api.GLOBAL_SHOPPING_USER_TRUST_CLOSURE_SUMMARY_VERSION, "4.0.6");
  const ready = api.buildGlobalShoppingUserTrustClosureSummary({});
  assert.equal(ready.appVersion, "4.0.6");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "用户信任闭环摘要");
  assert.equal(ready.trustStatements.some((item) => item.label === "平台页面为最终依据"), true);
  assert.equal(api.buildGlobalShoppingUserTrustClosureSummary({ bindUser:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_USER_TRUST_CLOSURE_SUMMARY PASS");
}

main();
