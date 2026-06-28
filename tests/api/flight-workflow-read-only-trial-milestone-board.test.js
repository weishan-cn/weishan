const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load("apps/desktop/src/renderer/core/flightWorkflowReadOnlyTrialMilestoneBoard.js").WeishanFlightWorkflowReadOnlyTrialMilestoneBoard;
  assert.equal(api.FLIGHT_WORKFLOW_READ_ONLY_TRIAL_MILESTONE_BOARD_VERSION, "2.1.88");
  const board = api.buildFlightWorkflowReadOnlyTrialMilestoneBoard({ cohortProgressSummary:{ status:"ready", cohortProgressStatus:"ready", safeToAdvanceNextCohort:true }, pilotReadinessSnapshotSummary:{ status:"ready" }, pilotOnboardingSummary:{ status:"allowed" }, readOnlyConsentSummary:{ status:"accepted" }, supportPlaybookSummary:{ status:"ready" }, issueReviewSummary:{ status:"ready" }, supportReadinessSummary:{ status:"ready" }, issuePatternSummary:{ status:"ready" }, testerCohortEnrollmentConsoleSummary:{ cohort:{ totalCount:3, feedbackReadyCount:2 } }, rolloutControlSummary:{ status:"ready", decision:{ label:"可以进入下一批只读测试" } }, cohortHealthSummary:{ status:"healthy" } });
  assert.equal(board.status, "ready");
  assert.equal(board.rolloutDecisionStatus, "ready");
  assert.equal(board.cohortHealthStatus, "healthy");
  assert.equal(board.rolloutNextStep, "可以进入下一批只读测试");
  assert.equal(board.bookingUrl, null);
  console.log("FLIGHT_WORKFLOW_READ_ONLY_TRIAL_MILESTONE_BOARD PASS");
}
main();
