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
  Math
});

vm.runInContext(fs.readFileSync(path.join(rendererCore, "homeUnifiedIntentRouter.js"), "utf8"), context, {
  filename:"homeUnifiedIntentRouter.js"
});

const router = windowRef.WeishanHomeUnifiedIntentRouter;
const D = router.SEARCH_DOMAINS;
const O = router.SEARCH_OUTCOMES;

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const searchCorpus = [
  { id:"shopping-iphone", text:"iPhone 17 Pro 512GB 哪里便宜", kind:"clear", expectedDomain:D.SHOPPING, expectedDestination:"COMMERCE" },
  { id:"shopping-macbook", text:"MacBook Air M4 16+512", kind:"clear", expectedDomain:D.SHOPPING, expectedDestination:"COMMERCE" },
  { id:"shopping-ps5", text:"PS5 slim cheapest price", kind:"clear", expectedDomain:D.SHOPPING, expectedDestination:"COMMERCE" },
  { id:"flight-cdg-tyo", text:"成都到东京下周两个人经济舱", kind:"clear", expectedDomain:D.FLIGHT, expectedDestination:"COMMERCE" },
  { id:"flight-sha-ctu", text:"上海到成都7月15日机票", kind:"clear", expectedDomain:D.FLIGHT, expectedDestination:"COMMERCE" },
  { id:"hotel-tokyo", text:"东京9月10日住3晚酒店", kind:"clear", expectedDomain:D.HOTEL, expectedDestination:"COMMERCE" },
  { id:"hotel-room", text:"上海两个人一间房三晚住宿价格", kind:"clear", expectedDomain:D.HOTEL, expectedDestination:"COMMERCE" },
  { id:"cruise-hk", text:"10月香港出发阳台房邮轮价格", kind:"clear", expectedDomain:D.CRUISE, expectedDestination:"COMMERCE" },
  { id:"cruise-seven", text:"香港出发7晚邮轮", kind:"clear", expectedDomain:D.CRUISE, expectedDestination:"COMMERCE" },
  { id:"mail-reply", text:"谁还在等我回复？", kind:"clear", expectedDomain:D.MAIL, expectedDestination:"MAIL" },
  { id:"mail-invoice", text:"找苹果电脑发票", kind:"clear", expectedDomain:D.MAIL, expectedDestination:"MAIL" },
  { id:"mail-confirmation", text:"成都到东京机票确认邮件", kind:"clear", expectedDomain:D.MAIL, expectedDestination:"MAIL" },
  { id:"ambiguous-apple", text:"苹果", kind:"ambiguous", expectedOutcome:O.CLARIFY },
  { id:"ambiguous-tokyo", text:"东京", kind:"ambiguous", expectedOutcome:O.CLARIFY },
  { id:"ambiguous-hotel", text:"酒店", kind:"ambiguous", expectedOutcome:O.CLARIFY },
  { id:"ambiguous-flight", text:"机票", kind:"ambiguous", expectedOutcome:O.CLARIFY },
  { id:"ambiguous-invoice", text:"发票", kind:"ambiguous", expectedOutcome:O.CLARIFY },
  { id:"ambiguous-order", text:"订单", kind:"ambiguous", expectedOutcome:O.CLARIFY },
  { id:"mixed-product-invoice", text:"比较 MacBook 价格，然后找上个月那张发票", kind:"mixed", expectedOutcome:O.MIXED },
  { id:"mixed-hotel-mail", text:"东京酒店多少钱，再找酒店确认邮件", kind:"mixed", expectedOutcome:O.MIXED },
  { id:"mixed-flight-mail", text:"成都到东京机票，然后找机票确认邮件", kind:"mixed", expectedOutcome:O.MIXED },
  { id:"mixed-cruise-mail", text:"香港邮轮价格，然后找邮轮确认邮件", kind:"mixed", expectedOutcome:O.MIXED }
];

test("search corpus covers clear domains, ambiguity, and mixed intent without wrong confident routing", () => {
  const report = router.evaluateSearchCorpus(searchCorpus);
  assert.equal(report.metrics.TOTAL_ROUTING_CASES, 22);
  assert.equal(report.metrics.CLEAR_CASES, 12);
  assert.equal(report.metrics.CLEAR_CORRECT, 12);
  assert.equal(report.metrics.AMBIGUOUS_CASES, 6);
  assert.equal(report.metrics.AMBIGUOUS_SAFE, 6);
  assert.equal(report.metrics.MIXED_INTENT_CASES, 4);
  assert.equal(report.metrics.MIXED_INTENT_SAFE, 4);
  assert.equal(report.metrics.WRONG_CONFIDENT, 0);
  assert.equal(report.metrics.MAIL_READS_FROM_GLOBAL_SEARCH, 0);
  assert.equal(report.metrics.PROVIDER_CALLS, 0);
  assert.equal(report.metrics.EXTERNAL_EFFECTS, 0);
  assert.equal(report.metrics.PASS, true);
});

