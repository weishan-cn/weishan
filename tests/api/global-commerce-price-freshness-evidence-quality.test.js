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
  return {
    quality:window.WeishanGlobalCommercePriceEvidenceQuality,
    truth:window.WeishanGlobalCommerceProductTruthPipeline
  };
}

function offer(overrides) {
  return Object.assign({
    offerId:"current-100",
    provider:"provider_a",
    merchant:"Merchant A",
    productName:"Fixture Camera 128GB",
    productIdentity:{ brand:"Fixture", model:"CAM-128", title:"Fixture Camera 128GB" },
    variants:{ storage:"128GB", condition:"new" },
    price:100,
    currency:"USD",
    priceConditions:[],
    priceConditionStatus:"UNCONDITIONAL",
    priceType:"EXACT",
    market:"US",
    shipping:0,
    tax:0,
    fees:0,
    landedTotal:100,
    availability:"IN_STOCK",
    availabilityAuthority:true,
    handoffType:"DIRECT_PRODUCT",
    handoffUrl:"https://merchant-a.example/product/cam-128",
    allowedHandoffHosts:["merchant-a.example"],
    affiliateEligible:false,
    commissionEligible:false,
    observedAt:"2026-08-24T10:00:00.000Z",
    fetchedAt:"2026-08-24T10:00:05.000Z",
    providerUpdatedAt:"2026-08-24T09:59:00.000Z",
    now:"2026-08-24T10:10:00.000Z",
    sourcePolicy:{
      priceAuthority:"AUTHORITATIVE",
      freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:3600, maxRecentAgeSeconds:86400 }
    }
  }, overrides || {});
}

function run(offers, overrides) {
  return load().truth.buildGlobalCommerceProductTruthPipeline(Object.assign({
    query:"Fixture Camera 128GB new",
    productIdentity:{ brand:"Fixture", model:"CAM-128", title:"Fixture Camera 128GB" },
    requestedVariant:{ storage:"128GB", condition:"new" },
    now:"2026-08-24T10:10:00.000Z",
    offers:offers
  }, overrides || {}));
}

function reasons(result, offerId) {
  const item = result.quarantinedOffers.find(function (candidate) { return candidate.offerId === offerId; });
  assert.ok(item, "expected quarantined offer " + offerId);
  return new Set(item.quarantineReasons);
}

