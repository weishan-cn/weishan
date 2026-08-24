"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILE = "apps/desktop/src/renderer/core/globalTravelPriceTruthFoundation.js";

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map });
  vm.runInContext(fs.readFileSync(path.join(ROOT, FILE), "utf8"), context, { filename:FILE });
  return window.WeishanGlobalTravelPriceTruthFoundation;
}

function flightPolicy(overrides) {
  return Object.assign({
    provider:"fixture_gds",
    sourceType:"GDS",
    priceAuthority:"AUTHORITATIVE",
    allowedHandoffHosts:["flight.example.invalid"],
    maxAgeSeconds:1800
  }, overrides || {});
}
function flight(overrides) {
  return Object.assign({
    sourcePolicy:flightPolicy(),
    search:{ origin:"PVG", destination:"SIN", departureDate:"2026-10-10", returnDate:null, tripType:"ONE_WAY", cabin:"ECONOMY", passengers:{ adults:1, children:0, infants:0 } },
    segments:[{ journey:"OUTBOUND", origin:"PVG", destination:"SIN", departureAt:"2026-10-10T02:00:00.000Z", arrivalAt:"2026-10-10T08:00:00.000Z", airline:"MU", operatingAirline:"MU", flightNumber:"567", cabin:"ECONOMY" }],
    fareFamily:"Standard",
    refundability:"REFUNDABLE",
    changeability:"FEE_APPLIES",
    baggage:"INCLUDED",
    price:1200,
    currency:"CNY",
    priceBasis:"TOTAL_ITINERARY",
    taxFeeBasis:"INCLUDED",
    availability:"AVAILABLE",
    observedAt:"2026-09-01T10:00:00.000Z",
    evaluatedAt:"2026-09-01T10:05:00.000Z",
    handoffQuality:"EXACT_ITINERARY_HANDOFF",
    handoffUrl:"https://flight.example.invalid/itinerary/abc"
  }, overrides || {});
}
function hotelPolicy(overrides) {
  return Object.assign({
    provider:"fixture_hotelbeds",
    sourceType:"HOTEL_AGGREGATOR",
    priceAuthority:"AUTHORITATIVE",
    allowedHandoffHosts:["hotel.example.invalid"],
    maxAgeSeconds:1800
  }, overrides || {});
}
function hotel(overrides) {
  return Object.assign({
    sourcePolicy:hotelPolicy(),
    propertyId:"hotel-100",
    propertyName:"Weishan Test Hotel",
    locationKey:"CN-SHA-PUDONG",
    checkIn:"2026-10-10",
    checkOut:"2026-10-12",
    occupancy:{ adults:2, children:0, rooms:1 },
    roomType:"Deluxe King",
    ratePlan:"Breakfast Flexible",
    meals:"Breakfast",
    refundability:"REFUNDABLE",
    paymentTiming:"PAY_LATER",
    basePrice:900,
    tax:80,
    fees:20,
    totalPrice:1000,
    currency:"CNY",
    priceBasis:"TOTAL_STAY",
    taxFeeBasis:"INCLUDED",
    availability:"AVAILABLE",
    observedAt:"2026-09-01T10:00:00.000Z",
    evaluatedAt:"2026-09-01T10:05:00.000Z",
    handoffQuality:"EXACT_STAY_HANDOFF",
    handoffUrl:"https://hotel.example.invalid/stay/abc"
  }, overrides || {});
}
function assertReason(result, reason) {
  assert.equal(result.success, true);
  assert.equal(result.comparable, false);
  assert.equal(result.reasons.includes(reason), true, `${reason} missing from ${JSON.stringify(result.reasons)}`);
}
function json(value) {
  return JSON.parse(JSON.stringify(value));
}

