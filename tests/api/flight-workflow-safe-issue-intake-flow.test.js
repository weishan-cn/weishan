const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowSafeIssueIntakeFlow.js"]).WeishanFlightWorkflowSafeIssueIntakeFlow;
  assert.equal(api.FLIGHT_WORKFLOW_SAFE_ISSUE_INTAKE_FLOW_VERSION, "2.3.9");
  assert.equal(api.buildFlightWorkflowSafeIssueIntakeFlow({}).status, "needs_category");
  for (const category of ["candidate_unclear", "platform_mismatch", "safety_copy_unclear", "consent_blocked", "feedback_error"]) {
    const flow = api.buildFlightWorkflowSafeIssueIntakeFlow({ issueCategory:category });
    assert.equal(flow.status, "ready");
    assert.equal(flow.issueCategory, category);
  }
  for (const note of ["身份证 123", "银行卡 1234", "token abc", "api key abc", "secret abc", "payment link https://pay.example", "order link https://order.example"]) {
    const flow = api.buildFlightWorkflowSafeIssueIntakeFlow({ issueCategory:"other", userNote:note });
    assert.ok(flow.status === "redacted" || flow.status === "blocked");
    const json = JSON.stringify(flow);
    assert.equal(json.includes("1234"), false);
    assert.equal(json.includes("abc"), false);
    assert.equal(/https?:\/\//.test(json), false);
  }
  const ready = api.buildFlightWorkflowSafeIssueIntakeFlow({ issueCategory:"candidate_unclear", userNote:"看不懂" });
  assert.equal(ready.safety.rawUserTextStored, false);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.orderUrl, null);
  assert.equal(/token|key|secret/i.test(JSON.stringify(ready.issueSummary)), false);
  console.log("FLIGHT_WORKFLOW_SAFE_ISSUE_INTAKE_FLOW PASS");
}
main();
