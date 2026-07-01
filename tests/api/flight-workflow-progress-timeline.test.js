const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function action(queue, id) { return queue.actions.find((item) => item.actionId === id); }
function current(timeline) { return timeline.steps.find((step) => step.status === "current"); }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowProgressTimeline.js"]);
  const api = windowRef.WeishanFlightWorkflowProgressTimeline;
  assert.equal(api.FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION, "3.4.0");
  const clarification = api.buildFlightWorkflowProgressTimeline({ status:"needs_clarification" });
  assert.equal(clarification.steps[0].status, "completed");
  assert.equal(current(clarification).stepId, "clarification");
  assert.equal(current(api.buildFlightWorkflowProgressTimeline({ status:"ready_for_evidence" })).stepId, "evidence");
  assert.equal(current(api.buildFlightWorkflowProgressTimeline({ status:"evidence_ready" })).stepId, "decision");
  assert.equal(current(api.buildFlightWorkflowProgressTimeline({ status:"provider_confirmation_ready" })).stepId, "provider_confirmation");
  assert.equal(current(api.buildFlightWorkflowProgressTimeline({ status:"awaiting_platform_check" })).stepId, "platform_check");
  const withLedger = api.buildFlightWorkflowProgressTimeline({ status:"evidence_ready", eventLedgerSummary:{ lastActionId:"run_read_only_quotes", lastActionStatus:"executed_local", lastActionMessage:"动作已执行" } });
  assert.equal(withLedger.lastActionId, "run_read_only_quotes");
  assert.equal(withLedger.lastActionMessage, "动作已执行");
  const blocked = api.buildFlightWorkflowProgressTimeline({ status:"blocked" });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedCount > 0);
  assert.equal(typeof blocked.completedCount, "number");
  assert.equal(typeof blocked.pendingCount, "number");
  assert.equal(blocked.safety.bookingUrl, null);
  const safeJson = JSON.stringify(api.buildFlightWorkflowProgressTimeline({ status:"evidence_ready", token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("FLIGHT_WORKFLOW_PROGRESS_TIMELINE PASS");
}
main();
