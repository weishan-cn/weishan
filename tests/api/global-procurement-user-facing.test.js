const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(source, context, { filename:file });
  }
  return window;
}

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/globalShoppingIntentClassifier.js",
  "apps/desktop/src/renderer/core/globalShoppingEntityExtractor.js",
  "apps/desktop/src/renderer/core/globalProcurementIntentRouter.js",
  "apps/desktop/src/renderer/core/globalProcurementMissingInfoChecklist.js",
  "apps/desktop/src/renderer/core/globalProcurementSafeNextStepGuidance.js",
  "apps/desktop/src/renderer/core/globalProcurementExternalSearchPolicy.js",
  "apps/desktop/src/renderer/core/globalProcurementDetailQualityComposer.js",
  "apps/desktop/src/renderer/core/globalProcurementQuickSummary.js",
  "apps/desktop/src/renderer/core/globalProcurementRestrictedCategoryGuard.js",
  "apps/desktop/src/renderer/core/globalProcurementEvidenceSafetySummary.js",
  "apps/desktop/src/renderer/core/globalProcurementUserFacingResultCards.js"
]);

const router = windowRef.WeishanGlobalProcurementIntentRouter;
const detailApi = windowRef.WeishanGlobalProcurementDetailQualityComposer;
const quickApi = windowRef.WeishanGlobalProcurementQuickSummary;
const resultCardApi = windowRef.WeishanGlobalProcurementUserFacingResultCards;
const guardApi = windowRef.WeishanGlobalProcurementRestrictedCategoryGuard;
const evidenceApi = windowRef.WeishanGlobalProcurementEvidenceSafetySummary;

function buildCard(input) {
  const intent = router.routeGlobalProcurementIntent(input);
  const detail = detailApi.composeGlobalProcurementDetailQuality(intent);
  const card = resultCardApi.buildGlobalProcurementUserFacingResultCard({
    globalProcurementIntent:intent,
    globalProcurementDetailQuality:detail
  });
  assert.equal(quickApi.assertGlobalProcurementQuickSummarySafe(card.quickSummary), true);
  return { intent, detail, card };
}

