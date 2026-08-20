"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalCommerceInputGuard.js",
  "apps/desktop/src/renderer/core/globalShoppingPriceFreshnessModel.js",
  "apps/desktop/src/renderer/core/globalCommerceProviderRoleRegistry.js",
  "apps/desktop/src/renderer/core/globalCommercePriceEvidence.js",
  "apps/desktop/src/renderer/core/globalCommerceStructuredOfferEvidence.js",
  "apps/desktop/src/renderer/core/globalCommercePriceEvidencePolicy.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, AbortController, setTimeout, clearTimeout, console });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window;
}
function json(value) { return JSON.parse(JSON.stringify(value)); }
function base(overrides) {
  return Object.assign({
    evidenceId:"evidence-1",
    provider:"fixture_provider",
    sourceClass:"MERCHANT_PUBLIC_SOURCE",
    evidenceType:"MERCHANT_PUBLIC_STRUCTURED_OFFER",
    productIdentity:{ gtin:"09506000134352" },
    productName:"Fixture Headphones",
    merchantIdentity:"Fixture Merchant",
    price:4599,
    currency:"CNY",
    observedAt:"2026-08-20T02:00:00.000Z",
    retrievedAt:"2026-08-20T02:00:00.000Z",
    providerUpdatedAt:null,
    sourceObservationDate:null,
    availability:"IN_STOCK",
    availabilityAuthority:false,
    purchaseAuthority:false,
    handoffUrl:"https://merchant-offer-fixture.invalid/products/fixture-headphones",
    handoffType:"OFFICIAL_MERCHANT_PRODUCT",
    comparisonEligible:false,
    priceConditions:[],
    priceConditionsVerified:false,
    sourcePolicy:{
      sourceId:"weishan_official_merchant_fixture",
      authority:"PUBLIC_MERCHANT_EVIDENCE",
      reviewState:"POC_FIXTURE_APPROVED",
      allowedUse:"DETERMINISTIC_VALIDATION_ONLY",
      cachingRequirement:"SOURCE_POLICY_REQUIRED_BEFORE_PRODUCTION",
      attributionRequired:true,
      displayAuthorization:"NOT_AUTHORIZED_FOR_PRODUCTION",
      allowedHandoffHosts:["merchant-offer-fixture.invalid"]
    },
    provenance:{
      sourceUrl:"https://merchant-offer-fixture.invalid/products/fixture-headphones",
      sourceRecordId:"sku-100",
      extractionMethod:"SOURCE_SPECIFIC_JSON_LD_PRODUCT_OFFER"
    }
  }, overrides || {});
}
function productHtml(productOverrides, offerOverrides) {
  const product = Object.assign({
    "@context":"https://schema.org",
    "@type":"Product",
    name:"Fixture Headphones",
    gtin:"09506000134352",
    sku:"sku-100",
    brand:{ "@type":"Brand", name:"Fixture Brand" },
    offers:Object.assign({
      "@type":"Offer",
      price:4599,
      priceCurrency:"CNY",
      availability:"https://schema.org/InStock",
      itemCondition:"https://schema.org/NewCondition",
      seller:{ "@type":"Organization", name:"Fixture Merchant" },
      url:"https://merchant-offer-fixture.invalid/products/fixture-headphones"
    }, offerOverrides || {})
  }, productOverrides || {});
  return "<!doctype html><html><head><script type=\"application/ld+json\">" + JSON.stringify(product) + "</script></head></html>";
}
function response(url, html, overrides) {
  return Object.assign({ ok:true, status:200, redirected:false, url:url, text:async function () { return html; } }, overrides || {});
}

