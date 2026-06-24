const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotInvitationGate.js"]).WeishanFlightWorkflowReadOnlyPilotInvitationGate;
  assert.equal(api.FLIGHT_WORKFLOW_READ_ONLY_PILOT_INVITATION_GATE_VERSION, "2.1.80");
  const model = api.buildFlightWorkflowReadOnlyPilotInvitationGate({ pilotReadinessSnapshotSummary:{ status:"ready", redacted:true }, supportPlaybookSummary:{ status:"ready", redacted:true }, pilotOnboardingSummary:{ status:"allowed", redacted:true }, readOnlyConsentSummary:{ status:"accepted", consentSummary:{ allRequiredAccepted:true }, redacted:true }, issueReviewSummary:{ status:"ready", redacted:true }, supportReadinessSummary:{ status:"ready", redacted:true }, issuePatternSummary:{ status:"ready", redacted:true }, operatorConsoleSummary:{ status:"ready", redacted:true } });
  assert.equal(model.status, "eligible");
  assert.equal(model.decision.decisionId, "allow_tester_invitation");
  assert.equal(model.testerSlot.realIdentityStored, false);
  assert.equal(model.userFacingSummary.resultLabel, "可以邀请测试用户");
  assert.equal(JSON.stringify(model).includes("secret"), false);
  assert.equal(model.invitationUrl, null);
  console.log("FLIGHT_WORKFLOW_READ_ONLY_PILOT_INVITATION_GATE PASS");
}
main();
