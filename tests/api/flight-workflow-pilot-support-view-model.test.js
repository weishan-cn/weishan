const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowPilotSupportViewModel.js"]).WeishanFlightWorkflowPilotSupportViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL_VERSION, "4.2.3");
  const vm = api.buildFlightWorkflowPilotSupportViewModel({ issueIntakeSummary:{ status:"ready", issueCategory:"candidate_unclear", issueSummary:{ categoryLabel:"看不懂候选证据" } }, supportFallbackSummary:{ status:"ready", recommendation:{ label:"建议重新查看候选证据" } } });
  assert.equal(vm.title, "只读试点问题反馈");
  assert.ok(vm.cards.find((card) => card.cardId === "issue"));
  assert.ok(vm.cards.find((card) => card.cardId === "recommendation"));
  assert.ok(vm.cards.find((card) => card.cardId === "safety"));
  assert.ok(vm.issueRows.length >= 6);
  assert.ok(vm.recommendationRows.length >= 4);
  assert.ok(vm.caveat.includes("不代表客服工单、交易请求或出票请求"));
  const json = JSON.stringify(vm);
  assert.equal(/token|key|secret/i.test(json), false);
  assert.equal(/bookingUrl\":\"|paymentUrl\":\"|orderUrl\":\"/.test(json), false);
  console.log("FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL PASS");
}
main();
