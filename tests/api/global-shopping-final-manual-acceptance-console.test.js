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
  return window.WeishanGlobalShoppingFinalManualAcceptanceConsole;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingFinalManualAcceptanceConsole.js");
  assert.equal(api.GLOBAL_SHOPPING_FINAL_MANUAL_ACCEPTANCE_CONSOLE_VERSION, "4.2.5");
  const ready = api.buildGlobalShoppingFinalManualAcceptanceConsole({
    consoleMode:"final_manual_acceptance_only",
    providerZeroLocked:true,
    readOnly:true,
    manualReviewRequired:true,
    nextStageDecision:"manual_review_required"
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.5");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.nextStageDecision, "manual_review_required");
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.orderUrl, null);
  assert.equal(ready.paymentButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingFinalManualAcceptanceConsole({
    providerZeroLocked:false,
    readOnly:true,
    manualReviewRequired:true
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalManualAcceptanceConsole({
    providerZeroLocked:true,
    readOnly:true,
    manualReviewRequired:true,
    nextStageDecision:"auto_release"
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_FINAL_MANUAL_ACCEPTANCE_CONSOLE PASS");
}

main();
