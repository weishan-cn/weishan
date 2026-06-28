const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function accepted() { return { acceptedItems:{ read_only_scope:true, platform_final:true, no_transaction:true, no_identity_upload:true, feedback_redacted:true } }; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js"]).WeishanFlightWorkflowReadOnlyUserConsentFlow;
  assert.equal(api.FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW_VERSION, "2.1.96");
  assert.equal(api.buildFlightWorkflowReadOnlyUserConsentFlow({}).status, "not_started");
  assert.equal(api.buildFlightWorkflowReadOnlyUserConsentFlow({ acceptedItems:{ read_only_scope:true } }).status, "in_progress");
  assert.equal(api.buildFlightWorkflowReadOnlyUserConsentFlow({ started:true }).status, "missing_required_items");
  const model = api.buildFlightWorkflowReadOnlyUserConsentFlow(accepted());
  assert.equal(model.status, "accepted");
  assert.equal(model.consentSummary.allRequiredAccepted, true);
  const ids = model.consentItems.map((item) => item.itemId);
  assert.ok(ids.includes("read_only_scope"));
  assert.ok(ids.includes("platform_final"));
  assert.ok(ids.includes("no_transaction"));
  assert.ok(ids.includes("no_identity_upload"));
  assert.ok(ids.includes("feedback_redacted"));
  assert.equal(model.userFacingSummary.caveat.includes("不代表交易授权"), true);
  assert.equal(api.buildFlightWorkflowReadOnlyUserConsentFlow({ feedbackText:"我的护照是 E12345678" }).status, "blocked");
  const secretJson = JSON.stringify(api.buildFlightWorkflowReadOnlyUserConsentFlow({ userText:"token=abc123 apiKey=hidden secret=value" }));
  assert.equal(secretJson.includes("abc123"), false);
  assert.equal(secretJson.includes("hidden"), false);
  assert.equal(model.bookingUrl, null);
  assert.equal(model.safety.bookingUrl, null);
  assert.equal(JSON.stringify(model).includes("paymentUrl\":\"http"), false);
  console.log("FLIGHT_WORKFLOW_READ_ONLY_USER_CONSENT_FLOW PASS");
}
main();
