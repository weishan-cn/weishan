"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILE = "apps/desktop/src/renderer/core/globalCommerceProductTruthPipeline.js";

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, FILE), "utf8"), context, { filename:FILE });
  return window.WeishanGlobalCommerceProductTruthPipeline;
}

function offer(overrides) {
  return Object.assign({
    offerId:"offer-a",
    provider:"provider_a",
    merchant:"Merchant A",
    productName:"Weishan Test Camera black 128GB",
    productIdentity:{ canonicalProductId:"camera-128" },
    variants:{ color:"black", storage:"128gb", condition:"new" },
    price:100,
    currency:"USD",
    priceConditions:[],
    availability:"IN_STOCK",
    availabilityAuthority:true,
    handoffType:"DIRECT_PRODUCT",
    handoffUrl:"https://merchant-a.example/product/camera-128-black",
    allowedHandoffHosts:["merchant-a.example"],
    affiliateEligible:false,
    commissionEligible:false,
    commercialMetadata:{ commission:0 },
    observedAt:"2026-08-24T01:00:00.000Z",
    providerUpdatedAt:"2026-08-24T00:55:00.000Z"
  }, overrides || {});
}

function evaluate(offers, overrides) {
  const api = load();
  return api.buildGlobalCommerceProductTruthPipeline(Object.assign({
    query:"Weishan Test Camera black 128GB",
    productIdentity:{ canonicalProductId:"camera-128" },
    requestedVariant:{ color:"black", storage:"128gb", condition:"new" },
    offers:offers
  }, overrides || {}));
}

function reasonSet(result, offerId) {
  const item = result.quarantinedOffers.find(function (candidate) { return candidate.offerId === offerId; });
  assert.ok(item, "expected quarantined offer " + offerId);
  return new Set(item.quarantineReasons);
}

function main() {
  const wrongVariant = evaluate([
    offer({ offerId:"white-cheap", variants:{ color:"white", storage:"128gb", condition:"new" }, price:50 }),
    offer({ offerId:"black-correct", price:80 })
  ]);
  assert.equal(wrongVariant.status, "READY");
  assert.equal(wrongVariant.recommendation.offerId, "black-correct");
  assert.equal(reasonSet(wrongVariant, "white-cheap").has("VARIANT_MISMATCH"), true);
  assert.equal(wrongVariant.matrix.VARIANT_MATCHING, true);

  const invalidPrice = evaluate([
    offer({ offerId:"unknown-price", price:null }),
    offer({ offerId:"valid-price", price:120 })
  ]);
  assert.equal(invalidPrice.recommendation.offerId, "valid-price");
  assert.equal(reasonSet(invalidPrice, "unknown-price").has("PRICE_INVALID_OR_UNKNOWN"), true);

  const crossCurrency = evaluate([
    offer({ offerId:"usd", price:100, currency:"USD" }),
    offer({ offerId:"eur", price:90, currency:"EUR", provider:"provider_b", merchant:"Merchant B", handoffUrl:"https://merchant-b.example/product/camera", allowedHandoffHosts:["merchant-b.example"] })
  ]);
  assert.equal(crossCurrency.status, "CURRENCY_NORMALIZATION_REQUIRED");
  assert.equal(crossCurrency.recommendation, null);
  assert.equal(crossCurrency.matrix.CURRENCY_SAFETY, false);

  const conditionalLower = evaluate([
    offer({ offerId:"coupon-price", price:50, priceConditions:["COUPON"], conditionalPrice:true }),
    offer({ offerId:"plain-price", price:75 })
  ]);
  assert.equal(conditionalLower.recommendation.offerId, "plain-price");
  assert.equal(reasonSet(conditionalLower, "coupon-price").has("CONDITIONAL_PRICE_NOT_UNCONDITIONAL_WINNER"), true);

  const commissionIsolation = evaluate([
    offer({ offerId:"low-no-commission", price:90, affiliateEligible:false, commissionEligible:false, commercialMetadata:{ commission:0 } }),
    offer({ offerId:"high-commission", price:110, provider:"provider_b", merchant:"Merchant B", handoffUrl:"https://merchant-b.example/product/camera", allowedHandoffHosts:["merchant-b.example"], affiliateEligible:true, commissionEligible:true, commercialMetadata:{ commission:0.8 } })
  ]);
  assert.equal(commissionIsolation.recommendation.offerId, "low-no-commission");
  assert.equal(commissionIsolation.recommendation.commissionUsedForRanking, false);
  assert.equal(commissionIsolation.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);
  assert.equal(commissionIsolation.matrix.PRODUCT_WITHOUT_AFFILIATE, true);

  const exactHandoff = evaluate([
    offer({ offerId:"search-link", price:99, handoffType:"SEARCH_RESULTS_HANDOFF", handoffUrl:"https://merchant-a.example/search?q=camera" }),
    offer({ offerId:"exact-link", price:99 })
  ]);
  assert.equal(exactHandoff.recommendation.offerId, "exact-link");
  assert.equal(reasonSet(exactHandoff, "search-link").has("EXACT_HANDOFF_REQUIRED_FOR_RECOMMENDATION"), true);
  assert.equal(exactHandoff.matrix.EXACT_HANDOFF, true);

  const unsafeHandoff = evaluate([
    offer({ offerId:"checkout-path", price:60, handoffUrl:"https://merchant-a.example/checkout/camera" }),
    offer({ offerId:"safe-path", price:70 })
  ]);
  assert.equal(unsafeHandoff.recommendation.offerId, "safe-path");
  assert.equal(reasonSet(unsafeHandoff, "checkout-path").has("HANDOFF_TRANSACTION_PATH_BLOCKED"), true);
  assert.equal(unsafeHandoff.matrix.UNSAFE_HANDOFF_REJECTION, true);

  const sourceFailureIsolation = evaluate([
    offer({ offerId:"failed-source", sourceStatus:"TIMEOUT", price:10 }),
    offer({ offerId:"surviving-source", price:95 })
  ]);
  assert.equal(sourceFailureIsolation.status, "READY");
  assert.equal(sourceFailureIsolation.recommendation.offerId, "surviving-source");
  assert.equal(reasonSet(sourceFailureIsolation, "failed-source").has("SOURCE_FAILED"), true);

  const duplicate = evaluate([
    offer({ offerId:"duplicate-a", price:100 }),
    offer({ offerId:"duplicate-b", price:100 })
  ]);
  assert.equal(duplicate.eligibleOfferCount, 1);
  assert.equal(duplicate.duplicateOfferCount, 1);
  assert.equal(duplicate.matrix.OFFER_DEDUP, true);

  const json = JSON.stringify(duplicate);
  assert.equal(/secret|token|password|authorization/i.test(json), false);
  assert.equal(duplicate.executionGate, "CLOSED");
  assert.equal(duplicate.authorizesExecution, false);
  assert.equal(duplicate.productionTraffic, false);
  assert.equal(duplicate.safety.NO_CHECKOUT, true);
  assert.equal(duplicate.safety.NO_PAYMENT, true);
  assert.equal(duplicate.safety.NO_ORDER_EXECUTION, true);
  assert.equal(duplicate.safety.NO_BOOKING_EXECUTION, true);
  assert.equal(duplicate.safety.NO_TICKET_ISSUANCE, true);
  assert.equal(Object.isFrozen(duplicate), true);

  console.log("global-commerce-product-truth-pipeline PASS");
}

main();
