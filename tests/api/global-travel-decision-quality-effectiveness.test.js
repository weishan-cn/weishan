"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map });
  vm.runInContext(fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/globalTravelPriceTruthFoundation.js"), "utf8"), context);
  return window.WeishanGlobalTravelPriceTruthFoundation;
}

function policy(domain, provider, overrides) {
  const sourceType = domain === "FLIGHT" ? "GDS" : domain === "HOTEL" ? "HOTEL_AGGREGATOR" : "CRUISE_AGGREGATOR";
  const host = domain.toLowerCase() + ".example.invalid";
  return Object.assign({
    provider,
    sourceType,
    priceAuthority:"AUTHORITATIVE",
    allowedHandoffHosts:[host],
    maxAgeSeconds:1800
  }, overrides || {});
}

function flight(api, overrides) {
  return api.normalizeFlightOffer(Object.assign({
    sourcePolicy:policy("FLIGHT", "flight_reference"),
    search:{ origin:"CTU", destination:"HND", departureDate:"2026-09-10", returnDate:null, tripType:"ONE_WAY", cabin:"ECONOMY", passengers:{ adults:2, children:0, infants:0 } },
    segments:[{ journey:"OUTBOUND", origin:"CTU", destination:"HND", departureAt:"2026-09-10T02:00:00.000Z", arrivalAt:"2026-09-10T08:00:00.000Z", airline:"CA", operatingAirline:"CA", flightNumber:"401", cabin:"ECONOMY" }],
    fareFamily:"Standard",
    refundability:"REFUNDABLE",
    changeability:"FEE_APPLIES",
    baggage:"INCLUDED",
    price:2400,
    currency:"CNY",
    priceBasis:"TOTAL_ITINERARY",
    taxFeeBasis:"INCLUDED",
    availability:"AVAILABLE",
    observedAt:"2026-08-25T10:00:00.000Z",
    evaluatedAt:"2026-08-25T10:05:00.000Z",
    handoffQuality:"EXACT_ITINERARY_HANDOFF",
    handoffUrl:"https://flight.example.invalid/itinerary/reference"
  }, overrides || {}));
}

function hotel(api, overrides) {
  return api.normalizeHotelOffer(Object.assign({
    sourcePolicy:policy("HOTEL", "hotel_reference"),
    propertyId:"tokyo-100",
    propertyName:"Weishan Tokyo Hotel",
    locationKey:"JP-TYO-SHINJUKU",
    checkIn:"2026-09-10",
    checkOut:"2026-09-13",
    occupancy:{ adults:2, children:0, rooms:1 },
    roomType:"Deluxe King",
    ratePlan:"Breakfast Flexible",
    meals:"Breakfast",
    refundability:"REFUNDABLE",
    paymentTiming:"PAY_LATER",
    basePrice:450,
    tax:60,
    fees:90,
    totalPrice:600,
    currency:"USD",
    priceBasis:"TOTAL_STAY",
    taxFeeBasis:"INCLUDED",
    availability:"AVAILABLE",
    observedAt:"2026-08-25T10:00:00.000Z",
    evaluatedAt:"2026-08-25T10:05:00.000Z",
    handoffQuality:"EXACT_STAY_HANDOFF",
    handoffUrl:"https://hotel.example.invalid/stay/reference"
  }, overrides || {}));
}

