const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackSanitizer.js",
    "apps/desktop/src/renderer/core/flightWorkflowGuidedUserTestMode.js",
    "apps/desktop/src/renderer/core/flightWorkflowBetaAcceptancePack.js",
    "apps/desktop/src/renderer/core/flightWorkflowBetaAcceptanceViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowBetaAcceptanceViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL_VERSION, "2.1.83");
  const vmModel = api.buildFlightWorkflowBetaAcceptanceViewModel({
    betaAcceptancePack:{ status:"ready", acceptanceSteps:[{ stepId:"enter_flight_request", label:"输入机票需求", status:"pending" }], forbiddenCapabilities:["付款", "下单"], userFacingSummary:{ resultLabel:"可以开始用户验收", redacted:true }, redacted:true },
    guidedUserTestMode:{ status:"not_started", userFacingSummary:{ resultLabel:"测试未开始", redacted:true }, feedbackSummary:{}, redacted:true },
    feedback:{ userComment:"token abc https://booking.example" }
  });
  assert.equal(vmModel.title, "只读 Beta 验收");
  assert.ok(vmModel.cards.length >= 3);
  assert.ok(vmModel.rows.length >= 1);
  assert.ok(vmModel.feedbackRows.length >= 1);
  assert.ok(vmModel.forbiddenCapabilityRows.length >= 2);
  assert.equal(vmModel.caveat, "当前仅验收只读候选证据流程，不代表真实票价、库存或可出票。");
  const json = JSON.stringify(vmModel);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("apiKey-value"), false);
  assert.equal(json.includes("https://booking.example"), false);
  assert.equal(vmModel.bookingUrl, null);
  assert.equal(vmModel.paymentUrl, null);
  assert.equal(vmModel.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL PASS");
}
main();
