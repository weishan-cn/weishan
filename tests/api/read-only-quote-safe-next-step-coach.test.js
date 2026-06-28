const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file){ const window = {}; window.window = window; vm.runInContext(fs.readFileSync(path.join(ROOT,file), "utf8"), vm.createContext({ window, console }), { filename:file }); return window; }
const api = load("apps/desktop/src/renderer/core/readOnlyQuoteSafeNextStepCoach.js").WeishanReadOnlyQuoteSafeNextStepCoach;
function coach(status, label) { return api.buildReadOnlyQuoteSafeNextStepCoach({ reconciliationSummary:{ status }, confidenceLabelSummary:{ confidenceLabel:label } }); }
assert.equal(coach("matched", "高一致").appVersion, "2.1.88");
assert.equal(coach("matched", "高一致").recommendation, "前往平台继续核对");
assert.equal(coach("needs_recheck", "需重新核对").recommendation, "重新核对平台页面");
assert.ok(["前往平台确认", "前往平台继续核对"].includes(coach("no_platform_check", "不可确认").recommendation));
assert.equal(coach("blocked", "不可确认").recommendation, "不可继续");
const forbidden = coach("matched", "高一致").forbiddenActions;
for (const item of ["付款", "下单", "出票", "上传证件", "上传银行卡"]) assert.ok(forbidden.includes(item));
const text = JSON.stringify(coach("matched", "高一致"));
assert.equal(text.includes("现在购买"), false);
assert.equal(text.includes("直接下单"), false);
assert.equal(/token|apiKey|secret/i.test(text), false);
console.log("READ_ONLY_QUOTE_SAFE_NEXT_STEP_COACH PASS");
