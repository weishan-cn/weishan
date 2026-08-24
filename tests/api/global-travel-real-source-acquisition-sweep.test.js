"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalTravelPriceTruthFoundation.js",
  "apps/desktop/src/renderer/core/globalTravelRealSourceAcquisitionSweep.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window.WeishanGlobalTravelRealSourceAcquisitionSweep;
}

function hotelbedsFixture(overrides) {
  return Object.assign({
    request:{
      stay:{ checkIn:"2026-10-10", checkOut:"2026-10-12" },
      occupancies:[{ rooms:1, adults:2, children:0 }]
    },
    hotel:{
      code:3424,
      name:"As Americas",
      destinationCode:"CEN",
      rooms:[{
        code:"DBL.ST",
        name:"Double Standard",
        rates:[{
          rateKey:"20261010|20261012|W|59|3424|DBL.ST|ID_B2B_26|BB||1~2~0||N",
          boardCode:"BB",
          boardName:"BED AND BREAKFAST",
          paymentType:"AT_WEB",
          net:"230.52",
          currency:"EUR",
          rateType:"BOOKABLE",
          cancellationPolicies:[{ amount:"230.52", from:"2026-10-09T00:00:00+02:00" }]
        }]
      }]
    },
    observedAt:"2026-08-24T10:00:00.000Z",
    evaluatedAt:"2026-08-24T10:05:00.000Z"
  }, overrides || {});
}

function amadeusFixture(overrides) {
  return Object.assign({
    type:"flight-offer",
    id:"1",
    testEnvironment:true,
    source:"GDS",
    instantTicketingRequired:false,
    numberOfBookableSeats:4,
    cabin:"ECONOMY",
    adults:1,
    price:{ currency:"EUR", grandTotal:"161.90" },
    itineraries:[{
      duration:"PT2H",
      segments:[{
        departure:{ iataCode:"MAD", at:"2026-10-10T08:00:00.000Z" },
        arrival:{ iataCode:"ORY", at:"2026-10-10T10:00:00.000Z" },
        carrierCode:"IB",
        number:"3406",
        aircraft:{ code:"320" },
        duration:"PT2H"
      }]
    }],
    fareFamily:"PUBLISHED",
    refundability:"UNKNOWN",
    baggage:"UNKNOWN",
    observedAt:"2026-08-24T10:00:00.000Z",
    evaluatedAt:"2026-08-24T10:05:00.000Z"
  }, overrides || {});
}

function traveltekFixture(overrides) {
  return Object.assign({
    id:"20261010CQ07",
    duration:7,
    embarkDate:"2026-10-10",
    disembarkDate:"2026-10-17",
    embarkPort:"BCN",
    disembarkPort:"BCN",
    generalDestination:"Western Mediterranean",
    market:"US",
    ship:{ id:"ship-001", name:"Cruise Voyager", cruiseLine:"Example Cruises" },
    product:{ id:"prod-001", name:"Western Med" },
    itineraryItems:[{ portCode:"MRS" }, { portCode:"CIV" }, { portCode:"NAP" }],
    leadInPrices:[{
      fare:987,
      taxesFeesAndPortExpenses:123,
      rateCode:"ABC123",
      cabinDescription:"Balcony guarantee",
      cabinType:"BALCONY",
      cabinGrade:"B1",
      available:true,
      currency:"USD"
    }],
    observedAt:"2026-08-24T10:00:00.000Z",
    evaluatedAt:"2026-08-24T10:05:00.000Z"
  }, overrides || {});
}

function main() {
  const sweep = load();
  const matrix = sweep.buildSourceMatrix();
  assert.equal(matrix.status, "READY");
  assert.equal(matrix.executionGate, "CLOSED");
  assert.equal(matrix.productionTraffic, false);
  assert.ok(matrix.sources.find(function (source) { return source.SOURCE === "Hotelbeds" && source.DOMAIN === "HOTELS"; }));
  assert.ok(matrix.sources.find(function (source) { return source.SOURCE === "Amadeus Self-Service" && source.RECOMMENDATION.includes("LOW_FRICTION"); }));
  assert.ok(matrix.sources.find(function (source) { return source.SOURCE === "Traveltek Cruise Connect" && source.DOMAIN === "CRUISES"; }));

  const hotel = sweep.normalizeHotelbedsEvaluationRate(hotelbedsFixture());
  assert.equal(hotel.status, "NORMALIZED");
  assert.equal(hotel.liveApiCall, false);
  assert.equal(hotel.secretAccess, false);
  assert.equal(hotel.normalized.evidence.travelType, "HOTEL");
  assert.equal(hotel.normalized.evidence.provider, "hotelbeds_evaluation");
  assert.equal(hotel.normalized.evidence.dataClass, "SANDBOX_TEST_DATA");
  assert.equal(hotel.normalized.evidence.propertyId, "3424");
  assert.equal(hotel.normalized.evidence.totalPrice, 230.52);
  assert.equal(hotel.normalized.evidence.currency, "EUR");
  assert.equal(hotel.normalized.evidence.comparableAsCurrentPrice, false);

  const flight = sweep.normalizeAmadeusFlightOffer(amadeusFixture());
  assert.equal(flight.status, "NORMALIZED");
  assert.equal(flight.liveApiCall, false);
  assert.equal(flight.secretAccess, false);
  assert.equal(flight.normalized.evidence.travelType, "FLIGHT");
  assert.equal(flight.normalized.evidence.provider, "amadeus_self_service_test");
  assert.equal(flight.normalized.evidence.dataClass, "SANDBOX_TEST_DATA");
  assert.equal(flight.normalized.evidence.search.origin, "MAD");
  assert.equal(flight.normalized.evidence.search.destination, "ORY");
  assert.equal(flight.normalized.evidence.price, 161.9);
  assert.equal(flight.normalized.evidence.currency, "EUR");
  assert.equal(flight.normalized.evidence.comparableAsCurrentPrice, false);

  const cruise = sweep.normalizeTraveltekCruiseSearchResult(traveltekFixture());
  assert.equal(cruise.status, "NORMALIZED");
  assert.equal(cruise.liveApiCall, false);
  assert.equal(cruise.secretAccess, false);
  assert.equal(cruise.normalized.evidence.travelType, "CRUISE");
  assert.equal(cruise.normalized.evidence.provider, "traveltek_cruise_connect");
  assert.equal(cruise.normalized.evidence.dataClass, "SANDBOX_TEST_DATA");
  assert.equal(cruise.normalized.evidence.priceBasis, "STARTING_FROM");
  assert.equal(cruise.normalized.evidence.costCompleteness, "PARTIAL_TOTAL");
  assert.equal(cruise.normalized.evidence.comparableAsCurrentPrice, false);

  const serialized = JSON.stringify({ matrix, hotel, flight, cruise });
  assert.equal(serialized.includes("WEISHAN_TEST_SECRET"), false);
  assert.equal(serialized.includes("Bearer "), false);
  assert.equal(serialized.includes("Authorization:"), false);
  assert.equal(serialized.includes("sk_live_"), false);
  assert.equal(serialized.includes("duffel_test_"), false);
  assert.equal(hotel.BOOKING, false);
  assert.equal(flight.TICKING, undefined);
  assert.equal(flight.TICKETING, false);
  assert.equal(cruise.PAYMENT, false);

  console.log("GLOBAL_TRAVEL_REAL_SOURCE_ACQUISITION_SWEEP_TEST_PASS");
}

main();
