const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file){
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}
function main(){
  const windowRef = load("apps/desktop/src/renderer/core/taskHistorySummaryFormatter.js");
  const api = windowRef.WeishanTaskHistorySummaryFormatter;
  assert.equal(api.TASK_HISTORY_SUMMARY_FORMATTER_VERSION, "4.1.3");
  const longPrompt = "任务：v2.4.1 · User Surface Final Cleanup " + "不要显示完整开发指令 ".repeat(20) + "```raw JSON``` token endpoint";
  const dev = api.buildTaskHistorySummary({ text:longPrompt, status:"done" });
  assert.equal(dev.type, "系统开发任务");
  assert.equal(dev.fullPromptHidden, true);
  assert.equal(dev.requestSummary.includes("完整指令已隐藏"), true);
  assert.equal(dev.requestSummary.length <= api.MAX_SUMMARY_LENGTH + 1, true);
  assert.equal(JSON.stringify(dev).includes("```"), false);
  assert.equal(JSON.stringify(dev).includes("raw JSON"), false);
  assert.equal(JSON.stringify(dev).includes("token endpoint"), false);
  assert.equal(dev.audit.eventType, "TASK_HISTORY_SUMMARY_FORMATTER_DRAFT");
  assert.equal(dev.audit.rawPromptDisplayedCount, 0);
  assert.equal(dev.audit.rawJsonDisplayedCount, 0);
  assert.equal(dev.audit.redacted, true);
  assert.equal(api.assertTaskHistorySummarySafe(dev), true);
  const flight = api.buildTaskHistorySummary({ text:"7 月 15 日上海到成都最便宜的机票", category:"flight", status:"done" });
  assert.equal(flight.type, "机票");
  assert.equal(flight.resultSummary, "已生成结果摘要；未下单 / 未付款。");
  const urlSummary = api.buildTaskHistorySummary({ text:"https://www.google.com/travel/flights?foo=bar", category:"flight", status:"done" });
  assert.equal(JSON.stringify(urlSummary).includes("https://"), false);
  assert.equal(JSON.stringify(urlSummary).includes("travel/flights"), false);
  const blocked = api.buildTaskHistorySummary({ text:"帮我买枪", category:"restricted_or_blocked", status:"blocked" });
  assert.equal(blocked.type, "受限品类");
  assert.equal(blocked.resultSummary, "安全阻断；不显示购买路径。");
  console.log("TASK_HISTORY_SUMMARY_FORMATTER_CORE PASS");
}
main();
