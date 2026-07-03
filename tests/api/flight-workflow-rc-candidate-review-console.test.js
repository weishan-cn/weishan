const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowRcCandidateReviewConsole.js"]);
  const api = windowRef.WeishanFlightWorkflowRcCandidateReviewConsole;
  assert.equal(api.FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE_VERSION, "4.1.2");
  const ready = api.buildFlightWorkflowRcCandidateReviewConsole({
    freezeGateReady:true,
    evidenceFreezePackReady:true,
    launchCandidateReady:true,
    pilotExitCriteriaMet:true,
    safetySentinelPass:true,
    releaseReadinessReady:true,
    noSensitiveDataRisk:true,
    noTradingRisk:true,
    noSecretRisk:true,
    noExternalOpenRisk:true
  });
  assert.equal(ready.status, "ready_for_review");
  assert.equal(ready.reviewDecision.label, "可以开始 RC 复核");
  assert.equal(ready.safeToStartRcReview, true);
  assert.equal(ready.safety.bookingUrl, null);
  const blocked = api.buildFlightWorkflowRcCandidateReviewConsole({ payment:true });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("trading_risk"), true);
  const audit = api.buildFlightWorkflowRcCandidateReviewConsoleAuditDraft({ token:"abc", freezeGateReady:true });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE_AUDIT_DRAFT");
  assert.equal(JSON.stringify(audit).includes("abc"), false);
  console.log("FLIGHT_WORKFLOW_RC_CANDIDATE_REVIEW_CONSOLE PASS");
}
main();
