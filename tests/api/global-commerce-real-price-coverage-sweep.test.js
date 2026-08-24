"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalCommerceProductIdentityMatcher.js",
  "apps/desktop/src/renderer/core/globalCommercePriceEvidenceQuality.js",
  "apps/desktop/src/renderer/core/globalCommerceProductTruthPipeline.js",
  "apps/desktop/src/renderer/core/globalCommerceControlledSourceAdapterBridge.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, console });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window.WeishanGlobalCommerceControlledSourceAdapterBridge;
}

function googleBook(overrides) {
  return Object.assign({
    id:"google-volume-9780131103627",
    title:"The C Programming Language",
    publisher:"Prentice Hall",
    industryIdentifiers:[{ type:"ISBN_13", identifier:"9780131103627" }],
    saleInfo:{ country:"US", saleability:"FOR_SALE", retailPrice:{ amount:45, currencyCode:"USD" }, buyLink:"https://books.google.com/books?id=google-volume-9780131103627" },
    format:"paperback",
    priceConditions:[],
    observedAt:"2026-08-24T00:00:00.000Z",
    fetchedAt:"2026-08-24T00:01:00.000Z"
  }, overrides || {});
}

function ticketmasterEvent(overrides) {
  return Object.assign({
    id:"tm-event-1",
    name:"Example Arena Concert",
    priceRanges:[{ min:39, max:129, currency:"USD" }],
    url:"https://www.ticketmaster.com/example-arena-concert/event/tm-event-1",
    eventDate:"2026-09-30",
    venue:"Example Arena",
    market:"US",
    availability:"IN_STOCK",
    availabilityAuthority:true,
    observedAt:"2026-08-24T00:00:00.000Z",
    fetchedAt:"2026-08-24T00:01:00.000Z"
  }, overrides || {});
}

function ebaySandbox(overrides) {
  return Object.assign({
    itemId:"v1|sandbox-item|0",
    title:"Sandbox Drone",
    price:{ value:"19.99", currency:"USD" },
    itemWebUrl:"https://www.sandbox.ebay.com/itm/sandbox-item",
    buyingOptions:["FIXED_PRICE"],
    condition:"NEW",
    observedAt:"2026-08-24T00:00:00.000Z",
    fetchedAt:"2026-08-24T00:01:00.000Z"
  }, overrides || {});
}

function cheapGame(overrides) {
  return Object.assign({
    offerId:"cheapshark-current",
    merchant:"GOG",
    productName:"The Witcher 3: Wild Hunt",
    canonicalProductIdentity:"steam:292030",
    itemCondition:"NEW",
    edition:"standard",
    price:39.99,
    currency:"USD",
    priceConditions:[],
    availabilityStatus:"OFFER_OBSERVED",
    handoffUrl:"https://www.cheapshark.com/redirect?dealID=cheapshark-current",
    observedAt:"2026-08-24T00:00:00.000Z",
    providerUpdatedAt:"2026-08-23T00:00:00.000Z"
  }, overrides || {});
}

function reasons(result, offerId) {
  const match = result.productTruth.quarantinedOffers.find(function (offer) { return offer.offerId === offerId; });
  assert.ok(match, "expected quarantined offer " + offerId);
  return new Set(match.quarantineReasons);
}

