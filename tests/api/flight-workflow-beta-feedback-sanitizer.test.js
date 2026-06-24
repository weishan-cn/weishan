const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackSanitizer.js"]);
  const api = windowRef.WeishanFlightWorkflowBetaFeedbackSanitizer;
  assert.equal(api.FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER_VERSION, "2.1.82");
  const safe = api.sanitizeFlightWorkflowBetaFeedback({ usabilityRating:"good", clarityRating:"ok", safetyCopyUnderstood:true, userComment:"流程清楚" });
  assert.equal(safe.status, "ready");
  assert.equal(safe.safety.rawUserTextStored, false);
  const sensitive = api.sanitizeFlightWorkflowBetaFeedback({ userComment:"身份证 110101199003071234 护照 E12345678 token abc key secret https://pay.example/order" });
  assert.equal(sensitive.status, "redacted");
  assert.ok(sensitive.sensitiveTypes.includes("identity"));
  assert.ok(sensitive.sensitiveTypes.includes("passport"));
  assert.ok(sensitive.sensitiveTypes.includes("token"));
  assert.ok(sensitive.sensitiveTypes.includes("key"));
  assert.ok(sensitive.sensitiveTypes.includes("secret"));
  assert.ok(sensitive.sensitiveTypes.includes("payment_link"));
  const json = JSON.stringify(sensitive);
  assert.equal(json.includes("110101199003071234"), false);
  assert.equal(json.includes("E12345678"), false);
  assert.equal(json.includes("https://pay.example"), false);
  assert.equal(sensitive.safety.bookingUrl, null);
  console.log("FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER PASS");
}
main();
