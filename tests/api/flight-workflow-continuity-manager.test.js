const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowContinuityManager.js"]);
  const api = windowRef.WeishanFlightWorkflowContinuityManager;
  assert.equal(api.FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION, "2.2.6");
  const incomplete = api.buildFlightWorkflowContinuity({ flightIntentSummary:{ route:{ destinationCity:"成都" }, departureDate:"2026-07-15" }, missingFields:["origin"] });
  assert.equal(incomplete.status, "needs_clarification");
  assert.equal(incomplete.currentStage, "clarification");
  assert.equal(incomplete.resumePlan.nextStepLabel, "补充缺失信息");
  assert.equal(incomplete.resumePlan.canResume, true);
  const selected = api.buildFlightWorkflowContinuity({ flightIntentSummary:{ route:{ originCity:"上海", destinationCity:"成都" }, departureDate:"2026-07-15", directOnly:true, sortIntent:"lowest_price" }, selectedCandidate:{ rank:1, totalPrice:930, bookingUrl:"https://blocked.example" } });
  assert.equal(selected.status, "resumable");
  assert.equal(selected.currentStage, "decision");
  assert.equal(selected.resumePlan.nextStepLabel, "确认前往平台");
  assert.equal(JSON.stringify(selected).includes("https://blocked.example"), false);
  const platform = api.buildFlightWorkflowContinuity({ flightIntentSummary:{ route:{ originCity:"上海", destinationCity:"成都" }, departureDate:"2026-07-15" }, selectedCandidate:{ rank:1 }, handoffReceiptSummary:{ status:"confirmed", userConfirmed:true } });
  assert.equal(platform.status, "awaiting_platform_check");
  assert.equal(platform.currentStage, "platform_check");
  const audit = api.buildFlightWorkflowContinuityAuditDraft(selected);
  assert.equal(audit.bookingUrl, null);
  console.log("FLIGHT_WORKFLOW_CONTINUITY_MANAGER PASS");
}
main();
