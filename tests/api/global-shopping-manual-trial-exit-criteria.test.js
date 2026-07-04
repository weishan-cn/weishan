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
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingManualTrialExitCriteria.js"]);
  const api = windowRef.WeishanGlobalShoppingManualTrialExitCriteria;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_TRIAL_EXIT_CRITERIA_VERSION, "4.1.9");

  const ready = api.buildGlobalShoppingManualTrialExitCriteria({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    publicBetaQaDecisionMatrixSummary:summary("Public Beta QA Decision Matrix"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel")
  });
  assert.equal(ready.exitCriteriaStatus, "manual_review_required");
  assert.deepEqual(Array.from(ready.allowedExitDecisions), ["continue_testing", "manual_review_required"]);
  assert.equal(ready.blockedExitDecisions.includes("enable_provider"), true);
  assert.equal(ready.nextManualAction, "manual_review_required");

  const needsReview = api.buildGlobalShoppingManualTrialExitCriteria({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    publicBetaQaDecisionMatrixSummary:summary("Public Beta QA Decision Matrix", "needs_review"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel")
  });
  assert.equal(needsReview.exitCriteriaStatus, "needs_review");

  const blocked = api.buildGlobalShoppingManualTrialExitCriteria({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    publicBetaQaDecisionMatrixSummary:summary("Public Beta QA Decision Matrix"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel"),
    enableProvider:true
  });
  assert.equal(blocked.exitCriteriaStatus, "blocked");
  console.log("GLOBAL_SHOPPING_MANUAL_TRIAL_EXIT_CRITERIA PASS");
}

main();
