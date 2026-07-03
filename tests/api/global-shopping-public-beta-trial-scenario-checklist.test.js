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
  return window.WeishanGlobalShoppingPublicBetaTrialScenarioChecklist;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialScenarioChecklist.js");
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_SCENARIO_CHECKLIST_VERSION, "4.0.9");
  const ready = api.buildGlobalShoppingPublicBetaTrialScenarioChecklist({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.0.9");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(Array.isArray(ready.scenarios), true);
  assert.equal(ready.scenarios.length, 4);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.orderUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingPublicBetaTrialScenarioChecklist({
    scenarios:[{ scenarioId:"flightSearchReadonly", expectedCategory:"flight", expectedBlockedCapabilities:["provider"], manualReviewRequired:true }]
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaTrialScenarioChecklist({
    payment:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_SCENARIO_CHECKLIST PASS");
}

main();
