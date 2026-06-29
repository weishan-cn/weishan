const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowAcceptanceSessionSummary.js"]);
  const api = windowRef.WeishanFlightWorkflowAcceptanceSessionSummary;
  assert.equal(api.FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY_VERSION, "2.2.2");
  const completed = api.buildFlightWorkflowAcceptanceSessionSummary({
    betaAcceptancePack:{ status:"ready", userFacingSummary:{ resultLabel:"可以开始用户验收", redacted:true } },
    guidedUserTestMode:{ status:"completed", userFacingSummary:{ resultLabel:"测试已完成", redacted:true } },
    feedbackReviewSummary:{ status:"ready", feedbackHealth:{ safetyCopyUnderstood:true }, userFacingSummary:{ resultLabel:"反馈可用于验收参考", redacted:true } },
    safetyConfirmed:true
  });
  assert.equal(completed.summaryName, "flight_workflow_acceptance_session_summary_v1");
  assert.equal(completed.status, "completed");
  assert.equal(completed.sessionHealth.safeToAdvance, true);
  assert.equal(completed.nextStepRecommendation, "本次验收已完成");
  assert.equal(completed.rows.length, 4);
  assert.equal(completed.rawUserTextStored, false);
  assert.equal(completed.bookingUrl, null);
  const progress = api.buildFlightWorkflowAcceptanceSessionSummary({ betaAcceptancePack:{ status:"ready" }, guidedUserTestMode:{ status:"in_progress" }, feedbackReviewSummary:{ status:"ready", feedbackHealth:{ safetyCopyUnderstood:true } } });
  assert.equal(progress.status, "in_progress");
  const review = api.buildFlightWorkflowAcceptanceSessionSummary({ betaAcceptancePack:{ status:"ready" }, guidedUserTestMode:{ status:"completed" }, feedbackReviewSummary:{ status:"needs_review" } });
  assert.equal(review.status, "needs_review");
  const blocked = api.buildFlightWorkflowAcceptanceSessionSummary({ betaAcceptancePack:{ status:"blocked" }, guidedUserTestMode:{ status:"completed" }, feedbackReviewSummary:{ status:"ready" } });
  assert.equal(blocked.status, "blocked");
  assert.equal(JSON.stringify(api.buildFlightWorkflowAcceptanceSessionSummary({ bookingUrl:"https://blocked.example" })).includes("https://blocked.example"), false);
  console.log("FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY PASS");
}
main();
