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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingManualNextPhaseDossier.js"]);
  const api = windowRef.WeishanGlobalShoppingManualNextPhaseDossier;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_NEXT_PHASE_DOSSIER_VERSION, "4.2.0");

  const needsReview = api.buildGlobalShoppingManualNextPhaseDossier({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "blocked", { blockerMatrixStatus:"blocked" }),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required", { exitCriteriaStatus:"manual_review_required" }),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required", { planningStatus:"manual_review_required" }),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit")
  });
  assert.equal(needsReview.dossierStatus, "needs_review");
  assert.equal(needsReview.currentPhase, "public_beta_readonly_candidate");
  assert.deepEqual(Array.from(needsReview.allowedNextPhaseOptions || []), ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"]);

  const blocked = api.buildGlobalShoppingManualNextPhaseDossier({
    publicBetaFinalReadinessCommandCenterSummary:summary("Public Beta Final Readiness Command Center", "manual_review_required", { finalReadinessStatus:"manual_review_required" }),
    offlineLaunchBlockerMatrixSummary:summary("Offline Launch Blocker Matrix", "blocked", { blockerMatrixStatus:"blocked" }),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required", { exitCriteriaStatus:"manual_review_required" }),
    offlineNextStepPlanningBoardSummary:summary("Offline Next-Step Planning Board", "manual_review_required", { planningStatus:"manual_review_required" }),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    upload:true
  });
  assert.equal(blocked.dossierStatus, "blocked");
  assert.equal(blocked.paymentUrl, null);
  console.log("GLOBAL_SHOPPING_MANUAL_NEXT_PHASE_DOSSIER PASS");
}

main();
