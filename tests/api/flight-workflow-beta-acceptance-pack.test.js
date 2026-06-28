const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function readyInput(extra = {}) {
  return Object.assign({
    releaseReadinessSummary:{ status:"ready", releaseReady:true, safeForUserFacingBeta:true, redacted:true },
    operatorConsoleSummary:{ status:"ready", redacted:true },
    safetyTestMatrixSummary:{ status:"pass", overallHealth:"pass", failedCount:0, blockedCount:0, redacted:true },
    humanReviewChecklistSummary:{ status:"ready", redacted:true },
    finalSafeHandoffPacketSummary:{ status:"ready", redacted:true },
    copyValidationStatus:"pass"
  }, extra);
}
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowBetaAcceptancePack.js"]);
  const api = windowRef.WeishanFlightWorkflowBetaAcceptancePack;
  assert.equal(api.FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION, "2.1.95");
  const ready = api.buildFlightWorkflowBetaAcceptancePack(readyInput({ feedbackReviewSummary:{ status:"ready", feedbackHealth:{ safetyCopyUnderstood:true } }, acceptanceSessionSummary:{ status:"completed" }, nextAcceptanceStep:"本次验收已完成" }));
  assert.equal(ready.status, "ready");
  assert.equal(ready.acceptanceReadiness.safeForGuidedUserTest, true);
  assert.ok(ready.acceptanceSteps.length >= 6);
  assert.ok(ready.forbiddenCapabilities.includes("付款"));
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.feedbackReviewSummary.status, "ready");
  assert.equal(ready.acceptanceSessionSummary.status, "completed");
  assert.equal(ready.nextAcceptanceStep, "本次验收已完成");
  const review = api.buildFlightWorkflowBetaAcceptancePack(readyInput({ humanReviewChecklistSummary:{ status:"needs_review", redacted:true } }));
  assert.equal(review.status, "needs_review");
  const releaseBlocked = api.buildFlightWorkflowBetaAcceptancePack(readyInput({ releaseReadinessSummary:{ status:"blocked", releaseReady:false, safeForUserFacingBeta:false, redacted:true }, releaseReadinessBlocked:true }));
  assert.equal(releaseBlocked.status, "blocked");
  const matrixFail = api.buildFlightWorkflowBetaAcceptancePack(readyInput({ safetyTestMatrixSummary:{ status:"fail", overallHealth:"fail", failedCount:1, blockedCount:0, redacted:true } }));
  assert.equal(matrixFail.status, "blocked");
  const forbidden = api.buildFlightWorkflowBetaAcceptancePack(readyInput({ userFacingSummary:{ title:"全网最低 已锁价" } }));
  assert.equal(forbidden.status, "blocked");
  const json = JSON.stringify(api.buildFlightWorkflowBetaAcceptancePack(readyInput({ token:"abc", bookingUrl:"https://booking.example" })));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://booking.example"), false);
  console.log("FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK PASS");
}
main();
