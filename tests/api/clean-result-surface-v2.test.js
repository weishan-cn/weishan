const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files){ const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main(){
  const windowRef = load(["apps/desktop/src/renderer/core/flightFareBreakdown.js", "apps/desktop/src/renderer/core/cheapestTruthGuard.js", "apps/desktop/src/renderer/core/topResultCardsBuilder.js", "apps/desktop/src/renderer/core/cleanResultSurfaceV2.js"]);
  const api = windowRef.WeishanCleanResultSurfaceV2;
  assert.equal(api.CLEAN_RESULT_SURFACE_V2_VERSION, "2.1.73");
  const flight = api.buildCleanResultSurfaceV2({ procurementCategory:"flight", normalizedSearchIntent:{ category:"flight", origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", preference:"直达优先", sortPreference:"低价优先" }, limitedBetaResult:{ enabled:true, priceDisplay:"¥1010" }, sortPreference:"低价优先" });
  assert.equal(flight.summaryTitle, "上海 → 成都");
  assert.match(flight.summarySubtitle, /7 月 15 日/);
  assert.doesNotMatch(flight.summaryTitle, /成都直达/);
  assert.doesNotMatch(flight.summarySubtitle, /not_ranked_as_real_cheapest|Cheapest Truth Guard/);
  assert.equal(flight.surfaceMode, "top_results");
  assert.equal(flight.resultCardCount, 1);
  assert.equal(flight.duplicateNoPriceMessageCount, 0);
  assert.match(flight.statusMessage, /暂无生产真实最低价/);
  assert.match(flight.statusMessage, /不代表真实最低价/);
  assert.equal(flight.cheapestTruthGuardEnabled, true);
  assert.equal(flight.cards[0].priceTruthLabel, "只读候选价，不代表真实最低价");
  assert.equal(flight.cards[0].fareBreakdown.displayRows.find((row) => row.label === "票面价").value, "¥860");
  assert.equal(flight.debugPanelsHiddenByDefault, true);
  assert.equal(flight.safetyDetailEntryLabel, "查看安全与调试详情");
  const noResult = api.buildCleanResultSurfaceV2({ procurementCategory:"product", normalizedSearchIntent:{ category:"product", productName:"iPhone" } });
  assert.equal(noResult.surfaceMode, "top_results");
  assert.equal(noResult.duplicateNoPriceMessageCount, 1);
  assert.match(noResult.statusMessage, /暂无真实价格结果/);
  const blocked = api.buildCleanResultSurfaceV2({ procurementCategory:"restricted_or_blocked", restrictedCategoryDecision:"blocked" });
  assert.equal(blocked.surfaceMode, "blocked");
  assert.equal(blocked.resultCardCount, 0);
  for (const surface of [flight, noResult, blocked]) {
    assert.equal(surface.audit.eventType, "CLEAN_RESULT_SURFACE_V2_DRAFT");
    assert.equal(surface.audit.debugPanelsHiddenByDefault, true);
    assert.equal(surface.audit.backendPanelDefaultExpandedCount, 0);
    assert.equal(surface.audit.bookingUrlDisplayedCount, 0);
    assert.equal(surface.audit.paymentButtonDisplayedCount, 0);
    assert.equal(surface.audit.orderButtonDisplayedCount, 0);
    assert.equal(surface.audit.identityUploadDisplayedCount, 0);
    assert.equal(surface.audit.internalDebugLabelVisibleCount, 0);
    assert.equal(surface.audit.handoffAreaGrouped, true);
    assert.equal(surface.audit.redacted, true);
    assert.equal(surface.userFacingSafetyHintCount <= 2, true);
    assert.equal(api.assertCleanResultSurfaceV2Safe(surface), true);
  }
  console.log("CLEAN_RESULT_SURFACE_V2_CORE PASS");
}
main();
