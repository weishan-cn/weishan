const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightFareBreakdown.js"]);
  const api = windowRef.WeishanFlightFareBreakdown;
  assert.equal(api.FLIGHT_FARE_BREAKDOWN_VERSION, "2.1.66");

  const fare = api.normalizeFlightFareBreakdown({
    currency:"CNY",
    baseFare:860,
    taxes:110,
    otherFees:40,
    totalPayable:1010,
    taxFeeCompleteness:"partial",
    providerPriceType:"limited_beta_price",
    providerPriceLabel:"只读候选价 / 平台最终为准"
  });

  assert.equal(fare.fareBreakdownVersion, "flight_fare_breakdown_v1");
  assert.equal(fare.priceDisplay, "¥1010");
  assert.equal(fare.priceWithheld, false);
  assert.equal(fare.redacted, true);
  assert.deepEqual(Array.from(fare.displayRows.map((row) => row.label).slice(0, 8)), [
    "最终应付总价",
    "票面价",
    "燃油附加费",
    "机场建设费 / 民航发展基金",
    "平台服务费",
    "税费",
    "其它附加费",
    "优惠 / 补贴"
  ]);
  assert.equal(fare.displayRows.some((row) => row.label === "税费完整性"), true);
  assert.match(fare.displayRows.find((row) => row.label === "燃油附加费").value, /未单独提供/);
  assert.equal(fare.displayRows.find((row) => row.label === "税费完整性").value, "部分完整 / 以平台页面为准");
  assert.equal(fare.audit.eventType, "FLIGHT_FARE_BREAKDOWN_DRAFT");
  assert.equal(fare.audit.redacted, true);
  assert.equal(api.assertFlightFareBreakdownSafe(fare), true);

  const withheld = api.normalizeFlightFareBreakdown({ providerPriceType:"unknown" });
  assert.equal(withheld.priceWithheld, true);
  assert.equal(withheld.priceDisplay, "价格暂不展示");
  assert.equal(withheld.displayRows.find((row) => row.label === "最终应付总价").value, "价格暂不展示");
  assert.equal(api.assertFlightFareBreakdownSafe(withheld), true);

  console.log("FLIGHT_FARE_BREAKDOWN_CORE PASS");
}

main();
