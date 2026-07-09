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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingNoDataRetentionGuard.js"]);
  const api = windowRef.WeishanGlobalShoppingNoDataRetentionGuard;
  assert.equal(api.GLOBAL_SHOPPING_NO_DATA_RETENTION_GUARD_VERSION, "4.2.7");

  const review = api.buildGlobalShoppingNoDataRetentionGuard({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist"),
    offlineUserScenarioPackSummary:summary("Offline User Scenario Pack"),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready")
  });
  assert.equal(review.noDataRetentionStatus, "manual_review_required");
  assert.equal(review.rawUserTextPersistence, false);
  assert.equal(review.acceptanceRecordPersistence, false);
  assert.equal(review.evidenceFilePersistence, false);
  assert.equal(review.scenarioReviewPersistence, false);
  assert.equal(review.noRetentionFlags.providerResponsePersistence, false);
  assert.equal(review.redactionRules.includes("providerPayload"), true);
  assert.equal(review.redactionRules.includes("paymentPayload"), true);

  const needsReview = api.buildGlobalShoppingNoDataRetentionGuard({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist", "needs_review")
  });
  assert.equal(needsReview.noDataRetentionStatus, "needs_review");

  const blocked = api.buildGlobalShoppingNoDataRetentionGuard({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist"),
    offlineUserScenarioPackSummary:summary("Offline User Scenario Pack"),
    trialFeedbackIntakeMockSummary:summary("Trial Feedback Intake Mock"),
    manualFeedbackReviewQueueMockSummary:summary("Manual Feedback Review Queue Mock"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard", "ready"),
    persistProviderResponse:true,
    persistEvidenceFile:true,
    persistScenarioReview:true
  });
  assert.equal(blocked.noDataRetentionStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("provider response persistence"), true);
  assert.equal(blocked.blockedReasons.includes("evidence file persistence"), true);
  assert.equal(blocked.blockedReasons.includes("scenario review persistence"), true);
  console.log("GLOBAL_SHOPPING_NO_DATA_RETENTION_GUARD PASS");
}

main();
