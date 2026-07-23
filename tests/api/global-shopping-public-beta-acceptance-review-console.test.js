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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaAcceptanceReviewConsole.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaAcceptanceReviewConsole;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_CONSOLE_VERSION, "4.2.8");

  const ready = api.buildGlobalShoppingPublicBetaAcceptanceReviewConsole({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    offlineAcceptanceSnapshotSummary:summary("Offline Acceptance Snapshot", "manual_review_required"),
    publicBetaAcceptanceSnapshotViewModelSummary:summary("Public Beta Acceptance Snapshot View Model"),
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate")
  });
  assert.equal(ready.acceptanceReviewStatus, "manual_review_required");
  assert.deepEqual(Array.from(ready.allowedNextActions), ["continue_testing", "manual_review_required"]);
  assert.equal(ready.blockedNextActions.includes("production_ready"), true);
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.buyButtonEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaAcceptanceReviewConsole({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    publicBetaAcceptanceSnapshotViewModelSummary:summary("Public Beta Acceptance Snapshot View Model"),
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate")
  });
  assert.equal(needsReview.acceptanceReviewStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaAcceptanceReviewConsole({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    offlineAcceptanceSnapshotSummary:summary("Offline Acceptance Snapshot", "manual_review_required"),
    publicBetaAcceptanceSnapshotViewModelSummary:summary("Public Beta Acceptance Snapshot View Model"),
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    createRelease:true
  });
  assert.equal(blocked.acceptanceReviewStatus, "blocked");
  assert.equal(blocked.allowedNextActions[0], "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_CONSOLE PASS");
}

main();
