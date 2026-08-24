"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalTravelPriceTruthFoundation.js",
  "apps/desktop/src/renderer/core/amadeusSelfServiceFlightSourceAdapter.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, RegExp });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window.WeishanAmadeusSelfServiceFlightSourceAdapter;
}

function segment(overrides) {
  return Object.assign({
    departure:{ iataCode:"PVG", at:"2026-10-10T02:00:00" },
    arrival:{ iataCode:"SIN", at:"2026-10-10T08:00:00" },
    carrierCode:"MU",
    number:"567",
    operating:{ carrierCode:"MU" }
  }, overrides || {});
}

function offer(overrides) {
  return Object.assign({
    type:"flight-offer",
    id:"amadeus-offer-1",
    source:"GDS",
    numberOfBookableSeats:4,
    itineraries:[{ segments:[segment()] }],
    price:{ currency:"CNY", grandTotal:"1200.00", base:"950.00", fees:[{ amount:"50.00" }] },
    travelerPricings:[{ fareDetailsBySegment:[{ cabin:"ECONOMY", class:"Y" }] }],
    fareFamily:"STANDARD",
    refundability:"REFUNDABLE",
    changeability:"FEE_APPLIES",
    baggage:"INCLUDED",
    observedAt:"2026-09-01T10:00:00.000Z",
    evaluatedAt:"2026-09-01T10:05:00.000Z"
  }, overrides || {});
}

function normalize(api, candidate, options) {
  return api.normalizeFlightOffer(candidate, Object.assign({
    environment:"production",
    cabin:"ECONOMY",
    adults:1,
    children:0,
    infants:0,
    observedAt:"2026-09-01T10:00:00.000Z",
    evaluatedAt:"2026-09-01T10:05:00.000Z"
  }, options || {}));
}

function assertReason(result, reason) {
  assert.equal(result.status, "COMPARED");
  assert.equal(result.comparison.success, true);
  assert.equal(result.comparison.comparable, false);
  assert.equal(result.comparison.reasons.includes(reason), true, `${reason} missing from ${JSON.stringify(result.comparison.reasons)}`);
}

