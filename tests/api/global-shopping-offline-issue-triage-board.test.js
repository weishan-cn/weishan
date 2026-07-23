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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineIssueTriageBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineIssueTriageBoard;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION, "4.2.8");

  const ready = api.buildGlobalShoppingOfflineIssueTriageBoard({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    offlineRegressionEvidenceBoardSummary:summary("Offline Regression Evidence Board"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready"),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary")
  });
  assert.equal(ready.status, "manual_review_required");
  assert.equal(ready.rows.some((item) => item.label === "Offline Issue Triage Board"), true);
  assert.equal(ready.rules.some((item) => item.label.includes("severityBuckets")), true);
  assert.deepEqual(Array.from(ready.severityBuckets), ["critical", "high", "medium", "low", "info", "blocked"]);
  assert.equal(ready.issueCreateEnabled, false);
  assert.equal(ready.taskCreateEnabled, false);
  assert.equal(ready.uploadEnabled, false);
  assert.equal(ready.feedbackSubmitEnabled, false);

  const needsReview = api.buildGlobalShoppingOfflineIssueTriageBoard({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineIssueTriageBoard({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    offlineRegressionEvidenceBoardSummary:summary("Offline Regression Evidence Board"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready"),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary"),
    createIssue:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.bookingUrl, null);
  assert.equal(blocked.paymentUrl, null);
  assert.equal(blocked.orderUrl, null);
  console.log("GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD PASS");
}

main();
