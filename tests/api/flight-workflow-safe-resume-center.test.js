const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function action(queue, id) { return queue.actions.find((item) => item.actionId === id); }
function memoryStorage(raw) { const store = new Map(); if (raw != null) store.set("weishan.flightWorkflowRecovery.v1", raw); return { getItem:k => store.has(k) ? store.get(k) : null, setItem:(k,v) => store.set(k, String(v)), removeItem:k => store.delete(k) }; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowContinuityManager.js", "apps/desktop/src/renderer/core/flightWorkflowRecoveryStore.js", "apps/desktop/src/renderer/core/flightWorkflowSafeResumeCenter.js"]);
  const api = windowRef.WeishanFlightWorkflowSafeResumeCenter;
  assert.equal(api.FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_VERSION, "2.1.97");
  assert.equal(api.buildFlightWorkflowSafeResumeCenter({}).status, "unavailable");
  const recoveryState = { workflowId:"wf1", status:"resumable", currentStage:"decision", stageLabel:"选择候选", selectedCandidate:{ rank:1, token:"abc", bookingUrl:"https://blocked.example" }, collectedSummary:{ routeReady:true, dateReady:true, selectedCandidateReady:true }, missingFields:[] };
  const available = api.buildFlightWorkflowSafeResumeCenter({ recoverySummary:{ status:"loaded", state:recoveryState } });
  assert.equal(available.status, "available");
  assert.equal(available.actions.canResume, true);
  assert.equal(available.actions.autoResume, false);
  assert.equal(available.actions.autoOpen, false);
  assert.equal(available.safety.bookingUrl, null);
  assert.equal(/abc|https?:/i.test(JSON.stringify(available)), false);
  assert.equal(api.buildFlightWorkflowSafeResumeCenter({ recoverySummary:{ status:"empty", reason:"corrupted_storage" } }).status, "failed_safe");
  assert.equal(api.buildFlightWorkflowSafeResumeCenter({ recoverySummary:{ status:"loaded", state:{ status:"blocked" } } }).status, "blocked");
  const withLedger = api.buildFlightWorkflowSafeResumeCenter({ recoverySummary:{ status:"loaded", state:recoveryState }, eventLedgerSummary:{ lastActionId:"resume_workflow", lastActionStatus:"executed_local", lastActionMessage:"动作已执行" } });
  assert.equal(withLedger.lastActionId, "resume_workflow");
  assert.equal(withLedger.lastActionMessage, "动作已执行");
  const storageCenter = api.buildFlightWorkflowSafeResumeCenter({ storageLike:memoryStorage(JSON.stringify({ recoveryName:"flight_workflow_recovery_state_v1", storageSchemaVersion:1, state:recoveryState })) });
  assert.equal(storageCenter.status, "available");
  console.log("FLIGHT_WORKFLOW_SAFE_RESUME_CENTER PASS");
}
main();
