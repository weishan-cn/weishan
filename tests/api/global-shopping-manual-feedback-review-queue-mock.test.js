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
    status:status || "manual_review_required",
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 需人工复核"), redacted:true },
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingManualFeedbackReviewQueueMock.js"]);
  const api = windowRef.WeishanGlobalShoppingManualFeedbackReviewQueueMock;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_FEEDBACK_REVIEW_QUEUE_MOCK_VERSION, "4.2.3");

  const ready = api.buildGlobalShoppingManualFeedbackReviewQueueMock({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock"),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel"),
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze")
  });
  assert.equal(ready.status, "manual_review_required");
  assert.equal(ready.feedbackSubmitEnabled, false);
  assert.equal(ready.uploadEnabled, false);
  assert.equal(ready.issueCreateEnabled, false);
  assert.equal(ready.taskCreateEnabled, false);
  assert.equal(ready.rawUserTextPersistence, false);
  assert.equal(ready.redactionRules.includes("platformToken"), true);

  const needsReview = api.buildGlobalShoppingManualFeedbackReviewQueueMock({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualFeedbackReviewQueueMock({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock"),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel"),
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze"),
    createTask:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.bookingUrl, null);
  assert.equal(blocked.paymentUrl, null);
  assert.equal(blocked.orderUrl, null);
  console.log("GLOBAL_SHOPPING_MANUAL_FEEDBACK_REVIEW_QUEUE_MOCK PASS");
}

main();
