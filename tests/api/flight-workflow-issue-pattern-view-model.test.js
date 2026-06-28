const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowIssuePatternViewModel.js"]).WeishanFlightWorkflowIssuePatternViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL_VERSION, "2.1.85");
  const vmModel = api.buildFlightWorkflowIssuePatternViewModel({
    issuePatternRadar:{ status:"ready", issuePatternHealth:{ issueCount:4 }, patternSummary:{ dominantPattern:"none", message:"暂无明显共性问题" }, signals:[{ signalId:"issue_count", label:"问题数量", value:"4", status:"pass" }] },
    supportReadinessGate:{ status:"ready", decision:{ label:"支持兜底准备就绪", message:"继续公开只读试点" }, criteria:{ issuePatternReady:true, noTradingRisk:true }, riskNotes:[] }
  });
  assert.equal(vmModel.title, "试点问题趋势雷达");
  assert.ok(vmModel.cards.find((card) => card.cardId === "issues"));
  assert.ok(vmModel.cards.find((card) => card.cardId === "pattern"));
  assert.ok(vmModel.cards.find((card) => card.cardId === "support"));
  assert.ok(vmModel.cards.find((card) => card.cardId === "next_step"));
  assert.ok(vmModel.issuePatternRows.length > 0);
  assert.ok(vmModel.supportReadinessRows.length > 0);
  assert.ok(Array.isArray(vmModel.riskRows));
  assert.equal(vmModel.caveat.includes("不代表客服工单、交易请求或出票请求"), true);
  const json = JSON.stringify(vmModel);
  assert.equal(/sk-|apiKey abc|secret abc|password abc|credential abc|身份证 123|护照 123|银行卡 123|https:\/\/example/i.test(json), false);
  assert.equal(vmModel.bookingUrl, null);
  assert.equal(vmModel.paymentUrl, null);
  assert.equal(vmModel.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL PASS");
}
main();