async function main() {
  const window = load();
  const evidenceApi = window.WeishanGlobalCommercePriceEvidence;
  const structuredApi = window.WeishanGlobalCommerceStructuredOfferEvidence;
  const policyApi = window.WeishanGlobalCommercePriceEvidencePolicy;
  const roleApi = window.WeishanGlobalCommerceProviderRoleRegistry;

  const created = evidenceApi.createPriceEvidence(base());
  assert.equal(created.success, true);
  assert.equal(created.evidence.price, 4599);
  assert.equal(created.evidence.currency, "CNY");
  assert.equal(created.evidence.availability, "UNKNOWN");
  assert.equal(created.evidence.availabilityAuthority, false);
  assert.equal(created.evidence.purchaseAuthority, false);
  assert.equal(created.evidence.freshnessStatus, "UNKNOWN");
  assert.equal(created.evidence.providerUpdatedAt, null);
  assert.equal(created.evidence.sourceObservationDate, null);
  assert.equal(created.evidence.priceConditionStatus, "PRICE_CONDITIONS_UNKNOWN");
  assert.equal(created.evidence.comparisonEligible, false);
  assert.equal(created.evidence.authorizationScope, "NOT_AUTHORIZED_FOR_PRODUCTION");
  assert.equal(created.evidence.executionGate, "CLOSED");
  assert.equal(created.evidence.authorizesExecution, false);
  assert.equal(created.evidence.executed, false);
  assert.equal(created.evidence.productionTraffic, false);
  assert.equal(created.evidence.productionAffected, false);
  assert.equal(created.evidence.checkout, false);
  assert.equal(created.evidence.payment, false);
  assert.equal(created.evidence.order, false);
  assert.equal(Object.isFrozen(created), true);
  assert.equal(Object.isFrozen(created.evidence), true);
  assert.equal(Object.isFrozen(created.evidence.provenance), true);
  const originalPrice = created.evidence.price;
  try { created.evidence.price = 1; } catch (_) {}
  assert.equal(created.evidence.price, originalPrice);

  [NaN, Infinity].forEach(function (price) {
    assert.equal(evidenceApi.createPriceEvidence(base({ price:price })).error.code, "COMMERCE_INPUT_REJECTED");
  });
  [-1, null, "4599"].forEach(function (price) {
    assert.equal(evidenceApi.createPriceEvidence(base({ price:price })).error.code, "PRICE_INVALID");
  });
  ["", "CN", "CNY1", null].forEach(function (currency) {
    assert.equal(evidenceApi.createPriceEvidence(base({ currency:currency })).error.code, "CURRENCY_REQUIRED");
  });
  assert.equal(evidenceApi.createPriceEvidence(base({ productIdentity:{}, productName:"Title only" })).error.code, "PRODUCT_IDENTITY_REQUIRED");
  assert.equal(evidenceApi.createPriceEvidence(base({ handoffUrl:"http://merchant-offer-fixture.invalid/products/fixture-headphones" })).error.code, "HANDOFF_NOT_AUTHORIZED");
  assert.equal(evidenceApi.createPriceEvidence(base({ handoffUrl:"https://evil.invalid/products/fixture-headphones" })).error.code, "HANDOFF_NOT_AUTHORIZED");
  assert.equal(evidenceApi.createPriceEvidence(base({ providerUpdatedAt:"not-a-date" })).error.code, "TIMESTAMP_INVALID");
  assert.equal(evidenceApi.createPriceEvidence(base({ sourcePolicy:Object.assign({}, base().sourcePolicy, { displayAuthorization:"AUTHORIZED_FOR_COMPARISON" }), comparisonEligible:true })).evidence.comparisonEligible, false);

  const conditional = evidenceApi.createPriceEvidence(base({ priceConditions:["MEMBERSHIP", "APP_ONLY"] }));
  assert.equal(conditional.success, true);
  assert.equal(conditional.evidence.priceConditionStatus, "CONDITIONAL");
  assert.deepEqual(json(conditional.evidence.priceConditions), ["MEMBERSHIP", "APP_ONLY"]);
  assert.equal(evidenceApi.createPriceEvidence(base({ priceConditions:["MAGIC_DISCOUNT"] })).error.code, "PRICE_CONDITION_INVALID");
  const historical = evidenceApi.createPriceEvidence(base({ evidenceType:"PRICE_OBSERVATION_EVIDENCE", sourceObservationDate:"2025-01-01" }));
  assert.equal(historical.success, true);
  assert.equal(historical.evidence.freshnessStatus, "HISTORICAL_OBSERVATION");
  const providerTimestamp = evidenceApi.createPriceEvidence(base({ providerUpdatedAt:"2026-08-20T01:59:00.000Z", now:"2026-08-20T02:00:00.000Z" }));
  assert.equal(providerTimestamp.evidence.freshnessStatus, "FRESH");
  assert.equal(providerTimestamp.evidence.freshnessAgeSeconds, 60);
  assert.equal(providerTimestamp.evidence.provenance.retrievalTimeIsProviderFreshness, false);
  const stale = evidenceApi.createPriceEvidence(base({ providerUpdatedAt:"2026-08-19T00:00:00.000Z", now:"2026-08-20T02:00:00.000Z" }));
  assert.equal(stale.evidence.freshnessStatus, "STALE");
  const polluted = JSON.parse(JSON.stringify(base()));
  Object.defineProperty(polluted, "danger", { get:function () { throw new Error("must not execute"); } });
  assert.equal(evidenceApi.createPriceEvidence(polluted).error.code, "COMMERCE_INPUT_REJECTED");

  const built = structuredApi.buildSourceUrl("weishan_official_merchant_fixture", "/products/fixture-headphones");
  assert.equal(built.success, true);
  assert.equal(built.url, "https://merchant-offer-fixture.invalid/products/fixture-headphones");
  assert.equal(structuredApi.buildSourceUrl("unknown", "/products/item").error.code, "SOURCE_NOT_ALLOWLISTED");
  assert.equal(structuredApi.buildSourceUrl("weishan_official_merchant_fixture", "/admin").error.code, "SOURCE_PATH_NOT_ALLOWED");

  const parsed = structuredApi.parseStructuredOffer({
    sourceId:"weishan_official_merchant_fixture",
    sourceUrl:built.url,
    observedAt:"2026-08-20T02:00:00.000Z",
    html:productHtml()
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.evidence.evidenceType, "MERCHANT_PUBLIC_STRUCTURED_OFFER");
  assert.equal(parsed.evidence.productIdentity.gtin, "09506000134352");
  assert.equal(parsed.evidence.price, 4599);
  assert.equal(parsed.evidence.currency, "CNY");
  assert.equal(parsed.evidence.availability, "IN_STOCK");
  assert.equal(parsed.evidence.itemCondition, "NEWCONDITION");
  assert.equal(parsed.evidence.merchantIdentity, "Fixture Merchant");
  assert.equal(parsed.evidence.handoffUrl, built.url);
  assert.equal(parsed.evidence.comparisonEligible, false);
  assert.equal(parsed.evidence.purchaseAuthority, false);
  assert.equal(parsed.evidence.productionTraffic, false);
  assert.equal(parsed.evidence.sourcePolicy.networkEnabled, undefined);
  assert.equal(parsed.evidence.provenance.extractionMethod, "SOURCE_SPECIFIC_JSON_LD_PRODUCT_OFFER");

  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:"<html></html>" }).error.code, "JSON_LD_NOT_FOUND");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:"<script type=\"application/ld+json\">{bad}</script>" }).error.code, "MALFORMED_JSON_LD");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:productHtml({ gtin:undefined, sku:undefined }) }).error.code, "PRODUCT_IDENTITY_REQUIRED");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:productHtml({}, { price:"4599" }) }).error.code, "PRICE_INVALID");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:productHtml({}, { priceCurrency:null }) }).error.code, "CURRENCY_REQUIRED");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:productHtml({}, { url:"https://evil.invalid/product" }) }).error.code, "HANDOFF_NOT_AUTHORIZED");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:productHtml({ offers:[{ "@type":"Offer", price:1, priceCurrency:"CNY" }, { "@type":"Offer", price:2, priceCurrency:"CNY" }] }) }).error.code, "MULTIPLE_OFFERS_AMBIGUOUS");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:productHtml({ offers:{ "@type":"AggregateOffer", lowPrice:1, highPrice:2, priceCurrency:"CNY" } }) }).error.code, "AGGREGATE_OFFER_UNSUPPORTED");
  const twoProducts = "<script type=\"application/ld+json\">" + JSON.stringify([JSON.parse(productHtml().match(/<script[^>]*>(.*)<\/script>/)[1]), JSON.parse(productHtml({ sku:"sku-200" }).match(/<script[^>]*>(.*)<\/script>/)[1])]) + "</script>";
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:twoProducts }).error.code, "AMBIGUOUS_PRODUCT");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:productHtml({}, { availability:undefined }) }).evidence.availability, "UNKNOWN");
  assert.equal(structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00Z", html:productHtml() + "<script>window.executed=true</script>" }).success, true);
  assert.equal(window.executed, undefined);
  const structuredGetter = {};
  Object.defineProperty(structuredGetter, "sourceId", { get:function () { throw new Error("must not execute"); } });
  assert.equal(structuredApi.parseStructuredOffer(structuredGetter).error.code, "INPUT_REJECTED");

  let calls = 0;
  const fetched = await structuredApi.fetchStructuredOffer({
    sourceId:"weishan_official_merchant_fixture",
    productPath:"/products/fixture-headphones",
    observedAt:"2026-08-20T02:00:00.000Z",
    allowControlledFixtureTransport:true,
    transport:async function (url, options) {
      calls += 1;
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "manual");
      return response(url, productHtml());
    }
  });
  assert.equal(fetched.success, true);
  assert.equal(calls, 1);
  assert.equal(fetched.evidence.productionTraffic, false);
  assert.equal((await structuredApi.fetchStructuredOffer({ sourceId:"weishan_official_merchant_fixture", productPath:"/products/fixture-headphones" })).error.code, "CONTROLLED_TRANSPORT_REQUIRED");
  assert.equal((await structuredApi.fetchStructuredOffer({ sourceId:"unknown", productPath:"/products/x", allowControlledFixtureTransport:true, transport:async function () { calls += 1; } })).error.code, "SOURCE_NOT_ALLOWLISTED");
  assert.equal(calls, 1);
  assert.equal((await structuredApi.fetchStructuredOffer({ sourceId:"weishan_official_merchant_fixture", productPath:"/products/fixture-headphones", observedAt:"2026-08-20T02:00:00Z", allowControlledFixtureTransport:true, transport:async function (url) { return response("https://evil.invalid/x", productHtml(), { redirected:true }); } })).error.code, "REDIRECT_NOT_ALLOWED");
  assert.equal((await structuredApi.fetchStructuredOffer({ sourceId:"weishan_official_merchant_fixture", productPath:"/products/fixture-headphones", observedAt:"2026-08-20T02:00:00Z", allowControlledFixtureTransport:true, transport:async function () { throw new Error("private details"); } })).error.code, "NETWORK_ERROR");
  const oversized = "x".repeat(structuredApi.MAX_RESPONSE_BYTES + 1);
  assert.equal((await structuredApi.fetchStructuredOffer({ sourceId:"weishan_official_merchant_fixture", productPath:"/products/fixture-headphones", observedAt:"2026-08-20T02:00:00Z", allowControlledFixtureTransport:true, transport:async function (url) { return response(url, oversized); } })).error.code, "RESPONSE_TOO_LARGE");
  const networkFailure = await structuredApi.fetchStructuredOffer({ sourceId:"weishan_official_merchant_fixture", productPath:"/products/fixture-headphones", observedAt:"2026-08-20T02:00:00Z", allowControlledFixtureTransport:true, transport:async function () { throw new Error("secret-network-detail"); } });
  assert.equal(JSON.stringify(networkFailure).includes("secret-network-detail"), false);
  assert.equal(networkFailure.retryCount, 0);
  let timeoutCalls = 0;
  const timeout = await structuredApi.fetchStructuredOffer({
    sourceId:"weishan_official_merchant_fixture",
    productPath:"/products/fixture-headphones",
    observedAt:"2026-08-20T02:00:00Z",
    timeoutMs:100,
    allowControlledFixtureTransport:true,
    transport:function (url, options) {
      timeoutCalls += 1;
      return new Promise(function (resolve, reject) {
        options.signal.addEventListener("abort", function () { const error = new Error("aborted"); error.name = "AbortError"; reject(error); });
      });
    }
  });
  assert.equal(timeout.error.code, "TIMEOUT");
  assert.equal(timeoutCalls, 1);
  assert.equal(timeout.retryCount, 0);

  const evidenceA = created.evidence;
  const evidenceB = evidenceApi.createPriceEvidence(base({ evidenceId:"evidence-2", price:4999, evidenceType:"OFFICIAL_LIVE_API", providerUpdatedAt:"2026-08-20T01:59:00.000Z", now:"2026-08-20T02:00:00.000Z", sourcePolicy:Object.assign({}, base().sourcePolicy, { authority:"AUTHORITATIVE_PROVIDER" }) })).evidence;
  const conflict = policyApi.resolveEvidenceSet({ evidence:[evidenceA, evidenceB] });
  assert.equal(conflict.success, true);
  assert.equal(conflict.status, "PRICE_EVIDENCE_CONFLICT");
  assert.equal(conflict.evidence.length, 2);
  assert.equal(conflict.evidence[0].evidenceId, "evidence-2");
  assert.equal(conflict.preferredEvidenceId, null);
  assert.equal(conflict.recommendation, null);
  assert.equal(conflict.automaticWinner, false);
  assert.equal(conflict.executionGate, "CLOSED");
  const duplicate = policyApi.resolveEvidenceSet({ evidence:[evidenceA, evidenceA] });
  assert.equal(duplicate.status, "EVIDENCE_CONSISTENT");
  assert.equal(duplicate.evidence.length, 1);
  const crossCurrencyEvidence = evidenceApi.createPriceEvidence(base({ evidenceId:"evidence-usd", price:650, currency:"USD" })).evidence;
  const crossCurrency = policyApi.resolveEvidenceSet({ evidence:[evidenceA, crossCurrencyEvidence] });
  assert.equal(crossCurrency.status, "CURRENCY_NORMALIZATION_REQUIRED");
  assert.equal(crossCurrency.preferredEvidenceId, null);
  assert.equal(crossCurrency.automaticWinner, false);
  assert.equal(policyApi.resolveEvidenceSet({ evidence:[] }).status, "PRICE_UNVERIFIABLE");

  const layer1 = policyApi.routePriceEvidence({ layer1:{ status:"FREE_AUTHORIZED_AVAILABLE", evidence:evidenceB }, layer2:{ status:"VALID_EVIDENCE_AVAILABLE", evidence:evidenceA } });
  assert.equal(layer1.status, "LAYER_1_SELECTED");
  assert.equal(layer1.selectedLayer, "LAYER_1");
  assert.equal(layer1.WEISHAN_PAYS_PROVIDER, false);
  const layer2 = policyApi.routePriceEvidence({ layer1:{ status:"PAYMENT_REQUIRED" }, layer2:{ status:"VALID_EVIDENCE_AVAILABLE", evidence:evidenceA } });
  assert.equal(layer2.status, "LAYER_2_SELECTED");
  assert.equal(layer2.paidProviderDeferred, true);
  assert.equal(layer2.WEISHAN_PAYS_PROVIDER, false);
  const unavailable = policyApi.routePriceEvidence({ layer1:{ status:"PAYMENT_REQUIRED" }, layer2:{ status:"UNAVAILABLE" } });
  assert.equal(unavailable.status, "PRICE_UNVERIFIABLE");
  assert.equal(unavailable.paymentAttempted, false);
  assert.equal(unavailable.subscriptionAttempted, false);
  assert.equal(unavailable.billingOpened, false);
  assert.equal(unavailable.fallbackUsed, false);

  const candidateA = { candidateId:"a", userBenefitScore:80, price:10, currency:"USD", evidenceConfidence:"HIGH", productQualityScore:90, commissionRate:0 };
  const candidateB = { candidateId:"b", userBenefitScore:70, price:9, currency:"USD", evidenceConfidence:"HIGH", productQualityScore:90, commissionRate:100 };
  const rankingA = policyApi.neutralRecommendation({ candidates:[candidateA, candidateB], commercialMetadata:{ a:{ commission:0 }, b:{ commission:100 } } });
  const rankingB = policyApi.neutralRecommendation({ candidates:[Object.assign({}, candidateA, { commissionRate:100 }), Object.assign({}, candidateB, { commissionRate:0 })], commercialMetadata:{ a:{ commission:100 }, b:{ commission:0 } } });
  assert.deepEqual(json(rankingA.rankedCandidates), json(rankingB.rankedCandidates));
  assert.equal(rankingA.recommendationCandidateId, "a");
  assert.equal(rankingB.recommendationCandidateId, "a");
  assert.equal(rankingA.cheapestCandidateId, "b");
  assert.equal(rankingB.cheapestCandidateId, "b");
  assert.equal(rankingA.priceComparisonStatus, "COMPARABLE");
  assert.equal(rankingB.priceComparisonStatus, "COMPARABLE");
  assert.equal(rankingA.rankedCandidates[0].evidenceConfidence, rankingB.rankedCandidates[0].evidenceConfidence);
  assert.equal(rankingA.rankedCandidates[0].productQualityScore, rankingB.rankedCandidates[0].productQualityScore);
  assert.equal(rankingA.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);
  assert.equal(rankingA.commercialMetadataAcceptedForRanking, false);
  assert.equal(JSON.stringify(rankingA).includes("commissionRate"), false);
  assert.equal(JSON.stringify(rankingA).includes("commission\""), false);

  assert.equal(roleApi.getProvider("cheapshark").roles.includes("LIVE_COMPARISON_PROVIDER"), true);
  assert.equal(roleApi.getComparisonPolicy("cheapshark", "SAME_PROVIDER").allowed, true);
  assert.equal(roleApi.getProvider("daily_dose_tech").roles[0], "PROVIDER_SPECIFIC_COMMERCE_SOURCE");
  assert.equal(roleApi.getComparisonPolicy("daily_dose_tech", "SAME_PROVIDER").allowed, false);
  assert.equal(roleApi.getProvider("open_prices").roles[0], "PRICE_EVIDENCE_PROVIDER");
  assert.equal(roleApi.getComparisonPolicy("open_prices", "CROSS_PROVIDER").allowed, false);
  assert.equal(roleApi.getProvider("apple_search").crossProviderDisplayAuthorization, "UNRESOLVED");
  assert.equal(policyApi.PACKAGE.layers.LAYER_1, "CONTROLLED_AUTHORIZED_PROVIDER");
  assert.equal(policyApi.PACKAGE.layers.LAYER_2, "SOURCE_SPECIFIC_PUBLIC_PRICE_EVIDENCE");
  assert.equal(policyApi.PACKAGE.layers.LAYER_3, "FUTURE_COMMERCIAL_PROVIDER_DEFERRED");
  assert.equal(policyApi.PACKAGE.arbitraryUrlInput, false);
  assert.equal(policyApi.PACKAGE.automaticScraping, false);
  assert.equal(policyApi.PACKAGE.automaticPayment, false);
  assert.equal(policyApi.PACKAGE.productionTraffic, false);

  const deterministicA = structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00.000Z", html:productHtml() });
  const deterministicB = structuredApi.parseStructuredOffer({ sourceId:"weishan_official_merchant_fixture", sourceUrl:built.url, observedAt:"2026-08-20T02:00:00.000Z", html:productHtml() });
  assert.deepEqual(json(deterministicA), json(deterministicB));

  console.log("GLOBAL_COMMERCE_PRICE_EVIDENCE_FOUNDATION PASS");
}

main().catch(function (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
