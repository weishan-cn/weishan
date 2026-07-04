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
    status:status || "ready",
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : " 已准备"), status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingManualTrialIssueReviewBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingManualTrialIssueReviewBoard;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_TRIAL_ISSUE_REVIEW_BOARD_VERSION, "4.1.9");

  const ready = api.buildGlobalShoppingManualTrialIssueReviewBoard({
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Manual Trial Issue Review Board");
  assert.equal(ready.rows.some((item) => item.label === "Issue Review"), true);
  assert.equal(ready.externalUrl, null);

  const needsReview = api.buildGlobalShoppingManualTrialIssueReviewBoard({
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualTrialIssueReviewBoard({
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    writeFile:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_MANUAL_TRIAL_ISSUE_REVIEW_BOARD PASS");
}

main();
