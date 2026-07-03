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
  return window.WeishanGlobalShoppingPublicBetaFeedbackPlaceholder;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingPublicBetaFeedbackPlaceholder.js");
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FEEDBACK_PLACEHOLDER_VERSION, "4.1.1");
  const ready = api.buildGlobalShoppingPublicBetaFeedbackPlaceholder({
    placeholderMode:"feedback_placeholder_only"
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.feedbackEnabled, false);
  assert.equal(ready.uploadEnabled, false);
  assert.equal(ready.emailEnabled, false);
  assert.equal(ready.externalFormUrl, null);
  assert.equal(ready.rawUserTextPersistence, false);
  assert.equal(api.buildGlobalShoppingPublicBetaFeedbackPlaceholder({
    feedbackEnabled:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FEEDBACK_PLACEHOLDER PASS");
}

main();
