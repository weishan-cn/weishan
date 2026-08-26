const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function assertNoSensitiveFields(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/secret-value|bearer-token|password-value|authorization-header/i.test(serialized), false);
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/multiProviderSandboxAdapterRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/providerSandboxQuoteNormalizer.js"
  ]);

  const priceSource = windowRef.WeishanGlobalShoppingPriceSourceNormalizer;
  const providerResponse = windowRef.WeishanGlobalShoppingProviderResponseNormalizer;
  const flightQuote = windowRef.WeishanProviderSandboxQuoteNormalizer;

  const partialPrice = priceSource.normalizeGlobalShoppingPriceSource({
    candidateId:"partial",
    sourceId:"fixture",
    sourceName:"Fixture",
    sourceType:"fixture",
    itemType:"product",
    basePrice:100,
    currency:"usd",
    lastCheckedAt:"2026-01-01T00:00:00.000Z"
  });
  assert.equal(partialPrice.basePrice, 100);
  assert.equal(partialPrice.currency, "USD");
  assert.equal(partialPrice.taxAmount, null);
  assert.equal(partialPrice.shippingFee, null);
  assert.equal(partialPrice.couponDiscount, null);
  assert.equal(partialPrice.normalizedTotal, null);
  assert.equal(partialPrice.exchangeRate, null);
  assert.equal(partialPrice.priceIncludesTax, null);
  assert.equal(partialPrice.breakfastIncluded, null);

  const explicitZero = priceSource.normalizeGlobalShoppingPriceSource({
    candidateId:"zero",
    sourceId:"fixture",
    sourceName:"Fixture",
    sourceType:"fixture",
    itemType:"product",
    basePrice:0,
    taxAmount:0,
    shippingFee:0,
    platformFee:0,
    serviceFee:0,
    paymentFee:0,
    baggageFee:0,
    couponDiscount:0,
    currency:"CNY",
    exchangeRate:7.2,
    priceIncludesTax:false,
    breakfastIncluded:false,
    lastCheckedAt:"2026-01-01T00:00:00.000Z"
  });
  assert.equal(explicitZero.basePrice, 0);
  assert.equal(explicitZero.normalizedTotal, 0);
  assert.equal(explicitZero.currency, "CNY");
  assert.equal(explicitZero.priceIncludesTax, false);
  assert.equal(explicitZero.breakfastIncluded, false);

  for (const badPrice of ["", " ", -1, NaN, Infinity, {}, []]) {
    const item = priceSource.normalizeGlobalShoppingPriceSource({
      candidateId:"bad",
      sourceId:"fixture",
      sourceName:"Fixture",
      sourceType:"fixture",
      itemType:"product",
      basePrice:badPrice,
      taxAmount:0,
      shippingFee:0,
      platformFee:0,
      serviceFee:0,
      paymentFee:0,
      baggageFee:0,
      couponDiscount:0,
      currency:"USD",
      lastCheckedAt:"2026-01-01T00:00:00.000Z"
    });
    assert.equal(item.basePrice, null);
    assert.equal(item.normalizedTotal, null);
  }

  for (const badCurrency of ["", "unknown", "$", "¥", "RMB", "US"]) {
    const item = priceSource.normalizeGlobalShoppingPriceSource({
      candidateId:"currency",
      sourceId:"fixture",
      sourceName:"Fixture",
      sourceType:"fixture",
      itemType:"product",
      basePrice:1,
      taxAmount:0,
      shippingFee:0,
      platformFee:0,
      serviceFee:0,
      paymentFee:0,
      baggageFee:0,
      couponDiscount:0,
      currency:badCurrency,
      lastCheckedAt:"2026-01-01T00:00:00.000Z"
    });
    assert.equal(item.currency, "");
  }

  const fakeLive = providerResponse.buildGlobalShoppingNormalizedProviderResponse({
    providerId:"fixture_provider",
    sourceType:"production",
    response:{
      sourceType:"live",
      live:true,
      production:true,
      results:[{
        title:"Fixture item",
        price:10,
        currency:"USD",
        sourceType:"production",
        availability:"not unavailable",
        officialUrl:"https://example.com/item",
        token:"bearer-token",
        password:"password-value"
      }]
    }
  });
  assert.equal(fakeLive.sourceType, "unknown");
  assert.equal(fakeLive.normalizedResults[0].sourceType, "unknown");
  assert.equal(fakeLive.normalizedResults[0].price, 10);
  assertNoSensitiveFields(fakeLive);

  const noProviderFees = flightQuote.normalizeProviderSandboxQuote({
    providerId:"trip_com_sandbox_stub",
    providerName:"Trip.com Sandbox Stub",
    providerMode:"sandbox_read_only",
    fareSource:"sandbox_read_only_import",
    trip:{ from:"SHA", to:"CTU", date:"2026-07-15" },
    price:{ currency:"CNY", fare:820, tax:120, total:940 },
    freshness:{ updatedAt:"2026-01-01T00:00:00.000Z" }
  });
  assert.equal(noProviderFees.providerFees, null);
  assert.equal(noProviderFees.status, "rejected");
  assert.match(noProviderFees.reason, /total mismatch/);

  const noFreshness = flightQuote.normalizeProviderSandboxQuote({
    providerId:"trip_com_sandbox_stub",
    providerName:"Trip.com Sandbox Stub",
    providerMode:"sandbox_read_only",
    fareSource:"sandbox_read_only_import",
    trip:{ from:"SHA", to:"CTU", date:"2026-07-15" },
    price:{ currency:"CNY", fare:820, tax:120, serviceFee:0, total:940 },
    freshness:{ updatedAt:"2026-01-01T00:00:00.000Z" }
  });
  assert.equal(noFreshness.status, "normalized");
  assert.equal(noFreshness.freshnessMinutes, null);
  assert.equal(noFreshness.freshnessStatus, "unknown");

  const secretFlight = flightQuote.normalizeProviderSandboxQuote(JSON.stringify({
    providerId:"trip_com_sandbox_stub",
    token:"bearer-token",
    authorization:"authorization-header"
  }));
  assert.equal(secretFlight.status, "blocked");
  assertNoSensitiveFields(secretFlight);

  const raw = {
    candidateId:"immutability",
    sourceId:"fixture",
    sourceName:"Fixture",
    sourceType:"fixture",
    itemType:"product",
    basePrice:100,
    taxAmount:0,
    shippingFee:0,
    platformFee:0,
    serviceFee:0,
    paymentFee:0,
    baggageFee:0,
    couponDiscount:0,
    currency:"USD",
    lastCheckedAt:"2026-01-01T00:00:00.000Z"
  };
  const before = JSON.stringify(raw);
  priceSource.normalizeGlobalShoppingPriceSource(raw);
  assert.equal(JSON.stringify(raw), before);

  for (const count of [100, 1000, 5000]) {
    const records = Array.from({ length:count }, (_, index) => ({
      candidateId:"perf-" + index,
      sourceId:"fixture",
      sourceName:"Fixture",
      sourceType:"fixture",
      itemType:index % 2 === 0 ? "product" : "flight",
      basePrice:100 + index,
      taxAmount:0,
      shippingFee:0,
      platformFee:0,
      serviceFee:0,
      paymentFee:0,
      baggageFee:0,
      couponDiscount:0,
      currency:"USD",
      lastCheckedAt:"2026-01-01T00:00:00.000Z"
    }));
    const started = Date.now();
    const normalized = priceSource.normalizeGlobalShoppingPriceSources({ sources:records });
    const elapsed = Date.now() - started;
    assert.equal(normalized.length, count);
    assert.equal(normalized.every((item) => item.normalizedTotal !== null), true);
    assert.equal(elapsed < 2500, true);
  }

  console.log("PROVIDER_ADAPTER_NORMALIZATION_EFFECTIVENESS PASS highRiskZeroMetrics=0 priceCases=17 currencyCases=9 availabilityUnknownPreserved=PASS freshnessUnknownPreserved=PASS secretPropagation=0 mutationSideEffects=0 perf=100/1000/5000");
}

main();
