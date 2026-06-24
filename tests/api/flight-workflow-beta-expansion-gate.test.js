const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function readyInput(extra = {}) { return Object.assign({ releaseReadinessSummary:{ status:"ready", releaseReady:true, safeForUserFacingBeta:true, redacted:true }, safetyTestMatrixSummary:{ status:"pass", overallHealth:"pass", failedCount:0, blockedCount:0, redacted:true }, safetyRegressionSummary:{ status:"pass", redacted:true }, betaCohortSummary:{ status:"ready", cohortHealth:{ safeToExpandBeta:true }, findings:[], redacted:true }, feedbackTrendSummary:{ status:"ready", trends:{ overallTrend:"positive", safetyCopyTrend:"understood" }, recommendation:{ recommendationId:"expand_read_only_beta", label:"可以扩大只读测试" }, redacted:true }, humanReviewChecklistSummary:{ status:"ready", redacted:true }, acceptanceSessionSummary:{ status:"completed", redacted:true } }, extra); }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowBetaExpansionGate.js"]).WeishanFlightWorkflowBetaExpansionGate;
  assert.equal(api.FLIGHT_WORKFLOW_BETA_EXPANSION_GATE_VERSION, "2.1.80");
  const approved = api.buildFlightWorkflowBetaExpansionGate(readyInput());
  assert.equal(approved.status, "approved");
  assert.equal(approved.decision.decisionId, "expand_read_only_beta");
  assert.equal(approved.decision.safeToExpandReadOnlyBeta, true);
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ betaCohortSummary:{ status:"needs_more_feedback", cohortHealth:{ safeToExpandBeta:false }, redacted:true } })).status, "continue_internal_testing");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ feedbackTrendSummary:{ status:"insufficient_data", trends:{ overallTrend:"unknown" }, redacted:true } })).status, "continue_internal_testing");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ feedbackTrendSummary:{ status:"needs_review", trends:{ safetyCopyTrend:"not_understood" }, redacted:true } })).decision.decisionId, "improve_safety_copy");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ humanReviewChecklistSummary:{ status:"needs_review", redacted:true } })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ safetyTestMatrixSummary:{ status:"fail", failedCount:1, redacted:true } })).status, "blocked");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ safetyRegressionSummary:{ status:"fail", redacted:true } })).status, "blocked");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ releaseReadinessSummary:{ status:"blocked", redacted:true } })).status, "blocked");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ rawUserTextStored:true })).status, "blocked");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ secretStored:true })).status, "blocked");
  assert.equal(api.buildFlightWorkflowBetaExpansionGate(readyInput({ bookingUrl:"https://blocked.example" })).status, "blocked");
  assert.ok(Array.isArray(api.buildFlightWorkflowBetaExpansionGate({}).unmetCriteria));
  assert.ok(Array.isArray(api.buildFlightWorkflowBetaExpansionGate({ rawUserTextStored:true }).riskNotes));
  const json = JSON.stringify(api.buildFlightWorkflowBetaExpansionGate(readyInput({ token:"abc123", apiKey:"hidden-value" })));
  assert.equal(json.includes("abc123"), false);
  assert.equal(json.includes("hidden-value"), false);
  assert.equal(approved.bookingUrl, null);
  assert.equal(approved.paymentUrl, null);
  assert.equal(approved.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_BETA_EXPANSION_GATE PASS");
}
main();
