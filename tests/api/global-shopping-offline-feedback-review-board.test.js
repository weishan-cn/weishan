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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineFeedbackReviewBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineFeedbackReviewBoard;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_FEEDBACK_REVIEW_BOARD_VERSION, "4.2.8");

  const ready = api.buildGlobalShoppingOfflineFeedbackReviewBoard({
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    safeFeedbackDraftPanelSummary:summary("Safe Feedback Draft"),
    publicBetaFeedbackPlaceholderSummary:summary("Feedback Placeholder"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.feedbackEnabled, false);
  assert.equal(ready.uploadEnabled, false);
  assert.equal(ready.emailEnabled, false);
  assert.equal(ready.externalFormUrl, null);
  assert.equal(ready.rawUserTextPersistence, false);
  assert.equal(ready.manualReviewRequired, true);

  const blocked = api.buildGlobalShoppingOfflineFeedbackReviewBoard({
    feedbackTaskCreated:true
  });
  assert.equal(blocked.status, "blocked");

  const rawTextBlocked = api.buildGlobalShoppingOfflineFeedbackReviewBoard({
    savedRawUserText:true
  });
  assert.equal(rawTextBlocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_OFFLINE_FEEDBACK_REVIEW_BOARD PASS");
}

main();
