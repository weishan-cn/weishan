"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalCommerceProductIdentityMatcher.js",
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

function deal(overrides) {
  return Object.assign({
    offerId:"deal/gog",
    provider:"cheapshark",
    merchant:"GOG",
    productName:"The Witcher 3: Wild Hunt",
    canonicalProductIdentity:"steam:292030",
    itemCondition:"NEW",
    edition:"standard",
    price:39.99,
    currency:"USD",
    priceConditions:[],
    availabilityStatus:"OFFER_OBSERVED",
    handoffUrl:"https://www.cheapshark.com/redirect?dealID=deal%2Fgog",
    observedAt:"2026-08-24T00:00:00.000Z",
    providerUpdatedAt:"2026-08-23T00:00:00.000Z"
  }, overrides || {});
}

function flow(offers, overrides) {
  return load().buildProductTruthFlow(Object.assign({
    sourceId:"cheapshark",
    query:"The Witcher 3: Wild Hunt standard new",
    productIdentity:{ canonicalProductId:"steam:292030" },
    requestedVariant:{ platform:"steam", edition:"standard", condition:"new" },
    offers:offers
  }, overrides || {}));
}

function quarantined(result, offerId) {
  const item = result.productTruth.quarantinedOffers.find(function (offer) { return offer.offerId === offerId; });
  assert.ok(item, "expected quarantined " + offerId);
  return new Set(item.quarantineReasons);
}

