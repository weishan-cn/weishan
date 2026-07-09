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

function summary(title, status, extra) {
  return Object.assign({
    status:status || "manual_review_required",
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "ready" ? " 已准备" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "ready" ? "pass" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineUserScenarioPack.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineUserScenarioPack;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_USER_SCENARIO_PACK_VERSION, "4.2.7");

  const review = api.buildGlobalShoppingOfflineUserScenarioPack({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist"),
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board")
  });
  assert.equal(review.scenarioPackStatus, "manual_review_required");
  assert.equal(review.scenarioInputPersistence, false);
  assert.equal(review.rawUserTextPersistence, false);
  assert.equal(review.scenarioCategories.includes("feedback_review_mock"), true);
  assert.equal(review.scenarioCategories.includes("no_data_retention"), true);
  assert.equal(review.scenarioCategories.includes("manual_acceptance"), true);
  assert.equal(review.scenarioReviewPersistence, false);
  assert.equal(review.feedbackSubmitEnabled, false);

  const needsReview = api.buildGlobalShoppingOfflineUserScenarioPack({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist", "needs_review")
  });
  assert.equal(needsReview.scenarioPackStatus, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineUserScenarioPack({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist"),
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    persistScenarioInput:true,
    persistScenarioReview:true
  });
  assert.equal(blocked.scenarioPackStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("scenario input persistence"), true);
  assert.equal(blocked.blockedReasons.includes("scenario review persistence"), true);
  console.log("GLOBAL_SHOPPING_OFFLINE_USER_SCENARIO_PACK PASS");
}

main();
