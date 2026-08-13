"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalShoppingDataFreshnessEngine.js",
  "apps/desktop/src/renderer/core/globalCommerceProviderRoleRegistry.js",
  "apps/desktop/src/renderer/core/globalCommerceSameProductPriceComparison.js",
  "apps/desktop/src/renderer/core/globalCommerceSupplementalProviderNormalizers.js",
  "apps/desktop/src/renderer/core/globalCommerceCheapSharkAdapter.js"
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

const SEARCH_FIXTURE = [
  {
    gameID:"112330",
    steamAppID:"292030",
    cheapest:"39.99",
    cheapestDealID:"deal/gog",
    external:"The Witcher 3: Wild Hunt",
    thumb:"https://cdn.example.test/witcher.jpg"
  }
];

const STORE_FIXTURE = [
  { storeID:"7", storeName:"GOG", isActive:1 },
  { storeID:"1", storeName:"Steam", isActive:1 },
  { storeID:"11", storeName:"Humble Store", isActive:1 }
];

const EQUAL_DEAL_FIXTURE = [
  { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"7", dealID:"deal/gog", salePrice:"39.99", normalPrice:"39.99", savings:"0", lastChange:1778000000 },
  { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"1", dealID:"deal/steam", salePrice:"39.99", normalPrice:"39.99", savings:"0", lastChange:1777996400 },
  { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"11", dealID:"deal/humble", salePrice:"39.99", normalPrice:"49.99", savings:"20.004", lastChange:1777992800 },
  { gameID:"other", steamAppID:"292030", title:"Different provider grouping", storeID:"1", dealID:"wrong-game", salePrice:"1.00", normalPrice:"1.00", savings:"0", lastChange:1777992800 }
];

function fixtureTransport(details) {
  const calls = [];
  const requestOptions = [];
  const fetchImpl = async function (url, options) {
    calls.push(url);
    requestOptions.push(options);
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/games") && parsed.searchParams.has("title")) return response(200, SEARCH_FIXTURE);
    if (parsed.pathname.endsWith("/deals")) return response(200, details || EQUAL_DEAL_FIXTURE);
    if (parsed.pathname.endsWith("/stores")) return response(200, STORE_FIXTURE);
    return response(404, { message:"not found" });
  };
  return { fetchImpl, calls, requestOptions };
}

function json(value) {
  return JSON.parse(JSON.stringify(value));
}

