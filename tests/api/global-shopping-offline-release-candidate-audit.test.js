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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineReleaseCandidateAudit.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineReleaseCandidateAudit;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_AUDIT_VERSION, "4.2.8");

  const review = api.buildGlobalShoppingOfflineReleaseCandidateAudit({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock"),
    publicBetaOfflineAcceptanceViewModelSummary:summary("Public Beta Offline Acceptance ViewModel"),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "manual_review_required"),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary")
  });
  assert.equal(review.releaseCandidateAuditStatus, "manual_review_required");
  assert.equal(review.releaseBlocked, true);
  assert.equal(review.launchBlocked, true);
  assert.equal(review.providerBlocked, true);
  assert.equal(review.transactionBlocked, true);
  assert.equal(review.persistenceBlocked, true);
  assert.equal(review.releaseCandidateAuditPersistence, false);

  const needsReview = api.buildGlobalShoppingOfflineReleaseCandidateAudit({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock", "needs_review")
  });
  assert.equal(needsReview.releaseCandidateAuditStatus, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineReleaseCandidateAudit({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock"),
    publicBetaOfflineAcceptanceViewModelSummary:summary("Public Beta Offline Acceptance ViewModel"),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix"),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary"),
    createRelease:true
  });
  assert.equal(blocked.releaseCandidateAuditStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("release"), true);
  console.log("GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_AUDIT PASS");
}

main();
