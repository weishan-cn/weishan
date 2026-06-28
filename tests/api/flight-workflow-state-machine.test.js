const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowStateMachine.js"]);
  const api = windowRef.WeishanFlightWorkflowStateMachine;
  assert.equal(api.FLIGHT_WORKFLOW_STATE_MACHINE_VERSION, "2.1.93");
  const incomplete = api.createFlightWorkflowState({ intent:{ status:"needs_clarification", route:{ destinationCity:"成都" }, departureDate:"2026-07-15", dateDisplay:"7月15日", missingFields:["origin"] } });
  assert.equal(incomplete.status, "needs_clarification");
  assert.equal(incomplete.currentStep, "clarification");
  assert.ok(incomplete.missingFields.includes("origin"));
  assert.ok(incomplete.clarificationQuestions.includes("从哪里出发？"));
  const answered = api.reduceFlightWorkflowEvent(incomplete, { type:"CLARIFICATION_ANSWERED", answer:{ route:{ originCity:"上海" } } });
  assert.equal(answered.status, "ready_for_evidence");
  assert.equal(answered.currentStep, "evidence");
  assert.equal(answered.safety.payment, false);
  assert.equal(answered.bookingUrl, null);
  const evidenceReady = api.reduceFlightWorkflowEvent(answered, { type:"EVIDENCE_READY", evidenceSummary:{ topCandidateCount:3, bookingUrl:"https://blocked.example" }, selectedCandidate:{ providerName:"Trusted", token:"abc" } });
  assert.equal(evidenceReady.status, "evidence_ready");
  assert.equal(evidenceReady.currentStep, "decision");
  assert.equal(JSON.stringify(evidenceReady).includes("https://blocked.example"), false);
  assert.equal(JSON.stringify(evidenceReady).includes("abc"), false);
  const summary = api.buildFlightWorkflowStateSummary(evidenceReady);
  assert.equal(summary.workflowId, "deterministic-flight-workflow-v2.1.93");
  assert.equal(summary.status, "evidence_ready");
  assert.equal(summary.currentStage, "decision");
  assert.equal(summary.nextStepLabel, "选择候选");
  assert.equal(summary.canResumeWorkflow, true);
  assert.equal(summary.bookingUrl, null);
  const audit = api.buildFlightWorkflowStateMachineAuditDraft(evidenceReady);
  assert.equal(audit.rawResponseStored, false);
  console.log("FLIGHT_WORKFLOW_STATE_MACHINE PASS");
}
main();
