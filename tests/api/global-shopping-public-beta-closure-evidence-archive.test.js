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
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaClosureEvidenceArchive.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaClosureEvidenceArchive;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_EVIDENCE_ARCHIVE_VERSION, "4.1.8");

  const ready = api.buildGlobalShoppingPublicBetaClosureEvidenceArchive({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "manual_review_required"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate"),
    publicBetaClosureReviewViewModelSummary:summary("Public Beta Closure Review View Model"),
    offlineAcceptanceSnapshotSummary:summary("Offline Acceptance Snapshot", "manual_review_required"),
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"]
  });
  assert.equal(ready.archiveStatus, "manual_review_required");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.knownWarnings[0], "既有 secret scan WARN 仅作为已知警告展示");
  assert.equal(ready.externalUrl, null);

  const needsReview = api.buildGlobalShoppingPublicBetaClosureEvidenceArchive({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "needs_review"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate"),
    publicBetaClosureReviewViewModelSummary:summary("Public Beta Closure Review View Model"),
    offlineAcceptanceSnapshotSummary:summary("Offline Acceptance Snapshot", "manual_review_required")
  });
  assert.equal(needsReview.archiveStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaClosureEvidenceArchive({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "manual_review_required"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate"),
    publicBetaClosureReviewViewModelSummary:summary("Public Beta Closure Review View Model"),
    offlineAcceptanceSnapshotSummary:summary("Offline Acceptance Snapshot", "manual_review_required"),
    export:true
  });
  assert.equal(blocked.archiveStatus, "blocked");
  assert.equal(blocked.paymentUrl, null);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_EVIDENCE_ARCHIVE PASS");
}

main();
