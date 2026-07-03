const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function storage() { const data = {}; return { getItem:(key) => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null, setItem:(key, value) => { data[key] = String(value); }, removeItem:(key) => { delete data[key]; }, data }; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowActionPolicyGuard.js", "apps/desktop/src/renderer/core/flightWorkflowEventLedger.js", "apps/desktop/src/renderer/core/flightWorkflowSafeActionExecutionRouter.js"]);
  const api = windowRef.WeishanFlightWorkflowSafeActionExecutionRouter;
  assert.equal(api.FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER_VERSION, "4.0.6");
  const store = storage();
  const local = api.routeFlightWorkflowSafeAction({ actionId:"run_read_only_quotes", actionLabel:"运行只读报价" }, { storageLike:store, rawText:"secret token abc" });
  assert.equal(local.status, "executed_local");
  assert.equal(local.result.actionMessage, "动作已执行");
  assert.equal(local.safety.bookingUrl, null);
  assert.equal(local.redactionSummary.rawUserTextStored, false);
  assert.equal(local.exportSafeSummary.canWriteFile, false);
  assert.ok(local.riskBadgeHints.includes("只读安全"));
  assert.equal(local.eventLedgerSummary.totalEvents, 2);
  const confirmation = api.routeFlightWorkflowSafeAction({ actionId:"open_provider_confirmation", actionLabel:"前往平台确认" }, { storageLike:store });
  assert.equal(confirmation.status, "confirmation_required");
  assert.equal(confirmation.confirmation.required, true);
  assert.equal(confirmation.confirmation.title, "需要确认后继续");
  const blocked = api.routeFlightWorkflowSafeAction({ actionId:"blocked_action", actionLabel:"付款" }, { storageLike:store });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.result.actionMessage, "动作已被安全阻断");
  const unknown = api.evaluateFlightWorkflowSafeAction({ actionId:"unknown_action" }, {});
  assert.equal(unknown.status, "failed_safe");
  const safeJson = JSON.stringify(api.buildFlightWorkflowSafeActionExecutionAuditDraft({ action:{ actionId:"run_read_only_quotes", bookingUrl:"https://blocked.example", token:"abc" } }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  assert.equal(safeJson.includes("bookingUrl\":null"), true);
  console.log("FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER PASS");
}
main();
