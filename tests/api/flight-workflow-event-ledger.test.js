const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function storage() { const data = {}; return { getItem:(key) => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null, setItem:(key, value) => { data[key] = String(value); }, removeItem:(key) => { delete data[key]; }, data }; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowEventLedger.js"]);
  const api = windowRef.WeishanFlightWorkflowEventLedger;
  assert.equal(api.FLIGHT_WORKFLOW_EVENT_LEDGER_VERSION, "2.1.91");
  const store = storage();
  const appended = api.appendFlightWorkflowEvent({ eventType:"action_executed", actionId:"run_read_only_quotes", actionLabel:"运行只读报价", status:"executed_local", rawProviderResponse:{ token:"abc" }, bookingUrl:"https://blocked.example" }, store);
  assert.equal(appended.status, "appended");
  assert.equal(appended.event.eventName, "flight_workflow_event_entry_v1");
  assert.equal(appended.event.safety.bookingUrl, null);
  const loaded = api.loadFlightWorkflowEventLedger(store);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].eventId, "deterministic-flight-workflow-event-v2.1.91-1");
  const summary = api.buildFlightWorkflowEventLedgerSummary(loaded);
  assert.equal(summary.title, "事件记录");
  assert.equal(summary.lastActionId, "run_read_only_quotes");
  assert.equal(appended.event.redactionSummary.rawUserTextStored, false);
  assert.ok(Array.isArray(appended.event.auditFindingHints));
  assert.equal(appended.event.exportSafeSummary.canWriteFile, false);
  assert.ok(appended.event.riskBadgeHints.includes("只读安全"));
  store.setItem(api.STORAGE_KEY, "not-json");
  assert.equal(api.loadFlightWorkflowEventLedger(store).length, 0);
  const safeJson = JSON.stringify(appended);
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  assert.equal(safeJson.includes("bookingUrl\":null"), true);
  console.log("FLIGHT_WORKFLOW_EVENT_LEDGER PASS");
}
main();
