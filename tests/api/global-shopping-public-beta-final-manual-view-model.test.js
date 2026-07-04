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

function summary(title) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel:title + " 已准备", redacted:true }, rows:[{ rowId:title, label:title, value:title + " 已准备", status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialReadinessPack.js",
    "apps/desktop/src/renderer/core/globalShoppingFinalManualAcceptanceConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFeedbackPlaceholder.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalManualViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaFinalManualViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_MANUAL_VIEW_MODEL_VERSION, "4.2.1");
  const ready = api.buildGlobalShoppingPublicBetaFinalManualViewModel({
    publicBetaTrialReadinessPackSummary:summary("Public Beta Trial Readiness Pack"),
    finalManualAcceptanceConsoleSummary:summary("Final Manual Acceptance Console"),
    publicBetaFeedbackPlaceholderSummary:summary("Feedback Placeholder")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.1");
  assert.equal(ready.safeToProceedWithManualTrialReview, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.checkoutUrl, null);
  assert.equal(ready.checkoutButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingPublicBetaFinalManualViewModel({
    publicBetaTrialReadinessPackSummary:summary("Public Beta Trial Readiness Pack")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaFinalManualViewModel({
    publicBetaTrialReadinessPackSummary:{ status:"blocked", title:"Public Beta Trial Readiness Pack" },
    finalManualAcceptanceConsoleSummary:summary("Final Manual Acceptance Console"),
    publicBetaFeedbackPlaceholderSummary:summary("Feedback Placeholder")
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_MANUAL_VIEW_MODEL PASS");
}

main();
