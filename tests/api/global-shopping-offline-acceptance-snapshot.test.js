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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineAcceptanceSnapshot.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineAcceptanceSnapshot;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_ACCEPTANCE_SNAPSHOT_VERSION, "4.2.1");

  const ready = api.buildGlobalShoppingOfflineAcceptanceSnapshot({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel", "manual_review_required"),
    publicBetaAcceptanceBoardSummary:summary("Public Beta Acceptance Board"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit")
  });
  assert.equal(ready.status, "manual_review_required");
  assert.equal(ready.userFacingSummary.title, "Offline Acceptance Snapshot");
  assert.equal(ready.rows.some((item) => item.label === "Acceptance Snapshot"), true);
  assert.equal(ready.exportUrl, undefined);

  const needsReview = api.buildGlobalShoppingOfflineAcceptanceSnapshot({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    publicBetaAcceptanceBoardSummary:summary("Public Beta Acceptance Board")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineAcceptanceSnapshot({
    publicBetaFreezeEvidenceSummary:summary("Public Beta Freeze Evidence Summary"),
    manualTrialIssueReviewBoardSummary:summary("Manual Trial Issue Review Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel", "manual_review_required"),
    publicBetaAcceptanceBoardSummary:summary("Public Beta Acceptance Board"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_OFFLINE_ACCEPTANCE_SNAPSHOT PASS");
}

main();
