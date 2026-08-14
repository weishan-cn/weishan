"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalCommerceProviderRoleRegistry.js",
  "apps/desktop/src/renderer/core/globalCommerceSameProductPriceComparison.js",
  "apps/desktop/src/renderer/core/globalCommerceDailyDoseAdapter.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({
    window,
    console,
    URL,
    AbortController,
    setTimeout,
    clearTimeout
  });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window;
}

function response(status, payload) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async function () {
      return typeof payload === "string" ? payload : JSON.stringify(payload);
    }
  };
}

const PRODUCT = {
  slug:"sony-wh-1000xm6",
  name:"Sony WH-1000XM6",
  brand:"Sony",
  category:"AUDIO",
  tagline:"The noise-cancelling benchmark, sharpened one more time.",
  price:{ amount:449, currency:"USD" },
  url:"https://dailydose.tech/p/sony-wh-1000xm6",
  retailers:[
    { name:"Best Buy", price:449, inStock:true, url:"https://www.bestbuy.com/site/sony-wh-1000xm6/6620467.p?ref=ddt" },
    { name:"B&H Photo", price:439, inStock:true, url:"https://www.bhphotovideo.com/c/product/1894980-REG/sony_wh1000xm6_b.html?ddt" },
    { name:"Amazon", price:449, inStock:true, url:"https://www.amazon.com/dp/B0F3PQHWTZ?tag=dailydosete0e-20" }
  ],
  priceHistory:[
    { price:479, recordedAt:"2026-01-15T00:00:00.000Z" },
    { price:449, recordedAt:"2026-04-10T00:00:00.000Z" }
  ]
};

