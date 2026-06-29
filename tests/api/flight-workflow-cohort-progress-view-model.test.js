const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load([
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotCohortProgressTracker.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyTrialMilestoneBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowCohortProgressViewModel.js"
  ]).WeishanFlightWorkflowCohortProgressViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL_VERSION, "2.1.97");
  const vmModel = api.buildFlightWorkflowCohortProgressViewModel({ cohortProgressSummary:{ status:"ready", cohortProgressSummary:{ progressLabel:"测试批次进度正常", consentedCount:3, totalCount:3 }, safeToAdvanceNextCohort:true }, trialMilestoneSummary:{ status:"ready", userFacingSummary:{ resultLabel:"可以进入下一批只读测试" }, safeToAdvanceNextCohort:true }, rolloutControlSummary:{ status:"ready", decision:{ label:"可以进入下一批只读测试" } }, cohortHealthSummary:{ status:"healthy" } });
  assert.equal(vmModel.status, "ready");
  assert.equal(vmModel.rolloutDecisionStatus, "ready");
  assert.equal(vmModel.cohortHealthStatus, "healthy");
  assert.equal(vmModel.rolloutNextStep, "可以进入下一批只读测试");
  assert.ok(vmModel.cards.length >= 4);
  console.log("FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL PASS");
}
main();
