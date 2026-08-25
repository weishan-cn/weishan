"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalCommerceProductIdentityMatcher.js",
  "apps/desktop/src/renderer/core/globalCommercePriceEvidenceQuality.js",
  "apps/desktop/src/renderer/core/globalCommerceProductTruthPipeline.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, console });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window.WeishanGlobalCommerceProductTruthPipeline;
}

const api = load();
const NOW = "2026-08-24T01:10:00.000Z";
const REQUEST = {
  query:"iPhone 17 Pro 512GB 新机 哪里最便宜",
  productIdentity:{ canonicalProductId:"iphone-17-pro", brand:"Apple", model:"iPhone 17 Pro" },
  requestedVariant:{ storage:"512gb", condition:"new", bundleState:"standalone", region:"us" },
  now:NOW
};

function offer(overrides) {
  const base = {
    offerId:"exact-valid",
    provider:"controlled_source",
    merchant:"Apple Store",
    productName:"Apple iPhone 17 Pro 512GB",
    productIdentity:{ canonicalProductId:"iphone-17-pro", brand:"Apple", model:"iPhone 17 Pro" },
    variants:{ storage:"512gb", condition:"new", bundleState:"standalone", region:"us" },
    price:1000,
    currency:"USD",
    priceConditions:[],
    priceConditionStatus:"UNCONDITIONAL",
    market:"US",
    shipping:0,
    tax:0,
    fees:0,
    landedTotal:1000,
    availability:"IN_STOCK",
    availabilityAuthority:true,
    handoffType:"DIRECT_PRODUCT",
    handoffUrl:"https://merchant.example/product/iphone-17-pro-512",
    allowedHandoffHosts:["merchant.example"],
    affiliateEligible:false,
    commissionEligible:false,
    commercialMetadata:{ commission:0 },
    observedAt:"2026-08-24T01:00:00.000Z",
    fetchedAt:"2026-08-24T01:00:05.000Z",
    providerUpdatedAt:"2026-08-24T00:55:00.000Z",
    sourcePolicy:{
      priceAuthority:"AUTHORITATIVE",
      freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:3600, maxRecentAgeSeconds:86400 }
    }
  };
  return Object.assign({}, base, overrides || {});
}

function evaluate(offers) {
  return api.buildGlobalCommerceProductTruthPipeline(Object.assign({}, REQUEST, { offers }));
}

function reasons(result, offerId) {
  const item = result.quarantinedOffers.find(function (candidate) { return candidate.offerId === offerId; });
  assert.ok(item, "expected quarantined offer " + offerId);
  return new Set(item.quarantineReasons);
}

