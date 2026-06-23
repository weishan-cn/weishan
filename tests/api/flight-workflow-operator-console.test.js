const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js", "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js"]);
  const api = windowRef.WeishanFlightWorkflowOperatorConsole;
  assert.equal(api.FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VERSION, "2.1.72");
  const base = { workflowId:"wf1", workflowStateSummary:{ workflowId:"wf1" }, topCandidates:[{ providerName:"sandbox", bookingUrl:null }], selectedCandidate:{ providerName:"sandbox" }, auditReviewSummary:{ status:"ready", auditHealth:{ overall:"pass" } }, humanReviewChecklistSummary:{ status:"ready" }, finalSafeHandoffPacketSummary:{ status:"ready" }, handoffPacketPolicyDecision:{ status:"allowed" }, safetyRegressionSummary:{ status:"pass", checks:[] }, eventLedgerSummary:{ recentEvents:[{ eventType:"handoff_packet_prepared", status:"ready" }] }, blockedActions:[] };
  const ready = api.buildFlightWorkflowOperatorConsole(base);
  assert.equal(ready.consoleName, "flight_workflow_operator_console_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "可以继续只读流程");
  assert.equal(ready.nextOperatorAction.enabled, true);
  assert.equal(JSON.stringify(ready.sections.map((s) => s.sectionId)), JSON.stringify(["workflow_status", "safety_status", "recent_events", "blocked_actions", "handoff_readiness"]));
  assert.equal(ready.bookingUrl, null);
  const warning = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { humanReviewChecklistSummary:{ status:"needs_review" } }));
  assert.equal(warning.status, "warning");
  const auditBlocked = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { auditReviewSummary:{ status:"blocked", auditHealth:{ overall:"blocked" } } }));
  assert.equal(auditBlocked.status, "blocked");
  const packetBlocked = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { finalSafeHandoffPacketSummary:{ status:"blocked" } }));
  assert.equal(packetBlocked.status, "blocked");
  const sentinelFail = api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { safetyRegressionSummary:{ status:"fail", checks:[] } }));
  assert.equal(sentinelFail.status, "blocked");
  assert.equal(api.buildFlightWorkflowOperatorConsole(null).status, "failed_safe");
  const json = JSON.stringify(api.buildFlightWorkflowOperatorConsole(Object.assign({}, base, { token:"abc", bookingUrl:"https://blocked.example" })));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("FLIGHT_WORKFLOW_OPERATOR_CONSOLE PASS");
}
main();
