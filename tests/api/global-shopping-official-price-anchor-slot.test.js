const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js", "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js"]);
  const api = windowRef.WeishanGlobalShoppingOfficialPriceAnchorSlot;
  assert.equal(api.GLOBAL_SHOPPING_OFFICIAL_PRICE_ANCHOR_SLOT_VERSION, "2.2.0");
  const normalizedCandidates = windowRef.WeishanGlobalShoppingPriceSourceNormalizer.normalizeGlobalShoppingPriceSources({ sources:[
    { candidateId:"official", sourceType:"official", sourceName:"Official", basePrice:100, taxAmount:10, shippingFee:0, platformFee:0, serviceFee:0, paymentFee:0, baggageFee:0, couponDiscount:0, currency:"CNY", lastCheckedAt:"fixture", confidence:"high" },
    { candidateId:"covered", sourceType:"aggregator", sourceName:"Covered", basePrice:90, taxAmount:5, shippingFee:0, platformFee:0, serviceFee:0, paymentFee:0, baggageFee:0, couponDiscount:0, currency:"CNY", lastCheckedAt:"fixture", confidence:"medium" }
  ]});
  const slot = api.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates });
  assert.equal(slot.appVersion, "2.2.0");
  assert.equal(slot.status, "anchored");
  assert.equal(slot.officialAnchor.hasOfficialPrice, true);
  assert.equal(slot.comparison.lowestCoveredCandidateId, "covered");
  assert.equal(slot.comparison.priceDelta, -15);
  assert.equal(slot.comparison.priceDeltaPercent, -13.64);
  assert.match(slot.comparison.comparisonCaveat, /已覆盖来源/);
  assert.equal(api.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates:[normalizedCandidates[1]] }).status, "missing_official");
  assert.equal(api.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates:[{ candidateId:"bad", sourceType:"official", normalizedTotal:null, currency:"", lastCheckedAt:"" }] }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates:[Object.assign({}, normalizedCandidates[1], { asOfficial:true })] }).status, "blocked");
  assert.equal(api.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates, claim:"全网最低" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates, claim:"locked price" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates, payment:true }).status, "blocked");
  const serialized = JSON.stringify(api.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates, realName:"张三", token:"abc", secret:"abc" }));
  assert.equal(/张三|"(token|secret)":"abc"/.test(serialized), false);
  console.log("GLOBAL_SHOPPING_OFFICIAL_PRICE_ANCHOR_SLOT PASS");
}
main();
