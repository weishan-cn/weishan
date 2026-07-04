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
    "apps/desktop/src/renderer/core/globalShoppingVisualTrialGuide.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingVisualTrialGuide;
  assert.equal(api.GLOBAL_SHOPPING_VISUAL_TRIAL_GUIDE_VERSION, "4.2.2");
  const ready = api.buildGlobalShoppingVisualTrialGuide({
    restrictedCategoryBlock:true,
    noTransactionButtons:false
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.2");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.orderUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.match(ready.userFacingSummary.caveat, /不创建 release、不 push/);
  assert.equal(api.buildGlobalShoppingVisualTrialGuide({
    restrictedCategoryBlock:false
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingVisualTrialGuide({
    restrictedCategoryBlock:true,
    openExternal:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_VISUAL_TRIAL_GUIDE PASS");
}

main();
