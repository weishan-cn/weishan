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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingZeroActionSafetyConsole.js"]);
  const api = windowRef.WeishanGlobalShoppingZeroActionSafetyConsole;
  assert.equal(api.GLOBAL_SHOPPING_ZERO_ACTION_SAFETY_CONSOLE_VERSION, "4.2.6");

  const review = api.buildGlobalShoppingZeroActionSafetyConsole({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock"),
    offlineReleaseCandidateAuditSummary:summary("Offline Release Candidate Audit"),
    zeroPersistenceRegressionGateSummary:summary("Zero-Persistence Regression Gate")
  });
  assert.equal(review.zeroActionStatus, "manual_review_required");
  assert.equal(review.disabledActions.includes("release_publish"), true);
  assert.equal(review.zeroActionFlags.actionExecutionEnabled, false);
  assert.equal(review.zeroActionFlags.releaseCandidateAuditPersistence, false);
  assert.equal(review.feedbackSubmitEnabled, false);

  const needsReview = api.buildGlobalShoppingZeroActionSafetyConsole({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock", "needs_review")
  });
  assert.equal(needsReview.zeroActionStatus, "needs_review");

  const blocked = api.buildGlobalShoppingZeroActionSafetyConsole({
    publicBetaFinalAcceptanceLockSummary:summary("Public Beta Final Acceptance Lock"),
    offlineReleaseCandidateAuditSummary:summary("Offline Release Candidate Audit"),
    zeroPersistenceRegressionGateSummary:summary("Zero-Persistence Regression Gate"),
    actionExecutionEnabled:true
  });
  assert.equal(blocked.zeroActionStatus, "blocked");
  assert.equal(blocked.blockedReasons.includes("action execution"), true);
  console.log("GLOBAL_SHOPPING_ZERO_ACTION_SAFETY_CONSOLE PASS");
}

main();
