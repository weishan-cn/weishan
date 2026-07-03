const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowActionPolicyGuard.js"]);
  const api = windowRef.WeishanFlightWorkflowActionPolicyGuard;
  assert.equal(api.FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_VERSION, "4.1.5");
  const local = api.evaluateFlightWorkflowActionPolicy({ actionId:"run_read_only_quotes", actionLabel:"运行只读报价" }, {});
  assert.equal(local.status, "allowed");
  assert.equal(local.actionType, "local_only");
  assert.equal(local.safety.bookingUrl, null);
  assert.equal(local.redactionSummary.rawUserTextStored, false);
  assert.equal(local.exportSafeSummary.canWriteFile, false);
  assert.ok(local.riskBadgeHints.includes("只读安全"));
  const confirmation = api.evaluateFlightWorkflowActionPolicy({ actionId:"open_provider_confirmation" }, {});
  assert.equal(confirmation.status, "requires_confirmation");
  assert.equal(confirmation.reason, "外部平台操作需要二次确认。");
  const blocked = api.evaluateFlightWorkflowActionPolicy({ actionId:"pay_order", actionLabel:"付款" }, {});
  assert.equal(blocked.status, "failed_safe");
  const explicitBlocked = api.evaluateFlightWorkflowActionPolicy({ actionId:"blocked_action", actionLabel:"付款" }, {});
  assert.equal(explicitBlocked.status, "blocked");
  const safeJson = JSON.stringify(api.buildFlightWorkflowActionPolicyGuardAuditDraft({ action:{ actionId:"blocked_action", token:"abc", bookingUrl:"https://blocked.example" } }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  assert.equal(safeJson.includes("bookingUrl\":null"), true);
  console.log("FLIGHT_WORKFLOW_ACTION_POLICY_GUARD PASS");
}
main();
