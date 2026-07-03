const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function readyInput(extra = {}) { return Object.assign({ betaExpansionGateSummary:{ status:"approved", decision:{ safeToExpandReadOnlyBeta:true }, redacted:true }, safetyCopyReady:true, scenarioMatrixReady:true, userReviewReady:true, forbiddenCapabilitiesVisible:true, supportFallbackReady:true }, extra); }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowReadOnlyPublicPilotChecklist.js"]).WeishanFlightWorkflowReadOnlyPublicPilotChecklist;
  assert.equal(api.FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST_VERSION, "4.0.5");
  const ready = api.buildFlightWorkflowReadOnlyPublicPilotChecklist(readyInput());
  assert.equal(ready.status, "ready");
  assert.equal(ready.readiness.safeForSmallPublicPilot, true);
  assert.ok(ready.checklistItems.length >= 5);
  assert.equal(api.buildFlightWorkflowReadOnlyPublicPilotChecklist(readyInput({ betaExpansionGateSummary:{ status:"continue_internal_testing", decision:{ safeToExpandReadOnlyBeta:false }, redacted:true } })).status, "needs_internal_testing");
  assert.equal(api.buildFlightWorkflowReadOnlyPublicPilotChecklist(readyInput({ safetyCopyReady:false })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowReadOnlyPublicPilotChecklist(readyInput({ scenarioMatrixReady:false })).status, "blocked");
  assert.equal(api.buildFlightWorkflowReadOnlyPublicPilotChecklist(readyInput({ forbiddenCapabilitiesVisible:false })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowReadOnlyPublicPilotChecklist(readyInput({ supportFallbackReady:false })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowReadOnlyPublicPilotChecklist(readyInput({ bookingUrl:"https://blocked.example" })).status, "blocked");
  assert.ok(Array.isArray(ready.blockedItems));
  assert.equal(ready.bookingUrl, null);
  const json = JSON.stringify(api.buildFlightWorkflowReadOnlyPublicPilotChecklist(readyInput({ token:"abc123", secret:"hidden-value" })));
  assert.equal(json.includes("abc123"), false);
  assert.equal(json.includes("hidden-value"), false);
  console.log("FLIGHT_WORKFLOW_READ_ONLY_PUBLIC_PILOT_CHECKLIST PASS");
}
main();
