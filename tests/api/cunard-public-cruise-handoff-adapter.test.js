"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/travelExactHandoffSemantics.js",
  "apps/desktop/src/renderer/core/cunardPublicCruiseHandoffAdapter.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window.WeishanCunardPublicCruiseHandoffAdapter;
}

function base(overrides) {
  return Object.assign({
    voyageCode:"M617",
    ship:"Queen Mary 2",
    departureDate:"2026-07-28",
    departurePort:"NYC",
    cabinCategory:"Interior",
    locale:"en-us"
  }, overrides || {});
}

function main() {
  const adapter = load();
  const summary = adapter.buildSecondPassCandidateSummary();
  assert.equal(summary.bestLowFrictionCruiseSource, "Cunard public voyage detail URL");
  assert.equal(summary.cruiseBiggestGap, "NO_LOW_FRICTION_REAL_PRICE_SOURCE");
  assert.equal(summary.executionGate, "CLOSED");

  const url = adapter.buildCunardVoyageUrl(base({ categoryCode:"I_I", cruiseCode:"M617", rateCode:"NL1", typeCode:"I" }));
  assert.equal(url, "https://www.cunard.com/en-us/find-a-cruise/M617/M617?categoryCode=I_I&cruiseCode=M617&rateCode=NL1&typeCode=I");

  const exactSailing = adapter.buildPublicCruiseHandoffCandidate(base());
  assert.equal(exactSailing.success, true);
  assert.equal(exactSailing.sourceRole, "HANDOFF_ONLY");
  assert.equal(exactSailing.priceState, "PRICE_UNAVAILABLE");
  assert.equal(exactSailing.priceVerified, false);
  assert.equal(exactSailing.userFacingRealPrice, false);
  assert.equal(exactSailing.handoff.handoffQuality, "EXACT_SAILING_HANDOFF");
  assert.equal(exactSailing.handoff.strength, "PARTIAL");
  assert.equal(exactSailing.apiCallCount, 0);
  assert.equal(exactSailing.scraping, false);
  assert.equal(exactSailing.BOOKING, false);

  const exactCabin = adapter.buildPublicCruiseHandoffCandidate(base({
    categoryCode:"BI_I",
    cruiseCode:"M611P",
    rateCode:"RDE",
    typeCode:"BI",
    voyageCode:"M611P",
    departureDate:"2026-05-01",
    occupancyPreserved:true,
    leadInPrice:999,
    currency:"USD",
    priceBasis:"PER_PERSON_DOUBLE_OCCUPANCY"
  }));
  assert.equal(exactCabin.handoff.handoffQuality, "EXACT_SAILING_CABIN_HANDOFF");
  assert.equal(exactCabin.handoff.strength, "STRONG");
  assert.equal(exactCabin.priceState, "PRICE_INDICATIVE");
  assert.equal(exactCabin.priceBasis, "PER_PERSON_DOUBLE_OCCUPANCY");
  assert.equal(exactCabin.publicBetaState, "BETA_READY_INDICATIVE_ONLY");
  assert.notEqual(exactCabin.priceBasis, "TOTAL_BOOKING");

  const wrongDate = adapter.buildPublicCruiseHandoffCandidate(base({ departureDateMismatch:true, categoryCode:"I_I", typeCode:"I", occupancyPreserved:true }));
  assert.equal(wrongDate.handoff.handoffQuality, "ITINERARY_SEARCH_HANDOFF");
  assert.equal(wrongDate.handoff.strength, "WEAK");

  const wrongShip = adapter.buildPublicCruiseHandoffCandidate(base({ shipMismatch:true }));
  assert.equal(wrongShip.handoff.handoffQuality, "ITINERARY_SEARCH_HANDOFF");

  const wrongCabin = adapter.buildPublicCruiseHandoffCandidate(base({ categoryCode:"B_B", typeCode:"B", cabinCategory:"Balcony", cabinMismatch:true, occupancyPreserved:true }));
  assert.equal(wrongCabin.handoff.handoffQuality, "EXACT_SAILING_HANDOFF");
  assert.equal(wrongCabin.handoff.strength, "PARTIAL");

  const searchPage = adapter.buildPublicCruiseHandoffCandidate(base({ handoffUrl:"https://www.cunard.com/en-us/find-a-cruise/M617/M617?utm_source=test" }));
  assert.equal(searchPage.handoff.handoffQuality, "EXACT_SAILING_HANDOFF");
  assert.equal(searchPage.trackingOnly, true);

  const generic = adapter.buildPublicCruiseHandoffCandidate(base({ handoffUrl:"https://www.cunard.com/en-us/" }));
  assert.equal(generic.handoff.handoffQuality, "NO_HANDOFF");
  assert.equal(generic.handoff.strength, "NONE");

  const unsafe = adapter.buildPublicCruiseHandoffCandidate(base({ handoffUrl:"https://www.cunard.com/en-us/checkout/M617" }));
  assert.equal(unsafe.handoff.handoffQuality, "NO_HANDOFF");
  assert.equal(unsafe.handoff.downgradeReason, "TRANSACTION_PATH_BLOCKED");
  assert.equal(unsafe.PAYMENT, false);

  const sessionBound = adapter.buildPublicCruiseHandoffCandidate(base({ sessionId:"abc" }));
  assert.equal(sessionBound.handoff.ephemeral, true);

  const badHost = adapter.buildPublicCruiseHandoffCandidate(base({ handoffUrl:"https://example.com/en-us/find-a-cruise/M617/M617" }));
  assert.equal(badHost.success, false);
  assert.equal(badHost.error.code, "CUNARD_HANDOFF_HOST_INVALID");

  const serialized = JSON.stringify({ summary, exactSailing, exactCabin, unsafe, sessionBound });
  assert.equal(serialized.includes("Bearer "), false);
  assert.equal(serialized.includes("Authorization"), false);
  assert.equal(serialized.includes("client_secret"), false);
  assert.equal(serialized.includes("api_key"), false);

  console.log("CUNARD_PUBLIC_CRUISE_HANDOFF_ADAPTER_TEST_PASS");
}

main();
