const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load("apps/desktop/src/renderer/core/flightWorkflowPublicPilotCohortProgressTracker.js").WeishanFlightWorkflowPublicPilotCohortProgressTracker;
  assert.equal(api.FLIGHT_WORKFLOW_PUBLIC_PILOT_COHORT_PROGRESS_TRACKER_VERSION, "2.1.99");
  const tracker = api.buildFlightWorkflowPublicPilotCohortProgressTracker({ testerCohortEnrollmentConsoleSummary:{ status:"ready", cohort:{ totalCount:3, invitedCount:3, consentedCount:3, feedbackReadyCount:2, blockedCount:0 }, rows:[{ testerSlotId:"tester-slot-001", invitationStatus:"invited", consentStatus:"accepted", feedbackStatus:"ready", status:"ready" }, { testerSlotId:"tester-slot-002", invitationStatus:"invited", consentStatus:"accepted", feedbackStatus:"ready", status:"ready" }, { testerSlotId:"tester-slot-003", invitationStatus:"invited", consentStatus:"accepted", feedbackStatus:"pending", status:"ready" }] }, pilotInvitationGateSummary:{ status:"eligible" }, pilotReadinessSnapshotSummary:{ status:"ready" }, supportPlaybookSummary:{ status:"ready" }, supportReadinessSummary:{ status:"ready" }, issuePatternSummary:{ status:"ready" }, rolloutControlSummary:{ status:"ready", decision:{ label:"可以进入下一批只读测试" } }, cohortHealthSummary:{ status:"healthy" } });
  assert.equal(tracker.status, "ready");
  assert.equal(tracker.rolloutDecisionStatus, "ready");
  assert.equal(tracker.cohortHealthStatus, "healthy");
  assert.equal(tracker.rolloutNextStep, "可以进入下一批只读测试");
  assert.equal(tracker.bookingUrl, null);
  assert.equal(tracker.secretStored, false);
  console.log("FLIGHT_WORKFLOW_PUBLIC_PILOT_COHORT_PROGRESS_TRACKER PASS");
}
main();
