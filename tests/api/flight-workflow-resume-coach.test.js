const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowContinuityManager.js", "apps/desktop/src/renderer/core/flightWorkflowResumeCoach.js"]);
  const api = windowRef.WeishanFlightWorkflowResumeCoach;
  assert.equal(api.FLIGHT_WORKFLOW_RESUME_COACH_VERSION, "2.1.68");
  const coach = api.buildFlightWorkflowResumeCoach({ flightIntentSummary:{ route:{ originCity:"上海", destinationCity:"成都" }, departureDate:"2026-07-15" }, selectedCandidate:{ rank:1 } });
  assert.equal(coach.status, "ready");
  assert.ok(coach.allowedActions.map(a => a.label).includes("前往平台确认"));
  assert.ok(coach.forbiddenActions.includes("付款"));
  assert.ok(coach.caveat.includes("不付款、不下单、不出票"));
  assert.equal(coach.bookingUrl, null);
  const blocked = api.buildFlightWorkflowResumeCoach({ status:"blocked" });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.allowedActions.length, 0);
  const audit = api.buildFlightWorkflowResumeCoachAuditDraft(coach);
  assert.equal(audit.payment, false);
  console.log("FLIGHT_WORKFLOW_RESUME_COACH PASS");
}
main();
