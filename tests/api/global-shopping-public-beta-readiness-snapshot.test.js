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

function summary(title, status) {
  return {
    status:status || "manual_review_required",
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 需人工复核"), redacted:true },
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"],
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaReadinessSnapshot.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaReadinessSnapshot;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_SNAPSHOT_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingPublicBetaReadinessSnapshot({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze"),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock"),
    offlineRegressionEvidenceBoardSummary:summary("Offline Regression Evidence Board"),
    publicBetaQaFreezeViewModelSummary:summary("Public Beta QA Freeze ViewModel", "ready"),
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review"),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board")
  });
  assert.equal(ready.status, "manual_review_required");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.feedbackSubmitEnabled, false);
  assert.equal(ready.uploadEnabled, false);
  assert.equal(ready.issueCreateEnabled, false);
  assert.equal(ready.taskCreateEnabled, false);
  assert.equal(ready.knownWarnings.includes("既有 secret scan WARN 仅作为已知警告展示"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaReadinessSnapshot({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaReadinessSnapshot({
    publicBetaCandidateQaFreezeSummary:summary("Public Beta Candidate QA Freeze"),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock"),
    offlineRegressionEvidenceBoardSummary:summary("Offline Regression Evidence Board"),
    publicBetaQaFreezeViewModelSummary:summary("Public Beta QA Freeze ViewModel", "ready"),
    publicBetaCandidateEvidenceReviewSummary:summary("Public Beta Candidate Evidence Review"),
    offlineSafetyDeltaBoardSummary:summary("Offline Safety Delta Board"),
    createIssue:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.bookingUrl, null);
  assert.equal(blocked.paymentUrl, null);
  assert.equal(blocked.orderUrl, null);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_SNAPSHOT PASS");
}

main();
