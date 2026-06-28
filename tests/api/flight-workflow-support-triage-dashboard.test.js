const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function assertNoSensitive(value) {
  const json = JSON.stringify(value);
  assert.equal(/sk-|apiKey abc|secret abc|password abc|credential abc|身份证 123|护照 123|银行卡 123|https:\/\/example/i.test(json), false);
  assert.equal(value.safety.bookingUrl, null);
  assert.equal(value.safety.paymentUrl, null);
  assert.equal(value.safety.orderUrl, null);
}
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowSupportTriageDashboard.js"]).WeishanFlightWorkflowSupportTriageDashboard;
  assert.equal(api.FLIGHT_WORKFLOW_SUPPORT_TRIAGE_DASHBOARD_VERSION, "2.1.95");
  const cases = [
    ["candidate_unclear", "evidence_review"],
    ["platform_mismatch", "platform_check_review"],
    ["safety_copy_unclear", "safety_copy_review"],
    ["consent_blocked", "consent_review"],
    ["feedback_error", "feedback_flow_review"]
  ];
  for (const item of cases) {
    const dashboard = api.buildFlightWorkflowSupportTriageDashboard({ issueCategory:item[0] });
    assert.equal(dashboard.triage.triageId, item[1]);
  }
  const platform = api.buildFlightWorkflowSupportTriageDashboard({ issueCategory:"platform_mismatch" });
  assert.equal(platform.triage.affectsPilotExpansion, true);
  const safety = api.buildFlightWorkflowSupportTriageDashboard({ issueCategory:"safety_copy_unclear" });
  assert.equal(safety.triage.affectsPilotExpansion, true);
  const internal = api.buildFlightWorkflowSupportTriageDashboard({ supportFallbackRecommendation:{ status:"needs_review", recommendation:{ recommendationId:"internal_review" } } });
  assert.equal(internal.status, "needs_internal_review");
  assert.equal(internal.triage.requiresInternalReview, true);
  const blocked = api.buildFlightWorkflowSupportTriageDashboard({ issueReviewBoard:{ status:"blocked" } });
  assert.equal(blocked.status, "blocked");
  assertNoSensitive(blocked);
  assertNoSensitive(platform);
  console.log("FLIGHT_WORKFLOW_SUPPORT_TRIAGE_DASHBOARD PASS");
}
main();
