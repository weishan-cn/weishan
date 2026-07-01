const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowUiPresenter.js"]);
  const api = windowRef.WeishanFlightWorkflowUiPresenter;
  assert.equal(api.FLIGHT_WORKFLOW_UI_PRESENTER_VERSION, "3.4.0");
  const presenter = api.buildFlightWorkflowUiPresenter({ workflowStateSummary:{ status:"needs_clarification", clarificationQuestions:["从哪里出发？", "到哪里？"] } });
  assert.equal(presenter.title, "机票请求工作流");
  assert.equal(presenter.currentStepLabel, "补充缺失信息");
  assert.equal(presenter.workflowStageLabel, "当前工作流阶段");
  assert.equal(presenter.nextStepTitle, "下一步");
  assert.equal(presenter.resumeActionTitle, "可继续操作");
  assert.equal(presenter.recoveryActionLabel, "恢复上次机票工作流");
  assert.equal(presenter.userMessage, "需要补充信息。信息完整后再生成候选证据。");
  assert.ok(presenter.stepList.map((step) => step.label).includes("生成候选证据"));
  assert.equal(presenter.primaryAction, "补充缺失信息");
  assert.ok(presenter.safetyCaveat.includes("不付款、不下单、不出票"));
  const ready = api.buildFlightWorkflowUiPresenter({ workflowStateSummary:{ status:"evidence_ready" } });
  assert.equal(ready.userMessage, "候选证据已生成，平台最终为准。");
  assert.equal(ready.stepList.find((step) => step.stepId === "evidence").status, "completed");
  const blocked = api.buildFlightWorkflowUiPresenter({ workflowStateSummary:{ status:"blocked" } });
  assert.equal(blocked.stepList.find((step) => step.stepId === "evidence").status, "skipped");
  const audit = api.buildFlightWorkflowUiPresenterAuditDraft(presenter);
  assert.equal(audit.rawResponseStored, false);
  console.log("FLIGHT_WORKFLOW_UI_PRESENTER PASS");
}
main();