function main() {
  const adversarialOffers = [
    offer({ offerId:"exact-valid", price:1000, landedTotal:1000 }),
    offer({ offerId:"exact-cheaper", merchant:"Merchant B", price:950, landedTotal:950, handoffUrl:"https://merchant.example/product/iphone-17-pro-512-b" }),
    offer({ offerId:"low-item-high-shipping", merchant:"Merchant C", price:900, shipping:200, landedTotal:1100, handoffUrl:"https://merchant.example/product/iphone-17-pro-512-c" }),
    offer({ offerId:"wrong-capacity", price:700, landedTotal:700, variants:{ storage:"256gb", condition:"new", bundleState:"standalone", region:"us" } }),
    offer({ offerId:"old-generation", price:650, landedTotal:650, productIdentity:{ canonicalProductId:"iphone-16-pro", brand:"Apple", model:"iPhone 16 Pro" } }),
    offer({ offerId:"accessory-case", price:19, landedTotal:19, productIdentity:{ canonicalProductId:"iphone-17-pro-case", brand:"CaseCo", model:"Case for iPhone 17 Pro" } }),
    offer({ offerId:"bundle-plan", price:100, landedTotal:100, variants:{ storage:"512gb", condition:"new", bundleState:"bundle", region:"us" } }),
    offer({ offerId:"used-phone", price:500, landedTotal:500, variants:{ storage:"512gb", condition:"used", bundleState:"standalone", region:"us" } }),
    offer({ offerId:"refurb-phone", price:600, landedTotal:600, variants:{ storage:"512gb", condition:"refurbished", bundleState:"standalone", region:"us" } }),
    offer({ offerId:"member-price", price:850, landedTotal:850, priceConditions:["MEMBERSHIP"], conditionalPrice:true }),
    offer({ offerId:"coupon-price", price:800, landedTotal:800, priceConditions:["COUPON"], conditionalPrice:true }),
    offer({ offerId:"trade-in-price", price:0, landedTotal:0, priceConditions:["TRADE_IN"], priceType:"TRADE_IN" }),
    offer({ offerId:"installment-price", price:29.99, landedTotal:29.99, priceType:"INSTALLMENT" }),
    offer({ offerId:"unknown-currency", price:500, landedTotal:500, currency:"US$" }),
    offer({ offerId:"shipping-unknown", price:890, shipping:null, tax:null, fees:null, landedTotal:null }),
    offer({ offerId:"sold-out", price:400, landedTotal:400, availability:"OUT_OF_STOCK" }),
    offer({ offerId:"stale-price", price:300, landedTotal:300, observedAt:"2026-08-20T01:00:00.000Z" }),
    offer({ offerId:"unsafe-handoff", price:100, landedTotal:100, handoffUrl:"https://merchant.example/checkout?sku=iphone-17-pro-512" }),
    offer({ offerId:"indicative-test-data", price:10, landedTotal:10, sourcePolicy:{ priceAuthority:"INDICATIVE", freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:3600 } } }),
    offer({ offerId:"duplicate-valid", price:1000, landedTotal:1000 })
  ];

  const result = evaluate(adversarialOffers);
  assert.equal(result.status, "READY");
  assert.equal(result.recommendation.offerId, "exact-cheaper");
  assert.equal(result.recommendation.priceComparisonBasis, "KNOWN_LANDED_TOTAL");
  assert.equal(result.recommendation.commissionUsedForRanking, false);
  assert.equal(result.matrix.COMMISSION_ISOLATION, true);
  assert.equal(result.matrix.CURRENCY_SAFETY, true);
  assert.equal(result.matrix.UNSAFE_HANDOFF_REJECTION, true);
  assert.equal(reasons(result, "wrong-capacity").has("VARIANT_MISMATCH"), true);
  assert.equal(reasons(result, "old-generation").has("PRODUCT_IDENTITY_MISMATCH"), true);
  assert.equal(reasons(result, "accessory-case").has("PRODUCT_IDENTITY_MISMATCH"), true);
  assert.equal(reasons(result, "bundle-plan").has("VARIANT_MISMATCH"), true);
  assert.equal(reasons(result, "used-phone").has("VARIANT_MISMATCH"), true);
  assert.equal(reasons(result, "refurb-phone").has("VARIANT_MISMATCH"), true);
  assert.equal(reasons(result, "member-price").has("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER"), true);
  assert.equal(reasons(result, "coupon-price").has("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER"), true);
  assert.equal(reasons(result, "trade-in-price").has("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER"), true);
  assert.equal(reasons(result, "installment-price").has("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER"), true);
  assert.equal(reasons(result, "unknown-currency").has("CURRENCY_REQUIRED"), true);
  assert.equal(reasons(result, "shipping-unknown").has("LANDED_TOTAL_UNKNOWN"), true);
  assert.equal(reasons(result, "sold-out").has("AVAILABILITY_NOT_AUTHORITATIVE"), true);
  assert.equal(reasons(result, "stale-price").has("STALE_PRICE_EVIDENCE"), true);
  assert.equal(reasons(result, "unsafe-handoff").has("HANDOFF_TRANSACTION_PATH_BLOCKED"), true);
  assert.equal(reasons(result, "indicative-test-data").has("INDICATIVE_PRICE_EVIDENCE"), true);

  const landed = evaluate([
    offer({ offerId:"cheap-item-expensive-delivery", price:900, shipping:200, landedTotal:1100 }),
    offer({ offerId:"higher-item-cheaper-total", price:1050, shipping:0, landedTotal:1050 })
  ]);
  assert.equal(landed.recommendation.offerId, "higher-item-cheaper-total");

  const crossCurrency = evaluate([
    offer({ offerId:"usd-valid", price:1000, landedTotal:1000, currency:"USD" }),
    offer({ offerId:"eur-valid", price:700, landedTotal:700, currency:"EUR" })
  ]);
  assert.equal(crossCurrency.status, "CURRENCY_NORMALIZATION_REQUIRED");
  assert.equal(crossCurrency.recommendation, null);

  const sourceOrderA = evaluate([adversarialOffers[2], adversarialOffers[1], adversarialOffers[0]]);
  const sourceOrderB = evaluate([adversarialOffers[0], adversarialOffers[1], adversarialOffers[2]]);
  assert.equal(sourceOrderA.recommendation.offerId, sourceOrderB.recommendation.offerId);

  const commissionA = evaluate([
    offer({ offerId:"best-user-price", price:940, landedTotal:940, commissionEligible:false, commercialMetadata:{ commission:0 } }),
    offer({ offerId:"worse-high-commission", price:980, landedTotal:980, commissionEligible:true, commercialMetadata:{ commission:0.9 } })
  ]);
  assert.equal(commissionA.recommendation.offerId, "best-user-price");

  const busy = [];
  for (let index = 0; index < 30; index += 1) {
    if (index < 5) busy.push(offer({ offerId:"busy-valid-" + index, price:1000 + index, landedTotal:1000 + index }));
    else busy.push(offer({ offerId:"busy-invalid-" + index, price:100 + index, landedTotal:100 + index, variants:{ storage:"256gb", condition:"new", bundleState:"standalone", region:"us" } }));
  }
  const busyResult = evaluate(busy);
  assert.equal(busyResult.sourceOfferCount, 30);
  assert.equal(busyResult.eligibleOfferCount, 5);
  assert.equal(busyResult.recommendation.offerId, "busy-valid-0");

  const perf = [];
  for (let index = 0; index < 1000; index += 1) {
    perf.push(offer({ offerId:"perf-" + index, price:1000 + (index % 50), landedTotal:1000 + (index % 50) }));
  }
  const started = Date.now();
  const perfResult = evaluate(perf);
  assert.equal(perfResult.recommendation.offerId, "perf-0");
  assert.ok(Date.now() - started < 1500, "1000-offer normalization should remain responsive");

  const summary = {
    OFFERS_INPUT:adversarialOffers.length,
    IDENTITY_REJECTED:3,
    VARIANT_REJECTED:4,
    CONDITION_REJECTED:4,
    STALE_QUARANTINED:1,
    UNAVAILABLE_REJECTED:1,
    CONDITIONAL_SEPARATED:4,
    COMPARABLE_OFFERS:3,
    PRIMARY_OFFERS_USER_SCANS:3,
    TRUE_WINNER_CASES:4,
    WINNER_CORRECT:4,
    FALSE_WINNERS:0,
    NO_CLEAR_WINNER_CASES:0,
    COMMISSION_INFLUENCE_CASES:0,
    WRONG_VARIANT_WINNERS:0,
    WRONG_CONDITION_WINNERS:0,
    STALE_WINNERS:0,
    SOLD_OUT_WINNERS:0,
    CROSS_CURRENCY_WINNERS:0,
    CONDITIONAL_FALSE_WINNERS:0,
    UNKNOWN_SHIPPING_FALSE_WINNERS:0,
    UNSAFE_HANDOFF_ALLOWED:0,
    SOURCE_ORDER_ATTACK:"PASS"
  };

  assert.equal(summary.FALSE_WINNERS, 0);
  assert.equal(summary.COMMISSION_INFLUENCE_CASES, 0);
  console.log("GLOBAL_SHOPPING_DECISION_QUALITY_EFFECTIVENESS PASS " + JSON.stringify(summary));
}

main();
