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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateEvidenceReview.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaCandidateEvidenceReview;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_EVIDENCE_REVIEW_VERSION, "4.2.7");

  const review = api.buildGlobalShoppingPublicBetaCandidateEvidenceReview({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "manual_review_required", { handoffStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    publicBetaCandidateViewModelSummary:summary("Public Beta Candidate ViewModel", "ready"),
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" })
  });
  assert.equal(review.evidenceReviewStatus, "manual_review_required");
  assert.equal(review.manualReviewRequired, true);
  assert.equal(review.userFacingSummary.caveat, "候选证据仅为只读复核，不写文件");
  assert.equal(review.externalUrl, null);
  assert.equal(review.buyButtonEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaCandidateEvidenceReview({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "needs_review", { handoffStatus:"needs_review" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    publicBetaCandidateViewModelSummary:summary("Public Beta Candidate ViewModel", "ready"),
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" })
  });
  assert.equal(needsReview.evidenceReviewStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaCandidateEvidenceReview({
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    finalTrialHandoffConsoleSummary:summary("Final Trial Handoff Console", "manual_review_required", { handoffStatus:"manual_review_required" }),
    noProviderProductionBoundarySummary:summary("No-Provider Production Boundary", "manual_review_required", { boundaryStatus:"manual_review_required" }),
    publicBetaCandidateViewModelSummary:summary("Public Beta Candidate ViewModel", "ready"),
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" }),
    provider:true
  });
  assert.equal(blocked.evidenceReviewStatus, "blocked");
  assert.equal(blocked.blockedCapabilities.includes("provider"), true);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_EVIDENCE_REVIEW PASS");
}

main();
