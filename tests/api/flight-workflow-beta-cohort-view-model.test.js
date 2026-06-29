const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load([
    "apps/desktop/src/renderer/core/flightWorkflowBetaCohortReviewBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowFeedbackTrendRadar.js",
    "apps/desktop/src/renderer/core/flightWorkflowBetaCohortViewModel.js"
  ]).WeishanFlightWorkflowBetaCohortViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_BETA_COHORT_VIEW_MODEL_VERSION, "2.2.4");
  const model = api.buildFlightWorkflowBetaCohortViewModel({
    betaCohortSummary:{ status:"ready", cohortHealth:{ sessionCount:4, usableFeedbackCount:4 }, rows:[{ rowId:"sessions", label:"验收会话", value:"4", status:"pass" }], findings:[{ findingId:"ready", severity:"info", title:"可以扩大只读测试", message:"token abc https://blocked.example" }], userFacingSummary:{ resultLabel:"可以扩大只读测试", redacted:true }, redacted:true },
    feedbackTrendSummary:{ status:"ready", trends:{ overallTrend:"positive" }, signals:[{ signalId:"safety", label:"安全文案理解", value:"understood", status:"pass" }], recommendation:{ label:"可以扩大只读测试", redacted:true }, redacted:true }
  });
  assert.equal(model.title, "Beta 反馈复核板");
  assert.ok(model.cards.some((x) => x.cardId === "sessions" && x.label === "验收会话"));
  assert.ok(model.cards.some((x) => x.cardId === "feedback" && x.label === "可用反馈"));
  assert.ok(model.cards.some((x) => x.cardId === "trend" && x.label === "反馈趋势"));
  assert.ok(model.cards.some((x) => x.cardId === "recommendation" && x.label === "下一步建议"));
  assert.equal(model.rows.length, 1);
  assert.equal(model.trendRows.length, 1);
  assert.equal(model.findings.length, 1);
  assert.equal(model.caveat, "Beta 反馈只用于改进只读候选证据流程，不代表真实票价、库存或可出票。");
  const json = JSON.stringify(model);
  assert.equal(/abc|https:\/\/blocked|token/.test(json), false);
  assert.equal(model.bookingUrl, null);
  assert.equal(model.paymentUrl, null);
  assert.equal(model.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_BETA_COHORT_VIEW_MODEL PASS");
}
main();
