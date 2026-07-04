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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialOperationsViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaTrialOperationsViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_VIEW_MODEL_VERSION, "4.1.9");

  const ready = api.buildGlobalShoppingPublicBetaTrialOperationsViewModel({
    publicBetaTrialOperationsConsoleSummary:summary("Public Beta Trial Operations Console"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner"),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualTrialOperationsReview, true);
  assert.equal(ready.cards.some((card) => card.label === "Scenario Coverage"), true);
  assert.equal(ready.rows.some((row) => row.label === "Feedback Review"), true);
  assert.equal(ready.externalUrl, null);

  const needsReview = api.buildGlobalShoppingPublicBetaTrialOperationsViewModel({
    publicBetaTrialOperationsConsoleSummary:summary("Public Beta Trial Operations Console"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualTrialOperationsReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaTrialOperationsViewModel({
    publicBetaTrialOperationsConsoleSummary:summary("Public Beta Trial Operations Console", "blocked"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner"),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board")
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.safeToProceedWithManualTrialOperationsReview, false);

  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_VIEW_MODEL PASS");
}

main();
