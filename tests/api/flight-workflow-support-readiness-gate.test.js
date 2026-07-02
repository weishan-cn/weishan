const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function radar(status, dominantPattern) { return { status:status, issuePatternHealth:{ issueCount:4, usableIssueCount:4, blockedIssueCount:0, hasRepeatedPattern:status === "needs_review", safeToContinuePilot:status !== "blocked" }, patternSummary:{ dominantPattern:dominantPattern || "none", severity:status === "blocked" ? "blocked" : (status === "needs_review" ? "warning" : "info"), message:"safe" }, safety:{ bookingUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, secretStored:false }, redacted:true }; }
function readyInput(extra) { return Object.assign({ issuePatternRadar:radar("ready"), supportTriageDashboard:{ status:"ready" }, publicPilotChecklistSummary:{ status:"ready", readiness:{ supportFallbackReady:true } }, issueReviewBoard:{ status:"ready" } }, extra || {}); }
function assertSafe(value) {
  const json = JSON.stringify(value);
  assert.equal(/sk-|apiKey abc|secret abc|password abc|credential abc|身份证 123|护照 123|银行卡 123|https:\/\/example/i.test(json), false);
  assert.equal(value.safety.bookingUrl, null);
  assert.equal(value.safety.paymentUrl, null);
  assert.equal(value.safety.orderUrl, null);
}
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowSupportReadinessGate.js"]).WeishanFlightWorkflowSupportReadinessGate;
  assert.equal(api.FLIGHT_WORKFLOW_SUPPORT_READINESS_GATE_VERSION, "3.9.0");
  const ready = api.buildFlightWorkflowSupportReadinessGate(readyInput());
  assert.equal(ready.status, "ready");
  assert.equal(ready.decision.supportReadyForPublicPilot, true);
  assert.equal(api.buildFlightWorkflowSupportReadinessGate(readyInput({ publicPilotChecklistSummary:{ status:"needs_review", readiness:{ supportFallbackReady:false } } })).status, "continue_small_pilot");
  assert.equal(api.buildFlightWorkflowSupportReadinessGate(readyInput({ issuePatternRadar:radar("needs_review", "platform_mismatch") })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowSupportReadinessGate(readyInput({ issuePatternRadar:radar("needs_review", "safety_copy_unclear") })).status, "needs_review");
  assert.equal(api.buildFlightWorkflowSupportReadinessGate(readyInput({ issuePatternRadar:radar("blocked", "sensitive_input") })).status, "blocked");
  assert.equal(api.buildFlightWorkflowSupportReadinessGate(readyInput({ rawUserTextStored:true })).status, "blocked");
  assert.equal(api.buildFlightWorkflowSupportReadinessGate(readyInput({ bookingUrl:"https://example.invalid" })).status, "blocked");
  const review = api.buildFlightWorkflowSupportReadinessGate(readyInput({ issuePatternRadar:radar("needs_review", "platform_mismatch") }));
  assert.ok(review.unmetCriteria.length > 0);
  assert.ok(review.riskNotes.length > 0);
  assertSafe(review);
  console.log("FLIGHT_WORKFLOW_SUPPORT_READINESS_GATE PASS");
}
main();
