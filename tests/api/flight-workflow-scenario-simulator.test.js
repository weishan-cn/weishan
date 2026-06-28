const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowScenarioFixtureBuilder.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafetyTestMatrixConsole.js",
    "apps/desktop/src/renderer/core/flightWorkflowScenarioSimulatorPresenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js",
    "apps/desktop/src/renderer/core/flightWorkflowAuditReviewCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowHumanReviewChecklist.js",
    "apps/desktop/src/renderer/core/flightWorkflowFinalSafeHandoffPacket.js",
    "apps/desktop/src/renderer/core/flightWorkflowHandoffPacketPolicyGuard.js",
    "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js",
    "apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js",
    "apps/desktop/src/renderer/core/flightWorkflowScenarioSimulator.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowScenarioSimulator;
  assert.equal(api.FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION, "2.1.86");
  const complete = api.runFlightWorkflowScenarioSimulation("complete_flight_request", { origin:"上海", destination:"成都", departureDate:"2026-07-15" });
  assert.equal(complete.status, "pass");
  assert.equal(complete.expectedOutcome, "pass");
  assert.equal(complete.redacted, true);
  assert.ok(complete.actualOutcome.includes("本地安全模拟"));
  const blocked = api.runFlightWorkflowScenarioSimulation("sensitive_input_blocked", { userInputText:"apiKey=SECRET 身份证 123456789012345678" });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.findings.includes("敏感输入已阻断。"));
  assert.equal(blocked.safety.bookingUrl, null);
  const suite = api.runFlightWorkflowScenarioSimulationSuite({});
  assert.equal(suite.results.length, 15);
  assert.equal(suite.summary.scenarioCount, 15);
  assert.ok(suite.summary.blockedCount >= 1);
  assert.equal(suite.matrixSummary.blockedCount >= 1, true);
  assert.equal(suite.presenter.title, "机票工作流场景模拟");
  assert.equal(suite.presenter.matrixSummaryLabel, "存在失败项");
  assert.equal(suite.safety.bookingUrl, null);
  const auditDraft = api.buildFlightWorkflowScenarioSimulatorAuditDraft({});
  assert.equal(auditDraft.eventType, "FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_AUDIT_DRAFT");
  assert.equal(auditDraft.scenarioCount, 15);
  assert.equal(auditDraft.bookingUrl, null);
  assert.equal(JSON.stringify(suite).includes("bookingUrl:https"), false);
  assert.equal(JSON.stringify(suite).includes("sk-live-blocked"), false);
  console.log("FLIGHT_WORKFLOW_SCENARIO_SIMULATOR PASS");
}
main();
