const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotInvitationGate.js", "apps/desktop/src/renderer/core/flightWorkflowTesterCohortEnrollmentConsole.js", "apps/desktop/src/renderer/core/flightWorkflowPilotInvitationViewModel.js"]);
  const api = windowRef.WeishanFlightWorkflowPilotInvitationViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL_VERSION, "4.0.1");
  const model = api.buildFlightWorkflowPilotInvitationViewModel({ pilotReadinessSummary:{ status:"ready", redacted:true }, supportPlaybookSummary:{ status:"ready", redacted:true }, pilotOnboardingSummary:{ status:"allowed", redacted:true }, issueReviewSummary:{ status:"ready", redacted:true }, supportReadinessSummary:{ status:"ready", redacted:true }, issuePatternSummary:{ status:"ready", redacted:true }, operatorConsoleSummary:{ status:"ready", redacted:true }, readOnlyConsentSummary:{ status:"accepted", consentSummary:{ allRequiredAccepted:true }, redacted:true }, rows:[{ testerSlotId:"tester-slot-001", label:"测试用户一", invitationStatus:"invited", consentStatus:"accepted", feedbackStatus:"ready", issueStatus:"none", status:"ready", redacted:true }, { testerSlotId:"tester-slot-002", label:"测试用户二", invitationStatus:"invited", consentStatus:"confirmed", feedbackStatus:"ready", issueStatus:"none", status:"ready", redacted:true }, { testerSlotId:"tester-slot-003", label:"测试用户三", invitationStatus:"invited", consentStatus:"accepted", feedbackStatus:"ready", issueStatus:"none", status:"ready", redacted:true }] });
  assert.equal(model.status, "ready");
  assert.equal(model.cards.length, 4);
  assert.equal(model.cohortRows.length, 3);
  assert.equal(model.riskRows.length, 4);
  assert.equal(model.invitationGateName, "flight_workflow_read_only_pilot_invitation_gate_v1");
  assert.equal(model.cohortConsoleName, "flight_workflow_tester_cohort_enrollment_console_v1");
  assert.equal(JSON.stringify(model).includes("token"), false);
  console.log("FLIGHT_WORKFLOW_PILOT_INVITATION_VIEW_MODEL PASS");
}
main();
