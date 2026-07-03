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
    "apps/desktop/src/renderer/core/globalShoppingNoTransactionRegressionGuard.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingNoTransactionRegressionGuard;
  assert.equal(api.GLOBAL_SHOPPING_NO_TRANSACTION_REGRESSION_GUARD_VERSION, "4.1.1");
  const ready = api.buildGlobalShoppingNoTransactionRegressionGuard({
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    publicBetaFeedbackPlaceholderSummary:summary("Feedback Placeholder"),
    finalOfflineBetaAuditSummary:summary("Final Offline Beta Audit"),
    publicBetaAcceptanceBoardSummary:summary("Public Beta Acceptance Board"),
    buyButtonEnabled:false,
    checkoutButtonEnabled:false,
    paymentButtonEnabled:false,
    bookingUrl:null,
    checkoutUrl:null,
    paymentUrl:null,
    orderUrl:null,
    externalUrl:null,
    platformUrl:null,
    providerUrl:null
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.1.1");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.paymentButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingNoTransactionRegressionGuard({
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingNoTransactionRegressionGuard({
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    publicBetaFeedbackPlaceholderSummary:summary("Feedback Placeholder"),
    finalOfflineBetaAuditSummary:summary("Final Offline Beta Audit"),
    publicBetaAcceptanceBoardSummary:summary("Public Beta Acceptance Board"),
    bookingUrl:"https://blocked.example"
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_NO_TRANSACTION_REGRESSION_GUARD PASS");
}

main();
