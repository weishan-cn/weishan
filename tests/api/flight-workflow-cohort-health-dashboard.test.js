const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load("apps/desktop/src/renderer/core/flightWorkflowCohortHealthDashboard.js").WeishanFlightWorkflowCohortHealthDashboard;
  assert.equal(api.FLIGHT_WORKFLOW_COHORT_HEALTH_DASHBOARD_VERSION, "2.1.81");
  assert.equal(api.buildFlightWorkflowCohortHealthDashboard({}).status, "in_progress");
  assert.equal(api.buildFlightWorkflowCohortHealthDashboard({ testerSlotCount:5, consentCompletionRatio:0.5, feedbackCompletionRatio:1, issueResolutionRatio:1 }).status, "in_progress");
  assert.equal(api.buildFlightWorkflowCohortHealthDashboard({ testerSlotCount:5, consentCompletionRatio:1, feedbackCompletionRatio:0.4, issueResolutionRatio:1 }).status, "in_progress");
  assert.equal(api.buildFlightWorkflowCohortHealthDashboard({ testerSlotCount:5, consentCompletionRatio:1, feedbackCompletionRatio:1, issueResolutionRatio:0.5, openIssueCount:1 }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowCohortHealthDashboard({ testerSlotCount:5, consentCompletionRatio:1, feedbackCompletionRatio:1, issueResolutionRatio:1, blockedSlotCount:1 }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowCohortHealthDashboard({ testerSlotCount:5, realIdentityRisk:true }).status, "blocked");
  assert.equal(api.buildFlightWorkflowCohortHealthDashboard({ testerSlotCount:5, consentCompletionRatio:1, feedbackCompletionRatio:1, issueResolutionRatio:1, sensitiveRiskCount:1 }).status, "needs_review");
  const healthy = api.buildFlightWorkflowCohortHealthDashboard({ testerSlotCount:5, eligibleSlotCount:5, consentCompletionRatio:0.9, feedbackCompletionRatio:0.8, issueResolutionRatio:1, blockedSlotCount:0, sensitiveRiskCount:0, realIdentityRisk:false });
  assert.equal(healthy.status, "healthy");
  assert.equal(healthy.cohortHealth.healthyEnoughForNextCohort, true);
  assert.equal(healthy.safety.realNameStored, false);
  assert.equal(healthy.safety.secretStored, false);
  assert.equal(/sk-|pk-|live_|prod_/i.test(JSON.stringify(healthy)), false);
  assert.equal(healthy.safety.bookingUrl, null);
  console.log("FLIGHT_WORKFLOW_COHORT_HEALTH_DASHBOARD PASS");
}
main();
