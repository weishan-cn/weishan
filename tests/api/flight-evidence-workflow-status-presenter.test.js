const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightEvidenceWorkflowStatusPresenter.js"]);
  const api = windowRef.WeishanFlightEvidenceWorkflowStatusPresenter;
  assert.equal(api.FLIGHT_EVIDENCE_WORKFLOW_STATUS_PRESENTER_VERSION, "3.6.0");
  const presenter = api.buildFlightEvidenceWorkflowStatusPresenter({ status:"ready", routeSummary:"上海 到 成都", tripSummary:"上海 到 成都 · 7月15日", workflowSteps:[{ id:"intent_normalized", status:"completed" }, { id:"top_candidates", status:"completed" }, { id:"handoff_readiness", status:"completed" }] });
  assert.equal(presenter.presenterName, "flight_evidence_workflow_status_presenter_v1");
  assert.equal(presenter.title, "机票请求工作流");
  assert.ok(presenter.steps.map((step) => step.label).includes("识别机票需求"));
  assert.ok(presenter.steps.map((step) => step.label).includes("生成 Top 3 候选"));
  assert.ok(JSON.stringify(presenter).includes("准备平台确认"));
  const clarification = api.buildFlightEvidenceWorkflowStatusPresenter({ status:"needs_clarification", clarificationQuestions:["请补充出发地。"] });
  assert.equal(clarification.workflowStatusLabel, "需要补充信息");
  const blocked = api.buildFlightEvidenceWorkflowStatusPresenter({ status:"blocked" });
  assert.equal(blocked.workflowStatusLabel, "已安全阻断");
  assert.equal(JSON.stringify(presenter).includes("https://"), false);
  console.log("FLIGHT_EVIDENCE_WORKFLOW_STATUS_PRESENTER_CORE PASS");
}
main();
