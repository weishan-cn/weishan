"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const { createCAndCAsianMarketReadonlyService, createDutchshopperReadonlyService } = require(path.join(ROOT, "apps/desktop/src/main/netherlandsRetailReadonlyServices.js"));
function response(payload) {
  const bytes = Buffer.from(JSON.stringify(payload)); let delivered = false;
  return { ok:true, status:200, headers:{ get(name){ return String(name).toLowerCase() === "content-length" ? String(bytes.byteLength) : null; } }, body:{ getReader(){ return { read:async () => delivered ? { done:true } : (delivered = true, { done:false, value:bytes }), cancel:async () => { delivered = true; }, releaseLock(){} }; } } };
}
const ccProduct = { id:8969, name:"COCA COLA Original Taste 330ml", permalink:"https://ccasianmarket.nl/product/coca-cola-original-taste-330ml/", is_in_stock:true, prices:{ price:"149", currency_code:"EUR", currency_minor_unit:2 } };
const dutchSearch = { resources:{ results:{ products:[{ title:"Coca-Cola Original taste", url:"/products/coca-cola-original-taste-6?_pos=1" }] } } };
const dutchProduct = { id:9569522581803, title:"Coca-Cola Original taste", available:true, variants:[{ price:210, weight:330, available:true, barcode:"5000112658866" }] };
(async function(){
  const now = Date.now();
  const cc = createCAndCAsianMarketReadonlyService({ fetchImpl:async () => response([ccProduct]), now:() => now });
  const dutch = createDutchshopperReadonlyService({ fetchImpl:async (url) => response(url.includes("suggest.json") ? dutchSearch : dutchProduct), now:() => now });
  const ccResult = await cc.search({ query:"Coca-Cola Original Taste 330ml", requestId:"cc-live-shape", limit:3 });
  const dutchResult = await dutch.search({ query:"Coca-Cola Original Taste 330ml", requestId:"dutch-live-shape", limit:3 });
  assert.equal(ccResult.results[0].price, 1.49); assert.equal(dutchResult.results[0].price, 2.10);
  assert.equal(ccResult.results[0].canonicalProductIdentity, dutchResult.results[0].canonicalProductIdentity);
  assert.equal(ccResult.results[0].currency, "EUR"); assert.equal(dutchResult.results[0].currency, "EUR");
  assert.notEqual(ccResult.results[0].merchant, dutchResult.results[0].merchant);
  assert.equal(ccResult.requestCount, 1); assert.equal(dutchResult.requestCount, 2);
  const context = { console, URL, Date, window:{} }; context.globalThis = context; vm.createContext(context);
  ["readOnlyPriceTruthLayer.js", "netherlandsRetailReadonlyAdapter.js", "realPriceMultiMerchantComparison.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core", file), "utf8"), context));
  const evaluatedAt = new Date(now).toISOString();
  const ccNormalized = context.window.WeishanNetherlandsRetailReadonlyAdapter.normalizeResult(ccResult, { sourceId:"cc_asian_market_public_api", evaluatedAt });
  const dutchNormalized = context.window.WeishanNetherlandsRetailReadonlyAdapter.normalizeResult(dutchResult, { sourceId:"dutchshopper_public_api", evaluatedAt });
  const comparison = context.window.WeishanRealPriceMultiMerchantComparison.compareOffers({ market:"NL", offers:ccNormalized.candidates.concat(dutchNormalized.candidates) });
  assert.equal(comparison.status, "READY"); assert.equal(comparison.comparableVerifiedOfferCountMax, 2);
  assert.equal(comparison.lowerVerifiedOffer.offer.merchantName, "C&C Asian Market");
  assert.equal(comparison.lowerVerifiedOfferLabel, "当前已验证报价中较低");
  console.log("Netherlands second-source live-shape comparison: PASS");
})().catch((error) => { console.error(error); process.exitCode = 1; });
