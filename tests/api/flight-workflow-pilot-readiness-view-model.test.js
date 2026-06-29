const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowBetaExpansionGate.js", "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPublicPilotChecklist.js", "apps/desktop/src/renderer/core/flightWorkflowPilotReadinessViewModel.js"]);
  const api = windowRef.WeishanFlightWorkflowPilotReadinessViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_PILOT_READINESS_VIEW_MODEL_VERSION, "2.2.0");
  const vm = api.buildFlightWorkflowPilotReadinessViewModel({ betaExpansionGateSummary:{ status:"approved", decision:{ label:"可以小范围扩大只读测试", safeToExpandReadOnlyBeta:true }, userFacingSummary:{ resultLabel:"可以小范围扩大只读测试" }, unmetCriteria:[], riskNotes:[], redacted:true }, publicPilotChecklistSummary:{ status:"ready", readiness:{ safeForSmallPublicPilot:true }, checklistItems:[{ itemId:"read_only_scope", label:"只读范围说明", status:"checked", message:"ok" }], blockedItems:[], userFacingSummary:{ resultLabel:"可以进入小范围只读试点" }, redacted:true } });
  assert.equal(vm.title, "只读公开试点准备状态");
  assert.equal(vm.status, "ready");
  assert.ok(vm.cards.some((x) => x.cardId === "expansion_gate"));
  assert.ok(vm.cards.some((x) => x.cardId === "pilot_checklist"));
  assert.ok(vm.cards.some((x) => x.cardId === "safety"));
  assert.ok(vm.cards.some((x) => x.cardId === "next_step"));
  assert.ok(vm.checklistRows.length >= 1);
  assert.ok(vm.riskRows.length >= 1);
  assert.match(vm.caveat, /公开试点仍然只覆盖只读候选证据流程/);
  assert.equal(vm.bookingUrl, null);
  assert.equal(vm.paymentUrl, null);
  assert.equal(vm.orderUrl, null);
  const json = JSON.stringify(api.buildFlightWorkflowPilotReadinessViewModel({ token:"abc123", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc123"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("FLIGHT_WORKFLOW_PILOT_READINESS_VIEW_MODEL PASS");
}
main();
