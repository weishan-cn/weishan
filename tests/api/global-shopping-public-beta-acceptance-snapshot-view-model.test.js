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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaAcceptanceSnapshotViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaAcceptanceSnapshotViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_SNAPSHOT_VIEW_MODEL_VERSION, "4.2.5");

  const ready = api.buildGlobalShoppingPublicBetaAcceptanceSnapshotViewModel({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    offlineAcceptanceSnapshotSummary:summary("Offline Acceptance Snapshot")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualAcceptanceSnapshotReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Acceptance Snapshot"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaAcceptanceSnapshotViewModel({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    offlineAcceptanceSnapshotSummary:summary("Offline Acceptance Snapshot", "needs_review")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualAcceptanceSnapshotReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaAcceptanceSnapshotViewModel({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    offlineAcceptanceSnapshotSummary:summary("Offline Acceptance Snapshot", "blocked")
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_SNAPSHOT_VIEW_MODEL PASS");
}

main();
