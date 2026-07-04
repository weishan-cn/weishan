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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingTrialFeedbackIntakeMock.js"]);
  const api = windowRef.WeishanGlobalShoppingTrialFeedbackIntakeMock;
  assert.equal(api.GLOBAL_SHOPPING_TRIAL_FEEDBACK_INTAKE_MOCK_VERSION, "4.2.4");

  const review = api.buildGlobalShoppingTrialFeedbackIntakeMock({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "manual_review_required", { qaFreezeStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" })
  });
  assert.equal(review.intakeStatus, "manual_review_required");
  assert.equal(review.manualReviewRequired, true);
  assert.equal(review.userFacingSummary.caveat, "反馈入口仅为 Mock，不保存、不上传、不创建任务");
  assert.equal(review.redactionRules.includes("rawMessage"), true);
  assert.equal(review.rawUserTextPersistence, false);
  assert.equal(review.externalUrl, null);
  assert.equal(review.feedbackSubmitEnabled, false);
  assert.equal(review.uploadEnabled, false);
  assert.equal(review.issueCreateEnabled, false);
  assert.equal(review.taskCreateEnabled, false);

  const needsReview = api.buildGlobalShoppingTrialFeedbackIntakeMock({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "needs_review", { qaFreezeStatus:"needs_review" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" })
  });
  assert.equal(needsReview.intakeStatus, "needs_review");

  const blocked = api.buildGlobalShoppingTrialFeedbackIntakeMock({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "manual_review_required", { qaFreezeStatus:"manual_review_required" }),
    trialOperatorNotesPanelSummary:summary("Trial Operator Notes Panel", "manual_review_required", { notesStatus:"manual_review_required" }),
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review", "manual_review_required", { evidenceReviewStatus:"manual_review_required" }),
    manualNextPhaseDossierSummary:summary("Manual Next-Phase Dossier", "manual_review_required", { dossierStatus:"manual_review_required" }),
    rawUserTextPersistence:true
  });
  assert.equal(blocked.intakeStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("raw user text persistence"), true);

  const malformed = api.buildGlobalShoppingTrialFeedbackIntakeMock(null);
  assert.equal(typeof malformed, "object");
  assert.equal(malformed.redacted, true);
  assert.equal(malformed.orderUrl, null);
  assert.equal(malformed.buyButtonEnabled, false);
  console.log("GLOBAL_SHOPPING_TRIAL_FEEDBACK_INTAKE_MOCK PASS");
}

main();
