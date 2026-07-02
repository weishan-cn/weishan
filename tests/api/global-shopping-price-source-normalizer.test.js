const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js"]);
  const api = windowRef.WeishanGlobalShoppingPriceSourceNormalizer;
  assert.equal(api.GLOBAL_SHOPPING_PRICE_SOURCE_NORMALIZER_VERSION, "4.0.4");
  const model = api.buildGlobalShoppingPriceSourceNormalizer({ sources:[
    { candidateId:"official", sourceType:"official", sourceName:"Official", itemType:"flight", basePrice:100, taxAmount:10, shippingFee:2, platformFee:3, serviceFee:4, paymentFee:5, baggageFee:6, couponDiscount:7, currency:"CNY", lastCheckedAt:"fixture", confidence:"high" },
    { candidateId:"authorized", sourceType:"authorized", sourceName:"Authorized", basePrice:120, taxAmount:1, shippingFee:1, platformFee:1, serviceFee:1, paymentFee:1, baggageFee:1, couponDiscount:1, currency:"CNY", lastCheckedAt:"fixture" },
    { candidateId:"aggregator", sourceType:"aggregator", sourceName:"Aggregator", basePrice:130, taxAmount:0, shippingFee:0, platformFee:0, serviceFee:0, paymentFee:0, baggageFee:0, couponDiscount:0, currency:"CNY", lastCheckedAt:"fixture" },
    { candidateId:"user", sourceType:"user_submitted", sourceName:"User", basePrice:140, taxAmount:0, shippingFee:0, platformFee:0, serviceFee:0, paymentFee:0, baggageFee:0, couponDiscount:0, currency:"CNY", lastCheckedAt:"fixture" },
    { candidateId:"fixture", sourceType:"fixture", sourceName:"Fixture", basePrice:150, taxAmount:0, shippingFee:0, platformFee:0, serviceFee:0, paymentFee:0, baggageFee:0, couponDiscount:0, currency:"CNY", lastCheckedAt:"fixture" }
  ]});
  assert.equal(model.appVersion, "4.0.4");
  assert.equal(model.status, "ready");
  assert.equal(model.normalizerName, "global_shopping_price_source_normalizer_v1");
  assert.equal(model.normalizedCandidates[0].normalizedTotal, 123);
  assert.deepEqual(JSON.parse(JSON.stringify(model.normalizedCandidates.map((item) => item.sourceType))), ["official", "authorized", "aggregator", "user_submitted", "fixture"]);
  assert.equal(model.normalizedCandidates[0].sourceTrustLevel, "official");
  assert.equal(model.normalizedCandidates[1].sourceTrustLevel, "authorized");
  assert.equal(model.normalizedCandidates[0].priceCompleteness, "complete");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ sources:[{ sourceName:"Missing type", basePrice:1, currency:"CNY", lastCheckedAt:"fixture" }] }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ sources:[{ sourceType:"official", currency:"CNY", lastCheckedAt:"fixture" }] }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ sources:[{ sourceType:"official", basePrice:1, lastCheckedAt:"fixture" }] }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ realProviderEnabled:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ networkEnabled:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ payment:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ order:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ ticketing:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingPriceSourceNormalizer({ autoOpen:true }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingPriceSourceNormalizer({ realName:"张三", phone:"13800000000", email:"a@example.test", token:"abc", apiKey:"abc", secret:"abc", bookingUrl:"https://blocked.example", paymentUrl:"https://blocked.example", orderUrl:"https://blocked.example" }));
  assert.equal(/张三|13800000000|a@example\.test|https:\/\/blocked\.example/.test(serialized), false);
  assert.equal(/"(token|apiKey|secret)":"abc"/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_PRICE_SOURCE_NORMALIZER PASS");
}
main();
