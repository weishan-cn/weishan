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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingManualQaScenarioRunner.js"]);
  const api = windowRef.WeishanGlobalShoppingManualQaScenarioRunner;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_QA_SCENARIO_RUNNER_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingManualQaScenarioRunner({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.scenarios.length, 7);
  assert.equal(ready.scenarioCoverage.length, 7);
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.buyButtonEnabled, false);

  const needsReview = api.buildGlobalShoppingManualQaScenarioRunner({
    scenarios:ready.scenarios.filter((scenario) => scenario.scenarioId !== "no_provider_boundary")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualQaScenarioRunner({
    scenarios:ready.scenarios,
    screenshotUpload:true
  });
  assert.equal(blocked.status, "blocked");

  const feedbackBlocked = api.buildGlobalShoppingManualQaScenarioRunner({
    scenarios:ready.scenarios,
    feedbackSent:true
  });
  assert.equal(feedbackBlocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_MANUAL_QA_SCENARIO_RUNNER PASS");
}

main();
