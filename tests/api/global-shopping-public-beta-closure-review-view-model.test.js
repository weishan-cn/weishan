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
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "manual_review_required" ? " 需人工复核" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : status === "needs_review" ? " 仍需复核" : status === "manual_review_required" ? " 需人工复核" : " 已准备"), status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaClosureReviewViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaClosureReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_REVIEW_VIEW_MODEL_VERSION, "4.2.3");

  const ready = api.buildGlobalShoppingPublicBetaClosureReviewViewModel({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "manual_review_required"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualClosureReview, true);
  assert.equal(ready.cards.some((item) => item.label === "No Launch"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaClosureReviewViewModel({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "needs_review"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualClosureReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaClosureReviewViewModel({
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "manual_review_required"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate", "blocked")
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_CLOSURE_REVIEW_VIEW_MODEL PASS");
}

main();
