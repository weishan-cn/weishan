const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowHumanReviewChecklist.js", "apps/desktop/src/renderer/core/flightWorkflowFinalSafeHandoffPacket.js"]);
  const api = windowRef.WeishanFlightWorkflowFinalSafeHandoffPacket;
  assert.equal(api.FLIGHT_WORKFLOW_FINAL_SAFE_HANDOFF_PACKET_VERSION, "2.1.80");
  const checklist = windowRef.WeishanFlightWorkflowHumanReviewChecklist.buildFlightWorkflowHumanReviewChecklist({ routeSummary:"上海 → 成都", departureDate:"2026-07-15", selectedCandidate:{ providerName:"sandbox" }, manualPlatformCheckSummary:{ status:"checked" } });
  const ready = api.buildFlightWorkflowFinalSafeHandoffPacket({ routeSummary:"上海 → 成都", departureDate:"2026-07-15", selectedCandidate:{ providerName:"sandbox" }, humanReviewChecklistSummary:checklist, bookingUrl:null, payment:false });
  assert.equal(ready.packetName, "flight_workflow_final_safe_handoff_packet_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.packetType, "redacted_platform_confirmation_packet");
  assert.equal(ready.canOpenExternalPlatform, false);
  assert.equal(ready.requiresUserConfirmation, true);
  assert.equal(JSON.stringify(ready.sections.map((s) => s.sectionId)), JSON.stringify(["trip_summary", "candidate_summary", "manual_check_summary", "safety_summary"]));
  assert.equal(JSON.stringify(ready).includes("平台页面结果为准"), true);
  const needs = api.buildFlightWorkflowFinalSafeHandoffPacket({ humanReviewChecklistSummary:{ status:"needs_review" } });
  assert.equal(needs.status, "needs_review");
  const blocked = api.buildFlightWorkflowFinalSafeHandoffPacket({ humanReviewChecklistSummary:checklist, checkoutUrl:"https://blocked.example", secret:"abc" });
  assert.equal(blocked.status, "blocked");
  const json = JSON.stringify(blocked);
  assert.equal(json.includes("https://blocked.example"), false);
  assert.equal(json.includes("abc"), false);
  assert.equal(api.buildFlightWorkflowFinalSafeHandoffPacket(null).status, "failed_safe");
  console.log("FLIGHT_WORKFLOW_FINAL_SAFE_HANDOFF_PACKET PASS");
}
main();
