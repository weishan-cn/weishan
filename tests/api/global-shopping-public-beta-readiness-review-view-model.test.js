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
    rows:[{ rowId:title, label:title, value:title + " 需人工复核", status:"warning", redacted:true }],
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaReadinessReviewViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaReadinessReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_REVIEW_VIEW_MODEL_VERSION, "4.2.3");

  const ready = api.buildGlobalShoppingPublicBetaReadinessReviewViewModel({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualReadinessReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Manual Review Required"), true);
  assert.equal(ready.rows.some((item) => item.label === "Readiness Snapshot"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaReadinessReviewViewModel({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualReadinessReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaReadinessReviewViewModel({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot", "blocked"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board")
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.externalUrl, null);
  assert.equal(blocked.paymentUrl, null);
  assert.equal(blocked.orderUrl, null);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_REVIEW_VIEW_MODEL PASS");
}

main();
