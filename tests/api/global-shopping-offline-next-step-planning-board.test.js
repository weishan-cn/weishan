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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingOfflineNextStepPlanningBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingOfflineNextStepPlanningBoard;
  assert.equal(api.GLOBAL_SHOPPING_OFFLINE_NEXT_STEP_PLANNING_BOARD_VERSION, "4.1.9");

  const ready = api.buildGlobalShoppingOfflineNextStepPlanningBoard({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "manual_review_required"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit")
  });
  assert.equal(ready.planningStatus, "manual_review_required");
  assert.deepEqual(Array.from(ready.nextStepOptions), ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"]);
  assert.equal(ready.blockedOptions.includes("production_ready"), true);

  const needsReview = api.buildGlobalShoppingOfflineNextStepPlanningBoard({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "needs_review"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit")
  });
  assert.equal(needsReview.planningStatus, "needs_review");

  const blocked = api.buildGlobalShoppingOfflineNextStepPlanningBoard({
    publicBetaClosureEvidenceArchiveSummary:summary("Public Beta Closure Evidence Archive", "manual_review_required"),
    manualTrialExitCriteriaSummary:summary("Manual Trial Exit Criteria", "manual_review_required"),
    offlineTrialClosureBoardSummary:summary("Offline Trial Closure Board", "manual_review_required"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack"),
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit"),
    upload:true
  });
  assert.equal(blocked.planningStatus, "blocked");
  console.log("GLOBAL_SHOPPING_OFFLINE_NEXT_STEP_PLANNING_BOARD PASS");
}

main();
