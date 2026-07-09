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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineSafetyDeltaBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineSafetyDeltaBoard;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_SAFETY_DELTA_BOARD_VERSION, "4.2.7");

  const board = api.buildGlobalShoppingOfflineSafetyDeltaBoard({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "manual_review_required", { blockerMatrixStatus:"manual_review_required" }),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready")
  });
  assert.equal(board.deltaStatus, "manual_review_required");
  assert.equal(board.changedSafetyNotes.includes("安全边界未扩大"), true);
  assert.equal(board.unchangedSafetyBoundaries.includes("provider"), true);
  assert.equal(board.externalUrl, null);

  const needsReview = api.buildGlobalShoppingOfflineSafetyDeltaBoard({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "needs_review", { evidenceReviewStatus:"needs_review" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "manual_review_required", { blockerMatrixStatus:"manual_review_required" }),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready")
  });
  assert.equal(needsReview.deltaStatus, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineSafetyDeltaBoard({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "manual_review_required", { blockerMatrixStatus:"manual_review_required" }),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready"),
    openExternal:true
  });
  assert.equal(blocked.deltaStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("external"), true);
  console.log("GLOBAL_SHOPPING_OFFLINE_SAFETY_DELTA_BOARD PASS");
}

main();
