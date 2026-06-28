const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files){ const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main(){
  const windowRef = load(["apps/desktop/src/renderer/core/flightFareBreakdown.js", "apps/desktop/src/renderer/core/resultBadgeFormatter.js", "apps/desktop/src/renderer/core/resultCardVisualFormatter.js", "apps/desktop/src/renderer/core/cleanResultSurfaceV3.js"]);
  const api = windowRef.WeishanCleanResultSurfaceV3;
  assert.equal(api.CLEAN_RESULT_SURFACE_V3_VERSION, "2.1.92");
  const fare = windowRef.WeishanFlightFareBreakdown.normalizeFlightFareBreakdown({ baseFare:860, taxes:110, otherFees:40, totalPayable:1010, providerPriceType:"limited_beta_price", taxFeeCompleteness:"partial" });
  const surface = api.buildCleanResultSurfaceV3({ procurementCategory:"flight", statusMessage:"暂无生产真实最低价，不代表真实最低价", sortIntent:{ origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", directPreference:"直达优先", sortLabel:"低价优先" }, cards:[{ rank:1, title:"上海 → 成都 · 7 月 15 日 · 直达优先 · 低价优先", providerName:"Flight Provider Sandbox", priceDisplay:"¥1010", priceTruthLabel:"只读候选价，不代表真实最低价", fareBreakdown:fare, badges:["只读候选价", "平台最终为准", "未锁价", "不代表可出票"] }] });
  assert.equal(surface.surfaceVersion, "v3");
  assert.equal(surface.compactCardsEnabled, true);
  assert.equal(surface.longExternalSearchHintCollapsed, true);
  assert.equal(surface.manualVerificationGroupEnabled, true);
  assert.equal(surface.debugPanelsHiddenByDefault, true);
  assert.equal(surface.resultCardCount, 1);
  assert.equal(surface.visualCards[0].routeLine, "上海 → 成都");
  assert.equal(surface.visualCards[0].fareSummaryLine, "票面价 ¥860｜税费 ¥110｜附加费 ¥40");
  assert.equal(surface.audit.eventType, "CLEAN_RESULT_SURFACE_V3_DRAFT");
  assert.equal(surface.audit.duplicateSafetyHintCount, 0);
  assert.equal(surface.audit.internalDebugLabelVisibleCount, 0);
  assert.equal(surface.audit.bookingUrlDisplayedCount, 0);
  assert.equal(surface.audit.paymentActionDisplayedCount, 0);
  assert.equal(surface.audit.orderActionDisplayedCount, 0);
  assert.equal(surface.audit.identityUploadDisplayedCount, 0);
  assert.equal(api.assertCleanResultSurfaceV3Safe(surface), true);
  const blocked = api.buildCleanResultSurfaceV3({ restricted:true, cards:[{ title:"hidden" }] });
  assert.equal(blocked.resultCardCount, 0);
  assert.equal(blocked.manualVerificationGroupEnabled, false);
  assert.equal(api.assertCleanResultSurfaceV3Safe(blocked), true);
  console.log("CLEAN_RESULT_SURFACE_V3_CORE PASS");
}
main();