const SEARCH = {
  products:[{
    slug:PRODUCT.slug,
    name:PRODUCT.name,
    brand:PRODUCT.brand,
    category:PRODUCT.category,
    price:PRODUCT.price,
    url:"https://dailydose.tech/p/sony-wh-1000xm6"
  }],
  pagination:{ nextCursor:null, hasMore:false }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixtureTransport(options) {
  const safe = options || {};
  const calls = [];
  const requestOptions = [];
  const fetchImpl = async function (url, init) {
    calls.push(url);
    requestOptions.push(init);
    const parsed = new URL(url);
    if (typeof safe.onRequest === "function") return safe.onRequest(url, init, calls.length);
    if (parsed.pathname === "/api/v1/products") return response(200, safe.search || SEARCH);
    if (parsed.pathname === "/api/v1/products/sony-wh-1000xm6") {
      return response(200, safe.detail || { product:PRODUCT });
    }
    return response(404, { error:"not found" });
  };
  return { fetchImpl, calls, requestOptions };
}

function runtime(fetchImpl) {
  return {
    allowControlledReadOnly:true,
    now:function () { return "2026-08-13T08:00:00.000Z"; },
    fetchImpl:fetchImpl,
    timeoutMs:1000
  };
}

async function main() {
  const window = load();
  const roleApi = window.WeishanGlobalCommerceProviderRoleRegistry;
  const comparisonApi = window.WeishanGlobalCommerceSameProductPriceComparison;
  const dailyDoseApi = window.WeishanGlobalCommerceDailyDoseAdapter;

  const provider = roleApi.getProvider("daily_dose_tech");
  assert.equal(provider.displayName, "Daily Dose Tech");
  assert.deepEqual(clone(provider.roles), ["PROVIDER_SPECIFIC_COMMERCE_SOURCE"]);
  assert.equal(provider.status, "CONTROLLED_READ_ONLY_PROVIDER_SPECIFIC");
  assert.equal(provider.sourceClassification, "PROVIDER_RETAILER_PRICE_OBSERVATION");
  assert.equal(provider.liveOffer, false);
  assert.equal(provider.sameProductMultiMerchantComparison, false);
  assert.equal(provider.sameProviderComparisonEligible, false);
  assert.equal(provider.crossProviderComparison, false);
  assert.equal(provider.crossProviderComparisonEligible, false);
  assert.equal(provider.crossProviderDisplayAuthorization, "PROVIDER_SPECIFIC_ONLY");
  assert.equal(provider.retailerDirectHandoffAuthorized, false);
  assert.equal(provider.currentPurchaseAuthority, false);
  assert.equal(provider.requiredCacheSeconds, 3600);
  assert.equal(provider.cacheConstraint, "MINIMUM_REUSE_BEFORE_REFRESH");
  assert.equal(provider.productionTraffic, false);
  assert.equal(roleApi.getComparisonPolicy("daily_dose_tech", "SAME_PROVIDER").allowed, false);
  assert.equal(roleApi.getComparisonPolicy("daily_dose_tech", "SAME_PROVIDER").reason, "LIVE_COMPARISON_ROLE_REQUIRED");
  assert.equal(roleApi.getComparisonPolicy("daily_dose_tech", "CROSS_PROVIDER").allowed, false);

  const searchTransport = fixtureTransport();
  const adapter = dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(searchTransport.fetchImpl) });
  const search = await adapter.searchProducts({ query:"sony", limit:5 });
  assert.equal(search.status, "READY");
  assert.equal(search.products.length, 1);
  assert.equal(search.products[0].provider, "daily_dose_tech");
  assert.equal(search.products[0].providerProductId, "sony-wh-1000xm6");
  assert.equal(search.products[0].canonicalProductIdentity, "daily_dose_tech:product:sony-wh-1000xm6");
  assert.equal(search.products[0].identityScope, "PROVIDER_SCOPED");
  assert.equal(search.products[0].providerReportedLowestPrice, 449);
  assert.equal(search.products[0].currency, "USD");
  assert.equal(search.products[0].priceStatus, "PROVIDER_REPORTED");
  assert.equal(search.products[0].sourceType, "PROVIDER_PRODUCT_PRICE_OBSERVATION");
  assert.equal(search.products[0].liveOffer, false);
  assert.equal(search.products[0].priceObservation, true);
  assert.equal(search.products[0].providerUpdatedAt, null);
  assert.equal(search.products[0].freshnessStatus, "UNKNOWN");
  assert.equal(search.products[0].freshnessPolicy, "PROVIDER_PRICE_TIMESTAMP_NOT_SUPPLIED");
  assert.equal(search.products[0].comparisonEligible, false);
  assert.equal(search.requiredCacheSeconds, 3600);
  assert.equal(search.providerReadOnlyRequestExecuted, true);
  assert.equal(search.productionTraffic, false);
  assert.equal(searchTransport.calls.length, 1);
  assert.equal(new URL(searchTransport.calls[0]).origin, "https://dailydose.tech");
  assert.equal(new URL(searchTransport.calls[0]).pathname, "/api/v1/products");
  assert.equal(new URL(searchTransport.calls[0]).searchParams.get("search"), "sony");
  assert.equal(new URL(searchTransport.calls[0]).searchParams.get("limit"), "5");
  assert.equal(searchTransport.requestOptions[0].method, "GET");
  assert.equal(searchTransport.requestOptions[0].headers.Accept, "application/json");
  assert.equal(searchTransport.requestOptions[0].headers["User-Agent"], "Weishan/4.2.8 (https://weishan.ai)");

  const offers = await adapter.getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(offers.status, "READY");
  assert.equal(offers.offers.length, 3);
  assert.deepEqual(clone(offers.offers.map(function (offer) { return offer.merchant; })), ["Best Buy", "B&H Photo", "Amazon"]);
  assert.deepEqual(clone(offers.offers.map(function (offer) { return offer.price; })), [449, 439, 449]);
  offers.offers.forEach(function (offer) {
    assert.equal(offer.provider, "daily_dose_tech");
    assert.equal(offer.providerRole, "PROVIDER_SPECIFIC_COMMERCE_SOURCE");
    assert.equal(offer.providerProductId, "sony-wh-1000xm6");
    assert.equal(offer.canonicalProductIdentity, "daily_dose_tech:product:sony-wh-1000xm6");
    assert.equal(offer.identityScope, "PROVIDER_SCOPED");
    assert.match(offer.offerId, /^daily_dose_tech:offer:sony-wh-1000xm6:[a-z0-9.-]+$/);
    assert.equal(offer.currency, "USD");
    assert.equal(offer.currencyNormalizationPerformed, false);
    assert.equal(offer.sourceType, "PROVIDER_RETAILER_PRICE_OBSERVATION");
    assert.equal(offer.liveOffer, false);
    assert.equal(offer.priceObservation, true);
    assert.equal(offer.comparisonEligible, false);
    assert.equal(offer.sameProviderComparisonEligible, false);
    assert.equal(offer.crossProviderComparisonEligible, false);
    assert.equal(offer.crossProviderDisplayAuthorization, "PROVIDER_SPECIFIC_ONLY");
    assert.equal(offer.observedAt, "2026-08-13T08:00:00.000Z");
    assert.equal(offer.providerUpdatedAt, null);
    assert.equal(offer.providerUpdateAgeSeconds, null);
    assert.equal(offer.freshnessStatus, "UNKNOWN");
    assert.equal(offer.freshnessPolicy, "PROVIDER_PRICE_TIMESTAMP_NOT_SUPPLIED");
    assert.equal(offer.availabilityStatus, "PROVIDER_REPORTED_IN_STOCK");
    assert.equal(offer.availabilityScope, "PROVIDER_REPORTED_RETAILER_FEED_NOT_STOCK_GUARANTEE");
    assert.equal(offer.handoffUrl, "https://dailydose.tech/p/sony-wh-1000xm6");
    assert.equal(offer.productUrl, offer.handoffUrl);
    assert.equal(offer.handoffUrl.includes("bestbuy"), false);
    assert.equal(offer.handoffUrl.includes("amazon"), false);
    assert.equal(offer.retailerUrlExposure, "HOST_ONLY_IN_PROVENANCE");
    assert.equal(offer.retailerDirectHandoffAuthorized, false);
    assert.equal(offer.handoffScope, "PROVIDER_PRODUCT_PAGE_ONLY");
    assert.equal(Object.prototype.hasOwnProperty.call(offer.provenance, "providerUpdatedAtField"), true);
    assert.equal(offer.provenance.providerUpdatedAtField, null);
    assert.equal(offer.provenance.observedAtSource, "WEISHAN_REQUEST_CLOCK");
  });
  assert.equal(offers.offers[0].provenance.providerReportedMerchantHost, "www.bestbuy.com");
  assert.equal(offers.offers[1].provenance.providerReportedMerchantHost, "www.bhphotovideo.com");
  assert.equal(offers.offers[2].provenance.providerReportedMerchantHost, "www.amazon.com");
  assert.equal(Object.isFrozen(offers), true);
  assert.equal(Object.isFrozen(offers.offers), true);
  assert.equal(Object.isFrozen(offers.offers[0]), true);
  assert.equal(Object.isFrozen(offers.offers[0].provenance), true);
  assert.equal(Object.isFrozen(offers.offers[0].limitations), true);

  const comparison = comparisonApi.compareSameProductOffers({ offers:offers.offers });
  assert.equal(comparison.status, "NOT_COMPARABLE");
  assert.equal(comparison.code, "INVALID_OFFER");
  assert.equal(comparison.rankedOffers.length, 0);
  assert.equal(comparison.recommendation, null);
  assert.equal(comparison.userDecisionRequired, true);
  assert.equal(comparison.executionGate, "CLOSED");
  assert.equal(/LOWEST|CHEAPEST|WINNER/.test(JSON.stringify(comparison)), false);

  const comparisonReadyOtherProvider = Object.assign({}, clone(offers.offers[0]), {
    provider:"cheapshark",
    providerRole:"LIVE_COMPARISON_PROVIDER",
    offerId:"cheapshark:offer:control",
    sourceType:"LIVE_PROVIDER_PRICE",
    liveOffer:true,
    comparisonEligible:true
  });
  const crossProviderComparison = comparisonApi.compareSameProductOffers({
    offers:[offers.offers[0], comparisonReadyOtherProvider]
  });
  assert.equal(crossProviderComparison.status, "NOT_COMPARABLE");
  assert.equal(crossProviderComparison.rankedOffers.length, 0);
  assert.equal(crossProviderComparison.recommendation, null);
  assert.equal(/LOWEST|CHEAPEST|WINNER/.test(JSON.stringify(crossProviderComparison)), false);

  const combinedTransport = fixtureTransport();
  const combined = await dailyDoseApi.createDailyDoseAdapter({
    runtime:runtime(combinedTransport.fetchImpl)
  }).searchAndNormalize({ query:"sony" });
  assert.equal(combined.status, "READY");
  assert.equal(combined.products.length, 1);
  assert.equal(combined.offers.length, 3);
  assert.equal(combined.comparison, null);
  assert.equal(combined.comparisonStatus, "NOT_AUTHORIZED");
  assert.equal(combinedTransport.calls.length, 2);

  const repeatedTransport = fixtureTransport();
  const repeated = await dailyDoseApi.createDailyDoseAdapter({
    runtime:runtime(repeatedTransport.fetchImpl)
  }).searchAndNormalize({ query:"sony" });
  assert.deepEqual(clone(combined), clone(repeated));

  const changedPriceTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, {
    retailers:[Object.assign({}, PRODUCT.retailers[0], { price:429 })]
  }) } });
  const changedPrice = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(changedPriceTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(changedPrice.status, "READY");
  assert.equal(changedPrice.offers[0].price, 429);
  assert.equal(changedPrice.offers[0].offerId, offers.offers[0].offerId);

  const badPriceTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, {
    retailers:[{ name:"Best Buy", price:"not-a-price", inStock:true, url:"https://www.bestbuy.com/site/example" }]
  }) } });
  const badPrice = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(badPriceTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(badPrice.status, "FAILED");
  assert.equal(badPrice.code, "NO_VALID_OFFERS");
  assert.equal(badPrice.offers.length, 0);
  assert.equal(badPrice.providerReadOnlyRequestExecuted, true);
  assert.equal(badPrice.fallbackUsed, false);

  const missingPriceTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, {
    retailers:[{ name:"Best Buy", inStock:true, url:"https://www.bestbuy.com/site/example" }]
  }) } });
  const missingPrice = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(missingPriceTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(missingPrice.status, "FAILED");
  assert.equal(missingPrice.code, "NO_VALID_OFFERS");
  assert.equal(missingPrice.offers.length, 0);
  assert.equal(missingPrice.fallbackUsed, false);

  const missingCurrencyTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, {
    price:{ amount:329 },
    retailers:[{ name:"Best Buy", price:329, inStock:true, url:"https://www.bestbuy.com/site/example" }]
  }) } });
  const missingCurrency = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(missingCurrencyTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(missingCurrency.code, "MALFORMED_RESPONSE");
  assert.equal(missingCurrency.offers.length, 0);
  assert.equal(missingCurrency.providerReadOnlyRequestExecuted, true);

  const mismatchedIdentityTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, { slug:"different-product" }) } });
  const mismatchedIdentity = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(mismatchedIdentityTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(mismatchedIdentity.code, "PRODUCT_IDENTITY_MISMATCH");
  assert.equal(mismatchedIdentity.offers.length, 0);

  const unsafeRetailerUrlTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, {
    retailers:[{ name:"Unsafe", price:1, inStock:true, url:"javascript:alert(1)" }]
  }) } });
  const unsafeRetailerUrl = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(unsafeRetailerUrlTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(unsafeRetailerUrl.code, "NO_VALID_OFFERS");
  assert.equal(unsafeRetailerUrl.offers.length, 0);

  const invalidHandoffTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, {
    url:"https://merchant.example/product/sony-wh-1000xm6"
  }) } });
  const invalidHandoff = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(invalidHandoffTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(invalidHandoff.code, "MALFORMED_RESPONSE");
  assert.equal(invalidHandoff.offers.length, 0);

  const numericStringTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, {
    retailers:[{ name:"Best Buy", price:"449", inStock:true, url:"https://www.bestbuy.com/site/example" }]
  }) } });
  const numericString = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(numericStringTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(numericString.code, "NO_VALID_OFFERS");
  assert.equal(numericString.offers.length, 0);

  for (const invalidNumeric of [NaN, Infinity, -Infinity, "NaN", "Infinity"]) {
    const invalidNumericTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, {
      retailers:[{ name:"Best Buy", price:invalidNumeric, inStock:true, url:"https://www.bestbuy.com/site/example" }]
    }) } });
    const invalidNumericResult = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(invalidNumericTransport.fetchImpl) })
      .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
    assert.equal(invalidNumericResult.code, "NO_VALID_OFFERS");
    assert.equal(invalidNumericResult.offers.length, 0);
  }

  const missingTitleTransport = fixtureTransport({ detail:{ product:Object.assign({}, PRODUCT, { name:"" }) } });
  const missingTitle = await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(missingTitleTransport.fetchImpl) })
    .getProductOffers({ providerProductId:"sony-wh-1000xm6" });
  assert.equal(missingTitle.code, "MALFORMED_RESPONSE");
  assert.equal(missingTitle.offers.length, 0);

  const arbitraryEndpointTransport = fixtureTransport();
  await dailyDoseApi.createDailyDoseAdapter({ runtime:runtime(arbitraryEndpointTransport.fetchImpl) })
    .searchProducts({ query:"sony", endpoint:"https://attacker.example/collect" });
  assert.equal(arbitraryEndpointTransport.calls.length, 1);
  assert.equal(new URL(arbitraryEndpointTransport.calls[0]).hostname, "dailydose.tech");
  assert.equal(arbitraryEndpointTransport.calls[0].includes("attacker.example"), false);

  const disabled = await dailyDoseApi.createDailyDoseAdapter({
    runtime:{ now:function () { return "2026-08-13T08:00:00.000Z"; }, fetchImpl:async function () { throw new Error("must not run"); } }
  }).searchProducts({ query:"sony" });
  assert.equal(disabled.code, "CONTROLLED_READ_ONLY_NOT_APPROVED");
  assert.equal(disabled.providerReadOnlyRequestExecuted, false);
  assert.equal(disabled.fallbackUsed, false);

  const missingObservedAtTransport = fixtureTransport();
  const missingObservedAt = await dailyDoseApi.createDailyDoseAdapter({
    runtime:{ allowControlledReadOnly:true, fetchImpl:missingObservedAtTransport.fetchImpl }
  }).searchProducts({ query:"sony" });
  assert.equal(missingObservedAt.code, "OBSERVED_AT_REQUIRED");
  assert.equal(missingObservedAt.providerReadOnlyRequestExecuted, false);
  assert.equal(missingObservedAtTransport.calls.length, 0);

  const timeoutResult = await dailyDoseApi.createDailyDoseAdapter({
    runtime:runtime(async function () { const error = new Error("aborted"); error.name = "AbortError"; throw error; })
  }).searchProducts({ query:"sony" });
  assert.equal(timeoutResult.code, "TIMEOUT");
  assert.equal(timeoutResult.products.length, 0);
  assert.equal(timeoutResult.providerReadOnlyRequestExecuted, true);
  assert.equal(timeoutResult.fallbackUsed, false);

  let rateLimitCalls = 0;
  const rateLimitResult = await dailyDoseApi.createDailyDoseAdapter({
    runtime:runtime(async function () { rateLimitCalls += 1; return response(429, { error:"rate limited" }); })
  }).searchProducts({ query:"sony" });
  assert.equal(rateLimitResult.code, "RATE_LIMITED");
  assert.equal(rateLimitCalls, 1);
  assert.equal(rateLimitResult.fallbackUsed, false);

  let unavailableCalls = 0;
  const unavailableResult = await dailyDoseApi.createDailyDoseAdapter({
    runtime:runtime(async function () { unavailableCalls += 1; return response(503, "upstream unavailable"); })
  }).searchProducts({ query:"sony" });
  assert.equal(unavailableResult.code, "PROVIDER_UNAVAILABLE");
  assert.equal(unavailableCalls, 1);
  assert.equal(unavailableResult.fallbackUsed, false);

  const malformed = await dailyDoseApi.createDailyDoseAdapter({
    runtime:runtime(async function () { return response(200, "not-json"); })
  }).searchProducts({ query:"sony" });
  assert.equal(malformed.code, "MALFORMED_RESPONSE");
  assert.equal(malformed.products.length, 0);

  const tooLarge = await dailyDoseApi.createDailyDoseAdapter({
    runtime:Object.assign(runtime(async function () { return response(200, "x".repeat(2048)); }), { maxResponseBytes:1024 })
  }).searchProducts({ query:"sony" });
  assert.equal(tooLarge.code, "RESPONSE_TOO_LARGE");
  assert.equal(tooLarge.products.length, 0);

  const missingQuery = await adapter.searchProducts({ query:"" });
  assert.equal(missingQuery.code, "QUERY_REQUIRED");
  assert.equal(missingQuery.providerReadOnlyRequestExecuted, false);
  const invalidProductId = await adapter.getProductOffers({ providerProductId:"../../secret" });
  assert.equal(invalidProductId.code, "PRODUCT_ID_REQUIRED");
  assert.equal(invalidProductId.providerReadOnlyRequestExecuted, false);

  assert.equal(dailyDoseApi.PACKAGE.mode, "CONTROLLED_READ_ONLY_PROVIDER_SPECIFIC");
  assert.equal(dailyDoseApi.PACKAGE.providerRole, "PROVIDER_SPECIFIC_COMMERCE_SOURCE");
  assert.equal(dailyDoseApi.PACKAGE.credentialsRequired, false);
  assert.equal(dailyDoseApi.PACKAGE.noRetry, true);
  assert.equal(dailyDoseApi.PACKAGE.requiredCacheSeconds, 3600);
  assert.equal(dailyDoseApi.PACKAGE.cacheConstraint, "MINIMUM_REUSE_BEFORE_REFRESH");
  assert.equal(dailyDoseApi.PACKAGE.sourceClassification, "PROVIDER_RETAILER_PRICE_OBSERVATION");
  assert.equal(dailyDoseApi.PACKAGE.sameProductMultiMerchantComparison, false);
  assert.equal(dailyDoseApi.PACKAGE.sameProviderComparisonEligible, false);
  assert.equal(dailyDoseApi.PACKAGE.crossProviderComparison, false);
  assert.equal(dailyDoseApi.PACKAGE.crossProviderComparisonEligible, false);
  assert.equal(dailyDoseApi.PACKAGE.liveOffer, false);
  assert.equal(dailyDoseApi.PACKAGE.retailerDirectHandoffAuthorized, false);
  assert.equal(dailyDoseApi.PACKAGE.executionGate, "CLOSED");
  assert.equal(dailyDoseApi.PACKAGE.authorizesExecution, false);
  assert.equal(dailyDoseApi.PACKAGE.executed, false);
  assert.equal(dailyDoseApi.PACKAGE.productionAffected, false);
  assert.equal(dailyDoseApi.PACKAGE.productionImported, false);
  assert.equal(dailyDoseApi.PACKAGE.productionTraffic, false);
  assert.equal(dailyDoseApi.PACKAGE.checkout, false);
  assert.equal(dailyDoseApi.PACKAGE.payment, false);
  assert.equal(dailyDoseApi.PACKAGE.order, false);
  assert.equal(Object.isFrozen(dailyDoseApi.PACKAGE), true);

  console.log("GLOBAL_COMMERCE_SECOND_REAL_PRICE_PROVIDER PASS 3 modules 30 scenarios 190+ assertions");
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
