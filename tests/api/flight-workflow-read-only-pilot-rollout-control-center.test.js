const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function json(value) { return JSON.stringify(value); }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotOpsSummary.js",
    "apps/desktop/src/renderer/core/flightWorkflowNextCohortDecisionBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotRolloutControlCenter.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowReadOnlyPilotRolloutControlCenter;
  assert.equal(api.FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER_VERSION, "4.0.9");
  const ready = api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter({ cohortProgressReady:true, milestoneReady:true, invitationReady:true, supportReady:true, issuePatternStable:true, safetySentinelPass:true, noOpenBlockingIssue:true, noSensitiveDataRisk:true, noTradingRisk:true, cohortProgressSummary:{ status:"ready", redacted:true }, trialMilestoneSummary:{ status:"ready", safeToAdvanceNextCohort:true, redacted:true }, pilotReadinessSnapshotSummary:{ status:"ready", redacted:true } });
  assert.equal(ready.status, "ready");
  assert.equal(ready.decision.decisionId, "advance_next_cohort");
  assert.equal(ready.decision.safeToAdvanceNextCohort, true);
  assert.equal(ready.rolloutHealth.cohortProgressReady, true);
  assert.equal(ready.blockedReasons.length, 0);
  assert.equal(ready.appVersion, "4.0.9");
  assert.ok(ready.pilotOpsStatus);
  assert.ok(ready.nextCohortDecisionStatus);
  assert.ok(ready.pilotOpsPrimaryRisk);
  const cohortIncomplete = api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter({ cohortProgressReady:false, milestoneReady:true, invitationReady:true, supportReady:true, issuePatternStable:true, safetySentinelPass:true, noOpenBlockingIssue:true, noSensitiveDataRisk:true, noTradingRisk:true });
  assert.equal(cohortIncomplete.status, "continue_current_batch");
  assert.equal(cohortIncomplete.decision.decisionId, "continue_current_batch");
  const unstable = api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter({ cohortProgressReady:true, milestoneReady:true, invitationReady:true, supportReady:true, issuePatternStable:false, safetySentinelPass:true, noOpenBlockingIssue:true, noSensitiveDataRisk:true, noTradingRisk:true });
  assert.equal(unstable.status, "pause_expansion");
  const supportReview = api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter({ cohortProgressReady:true, milestoneReady:true, invitationReady:true, supportReady:false, issuePatternStable:true, safetySentinelPass:true, noOpenBlockingIssue:true, noSensitiveDataRisk:true, noTradingRisk:true });
  assert.equal(supportReview.status, "needs_review");
  const sentinelBlocked = api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter({ safetySentinelPass:false, noSensitiveDataRisk:true, noTradingRisk:true });
  assert.equal(sentinelBlocked.status, "blocked");
  assert.ok(sentinelBlocked.blockedReasons.includes("safety_sentinel_failed"));
  const sensitiveBlocked = api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter({ safetySentinelPass:true, realNameStored:true, noTradingRisk:true });
  assert.equal(sensitiveBlocked.status, "blocked");
  assert.ok(sensitiveBlocked.blockedReasons.includes("sensitive_data_risk"));
  const tradingBlocked = api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter({ safetySentinelPass:true, noSensitiveDataRisk:true, payment:true });
  assert.equal(tradingBlocked.status, "blocked");
  assert.ok(tradingBlocked.blockedReasons.includes("trading_risk"));
  assert.equal(ready.safety.realNameStored, false);
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.paymentUrl, null);
  assert.equal(ready.safety.orderUrl, null);
  assert.equal(ready.safety.secretStored, false);
  assert.equal(/sk-|pk-|live_|prod_/i.test(json(ready)), false);
  assert.equal(api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter(null).status, "failed_safe");
  console.log("FLIGHT_WORKFLOW_READ_ONLY_PILOT_ROLLOUT_CONTROL_CENTER PASS");
}
main();
