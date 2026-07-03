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
    "apps/desktop/src/renderer/core/flightWorkflowNextCohortDecisionBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOpsViewModel.js"
  ]);
  const opsApi = windowRef.WeishanFlightWorkflowReadOnlyPilotOpsSummary;
  const decisionApi = windowRef.WeishanFlightWorkflowNextCohortDecisionBoard;
  const api = windowRef.WeishanFlightWorkflowPilotOpsViewModel;
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
  const decision = decisionApi.buildFlightWorkflowNextCohortDecisionBoard({
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
  assert.equal(api.FLIGHT_WORKFLOW_PILOT_OPS_VIEW_MODEL_VERSION, "4.1.1");
  const vmModel = api.buildFlightWorkflowPilotOpsViewModel({
    pilotOpsSummary:ops,
    nextCohortDecisionSummary:decision,
    rolloutControlSummary:ops.rolloutControlSummary,
    cohortHealthSummary:ops.cohortHealthSummary,
    supportReadinessSummary:ops.supportReadinessSummary,
    issuePatternSummary:ops.issuePatternSummary,
    safetyRegressionSummary:ops.safetyRegressionSummary
  });
  assert.equal(vmModel.title, "只读试点运营摘要");
  assert.equal(vmModel.cards.some((card) => card.cardId === "ops" && card.label === "运营状态"), true);
  assert.equal(vmModel.cards.some((card) => card.cardId === "next_cohort" && card.label === "下一批决策"), true);
  assert.equal(vmModel.cards.some((card) => card.cardId === "risk" && card.label === "主要风险"), true);
  assert.equal(vmModel.opsRows.some((row) => row.label === "运营状态"), true);
  assert.equal(vmModel.decisionRows.some((row) => row.label === "下一步"), true);
  assert.equal(vmModel.riskRows.some((row) => row.label === "主要风险"), true);
  assert.equal(vmModel.pilotOpsSummary.status, "healthy");
  assert.equal(vmModel.nextCohortDecisionSummary.status, "advance");
  assert.equal(vmModel.bookingUrl, null);
  assert.equal(/https?:\/\/|abc|sk-|pk-|live_|prod_|身份证 123|护照 123|银行卡 123/i.test(JSON.stringify(vmModel)), false);
  console.log("FLIGHT_WORKFLOW_PILOT_OPS_VIEW_MODEL PASS");
}
main();
