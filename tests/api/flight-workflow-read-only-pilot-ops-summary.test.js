const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load([
    "apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotRolloutControlCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowCohortHealthDashboard.js",
    "apps/desktop/src/renderer/core/flightWorkflowSupportReadinessGate.js",
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotReadinessSnapshot.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotOpsSummary.js"
  ]).WeishanFlightWorkflowReadOnlyPilotOpsSummary;
  assert.equal(api.FLIGHT_WORKFLOW_READ_ONLY_PILOT_OPS_SUMMARY_VERSION, "2.2.6");
  const summary = api.buildFlightWorkflowReadOnlyPilotOpsSummary({
    rolloutControlSummary:{ status:"ready", decision:{ safeToAdvanceNextCohort:true }, redacted:true },
    cohortHealthSummary:{ status:"healthy", cohortHealth:{ healthyEnoughForNextCohort:true }, redacted:true },
    cohortProgressSummary:{ status:"ready", redacted:true },
    trialMilestoneSummary:{ status:"ready", safeToAdvanceNextCohort:true, redacted:true },
    pilotReadinessSnapshotSummary:{ status:"ready", redacted:true },
    supportReadinessSummary:{ status:"ready", redacted:true },
    issuePatternSummary:{ status:"ready", redacted:true },
    safetyRegressionSummary:{ status:"pass", redacted:true },
    noSensitiveDataRisk:true,
    noTradingRisk:true
  });
  assert.equal(summary.status, "healthy");
  assert.equal(summary.userFacingSummary.title, "只读试点运营摘要");
  assert.equal(summary.userFacingSummary.resultLabel, "试点运行健康");
  assert.equal(summary.rows.some((row) => row.label === "运营状态"), true);
  assert.equal(summary.rows.some((row) => row.label === "主要风险" && row.value === "无主要风险"), true);
  assert.equal(summary.primaryRisk.riskId, "none");
  assert.equal(summary.opsHealth.safeToAdvanceNextCohort, true);
  assert.equal(summary.pilotOpsStatus, "healthy");
  assert.equal(summary.nextCohortDecisionStatus, "advance");
  assert.equal(summary.bookingUrl, null);
  assert.equal(summary.paymentUrl, null);
  assert.equal(summary.orderUrl, null);
  assert.equal(summary.safety.secretStored, false);
  assert.equal(/https?:\/\/|sk-|pk-|live_|prod_|abc/i.test(JSON.stringify(summary)), false);
  const blocked = api.buildFlightWorkflowReadOnlyPilotOpsSummary({
    rolloutControlSummary:{ status:"ready", decision:{ safeToAdvanceNextCohort:true }, redacted:true },
    cohortHealthSummary:{ status:"healthy", cohortHealth:{ healthyEnoughForNextCohort:true }, redacted:true },
    supportReadinessSummary:{ status:"ready", redacted:true },
    issuePatternSummary:{ status:"ready", redacted:true },
    safetyRegressionSummary:{ status:"fail", redacted:true }
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.primaryRisk.riskId, "unknown");
  console.log("FLIGHT_WORKFLOW_READ_ONLY_PILOT_OPS_SUMMARY PASS");
}
main();
