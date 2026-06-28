const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowBetaFeedbackReviewCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowAcceptanceSessionSummary.js",
    "apps/desktop/src/renderer/core/flightWorkflowBetaAcceptanceReviewViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowBetaAcceptanceReviewViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION, "2.1.95");
  const model = api.buildFlightWorkflowBetaAcceptanceReviewViewModel({
    feedbackReviewSummary:{ status:"ready", findings:[{ findingId:"feedback_ready", severity:"info", title:"反馈可用于验收参考", message:"token abc https://blocked.example" }], userFacingSummary:{ resultLabel:"反馈可用于验收参考", redacted:true }, redacted:true },
    acceptanceSessionSummary:{ status:"completed", rows:[{ rowId:"feedback", label:"测试反馈汇总", status:"completed", message:"本次验收已完成" }], nextStepRecommendation:"本次验收已完成", userFacingSummary:{ resultLabel:"本次验收已完成", redacted:true }, redacted:true }
  });
  assert.equal(model.viewModelName, "flight_workflow_beta_acceptance_review_view_model_v1");
  assert.equal(model.title, "只读 Beta 验收复核");
  assert.equal(model.status, "completed");
  assert.ok(model.cards.some((item) => item.label === "测试反馈汇总"));
  assert.ok(model.rows.length >= 1);
  assert.equal(model.caveat, "验收复核只用于改进只读候选证据流程，不代表真实票价、库存或可出票。");
  const json = JSON.stringify(model);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  assert.equal(model.bookingUrl, null);
  assert.equal(model.rawUserTextStored, false);
  console.log("FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL PASS");
}
main();
