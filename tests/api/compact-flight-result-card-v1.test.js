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
    "apps/desktop/src/renderer/core/flightFareBreakdown.js",
    "apps/desktop/src/renderer/core/compactFlightResultCardV1.js"
  ]);
  const api = windowRef.WeishanCompactFlightResultCardV1;
  assert.equal(api.COMPACT_FLIGHT_RESULT_CARD_V1_VERSION, "2.1.78");
  const fare = windowRef.WeishanFlightFareBreakdown.normalizeFlightFareBreakdown({ baseFare:860, taxes:110, otherFees:40, totalPayable:1010, providerPriceType:"limited_beta_price", taxFeeCompleteness:"partial" });
  const card = api.buildCompactFlightResultCard({ origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", directPreference:"直达优先", sortLabel:"低价优先", fareBreakdown:fare });
  assert.equal(card.cardVersion, "compact_flight_result_card_v1");
  assert.equal(card.primaryPrice, "¥1010");
  assert.equal(card.routeLine, "上海 → 成都");
  assert.equal(card.metaLine, "7 月 15 日 · 直达优先 · 低价优先");
  assert.equal(card.fareSummary, "票面价 ¥860｜税费 ¥110｜附加费 ¥40");
  assert.equal(card.detailFareBreakdownCollapsedByDefault, true);
  assert.deepEqual(Array.from(card.badges), ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"]);
  assert.deepEqual(Array.from(card.actions), ["刷新只读报价", "去平台确认", "复制搜索条件"]);
  assert.equal(card.badgeDisplayText, "[只读候选价] [平台最终为准] [未锁价] [不代表可出票]");
  assert.equal(card.badgeDisplayText.includes("只读候选价平台最终为准"), false);
  assert.equal(card.bookingUrl, null);
  assert.equal(card.autoOpen, false);
  assert.equal(card.autoRefresh, false);
  assert.equal(card.payment, false);
  assert.equal(card.order, false);
  assert.equal(card.identityUpload, false);
  assert.equal(card.audit.eventType, "COMPACT_FLIGHT_RESULT_CARD_V1_DRAFT");
  assert.equal(card.audit.redacted, true);
  assert.equal(api.assertCompactFlightResultCardSafe(card), true);
  console.log("COMPACT_FLIGHT_RESULT_CARD_V1_CORE PASS");
}
main();