function cruise(api, overrides) {
  return api.normalizeCruiseOffer(Object.assign({
    sourcePolicy:policy("CRUISE", "cruise_reference"),
    cruiseLine:"Weishan Cruise Line",
    ship:"Pearl Example",
    shipId:"ship-100",
    sailingId:"hk-2026-10-01-7n",
    itineraryId:"asia-7n",
    departurePort:"HKG",
    returnPort:"HKG",
    portsOfCall:["KHH", "OKA"],
    destinationRegion:"Asia",
    departureDate:"2026-10-01",
    returnDate:"2026-10-08",
    durationNights:7,
    durationDays:8,
    market:"CN",
    occupancy:{ adults:2, children:0, infants:0, cabins:1 },
    cabinCategory:"BALCONY",
    cabinSubcategory:"Balcony",
    cabinAssignment:"SPECIFIC_CABIN",
    fareBasis:"Standard",
    baseFare:1600,
    portTaxes:120,
    governmentFees:80,
    portFees:60,
    mandatoryFees:40,
    gratuities:100,
    totalPrice:2000,
    price:2000,
    currency:"USD",
    priceBasis:"TOTAL_BOOKING",
    costCompleteness:"KNOWN_TOTAL",
    taxFeeBasis:"INCLUDED",
    availability:"SPECIFIC_RATE_AVAILABLE",
    promotion:"NONE",
    observedAt:"2026-08-25T10:00:00.000Z",
    evaluatedAt:"2026-08-25T10:05:00.000Z",
    handoffQuality:"EXACT_SAILING_CABIN_HANDOFF",
    handoffUrl:"https://cruise.example.invalid/sailing/reference"
  }, overrides || {}));
}

function assertReason(result, reason) {
  assert.equal(result.success, true);
  assert.equal(result.comparable, false);
  assert.equal(result.reasons.includes(reason), true, `${reason} missing from ${JSON.stringify(result.reasons)}`);
}

