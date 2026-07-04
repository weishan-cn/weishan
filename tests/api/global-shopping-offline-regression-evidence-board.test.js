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
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "ready" ? " 已准备" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "ready" ? "pass" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineRegressionEvidenceBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineRegressionEvidenceBoard;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_REGRESSION_EVIDENCE_BOARD_VERSION, "4.2.6");

  const board = api.buildGlobalShoppingOfflineRegressionEvidenceBoard({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "manual_review_required", { qaFreezeStatus:"manual_review_required" }),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock", "manual_review_required", { intakeStatus:"manual_review_required" }),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board", "manual_review_required", { deltaStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    noTransactionRegressionGuardSummary:summary("No Transaction Regression Guard", "ready")
  });
  assert.equal(board.regressionEvidenceStatus, "manual_review_required");
  assert.equal(board.manualReviewRequired, true);
  assert.equal(board.userFacingSummary.caveat, "回归证据仅为只读展示，不生成文件");
  assert.equal(board.unchangedSafetyBoundaries.includes("provider"), true);
  assert.equal(board.feedbackSubmitEnabled, false);
  assert.equal(board.uploadEnabled, false);
  assert.equal(board.externalUrl, null);

  const needsReview = api.buildGlobalShoppingOfflineRegressionEvidenceBoard({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "needs_review", { qaFreezeStatus:"needs_review" }),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock", "manual_review_required", { intakeStatus:"manual_review_required" }),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board", "manual_review_required", { deltaStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    noTransactionRegressionGuardSummary:summary("No Transaction Regression Guard", "ready")
  });
  assert.equal(needsReview.regressionEvidenceStatus, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineRegressionEvidenceBoard({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "manual_review_required", { qaFreezeStatus:"manual_review_required" }),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock", "manual_review_required", { intakeStatus:"manual_review_required" }),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board", "manual_review_required", { deltaStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    noTransactionRegressionGuardSummary:summary("No Transaction Regression Guard", "ready"),
    openExternal:true
  });
  assert.equal(blocked.regressionEvidenceStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("external"), true);

  const malformed = api.buildGlobalShoppingOfflineRegressionEvidenceBoard(undefined);
  assert.equal(typeof malformed, "object");
  assert.equal(malformed.redacted, true);
  assert.equal(malformed.checkoutUrl, null);
  assert.equal(malformed.issueCreateEnabled, false);
  console.log("GLOBAL_SHOPPING_OFFLINE_REGRESSION_EVIDENCE_BOARD PASS");
}

main();
