const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotRolloutControlCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowCohortHealthDashboard.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotOpsSummary.js",
    "apps/desktop/src/renderer/core/flightWorkflowNextCohortDecisionBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowRolloutControlViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowRolloutControlViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_ROLLOUT_CONTROL_VIEW_MODEL_VERSION, "3.5.0");
  const vmModel = api.buildFlightWorkflowRolloutControlViewModel({ cohortProgressReady:true, milestoneReady:true, invitationReady:true, supportReady:true, issuePatternStable:true, safetySentinelPass:true, noOpenBlockingIssue:true, noSensitiveDataRisk:true, noTradingRisk:true, testerSlotCount:5, eligibleSlotCount:5, consentCompletionRatio:0.9, feedbackCompletionRatio:0.8, issueResolutionRatio:1 });
  assert.equal(vmModel.title, "只读试点发布控制中心");
  assert.equal(vmModel.cards.some((card) => card.cardId === "rollout" && card.label === "发布控制"), true);
  assert.equal(vmModel.cards.some((card) => card.cardId === "cohort_health" && card.label === "批次健康"), true);
  assert.equal(vmModel.cards.some((card) => card.cardId === "pilot_ops" && card.label === "试点运营摘要"), true);
  assert.equal(vmModel.cards.some((card) => card.cardId === "next_cohort" && card.label === "下一批决策"), true);
  assert.equal(vmModel.cards.some((card) => card.cardId === "issues" && card.label === "问题风险"), true);
  assert.equal(vmModel.cards.some((card) => card.cardId === "next_step" && card.label === "下一步"), true);
  assert.ok(vmModel.rolloutRows.length > 0);
  assert.ok(vmModel.cohortHealthRows.length > 0);
  assert.ok(vmModel.riskRows.length > 0);
  assert.ok(vmModel.caveat.includes("不保存真实身份、不发送真实邀请、不提供交易能力"));
  assert.equal(vmModel.bookingUrl, null);
  assert.equal(vmModel.paymentUrl, null);
  assert.equal(vmModel.orderUrl, null);
  assert.equal(/sk-|pk-|live_|prod_/i.test(JSON.stringify(vmModel)), false);
  console.log("FLIGHT_WORKFLOW_ROLLOUT_CONTROL_VIEW_MODEL PASS");
}
main();