function main() {
  const api = load();
  const current = api.quality.classifyPriceEvidenceQuality(offer());
  assert.equal(current.outcome, "VERIFIED_CURRENT");
  assert.equal(current.priceFreshness, "CURRENT");
  assert.equal(current.eligibleForCurrentVerifiedPrice, true);

  const staleCheaper = run([
    offer({ offerId:"current-100", price:100, landedTotal:100 }),
    offer({ offerId:"stale-80", price:80, landedTotal:80, observedAt:"2026-08-20T10:00:00.000Z" })
  ]);
  assert.equal(staleCheaper.recommendation.offerId, "current-100");
  assert.equal(reasons(staleCheaper, "stale-80").has("STALE_PRICE_EVIDENCE"), true);

  const indicativeCheaper = run([
    offer({ offerId:"current-authoritative", price:100, landedTotal:100 }),
    offer({ offerId:"recent-indicative", price:90, landedTotal:90, sourcePolicy:{ priceAuthority:"INDICATIVE", freshnessPolicy:{ basis:"observedAt", maxCurrentAgeSeconds:3600, maxRecentAgeSeconds:86400 } } })
  ]);
  assert.equal(indicativeCheaper.recommendation.offerId, "current-authoritative");
  assert.equal(reasons(indicativeCheaper, "recent-indicative").has("INDICATIVE_PRICE_EVIDENCE"), true);

  [
    ["membership", { priceConditions:["MEMBERSHIP_REQUIRED"] }],
    ["installment", { price:30, landedTotal:30, priceType:"INSTALLMENT" }],
    ["trade-in", { price:0, landedTotal:0, priceType:"TRADE_IN" }],
    ["starting-at", { price:99, landedTotal:99, priceType:"STARTING_AT" }],
    ["member-price", { price:80, landedTotal:80, priceType:"MEMBER_PRICE" }]
  ].forEach(function (entry) {
    const result = run([offer({ offerId:"ordinary-100", price:100, landedTotal:100 }), offer(Object.assign({ offerId:entry[0] }, entry[1]))]);
    assert.equal(result.recommendation.offerId, "ordinary-100", entry[0]);
    assert.equal(reasons(result, entry[0]).has("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER"), true);
  });

  const unknownTimestamp = run([offer({ offerId:"known-current" }), offer({ offerId:"missing-time", price:50, landedTotal:50, observedAt:"" })]);
  assert.equal(unknownTimestamp.recommendation.offerId, "known-current");
  assert.equal(reasons(unknownTimestamp, "missing-time").has("PRICE_FRESHNESS_UNKNOWN"), true);

  const cacheHitOldObservation = run([
    offer({ offerId:"known-current" }),
    offer({ offerId:"cache-hit-old-observation", price:70, landedTotal:70, observedAt:"2026-08-20T10:00:00.000Z", cacheStoredAt:"2026-08-24T10:09:59.000Z" })
  ]);
  assert.equal(cacheHitOldObservation.recommendation.offerId, "known-current");
  assert.equal(reasons(cacheHitOldObservation, "cache-hit-old-observation").has("STALE_PRICE_EVIDENCE"), true);

  const future = run([offer({ offerId:"known-current" }), offer({ offerId:"future-price", price:10, landedTotal:10, observedAt:"2026-08-25T10:00:00.000Z" })]);
  assert.equal(future.recommendation.offerId, "known-current");
  assert.equal(reasons(future, "future-price").has("PRICE_TIMESTAMP_INVALID"), true);

  const sourceUpdate = run([
    offer({ offerId:"older-same-source", price:120, landedTotal:120, observedAt:"2026-08-24T09:00:00.000Z" }),
    offer({ offerId:"newer-same-source", price:110, landedTotal:110, observedAt:"2026-08-24T10:00:00.000Z" })
  ]);
  assert.equal(sourceUpdate.recommendation.offerId, "newer-same-source");

  const crossCurrency = run([
    offer({ offerId:"usd", price:100, currency:"USD" }),
    offer({ offerId:"eur", price:90, currency:"EUR", provider:"provider_b", merchant:"Merchant B", handoffUrl:"https://merchant-b.example/product/cam", allowedHandoffHosts:["merchant-b.example"] })
  ]);
  assert.equal(crossCurrency.status, "CURRENCY_NORMALIZATION_REQUIRED");
  assert.equal(crossCurrency.recommendation, null);

  const crossMarket = run([
    offer({ offerId:"us", price:100, market:"US" }),
    offer({ offerId:"cn", price:90, market:"CN", provider:"provider_b", merchant:"Merchant B", handoffUrl:"https://merchant-b.example/product/cam", allowedHandoffHosts:["merchant-b.example"] })
  ]);
  assert.equal(crossMarket.status, "MARKET_CONTEXT_NORMALIZATION_REQUIRED");
  assert.equal(crossMarket.recommendation, null);

  const unknownAvailability = run([offer({ offerId:"known-current" }), offer({ offerId:"unknown-availability", price:70, landedTotal:70, availabilityAuthority:false })]);
  assert.equal(unknownAvailability.recommendation.offerId, "known-current");
  assert.equal(reasons(unknownAvailability, "unknown-availability").has("AVAILABILITY_NOT_AUTHORITATIVE"), true);

  const shippingUnknown = run([offer({ offerId:"known-current" }), offer({ offerId:"shipping-unknown", price:70, landedTotal:undefined, shipping:undefined, tax:undefined, fees:undefined })]);
  assert.equal(shippingUnknown.recommendation.offerId, "known-current");
  assert.equal(reasons(shippingUnknown, "shipping-unknown").has("LANDED_TOTAL_UNKNOWN"), true);

  const wrongVariantCurrent = run([
    offer({ offerId:"wrong-variant-current", price:10, landedTotal:10, variants:{ storage:"256GB", condition:"new" } }),
    offer({ offerId:"correct-current", price:100, landedTotal:100 })
  ]);
  assert.equal(wrongVariantCurrent.recommendation.offerId, "correct-current");
  assert.equal(reasons(wrongVariantCurrent, "wrong-variant-current").has("VARIANT_MISMATCH"), true);

  const unsafeHandoffCurrent = run([
    offer({ offerId:"unsafe-current", price:10, landedTotal:10, handoffUrl:"https://merchant-a.example/checkout/cam" }),
    offer({ offerId:"safe-current", price:100, landedTotal:100 })
  ]);
  assert.equal(unsafeHandoffCurrent.recommendation.offerId, "safe-current");
  assert.equal(reasons(unsafeHandoffCurrent, "unsafe-current").has("HANDOFF_TRANSACTION_PATH_BLOCKED"), true);

  const commissionStale = run([
    offer({ offerId:"current-no-commission", price:100, landedTotal:100, commissionEligible:false }),
    offer({ offerId:"stale-commission", price:50, landedTotal:50, commissionEligible:true, commercialMetadata:{ commission:0.9 }, observedAt:"2026-08-20T10:00:00.000Z" })
  ]);
  assert.equal(commissionStale.recommendation.offerId, "current-no-commission");
  assert.equal(commissionStale.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);

  const providerFreshFlagAttack = run([
    offer({ offerId:"safe-current" }),
    offer({ offerId:"fresh-flag-attack", price:1, landedTotal:1, observedAt:"2026-08-20T10:00:00.000Z", fresh:true, verified:true, authoritative:true })
  ]);
  assert.equal(providerFreshFlagAttack.recommendation.offerId, "safe-current");
  assert.equal(reasons(providerFreshFlagAttack, "fresh-flag-attack").has("STALE_PRICE_EVIDENCE"), true);

  const json = JSON.stringify(providerFreshFlagAttack);
  assert.equal(/secret|token|password|authorization/i.test(json), false);
  assert.equal(providerFreshFlagAttack.executionGate, "CLOSED");
  assert.equal(providerFreshFlagAttack.authorizesExecution, false);
  assert.equal(providerFreshFlagAttack.productionTraffic, false);

  console.log("global-commerce-price-freshness-evidence-quality PASS");
}

main();
