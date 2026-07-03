const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackSanitizer.js",
    "apps/desktop/src/renderer/core/flightWorkflowGuidedUserTestMode.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowGuidedUserTestMode;
  assert.equal(api.FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE_VERSION, "4.1.7");
  const initial = api.buildFlightWorkflowGuidedUserTestMode();
  assert.equal(initial.status, "not_started");
  const started = api.startFlightWorkflowGuidedUserTest();
  assert.equal(started.status, "in_progress");
  let state = api.updateFlightWorkflowGuidedUserTestStep(started, { stepId:"enter_flight_request" });
  assert.equal(state.steps[0].status, "completed");
  const blockedHandoff = api.updateFlightWorkflowGuidedUserTestStep(started, { stepId:"review_handoff_packet" });
  assert.equal(blockedHandoff.status, "blocked");
  ["enter_flight_request", "review_results", "confirm_safety_notice", "review_handoff_packet", "confirm_no_transaction"].forEach(function (stepId) {
    state = api.updateFlightWorkflowGuidedUserTestStep(state, { stepId });
  });
  state = api.updateFlightWorkflowGuidedUserTestStep(state, { stepId:"submit_feedback", feedback:{ usabilityRating:"ok", clarityRating:"good", safetyCopyUnderstood:true, userComment:"银行卡 4111111111111111" } });
  assert.equal(state.status, "completed");
  assert.equal(state.feedbackSummary.redactedUserComment.includes("4111111111111111"), false);
  assert.equal(api.buildFlightWorkflowGuidedUserTestMode({ blocked:true }).status, "blocked");
  assert.equal(state.bookingUrl, null);
  const json = JSON.stringify(state);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("apiKey-value"), false);
  console.log("FLIGHT_WORKFLOW_GUIDED_USER_TEST_MODE PASS");
}
main();