function main() {
  const bridge = load();
  const inventory = bridge.buildSourceCapabilityInventory();
  assert.equal(inventory.status, "READY");
  assert.equal(inventory.credentialsIncluded, false);
  const cheapshark = inventory.sources.find(function (source) { return source.SOURCE_ID === "cheapshark"; });
  assert.equal(cheapshark.PRODUCT_IDENTITY, "YES");
  assert.equal(cheapshark.PRICE, "YES");
  assert.equal(cheapshark.HANDOFF, "YES");
  assert.equal(cheapshark.AUTHORITY, "TRUSTED_CONTROLLED_READONLY_PROVIDER_PRICE");

  const readiness = bridge.buildAdapterReadinessChecklist({ sourceId:"cheapshark" });
  assert.equal(readiness.readiness.IDENTITY_READY, true);
  assert.equal(readiness.readiness.PRICE_READY, true);
  assert.equal(readiness.readiness.HANDOFF_READY, true);
  assert.equal(readiness.readiness.PRODUCT_TRUTH_READY, true);
  assert.equal(readiness.readiness.PRODUCTION_READY, false);

  const realistic = flow([
    deal({ offerId:"correct-exact", price:39.99 }),
    deal({ offerId:"wrong-edition-cheaper", edition:"complete", price:19.99 }),
    deal({ offerId:"refurbished-cheaper", itemCondition:"REFURBISHED", price:9.99 }),
    deal({ offerId:"worse-commission", merchant:"Steam", price:49.99, commercialMetadata:{ commission:0.9 } }),
    deal({ offerId:"invalid-price", price:"FREE" }),
    deal({ offerId:"unsafe-handoff", price:1, handoffUrl:"https://www.cheapshark.com/checkout?dealID=unsafe" }),
    deal({ offerId:"cross-currency", price:20, currency:"EUR" })
  ]);
  assert.equal(realistic.status, "CURRENCY_NORMALIZATION_REQUIRED");
  assert.equal(realistic.productTruth.recommendation, null);
  assert.equal(quarantined(realistic, "wrong-edition-cheaper").has("VARIANT_MISMATCH"), true);
  assert.equal(quarantined(realistic, "refurbished-cheaper").has("VARIANT_MISMATCH"), true);
  assert.equal(quarantined(realistic, "invalid-price").has("PRICE_INVALID_OR_UNKNOWN"), true);
  assert.equal(quarantined(realistic, "unsafe-handoff").has("HANDOFF_TRANSACTION_PATH_BLOCKED"), true);
  assert.equal(realistic.productTruth.eligibleOffers.some(function (offer) { return offer.offerId === "worse-commission"; }), true);
  assert.equal(realistic.productTruth.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);

  const winner = flow([
    deal({ offerId:"correct-exact", price:39.99 }),
    deal({ offerId:"wrong-variant-cheaper", edition:"complete", price:19.99 }),
    deal({ offerId:"commission-bearing-worse", merchant:"Steam", price:59.99, commercialMetadata:{ commission:0.8 } }),
    deal({ offerId:"invalid-price", price:"FREE" }),
    deal({ offerId:"unsafe-handoff", price:1, handoffUrl:"https://www.cheapshark.com/payment?dealID=unsafe" })
  ]);
  assert.equal(winner.status, "PRODUCT_TRUTH_READY");
  assert.equal(winner.productTruth.recommendation.offerId, "correct-exact");
  assert.equal(winner.trace.sourceRecord, "correct-exact");
  assert.equal(winner.trace.productTruthClassification, "ELIGIBLE");
  assert.equal(winner.trace.handoff, "EXACT_HANDOFF");
  assert.equal(winner.productionReady, false);

  const directNonAffiliate = winner.productTruth.eligibleOffers.find(function (offer) { return offer.offerId === "correct-exact"; });
  assert.equal(directNonAffiliate.affiliateEligible, false);

  const authorityAttack = flow([
    deal({ offerId:"authority-attack", price:5, verified:true, authoritative:true, handoffConfidence:"EXACT", canonicalProductIdentity:"steam:999999" }),
    deal({ offerId:"trusted-record", price:39.99 })
  ]);
  assert.equal(authorityAttack.productTruth.recommendation.offerId, "trusted-record");
  assert.equal(quarantined(authorityAttack, "authority-attack").has("PRODUCT_IDENTITY_MISMATCH"), true);
  const normalizedAttack = bridge.normalizeSourceOffers({ sourceId:"cheapshark", offers:[deal({ offerId:"authority-attack", verified:true, authoritative:true })] });
  assert.equal(normalizedAttack.normalizedOffers[0].provenance.rawAuthorityClaimIgnored, true);
  assert.equal(normalizedAttack.normalizedOffers[0].provenance.maximumEvidenceAuthority, "PROVIDER_PRICE_OBSERVATION");

  const duplicateTracking = flow([
    deal({ offerId:"same-deal", handoffUrl:"https://www.cheapshark.com/redirect?dealID=same-deal&utm_source=a" }),
    deal({ offerId:"same-deal-copy", handoffUrl:"https://www.cheapshark.com/redirect?dealID=same-deal&utm_source=b" })
  ]);
  assert.equal(duplicateTracking.productTruth.eligibleOfferCount, 1);
  assert.equal(duplicateTracking.productTruth.duplicateOfferCount, 1);

  const sourceFailureIsolation = flow([
    deal({ offerId:"malformed-source", price:12, sourceStatus:"MALFORMED" }),
    deal({ offerId:"valid-source", price:42 })
  ]);
  assert.equal(sourceFailureIsolation.productTruth.recommendation.offerId, "valid-source");
  assert.equal(quarantined(sourceFailureIsolation, "malformed-source").has("SOURCE_FAILED"), true);

  const orderingA = flow([deal({ offerId:"a", price:40 }), deal({ offerId:"b", merchant:"Steam", price:40 })]);
  const orderingB = flow([deal({ offerId:"b", merchant:"Steam", price:40 }), deal({ offerId:"a", price:40 })]);
  assert.equal(orderingA.productTruth.recommendation.offerId, orderingB.productTruth.recommendation.offerId);

  const noTrust = bridge.buildProductTruthFlow({ sourceId:"unknown_source", offers:[deal()] });
  assert.equal(noTrust.status, "FAILED");
  assert.equal(noTrust.code, "SOURCE_NOT_TRUSTED");

  const json = JSON.stringify(winner);
  assert.equal(/secret|token|password|authorization/i.test(json), false);
  assert.equal(winner.executionGate, "CLOSED");
  assert.equal(winner.authorizesExecution, false);
  assert.equal(winner.productionTraffic, false);
  assert.equal(winner.WEISHAN_PAYS_PROVIDER, false);
  assert.equal(winner.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);
  assert.equal(Object.isFrozen(winner.productTruth.eligibleOffers[0]), true);

  console.log("global-commerce-controlled-source-adapter-bridge PASS");
}

main();
