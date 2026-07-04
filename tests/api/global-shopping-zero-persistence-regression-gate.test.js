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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingZeroPersistenceRegressionGate.js"]);
  const api = windowRef.WeishanGlobalShoppingZeroPersistenceRegressionGate;
  assert.equal(api.GLOBAL_SHOPPING_ZERO_PERSISTENCE_REGRESSION_GATE_VERSION, "4.2.6");

  const review = api.buildGlobalShoppingZeroPersistenceRegressionGate({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:summary("Public Beta Offline Acceptance Evidence Center"),
    manualScenarioReviewBoardSummary:summary("Manual Scenario Review Board"),
    noDataRetentionGuardSummary:summary("No-Data-Retention Guard"),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard")
  });
  assert.equal(review.zeroPersistenceStatus, "manual_review_required");
  assert.equal(Object.values(review.zeroPersistenceFlags).every((value) => value === false), true);
  assert.equal(review.blockedPersistenceActions.includes("persist_token"), true);
  assert.equal(review.redactionRules.includes("paymentPayload"), true);
  assert.equal(review.acceptanceRecordPersistence, false);

  const blocked = api.buildGlobalShoppingZeroPersistenceRegressionGate({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:summary("Public Beta Offline Acceptance Evidence Center"),
    manualScenarioReviewBoardSummary:summary("Manual Scenario Review Board"),
    noDataRetentionGuardSummary:summary("No-Data-Retention Guard"),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    persistRawUserText:true
  });
  assert.equal(blocked.zeroPersistenceStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("raw user text persistence"), true);
  console.log("GLOBAL_SHOPPING_ZERO_PERSISTENCE_REGRESSION_GATE PASS");
}

main();
