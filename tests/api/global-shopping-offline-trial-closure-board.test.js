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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "manual_review_required" ? " 需人工复核" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "manual_review_required" ? " 需人工复核" : " 已准备"), status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineTrialClosureBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineTrialClosureBoard;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_TRIAL_CLOSURE_BOARD_VERSION, "4.2.8");

  const ready = api.buildGlobalShoppingOfflineTrialClosureBoard({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel")
  });
  assert.equal(ready.closureStatus, "manual_review_required");
  assert.equal(ready.nextManualAction, "manual_review_required");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.knownLimitations.includes("试用闭环仅为离线视图，不关闭真实任务"), true);

  const needsReview = api.buildGlobalShoppingOfflineTrialClosureBoard({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board", "needs_review"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel")
  });
  assert.equal(needsReview.closureStatus, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineTrialClosureBoard({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    publicBetaTrialEvidenceLedgerSummary:summary("Public Beta Trial Evidence Ledger"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel"),
    rawUserTextPersistence:true
  });
  assert.equal(blocked.closureStatus, "blocked");
  console.log("GLOBAL_SHOPPING_OFFLINE_TRIAL_CLOSURE_BOARD PASS");
}

main();
