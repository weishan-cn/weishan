const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files){ const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main(){
  const windowRef = load(["apps/desktop/src/renderer/core/flightIntentParser.js", "apps/desktop/src/renderer/core/procurementSortIntentNormalizer.js"]);
  const api = windowRef.WeishanProcurementSortIntentNormalizer;
  assert.equal(api.PROCUREMENT_SORT_INTENT_NORMALIZER_VERSION, "4.1.3");
  const directLow = api.normalizeProcurementSortIntent({ rawUserInput:"7 月 15 日上海到成都最便宜的直达机票" });
  assert.equal(directLow.origin, "上海");
  assert.equal(directLow.destination, "成都");
  assert.equal(directLow.departureDate, "7月15日");
  assert.equal(directLow.dateDisplay, "7 月 15 日");
  assert.equal(directLow.directOnly, true);
  assert.equal(directLow.directPreference, "直达优先");
  assert.equal(directLow.sortPreference, "low_price");
  assert.equal(directLow.sortLabel, "低价优先");
  assert.doesNotMatch(directLow.destination, /直达|直飞|最便宜|最低价|低价/);
  const defaultSort = api.normalizeProcurementSortIntent({ rawUserInput:"7 月 15 日上海到成都机票" });
  assert.equal(defaultSort.sortPreference, "safe_trusted");
  assert.equal(defaultSort.sortLabel, "安全与可信来源优先");
  const flexible = api.normalizeProcurementSortIntent({ rawUserInput:"上海到成都退改灵活机票" });
  assert.equal(flexible.sortPreference, "flexible_refund");
  assert.equal(api.assertProcurementSortIntentSafe(directLow), true);
  assert.equal(api.assertProcurementSortIntentSafe(defaultSort), true);
  assert.equal(directLow.audit.eventType, "PROCUREMENT_SORT_INTENT_NORMALIZER_DRAFT");
  assert.equal(directLow.audit.destinationModifierLeakCount, 0);
  assert.equal(directLow.audit.redacted, true);
  console.log("PROCUREMENT_SORT_INTENT_NORMALIZER_CORE PASS");
}
main();
