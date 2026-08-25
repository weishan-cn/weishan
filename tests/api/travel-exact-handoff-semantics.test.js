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
  vm.runInContext(fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/travelExactHandoffSemantics.js"), "utf8"), context);
  return window.WeishanTravelExactHandoffSemantics;
}

function main() {
  const api = load();
  const matrix = api.buildExactHandoffMatrix();
  assert.equal(matrix.executionGate, "CLOSED");
  assert.equal(matrix.noAutoBooking, true);

  const exactFlight = api.classifyTravelHandoff({
    travelType:"FLIGHT",
    requestedQuality:"EXACT_ITINERARY_HANDOFF",
    handoffUrl:"https://airline.example/search?from=PVG&to=CDG&date=2026-10-10&adults=1&cabin=Y",
    allowedHosts:["airline.example"],
    context:{ offerPreserved:true, originPreserved:true, destinationPreserved:true, departureDatePreserved:true, passengersPreserved:true, cabinPreserved:true }
  });
  assert.equal(exactFlight.strength, "STRONG");
  assert.equal(exactFlight.handoffQuality, "EXACT_ITINERARY_HANDOFF");
  assert.equal(exactFlight.autoOpen, false);

  const lostCabin = api.classifyTravelHandoff({
    travelType:"FLIGHT",
    requestedQuality:"EXACT_ITINERARY_HANDOFF",
    handoffUrl:"https://airline.example/search?from=PVG&to=CDG&date=2026-10-10",
    allowedHosts:["airline.example"],
    context:{ offerPreserved:true, originPreserved:true, destinationPreserved:true, departureDatePreserved:true, passengersPreserved:true, cabinPreserved:false }
  });
  assert.equal(lostCabin.handoffQuality, "ROUTE_SEARCH");
  assert.equal(lostCabin.strength, "WEAK");
  assert.equal(lostCabin.downgraded, true);

  const exactHotel = api.classifyTravelHandoff({
    travelType:"HOTEL",
    requestedQuality:"EXACT_RATE_HANDOFF",
    handoffUrl:"https://hotel.example/property/123?checkin=2026-10-10&checkout=2026-10-12&adults=2",
    allowedHosts:["hotel.example"],
    context:{ propertyPreserved:true, checkInPreserved:true, checkOutPreserved:true, occupancyPreserved:true, roomPreserved:true, ratePreserved:true }
  });
  assert.equal(exactHotel.strength, "STRONG");
  assert.equal(exactHotel.handoffQuality, "EXACT_RATE_HANDOFF");

  const hotelPropertyOnly = api.classifyTravelHandoff({
    travelType:"HOTEL",
    requestedQuality:"EXACT_STAY_HANDOFF",
    handoffUrl:"https://hotel.example/property/123",
    allowedHosts:["hotel.example"],
    context:{ propertyPreserved:true, checkInPreserved:false, checkOutPreserved:false, occupancyPreserved:false }
  });
  assert.equal(hotelPropertyOnly.handoffQuality, "EXACT_PROPERTY_HANDOFF");
  assert.equal(hotelPropertyOnly.strength, "PARTIAL");

  const exactCruise = api.classifyTravelHandoff({
    travelType:"CRUISE",
    requestedQuality:"EXACT_SAILING_CABIN_HANDOFF",
    handoffUrl:"https://cruise.example/sailing/abc?cabin=balcony&adults=2",
    allowedHosts:["cruise.example"],
    context:{ sailingPreserved:true, shipPreserved:true, departureDatePreserved:true, occupancyPreserved:true, cabinCategoryPreserved:true }
  });
  assert.equal(exactCruise.strength, "STRONG");
  assert.equal(exactCruise.handoffQuality, "EXACT_SAILING_CABIN_HANDOFF");

  const cruiseWrongCabin = api.classifyTravelHandoff({
    travelType:"CRUISE",
    requestedQuality:"EXACT_SAILING_CABIN_HANDOFF",
    handoffUrl:"https://cruise.example/sailing/abc",
    allowedHosts:["cruise.example"],
    context:{ sailingPreserved:true, shipPreserved:true, departureDatePreserved:true, occupancyPreserved:false, cabinCategoryPreserved:false }
  });
  assert.equal(cruiseWrongCabin.handoffQuality, "EXACT_SAILING_HANDOFF");
  assert.equal(cruiseWrongCabin.strength, "PARTIAL");

  const generic = api.classifyTravelHandoff({
    travelType:"CRUISE",
    requestedQuality:"GENERIC_HOME",
    handoffUrl:"https://cruise.example/",
    allowedHosts:["cruise.example"],
    context:{}
  });
  assert.equal(generic.strength, "NONE");
  assert.equal(generic.url, null);

  const unsafe = api.classifyTravelHandoff({
    travelType:"HOTEL",
    requestedQuality:"EXACT_RATE_HANDOFF",
    handoffUrl:"https://hotel.example/checkout/rate-1",
    allowedHosts:["hotel.example"],
    context:{ propertyPreserved:true, checkInPreserved:true, checkOutPreserved:true, occupancyPreserved:true, roomPreserved:true, ratePreserved:true }
  });
  assert.equal(unsafe.handoffQuality, "NO_HANDOFF");
  assert.equal(unsafe.downgradeReason, "TRANSACTION_PATH_BLOCKED");
  assert.equal(unsafe.PAYMENT, false);

  const serialized = JSON.stringify({ exactFlight, exactHotel, exactCruise, unsafe });
  assert.equal(serialized.includes("Authorization"), false);
  assert.equal(serialized.includes("Bearer "), false);
  assert.equal(serialized.includes("client_secret"), false);

  console.log("TRAVEL_EXACT_HANDOFF_SEMANTICS_TEST_PASS");
}

main();
