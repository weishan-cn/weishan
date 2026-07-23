const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function assertSafe(value) {
  const json = JSON.stringify(value);
  assert.equal(/sk-|apiKey abc|secret abc|password abc|credential abc|身份证 123|护照 123|银行卡 123|https:\/\/example/i.test(json), false);
  assert.equal(value.safety.bookingUrl, null);
  assert.equal(value.safety.paymentUrl, null);
  assert.equal(value.safety.orderUrl, null);
}
function issue(category) { return { status:"ready", issueCategory:category, redacted:true }; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowPublicPilotIssuePatternRadar.js"]).WeishanFlightWorkflowPublicPilotIssuePatternRadar;
  assert.equal(api.FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_PATTERN_RADAR_VERSION, "4.2.8");
  assert.equal(api.buildFlightWorkflowPublicPilotIssuePatternRadar({}).status, "insufficient_data");
  assert.equal(api.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issue("candidate_unclear"), issue("platform_mismatch")] }).status, "insufficient_data");
  const ready = api.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issue("candidate_unclear"), issue("other"), issue("other"), issue("feedback_error")] });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "暂无明显共性问题");
  assert.equal(api.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issue("platform_mismatch"), issue("platform_mismatch"), issue("other"), issue("other"), issue("feedback_error")] }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issue("safety_copy_unclear"), issue("safety_copy_unclear"), issue("other"), issue("other"), issue("feedback_error")] }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issue("consent_blocked"), issue("consent_blocked"), issue("other"), issue("other"), issue("feedback_error")] }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issue("candidate_unclear"), { status:"blocked", issueCategory:"sensitive_input", rawUserTextStored:true }, issue("other")] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowPublicPilotIssuePatternRadar({ bookingUrl:"https://example.invalid", issues:[issue("other"), issue("other"), issue("other")] }).status, "blocked");
  const dominant = api.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issue("platform_mismatch"), issue("platform_mismatch"), issue("other"), issue("feedback_error"), issue("other")] });
  assert.equal(dominant.patternSummary.dominantPattern, "platform_mismatch");
  assert.equal(typeof dominant.issuePatternHealth.issueCount, "number");
  assert.ok(Array.isArray(dominant.signals));
  assertSafe(dominant);
  console.log("FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_PATTERN_RADAR PASS");
}
main();
