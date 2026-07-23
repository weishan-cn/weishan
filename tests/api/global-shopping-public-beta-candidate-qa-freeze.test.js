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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateQaFreeze.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaCandidateQaFreeze;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_QA_FREEZE_VERSION, "4.2.8");

  const review = api.buildGlobalShoppingPublicBetaCandidateQaFreeze({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board", "manual_review_required", { deltaStatus:"manual_review_required" }),
    publicBetaCandidateReviewViewModelSummary:summary("Public Beta Candidate Review ViewModel", "manual_review_required"),
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" })
  });
  assert.equal(review.qaFreezeStatus, "manual_review_required");
  assert.equal(review.manualReviewRequired, true);
  assert.equal(review.userFacingSummary.caveat, "QA 冻结仅为只读范围，不修改配置");
  assert.equal(review.externalUrl, null);
  assert.equal(review.feedbackSubmitEnabled, false);
  assert.equal(review.issueCreateEnabled, false);
  assert.equal(review.taskCreateEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaCandidateQaFreeze({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "needs_review", { notesStatus:"needs_review" }),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board", "manual_review_required", { deltaStatus:"manual_review_required" }),
    publicBetaCandidateReviewViewModelSummary:summary("Public Beta Candidate Review ViewModel", "manual_review_required"),
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" })
  });
  assert.equal(needsReview.qaFreezeStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaCandidateQaFreeze({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board", "manual_review_required", { deltaStatus:"manual_review_required" }),
    publicBetaCandidateReviewViewModelSummary:summary("Public Beta Candidate Review ViewModel", "manual_review_required"),
    publicBetaCandidateLockSummary:summary("Public Beta Candidate Lock", "manual_review_required", { candidateLockStatus:"manual_review_required" }),
    provider:true
  });
  assert.equal(blocked.qaFreezeStatus, "blocked");
  assert.equal(blocked.blockedCapabilities.includes("provider"), true);

  const malformed = api.buildGlobalShoppingPublicBetaCandidateQaFreeze("bad-input");
  assert.equal(typeof malformed, "object");
  assert.equal(malformed.redacted, true);
  assert.equal(malformed.bookingUrl, null);
  assert.equal(malformed.paymentButtonEnabled, false);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_QA_FREEZE PASS");
}

main();
