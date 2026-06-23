const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafeSessionExportPreview.js"]);
  const api = windowRef.WeishanFlightWorkflowSafeSessionExportPreview;
  assert.equal(api.FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION, "2.1.67");
  const preview = api.buildFlightWorkflowSafeSessionExportPreview({ workflowStateSummary:{ workflowId:"wf1" }, currentStage:"decision", topCandidates:[{ providerName:"A", totalPrice:980, bookingUrl:null }], selectedCandidate:{ providerName:"A" }, auditReviewSummary:{ userFacingSummary:{ resultLabel:"安全检查通过" } } });
  assert.equal(preview.previewName, "flight_workflow_safe_session_export_preview_v1");
  assert.equal(preview.status, "ready");
  assert.equal(preview.canWriteFile, false);
  assert.equal(preview.canDownload, false);
  assert.equal(preview.sections.length, 4);
  assert.equal(preview.sections[0].title, "工作流摘要");
  assert.equal(preview.sections[1].title, "候选证据摘要");
  assert.equal(preview.sections[2].title, "安全审计摘要");
  assert.equal(preview.sections[3].title, "最终安全交接包预览");
  assert.equal(JSON.stringify(preview).includes("不包含证件、银行卡、登录凭据或密钥"), true);
  assert.equal(JSON.stringify(preview).includes("不包含付款、下单、出票链接"), true);
  const notReady = api.buildFlightWorkflowSafeSessionExportPreview({ topCandidates:[{ providerName:"A" }] });
  assert.equal(notReady.status, "not_ready");
  assert.equal(notReady.readiness.safeToPreview, false);
  assert.equal(api.buildFlightWorkflowSafeSessionExportPreview({ workflowStateSummary:{ workflowId:"wf1" }, rawProviderResponse:{ fare:1 } }).status, "blocked");
  assert.equal(api.buildFlightWorkflowSafeSessionExportPreview({ workflowStateSummary:{ workflowId:"wf1" }, token:"abc" }).status, "blocked");
  assert.equal(api.buildFlightWorkflowSafeSessionExportPreview({ workflowStateSummary:{ workflowId:"wf1" }, bookingUrl:"https://blocked.example" }).status, "blocked");
  assert.equal(api.buildFlightWorkflowSafeSessionExportPreview({ workflowStateSummary:{ workflowId:"wf1" }, passportNumber:"P123" }).status, "blocked");
  const blocked = api.buildFlightWorkflowSafeSessionExportPreview({ workflowStateSummary:{ workflowId:"wf1" }, rawUserText:"secret token abc", bookingUrl:"https://blocked.example" });
  assert.equal(blocked.status, "blocked");
  const safeJson = JSON.stringify(blocked);
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  assert.equal(safeJson.includes("canWriteFile\":false"), true);
  assert.equal(safeJson.includes("bookingUrl\":null"), true);
  console.log("FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW PASS");
}
main();
