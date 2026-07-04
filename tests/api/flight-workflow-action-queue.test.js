const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function action(queue, id) { return queue.actions.find((item) => item.actionId === id); }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowContinuityManager.js", "apps/desktop/src/renderer/core/flightWorkflowActionQueue.js"]);
  const api = windowRef.WeishanFlightWorkflowActionQueue;
  assert.equal(api.FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION, "4.1.8");
  assert.equal(action(api.buildFlightWorkflowActionQueue({ status:"needs_clarification" }), "answer_clarification").enabled, true);
  assert.equal(action(api.buildFlightWorkflowActionQueue({ status:"ready_for_evidence" }), "run_read_only_quotes").enabled, true);
  assert.equal(action(api.buildFlightWorkflowActionQueue({ status:"evidence_ready" }), "select_candidate").enabled, true);
  const handoff = api.buildFlightWorkflowActionQueue({ status:"provider_confirmation_ready" });
  assert.equal(action(handoff, "open_provider_confirmation").enabled, true);
  assert.equal(action(handoff, "open_provider_confirmation").requiresUserConfirmation, true);
  assert.equal(action(api.buildFlightWorkflowActionQueue({ status:"awaiting_platform_check" }), "record_platform_check").enabled, true);
  const withLedger = api.buildFlightWorkflowActionQueue({ status:"evidence_ready", eventLedgerSummary:{ lastActionId:"select_candidate", lastActionStatus:"executed_local", lastActionMessage:"动作已执行", totalEvents:2 } });
  assert.equal(action(withLedger, "view_audit_preview").enabled, true);
  assert.equal(action(withLedger, "blocked_action").enabled, false);
  assert.equal(withLedger.lastActionId, "select_candidate");
  assert.equal(withLedger.lastActionMessage, "动作已执行");
  assert.equal(action(api.buildFlightWorkflowActionQueue({ status:"provider_confirmation_ready", recoverySummary:{ status:"loaded", state:{ currentStage:"decision" } } }), "resume_workflow").enabled, true);
  const blocked = api.buildFlightWorkflowActionQueue({ status:"blocked" });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.actions.every((item) => item.enabled === false));
  assert.ok(blocked.blockedActions.map((item) => item.label).includes("付款"));
  assert.ok(blocked.blockedActions.map((item) => item.label).includes("下单"));
  assert.ok(blocked.blockedActions.map((item) => item.label).includes("出票"));
  assert.ok(blocked.blockedActions.map((item) => item.label).includes("上传证件或银行卡"));
  assert.equal(blocked.safety.bookingUrl, null);
  const safeJson = JSON.stringify(api.buildFlightWorkflowActionQueue({ status:"provider_confirmation_ready", token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("FLIGHT_WORKFLOW_ACTION_QUEUE PASS");
}
main();
