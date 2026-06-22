const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files){
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}
function main(){
  const windowRef = load([
    "apps/desktop/src/renderer/core/resultBadgeFormatter.js",
    "apps/desktop/src/renderer/core/userSurfaceDebugFieldFilter.js",
    "apps/desktop/src/renderer/core/flightFareBreakdown.js",
    "apps/desktop/src/renderer/core/compactFlightResultCardV1.js",
    "apps/desktop/src/renderer/core/manualVerificationGroup.js",
    "apps/desktop/src/renderer/core/cleanResultSurfaceV4.js"
  ]);
  const api = windowRef.WeishanCleanResultSurfaceV4;
  assert.equal(api.CLEAN_RESULT_SURFACE_V4_VERSION, "2.1.55");
  const fare = windowRef.WeishanFlightFareBreakdown.normalizeFlightFareBreakdown({ baseFare:860, taxes:110, otherFees:40, totalPayable:1010, providerPriceType:"limited_beta_price", taxFeeCompleteness:"partial" });
  const surface = api.buildCleanResultSurfaceV4({ sortIntent:{ origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", directPreference:"直达优先", sortLabel:"低价优先" }, cards:[{ rank:1, priceDisplay:"¥1010", priceTruthLabel:"只读候选价，不代表真实最低价", fareBreakdown:fare, badges:["只读候选价", "平台最终为准", "未锁价", "不代表可出票"] }] });
  assert.equal(surface.surfaceVersion, "v4");
  assert.equal(surface.compactFlightCardEnabled, true);
  assert.equal(surface.debugFieldsHiddenFromUserSurface, true);
  assert.equal(surface.manualHandoffCollapsedByDefault, true);
  assert.equal(surface.longExternalSearchHintCollapsed, true);
  assert.equal(surface.compactCards[0].routeLine, "上海 → 成都");
  assert.equal(surface.compactCards[0].badgeDisplayText, "[只读候选价] [平台最终为准] [未锁价] [不代表可出票]");
  assert.deepEqual(Array.from(surface.compactCards[0].actions), ["刷新只读报价", "去平台确认", "复制搜索条件"]);
  assert.equal(surface.manualVerificationGroup.longExternalSearchHintCollapsed, true);
  assert.equal(surface.providerReadiness.flight_provider.cleanResultSurfaceV4, "active");
  assert.equal(surface.providerReadiness.flight_provider.finalDecision, "limited-beta-ready");
  assert.equal(surface.audit.eventType, "USER_SURFACE_FINAL_CLEANUP_DRAFT");
  assert.equal(surface.audit.debugFieldLeakCount, 0);
  assert.equal(surface.audit.duplicateSafetyHintCount, 0);
  assert.equal(surface.audit.bookingUrlDisplayedCount, 0);
  assert.equal(surface.audit.paymentActionDisplayedCount, 0);
  assert.equal(surface.audit.orderActionDisplayedCount, 0);
  assert.equal(surface.audit.identityUploadDisplayedCount, 0);
  assert.equal(api.assertCleanResultSurfaceV4Safe(surface), true);
  const blocked = api.buildCleanResultSurfaceV4({ restricted:true, cards:[{ priceDisplay:"¥1010" }] });
  assert.equal(blocked.resultCardCount, 0);
  assert.equal(blocked.manualVerificationGroup.visible, false);
  assert.equal(api.assertCleanResultSurfaceV4Safe(blocked), true);
  console.log("CLEAN_RESULT_SURFACE_V4_CORE PASS");
}
main();
