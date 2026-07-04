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
  return window.WeishanGlobalShoppingCategoryResultSimulator;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingCategoryResultSimulator.js");
  assert.equal(api.GLOBAL_SHOPPING_CATEGORY_RESULT_SIMULATOR_VERSION, "4.2.5");
  const ready = api.buildGlobalShoppingCategoryResultSimulator({
    simulatorMode:"category_result_simulator_only",
    flight:{ categoryLabel:"Flight 候选结果", sourceLabel:"flight mock source" },
    hotel:{ categoryLabel:"Hotel 候选结果", sourceLabel:"hotel mock source" },
    product:{ categoryLabel:"Product 候选结果", sourceLabel:"product mock source" }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.5");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(ready.cards.length, 3);
  assert.equal(api.buildGlobalShoppingCategoryResultSimulator({
    flight:{ categoryLabel:"Flight 候选结果" },
    hotel:{ categoryLabel:"Hotel 候选结果" }
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingCategoryResultSimulator({
    flight:{ categoryLabel:"Flight 候选结果" },
    hotel:{ categoryLabel:"Hotel 候选结果" },
    product:{ categoryLabel:"Product 候选结果" },
    externalUrl:"https://blocked.example"
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_CATEGORY_RESULT_SIMULATOR PASS");
}

main();
