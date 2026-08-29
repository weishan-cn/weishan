"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/flightIntentNormalizer.js",
  "apps/desktop/src/renderer/core/readOnlyPriceTruthLayer.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, Promise, AbortController });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window.WeishanReadOnlyPriceTruthLayer;
}

function real(overrides) {
  return Object.assign({
    domain:"FLIGHT",
    sourceId:"authorized_fare_source",
    sourceName:"Authorized Fare Source",
    sourceType:"PROVIDER_PRODUCTION_READ_ONLY",
    retrievedAt:"2026-08-29T10:00:00.000Z",
    evaluatedAt:"2026-08-29T10:02:00.000Z",
    currency:"CNY",
    baseFare:700,
    taxes:100,
    fees:20,
    totalPrice:820,
    priceCompleteness:"TOTAL_CONFIRMED",
    availabilityStatus:"AVAILABLE",
    originName:"成都",
    destinationName:"上海",
    originAirports:["CTU", "TFU"],
    destinationAirports:["SHA", "PVG"],
    departureDate:"2026-09-01",
    departureTime:"08:00",
    arrivalTime:"10:40",
    flightNumber:"WS101",
    carrier:"Example Air",
    cabin:"ECONOMY",
    baggage:"UNKNOWN",
    refundability:"UNKNOWN",
    manualHandoff:"https://fares.example/search?route=ctu-sha",
    evidenceTruthClass:"REAL_PROVIDER_PRICE"
  }, overrides || {});
}

