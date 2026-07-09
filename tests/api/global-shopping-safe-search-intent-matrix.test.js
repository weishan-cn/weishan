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
  return window.WeishanGlobalShoppingSafeSearchIntentMatrix;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingSafeSearchIntentMatrix.js");
  assert.equal(api.GLOBAL_SHOPPING_SAFE_SEARCH_INTENT_MATRIX_VERSION, "4.2.7");
  const ready = api.buildGlobalShoppingSafeSearchIntentMatrix({ appVersion:"4.2.7", matrixMode:"safe_intent_matrix_only", category:"flight" });
  assert.equal(ready.status, "ready");
  assert.equal(ready.searchIntentAllowed, true);
  assert.equal(ready.providerZeroLocked, true);
  assert.equal(api.buildGlobalShoppingSafeSearchIntentMatrix({ appVersion:"4.2.7", matrixMode:"safe_intent_matrix_only", category:"restricted" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSafeSearchIntentMatrix({ appVersion:"4.2.7", matrixMode:"safe_intent_matrix_only", category:"unsupported" }).status, "needs_review");
  console.log("GLOBAL_SHOPPING_SAFE_SEARCH_INTENT_MATRIX PASS");
}

main();