function main() {
  const api = load();

  const matrix = api.buildSourceMatrix();
  assert.equal(matrix.status, "READY");
  assert.equal(matrix.executionGate, "CLOSED");
  assert.equal(matrix.productionTraffic, false);
  assert.equal(matrix.selectedSource, null);
  assert.equal(matrix.selectedSourceBlocked, true);
  assert.equal(matrix.sources.find(function (source) { return source.SOURCE === "Amadeus Self-Service"; }).BLOCKER, "AMADEUS_SELF_SERVICE_DECOMMISSIONED");
  assert.equal(matrix.sources.find(function (source) { return source.SOURCE === "Amadeus Self-Service"; }).RECOMMENDATION, "DEFER_SELF_SERVICE_USE_ENTERPRISE_OR_ALTERNATIVE_FLIGHT_SOURCE");
  assert.equal(matrix.sources.find(function (source) { return source.SOURCE === "Duffel"; }).DATA_REALISM.includes("NOT_REALISTIC"), true);
  assert.equal(matrix.sources.find(function (source) { return source.SOURCE === "Skyscanner Live Prices"; }).BLOCKER, "PARTNER_APPROVAL_REQUIRED");
  assert.equal(matrix.sources.find(function (source) { return source.SOURCE === "Travelport TripServices"; }).ACCESS_FRICTION.includes("HIGH"), true);
  assert.equal(matrix.sources.find(function (source) { return source.SOURCE === "Sabre"; }).BLOCKER, "SABRE_PROVISIONING_REQUIRED");

  const selection = api.selectBestFlightSource();
  assert.equal(selection.BEST_FLIGHT_SOURCE, null);
  assert.equal(selection.CURRENT_ACCESS_STATE, "AMADEUS_SELF_SERVICE_DECOMMISSIONED");
  assert.equal(selection.ACCOUNT_CREATED, false);
  assert.equal(selection.CREDENTIALS_AVAILABLE, false);
  assert.equal(selection.CONTROLLED_REQUESTS, 0);
  assert.equal(selection.AUTH_VALIDATED, false);
  assert.equal(selection.REAL_FARE_VALIDATED, false);
  assert.equal(selection.EXACT_HANDOFF, "NOT_VALIDATED");
  assert.equal(selection.FLIGHT_REAL_PRICE_COVERAGE, "OFFLINE_SCHEMA_ONLY");
  assert.equal(selection.executionGate, "CLOSED");

  const schema = api.officialSchemaSummary();
  assert.equal(schema.readOnlySearchAllowed, true);
  assert.equal(schema.orderCreationRequired, false);
  assert.equal(schema.transactionFieldsRejected, true);
  assert.equal(schema.requestFields.includes("originLocationCode"), true);
  assert.equal(schema.responseFields.includes("price.grandTotal"), true);

  const testOffer = normalize(api, offer(), { environment:"test" });
  assert.equal(testOffer.status, "NORMALIZED");
  assert.equal(testOffer.dataClass, "SANDBOX_TEST_DATA");
  assert.equal(testOffer.normalized.evidence.provider, "amadeus_self_service_test");
  assert.equal(testOffer.normalized.evidence.comparableAsCurrentPrice, false);
  assert.equal(testOffer.apiRequests, 0);
  assert.equal(testOffer.secretAccess, false);
  assert.equal(testOffer.BOOKING, false);

  const live = normalize(api, offer());
  assert.equal(live.status, "NORMALIZED");
  assert.equal(live.normalized.evidence.provider, "amadeus_self_service");
  assert.equal(live.normalized.evidence.search.origin, "PVG");
  assert.equal(live.normalized.evidence.search.destination, "SIN");
  assert.equal(live.normalized.evidence.search.departureDate, "2026-10-10");
  assert.equal(live.normalized.evidence.search.passengers.total, 1);
  assert.equal(live.normalized.evidence.search.cabin, "ECONOMY");
  assert.equal(live.normalized.evidence.segments[0].airline, "MU");
  assert.equal(live.normalized.evidence.segments[0].flightNumber, "567");
  assert.equal(live.normalized.evidence.price, 1200);
  assert.equal(live.normalized.evidence.currency, "CNY");
  assert.equal(live.normalized.evidence.priceBasis, "TOTAL_ITINERARY");
  assert.equal(live.normalized.evidence.taxFeeBasis, "INCLUDED");
  assert.equal(live.normalized.evidence.availability, "AVAILABLE");
  assert.equal(live.normalized.evidence.handoffQuality, "EXACT_SEARCH_RECONSTRUCTION");
  assert.equal(live.normalized.evidence.comparableAsCurrentPrice, true);
  assert.equal(live.normalized.evidence.dataClass, "TRAVEL_PRICE_EVIDENCE");
  assert.equal(live.rawProviderResponsePersisted, false);

  const cheaper = normalize(api, offer({ id:"amadeus-offer-2", price:{ currency:"CNY", grandTotal:"1100.00" } }));
  const comparable = api.compareNormalizedOffers([live, cheaper]);
  assert.equal(comparable.comparison.comparable, true);
  assert.equal(comparable.comparison.selectedAmount, 1100);
  assert.equal(comparable.commissionInfluence, false);

  assertReason(api.compareNormalizedOffers([
    live,
    normalize(api, offer({
      id:"wrong-date",
      itineraries:[{ segments:[segment({ departure:{ iataCode:"PVG", at:"2026-10-11T02:00:00" }, arrival:{ iataCode:"SIN", at:"2026-10-11T08:00:00" } })] }],
      price:{ currency:"CNY", grandTotal:"500.00" }
    }))
  ]), "FLIGHT_IDENTITY_MISMATCH");

  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"wrong-pax", price:{ currency:"CNY", grandTotal:"500.00" } }), { adults:2 })]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"wrong-cabin", travelerPricings:[{ fareDetailsBySegment:[{ cabin:"BUSINESS" }] }], price:{ currency:"CNY", grandTotal:"500.00" } }), { cabin:"BUSINESS" })]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"connecting", itineraries:[{ segments:[
    segment({ arrival:{ iataCode:"HKG", at:"2026-10-10T05:00:00" }, number:"111" }),
    segment({ departure:{ iataCode:"HKG", at:"2026-10-10T07:00:00" }, arrival:{ iataCode:"SIN", at:"2026-10-10T11:00:00" }, number:"222" })
  ]}], price:{ currency:"CNY", grandTotal:"500.00" } }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({
    id:"round-trip",
    itineraries:[{ segments:[segment()] }, { segments:[segment({ departure:{ iataCode:"SIN", at:"2026-10-15T02:00:00" }, arrival:{ iataCode:"PVG", at:"2026-10-15T08:00:00" }, number:"568" })] }],
    price:{ currency:"CNY", grandTotal:"500.00" }
  }), { tripType:"ROUND_TRIP" })]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"per-pax", priceBasis:"PER_PASSENGER", price:{ currency:"CNY", grandTotal:"500.00" } }))]), "FLIGHT_PRICE_BASIS_MISMATCH");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"from-price", priceBasis:"FROM_PRICE", price:{ currency:"CNY", grandTotal:"500.00" } }))]), "FLIGHT_PRICE_BASIS_MISMATCH");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"stale", price:{ currency:"CNY", grandTotal:"500.00" } }), { evaluatedAt:"2026-09-01T11:00:00.000Z" })]), "STALE_OR_INVALID_FRESHNESS");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"conditional", refundability:"UNKNOWN", baggage:"UNKNOWN", price:{ currency:"CNY", grandTotal:"500.00" } }))]), "FLIGHT_FARE_CONDITIONS_INCOMPLETE");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"tax-excluded", taxFeeBasis:"EXCLUDED", price:{ currency:"CNY", grandTotal:"500.00" } }))]), "TAX_FEE_BASIS_MISMATCH");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"eur", price:{ currency:"EUR", grandTotal:"500.00" } }))]), "CROSS_CURRENCY_NOT_COMPARABLE");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"unknown-availability", numberOfBookableSeats:0, price:{ currency:"CNY", grandTotal:"500.00" } }))]), "AVAILABILITY_NOT_AUTHORITATIVE");
  assertReason(api.compareNormalizedOffers([live, normalize(api, offer({ id:"unsafe-handoff", handoffQuality:"ROUTE_SEARCH_HANDOFF", handoffUrl:"https://developers.amadeus.com/", price:{ currency:"CNY", grandTotal:"500.00" } }))]), "FLIGHT_HANDOFF_NOT_EXACT");
  assert.equal(normalize(api, offer({ bookingUrl:"https://developers.amadeus.com/book" })).error.code, "FLIGHT_TRANSACTION_FIELDS_REJECTED");
  assert.equal(normalize(api, offer({ handoffUrl:"https://evil.example.invalid/" })).normalized.error.code, "FLIGHT_PRICE_TRUTH_INVALID");

  const commissionA = normalize(api, offer({ id:"commission-a", price:{ currency:"CNY", grandTotal:"1200.00" }, commercialMetadata:{ commission:0.9 } }));
  const commissionB = normalize(api, offer({ id:"commission-b", price:{ currency:"CNY", grandTotal:"1100.00" }, commercialMetadata:{ commission:0.01 } }));
  const commissionComparison = api.compareNormalizedOffers([commissionA, commissionB]);
  assert.equal(commissionComparison.comparison.selectedAmount, 1100);
  assert.equal(commissionComparison.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);

  const serialized = JSON.stringify({ matrix, selection, testOffer, live, comparable, commissionComparison });
  assert.equal(serialized.includes("client_secret"), false);
  assert.equal(serialized.includes("Bearer "), false);
  assert.equal(serialized.includes("Authorization"), false);
  assert.equal(serialized.includes("api_key"), false);
  assert.equal(serialized.includes("paymentUrl"), false);
  assert.equal(serialized.includes("checkoutUrl"), false);
  assert.equal(serialized.includes("orderUrl"), false);
  console.log("AMADEUS_SELF_SERVICE_FLIGHT_SOURCE_ADAPTER_TEST_PASS");
}

main();
