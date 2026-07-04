const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyTestMatrixConsole.js", "apps/desktop/src/renderer/core/flightWorkflowScenarioSimulatorPresenter.js"]);
  const api = windowRef.WeishanFlightWorkflowScenarioSimulatorPresenter;
  assert.equal(api.FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_VERSION, "4.1.8");
  const results = [
    { scenarioId:"complete_flight_request", scenarioLabel:"完整机票请求", status:"pass", expectedOutcome:"pass", actualOutcome:"完整机票请求已完成本地安全模拟。" },
    { scenarioId:"illegal_payment_action", scenarioLabel:"非法付款动作", status:"blocked", expectedOutcome:"blocked", actualOutcome:"非法付款动作已阻断。" }
  ];
  const presenter = api.buildFlightWorkflowScenarioSimulatorPresenter({ results });
  assert.equal(presenter.presenterName, "flight_workflow_scenario_simulator_presenter_v1");
  assert.equal(presenter.title, "机票工作流场景模拟");
  assert.equal(presenter.status, "fail");
  assert.equal(presenter.statusCards.length, 4);
  assert.equal(presenter.rows.length, 2);
  assert.equal(presenter.failedRows.length, 1);
  assert.equal(presenter.matrixSummaryLabel, "存在失败项");
  assert.equal(presenter.caveat, "场景模拟仅用于安全回归，不代表真实票价、库存或可出票。");
  const statusCards = api.buildScenarioSimulationStatusCards({ results });
  assert.equal(statusCards[0].label, "场景数");
  assert.equal(statusCards[1].label, "通过");
  const auditDraft = api.buildFlightWorkflowScenarioSimulatorPresenterAuditDraft({ results });
  assert.equal(auditDraft.eventType, "FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER_AUDIT_DRAFT");
  assert.equal(auditDraft.failedRowCount, 1);
  assert.equal(auditDraft.bookingUrl, null);
  assert.equal(JSON.stringify(presenter).includes("token"), false);
  console.log("FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_PRESENTER PASS");
}
main();
