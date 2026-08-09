const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
["globalCommerceInputGuard.js", "globalCommercePricing.js"].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/renderer/core", file), "utf8"), context);
});
const pricing = windowRef.WeishanGlobalCommercePricing;
const base = { currency:"usd", basePrice:10.1, tax:0.2, shipping:1, discount:0.1, promotion:0, coupon:0, membershipSavings:0, effectivePrice:11.2, historicalPrice:12, priceConfidence:"HIGH" };
const first = pricing.createPriceSnapshot(base);
assert.equal(first.success, true);
assert.deepEqual(JSON.parse(JSON.stringify(first.snapshot)), {
  currency:"USD", basePrice:10.1, tax:0.2, shipping:1, discount:0.1, promotion:0, coupon:0, membershipSavings:0, effectivePrice:11.2, historicalPrice:12, priceConfidence:"HIGH", priceChangeAmount:-0.8, priceChangePercent:-6.67, calculated:true
});
assert.equal(pricing.createPriceSnapshot({ currency:"JPY", basePrice:10 }).snapshot.tax, 0);
assert.equal(pricing.createPriceSnapshot({ currency:"JPY", basePrice:1, tax:0, shipping:0, discount:2 }).snapshot.effectivePrice, 0);
assert.equal(pricing.calculateEffectivePrice(base).effectivePrice, 11.2);
assert.equal(pricing.createPriceSnapshot({ currency:"USD", basePrice:10, effectivePrice:9 }).error.code, "PRICE_EFFECTIVE_MISMATCH");
assert.equal(pricing.createPriceSnapshot({ currency:"USD", basePrice:-1 }).error.code, "PRICE_AMOUNT_INVALID");
assert.equal(pricing.createPriceSnapshot({ currency:"USD", basePrice:"10" }).error.code, "PRICE_AMOUNT_INVALID");
assert.equal(pricing.createPriceSnapshot({ currency:"US", basePrice:10 }).error.code, "PRICE_CURRENCY_INVALID");
assert.equal(pricing.createPriceSnapshot({ currency:"USD", basePrice:10, priceConfidence:"AUTO" }).error.code, "PRICE_INPUT_REJECTED");
assert.equal(pricing.createPriceSnapshot({ currency:"USD", basePrice:10, historicalPrice:0 }).snapshot.priceChangePercent, null);
[NaN, Infinity, -Infinity].forEach((value) => assert.equal(pricing.createPriceSnapshot({ currency:"USD", basePrice:value }).error.code, "COMMERCE_INPUT_REJECTED"));

const same = pricing.comparePriceSnapshots([{ currency:"USD", basePrice:20 }, { currency:"USD", basePrice:10 }, { currency:"USD", basePrice:10 }]);
assert.equal(same.comparable, true);
assert.deepEqual(JSON.parse(JSON.stringify(same.snapshots.map((item) => item.basePrice))), [10, 10, 20]);
assert.equal(same.cheapest.basePrice, 10);
const mixed = pricing.comparePriceSnapshots([{ currency:"USD", basePrice:1 }, { currency:"JPY", basePrice:1 }]);
assert.equal(mixed.comparable, false);
assert.equal(mixed.cheapest, null);
assert.deepEqual(JSON.parse(JSON.stringify(mixed.snapshots.map((item) => item.currency))), ["USD", "JPY"]);
assert.equal(pricing.comparePriceSnapshots([]).bestPrice, null);
assert.equal(pricing.comparePriceSnapshots([{ currency:"USD", basePrice:1 }]).comparable, true);

const assessment = pricing.createPricingAssessment({ snapshots:[{ currency:"USD", basePrice:2 }, { currency:"USD", basePrice:1 }] });
assert.equal(assessment.pricing.bestPrice.effectivePrice, 1);
const inputSnapshot = JSON.stringify(base);
pricing.createPriceSnapshot(base);
assert.equal(JSON.stringify(base), inputSnapshot);
first.snapshot.basePrice = 999;
assert.equal(pricing.createPriceSnapshot(base).snapshot.basePrice, 10.1);
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(pricing.createPriceSnapshot(base))), JSON.parse(JSON.stringify(first)));
console.log("GLOBAL_COMMERCE_PRICING PASS");
