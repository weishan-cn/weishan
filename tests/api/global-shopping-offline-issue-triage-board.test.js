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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineIssueTriageBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineIssueTriageBoard;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD_VERSION, "4.1.7");

  const ready = api.buildGlobalShoppingOfflineIssueTriageBoard({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.rows.some((item) => item.label === "Manual Review Items"), true);
  assert.equal(ready.sections.some((item) => item.label === "Locked Capabilities"), true);

  const needsReview = api.buildGlobalShoppingOfflineIssueTriageBoard({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineIssueTriageBoard({
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    publicBetaQaDecisionMatrixSummary:summary("QA Decision Matrix"),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    trialFeedbackSafetyGateSummary:summary("Trial Feedback Safety Gate"),
    issueCreated:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_OFFLINE_ISSUE_TRIAGE_BOARD PASS");
}

main();
