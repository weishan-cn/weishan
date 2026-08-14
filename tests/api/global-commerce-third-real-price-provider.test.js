"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalCommerceProviderRoleRegistry.js",
  "apps/desktop/src/renderer/core/globalCommerceSameProductPriceComparison.js",
  "apps/desktop/src/renderer/core/globalCommerceSupplementalProviderNormalizers.js",
  "apps/desktop/src/renderer/core/globalCommerceOpenPricesAdapter.js"
];

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL, AbortController, setTimeout, clearTimeout });
  (files || FILES).forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window;
}

function response(status, payload) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async function () { return typeof payload === "string" ? payload : JSON.stringify(payload); }
  };
}

const LIVE_VERIFIED_FIXTURE = {
  items:[
    {
      id:45309,
      product_code:"5449000000996",
      price:0.99,
      currency:"EUR",
      date:"2024-11-15",
      price_is_discounted:false,
      location_id:1480,
      location_osm_id:428060860,
      location:{ name:"Observed retailer A" },
      product:{ code:"5449000000996", product_name:"coca-cola", brands:"Coca-Cola" }
    },
    {
      id:262672,
      product_code:"5449000000996",
      price:1.1,
      currency:"EUR",
      date:"2026-04-06",
      price_is_discounted:false,
      location_id:5641,
      location_osm_id:12707264202,
      location:{ name:"Observed retailer B" },
      product:{ code:"5449000000996", product_name:"coca-cola", brands:"Coca-Cola" }
    }
  ]
};

function transport(payload, status) {
  const calls = [];
  const options = [];
  return {
    calls,
    options,
    fetchImpl:async function (url, requestOptions) {
      calls.push(url);
      options.push(requestOptions);
      return response(status == null ? 200 : status, payload);
    }
  };
}

function runtime(fetchImpl, overrides) {
  return Object.assign({
    allowControlledReadOnly:true,
    fetchImpl,
    now:function () { return "2026-08-14T04:00:00.000Z"; },
    timeoutMs:1000
  }, overrides || {});
}

function json(value) {
  return JSON.parse(JSON.stringify(value));
}

