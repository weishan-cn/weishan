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
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaOfflineAcceptanceEvidenceCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_EVIDENCE_CENTER_VERSION, "4.2.7");

  const review = api.buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist"),
    offlineUserScenarioPackSummary:summary("Offline User Scenario Pack"),
    noDataRetentionGuardSummary:summary("No-Data-Retention Guard"),
    publicBetaAcceptanceReviewViewModelSummary:summary("Public Beta Acceptance Review ViewModel"),
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot")
  });
  assert.equal(review.evidenceCenterStatus, "manual_review_required");
  assert.equal(review.manualReviewRequired, true);
  assert.equal(review.evidenceScope.includes("evidence_file"), true);
  assert.equal(review.blockedActions.includes("persist_evidence_file"), true);
  assert.equal(review.knownWarnings[0].includes("secret scan WARN"), true);
  assert.equal(review.evidenceFilePersistence, false);
  assert.equal(review.externalUrl, null);

  const needsReview = api.buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist", "needs_review")
  });
  assert.equal(needsReview.evidenceCenterStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist"),
    offlineUserScenarioPackSummary:summary("Offline User Scenario Pack"),
    noDataRetentionGuardSummary:summary("No-Data-Retention Guard"),
    publicBetaAcceptanceReviewViewModelSummary:summary("Public Beta Acceptance Review ViewModel"),
    publicBetaReadinessSnapshotSummary:summary("Public Beta Readiness Snapshot"),
    persistEvidenceFile:true
  });
  assert.equal(blocked.evidenceCenterStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("evidence file persistence"), true);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_EVIDENCE_CENTER PASS");
}

main();