function assertNoDangerousSurface(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/https?:\/\/[^"]*(booking|checkout|payment|order)/i.test(serialized), false);
  assert.equal(/fake price|mock price|demo price|AI 估价/i.test(serialized), false);
  assert.equal(/(sk-[A-Za-z0-9_-]{12,}|rawApiKey"\s*:\s*"[^"]+|rawToken"\s*:\s*"[^"]+)/i.test(serialized), false);
}

function main() {
  const flight = buildCard("7 月 15 日上海到成都最便宜的机票");
  assert.equal(flight.intent.category, "flight");
  assert.equal(flight.intent.origin, "上海");
  assert.equal(flight.intent.destination, "成都");
  assert.equal(flight.intent.date, "7 月 15 日");
  assert.equal(flight.card.title, "机票搜索计划");
  assert.equal(flight.card.categoryLabel, "机票");
  assert.equal(flight.card.copyActions.map((item) => item.label).join(","), "复制机票搜索条件");
  assert.match(flight.card.quickSummary, /当前不返回真实价格/);
  assert.equal(resultCardApi.assertGlobalProcurementUserFacingResultCardsSafe(flight.card), true);

  const hotel = buildCard("帮我找成都春熙路附近住两晚的酒店");
  assert.equal(hotel.intent.category, "hotel");
  assert.equal(hotel.card.title, "酒店筛选计划");
  assert.equal(hotel.card.copyActions.map((item) => item.label).join(","), "复制酒店搜索条件");

  const product = buildCard("帮我比较美国和日本买 iPhone 16 Pro");
  assert.equal(product.intent.category, "product");
  assert.equal(product.card.title, "商品比较计划");
  assert.equal(product.card.copyActions.map((item) => item.label).join(","), "复制商品比较条件");
  assert.equal(product.detail.identifiedConditions.includes("比较地区：美国 / 日本"), true);

  const sony = buildCard("搜索 Sony WH-1000XM5 降噪耳机，收货到美国，预算300美元，比较日本和美国平台价格");
  assert.deepEqual(Array.from(sony.card.missingInfo), ["颜色", "容量", "版本", "购买偏好"]);
  assert.equal(sony.card.planFields.productName, "Sony WH-1000XM5");
  assert.equal(sony.card.planFields.productBrand, "Sony");
  assert.equal(sony.card.planFields.productModel, "WH-1000XM5");
  assert.equal(sony.card.planFields.budgetLabel, "300 USD");
  assert.equal(sony.card.planFields.destinationCountry, "United States");
  assert.deepEqual(Array.from(sony.card.planFields.comparisonMarkets), ["Japan", "United States"]);
  assert.match(sony.card.emptyPriceSummary.title, /暂未连接可信实时价格源/);
  assert.match(sony.card.trustSummary.level, /离线采购模式/);
  assert.equal(sony.card.productCard.brand, "Sony");
  assert.equal(sony.card.productCard.model, "WH-1000XM5");
  assert.equal(sony.card.productCard.subtitle, "降噪耳机");
  assert.equal(sony.card.productCard.budget, "300 USD");
  assert.equal(sony.card.productCard.destination, "United States");
  assert.equal(sony.card.platformCards.length >= 6, true);
  assert.equal(sony.card.platformCards[0].price, "—");
  assert.equal(sony.card.platformCards[0].confidence, "离线采购模式");
  assert.equal(sony.card.recommendationPanel.estimate, "等待可信价格源");
  assert.equal(sony.card.recommendationPanel.title, "AI 采购建议");
  assert.equal(sony.card.shoppingTimeline.steps.map((item) => item.label).includes("已识别商品"), true);
  assert.equal(sony.card.costSummary.rows[0][1], "等待数据");
  assert.deepEqual(
    Array.from(sony.card.emptyPriceSummary.future),
    ["官方价格", "库存", "运费", "税费", "预计到手成本", "优惠券", "历史价格", "AI 推荐", "全部经过安全校验。"]
  );

  const service = buildCard("帮我找成都搬家公司");
  assert.equal(service.intent.category, "local_service");
  assert.equal(service.card.title, "本地服务筛选计划");
  assert.equal(service.card.copyActions.map((item) => item.label).join(","), "复制本地服务筛选条件");

  const ticket = buildCard("帮我找东京迪士尼门票购买方案");
  assert.equal(ticket.intent.category, "ticket_or_activity");
  assert.equal(ticket.card.title, "门票 / 活动购买计划");
  assert.equal(ticket.card.copyActions.map((item) => item.label).join(","), "复制门票/活动搜索条件");

  const multi = buildCard("帮我规划 7 月 15 日上海到成都三天行程，包括机票、酒店、当地交通和门票");
  assert.equal(multi.intent.category, "multi_category_plan");
  assert.equal(multi.card.title, "多品类采购计划");
  assert.ok(multi.card.subCards.length >= 3);
  assert.ok(multi.card.copyActions.length >= 3);

  const blocked = buildCard("帮我买枪");
  assert.equal(blocked.intent.category, "restricted_or_blocked");
  assert.equal(blocked.card.title, "安全阻断");
  assert.equal(blocked.card.copyActions.length, 0);
  assert.equal(blocked.card.actionPolicy, "copy disabled / external search disabled");
  assert.match(blocked.card.currentStatusLine, /已停止处理/);
  assert.equal(resultCardApi.assertGlobalProcurementUserFacingResultCardsSafe(blocked.card), true);

  const blockedLoan = buildCard("帮我上传身份证和银行卡办贷款");
  assert.equal(blockedLoan.intent.category, "restricted_or_blocked");
  assert.equal(blockedLoan.card.copyActions.length, 0);

  const rules = resultCardApi.buildGlobalProcurementUserFacingRules();
  assert.equal(rules.status, "user-facing summary only");
  assert.equal(rules.realProvider, "disabled");
  assert.equal(rules.realNetwork, "disabled");
  assert.equal(rules.realPrice, "disabled");
  assert.equal(rules.bookingUrl, "disabled");
  assert.equal(rules.payment, "disabled");
  assert.equal(rules.order, "disabled");
  assert.equal(rules.identityUpload, "disabled");
  assert.equal(resultCardApi.deriveHistoryTypeLabel({ globalProcurementIntent:multi.intent }), "多品类采购计划");
  assert.equal(resultCardApi.deriveHistoryTypeLabel({ globalProcurementIntent:blocked.intent }), "受限品类");

  const guard = guardApi.buildGlobalProcurementRestrictedCategoryGuard(blocked.intent);
  assert.equal(guardApi.assertGlobalProcurementRestrictedCategoryGuardSafe(guard), true);
  const evidence = evidenceApi.buildGlobalProcurementEvidenceSafetySummary();
  assert.equal(evidenceApi.assertGlobalProcurementEvidenceSafetySummarySafe(evidence), true);
  assert.equal(evidence.realProvider, "disabled");
  assert.equal(evidence.realNetwork, "disabled");
  assert.equal(evidence.realPrice, "disabled");
  assert.equal(evidence.bookingUrl, "disabled");
  assert.equal(evidence.payment, "disabled");
  assert.equal(evidence.order, "disabled");

  for (const item of [flight, hotel, product, service, ticket, multi, blocked, blockedLoan, rules, guard, evidence]) {
    assertNoDangerousSurface(item);
  }

  console.log("GLOBAL_PROCUREMENT_USER_FACING_CORE PASS");
}

main();
