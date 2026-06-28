const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackSanitizer.js",
    "apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackReviewCenter.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowBetaFeedbackReviewCenter;
  assert.equal(api.FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER_VERSION, "2.1.93");
  const ready = api.buildFlightWorkflowBetaFeedbackReviewCenter({ feedback:{ usabilityRating:"good", clarityRating:"good", safetyCopyUnderstood:true, userComment:"token abc https://blocked.example" } });
  assert.equal(ready.reviewCenterName, "flight_workflow_beta_feedback_review_center_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "反馈可用于验收参考");
  assert.ok(ready.findings.some((item) => item.title === "反馈已脱敏"));
  assert.equal(JSON.stringify(ready).includes("abc"), false);
  assert.equal(JSON.stringify(ready).includes("https://blocked.example"), false);
  assert.equal(ready.rawUserTextStored, false);
  assert.equal(ready.secretStored, false);
  assert.equal(ready.bookingUrl, null);
  const missing = api.buildFlightWorkflowBetaFeedbackReviewCenter({});
  assert.equal(missing.status, "needs_review");
  assert.equal(missing.userFacingSummary.resultLabel, "仍需补充反馈");
  const blocked = api.buildFlightWorkflowBetaFeedbackReviewCenter({ secretStored:true, feedback:{ usabilityRating:"good", clarityRating:"good", safetyCopyUnderstood:true } });
  assert.equal(blocked.status, "blocked");
  console.log("FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER PASS");
}
main();
