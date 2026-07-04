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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaQaFreezeViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaQaFreezeViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_VIEW_MODEL_VERSION, "4.2.3");

  const ready = api.buildGlobalShoppingPublicBetaQaFreezeViewModel({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "manual_review_required", { qaFreezeStatus:"manual_review_required" }),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock", "manual_review_required", { intakeStatus:"manual_review_required" }),
    offlineRegressionEvidenceBoardSummary:summary("Offline Regression Evidence Board", "manual_review_required", { regressionEvidenceStatus:"manual_review_required" })
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.safeToProceedWithManualQaFreezeReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Public Beta Candidate QA Freeze"), true);
  assert.equal(ready.cards.some((item) => item.label === "Feedback Intake"), true);
  assert.equal(ready.cards.some((item) => item.label === "Regression Evidence"), true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.feedbackSubmitEnabled, false);
  assert.equal(ready.uploadEnabled, false);

  const needsReview = api.buildGlobalShoppingPublicBetaQaFreezeViewModel({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "manual_review_required", { qaFreezeStatus:"manual_review_required" }),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock", "manual_review_required", { intakeStatus:"manual_review_required" })
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualQaFreezeReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaQaFreezeViewModel({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze", "blocked", { qaFreezeStatus:"blocked" }),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock", "manual_review_required", { intakeStatus:"manual_review_required" }),
    offlineRegressionEvidenceBoardSummary:summary("Offline Regression Evidence Board", "manual_review_required", { regressionEvidenceStatus:"manual_review_required" })
  });
  assert.equal(blocked.status, "blocked");

  const malformed = api.buildGlobalShoppingPublicBetaQaFreezeViewModel("bad-input");
  assert.equal(typeof malformed, "object");
  assert.equal(malformed.redacted, true);
  assert.equal(malformed.orderUrl, null);
  assert.equal(malformed.buyButtonEnabled, false);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_VIEW_MODEL PASS");
}

main();
