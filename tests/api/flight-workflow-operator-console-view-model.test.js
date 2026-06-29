const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js", "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js", "apps/desktop/src/renderer/core/flightWorkflowOperatorConsoleViewModel.js"]);
  const api = windowRef.WeishanFlightWorkflowOperatorConsoleViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VIEW_MODEL_VERSION, "2.1.97");
  const model = api.buildFlightWorkflowOperatorConsoleViewModel({ workflowId:"wf1", workflowStateSummary:{ workflowId:"wf1" }, topCandidates:[{ providerName:"sandbox" }], auditReviewSummary:{ status:"ready", auditHealth:{ overall:"pass" } }, humanReviewChecklistSummary:{ status:"ready" }, finalSafeHandoffPacketSummary:{ status:"ready" }, handoffPacketPolicyDecision:{ status:"allowed" }, safetyRegressionSummary:{ status:"pass", checks:[{ checkId:"no_trading_urls", label:"无交易链接", status:"pass" }] }, eventLedgerSummary:{ recentEvents:[{ eventType:"handoff_packet_prepared", status:"ready" }] }, blockedActions:[{ actionId:"payment", label:"付款" }] });
  assert.equal(model.viewModelName, "flight_workflow_operator_console_view_model_v1");
  assert.equal(model.title, "机票工作流运营控制台");
  assert.ok(model.statusCards.some((card) => card.cardId === "workflow"));
  assert.ok(model.statusCards.some((card) => card.cardId === "safety"));
  assert.ok(model.statusCards.some((card) => card.cardId === "handoff"));
  assert.ok(model.recentEventRows.length >= 1);
  assert.ok(model.blockedActionRows.length >= 1);
  assert.ok(model.nextActionLabel);
  assert.equal(model.caveat, "唯珊只提供只读候选证据，不付款、不下单、不出票。");
  assert.equal(model.bookingUrl, null);
  const json = JSON.stringify(api.buildFlightWorkflowOperatorConsoleViewModel({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("FLIGHT_WORKFLOW_OPERATOR_CONSOLE_VIEW_MODEL PASS");
}
main();
