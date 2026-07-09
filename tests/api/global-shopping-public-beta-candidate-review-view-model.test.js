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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateReviewViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaCandidateReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_REVIEW_VIEW_MODEL_VERSION, "4.2.7");

  const ready = api.buildGlobalShoppingPublicBetaCandidateReviewViewModel({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board", "manual_review_required", { deltaStatus:"manual_review_required" })
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualCandidateEvidenceReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Candidate Evidence"), true);
  assert.equal(ready.cards.some((item) => item.label === "Safety Delta"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaCandidateReviewViewModel({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" })
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualCandidateEvidenceReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaCandidateReviewViewModel({
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "blocked", { evidenceReviewStatus:"blocked" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board", "manual_review_required", { deltaStatus:"manual_review_required" })
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_REVIEW_VIEW_MODEL PASS");
}

main();
