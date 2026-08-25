"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalTravelPriceTruthFoundation.js",
  "apps/desktop/src/renderer/core/travelExactHandoffSemantics.js",
  "apps/desktop/src/renderer/core/traveltekCruiseConnectAdapter.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window.WeishanTraveltekCruiseConnectAdapter;
}

function fixture(overrides) {
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
    observedAt:"2026-08-25T10:00:00.000Z",
    evaluatedAt:"2026-08-25T10:05:00.000Z"
  }, overrides || {});
}

function main() {
  const adapter = load();
  const scorecard = adapter.buildCruiseSourceScorecard();
  assert.equal(scorecard.selectedSource, "Traveltek Cruise Connect");
  assert.equal(scorecard.cruiseRealPriceCoverage, "SCHEMA_READY_COMMERCIAL_BLOCKED");
  assert.equal(scorecard.sourceScorecard.CURRENT_2026_ACCESS, "COMMERCIAL_CREDENTIALS_REQUIRED");
  assert.equal(scorecard.sourceScorecard.REAL_PRICE, "YES_FOR_AUTHORIZED_USERS");
  assert.equal(scorecard.sourceScorecard.CABIN_PRICE.includes("LEAD_IN_BY_CABIN_TYPE"), true);

  const normalized = adapter.normalizeCruiseSearchResult(fixture());
  assert.equal(normalized.status, "NORMALIZED");
  assert.equal(normalized.executionGate, "CLOSED");
  assert.equal(normalized.liveApiCall, false);
  assert.equal(normalized.apiCredentialAccess, false);
  assert.equal(normalized.rawProviderResponsePersisted, false);
  assert.equal(normalized.dataClass, "SANDBOX_TEST_DATA");
  assert.equal(normalized.realSourceClassification, "COMMERCIAL_BLOCKED");
  assert.equal(normalized.leadInPriceOnly, true);
  assert.equal(normalized.exactCabinPrice, false);
  assert.equal(normalized.exactOccupancyPrice, false);

  const evidence = normalized.normalized.evidence;
  assert.equal(evidence.travelType, "CRUISE");
  assert.equal(evidence.provider, "traveltek_cruise_connect");
  assert.equal(evidence.cruiseLine, "Example Cruises");
  assert.equal(evidence.ship, "Cruise Voyager");
  assert.equal(evidence.sailingId, "20261010CQ07");
  assert.equal(evidence.departureDate, "2026-10-10");
  assert.equal(evidence.returnDate, "2026-10-17");
  assert.equal(evidence.durationNights, 7);
  assert.equal(evidence.cabinCategory, "BALCONY");
  assert.equal(evidence.cabinSubcategory, "Balcony guarantee");
  assert.equal(evidence.occupancy.adults, 2);
  assert.equal(evidence.priceBasis, "STARTING_FROM");
  assert.equal(evidence.price, 1110);
  assert.equal(evidence.baseFare, 987);
  assert.equal(evidence.portTaxes, 123);
  assert.equal(evidence.costCompleteness, "PARTIAL_TOTAL");
  assert.equal(evidence.taxFeeBasis, "PARTIAL");
  assert.equal(evidence.comparableAsCurrentPrice, false);
  assert.equal(normalized.handoff.handoffQuality, "EXACT_SAILING_HANDOFF");
  assert.equal(normalized.handoff.strength, "PARTIAL");

  const outside = adapter.normalizeCruiseSearchResult(fixture({ leadInPrices:[{
    fare:499,
    taxesFeesAndPortExpenses:101,
    rateCode:"OUT1",
    cabinDescription:"Oceanview lead-in",
    cabinType:"OUTSIDE",
    cabinGrade:"O1",
    available:true,
    currency:"USD"
  }] }));
  assert.equal(outside.normalized.evidence.cabinCategory, "OCEANVIEW");
  assert.equal(outside.normalized.evidence.priceBasis, "STARTING_FROM");
  assert.equal(outside.normalized.evidence.price, 600);
  assert.equal(outside.normalized.evidence.occupancy.guests, 2);
  assert.notEqual(outside.normalized.evidence.priceBasis, "TOTAL_BOOKING");

  const wrongDuration = adapter.normalizeCruiseSearchResult(fixture({ disembarkDate:"2026-10-18" }));
  assert.equal(wrongDuration.status, "FAILED");
  assert.equal(wrongDuration.normalized.error.code, "CRUISE_PRICE_TRUTH_INVALID");

  const noTaxes = adapter.normalizeCruiseSearchResult(fixture({ leadInPrices:[{
    fare:777,
    rateCode:"NO-TAX",
    cabinDescription:"Inside lead-in",
    cabinType:"INSIDE",
    cabinGrade:"I1",
    available:true,
    currency:"USD"
  }] }));
  assert.equal(noTaxes.normalized.evidence.cabinCategory, "INTERIOR");
  assert.equal(noTaxes.normalized.evidence.costCompleteness, "BASE_ONLY");
  assert.equal(noTaxes.normalized.evidence.taxFeeBasis, "UNKNOWN");
  assert.equal(noTaxes.normalized.evidence.comparableAsCurrentPrice, false);

  const serialized = JSON.stringify({ scorecard, normalized, outside, noTaxes });
  assert.equal(serialized.includes("Bearer "), false);
  assert.equal(serialized.includes("authorization_token"), false);
  assert.equal(serialized.includes("password"), false);
  assert.equal(serialized.includes("client_secret"), false);
  assert.equal(serialized.includes("checkout"), false);
  assert.equal(normalized.BOOKING, false);
  assert.equal(normalized.PAYMENT, false);

  console.log("TRAVELTEK_CRUISE_CONNECT_ADAPTER_TEST_PASS");
}

main();