test("mail privacy boundary is explicit and never silently reads mailbox from global search", () => {
  const invoice = router.classifySearchScope("找苹果电脑发票");
  assert.equal(invoice.domain, D.MAIL);
  assert.equal(invoice.destination, "MAIL");
  assert.equal(invoice.readsMailbox, false);
  assert.equal(invoice.mailAccessRequiresConfirmation, true);

  const globalApple = router.classifySearchScope("苹果");
  assert.equal(globalApple.outcome, O.CLARIFY);
  assert.equal(globalApple.readsMailbox, false);

  const mixed = router.classifySearchScope("比较苹果电脑价格，同时找发票");
  assert.equal(mixed.outcome, O.MIXED);
  assert.equal(mixed.readsMailbox, false);
  assert.equal(mixed.safeToRouteConfidently, false);
});

test("normalization is deterministic and malicious input cannot trigger external effects", () => {
  assert.equal(router.normalizeSearchQuery("  MacBook\tAir\nM4   16+512  "), "MacBook Air M4 16+512");
  const malicious = router.classifySearchScope("https://evil.example/checkout?pay=1");
  assert.equal(malicious.outcome, O.CLARIFY);
  assert.equal(malicious.externalEffects, false);
  assert.equal(malicious.providerCalls, false);
  assert.equal(malicious.productionTraffic, false);

  const objectLike = router.classifySearchScope({ toString(){ return "__proto__ password token checkout"; } });
  assert.equal(objectLike.externalEffects, false);
  assert.equal(objectLike.providerCalls, false);
});

test("request identity suppresses duplicate submissions and ignores stale results", () => {
  const first = router.beginSearch(router.createSearchState(), "iPhone 17 Pro 512GB 哪里便宜");
  assert.equal(first.loading, true);
  const duplicate = router.beginSearch(first, "iPhone 17 Pro 512GB 哪里便宜");
  assert.equal(duplicate.duplicateSuppressed, true);
  assert.equal(duplicate.activeRequestId, first.activeRequestId);

  const second = router.beginSearch(first, "成都到东京下周两个人经济舱");
  assert.notEqual(second.activeRequestId, first.activeRequestId);
  const stale = router.completeSearch(second, first.activeRequestId, { results:[{ title:"old result" }] });
  assert.equal(stale.staleResultIgnored, true);
  assert.equal(stale.results.length, 0);

  const ready = router.completeSearch(second, second.activeRequestId, { results:[{ title:"fresh flight" }] });
  assert.equal(ready.status, "ready");
  assert.equal(ready.results.length, 1);
});

test("domain switching clears stale loading, errors and incompatible results", () => {
  const shopping = router.beginSearch(router.createSearchState(), "iPhone 17 Pro 512GB 哪里便宜");
  const failed = router.failSearch(shopping, shopping.activeRequestId, { code:"TIMEOUT from provider with private details" });
  assert.equal(failed.status, "source_failure");
  assert.equal(failed.loading, false);
  const hotel = router.switchSearchDomain(failed, "HOTEL");
  assert.equal(hotel.activeDomain, D.HOTEL);
  assert.equal(hotel.status, "idle");
  assert.equal(hotel.loading, false);
  assert.equal(hotel.results.length, 0);
  assert.equal(hotel.error, null);
});

test("no-result and source-failure copy is truthful and does not leak internal enum-only UX", () => {
  const scope = router.classifySearchScope("iPhone 17 Pro 512GB 哪里便宜");
  const noResult = router.buildNoResultState(scope);
  assert.equal(noResult.fabricated, false);
  assert.equal(noResult.providerClaims, false);
  assert.match(noResult.userMessage, /不会编造|换关键词|补充/);
  assert.doesNotMatch(noResult.userMessage, /NO_RESULT|SOURCE_FAILURE|READY/);

  const pending = router.beginSearch(router.createSearchState(), "iPhone 17 Pro 512GB 哪里便宜");
  const failure = router.failSearch(pending, pending.activeRequestId, { code:"NETWORK_DOWN" });
  assert.equal(failure.status, "source_failure");
  assert.equal(failure.error.safe, true);
  assert.match(failure.userMessage, /不会把失败说成没有结果/);
});

test("module decision matrix preserves simplification actions for Search public beta", () => {
  const matrix = router.buildFeatureDecisionMatrix();
  assert.ok(matrix.some((item) => item.feature === "Search domain classifier" && item.decision === "OPTIMIZE"));
  assert.ok(matrix.some((item) => item.feature === "Search request identity and stale-result handling" && item.decision === "KEEP"));
  assert.ok(matrix.some((item) => item.feature === "Static Home model/module cards" && item.decision === "DELETE"));
});

test("router source remains pure: no provider transport, persistence, or renderer secret surfaces", () => {
  const source = fs.readFileSync(path.join(rendererCore, "homeUnifiedIntentRouter.js"), "utf8");
  assert.equal(/fetch\s*\(|XMLHttpRequest|ipcRenderer|ipcMain|localStorage|sessionStorage|writeFile|safeStorage|providerCredential|client_secret/i.test(source), false);
  assert.equal(/createBooking|submitPayment|checkout\/|createOrder|purchaseNow/i.test(source), false);
});

tests.forEach(([, fn]) => fn());
console.log("SEARCH_MODULE_EFFECTIVENESS_TESTS PASS " + tests.length);
