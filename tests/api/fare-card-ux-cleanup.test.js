const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files){ const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightFareBreakdown.js",
    "apps/desktop/src/renderer/core/cheapestTruthGuard.js",
    "apps/desktop/src/renderer/core/topResultCardsBuilder.js",
    "apps/desktop/src/renderer/core/cleanResultSurfaceV2.js"
  ]);
  const fareApi = windowRef.WeishanFlightFareBreakdown;
  const surfaceApi = windowRef.WeishanCleanResultSurfaceV2;
  const topApi = windowRef.WeishanTopResultCardsBuilder;

  const fare = fareApi.normalizeFlightFareBreakdown({
    currency:"CNY",
    baseFare:860,
    fuelSurcharge:null,
    airportConstructionFee:null,
    platformServiceFee:null,
    taxes:110,
    otherFees:40,
    discount:null,
    totalPayable:1010,
    taxFeeCompleteness:"partial",
    providerPriceType:"limited_beta_price"
  });
  const lines = fare.displayRows.map((row) => row.label + "：" + row.value);
  assert.equal(lines.includes("最终应付总价：¥1010"), true);
  assert.equal(lines.includes("票面价：¥860"), true);
  assert.equal(lines.includes("燃油附加费：未单独提供 / 以平台页面为准"), true);
  assert.equal(lines.includes("机场建设费 / 民航发展基金：未单独提供 / 以平台页面为准"), true);
  assert.equal(lines.includes("平台服务费：未单独提供 / 以平台页面为准"), true);
  assert.equal(lines.includes("税费：¥110"), true);
  assert.equal(lines.includes("其它附加费：¥40"), true);
  assert.equal(lines.includes("优惠 / 补贴：未提供"), true);
  assert.equal(lines.includes("税费完整性：部分完整 / 以平台页面为准"), true);
  assert.equal(lines.filter((line) => line.startsWith("最终应付总价：")).length, 1);
  assert.equal(lines.some((line) => /partial|not_ranked_as_real_cheapest|Cheapest Truth Guard/.test(line)), false);

  const cards = topApi.buildTopResultCards({
    procurementCategory:"flight",
    normalizedSearchIntent:{ category:"flight", origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", directPreference:"直达优先", sortPreference:"低价优先", sortPreferenceLabel:"低价优先" },
    limitedBetaResult:{ enabled:true, fareBreakdown:fare },
    sortPreference:"低价优先",
    restrictedCategoryDecision:"allow",
    redacted:true
  });
  assert.equal(cards.cards[0].title, "上海 → 成都 · 7 月 15 日 · 直达优先 · 低价优先");
  assert.equal(cards.audit.fareCardUxCleanupAudit.eventType, "FARE_CARD_UX_CLEANUP_DRAFT");
  assert.equal(cards.audit.fareCardUxCleanupAudit.redacted, true);

  const surface = surfaceApi.buildCleanResultSurfaceV2({
    procurementCategory:"flight",
    normalizedSearchIntent:{ category:"flight", origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", directPreference:"直达优先", preference:"直达优先", sortPreference:"低价优先" },
    limitedBetaResult:{ enabled:true, fareBreakdown:fare },
    sortPreference:"低价优先"
  });
  assert.equal(surface.summaryTitle, "上海 → 成都");
  assert.match(surface.summarySubtitle, /7 月 15 日/);
  assert.equal(surface.audit.eventType, "CLEAN_RESULT_SURFACE_V2_DRAFT");
  assert.equal(surface.audit.destinationModifierLeakCount, 0);
  assert.equal(surface.audit.duplicateSafetyHintCount, 0);
  assert.equal(surface.audit.internalDebugLabelVisibleCount, 0);
  assert.equal(surface.audit.handoffAreaGrouped, true);
  assert.equal(surface.finalSafetyNotice.match(/weishan 只做搜索和比较/g).length, 1);
  assert.equal(surfaceApi.assertCleanResultSurfaceV2Safe(surface), true);

  console.log("FARE_CARD_UX_CLEANUP_CORE PASS");
}

main();
