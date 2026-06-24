const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowPublicPilotReadinessSnapshot.js", "apps/desktop/src/renderer/core/flightWorkflowSupportPlaybookConsole.js", "apps/desktop/src/renderer/core/flightWorkflowPilotSnapshotViewModel.js"]);
  const api = windowRef.WeishanFlightWorkflowPilotSnapshotViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL_VERSION, "2.1.82");
  const model = api.buildFlightWorkflowPilotSnapshotViewModel({ pilotReadinessSnapshotSummary:{ status:"ready", userFacingSummary:{ resultLabel:"可以继续只读试点" }, rows:[{ rowId:"pilot", label:"试点状态", value:"可以继续只读试点", status:"pass" }], snapshotName:"flight_workflow_public_pilot_readiness_snapshot_v1", redacted:true }, supportPlaybookSummary:{ status:"ready", userFacingSummary:{ resultLabel:"支持处理路径已准备" }, playbookItems:[{ itemId:"candidate_unclear", issueLabel:"看不懂候选证据", actionLabel:"引导用户查看候选证据摘要", status:"pass", redacted:true }], forbiddenSupportActions:["代用户付款"], playbookName:"flight_workflow_support_playbook_console_v1", redacted:true }, issuePatternSummary:{ status:"ready", userFacingSummary:{ resultLabel:"暂无明显共性问题" }, patternSummary:{ message:"暂无明显共性问题" }, redacted:true }, supportReadinessSummary:{ status:"ready", redacted:true }, issueReviewSummary:{ status:"ready", redacted:true }, supportTriageSummary:{ status:"ready", redacted:true }, operatorConsoleSummary:{ status:"ready", redacted:true } });
  assert.equal(model.status, "ready");
  assert.equal(model.cards.length, 4);
  assert.equal(model.snapshotRows.length, 1);
  assert.equal(model.playbookRows.length, 1);
  assert.equal(model.forbiddenSupportRows.length, 1);
  assert.equal(model.snapshotName, "flight_workflow_public_pilot_readiness_snapshot_v1");
  assert.equal(model.playbookName, "flight_workflow_support_playbook_console_v1");
  assert.equal(JSON.stringify(model).includes("token"), false);
  console.log("FLIGHT_WORKFLOW_PILOT_SNAPSHOT_VIEW_MODEL PASS");
}
main();
