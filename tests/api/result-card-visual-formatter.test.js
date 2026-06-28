const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files){ const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main(){
  const windowRef = load(["apps/desktop/src/renderer/core/flightFareBreakdown.js", "apps/desktop/src/renderer/core/resultBadgeFormatter.js", "apps/desktop/src/renderer/core/resultCardVisualFormatter.js"]);
  const api = windowRef.WeishanResultCardVisualFormatter;
  const badgeApi = windowRef.WeishanResultBadgeFormatter;
  assert.equal(api.RESULT_CARD_VISUAL_FORMATTER_VERSION, "2.1.95");
  assert.equal(badgeApi.RESULT_BADGE_FORMATTER_VERSION, "2.1.95");
  const fare = windowRef.WeishanFlightFareBreakdown.normalizeFlightFareBreakdown({ baseFare:860, taxes:110, otherFees:40, totalPayable:1010, providerPriceType:"limited_beta_price", taxFeeCompleteness:"partial" });
  const model = api.buildResultCardVisualModel({
    procurementCategory:"flight",
    sortIntent:{ origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", directPreference:"直达优先", sortLabel:"低价优先" },
    card:{ title:"上海 → 成都 · 7 月 15 日 · 直达优先 · 低价优先", providerName:"Flight Provider Sandbox", priceDisplay:"¥1010", updatedAt:"2026-06-20T00:00:00.000Z", priceTruthLabel:"只读候选价 · 平台最终为准 · 未锁价 · 不代表可出票", badges:["只读候选价", "平台最终为准", "未锁价", "不代表可出票"], fareBreakdown:fare }
  });
  assert.equal(model.visualCardVersion, "result_card_visual_v1");
  assert.equal(model.routeLine, "上海 → 成都");
  assert.equal(model.metaLine, "7 月 15 日 · 直达优先 · 低价优先");
  assert.equal(model.primaryPrice, "¥1010");
  assert.equal(model.priceSubtext, "只读候选价 · 平台最终为准 · 未锁价 · 不代表可出票");
  assert.equal(model.fareSummaryLine, "票面价 ¥860｜税费 ¥110｜附加费 ¥40");
  assert.equal(model.compactFareBreakdown.primaryLine, "最终应付总价：¥1010");
  assert.equal(model.compactFareBreakdown.caveatLine, "燃油/机建费：未单独提供，以平台页面为准");
  assert.deepEqual(Array.from(model.badges), ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"]);
  assert.equal(model.badgeDisplayText, "[只读候选价] [平台最终为准] [未锁价] [不代表可出票]");
  assert.equal(model.bookingUrl, null);
  assert.equal(model.payment, false);
  assert.equal(model.order, false);
  assert.equal(model.identityUpload, false);
  assert.equal(api.assertResultCardVisualSafe(model), true);
  assert.equal(model.audit.eventType, "RESULT_CARD_VISUAL_FORMATTER_DRAFT");
  assert.equal(model.audit.compactFareBreakdownEnabled, true);
  assert.equal(model.audit.badgeSeparated, true);
  console.log("RESULT_CARD_VISUAL_FORMATTER_CORE PASS");
}
main();
