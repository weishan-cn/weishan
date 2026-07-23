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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "ready" ? " 已准备" : " 需人工复核"), redacted:true },
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "ready" ? "pass" : "warning", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaManualAcceptanceChecklist.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_ACCEPTANCE_CHECKLIST_VERSION, "4.2.8");

  const review = api.buildGlobalShoppingPublicBetaManualAcceptanceChecklist({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    publicBetaReadinessReviewViewModelSummary:summary("Public Beta Readiness Review ViewModel", "ready"),
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze")
  });
  assert.equal(review.acceptanceChecklistStatus, "manual_review_required");
  assert.equal(review.manualReviewRequired, true);
  assert.equal(review.acceptanceRecordPersistence, false);
  assert.equal(review.blockedActions.includes("persist_evidence_file"), true);
  assert.equal(review.manualAcceptanceRows.some((item) => item.label === "Known Warnings" && item.value.includes("既有 secret scan WARN 仅作为已知警告展示")), true);
  assert.equal(review.externalUrl, null);
  assert.equal(review.issueCreateEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaManualAcceptanceChecklist({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot", "needs_review")
  });
  assert.equal(needsReview.acceptanceChecklistStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaManualAcceptanceChecklist({
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    offlineIssueTriageBoardSummary:summary("Offline Issue Triage Board"),
    publicBetaReadinessReviewViewModelSummary:summary("Public Beta Readiness Review ViewModel", "ready"),
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze"),
    persistAcceptanceRecord:true,
    persistEvidenceFile:true
  });
  assert.equal(blocked.acceptanceChecklistStatus, "blocked");
  assert.equal(blocked.blockedCapabilities.includes("acceptance record persistence"), true);
  assert.equal(blocked.blockedCapabilities.includes("evidence file persistence"), true);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_ACCEPTANCE_CHECKLIST PASS");
}

main();