async function main() {
  const api = load();
  assert.ok(api);
  assert.equal(api.boundary().executionGate, "CLOSED");
  assert.equal(api.boundary().bookingAuthority, false);
  assert.equal(api.boundary().paymentAuthority, false);

  const intent = api.buildFlightSearchIntent("帮我看看9月1日成都到上海最便宜的机票");
  assert.equal(intent.success, true);
  assert.equal(intent.search.departureDate, "2026-09-01");
  assert.deepEqual(Array.from(intent.search.originAirports), ["CTU", "TFU"]);
  assert.deepEqual(Array.from(intent.search.destinationAirports), ["PVG", "SHA"]);
  assert.equal(intent.search.passengers.adults, 1);
  assert.match(intent.search.passengerAssumption, /1 位成人/);
  assert.equal(intent.search.sortPreference, "LOWEST_VERIFIED_TOTAL");

  const total = api.normalizePriceEvidence(real());
  assert.equal(total.success, true);
  assert.equal(total.evidence.totalPrice, 820);
  assert.equal(total.evidence.comparableAsVerifiedTotal, true);
  assert.equal(total.evidence.displayAsLiveCurrentPrice, true);
  assert.equal(total.evidence.evidenceFreshness, "CURRENT");

  const partial = api.normalizePriceEvidence(real({ totalPrice:780, taxes:null, fees:null, priceCompleteness:"PARTIAL_PRICE" }));
  assert.equal(partial.success, true);
  assert.equal(partial.evidence.comparableAsVerifiedTotal, false);
  assert.equal(partial.evidence.taxes, null);
  assert.equal(partial.evidence.fees, null);

  const missingTaxBreakdown = api.normalizePriceEvidence(real({ taxes:null, fees:null, totalPrice:820, priceCompleteness:"TOTAL_CONFIRMED" }));
  assert.equal(missingTaxBreakdown.success, true);
  assert.equal(missingTaxBreakdown.evidence.comparableAsVerifiedTotal, true);
  assert.equal(missingTaxBreakdown.evidence.taxes, null);

  const stale = api.normalizePriceEvidence(real({ retrievedAt:"2026-08-29T08:00:00.000Z" }), { evaluatedAt:"2026-08-29T10:02:00.000Z", maxAgeSeconds:900 });
  assert.equal(stale.success, true);
  assert.equal(stale.evidence.evidenceFreshness, "STALE");
  assert.equal(stale.evidence.displayAsLiveCurrentPrice, false);
  assert.equal(stale.evidence.comparableAsVerifiedTotal, false);

  const sandbox = api.normalizePriceEvidence(real({ sourceId:"sandbox", sourceName:"Sandbox", sourceType:"PROVIDER_TEST_API", evidenceTruthClass:"SANDBOX_TEST_DATA" }));
  assert.equal(sandbox.success, true);
  assert.equal(sandbox.evidence.displayAsLiveCurrentPrice, false);
  assert.equal(sandbox.evidence.comparableAsVerifiedTotal, false);
  const fakeLiveSandbox = api.normalizePriceEvidence(real({ sourceType:"PROVIDER_TEST_API" }));
  assert.equal(fakeLiveSandbox.success, false);
  assert.equal(fakeLiveSandbox.code, "REAL_PRICE_SOURCE_CLASS_INVALID");

  const fixture = api.normalizePriceEvidence(real({ sourceId:"fixture", sourceName:"Fixture", sourceType:"FIXTURE", evidenceTruthClass:"FIXTURE_TEST_DATA" }));
  const fixtureUi = api.buildPriceUserState({ records:[fixture], manualHandoffAvailable:true });
  assert.equal(fixtureUi.verifiedCount, 0);
  assert.equal(fixtureUi.cards.length, 0);
  assert.equal(fixtureUi.testEvidenceSuppressedFromLiveUi, true);
  assert.match(fixtureUi.message, /暂未获取到可验证的实时/);
  assert.equal(/¥\s*820/.test(JSON.stringify(fixtureUi)), false);

  const usd = api.normalizePriceEvidence(real({ sourceId:"usd", sourceName:"USD Source", currency:"USD", totalPrice:120 }));
  const crossCurrency = api.comparePriceEvidence([total, usd]);
  assert.equal(crossCurrency.comparable, false);
  assert.equal(crossCurrency.reason, "CROSS_CURRENCY_CONVERSION_UNAVAILABLE");
  assert.equal(crossCurrency.winner, null);

  const duplicate = api.normalizePriceEvidence(real());
  const deduplicated = api.comparePriceEvidence([total, duplicate]);
  assert.equal(deduplicated.observations.length, 1);
  assert.equal(deduplicated.winner.totalPrice, 820);

  const conflicting = api.normalizePriceEvidence(real({ sourceId:"second_source", sourceName:"Second Source", totalPrice:850 }));
  const conflictResult = api.comparePriceEvidence([total, conflicting]);
  assert.equal(conflictResult.comparable, true);
  assert.equal(conflictResult.winner.totalPrice, 820);
  assert.equal(conflictResult.conflicts.length, 1);
  assert.equal(conflictResult.conflicts[0].observations.length, 2);

  const noResults = api.buildPriceUserState({ records:[], manualHandoffAvailable:true });
  assert.equal(noResults.status, "NO_VERIFIED_RESULTS");
  assert.equal(noResults.verifiedCount, 0);
  assert.equal(noResults.manualHandoffAvailable, true);
  assert.equal(noResults.aiRequired, false);
  const unavailable = api.buildPriceUserState({ status:"SOURCE_UNAVAILABLE", records:[] });
  assert.equal(unavailable.status, "SOURCE_UNAVAILABLE");
  assert.match(unavailable.message, /来源暂时不可用/);

  const userState = api.buildPriceUserState({ records:[total], manualHandoffAvailable:true, aiAvailable:false });
  assert.equal(userState.status, "VERIFIED_RESULTS");
  assert.equal(userState.verifiedCount, 1);
  assert.equal(userState.cards[0].price, 820);
  assert.equal(userState.cards[0].source, "Authorized Fare Source");
  assert.equal(userState.cards[0].retrievedAt, "2026-08-29T10:00:00.000Z");
  assert.equal(userState.aiRequired, false);

  let resolveFirst;
  const coordinator = api.createSearchCoordinator(function (query) {
    if (query === "first") return new Promise(function (resolve) { resolveFirst = resolve; });
    return Promise.resolve("newer-result");
  });
  const first = coordinator.search("first");
  const second = coordinator.search("second");
  assert.equal((await second).value, "newer-result");
  resolveFirst("stale-result");
  const staleResponse = await first;
  assert.equal(staleResponse.stale, true);
  assert.equal(staleResponse.code, "STALE_PRICE_RESPONSE_IGNORED");

  const sourceFailureCoordinator = api.createSearchCoordinator(function () { throw new Error("provider unavailable"); });
  const sourceFailure = await sourceFailureCoordinator.search("query");
  assert.equal(sourceFailure.success, false);
  assert.equal(sourceFailure.code, "PRICE_SOURCE_UNAVAILABLE");

  const inventory = api.buildFlightDataSourceInventory();
  assert.equal(inventory.length, 9);
  assert.equal(inventory.filter(function (source) { return source.currentlySafeToUse && source.livePriceCapable; }).length, 0);
  assert.equal(inventory.find(function (source) { return source.name === "Skyscanner Live Prices"; }).currentStatus, "PENDING_EXTERNAL_APPROVAL");
  assert.equal(inventory.find(function (source) { return source.name === "Amadeus Self-Service"; }).currentStatus, "DECOMMISSIONED");

  const serialized = JSON.stringify({ total, partial, stale, sandbox, fixtureUi, inventory });
  assert.equal(/authorization|private_key|api_key/i.test(serialized), false);
  assert.equal(serialized.includes("bookingAuthority\":true"), false);
  assert.equal(serialized.includes("paymentAuthority\":true"), false);
  console.log("READ_ONLY_PRICE_TRUTH_LAYER_TEST_PASS");
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
