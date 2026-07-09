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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : " 已准备"), status:status === "blocked" ? "blocked" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingManualTrialSummaryBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingManualTrialSummaryBoard;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_TRIAL_SUMMARY_BOARD_VERSION, "4.2.7");

  const ready = api.buildGlobalShoppingManualTrialSummaryBoard({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner", "ready", { scenarioCoverage:["flight_readonly_search", "hotel_readonly_search", "product_readonly_search", "restricted_category_block", "feedback_draft_disabled", "no_transaction_boundary", "no_provider_boundary"] }),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.unresolvedItems.length, 0);
  assert.equal(ready.nextManualAction, "manual_review_required");

  const needsReview = api.buildGlobalShoppingManualTrialSummaryBoard({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner", "ready", { scenarioCoverage:["flight_readonly_search"] }),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualTrialSummaryBoard({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    manualQaScenarioRunnerSummary:summary("Manual QA Scenario Runner", "ready", { scenarioCoverage:["flight_readonly_search", "hotel_readonly_search", "product_readonly_search", "restricted_category_block", "feedback_draft_disabled", "no_transaction_boundary", "no_provider_boundary"] }),
    offlineFeedbackReviewBoardSummary:summary("Offline Feedback Review Board"),
    publicBetaManualQaReportCenterSummary:summary("Public Beta Manual QA Report Center"),
    export:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_MANUAL_TRIAL_SUMMARY_BOARD PASS");
}

main();
