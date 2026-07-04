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
    rows:[{ rowId:title, label:title, value:title, status:status === "blocked" ? "blocked" : status === "needs_review" ? "warning" : "pass", redacted:true }],
    redacted:true
  }, extra || {});
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaNextStepViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaNextStepViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_NEXT_STEP_VIEW_MODEL_VERSION, "4.2.2");

  const ready = api.buildGlobalShoppingPublicBetaNextStepViewModel({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required"),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.safeToProceedWithManualNextStepReview, true);
  assert.equal(ready.cards.some((item) => item.label === "Next-Step Planning"), true);

  const needsReview = api.buildGlobalShoppingPublicBetaNextStepViewModel({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required"),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "needs_review")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithManualNextStepReview, false);

  const blocked = api.buildGlobalShoppingPublicBetaNextStepViewModel({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "blocked"),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required")
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_NEXT_STEP_VIEW_MODEL PASS");
}

main();