function main() {
  const api = load();

  assert.deepEqual(json(api.FLIGHT_PRICE_BASIS), ["TOTAL_ITINERARY", "PER_PASSENGER", "FROM_PRICE", "UNKNOWN_BASIS"]);
  assert.deepEqual(json(api.HOTEL_PRICE_BASIS), ["PER_NIGHT", "TOTAL_STAY", "PER_ROOM", "PER_PERSON", "UNKNOWN_BASIS"]);
  assert.equal(api.FLIGHT_HANDOFF_QUALITY.includes("EXACT_ITINERARY_HANDOFF"), true);
  assert.equal(api.HOTEL_HANDOFF_QUALITY.includes("EXACT_STAY_HANDOFF"), true);

  const liveFlight = api.normalizeFlightOffer(flight());
  assert.equal(liveFlight.success, true);
  assert.equal(liveFlight.evidence.travelType, "FLIGHT");
  assert.equal(liveFlight.evidence.search.origin, "PVG");
  assert.equal(liveFlight.evidence.search.destination, "SIN");
  assert.equal(liveFlight.evidence.search.passengers.total, 1);
  assert.equal(liveFlight.evidence.search.cabin, "ECONOMY");
  assert.equal(liveFlight.evidence.segments[0].airline, "MU");
  assert.equal(liveFlight.evidence.segments[0].flightNumber, "567");
  assert.equal(liveFlight.evidence.priceBasis, "TOTAL_ITINERARY");
  assert.equal(liveFlight.evidence.currency, "CNY");
  assert.equal(liveFlight.evidence.taxFeeBasis, "INCLUDED");
  assert.equal(liveFlight.evidence.handoffQuality, "EXACT_ITINERARY_HANDOFF");
  assert.equal(liveFlight.evidence.comparableAsCurrentPrice, true);
  assert.equal(liveFlight.evidence.rendererSecretAccess, false);
  assert.equal(liveFlight.evidence.rawProviderResponsePersisted, false);
  assert.equal(liveFlight.executionGate, "CLOSED");
  assert.equal(liveFlight.BOOKING, false);
  assert.equal(liveFlight.PAYMENT, false);
  assert.equal(liveFlight.TICKET_ISSUANCE, false);

  const cheaperFlight = api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"fixture_ndc" }), price:1100, handoffUrl:"https://flight.example.invalid/itinerary/def" }));
  let comparison = api.compareFlightOffers([liveFlight, cheaperFlight]);
  assert.equal(comparison.comparable, true);
  assert.equal(comparison.selectedProvider, "fixture_ndc");
  assert.equal(comparison.selectedAmount, 1100);
  assert.equal(comparison.selectedHandoffUrl, "https://flight.example.invalid/itinerary/def");

  const samePriceEarlierProvider = api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"aaa_fixture" }), price:1200, handoffUrl:"https://flight.example.invalid/itinerary/aaa" }));
  const deterministicA = api.compareFlightOffers([liveFlight, samePriceEarlierProvider]);
  const deterministicB = api.compareFlightOffers([samePriceEarlierProvider, liveFlight]);
  assert.equal(deterministicA.selectedProvider, deterministicB.selectedProvider);

  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"wrong_date" }), search:{ origin:"PVG", destination:"SIN", departureDate:"2026-10-11", returnDate:null, tripType:"ONE_WAY", cabin:"ECONOMY", passengers:{ adults:1, children:0, infants:0 } }, segments:[{ journey:"OUTBOUND", origin:"PVG", destination:"SIN", departureAt:"2026-10-11T02:00:00.000Z", arrivalAt:"2026-10-11T08:00:00.000Z", airline:"MU", operatingAirline:"MU", flightNumber:"567", cabin:"ECONOMY" }], price:500 }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"wrong_pax" }), search:{ origin:"PVG", destination:"SIN", departureDate:"2026-10-10", returnDate:null, tripType:"ONE_WAY", cabin:"ECONOMY", passengers:{ adults:2, children:0, infants:0 } }, price:500 }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"wrong_cabin" }), search:{ origin:"PVG", destination:"SIN", departureDate:"2026-10-10", returnDate:null, tripType:"ONE_WAY", cabin:"BUSINESS", passengers:{ adults:1, children:0, infants:0 } }, segments:[{ journey:"OUTBOUND", origin:"PVG", destination:"SIN", departureAt:"2026-10-10T02:00:00.000Z", arrivalAt:"2026-10-10T08:00:00.000Z", airline:"MU", operatingAirline:"MU", flightNumber:"567", cabin:"BUSINESS" }], price:500 }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"round_trip" }), search:{ origin:"PVG", destination:"SIN", departureDate:"2026-10-10", returnDate:"2026-10-15", tripType:"ROUND_TRIP", cabin:"ECONOMY", passengers:{ adults:1, children:0, infants:0 } }, segments:[{ journey:"OUTBOUND", origin:"PVG", destination:"SIN", departureAt:"2026-10-10T02:00:00.000Z", arrivalAt:"2026-10-10T08:00:00.000Z", airline:"MU", operatingAirline:"MU", flightNumber:"567", cabin:"ECONOMY" }, { journey:"INBOUND", origin:"SIN", destination:"PVG", departureAt:"2026-10-15T02:00:00.000Z", arrivalAt:"2026-10-15T08:00:00.000Z", airline:"MU", operatingAirline:"MU", flightNumber:"568", cabin:"ECONOMY" }], price:500 }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"connecting" }), segments:[{ journey:"OUTBOUND", origin:"PVG", destination:"HKG", departureAt:"2026-10-10T02:00:00.000Z", arrivalAt:"2026-10-10T05:00:00.000Z", airline:"MU", operatingAirline:"MU", flightNumber:"111", cabin:"ECONOMY" }, { journey:"OUTBOUND", origin:"HKG", destination:"SIN", departureAt:"2026-10-10T07:00:00.000Z", arrivalAt:"2026-10-10T11:00:00.000Z", airline:"MU", operatingAirline:"MU", flightNumber:"222", cabin:"ECONOMY" }], price:500 }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"stale" }), observedAt:"2026-09-01T00:00:00.000Z", price:500 }))]), "STALE_OR_INVALID_FRESHNESS");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"from_price" }), priceBasis:"FROM_PRICE", price:500 }))]), "FLIGHT_PRICE_BASIS_MISMATCH");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"conditional" }), priceBasis:"PER_PASSENGER", refundability:"NON_REFUNDABLE", price:500 }))]), "FLIGHT_PRICE_BASIS_MISMATCH");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"eur" }), currency:"EUR", price:500 }))]), "CROSS_CURRENCY_NOT_COMPARABLE");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"generic" }), handoffQuality:"ROUTE_SEARCH_HANDOFF", handoffUrl:"https://flight.example.invalid/search", price:500 }))]), "FLIGHT_HANDOFF_NOT_EXACT");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"unknown_avail" }), availability:"UNKNOWN", price:500 }))]), "AVAILABILITY_NOT_AUTHORITATIVE");
  assertReason(api.compareFlightOffers([liveFlight, api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"sandbox", priceAuthority:"AUTHORIZED_SANDBOX" }), price:500 }))]), "SOURCE_AUTHORITY_NOT_LIVE");
  assert.equal(api.normalizeFlightOffer(flight({ handoffUrl:"https://evil.example.invalid/itinerary" })).error.code, "FLIGHT_PRICE_TRUTH_INVALID");
  assert.equal(api.normalizeFlightOffer(flight({ bookingUrl:"https://flight.example.invalid/book" })).error.code, "FLIGHT_TRANSACTION_FIELDS_REJECTED");
  assert.equal(api.normalizeFlightOffer(flight({ sourcePolicy:flightPolicy({ provider:"sandbox", priceAuthority:"AUTHORIZED_SANDBOX" }) })).evidence.dataClass, "SANDBOX_TEST_DATA");

  const liveHotel = api.normalizeHotelOffer(hotel());
  assert.equal(liveHotel.success, true);
  assert.equal(liveHotel.evidence.travelType, "HOTEL");
  assert.equal(liveHotel.evidence.propertyId, "hotel-100");
  assert.equal(liveHotel.evidence.propertyName, "Weishan Test Hotel");
  assert.equal(liveHotel.evidence.checkIn, "2026-10-10");
  assert.equal(liveHotel.evidence.nights, 2);
  assert.equal(liveHotel.evidence.occupancy.adults, 2);
  assert.equal(liveHotel.evidence.roomType, "Deluxe King");
  assert.equal(liveHotel.evidence.ratePlan, "Breakfast Flexible");
  assert.equal(liveHotel.evidence.priceBasis, "TOTAL_STAY");
  assert.equal(liveHotel.evidence.taxFeeBasis, "INCLUDED");
  assert.equal(liveHotel.evidence.handoffQuality, "EXACT_STAY_HANDOFF");
  assert.equal(liveHotel.evidence.comparableAsCurrentPrice, true);
  assert.equal(liveHotel.BOOKING, false);
  assert.equal(liveHotel.ORDER, false);

  const cheaperHotel = api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"fixture_ota" }), totalPrice:950, handoffUrl:"https://hotel.example.invalid/stay/def" }));
  comparison = api.compareHotelOffers([liveHotel, cheaperHotel]);
  assert.equal(comparison.comparable, true);
  assert.equal(comparison.selectedProvider, "fixture_ota");
  assert.equal(comparison.selectedAmount, 950);

  const samePriceHotel = api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"aaa_hotel" }), handoffUrl:"https://hotel.example.invalid/stay/aaa" }));
  assert.equal(api.compareHotelOffers([liveHotel, samePriceHotel]).selectedProvider, api.compareHotelOffers([samePriceHotel, liveHotel]).selectedProvider);

  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"wrong_property" }), propertyId:"hotel-999", totalPrice:500 }))]), "HOTEL_IDENTITY_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"same_name_wrong_city" }), propertyId:"hotel-100", locationKey:"CN-BJS", totalPrice:500 }))]), "HOTEL_IDENTITY_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"wrong_date" }), checkIn:"2026-10-11", checkOut:"2026-10-13", totalPrice:500 }))]), "HOTEL_IDENTITY_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"wrong_occupancy" }), occupancy:{ adults:1, children:0, rooms:1 }, totalPrice:500 }))]), "HOTEL_IDENTITY_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"wrong_room" }), roomType:"Standard Twin", totalPrice:500 }))]), "HOTEL_IDENTITY_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"non_refundable" }), refundability:"NON_REFUNDABLE", totalPrice:500 }))]), "HOTEL_REFUNDABILITY_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"member" }), priceBasis:"PER_PERSON", totalPrice:500 }))]), "HOTEL_PRICE_BASIS_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"per_night" }), priceBasis:"PER_NIGHT", totalPrice:500 }))]), "HOTEL_PRICE_BASIS_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"tax_excluded" }), taxFeeBasis:"EXCLUDED", totalPrice:500 }))]), "TAX_FEE_BASIS_MISMATCH");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"stale" }), observedAt:"2026-09-01T00:00:00.000Z", totalPrice:500 }))]), "STALE_OR_INVALID_FRESHNESS");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"eur" }), currency:"EUR", totalPrice:500 }))]), "CROSS_CURRENCY_NOT_COMPARABLE");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"unknown_avail" }), availability:"UNKNOWN", totalPrice:500 }))]), "AVAILABILITY_NOT_AUTHORITATIVE");
  assertReason(api.compareHotelOffers([liveHotel, api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"generic" }), handoffQuality:"OTA_SEARCH_HANDOFF", handoffUrl:"https://hotel.example.invalid/search", totalPrice:500 }))]), "HOTEL_HANDOFF_NOT_EXACT");
  assert.equal(api.normalizeHotelOffer(hotel({ handoffUrl:"https://evil.example.invalid/stay" })).error.code, "HOTEL_PRICE_TRUTH_INVALID");
  assert.equal(api.normalizeHotelOffer(hotel({ checkoutUrl:"https://hotel.example.invalid/checkout" })).error.code, "HOTEL_TRANSACTION_FIELDS_REJECTED");
  assert.equal(api.normalizeHotelOffer(hotel({ sourcePolicy:hotelPolicy({ provider:"hotelbeds_eval", sourceType:"EVALUATION", priceAuthority:"AUTHORIZED_SANDBOX" }) })).evidence.dataClass, "SANDBOX_TEST_DATA");

  assert.equal(api.compareFlightOffers([liveFlight, liveHotel]).success, false);
  assert.equal(Object.isFrozen(liveFlight.evidence.search), true);
  assert.equal(Object.isFrozen(liveHotel.evidence.occupancy), true);

  console.log("GLOBAL_TRAVEL_PRICE_TRUTH_FOUNDATION_TEST_PASS");
}

main();
