const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowHandoffPacketPolicyGuard.js"]);
  const api = windowRef.WeishanFlightWorkflowHandoffPacketPolicyGuard;
  assert.equal(api.FLIGHT_WORKFLOW_HANDOFF_PACKET_POLICY_GUARD_VERSION, "2.1.67");
  const allowed = api.evaluateFlightWorkflowHandoffPacketPolicy({ status:"ready", canOpenExternalPlatform:false, bookingUrl:null, payment:false });
  assert.equal(allowed.guardName, "flight_workflow_handoff_packet_policy_guard_v1");
  assert.equal(allowed.status, "allowed");
  assert.equal(allowed.policy.externalOpenForbiddenByDefault, true);
  const needs = api.evaluateFlightWorkflowHandoffPacketPolicy({ status:"needs_review" });
  assert.equal(needs.status, "needs_review");
  const blocked = api.evaluateFlightWorkflowHandoffPacketPolicy({ status:"ready", paymentUrl:"https://blocked.example", rawProviderResponse:{ token:"abc" }, ticketing:true });
  assert.equal(blocked.status, "blocked");
  const json = JSON.stringify(blocked);
  assert.equal(json.includes("https://blocked.example"), false);
  assert.equal(json.includes("abc"), false);
  assert.equal(api.evaluateFlightWorkflowHandoffPacketPolicy(null).status, "failed_safe");
  const draft = api.buildFlightWorkflowHandoffPacketPolicyGuardAuditDraft({ status:"ready" });
  assert.equal(draft.eventType, "FLIGHT_WORKFLOW_HANDOFF_PACKET_POLICY_GUARD_AUDIT_DRAFT");
  console.log("FLIGHT_WORKFLOW_HANDOFF_PACKET_POLICY_GUARD PASS");
}
main();
