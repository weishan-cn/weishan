const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingOfflineTrialReleaseGate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingOfflineTrialReleaseGate;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_TRIAL_RELEASE_GATE_VERSION, "4.1.3");

  const ready = api.buildGlobalShoppingOfflineTrialReleaseGate({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.1.3");
  assert.equal(ready.noReleaseMutation, true);
  assert.equal(ready.noPush, true);
  assert.equal(ready.noProvider, true);
  assert.equal(ready.noNetwork, true);
  assert.equal(ready.noExternalOpen, true);
  assert.equal(ready.noTransaction, true);
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.buyButtonEnabled, false);

  assert.equal(api.buildGlobalShoppingOfflineTrialReleaseGate({ push:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingOfflineTrialReleaseGate({ payment:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingOfflineTrialReleaseGate({ platformUrl:"https://example.invalid" }).status, "blocked");
  console.log("GLOBAL_SHOPPING_OFFLINE_TRIAL_RELEASE_GATE PASS");
}

main();
