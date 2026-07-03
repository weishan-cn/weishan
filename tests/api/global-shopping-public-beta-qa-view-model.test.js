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
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaVisualQaConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialScenarioChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingNoTransactionRegressionGuard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaQaViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaQaViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_QA_VIEW_MODEL_VERSION, "4.1.2");
  const ready = api.buildGlobalShoppingPublicBetaQaViewModel({
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.1.2");
  assert.equal(ready.safeToProceedWithManualVisualQaReview, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.orderUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(ready.cards.length >= 6, true);
  assert.equal(api.buildGlobalShoppingPublicBetaQaViewModel({
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaQaViewModel({
    publicBetaVisualQaConsoleSummary:{ status:"blocked", title:"Public Beta Visual QA Console" },
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard")
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_QA_VIEW_MODEL PASS");
}

main();
