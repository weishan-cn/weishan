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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalReadinessCommandCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaFinalReadinessCommandCenter;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_COMMAND_CENTER_VERSION, "4.2.5");

  const ready = api.buildGlobalShoppingPublicBetaFinalReadinessCommandCenter({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required", { archiveStatus:"manual_review_required" }),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required", { exitCriteriaStatus:"manual_review_required" }),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required", { planningStatus:"manual_review_required" }),
    publicBetaNextStepViewModelSummary:summary("Public Beta Next-Step ViewModel"),
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate"),
    knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"]
  });
  assert.equal(ready.finalReadinessStatus, "manual_review_required");
  assert.equal(ready.manualReviewRequired, true);
  assert.deepEqual(Array.from(ready.allowedNextActions || []), ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"]);
  assert.equal(ready.knownWarnings[0], "既有 secret scan WARN 仅作为已知警告展示");

  const needsReview = api.buildGlobalShoppingPublicBetaFinalReadinessCommandCenter({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "needs_review", { archiveStatus:"needs_review" }),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required", { exitCriteriaStatus:"manual_review_required" }),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required", { planningStatus:"manual_review_required" }),
    publicBetaNextStepViewModelSummary:summary("Public Beta Next-Step ViewModel"),
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate")
  });
  assert.equal(needsReview.finalReadinessStatus, "needs_review");

  const blocked = api.buildGlobalShoppingPublicBetaFinalReadinessCommandCenter({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required", { archiveStatus:"manual_review_required" }),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required", { exitCriteriaStatus:"manual_review_required" }),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required", { planningStatus:"manual_review_required" }),
    publicBetaNextStepViewModelSummary:summary("Public Beta Next-Step ViewModel"),
    publicBetaAcceptanceReviewConsoleSummary:summary("Public Beta Acceptance Review Console", "manual_review_required"),
    noLaunchAssuranceGateSummary:summary("No-Launch Assurance Gate"),
    push:true
  });
  assert.equal(blocked.finalReadinessStatus, "blocked");
  assert.equal(blocked.externalUrl, null);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_FINAL_READINESS_COMMAND_CENTER PASS");
}

main();
