"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise, AbortController });
  vm.runInContext(fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/readOnlyPriceTruthLayer.js"), "utf8"), context);
  return window.WeishanReadOnlyPriceTruthLayer;
}

function common(overrides) {
  return Object.assign({
    sourceId:"account_free_readonly_source",
    sourceName:"Account-free Read-only Source",
    sourceType:"PUBLIC_READ_ONLY",
    retrievedAt:"2026-08-29T10:00:00.000Z",
    evaluatedAt:"2026-08-29T10:02:00.000Z",
    currency:"USD",
    totalPrice:100,
    priceCompleteness:"TOTAL_CONFIRMED",
    availabilityStatus:"AVAILABLE",
    evidenceTruthClass:"REAL_PROVIDER_PRICE",
    manualHandoff:"https://source.example/item"
  }, overrides || {});
}

function main() {
  const api = load();

  const product = api.normalizePriceEvidence(common({
    domain:"PRODUCT",
    priceBasis:"ITEM_TOTAL",
    itemId:"game-1",
    productName:"Example Game",
    variant:"standard-pc",
    condition:"NEW"
  }));
  assert.equal(product.success, true);
  assert.equal(product.evidence.domain, "PRODUCT");
  assert.equal(product.evidence.priceBasis, "ITEM_TOTAL");
  assert.equal(product.evidence.productName, "Example Game");
  assert.equal(product.evidence.variant, "standard-pc");
  assert.equal(product.evidence.condition, "NEW");
  assert.equal(product.evidence.shipping, null);
  assert.equal(product.evidence.taxes, null);
  assert.equal(product.evidence.fees, null);
  assert.equal(product.evidence.displayAsLiveCurrentPrice, true);
  assert.equal(product.evidence.comparableAsVerifiedTotal, true);

  const differentVariant = api.normalizePriceEvidence(common({
    domain:"PRODUCT",
    priceBasis:"ITEM_TOTAL",
    itemId:"game-1",
    productName:"Example Game",
    variant:"deluxe-pc",
    condition:"NEW",
    totalPrice:80
  }));
  const productMismatch = api.comparePriceEvidence([product, differentVariant]);
  assert.equal(productMismatch.comparable, false);
  assert.equal(productMismatch.reason, "MATERIAL_SEARCH_CONTEXT_MISMATCH");

  const productUnknownBasis = api.normalizePriceEvidence(common({
    domain:"PRODUCT",
    itemId:"game-1",
    productName:"Example Game"
  }));
  assert.equal(productUnknownBasis.success, false);
  assert.equal(productUnknownBasis.code, "PRODUCT_PRICE_BASIS_INVALID");

  const hotel = api.normalizePriceEvidence(common({
    domain:"HOTEL",
    priceBasis:"TOTAL_STAY",
    propertyId:"hotel-1",
    propertyName:"Example Hotel",
    checkIn:"2026-09-10",
    checkOut:"2026-09-12",
    rooms:1,
    adults:2,
    children:0,
    roomType:"standard",
    ratePlan:"refundable",
    manualHandoff:"https://source.example/hotel"
  }));
  assert.equal(hotel.success, true);
  assert.equal(hotel.evidence.domain, "HOTEL");
  assert.equal(hotel.evidence.priceBasis, "TOTAL_STAY");
  assert.equal(hotel.evidence.nights, 2);
  assert.equal(hotel.evidence.rooms, 1);
  assert.equal(hotel.evidence.adults, 2);
  assert.equal(hotel.evidence.children, 0);
  assert.equal(hotel.evidence.comparableAsVerifiedTotal, true);

  const perNight = api.normalizePriceEvidence(common({
    domain:"HOTEL",
    priceBasis:"PER_NIGHT",
    propertyId:"hotel-1",
    propertyName:"Example Hotel",
    checkIn:"2026-09-10",
    checkOut:"2026-09-12",
    rooms:1,
    adults:2,
    children:0,
    roomType:"standard",
    ratePlan:"refundable",
    totalPrice:50,
    manualHandoff:"https://source.example/hotel"
  }));
  assert.equal(perNight.success, true);
  assert.equal(perNight.evidence.displayAsLiveCurrentPrice, true);
  assert.equal(perNight.evidence.comparableAsVerifiedTotal, false);

  const changedOccupancy = api.normalizePriceEvidence(common({
    domain:"HOTEL",
    priceBasis:"TOTAL_STAY",
    propertyId:"hotel-2",
    propertyName:"Another Hotel",
    checkIn:"2026-09-10",
    checkOut:"2026-09-12",
    rooms:1,
    adults:1,
    children:0,
    totalPrice:75,
    manualHandoff:"https://source.example/hotel-2"
  }));
  const occupancyMismatch = api.comparePriceEvidence([hotel, changedOccupancy]);
  assert.equal(occupancyMismatch.comparable, false);
  assert.equal(occupancyMismatch.reason, "MATERIAL_SEARCH_CONTEXT_MISMATCH");

  const unsafeSandbox = api.normalizePriceEvidence(common({
    domain:"PRODUCT",
    sourceType:"PROVIDER_TEST_API",
    priceBasis:"ITEM_TOTAL",
    itemId:"game-1",
    productName:"Example Game"
  }));
  assert.equal(unsafeSandbox.success, false);
  assert.equal(unsafeSandbox.code, "REAL_PRICE_SOURCE_CLASS_INVALID");

  const productState = api.buildPriceUserState({ domain:"PRODUCT", records:[] });
  const hotelState = api.buildPriceUserState({ domain:"HOTEL", records:[] });
  const flightState = api.buildPriceUserState({ domain:"FLIGHT", records:[] });
  assert.match(productState.title, /商品/);
  assert.match(hotelState.title, /酒店/);
  assert.match(flightState.title, /机票/);
  assert.equal(productState.aiRequired, false);
  assert.equal(hotelState.aiRequired, false);
  assert.equal(flightState.aiRequired, false);

  const serialized = JSON.stringify({ product, hotel, productState, hotelState, flightState });
  assert.equal(/authorization|private_key|api_key|secret/i.test(serialized), false);
  assert.equal(api.boundary().executionGate, "CLOSED");
  assert.equal(api.boundary().purchaseAuthority, false);
  assert.equal(api.boundary().bookingAuthority, false);
  assert.equal(api.boundary().paymentAuthority, false);
  console.log("THREE_VERTICAL_PRICE_TRUTH_PROGRAM_TEST_PASS");
}

main();
