const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotInvitationGate.js", "apps/desktop/src/renderer/core/flightWorkflowTesterCohortEnrollmentConsole.js"]).WeishanFlightWorkflowTesterCohortEnrollmentConsole;
  assert.equal(api.FLIGHT_WORKFLOW_TESTER_COHORT_ENROLLMENT_CONSOLE_VERSION, "2.1.94");
  const model = api.buildFlightWorkflowTesterCohortEnrollmentConsole({ pilotInvitationGateSummary:{ status:"eligible", redacted:true }, pilotReadinessSummary:{ status:"ready", redacted:true }, supportPlaybookSummary:{ status:"ready", redacted:true }, pilotOnboardingSummary:{ status:"allowed", redacted:true }, issueReviewSummary:{ status:"ready", redacted:true }, supportReadinessSummary:{ status:"ready", redacted:true }, issuePatternSummary:{ status:"ready", redacted:true }, operatorConsoleSummary:{ status:"ready", redacted:true }, rows:[{ testerSlotId:"tester-slot-001", label:"测试用户一", invitationStatus:"invited", consentStatus:"accepted", feedbackStatus:"ready", issueStatus:"none", status:"ready", redacted:true }, { testerSlotId:"tester-slot-002", label:"测试用户二", invitationStatus:"invited", consentStatus:"confirmed", feedbackStatus:"ready", issueStatus:"none", status:"ready", redacted:true }, { testerSlotId:"tester-slot-003", label:"测试用户三", invitationStatus:"invited", consentStatus:"accepted", feedbackStatus:"ready", issueStatus:"none", status:"ready", redacted:true }] });
  assert.equal(model.status, "ready");
  assert.equal(model.cohort.totalCount, 3);
  assert.equal(model.cohort.invitedCount, 3);
  assert.equal(model.cohort.consentedCount, 3);
  assert.equal(model.cohort.realIdentityStored, false);
  assert.equal(model.userFacingSummary.resultLabel, "测试用户批次可用");
  assert.equal(model.secretStored, false);
  assert.equal(model.cohort.cohortId, "tester-cohort-001");
  console.log("FLIGHT_WORKFLOW_TESTER_COHORT_ENROLLMENT_CONSOLE PASS");
}
main();
