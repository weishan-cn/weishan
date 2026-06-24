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

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowReadOnlyLaunchCandidateFreezeGate.js"]);
  const api = windowRef.WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate;
  assert.equal(api.FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_VERSION, "2.1.84");
  const gate = api.buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate({
    pilotExitCriteriaSummary:{ status:"met", exitHealth:{ readyForLaunchCandidate:true } },
    launchCandidateReadinessSummary:{ status:"ready", launchCandidateReadiness:{ safeForReadOnlyLaunchCandidate:true } },
    releaseReadinessSummary:{ status:"ready", safeForUserFacingBeta:true },
    safetyRegressionSummary:{ status:"pass" },
    evidenceFreezePackSummary:{ status:"ready", safeToFreeze:true }
  });
  assert.equal(gate.status, "ready_to_freeze");
  assert.equal(gate.freezeDecision.safeToFreeze, true);
  assert.equal(gate.userFacingSummary.resultLabel, "准备冻结只读发布候选");
  assert.equal(gate.freezeGateNextStep, "可以冻结只读发布候选");
  assert.equal(gate.bookingUrl, null);
  assert.equal(gate.fileWrite, false);
  const audit = api.buildFlightWorkflowReadOnlyLaunchCandidateFreezeGateAuditDraft({ freezeRequested:true, pilotExitCriteriaSummary:{ status:"met", exitHealth:{ readyForLaunchCandidate:true } }, launchCandidateReadinessSummary:{ status:"ready", launchCandidateReadiness:{ safeForReadOnlyLaunchCandidate:true } }, releaseReadinessSummary:{ status:"ready", safeForUserFacingBeta:true }, safetyRegressionSummary:{ status:"pass" }, evidenceFreezePackSummary:{ status:"ready", safeToFreeze:true } });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE_AUDIT_DRAFT");
  assert.equal(audit.status, "frozen");
  assert.equal(audit.freezeReady, true);
  assert.equal(audit.fileWrite, false);
  assert.equal(JSON.stringify(audit).includes("token"), false);
  console.log("FLIGHT_WORKFLOW_READ_ONLY_LAUNCH_CANDIDATE_FREEZE_GATE PASS");
}

main();