async function main() {
  const window = load();
  const roleApi = window.WeishanGlobalCommerceProviderRoleRegistry;
  const comparisonApi = window.WeishanGlobalCommerceSameProductPriceComparison;
  const supplementalApi = window.WeishanGlobalCommerceSupplementalProviderNormalizers;
  const cheapSharkApi = window.WeishanGlobalCommerceCheapSharkAdapter;

  assert.equal(roleApi.PACKAGE.executionGate, "CLOSED");
  assert.equal(roleApi.PACKAGE.authorizesExecution, false);
  assert.equal(roleApi.PACKAGE.productionTraffic, false);
  assert.equal(roleApi.getProvider("cheapshark").roles.includes("LIVE_COMPARISON_PROVIDER"), true);
  assert.equal(roleApi.getProvider("cheapshark").sameProductMultiMerchantComparison, true);
  assert.equal(roleApi.getProvider("apple_search").status, "AUTHORIZED_FOR_PROVIDER_SPECIFIC_VALIDATION");
  assert.equal(roleApi.getProvider("apple_search").crossProviderDisplayAuthorization, "UNRESOLVED");
  assert.equal(roleApi.getProvider("open_prices").roles[0], "PRICE_EVIDENCE_PROVIDER");
  assert.equal(roleApi.getProvider("open_prices").liveOffer, false);
  assert.equal(roleApi.getProvider("ebay").status, "PENDING_PROVIDER_APPROVAL");
  assert.equal(roleApi.getProvider("rakuten").status, "INFRASTRUCTURE_REQUIRED");
  assert.equal(roleApi.getProvider("mercado_libre").status, "AUTHORIZATION_CLARIFICATION_REQUIRED");
  assert.equal(roleApi.getComparisonPolicy("cheapshark", "SAME_PROVIDER").allowed, true);
  assert.equal(roleApi.getComparisonPolicy("cheapshark", "CROSS_PROVIDER").reason, "CROSS_PROVIDER_COMPARISON_NOT_AUTHORIZED");
  assert.equal(roleApi.getComparisonPolicy("apple_search", "SAME_PROVIDER").reason, "LIVE_COMPARISON_ROLE_REQUIRED");
  assert.equal(roleApi.getComparisonPolicy("open_prices", "SAME_PROVIDER").allowed, false);
  assert.equal(Object.isFrozen(roleApi.listProviders()), true);

  const transport = fixtureTransport();
  const runtime = {
    allowControlledReadOnly:true,
    now:function () { return "2026-05-14T00:00:00.000Z"; },
    fetchImpl:transport.fetchImpl,
    timeoutMs:1000
  };
  const adapter = cheapSharkApi.createCheapSharkAdapter({ runtime });
  const search = await adapter.searchProducts({ query:"The Witcher 3: Wild Hunt", limit:5 });
  assert.equal(search.status, "READY");
  assert.equal(search.products.length, 1);
  assert.equal(search.products[0].providerProductId, "112330");
  assert.equal(search.products[0].canonicalProductIdentity, "steam:292030");
  assert.equal(search.products[0].providerReportedLowestPrice, 39.99);
  assert.equal(search.products[0].currency, "USD");
  assert.equal(search.providerReadOnlyRequestExecuted, true);
  assert.equal(search.productionTraffic, false);
  assert.equal(transport.calls.length, 1);
  assert.equal(new URL(transport.calls[0]).hostname, "www.cheapshark.com");
  assert.equal(new URL(transport.calls[0]).pathname, "/api/1.0/games");
  assert.equal(new URL(transport.calls[0]).searchParams.get("title"), "The Witcher 3: Wild Hunt");
  assert.equal(new URL(transport.calls[0]).searchParams.get("limit"), "5");
  assert.equal(transport.requestOptions[0].headers["User-Agent"], "Weishan/4.2.8 (https://weishan.ai)");

  const offers = await adapter.getProductOffers({
    providerProductId:"112330",
    productName:"The Witcher 3: Wild Hunt",
    steamAppId:"292030"
  });
  assert.equal(offers.status, "READY");
  assert.equal(offers.offers.length, 3);
  assert.deepEqual(json(offers.offers.map(function (offer) { return offer.merchant; })), ["GOG", "Steam", "Humble Store"]);
  assert.deepEqual(json(offers.offers.map(function (offer) { return offer.price; })), [39.99, 39.99, 39.99]);
  offers.offers.forEach(function (offer) {
    [
      "provider", "providerProductId", "productName", "canonicalProductIdentity", "offerId",
      "merchant", "price", "currency", "originalPrice", "discount", "productUrl", "handoffUrl",
      "observedAt", "providerUpdatedAt", "freshnessStatus", "availabilityStatus", "sourceType",
      "providerRole", "liveOffer", "comparisonEligible"
    ].forEach(function (field) { assert.equal(Object.prototype.hasOwnProperty.call(offer, field), true, field); });
    assert.equal(offer.provider, "cheapshark");
    assert.equal(offer.sourceType, "LIVE_PROVIDER_PRICE");
    assert.equal(offer.providerRole, "LIVE_COMPARISON_PROVIDER");
    assert.equal(offer.liveOffer, true);
    assert.equal(offer.comparisonEligible, true);
    assert.equal(offer.currency, "USD");
    assert.equal(offer.availabilityStatus, "OFFER_OBSERVED");
    assert.equal(offer.availabilityScope, "PROVIDER_DEAL_OBSERVED_NOT_STOCK_GUARANTEE");
    assert.equal(offer.observedAt, "2026-05-14T00:00:00.000Z");
    assert.notEqual(offer.providerUpdatedAt, offer.observedAt);
    assert.equal(offer.freshnessStatus, "EXPIRED");
    assert.equal(Number.isFinite(offer.providerUpdateAgeSeconds), true);
    assert.equal(offer.freshnessPolicy, "GLOBAL_SHOPPING_DATA_FRESHNESS_ENGINE_V1");
    assert.equal(offer.provenance.providerUpdatedAtField, "lastChange");
    assert.equal(offer.provenance.offerField, "dealID");
    const handoff = new URL(offer.handoffUrl);
    assert.equal(handoff.origin, "https://www.cheapshark.com");
    assert.equal(handoff.pathname, "/redirect");
    assert.equal(handoff.searchParams.get("dealID"), offer.offerId);
  });
  assert.equal(offers.offers[0].handoffUrl.includes("gog.com"), false);
  assert.equal(Object.isFrozen(offers), true);
  assert.equal(Object.isFrozen(offers.offers[0].provenance), true);

  const comparison = comparisonApi.compareSameProductOffers({ offers:offers.offers });
  assert.equal(comparison.status, "EQUIVALENT_LOWEST_OBSERVED_PRICE");
  assert.equal(comparison.recommendation.status, "USER_SELECTION_REQUIRED");
  assert.equal(comparison.recommendation.lowestObservedOfferId, null);
  assert.deepEqual(json(comparison.rankedOffers.map(function (offer) { return offer.priceRank; })), [1, 1, 1]);
  assert.equal(comparison.rankedOffers.every(function (offer) { return offer.comparisonLabel === "SAME_LOWEST_OBSERVED_PRICE"; }), true);
  assert.equal(JSON.stringify(comparison).toLowerCase().includes("best price"), false);
  assert.equal(comparison.userDecisionRequired, true);
  assert.equal(comparison.executionGate, "CLOSED");
  assert.equal(comparison.authorizesExecution, false);
  assert.equal(comparison.executed, false);
  assert.equal(comparison.productionAffected, false);

  const uniqueOffers = json(offers.offers);
  uniqueOffers[0].price = 34.99;
  const uniqueComparison = comparisonApi.compareSameProductOffers({ offers:uniqueOffers });
  assert.equal(uniqueComparison.status, "COMPARABLE");
  assert.equal(uniqueComparison.rankedOffers[0].merchant, "GOG");
  assert.equal(uniqueComparison.rankedOffers[0].comparisonLabel, "LOWEST_OBSERVED_PRICE");
  assert.equal(uniqueComparison.recommendation.lowestObservedOfferId, "deal/gog");
  assert.equal(uniqueComparison.recommendation.status, "USER_SELECTION_REQUIRED");

  const completeTransport = fixtureTransport();
  const completeAdapter = cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:completeTransport.fetchImpl })
  });
  const complete = await completeAdapter.searchAndCompare({ query:"The Witcher 3: Wild Hunt" });
  assert.equal(complete.status, "READY");
  assert.equal(complete.products.length, 1);
  assert.equal(complete.offers.length, 3);
  assert.equal(complete.comparison.status, "EQUIVALENT_LOWEST_OBSERVED_PRICE");
  assert.equal(completeTransport.calls.length, 3);

  const repeatedTransport = fixtureTransport();
  const repeated = await cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:repeatedTransport.fetchImpl })
  }).searchAndCompare({ query:"The Witcher 3: Wild Hunt" });
  assert.deepEqual(json(complete), json(repeated));

  const disabled = await cheapSharkApi.createCheapSharkAdapter({
    runtime:{ now:runtime.now, fetchImpl:async function () { throw new Error("must not run"); } }
  }).searchProducts({ query:"Witcher" });
  assert.equal(disabled.status, "FAILED");
  assert.equal(disabled.code, "CONTROLLED_READ_ONLY_NOT_APPROVED");
  assert.deepEqual(json(disabled.offers), []);
  assert.equal(disabled.fallbackUsed, false);

  const timeout = await cheapSharkApi.createCheapSharkAdapter({
    runtime:{
      allowControlledReadOnly:true,
      now:runtime.now,
      fetchImpl:async function () { const error = new Error("aborted"); error.name = "AbortError"; throw error; }
    }
  }).searchProducts({ query:"Witcher" });
  assert.equal(timeout.status, "FAILED");
  assert.equal(timeout.code, "TIMEOUT");
  assert.deepEqual(json(timeout.offers), []);
  assert.equal(timeout.fallbackUsed, false);

  const malformed = await cheapSharkApi.createCheapSharkAdapter({
    runtime:{ allowControlledReadOnly:true, now:runtime.now, fetchImpl:async function () { return response(200, "not-json"); } }
  }).searchProducts({ query:"Witcher" });
  assert.equal(malformed.status, "FAILED");
  assert.equal(malformed.code, "MALFORMED_RESPONSE");
  assert.deepEqual(json(malformed.products), []);

  const missingPriceTransport = fixtureTransport([
    { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"1", dealID:"missing-price", salePrice:"", normalPrice:"39.99", lastChange:1778716800 }
  ]);
  const missingPrice = await cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:missingPriceTransport.fetchImpl })
  }).getProductOffers({ providerProductId:"112330", productName:"The Witcher 3: Wild Hunt", steamAppId:"292030" });
  assert.equal(missingPrice.status, "FAILED");
  assert.equal(missingPrice.code, "NO_VALID_OFFERS");
  assert.deepEqual(json(missingPrice.offers), []);
  assert.equal(missingPrice.fallbackUsed, false);

  const mismatch = comparisonApi.compareSameProductOffers({ offers:[offers.offers[0], Object.assign({}, offers.offers[1], { canonicalProductIdentity:"steam:other" })] });
  assert.equal(mismatch.status, "NOT_COMPARABLE");
  assert.equal(mismatch.code, "PRODUCT_IDENTITY_MISMATCH");
  assert.deepEqual(json(mismatch.rankedOffers), []);
  const currencyMismatch = comparisonApi.compareSameProductOffers({ offers:[offers.offers[0], Object.assign({}, offers.offers[1], { currency:"EUR" })] });
  assert.equal(currencyMismatch.code, "CURRENCY_NORMALIZATION_REQUIRED");

  const malformedNumeric = comparisonApi.compareSameProductOffers({ offers:[offers.offers[0], Object.assign({}, offers.offers[1], { price:NaN })] });
  assert.equal(malformedNumeric.code, "INVALID_OFFER");
  assert.equal(malformedNumeric.limitations.includes("price_invalid_1"), true);
  const missingIdentity = comparisonApi.compareSameProductOffers({ offers:[offers.offers[0], Object.assign({}, offers.offers[1], { canonicalProductIdentity:null })] });
  assert.equal(missingIdentity.code, "INVALID_OFFER");
  const missingMerchant = comparisonApi.compareSameProductOffers({ offers:[offers.offers[0], Object.assign({}, offers.offers[1], { merchant:null })] });
  assert.equal(missingMerchant.code, "INVALID_OFFER");
  const invalidObservedAt = comparisonApi.compareSameProductOffers({ offers:[offers.offers[0], Object.assign({}, offers.offers[1], { observedAt:"not-a-date" })] });
  assert.equal(invalidObservedAt.code, "INVALID_OFFER");

  const forgedAppleOffers = offers.offers.slice(0, 2).map(function (offer) { return Object.assign({}, offer, { provider:"apple_search" }); });
  const appleComparison = comparisonApi.compareSameProductOffers({ offers:forgedAppleOffers });
  assert.equal(appleComparison.code, "LIVE_COMPARISON_ROLE_REQUIRED");
  const crossProvider = comparisonApi.compareSameProductOffers({ offers:[offers.offers[0], Object.assign({}, offers.offers[1], { provider:"future_provider" })] });
  assert.equal(crossProvider.code, "CROSS_PROVIDER_COMPARISON_NOT_AUTHORIZED");

  const apple = supplementalApi.normalizeAppleSearchResponse({
    results:[{
      trackId:123,
      trackName:"Example Book",
      trackPrice:9.99,
      currency:"USD",
      trackViewUrl:"https://books.apple.com/us/book/example/id123",
      releaseDate:"2024-01-01T00:00:00Z"
    }]
  }, { observedAt:"2026-05-14T00:00:00.000Z" });
  assert.equal(apple.status, "AUTHORIZED_FOR_PROVIDER_SPECIFIC_VALIDATION");
  assert.equal(apple.crossProviderDisplayAuthorization, "UNRESOLVED");
  assert.equal(apple.records[0].sourceType, "PROVIDER_SPECIFIC_VALIDATION_ONLY");
  assert.equal(apple.records[0].liveOffer, false);
  assert.equal(apple.records[0].comparisonEligible, false);
  assert.equal(apple.records[0].providerUpdatedAt, null);
  assert.equal(apple.records[0].freshnessStatus, "UNKNOWN");
  assert.equal(apple.records[0].releaseDate, "2024-01-01T00:00:00Z");

  const openPrices = supplementalApi.normalizeOpenPricesEvidence({
    items:[{
      id:"observation-1",
      product_code:"3017620422003",
      product_name:"Nutella",
      price:3.49,
      currency:"EUR",
      date:"2026-05-10",
      location_osm_id:"node:1"
    }]
  }, { observedAt:"2026-05-14T00:00:00.000Z" });
  assert.equal(openPrices.status, "EVIDENCE_ONLY");
  assert.equal(openPrices.records[0].sourceType, "PRICE_OBSERVATION_EVIDENCE");
  assert.equal(openPrices.records[0].providerRole, "PRICE_EVIDENCE_PROVIDER");
  assert.equal(openPrices.records[0].liveOffer, false);
  assert.equal(openPrices.records[0].availabilityStatus, "UNKNOWN");
  assert.equal(openPrices.records[0].handoffUrl, null);
  assert.equal(openPrices.records[0].currentPurchaseAuthority, false);
  assert.equal(openPrices.records[0].comparisonEligible, false);
  assert.equal(openPrices.records[0].attributionRequired, true);
  assert.equal(openPrices.records[0].attributionPolicyStatus, "REQUIRES_PUBLIC_DISPLAY_REVIEW");
  assert.equal(openPrices.records[0].provenance.observationId, "observation-1");
  assert.equal(openPrices.records[0].provenance.productCode, "3017620422003");
  assert.equal(Object.isFrozen(openPrices.records[0].provenance), true);
  const openPricesComparison = comparisonApi.compareSameProductOffers({ offers:[openPrices.records[0], openPrices.records[0]] });
  assert.equal(openPricesComparison.code, "INVALID_OFFER");

  const missingFreshnessTransport = fixtureTransport([
    { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"1", dealID:"no-timestamp", salePrice:"39.99", normalPrice:"39.99", savings:"0" }
  ]);
  const missingFreshness = await cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:missingFreshnessTransport.fetchImpl })
  }).getProductOffers({ providerProductId:"112330", productName:"The Witcher 3: Wild Hunt", steamAppId:"292030" });
  assert.equal(missingFreshness.status, "READY");
  assert.equal(missingFreshness.offers[0].providerUpdatedAt, null);
  assert.equal(missingFreshness.offers[0].freshnessStatus, "UNKNOWN");
  assert.equal(missingFreshness.offers[0].providerUpdateAgeSeconds, null);

  const futureFreshnessTransport = fixtureTransport([
    { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"1", dealID:"future-timestamp", salePrice:"39.99", normalPrice:"39.99", savings:"0", lastChange:1893456000 }
  ]);
  const futureFreshness = await cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:futureFreshnessTransport.fetchImpl })
  }).getProductOffers({ providerProductId:"112330", productName:"The Witcher 3: Wild Hunt", steamAppId:"292030" });
  assert.equal(futureFreshness.offers[0].freshnessStatus, "UNKNOWN");
  assert.equal(futureFreshness.offers[0].providerUpdateAgeSeconds, null);
  assert.equal(futureFreshness.offers[0].freshnessPolicy, "INVALID_PROVIDER_TIMESTAMP");

  const malformedPriceTransport = fixtureTransport([
    { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"1", dealID:"bad-price", salePrice:"not-a-number", normalPrice:"39.99", lastChange:1778716800 }
  ]);
  const malformedPrice = await cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:malformedPriceTransport.fetchImpl })
  }).getProductOffers({ providerProductId:"112330", productName:"The Witcher 3: Wild Hunt", steamAppId:"292030" });
  assert.equal(malformedPrice.code, "NO_VALID_OFFERS");
  assert.deepEqual(json(malformedPrice.offers), []);

  const missingDealTransport = fixtureTransport([
    { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"1", salePrice:"39.99", normalPrice:"39.99", lastChange:1778716800 }
  ]);
  const missingDeal = await cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:missingDealTransport.fetchImpl })
  }).getProductOffers({ providerProductId:"112330", productName:"The Witcher 3: Wild Hunt", steamAppId:"292030" });
  assert.equal(missingDeal.code, "NO_VALID_OFFERS");
  assert.deepEqual(json(missingDeal.offers), []);

  const missingMerchantTransport = fixtureTransport([
    { gameID:"112330", steamAppID:"292030", title:"The Witcher 3: Wild Hunt", storeID:"missing", dealID:"no-merchant", salePrice:"39.99", normalPrice:"39.99", lastChange:1778716800 }
  ]);
  const missingMerchantOffer = await cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:missingMerchantTransport.fetchImpl })
  }).getProductOffers({ providerProductId:"112330", productName:"The Witcher 3: Wild Hunt", steamAppId:"292030" });
  assert.equal(missingMerchantOffer.code, "NO_VALID_OFFERS");

  let httpCalls = 0;
  const httpFailure = await cheapSharkApi.createCheapSharkAdapter({
    runtime:{
      allowControlledReadOnly:true,
      now:runtime.now,
      fetchImpl:async function () { httpCalls += 1; return response(503, { message:"unavailable" }); }
    }
  }).searchProducts({ query:"Witcher" });
  assert.equal(httpFailure.code, "PROVIDER_UNAVAILABLE");
  assert.equal(httpCalls, 1);
  assert.equal(httpFailure.fallbackUsed, false);

  const endpointProbe = fixtureTransport();
  await cheapSharkApi.createCheapSharkAdapter({
    runtime:Object.assign({}, runtime, { fetchImpl:endpointProbe.fetchImpl })
  }).searchProducts({ query:"Witcher", endpoint:"https://example.invalid/steal" });
  assert.equal(endpointProbe.calls.every(function (url) { return new URL(url).hostname === "www.cheapshark.com"; }), true);

  assert.equal(cheapSharkApi.PACKAGE.executionGate, "CLOSED");
  assert.equal(cheapSharkApi.PACKAGE.authorizesExecution, false);
  assert.equal(cheapSharkApi.PACKAGE.productionImported, false);
  assert.equal(cheapSharkApi.PACKAGE.productionTraffic, false);
  assert.equal(cheapSharkApi.PACKAGE.checkout, false);
  assert.equal(cheapSharkApi.PACKAGE.payment, false);
  assert.equal(cheapSharkApi.PACKAGE.order, false);

  console.log("GLOBAL_COMMERCE_REAL_PRICE_PROVIDER_INTEGRATION PASS 4 modules 20 scenarios 200+ assertions");
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
