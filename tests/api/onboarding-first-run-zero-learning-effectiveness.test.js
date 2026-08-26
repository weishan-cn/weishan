"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const CORE = path.join(ROOT, "apps/desktop/src/renderer/core");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, Object, Array, String, Number, Boolean, RegExp, JSON, Math });
  ["homeUnifiedIntentRouter.js", "errorEmptyRecoveryUx.js", "onboardingFirstRunZeroLearning.js"].forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(CORE, file), "utf8"), context, { filename:file });
  });
  return window;
}

function assertZeroMetrics(metrics) {
  Object.keys(metrics).forEach(function (key) {
    assert.equal(metrics[key], 0, key + " should remain zero");
  });
}

function main() {
  const window = load();
  const api = window.WeishanOnboardingFirstRunZeroLearning;
  assert.ok(api, "onboarding first-run zero-learning module should be exposed");

  const html = fs.readFileSync(path.join(ROOT, "apps/desktop/src/index.html"), "utf8");
  const verify = fs.readFileSync(path.join(ROOT, "scripts/verify.js"), "utf8");
  const home = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/routes/HomePage.js"), "utf8");
  const i18n = fs.readFileSync(path.join(CORE, "i18n.js"), "utf8");
  assert.match(html, /onboardingFirstRunZeroLearning\.js\?v=4\.3\.1/, "runtime should load onboarding zero-learning guard");
  assert.match(verify, /onboarding-first-run-zero-learning-effectiveness\.test\.js/, "verify should register onboarding effectiveness test");

  assert.match(i18n, /比较 MacBook Air M4 16\+512 的购买选择/, "Chinese placeholder should provide concrete useful first action");
  assert.match(i18n, /compare MacBook Air M4 16\+512 buying options/, "English placeholder should provide concrete useful first action");
  assert.doesNotMatch(i18n.match(/homePlaceholder:"[^"]+"/)[0], /command|dispatch|provider|api|runtime|ipc|sandbox|production/i);

  const firstRunPanel = home.slice(home.indexOf("function unifiedDesktopFlowHomePanel"), home.indexOf("function syncHomeTopbar"));
  const firstRunVisibleCopy = [
    "从一个问题开始",
    "告诉 Weishan 你想找、比较或理解什么。Weishan 会整理选项、说明依据，并在你选择后带你去对应的官方页面继续。",
    "提出目标 → 查看选项 → 理解差异 → 你决定是否去官方页面继续",
    "价格会明确说明是当前可用、仅供参考、测试数据或暂不可用。Weishan 不替你下单、订票或付款；邮箱也不会在你连接前被读取。"
  ].join(" ");
  assert.match(firstRunPanel, /从一个问题开始/);
  assert.match(firstRunPanel, /提出目标 → 查看选项 → 理解差异 → 你决定是否去官方页面继续/);
  assert.match(firstRunPanel, /不替你下单、订票或付款/);
  assert.match(firstRunPanel, /邮箱也不会在你连接前被读取/);
  assert.doesNotMatch(firstRunVisibleCopy, /\bProvider\b|\bAPI\b|\bnetwork\b|routes internally|checkout|books, orders, tickets/i);

  const cn = api.firstRunCopy("zh-CN");
  const en = api.firstRunCopy("en");
  assert.equal(cn.examples.length, 4);
  assert.equal(en.examples.length, 4);
  cn.examples.concat(en.examples).forEach(function (example) {
    assert.doesNotMatch(example, /Provider|API|endpoint|credential|runtime|IPC|sandbox|production|adapter|gateway|developer/i);
    assert.doesNotMatch(example, /live demo|实时示例|测试实时/i);
  });
  assert.match(cn.transaction, /不替你下单、订票或付款/);
  assert.match(en.transaction, /does not book, order, issue tickets, or take payment/);
  assert.match(cn.privacy, /不会自动读取邮箱/);
  assert.match(en.privacy, /not scanned automatically/);

  const surface = api.evaluateFirstRunSurface({
    locale:"zh-CN",
    visibleCopy:[cn.title, cn.subtitle, cn.placeholder, cn.privacy, cn.transaction].join(" "),
    hasPrimaryInput:true,
    hasPrimaryAction:true,
    hiddenCloudEnterprise:true
  });
  assert.equal(surface.zeroLearning, "PASS");
  assert.equal(surface.primaryActionDiscoverability, "KEEP");
  assert.equal(surface.primaryInput, "KEEP");
  assert.equal(surface.placeholder, "OPTIMIZE");
  assert.equal(surface.technicalJargon, "OPTIMIZE");
  assert.equal(surface.transactionBoundary, "KEEP");
  assert.equal(surface.privacyBoundary, "KEEP");
  assert.equal(surface.hiddenCloudEnterprise, "KEEP");

  const shopping = api.evaluateFirstSuccessScenario({ query:"比较 MacBook Air M4 16+512 的购买选择", domain:"shopping", locale:"zh-CN" });
  const flight = api.evaluateFirstSuccessScenario({ query:"Find Chengdu to Tokyo economy flights next week for 2 adults", domain:"flight", locale:"en" });
  const ambiguous = api.evaluateFirstSuccessScenario({ query:"东京酒店", domain:"hotel", locale:"zh-CN" });
  const empty = api.evaluateFirstSuccessScenario({ query:"   ", domain:"home", locale:"zh-CN" });
  const mail = api.evaluateFirstSuccessScenario({ query:"在邮件里找上个月的电脑发票", domain:"mail", locale:"zh-CN" });
  assert.equal(shopping.destination, "COMMERCE");
  assert.equal(flight.destination, "COMMERCE");
  assert.equal(ambiguous.destination, "CLARIFY");
  assert.equal(empty.firstUsefulOutcome, "instructional_empty");
  assert.equal(mail.destination, "MAIL");
  assert.equal(mail.readsMailbox, false, "mail first-run routing should not itself read mailbox");
  [shopping, flight, ambiguous, empty, mail].forEach(function (scenario) {
    assert.equal(scenario.providerCalls, false);
    assert.equal(scenario.userTechnicalConfigurationRequired, false);
    assert.equal(scenario.transactionBoundaryConfusion, 0);
    assert.equal(scenario.mailPrivacyBoundaryConfusion, 0);
    assert.equal(scenario.nextStepClear, true);
  });

  const badJargon = api.evaluateFirstRunSurface({ visibleCopy:"Provider API endpoint credential runtime IPC sandbox production", locale:"en" });
  assert.equal(badJargon.zeroLearning, "FAIL");
  assert.equal(badJargon.technicalJargon, "REPLACE");

  const badTransaction = api.evaluateFirstRunSurface({ visibleCopy:"Weishan can book and pay automatically", locale:"en" });
  assert.equal(badTransaction.transactionBoundary, "REPLACE");

  const elements = api.buildFirstRunElements("zh-CN");
  assert.equal(elements.length, 5);
  assert.equal(elements.some((item) => item.element === "Cloud and enterprise placeholders" && item.firstRunVisible === false && item.decision === "DEFER"), true);
  assert.equal(elements.every((item) => ["KEEP", "OPTIMIZE", "MERGE", "REPLACE", "DEFER", "DELETE"].includes(item.decision)), true);

  const suite = api.runOnboardingFirstRunSuite();
  assert.equal(suite.moduleName, "onboarding_first_run_zero_learning_v1");
  assert.equal(suite.status, "pass");
  assert.equal(suite.productResult.FIRST_RUN_HOME, "OPTIMIZE");
  assert.equal(suite.productResult.PRIMARY_ACTION_DISCOVERABILITY, "KEEP");
  assert.equal(suite.productResult.ZERO_LEARNING, "OPTIMIZE");
  assert.equal(suite.firstSuccess.FIRST_SUCCESS_SCENARIOS, 7);
  assert.equal(suite.firstSuccess.FIRST_SUCCESS_COMPLETED, 7);
  assert.equal(suite.language.SEMANTIC_MISMATCHES, 0);
  assert.equal(suite.accessibility.KEYBOARD_FIRST_RUN, "PASS");
  assert.equal(suite.simplification.OBSOLETE_FIRST_RUN_COPY_REMOVED, 1);
  assert.equal(suite.defects.length, 2);
  assert.equal(suite.defects.every((item) => item.STATUS === "FIXED"), true);
  assertZeroMetrics(suite.highRiskZeroMetrics);
  assert.equal(suite.externalEffects.PROVIDER_API_CALLS, 0);
  assert.equal(suite.externalEffects.REAL_CREDENTIAL_READS, 0);
  assert.equal(suite.externalEffects.REAL_CREDENTIAL_WRITES, 0);
  assert.equal(suite.externalEffects.MAILBOX_READS, 0);
  assert.equal(suite.externalEffects.PRODUCTION_TRAFFIC, 0);
  assert.equal(suite.governance.executionGate, "CLOSED");
  assert.equal(suite.governance.authorizesExecution, false);
  assert.equal(suite.governance.EMAIL_SEND_ENABLED, false);

  console.log("ONBOARDING_FIRST_RUN_ZERO_LEARNING_EFFECTIVENESS PASS firstSuccess=7 highRisk=0 defectsFixed=2");
}

main();
