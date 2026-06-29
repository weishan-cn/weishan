const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotRolloutControlCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowCohortHealthDashboard.js",
    "apps/desktop/src/renderer/core/flightWorkflowSupportReadinessGate.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotOpsSummary.js",
    "apps/desktop/src/renderer/core/flightWorkflowNextCohortDecisionBoard.js"
  ]);
  const opsApi = windowRef.WeishanFlightWorkflowReadOnlyPilotOpsSummary;
  const decisionApi = windowRef.WeishanFlightWorkflowNextCohortDecisionBoard;
  const ops = opsApi.buildFlightWorkflowReadOnlyPilotOpsSummary({
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
  const ready = decisionApi.buildFlightWorkflowNextCohortDecisionBoard({
    pilotOpsSummary:ops,
    rolloutControlSummary:ops.rolloutControlSummary,
    cohortHealthSummary:ops.cohortHealthSummary,
    supportReadinessSummary:ops.supportReadinessSummary,
    issuePatternSummary:ops.issuePatternSummary,
    safetyRegressionSummary:ops.safetyRegressionSummary,
    noOpenBlockingIssue:true,
    noSensitiveDataRisk:true,
    noTradingRisk:true
  });
  assert.equal(decisionApi.FLIGHT_WORKFLOW_NEXT_COHORT_DECISION_BOARD_VERSION, "2.2.0");
  assert.equal(ready.status, "advance");
  assert.equal(ready.userFacingSummary.title, "下一批只读测试决策板");
  assert.equal(ready.userFacingSummary.resultLabel, "可以进入下一批只读测试");
  assert.equal(ready.decision.safeToAdvanceNextCohort, true);
  assert.equal(ready.decision.decisionId, "advance_next_cohort");
  assert.equal(ready.criteria.noSensitiveDataRisk, true);
  assert.equal(ready.criteria.noTradingRisk, true);
  assert.equal(ready.decisionRows.some((row) => row.label === "运营摘要"), true);
  assert.equal(ready.decisionRows.some((row) => row.label === "下一步"), true);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.checkoutUrl, null);
  assert.equal(ready.orderUrl, null);
  assert.equal(/https?:\/\/|abc|sk-|pk-|live_|prod_|身份证 123|护照 123|银行卡 123/i.test(JSON.stringify(ready)), false);
  const blocked = decisionApi.buildFlightWorkflowNextCohortDecisionBoard({
    pilotOpsSummary:ops,
    rolloutControlSummary:ops.rolloutControlSummary,
    cohortHealthSummary:ops.cohortHealthSummary,
    supportReadinessSummary:ops.supportReadinessSummary,
    issuePatternSummary:ops.issuePatternSummary,
    safetyRegressionSummary:{ status:"fail", redacted:true },
    noSensitiveDataRisk:true,
    noTradingRisk:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.decision.decisionId, "blocked");
  assert.equal(blocked.userFacingSummary.resultLabel, "已阻断");
  console.log("FLIGHT_WORKFLOW_NEXT_COHORT_DECISION_BOARD PASS");
}
main();