async function main() {
  const window = load();
  const roleApi = window.WeishanGlobalCommerceProviderRoleRegistry;
  const comparisonApi = window.WeishanGlobalCommerceSameProductPriceComparison;
  const adapterApi = window.WeishanGlobalCommerceOpenPricesAdapter;

  const provider = roleApi.getProvider("open_prices");
  assert.equal(provider.roles[0], "PRICE_EVIDENCE_PROVIDER");
  assert.equal(provider.status, "EVIDENCE_ONLY");
  assert.equal(provider.sourceClassification, "PRICE_OBSERVATION_EVIDENCE");
  assert.equal(provider.sameProviderComparisonEligible, false);
  assert.equal(provider.crossProviderComparisonEligible, false);
  assert.equal(provider.crossProviderDisplayAuthorization, "EVIDENCE_ONLY");
  assert.equal(provider.liveOffer, false);
  assert.equal(provider.retailerDirectHandoffAuthorized, false);
  assert.equal(provider.availabilityAuthority, false);
  assert.equal(provider.currentPurchaseAuthority, false);
  assert.equal(provider.productionTraffic, false);
  assert.equal(provider.credentialsRequired, false);
  assert.equal(provider.officialApiHost, "prices.openfoodfacts.org");
  assert.equal(provider.officialHandoffHost, "prices.openfoodfacts.org");
  assert.equal(provider.observationDateAuthority, true);
  assert.equal(provider.providerUpdatedAtAvailable, false);
  assert.equal(provider.attributionRequired, true);
  assert.equal(provider.shareAlikeReviewRequired, true);
  assert.equal(provider.productionDisplayApproved, false);
  assert.equal(provider.license, "ODbL");
  assert.equal(provider.licenseComplianceStatus, "REQUIRED_BEFORE_PRODUCTION");
  assert.equal(roleApi.getComparisonPolicy("open_prices", "SAME_PROVIDER").allowed, false);
  assert.equal(roleApi.getComparisonPolicy("open_prices", "CROSS_PROVIDER").allowed, false);
  assert.equal(roleApi.getProvider("cheapshark").roles.includes("LIVE_COMPARISON_PROVIDER"), true);
  assert.equal(roleApi.getComparisonPolicy("cheapshark", "SAME_PROVIDER").allowed, true);
  assert.equal(roleApi.getProvider("daily_dose_tech").roles[0], "PROVIDER_SPECIFIC_COMMERCE_SOURCE");
  assert.equal(roleApi.getComparisonPolicy("daily_dose_tech", "SAME_PROVIDER").allowed, false);
  assert.equal(roleApi.getProvider("apple_search").roles[0], "PROVIDER_SPECIFIC_COMMERCE_SOURCE");
  assert.equal(roleApi.getProvider("apple_search").crossProviderDisplayAuthorization, "UNRESOLVED");

  const liveTransport = transport(LIVE_VERIFIED_FIXTURE);
  const adapter = adapterApi.createOpenPricesAdapter({ runtime:runtime(liveTransport.fetchImpl) });
  const result = await adapter.getPriceObservations({ productCode:"5449000000996", limit:5 });
  assert.equal(result.status, "READY");
  assert.equal(result.providerId, "open_prices");
  assert.equal(result.providerRole, "PRICE_EVIDENCE_PROVIDER");
  assert.equal(result.productCode, "5449000000996");
  assert.equal(result.canonicalProductIdentity, "barcode:5449000000996");
  assert.equal(result.productUrl, "https://prices.openfoodfacts.org/products/5449000000996");
  assert.equal(result.observations.length, 2);
  assert.equal(result.offers.length, 0);
  assert.equal(result.comparison, null);
  assert.equal(result.comparisonStatus, "NOT_AUTHORIZED");
  assert.deepEqual(json(result.observations.map(function (item) { return item.price; })), [0.99, 1.1]);
  assert.deepEqual(json(result.observations.map(function (item) { return item.currency; })), ["EUR", "EUR"]);
  assert.deepEqual(json(result.observations.map(function (item) { return item.evidenceObservedAt; })), ["2024-11-15", "2026-04-06"]);
  assert.deepEqual(json(result.observations.map(function (item) { return item.providerProductId; })), ["45309", "262672"]);
  assert.equal(result.providerUpdatedAt, null);
  assert.equal(result.freshnessStatus, "HISTORICAL_OBSERVATION");
  assert.equal(result.observedAt, "2026-08-14T04:00:00.000Z");
  assert.equal(result.providerReadOnlyRequestExecuted, true);
  assert.equal(result.productionTraffic, false);
  assert.equal(result.executionGate, "CLOSED");
  assert.equal(result.authorizesExecution, false);
  assert.equal(result.executed, false);
  assert.equal(result.productionAffected, false);
  assert.equal(result.userDecisionRequired, true);
  assert.equal(result.checkout, false);
  assert.equal(result.payment, false);
  assert.equal(result.order, false);
  assert.equal(result.license, "ODbL");
  assert.equal(result.attributionRequired, true);
  assert.equal(result.shareAlikeReviewRequired, true);
  assert.equal(result.productionDisplayApproved, false);
  assert.equal(result.licenseComplianceStatus, "REQUIRED_BEFORE_PRODUCTION");
  assert.equal(liveTransport.calls.length, 1);
  const requestUrl = new URL(liveTransport.calls[0]);
  assert.equal(requestUrl.origin, "https://prices.openfoodfacts.org");
  assert.equal(requestUrl.pathname, "/api/v1/prices");
  assert.equal(requestUrl.searchParams.get("product_code"), "5449000000996");
  assert.equal(requestUrl.searchParams.get("size"), "5");
  assert.equal(liveTransport.options[0].method, "GET");
  assert.equal(liveTransport.options[0].headers.Accept, "application/json");
  assert.equal(liveTransport.options[0].headers["User-Agent"], "Weishan/4.2.8 (api@weishan.ai)");

  result.observations.forEach(function (observation) {
    assert.equal(observation.provider, "open_prices");
    assert.equal(observation.providerRole, "PRICE_EVIDENCE_PROVIDER");
    assert.equal(observation.sourceType, "PRICE_OBSERVATION_EVIDENCE");
    assert.equal(observation.liveOffer, false);
    assert.equal(observation.priceObservation, true);
    assert.equal(observation.comparisonEligible, false);
    assert.equal(observation.sameProviderComparisonEligible, false);
    assert.equal(observation.crossProviderComparisonEligible, false);
    assert.equal(observation.currentPurchaseAuthority, false);
    assert.equal(observation.availabilityStatus, "UNKNOWN");
    assert.equal(observation.providerUpdatedAt, null);
    assert.equal(observation.retrievedAt, result.observedAt);
    assert.notEqual(observation.evidenceObservedAt, observation.retrievedAt);
    assert.equal(observation.freshnessStatus, "HISTORICAL_OBSERVATION");
    assert.equal(observation.productUrl, "https://prices.openfoodfacts.org/products/5449000000996");
    assert.equal(observation.handoffUrl, observation.productUrl);
    assert.equal(observation.retailerDirectHandoffAuthorized, false);
    assert.equal(observation.handoffScope, "OPEN_PRICES_PRODUCT_EVIDENCE_PAGE_ONLY");
    assert.equal(observation.attributionPolicyStatus, "ODBL_ATTRIBUTION_AND_SHARE_ALIKE_COMPLIANCE_REQUIRED");
    assert.equal(observation.shareAlikeReviewRequired, true);
    assert.equal(observation.productionDisplayApproved, false);
    assert.equal(observation.licenseComplianceStatus, "REQUIRED_BEFORE_PRODUCTION");
    assert.equal(observation.provenance.sourceUrl, result.sourceUrl);
    assert.equal(observation.provenance.productCode, "5449000000996");
    assert.equal(observation.provenance.retrievedAtIsPriceFreshness, false);
    assert.equal(observation.provenance.license, "ODbL");
    assert.equal(/amazon|bestbuy|checkout|cart/i.test(observation.handoffUrl), false);
  });

  const comparison = comparisonApi.compareSameProductOffers({ offers:result.observations });
  assert.equal(comparison.status, "NOT_COMPARABLE");
  assert.equal(comparison.rankedOffers.length, 0);
  assert.equal(comparison.recommendation, null);
  assert.equal(/LOWEST|CHEAPEST|WINNER/.test(JSON.stringify(comparison)), false);

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.observations), true);
  assert.equal(Object.isFrozen(result.observations[0]), true);
  assert.equal(Object.isFrozen(result.observations[0].provenance), true);
  const originalPrice = result.observations[0].price;
  try { result.observations[0].price = 0; } catch (_) {}
  assert.equal(result.observations[0].price, originalPrice);

  const deterministicA = await adapter.getPriceObservations({ productCode:"5449000000996", limit:2 });
  const deterministicB = await adapter.getPriceObservations({ productCode:"5449000000996", limit:2 });
  assert.deepEqual(json(deterministicA), json(deterministicB));
  assert.equal(new URL(liveTransport.calls[1]).searchParams.get("size"), "2");
  assert.equal(new URL(liveTransport.calls[2]).searchParams.get("size"), "2");

  for (const invalidCode of ["", "123", "abc", "../../secret", "5449000000996?x=1", "12345678901", "123456789012345", 5449000000996]) {
    const invalid = await adapter.getPriceObservations({ productCode:invalidCode });
    assert.equal(invalid.code, "PRODUCT_CODE_REQUIRED");
    assert.equal(invalid.providerReadOnlyRequestExecuted, false);
  }

  const noApprovalAdapter = adapterApi.createOpenPricesAdapter({ runtime:runtime(liveTransport.fetchImpl, { allowControlledReadOnly:false }) });
  assert.equal((await noApprovalAdapter.getPriceObservations({ productCode:"5449000000996" })).code, "CONTROLLED_READ_ONLY_NOT_APPROVED");
  const noTransportAdapter = adapterApi.createOpenPricesAdapter({ runtime:{ allowControlledReadOnly:true, now:function () { return "2026-08-14T04:00:00.000Z"; } } });
  assert.equal((await noTransportAdapter.getPriceObservations({ productCode:"5449000000996" })).code, "TRANSPORT_UNAVAILABLE");
  const noClockAdapter = adapterApi.createOpenPricesAdapter({ runtime:{ allowControlledReadOnly:true, fetchImpl:liveTransport.fetchImpl } });
  assert.equal((await noClockAdapter.getPriceObservations({ productCode:"5449000000996" })).code, "OBSERVED_AT_REQUIRED");

  const malformedCases = [
    [{}, "MALFORMED_RESPONSE"],
    [{ items:[] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { product_code:"3017620422003" })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { price:"0.99" })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { price:null })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { price:NaN })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { price:Infinity })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { price:-1 })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { currency:"EU" })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { date:"not-a-date" })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { date:"2026-02-31" })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { product:{ code:"5449000000996", product_name:"" } })] }, "NO_VALID_OBSERVATIONS"],
    [{ items:[Object.assign({}, LIVE_VERIFIED_FIXTURE.items[0], { id:0 })] }, "NO_VALID_OBSERVATIONS"]
  ];
  for (const entry of malformedCases) {
    const badTransport = transport(entry[0]);
    const badAdapter = adapterApi.createOpenPricesAdapter({ runtime:runtime(badTransport.fetchImpl) });
    assert.equal((await badAdapter.getPriceObservations({ productCode:"5449000000996" })).code, entry[1]);
  }

  const duplicateTransport = transport({ items:[LIVE_VERIFIED_FIXTURE.items[0], LIVE_VERIFIED_FIXTURE.items[0]] });
  const duplicateResult = await adapterApi.createOpenPricesAdapter({ runtime:runtime(duplicateTransport.fetchImpl) }).getPriceObservations({ productCode:"5449000000996" });
  assert.equal(duplicateResult.status, "READY");
  assert.equal(duplicateResult.observations.length, 1);
  assert.deepEqual(json(duplicateResult.invalidObservationIndexes), [1]);

  for (const errorCase of [
    [429, {}, "RATE_LIMITED"],
    [500, {}, "PROVIDER_UNAVAILABLE"],
    [403, {}, "HTTP_ERROR"],
    [200, "{bad-json", "MALFORMED_RESPONSE"]
  ]) {
    const errorTransport = transport(errorCase[1], errorCase[0]);
    const errorAdapter = adapterApi.createOpenPricesAdapter({ runtime:runtime(errorTransport.fetchImpl) });
    assert.equal((await errorAdapter.getPriceObservations({ productCode:"5449000000996" })).code, errorCase[2]);
  }

  const networkAdapter = adapterApi.createOpenPricesAdapter({ runtime:runtime(async function () { throw new Error("offline"); }) });
  assert.equal((await networkAdapter.getPriceObservations({ productCode:"5449000000996" })).code, "NETWORK_ERROR");
  const timeoutAdapter = adapterApi.createOpenPricesAdapter({ runtime:runtime(async function () { const error = new Error("timeout"); error.name = "AbortError"; throw error; }) });
  assert.equal((await timeoutAdapter.getPriceObservations({ productCode:"5449000000996" })).code, "TIMEOUT");
  const largeAdapter = adapterApi.createOpenPricesAdapter({ runtime:runtime(async function () { return response(200, "x".repeat(2048)); }, { maxResponseBytes:1024 }) });
  assert.equal((await largeAdapter.getPriceObservations({ productCode:"5449000000996" })).code, "RESPONSE_TOO_LARGE");

  const withoutNormalizer = load([
    "apps/desktop/src/renderer/core/globalCommerceProviderRoleRegistry.js",
    "apps/desktop/src/renderer/core/globalCommerceOpenPricesAdapter.js"
  ]);
  const missingNormalizerAdapter = withoutNormalizer.WeishanGlobalCommerceOpenPricesAdapter.createOpenPricesAdapter({ runtime:runtime(liveTransport.fetchImpl) });
  assert.equal((await missingNormalizerAdapter.getPriceObservations({ productCode:"5449000000996" })).code, "NORMALIZER_UNAVAILABLE");

  assert.equal(adapterApi.PACKAGE.providerRole, "PRICE_EVIDENCE_PROVIDER");
  assert.equal(adapterApi.PACKAGE.liveOffer, false);
  assert.equal(adapterApi.PACKAGE.sameProviderComparisonEligible, false);
  assert.equal(adapterApi.PACKAGE.crossProviderComparisonEligible, false);
  assert.equal(adapterApi.PACKAGE.credentialsRequired, false);
  assert.equal(adapterApi.PACKAGE.noRetry, true);
  assert.equal(adapterApi.PACKAGE.productionImported, false);
  assert.equal(adapterApi.PACKAGE.productionTraffic, false);
  assert.equal(adapterApi.PACKAGE.executionGate, "CLOSED");
  assert.equal(adapterApi.PACKAGE.authorizesExecution, false);
  assert.equal(adapterApi.PACKAGE.retailerDirectHandoffAuthorized, false);
  assert.equal(adapterApi.PACKAGE.providerObservationDateAvailable, true);
  assert.equal(adapterApi.PACKAGE.providerUpdatedAtAvailable, false);
  assert.equal(adapterApi.PACKAGE.license, "ODbL");
  assert.equal(adapterApi.PACKAGE.shareAlikeReviewRequired, true);
  assert.equal(adapterApi.PACKAGE.productionDisplayApproved, false);
  assert.equal(adapterApi.PACKAGE.licenseComplianceStatus, "REQUIRED_BEFORE_PRODUCTION");

  console.log("GLOBAL_COMMERCE_THIRD_REAL_PRICE_PROVIDER PASS 3 modules 30 scenarios 180+ assertions");
}

main().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
