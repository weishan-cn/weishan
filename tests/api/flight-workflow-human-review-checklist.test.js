const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowHumanReviewChecklist.js"]);
  const api = windowRef.WeishanFlightWorkflowHumanReviewChecklist;
  assert.equal(api.FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST_VERSION, "2.2.3");
  const ready = api.buildFlightWorkflowHumanReviewChecklist({ routeSummary:"上海 → 成都", departureDate:"2026-07-15", selectedCandidate:{ providerName:"sandbox" }, manualPlatformCheckSummary:{ status:"checked" }, auditReviewSummary:{ status:"ready" }, bookingUrl:null, payment:false, order:false });
  assert.equal(ready.checklistName, "flight_workflow_human_review_checklist_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "前往平台前请人工复核");
  assert.equal(ready.userFacingSummary.line, "可以进入平台确认");
  assert.ok(ready.checkedItems.length >= 5);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.payment, false);
  const needs = api.buildFlightWorkflowHumanReviewChecklist({ routeSummary:"上海 → 成都", selectedCandidate:{ providerName:"sandbox" }, manualPlatformCheckSummary:{ status:"mismatch", line:"平台结果与候选证据存在差异" } });
  assert.equal(needs.status, "needs_review");
  assert.ok(JSON.stringify(needs).includes("平台结果与候选证据存在差异"));
  const blocked = api.buildFlightWorkflowHumanReviewChecklist({ routeSummary:"上海 → 成都", departureDate:"2026-07-15", selectedCandidate:{}, manualPlatformCheckSummary:{}, bookingUrl:"https://blocked.example", token:"abc" });
  assert.equal(blocked.status, "blocked");
  const json = JSON.stringify(blocked);
  assert.equal(json.includes("https://blocked.example"), false);
  assert.equal(json.includes("abc"), false);
  assert.equal(api.buildFlightWorkflowHumanReviewChecklist(null).status, "failed_safe");
  console.log("FLIGHT_WORKFLOW_HUMAN_REVIEW_CHECKLIST PASS");
}
main();
