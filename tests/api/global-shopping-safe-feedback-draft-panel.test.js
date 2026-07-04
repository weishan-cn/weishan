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
    "apps/desktop/src/renderer/core/globalShoppingSafeFeedbackDraftPanel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSafeFeedbackDraftPanel;
  assert.equal(api.GLOBAL_SHOPPING_SAFE_FEEDBACK_DRAFT_PANEL_VERSION, "4.2.6");
  const ready = api.buildGlobalShoppingSafeFeedbackDraftPanel({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.6");
  assert.equal(ready.feedbackEnabled, false);
  assert.equal(ready.uploadEnabled, false);
  assert.equal(ready.emailEnabled, false);
  assert.equal(ready.externalFormUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.match(ready.userFacingSummary.caveat, /不创建 release、不 push/);
  assert.equal(api.buildGlobalShoppingSafeFeedbackDraftPanel({
    feedbackSent:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_SAFE_FEEDBACK_DRAFT_PANEL PASS");
}

main();