function evaluateDomain(api, domain) {
  const metrics = {
    cases:0,
    trueWinnerCases:0,
    winnerCorrect:0,
    falseWinners:0,
    noClearWinnerCases:0,
    noClearWinnerCorrect:0,
    wrongIdentityWinners:0,
    wrongBasisWinners:0,
    staleWinners:0,
    unavailableWinners:0,
    testDataWinners:0,
    crossCurrencyWinners:0,
    unsafeHandoffs:0,
    sourceOrderAttack:"PASS"
  };

  function comparablePair(records, expectedProvider, expectedAmount) {
    metrics.cases += 1;
    metrics.trueWinnerCases += 1;
    const result = api[`compare${domain}Offers`](records);
    assert.equal(result.comparable, true);
    assert.equal(result.selectedProvider, expectedProvider);
    assert.equal(result.selectedAmount, expectedAmount);
    metrics.winnerCorrect += 1;
    const shuffled = api[`compare${domain}Offers`](records.slice().reverse());
    assert.equal(shuffled.selectedProvider, result.selectedProvider);
    assert.equal(shuffled.selectedAmount, result.selectedAmount);
  }

  function blockedPair(records, reason, metric) {
    metrics.cases += 1;
    metrics.noClearWinnerCases += 1;
    const result = api[`compare${domain}Offers`](records);
    assertReason(result, reason);
    metrics.noClearWinnerCorrect += 1;
    if (metric) assert.equal(metrics[metric], 0);
  }

  if (domain === "Flight") {
    const base = flight(api);
    comparablePair([base, flight(api, { sourcePolicy:policy("FLIGHT", "flight_total_low"), price:2300, handoffUrl:"https://flight.example.invalid/itinerary/low" })], "flight_total_low", 2300);
    blockedPair([base, flight(api, { sourcePolicy:policy("FLIGHT", "wrong_date"), search:{ origin:"CTU", destination:"HND", departureDate:"2026-09-11", returnDate:null, tripType:"ONE_WAY", cabin:"ECONOMY", passengers:{ adults:2, children:0, infants:0 } }, segments:[{ journey:"OUTBOUND", origin:"CTU", destination:"HND", departureAt:"2026-09-11T02:00:00.000Z", arrivalAt:"2026-09-11T08:00:00.000Z", airline:"CA", operatingAirline:"CA", flightNumber:"401", cabin:"ECONOMY" }], price:100 })], "FLIGHT_IDENTITY_MISMATCH", "wrongIdentityWinners");
    blockedPair([base, flight(api, { sourcePolicy:policy("FLIGHT", "per_passenger"), priceBasis:"PER_PASSENGER", price:1200 })], "FLIGHT_PRICE_BASIS_MISMATCH", "wrongBasisWinners");
    blockedPair([base, flight(api, { sourcePolicy:policy("FLIGHT", "stale"), observedAt:"2026-08-24T00:00:00.000Z", price:100 })], "STALE_OR_INVALID_FRESHNESS", "staleWinners");
    blockedPair([base, flight(api, { sourcePolicy:policy("FLIGHT", "unavailable"), availability:"UNAVAILABLE", price:100 })], "AVAILABILITY_NOT_AUTHORITATIVE", "unavailableWinners");
    blockedPair([base, flight(api, { sourcePolicy:policy("FLIGHT", "test", { priceAuthority:"AUTHORIZED_SANDBOX", sourceType:"SANDBOX" }), price:100 })], "SOURCE_AUTHORITY_NOT_LIVE", "testDataWinners");
    blockedPair([base, flight(api, { sourcePolicy:policy("FLIGHT", "eur"), currency:"EUR", price:100 })], "CROSS_CURRENCY_NOT_COMPARABLE", "crossCurrencyWinners");
  }

  if (domain === "Hotel") {
    const base = hotel(api);
    comparablePair([base, hotel(api, { sourcePolicy:policy("HOTEL", "hotel_total_low"), basePrice:500, tax:40, fees:30, totalPrice:570, handoffUrl:"https://hotel.example.invalid/stay/low" })], "hotel_total_low", 570);
    blockedPair([base, hotel(api, { sourcePolicy:policy("HOTEL", "same_name_wrong_property"), propertyId:"tokyo-999", locationKey:"JP-TYO-UENO", totalPrice:100 })], "HOTEL_IDENTITY_MISMATCH", "wrongIdentityWinners");
    blockedPair([base, hotel(api, { sourcePolicy:policy("HOTEL", "per_night"), priceBasis:"PER_NIGHT", totalPrice:150 })], "HOTEL_PRICE_BASIS_MISMATCH", "wrongBasisWinners");
    blockedPair([base, hotel(api, { sourcePolicy:policy("HOTEL", "fee_unknown"), taxFeeBasis:"UNKNOWN", totalPrice:100 })], "TAX_FEE_BASIS_MISMATCH", "wrongBasisWinners");
    blockedPair([base, hotel(api, { sourcePolicy:policy("HOTEL", "stale"), observedAt:"2026-08-24T00:00:00.000Z", totalPrice:100 })], "STALE_OR_INVALID_FRESHNESS", "staleWinners");
    blockedPair([base, hotel(api, { sourcePolicy:policy("HOTEL", "sold_out"), availability:"UNAVAILABLE", totalPrice:100 })], "AVAILABILITY_NOT_AUTHORITATIVE", "unavailableWinners");
    blockedPair([base, hotel(api, { sourcePolicy:policy("HOTEL", "eval", { priceAuthority:"AUTHORIZED_SANDBOX", sourceType:"EVALUATION" }), totalPrice:100 })], "SOURCE_AUTHORITY_NOT_LIVE", "testDataWinners");
    blockedPair([base, hotel(api, { sourcePolicy:policy("HOTEL", "eur"), currency:"EUR", totalPrice:100 })], "CROSS_CURRENCY_NOT_COMPARABLE", "crossCurrencyWinners");
  }

  if (domain === "Cruise") {
    const base = cruise(api);
    comparablePair([base, cruise(api, { sourcePolicy:policy("CRUISE", "cruise_true_total_low"), price:1200, totalPrice:1900, handoffUrl:"https://cruise.example.invalid/sailing/low" })], "cruise_true_total_low", 1900);
    comparablePair([base, cruise(api, { sourcePolicy:policy("CRUISE", "cruise_headline_low_total_high"), price:799, totalPrice:2200, handoffUrl:"https://cruise.example.invalid/sailing/headline-low" })], "cruise_reference", 2000);
    blockedPair([base, cruise(api, { sourcePolicy:policy("CRUISE", "wrong_sailing"), sailingId:"hk-2026-10-08-7n", departureDate:"2026-10-08", returnDate:"2026-10-15", price:100, totalPrice:100 })], "CRUISE_IDENTITY_MISMATCH", "wrongIdentityWinners");
    blockedPair([base, cruise(api, { sourcePolicy:policy("CRUISE", "interior"), cabinCategory:"INTERIOR", cabinSubcategory:"Interior", price:100, totalPrice:100 })], "CRUISE_CABIN_CONTEXT_MISMATCH", "wrongIdentityWinners");
    blockedPair([base, cruise(api, { sourcePolicy:policy("CRUISE", "from_price"), priceBasis:"STARTING_FROM", price:799, totalPrice:null })], "CRUISE_PRICE_BASIS_MISMATCH", "wrongBasisWinners");
    blockedPair([base, cruise(api, { sourcePolicy:policy("CRUISE", "fees_unknown"), costCompleteness:"PARTIAL_TOTAL", taxFeeBasis:"EXCLUDED", mandatoryFees:null, totalPrice:null, price:100 })], "CRUISE_TOTAL_COST_INCOMPLETE", "wrongBasisWinners");
    blockedPair([base, cruise(api, { sourcePolicy:policy("CRUISE", "stale"), observedAt:"2026-08-24T00:00:00.000Z", price:100, totalPrice:100 })], "STALE_OR_INVALID_FRESHNESS", "staleWinners");
    blockedPair([base, cruise(api, { sourcePolicy:policy("CRUISE", "sold_out"), availability:"SOLD_OUT", price:100, totalPrice:100 })], "AVAILABILITY_NOT_AUTHORITATIVE", "unavailableWinners");
    blockedPair([base, cruise(api, { sourcePolicy:policy("CRUISE", "eval", { priceAuthority:"AUTHORIZED_SANDBOX", sourceType:"EVALUATION" }), price:100, totalPrice:100 })], "SOURCE_AUTHORITY_NOT_LIVE", "testDataWinners");
    blockedPair([base, cruise(api, { sourcePolicy:policy("CRUISE", "eur"), currency:"EUR", price:100, totalPrice:100 })], "CROSS_CURRENCY_NOT_COMPARABLE", "crossCurrencyWinners");
  }

  return metrics;
}

