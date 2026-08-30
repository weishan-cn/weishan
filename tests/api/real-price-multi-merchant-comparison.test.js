"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const window = {}; window.window = window;
vm.runInContext(fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/realPriceMultiMerchantComparison.js"), "utf8"), vm.createContext({ window, URL, Date, Object, Array, Set, Map }));
const api = window.WeishanRealPriceMultiMerchantComparison;
const at = "2026-08-30T06:00:00.000Z";
function offer(overrides){
  return Object.assign({
    canonicalProductIdentity:"apple|iphone 17|256gb|standard|new",
    merchantId:"merchant-a", platformName:"Merchant A", market:"NL", price:999, totalPrice:999, currency:"EUR",
    condition:"NEW", quantity:"1 item", targetUrl:"https://merchant-a.example/iphone-17-256",
    retrievedAt:at, availability:"IN_STOCK",
    truthEvidence:{ evidenceTruthClass:"REAL_PROVIDER_PRICE", displayAsLiveCurrentPrice:true, retrievedAt:at, currency:"EUR", productName:"iPhone 17 256GB", condition:"NEW", variant:"1 item", deepLink:"https://merchant-a.example/iphone-17-256" }
  }, overrides || {});
}

let result = api.compareOffers({ market:"NL", offers:[offer()] });
assert.equal(result.status, "INSUFFICIENT_OFFERS");
assert.equal(result.userFacingSummary, "仅找到 1 个已验证报价，暂不足以比较。");

result = api.compareOffers({ market:"NL", offers:[offer(), offer({ merchantId:"merchant-b", platformName:"Merchant B", price:950, totalPrice:950, targetUrl:"https://merchant-b.example/iphone-17-256" })] });
assert.equal(result.status, "READY");
assert.equal(result.comparableVerifiedOfferCountMax, 2);
assert.equal(result.lowerVerifiedOffer.merchantIdentity, "merchant b");
assert.equal(result.lowerVerifiedOfferLabel, "当前已验证报价中较低");
assert.equal(result.globalCheapestClaim, false);

assert.equal(api.compareOffers({ market:"NL", offers:[offer(), offer({ merchantId:"merchant-b", canonicalProductIdentity:"apple|iphone 17 pro|256gb|new", price:899, totalPrice:899, targetUrl:"https://merchant-b.example/iphone-17-pro-256" })] }).status, "INSUFFICIENT_OFFERS");
assert.equal(api.compareOffers({ market:"NL", offers:[offer(), offer({ merchantId:"merchant-b", condition:"REFURBISHED", price:700, totalPrice:700, targetUrl:"https://merchant-b.example/refurbished" })] }).status, "INSUFFICIENT_OFFERS");
assert.equal(api.compareOffers({ market:"NL", offers:[offer(), offer({ merchantId:"merchant-b", quantity:"2 pack", price:1200, totalPrice:1200, targetUrl:"https://merchant-b.example/two-pack" })] }).status, "INSUFFICIENT_OFFERS");
assert.equal(api.compareOffers({ market:"NL", offers:[offer(), offer({ merchantId:"merchant-b", market:"PL", price:900, totalPrice:900, currency:"PLN", targetUrl:"https://merchant-b.example/pl" })] }).status, "INSUFFICIENT_OFFERS");
assert.equal(api.compareOffers({ market:"NL", offers:[offer(), offer()] }).comparableVerifiedOfferCountMax, 1);
assert.equal(api.compareOffers({ market:"NL", offers:[] }).status, "NO_VERIFIED_OFFERS");

console.log("REAL_PRICE_MULTI_MERCHANT_COMPARISON PASS");
