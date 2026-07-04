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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : " 已准备"), status:status === "blocked" ? "blocked" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaFreezeReviewViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaFreezeReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_REVIEW_VIEW_MODEL_VERSION, "4.2.2");

  const ready = api.buildGlobalShoppingPublicBetaFreezeReviewViewModel({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel", "manual_review_required")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualFreezeReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Blocked Next Actions"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaFreezeReviewViewModel({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualFreezeReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaFreezeReviewViewModel({
    publicBetaQaFreezeGateSummary:summary("Public Beta QA Freeze Gate", "blocked"),
    manualTrialSummaryBoardSummary:summary("Manual Trial Summary Board"),
    offlineReadinessReviewPanelSummary:summary("Offline Readiness Review Panel", "manual_review_required")
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FREEZE_REVIEW_VIEW_MODEL PASS");
}

main();