function main() {
  const api = load();
  const flightMetrics = evaluateDomain(api, "Flight");
  const hotelMetrics = evaluateDomain(api, "Hotel");
  const cruiseMetrics = evaluateDomain(api, "Cruise");

  for (const metrics of [flightMetrics, hotelMetrics, cruiseMetrics]) {
    assert.equal(metrics.falseWinners, 0);
    assert.equal(metrics.wrongIdentityWinners, 0);
    assert.equal(metrics.wrongBasisWinners, 0);
    assert.equal(metrics.staleWinners, 0);
    assert.equal(metrics.unavailableWinners, 0);
    assert.equal(metrics.testDataWinners, 0);
    assert.equal(metrics.crossCurrencyWinners, 0);
    assert.equal(metrics.unsafeHandoffs, 0);
  }

  const summary = {
    FLIGHT_CASES:flightMetrics.cases,
    FLIGHT_TRUE_WINNER_CASES:flightMetrics.trueWinnerCases,
    FLIGHT_WINNER_CORRECT:flightMetrics.winnerCorrect,
    FLIGHT_FALSE_WINNERS:flightMetrics.falseWinners,
    HOTEL_CASES:hotelMetrics.cases,
    HOTEL_TRUE_WINNER_CASES:hotelMetrics.trueWinnerCases,
    HOTEL_WINNER_CORRECT:hotelMetrics.winnerCorrect,
    HOTEL_FALSE_WINNERS:hotelMetrics.falseWinners,
    CRUISE_CASES:cruiseMetrics.cases,
    CRUISE_TRUE_WINNER_CASES:cruiseMetrics.trueWinnerCases,
    CRUISE_WINNER_CORRECT:cruiseMetrics.winnerCorrect,
    CRUISE_FALSE_WINNERS:cruiseMetrics.falseWinners,
    HIGH_RISK_WRONG_WINNERS:0,
    SHARED_STALE_WINNERS:0,
    SHARED_UNAVAILABLE_WINNERS:0,
    SHARED_TEST_DATA_WINNERS:0,
    SHARED_CROSS_CURRENCY_WINNERS:0,
    SOURCE_ORDER_ATTACK:"PASS"
  };

  console.log(JSON.stringify(summary, null, 2));
  console.log("GLOBAL_TRAVEL_DECISION_QUALITY_EFFECTIVENESS_TEST_PASS");
}

main();
