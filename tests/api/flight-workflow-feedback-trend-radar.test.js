const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function f(usability="good", clarity="good", safetyCopyUnderstood=true, status="ready") { return { status, usabilityRating:usability, clarityRating:clarity, safetyCopyUnderstood, redacted:true }; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowFeedbackTrendRadar.js"]).WeishanFlightWorkflowFeedbackTrendRadar;
  assert.equal(api.FLIGHT_WORKFLOW_FEEDBACK_TREND_RADAR_VERSION, "2.1.81");
  assert.equal(api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f()] }).status, "insufficient_data");
  const positive = api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f(), f(), f("ok"), f("good", "ok")] });
  assert.equal(positive.status, "ready");
  assert.equal(positive.trends.overallTrend, "positive");
  assert.equal(positive.recommendation.recommendationId, "expand_read_only_beta");
  assert.equal(api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f("good"), f("ok"), f("bad")] }).trends.usabilityTrend, "mixed");
  assert.equal(api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f("bad"), f("bad"), f()] }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f("good", "bad"), f("good", "bad"), f()] }).status, "needs_review");
  const copy = api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f("good", "good", false), f("good", "good", false), f()] });
  assert.equal(copy.status, "needs_review");
  assert.equal(copy.recommendation.recommendationId, "improve_copy");
  assert.equal(api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f(), Object.assign(f(), { sensitiveDetected:true }), f()] }).trends.sensitiveInputTrend, "redacted");
  assert.equal(api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f(), f(), Object.assign(f(), { status:"blocked" })] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[f(), f()] }).recommendation.recommendationId, "continue_small_batch");
  const json = JSON.stringify(api.buildFlightWorkflowFeedbackTrendRadar({ feedback:[Object.assign(f(), { rawUserText:"raw feedback token abc" })], bookingUrl:"https://blocked.example" }));
  assert.equal(/raw feedback|abc|https:\/\/blocked/.test(json), false);
  const blocked = api.buildFlightWorkflowFeedbackTrendRadar({ bookingUrl:"https://blocked.example", feedback:[f(), f(), f()] });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.bookingUrl, null);
  assert.equal(blocked.paymentUrl, null);
  assert.equal(blocked.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_FEEDBACK_TREND_RADAR PASS");
}
main();
