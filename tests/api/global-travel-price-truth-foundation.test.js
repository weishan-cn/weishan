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
function cruisePolicy(overrides) {
  return Object.assign({
    provider:"fixture_cruise",
    sourceType:"CRUISE_AGGREGATOR",
    priceAuthority:"AUTHORITATIVE",
    allowedHandoffHosts:["cruise.example.invalid"],
    maxAgeSeconds:1800
  }, overrides || {});
}
function cruise(overrides) {
  return Object.assign({
    sourcePolicy:cruisePolicy(),
    cruiseLine:"Weishan Cruise Line",
    ship:"WS Voyager",
    shipId:"ship-100",
    sailingId:"sailing-2026-09-10",
    itineraryId:"itinerary-west-med-7",
    departurePort:"BCN",
    returnPort:"BCN",
    portsOfCall:["MRS", "CIV", "NAP"],
    destinationRegion:"Western Mediterranean",
    departureDate:"2026-09-10",
    returnDate:"2026-09-17",
    durationNights:7,
    durationDays:8,
    market:"US",
    occupancy:{ adults:2, children:0, infants:0, cabins:1 },
    cabinCategory:"BALCONY",
    cabinSubcategory:"Premium Balcony",
    cabinAssignment:"SPECIFIC_CABIN",
    fareBasis:"Standard refundable",
    baseFare:900,
    portTaxes:80,
    governmentFees:40,
    portFees:30,
    mandatoryFees:20,
    gratuities:30,
    totalPrice:1100,
    price:1100,
    currency:"USD",
    priceBasis:"TOTAL_BOOKING",
    costCompleteness:"KNOWN_TOTAL",
    taxFeeBasis:"INCLUDED",
    availability:"SPECIFIC_RATE_AVAILABLE",
    promotion:"NONE",
    observedAt:"2026-08-01T10:00:00.000Z",
    evaluatedAt:"2026-08-01T10:05:00.000Z",
    handoffQuality:"EXACT_SAILING_CABIN_HANDOFF",
    handoffUrl:"https://cruise.example.invalid/sailing/abc/cabin/balcony"
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

  const liveCruise = api.normalizeCruiseOffer(cruise());
  assert.equal(liveCruise.success, true);
  assert.equal(liveCruise.evidence.travelType, "CRUISE");
  assert.equal(liveCruise.evidence.cruiseLine, "Weishan Cruise Line");
  assert.equal(liveCruise.evidence.ship, "WS Voyager");
  assert.equal(liveCruise.evidence.sailingId, "sailing-2026-09-10");
  assert.equal(liveCruise.evidence.departurePort, "BCN");
  assert.equal(liveCruise.evidence.returnPort, "BCN");
  assert.equal(liveCruise.evidence.durationNights, 7);
  assert.equal(liveCruise.evidence.occupancy.guests, 2);
  assert.equal(liveCruise.evidence.cabinCategory, "BALCONY");
  assert.equal(liveCruise.evidence.priceBasis, "TOTAL_BOOKING");
  assert.equal(liveCruise.evidence.costCompleteness, "KNOWN_TOTAL");
  assert.equal(liveCruise.evidence.availability, "SPECIFIC_RATE_AVAILABLE");
  assert.equal(liveCruise.evidence.handoffQuality, "EXACT_SAILING_CABIN_HANDOFF");
  assert.equal(liveCruise.evidence.comparableAsCurrentPrice, true);
  assert.equal(liveCruise.evidence.rendererSecretAccess, false);
  assert.equal(liveCruise.BOOKING, false);
  assert.equal(liveCruise.PAYMENT, false);

  const cheaperCruise = api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"fixture_cruise_two" }), price:1050, totalPrice:1050, handoffUrl:"https://cruise.example.invalid/sailing/abc/cabin/balcony2" }));
  comparison = api.compareCruiseOffers([liveCruise, cheaperCruise]);
  assert.equal(comparison.comparable, true);
  assert.equal(comparison.selectedProvider, "fixture_cruise_two");
  assert.equal(comparison.selectedAmount, 1050);

  const tieCruise = api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"aaa_cruise" }), handoffUrl:"https://cruise.example.invalid/sailing/aaa" }));
  assert.equal(api.compareCruiseOffers([liveCruise, tieCruise]).selectedProvider, api.compareCruiseOffers([tieCruise, liveCruise]).selectedProvider);

  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"wrong_date" }), sailingId:"sailing-2026-09-17", departureDate:"2026-09-17", returnDate:"2026-09-24", price:500, totalPrice:500 }))]), "CRUISE_IDENTITY_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"wrong_port" }), departurePort:"ROM", returnPort:"ROM", price:500, totalPrice:500 }))]), "CRUISE_IDENTITY_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"wrong_duration" }), itineraryId:"itinerary-west-med-14", returnDate:"2026-09-24", durationNights:14, durationDays:15, price:500, totalPrice:500 }))]), "CRUISE_IDENTITY_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"interior" }), cabinCategory:"INTERIOR", cabinSubcategory:"Interior Guarantee", price:500, totalPrice:500 }))]), "CRUISE_CABIN_CONTEXT_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"solo" }), occupancy:{ adults:1, children:0, infants:0, cabins:1 }, price:500, totalPrice:500 }))]), "CRUISE_CABIN_CONTEXT_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"pp_double" }), priceBasis:"PER_PERSON_DOUBLE_OCCUPANCY", price:499, totalPrice:null }))]), "CRUISE_PRICE_BASIS_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"per_cabin" }), priceBasis:"PER_CABIN", price:950, totalPrice:950 }))]), "CRUISE_PRICE_BASIS_MISMATCH");
  assert.equal(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"total_booking" }), priceBasis:"TOTAL_BOOKING", price:950, totalPrice:950, handoffUrl:"https://cruise.example.invalid/sailing/total" }))]).comparable, true);
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"starting_from" }), priceBasis:"STARTING_FROM", price:399, totalPrice:null }))]), "CRUISE_PRICE_BASIS_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"range" }), priceBasis:"PRICE_RANGE", price:399, priceHigh:1499, totalPrice:null }))]), "CRUISE_PRICE_BASIS_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"deposit" }), priceBasis:"DEPOSIT_ONLY", price:250, totalPrice:null }))]), "CRUISE_PRICE_BASIS_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"installment" }), priceBasis:"INSTALLMENT", price:99, totalPrice:null }))]), "CRUISE_PRICE_BASIS_MISMATCH");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"port_tax_excluded" }), costCompleteness:"PARTIAL_TOTAL", taxFeeBasis:"EXCLUDED", portTaxes:null, price:800, totalPrice:null }))]), "CRUISE_TOTAL_COST_INCOMPLETE");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"fees_excluded" }), costCompleteness:"PARTIAL_TOTAL", mandatoryFees:null, price:800, totalPrice:null }))]), "CRUISE_TOTAL_COST_INCOMPLETE");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"gratuity_excluded" }), costCompleteness:"PARTIAL_TOTAL", gratuities:null, price:800, totalPrice:null }))]), "CRUISE_TOTAL_COST_INCOMPLETE");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"member" }), promotion:"MEMBER_RATE", price:500, totalPrice:500 }))]), "CRUISE_PROMOTION_CONDITIONAL");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"resident" }), promotion:"RESIDENT_RATE", price:500, totalPrice:500 }))]), "CRUISE_PROMOTION_CONDITIONAL");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"third_guest" }), promotion:"THIRD_GUEST_DISCOUNT", price:500, totalPrice:500 }))]), "CRUISE_PROMOTION_CONDITIONAL");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"kids_free" }), promotion:"KIDS_FREE", price:500, totalPrice:500 }))]), "CRUISE_PROMOTION_CONDITIONAL");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"stale" }), observedAt:"2026-08-01T00:00:00.000Z", price:500, totalPrice:500 }))]), "STALE_OR_INVALID_FRESHNESS");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"eur" }), currency:"EUR", price:500, totalPrice:500 }))]), "CROSS_CURRENCY_NOT_COMPARABLE");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"sold_out" }), availability:"SOLD_OUT", price:500, totalPrice:500 }))]), "AVAILABILITY_NOT_AUTHORITATIVE");
  assertReason(api.compareCruiseOffers([liveCruise, api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"home" }), handoffQuality:"GENERIC_CRUISE_HOME", handoffUrl:"https://cruise.example.invalid/", price:500, totalPrice:500 }))]), "CRUISE_HANDOFF_NOT_EXACT");
  assert.equal(api.normalizeCruiseOffer(cruise({ handoffUrl:"https://evil.example.invalid/sailing" })).error.code, "CRUISE_PRICE_TRUTH_INVALID");
  assert.equal(api.normalizeCruiseOffer(cruise({ paymentUrl:"https://cruise.example.invalid/pay" })).error.code, "CRUISE_TRANSACTION_FIELDS_REJECTED");
  assert.equal(api.normalizeCruiseOffer(cruise({ sourcePolicy:cruisePolicy({ provider:"eval_cruise", sourceType:"EVALUATION", priceAuthority:"AUTHORIZED_SANDBOX" }) })).evidence.dataClass, "SANDBOX_TEST_DATA");

  assert.equal(api.compareFlightOffers([liveFlight, liveHotel]).success, false);
  assert.equal(api.compareCruiseOffers([liveCruise, liveFlight]).success, false);
  assert.equal(Object.isFrozen(liveFlight.evidence.search), true);
  assert.equal(Object.isFrozen(liveHotel.evidence.occupancy), true);
  assert.equal(Object.isFrozen(liveCruise.evidence.occupancy), true);

  console.log("GLOBAL_TRAVEL_PRICE_TRUTH_FOUNDATION_TEST_PASS");
}

main();
