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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalAcceptanceLock.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaFinalAcceptanceLock;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_LOCK_VERSION, "4.2.6");

  const review = api.buildGlobalShoppingPublicBetaFinalAcceptanceLock({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:summary("Public Beta Offline Acceptance Evidence Center"),
    manualScenarioReviewBoardSummary:summary("Manual Scenario Review Board"),
    zeroPersistenceRegressionGateSummary:summary("Zero-Persistence Regression Gate"),
    publicBetaOfflineAcceptanceViewModelSummary:summary("Public Beta Offline Acceptance ViewModel", "manual_review_required")
  });
  assert.equal(review.finalAcceptanceLockStatus, "manual_review_required");
  assert.equal(review.lockedAcceptanceScope.includes("rc_audit"), true);
  assert.equal(review.blockedActions.includes("persist_rc_audit"), true);
  assert.equal(review.acceptanceRecordPersistence, false);
  assert.equal(review.externalUrl, null);

  const needsReview = api.buildGlobalShoppingPublicBetaFinalAcceptanceLock({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:summary("Public Beta Offline Acceptance Evidence Center", "needs_review")
  });
  assert.equal(needsReview.finalAcceptanceLockStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaFinalAcceptanceLock({
    publicBetaOfflineAcceptanceEvidenceCenterSummary:summary("Public Beta Offline Acceptance Evidence Center"),
    manualScenarioReviewBoardSummary:summary("Manual Scenario Review Board"),
    zeroPersistenceRegressionGateSummary:summary("Zero-Persistence Regression Gate"),
    publicBetaOfflineAcceptanceViewModelSummary:summary("Public Beta Offline Acceptance ViewModel", "manual_review_required"),
    persistRcAudit:true
  });
  assert.equal(blocked.finalAcceptanceLockStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("release candidate audit persistence"), true);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_ACCEPTANCE_LOCK PASS");
}

main();
