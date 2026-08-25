"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const rendererCore = path.join(root, "apps/desktop/src/renderer/core");

const windowRef = {};
const context = vm.createContext({
  window:windowRef,
  Date,
  Object,
  Array,
  Set,
  Number,
  String,
  RegExp,
  JSON,
  Math,
  Blob:function(parts){ this.size = (parts || []).join("").length; }
});

function load(file) {
  vm.runInContext(fs.readFileSync(path.join(rendererCore, file), "utf8"), context, { filename:file });
}

load("homeUnifiedIntentRouter.js");
load("dispatchRouter.js");

const homeRouter = windowRef.WeishanHomeUnifiedIntentRouter;
const dispatchRouter = windowRef.WeishanDispatchRouter;

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test("routing corpus is strict and has no wrong confident dispatch", () => {
  const report = homeRouter.evaluateRoutingCorpus();
  assert.equal(report.metrics.TOTAL_ROUTING_CASES, 14);
  assert.equal(report.metrics.CLEAR_CASES, 10);
  assert.equal(report.metrics.CLEAR_CORRECT, 10);
  assert.equal(report.metrics.AMBIGUOUS_CASES, 2);
  assert.equal(report.metrics.AMBIGUOUS_SAFE, 2);
  assert.equal(report.metrics.MIXED_INTENT_CASES, 2);
  assert.equal(report.metrics.MIXED_INTENT_SAFELY_HANDLED, 2);
  assert.equal(report.metrics.WRONG_CONFIDENT, 0);
  assert.equal(report.metrics.PASS, true);
});

test("mail evidence beats shopping and travel object words", () => {
  assert.equal(homeRouter.classifyHomeIntent("找上个月苹果电脑发票").destination, "MAIL");
  assert.equal(homeRouter.classifyHomeIntent("帮我找东京酒店确认邮件").destination, "MAIL");
  assert.equal(homeRouter.classifyHomeIntent("谁还在等我回复？").destination, "MAIL");
});

test("clear shopping and travel remain commerce", () => {
  assert.equal(homeRouter.classifyHomeIntent("帮我买一台性价比高的 MacBook").destination, "COMMERCE");
  assert.equal(homeRouter.classifyHomeIntent("查 7 月 15 日成都到北京机票").destination, "COMMERCE");
  assert.equal(homeRouter.classifyHomeIntent("7 月 15 日上海到成都最便宜的机票").destination, "COMMERCE");
  assert.equal(homeRouter.classifyHomeIntent("比较东京酒店价格").destination, "COMMERCE");
});

test("ambiguous and mixed intents are handled safely", () => {
  const ambiguous = homeRouter.classifyHomeIntent("东京酒店");
  assert.equal(ambiguous.destination, "CLARIFY");
  assert.equal(ambiguous.safeToRouteConfidently, false);
  const mixed = homeRouter.classifyHomeIntent("帮我找便宜的东京酒店，再找一下之前的确认邮件");
  assert.equal(mixed.destination, "MIXED");
  assert.equal(mixed.decisionType, "MIXED_INTENT");
  assert.equal(mixed.safeToRouteConfidently, false);
});

test("local attachment analysis is not mistaken for mailbox work", () => {
  const decision = homeRouter.classifyHomeIntent("帮我分析这个附件");
  assert.equal(decision.destination, "CHAT");
  assert.equal(decision.readsMailbox, false);
});

test("actual dispatch plan routes mail evidence to Mail without mailbox reads", () => {
  const plan = dispatchRouter.createDispatchPlan("找上个月苹果电脑发票");
  assert.equal(plan.module, "mail");
  assert.equal(plan.targetRoute, "mail");
  assert.equal(plan.realExecution, false);
  assert.equal(plan.homeUnifiedIntentDecision.readsMailbox, false);
});

test("actual dispatch plan blocks ambiguous hotel fragment from commerce confidence", () => {
  const plan = dispatchRouter.createDispatchPlan("东京酒店");
  assert.equal(plan.module, "coordination");
  assert.equal(plan.executionMode, "home_unified_safe_clarification");
  assert.equal(plan.homeUnifiedIntentDecision.destination, "CLARIFY");
  const result = dispatchRouter.resultForPlan(plan, "东京酒店");
  assert.match(result, /需要你确认一下方向/);
  assert.match(result, /没有读取邮箱、没有搜索 provider/);
});

test("mixed intent is not collapsed into one module", () => {
  const plan = dispatchRouter.createDispatchPlan("比较 MacBook 价格，然后找上个月那张发票");
  assert.equal(plan.module, "coordination");
  assert.deepEqual(plan.modules, ["commerceAgent", "mail"]);
  assert.equal(plan.homeUnifiedIntentDecision.destination, "MIXED");
});

test("high-risk desktop operation is blocked before mail arbitration", () => {
  const plan = dispatchRouter.createDispatchPlan("删除文件并发送邮件");
  assert.equal(plan.module, "desktopAssistant");
  assert.equal(plan.action, "desktopAssistant.paused");
  assert.equal(plan.realExecution, false);
});

test("feature decision matrix names simplification decisions", () => {
  const matrix = homeRouter.buildFeatureDecisionMatrix();
  assert.ok(matrix.some((item) => item.feature === "Static Home model/module cards" && item.decision === "DELETE"));
  assert.ok(matrix.some((item) => item.feature === "Shopping/Mail and Travel/Mail intent boundary" && item.decision === "OPTIMIZE"));
  assert.ok(matrix.some((item) => item.feature === "Mixed intent single-hop routing" && item.decision === "REPLACE"));
});

test("no secret, provider, or production effects are exposed by the router", () => {
  const source = fs.readFileSync(path.join(rendererCore, "homeUnifiedIntentRouter.js"), "utf8");
  assert.equal(/fetch\s*\(|XMLHttpRequest|ipcRenderer|ipcMain|localStorage|sessionStorage|writeFile|providerCredential|client_secret|api[_ -]?key/i.test(source), false);
  const result = homeRouter.classifyHomeIntent("找上个月苹果电脑发票");
  assert.equal(result.externalEffects, false);
  assert.equal(result.providerCalls, false);
  assert.equal(result.productionTraffic, false);
});

test("index loads Home intent arbitration before dispatch and command runtime", () => {
  const html = fs.readFileSync(path.join(root, "apps/desktop/src/index.html"), "utf8");
  const homeIndex = html.indexOf("homeUnifiedIntentRouter.js");
  const dispatchIndex = html.indexOf("dispatchRouter.js");
  const commandIndex = html.indexOf("commandApi.js");
  assert.ok(homeIndex > 0);
  assert.ok(dispatchIndex > homeIndex);
  assert.ok(commandIndex > dispatchIndex);
});

tests.forEach(([, fn]) => fn());
console.log("HOME_UNIFIED_DESKTOP_EFFECTIVENESS_TESTS PASS " + tests.length);
