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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaAcceptanceReviewViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaAcceptanceReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION, "4.2.5");

  const ready = api.buildGlobalShoppingPublicBetaAcceptanceReviewViewModel({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist", "manual_review_required"),
    offlineUserScenarioPackSummary:summary("Offline User Scenario Pack", "manual_review_required"),
    noDataRetentionGuardSummary:summary("No-Data-Retention Guard", "manual_review_required")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualAcceptanceReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Manual Acceptance"), true);
  assert.equal(ready.noDataRetentionRows[0].label, "No-Data-Retention Guard");
  assert.equal(ready.feedbackSubmitEnabled, false);
  assert.equal(ready.userFacingSummary.caveat.includes("反馈提交"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaAcceptanceReviewViewModel({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist", "needs_review")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualAcceptanceReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaAcceptanceReviewViewModel({
    publicBetaManualAcceptanceChecklistSummary:summary("Public Beta Manual Acceptance Checklist", "blocked"),
    offlineUserScenarioPackSummary:summary("Offline User Scenario Pack", "manual_review_required"),
    noDataRetentionGuardSummary:summary("No-Data-Retention Guard", "manual_review_required")
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.bookingUrl, null);
  assert.equal(blocked.orderUrl, null);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL PASS");
}

main();