function main() {
  const bridge = load();
  const inventory = bridge.buildSourceCapabilityInventory();
  assert.equal(inventory.sourceCount >= 7, true);
  assert.equal(inventory.credentialsIncluded, false);

  const google = inventory.sources.find(function (source) { return source.SOURCE_ID === "google_books"; });
  assert.equal(google.CURRENTLY_USABLE, true);
  assert.equal(google.PRICE, "PARTIAL");
  assert.equal(google.HANDOFF, "YES");

  const ticketmaster = inventory.sources.find(function (source) { return source.SOURCE_ID === "ticketmaster_discovery"; });
  assert.equal(ticketmaster.CURRENTLY_USABLE, true);
  assert.equal(ticketmaster.PRICE_AUTHORITY, "AUTHORITATIVE");

  const ebay = inventory.sources.find(function (source) { return source.SOURCE_ID === "ebay_sandbox"; });
  assert.equal(ebay.CURRENTLY_USABLE, true);
  assert.equal(ebay.PRICE_AUTHORITY, "INDICATIVE");

  const bookFlow = bridge.buildProductTruthFlow({
    sourceId:"google_books",
    query:"The C Programming Language paperback",
    productIdentity:{ canonicalProductId:"google-books:google-volume-9780131103627", isbn:"9780131103627" },
    requestedVariant:{ format:"paperback", condition:"new" },
    now:"2026-08-24T00:10:00.000Z",
    offers:[
      googleBook(),
      googleBook({ id:"wrong-isbn", industryIdentifiers:[{ type:"ISBN_13", identifier:"9780131101630" }], price:12, saleInfo:{ country:"US", saleability:"FOR_SALE", retailPrice:{ amount:12, currencyCode:"USD" }, buyLink:"https://books.google.com/books?id=wrong-isbn" } }),
      googleBook({ id:"stale-cheaper", price:20, observedAt:"2026-07-01T00:00:00.000Z", fetchedAt:"2026-07-01T00:00:00.000Z", saleInfo:{ country:"US", saleability:"FOR_SALE", retailPrice:{ amount:20, currencyCode:"USD" }, buyLink:"https://books.google.com/books?id=stale-cheaper" } }),
      googleBook({ id:"unsafe-book-link", price:1, saleInfo:{ country:"US", saleability:"FOR_SALE", retailPrice:{ amount:1, currencyCode:"USD" }, buyLink:"https://books.google.com/checkout?id=unsafe" } })
    ]
  });
  assert.equal(bookFlow.status, "PRODUCT_TRUTH_READY");
  assert.equal(bookFlow.productTruth.recommendation.offerId, "google-volume-9780131103627");
  assert.equal(bookFlow.productTruth.recommendation.priceQualityOutcome, "VERIFIED_CURRENT");
  assert.equal(reasons(bookFlow, "wrong-isbn").has("PRODUCT_IDENTITY_MISMATCH"), true);
  assert.equal(reasons(bookFlow, "stale-cheaper").has("STALE_PRICE_EVIDENCE"), true);
  assert.equal(reasons(bookFlow, "unsafe-book-link").has("HANDOFF_TRANSACTION_PATH_BLOCKED"), true);

  const eventFlow = bridge.buildProductTruthFlow({
    sourceId:"ticketmaster_discovery",
    query:"Example Arena Concert",
    productIdentity:{ canonicalProductId:"ticketmaster-event:tm-event-1" },
    requestedVariant:{ eventDate:"2026-09-30", venue:"example arena", condition:"event_ticket" },
    now:"2026-08-24T00:10:00.000Z",
    offers:[ticketmasterEvent()]
  });
  assert.equal(eventFlow.status, "NO_RECOMMENDABLE_OFFER");
  assert.equal(eventFlow.productTruth.eligibleOfferCount, 0);
  assert.equal(reasons(eventFlow, "tm-event-1").has("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER"), true);

  const sandboxFlow = bridge.buildProductTruthFlow({
    sourceId:"ebay_sandbox",
    query:"Sandbox Drone",
    productIdentity:{ canonicalProductId:"ebay-sandbox:v1|sandbox-item|0" },
    requestedVariant:{ condition:"new" },
    now:"2026-08-24T00:10:00.000Z",
    offers:[ebaySandbox({ verified:true, authoritative:true })]
  });
  assert.equal(sandboxFlow.status, "NO_RECOMMENDABLE_OFFER");
  assert.equal(sandboxFlow.productTruth.quarantinedOffers[0].priceAuthority, "INDICATIVE");
  assert.equal(sandboxFlow.productTruth.quarantinedOffers[0].provenance, undefined);
  assert.equal(reasons(sandboxFlow, "v1|sandbox-item|0").has("INDICATIVE_PRICE_EVIDENCE"), true);

  const multi = bridge.buildMultiSourceProductTruthFlow({
    query:"The Witcher 3: Wild Hunt standard new",
    productIdentity:{ canonicalProductId:"steam:292030" },
    requestedVariant:{ platform:"steam", edition:"standard", condition:"new" },
    now:"2026-08-24T00:10:00.000Z",
    sources:[
      { sourceId:"cheapshark", offers:[cheapGame({ offerId:"verified-current", price:40 })] },
      { sourceId:"cheapshark", offers:[cheapGame({ offerId:"stale-cheaper", price:5, observedAt:"2026-07-01T00:00:00.000Z" })] },
      { sourceId:"cheapshark", offers:[cheapGame({ offerId:"conditional-cheaper", price:6, priceConditions:["MEMBERSHIP"] })] },
      { sourceId:"cheapshark", offers:[cheapGame({ offerId:"wrong-variant-cheaper", price:7, edition:"complete" })] },
      { sourceId:"cheapshark", offers:[cheapGame({ offerId:"different-currency", price:8, currency:"EUR", canonicalProductIdentity:"steam:999999" })] },
      { sourceId:"cheapshark", offers:[cheapGame({ offerId:"unsafe-handoff", price:1, handoffUrl:"https://www.cheapshark.com/payment?dealID=bad" })] },
      { sourceId:"not_registered", offers:[cheapGame({ offerId:"source-outage" })] }
    ]
  });
  assert.equal(multi.status, "PRODUCT_TRUTH_READY");
  assert.equal(multi.productTruth.recommendation.offerId, "verified-current");
  assert.equal(multi.sourceFailureCount, 1);
  assert.equal(reasons(multi, "stale-cheaper").has("STALE_PRICE_EVIDENCE"), true);
  assert.equal(reasons(multi, "conditional-cheaper").has("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER"), true);
  assert.equal(reasons(multi, "wrong-variant-cheaper").has("VARIANT_MISMATCH"), true);
  assert.equal(reasons(multi, "different-currency").has("PRODUCT_IDENTITY_MISMATCH"), true);
  assert.equal(reasons(multi, "unsafe-handoff").has("HANDOFF_TRANSACTION_PATH_BLOCKED"), true);
  assert.equal(multi.productTruth.recommendation.commissionUsedForRanking, false);

  const crossCurrency = bridge.buildMultiSourceProductTruthFlow({
    query:"The Witcher 3: Wild Hunt standard new",
    productIdentity:{ canonicalProductId:"steam:292030" },
    requestedVariant:{ platform:"steam", edition:"standard", condition:"new" },
    now:"2026-08-24T00:10:00.000Z",
    sources:[
      { sourceId:"cheapshark", offers:[cheapGame({ offerId:"usd", price:40, currency:"USD" })] },
      { sourceId:"cheapshark", offers:[cheapGame({ offerId:"eur", price:35, currency:"EUR" })] }
    ]
  });
  assert.equal(crossCurrency.status, "CURRENCY_NORMALIZATION_REQUIRED");
  assert.equal(crossCurrency.productTruth.recommendation, null);

  const orderA = bridge.buildMultiSourceProductTruthFlow({
    query:"The Witcher 3: Wild Hunt standard new",
    productIdentity:{ canonicalProductId:"steam:292030" },
    requestedVariant:{ platform:"steam", edition:"standard", condition:"new" },
    now:"2026-08-24T00:10:00.000Z",
    sources:[{ sourceId:"cheapshark", offers:[cheapGame({ offerId:"b", price:40 })] }, { sourceId:"cheapshark", offers:[cheapGame({ offerId:"a", price:40 })] }]
  });
  const orderB = bridge.buildMultiSourceProductTruthFlow({
    query:"The Witcher 3: Wild Hunt standard new",
    productIdentity:{ canonicalProductId:"steam:292030" },
    requestedVariant:{ platform:"steam", edition:"standard", condition:"new" },
    now:"2026-08-24T00:10:00.000Z",
    sources:[{ sourceId:"cheapshark", offers:[cheapGame({ offerId:"a", price:40 })] }, { sourceId:"cheapshark", offers:[cheapGame({ offerId:"b", price:40 })] }]
  });
  assert.equal(orderA.productTruth.recommendation.offerId, orderB.productTruth.recommendation.offerId);

  const serialized = JSON.stringify({ inventory, bookFlow, eventFlow, sandboxFlow, multi });
  assert.equal(/secret|token|password|authorization/i.test(serialized), false);
  assert.equal(multi.executionGate, "CLOSED");
  assert.equal(multi.authorizesExecution, false);
  assert.equal(multi.productionTraffic, false);
  assert.equal(multi.WEISHAN_PAYS_PROVIDER, false);
  assert.equal(multi.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);

  console.log("GLOBAL_COMMERCE_REAL_PRICE_COVERAGE_SWEEP PASS sources=3 newIntegrations=3 liveCalls=0");
}

main();
