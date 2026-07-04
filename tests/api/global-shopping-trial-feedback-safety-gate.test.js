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

function summary(title, status) {
  return {
    status:status || "ready",
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : " 已准备"), status:status === "blocked" ? "blocked" : "pass", redacted:true }],
    redacted:true
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingSafeFeedbackDraftPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFeedbackPlaceholder.js",
    "apps/desktop/src/renderer/core/globalShoppingNoTransactionRegressionGuard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaManualQaReportCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingTrialFeedbackSafetyGate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingTrialFeedbackSafetyGate;
  assert.equal(api.GLOBAL_SHOPPING_TRIAL_FEEDBACK_SAFETY_GATE_VERSION, "4.2.5");

  const ready = api.buildGlobalShoppingTrialFeedbackSafetyGate({
    safeFeedbackDraftPanelSummary:summary("Safe Feedback Draft"),
    publicBetaFeedbackPlaceholderSummary:summary("Feedback Placeholder"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.feedbackEnabled, false);
  assert.equal(ready.uploadEnabled, false);
  assert.equal(ready.emailEnabled, false);
  assert.equal(ready.externalFormUrl, null);
  assert.equal(ready.rawUserTextPersistence, false);

  const blocked = api.buildGlobalShoppingTrialFeedbackSafetyGate({
    safeFeedbackDraftPanelSummary:summary("Safe Feedback Draft"),
    publicBetaFeedbackPlaceholderSummary:summary("Feedback Placeholder"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    feedbackEnabled:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(JSON.stringify(ready).includes("token"), false);
  console.log("GLOBAL_SHOPPING_TRIAL_FEEDBACK_SAFETY_GATE PASS");
}

main();
