"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalTravelPriceTruthFoundation.js",
  "apps/desktop/src/renderer/core/duffelTestFlightSourceAdapter.js"
];

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, RegExp });
  FILES.forEach(function (file) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  });
  return window.WeishanDuffelTestFlightSourceAdapter;
}

function carrier(overrides) {
  return Object.assign({ id:"arl_duffel_airways", name:"Duffel Airways", iata_code:"ZZ" }, overrides || {});
}
function segment(overrides) {
  return Object.assign({
    id:"seg_1",
    origin:{ iata_code:"LHR" },
    destination:{ iata_code:"JFK" },
    departing_at:"2026-10-10T09:00:00Z",
    arriving_at:"2026-10-10T12:00:00Z",
    marketing_carrier:carrier(),
    operating_carrier:carrier(),
    marketing_carrier_flight_number:"100"
  }, overrides || {});
}
function request(overrides) {
  return Object.assign({
    id:"orq_test_1",
    live_mode:false,
    created_at:"2026-09-01T10:00:00Z",
    cabin_class:"economy",
    slices:[{ origin:"LHR", destination:"JFK", departure_date:"2026-10-10" }],
    passengers:[{ id:"pas_1", type:"adult" }]
  }, overrides || {});
}
function offer(overrides) {
  return Object.assign({
    id:"off_test_1",
    live_mode:false,
    owner:carrier(),
    total_amount:"123.45",
    total_currency:"GBP",
    base_amount:"100.00",
    tax_amount:"23.45",
    expires_at:"2026-09-01T10:10:00Z",
    slices:[{ id:"sli_1", segments:[segment()] }],
    fare_brand_name:"Standard",
    conditions:{
      refund_before_departure:{ allowed:true },
      change_before_departure:{ allowed:true }
    },
    baggage:"INCLUDED"
  }, overrides || {});
}
function normalize(api, rawRequest, rawOffer, options) {
  return api.normalizeDuffelOffer(rawRequest || request(), rawOffer || offer(), Object.assign({
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

  const plan = api.buildReadOnlyValidationPlan();
  assert.equal(plan.executionGate, "CLOSED");
  assert.equal(plan.accountAccess.TEST_MODE_AVAILABLE, true);
  assert.equal(plan.accountAccess.TEST_TOKENS_AVAILABLE, true);
  assert.equal(plan.accountAccess.TEST_MODE_DATA, "TEST_ENVIRONMENT_DATA");
  assert.equal(plan.accountAccess.PRICE_REALISM, "NON_REALISTIC_TEST_DATA");
  assert.equal(plan.accountAccess.SCHEDULE_REALISM, "NON_REALISTIC_TEST_DATA");
  assert.equal(plan.accountAccess.ACCOUNT_CREATED, false);
  assert.equal(plan.accountAccess.BLOCKERS.includes("DUFFEL_SERVICES_AGREEMENT_REQUIRES_LEGAL_REVIEW_BEFORE_ACCOUNT_CREATION"), true);
  assert.equal(plan.forbiddenRequests.includes("POST /air/orders"), true);
  assert.equal(plan.forbiddenRequests.includes("POST /payments"), true);
  assert.equal(plan.forbiddenRequests.includes("live mode requests"), true);

  const payload = api.buildOfferRequestPayload({ origin:"LHR", destination:"JFK", departureDate:"2026-10-10", cabinClass:"economy", adults:1 });
  assert.equal(payload.success, true);
  assert.equal(payload.method, "POST");
  assert.equal(payload.endpoint, "https://api.duffel.com/air/offer_requests");
  assert.equal(payload.payload.data.slices[0].origin, "LHR");
  assert.equal(payload.payload.data.passengers.length, 1);
  assert.equal(payload.headers.Authorization, "SERVICE_MANAGED_BEARER_TOKEN_REDACTED");
  assert.equal(payload.tokenIncluded, false);
  assert.equal(payload.liveModeAllowed, false);
  assert.equal(payload.orderEndpointAllowed, false);
  assert.equal(payload.paymentEndpointAllowed, false);

  assert.equal(api.classifyTokenPrefix("duffel_test_").accepted, true);
  assert.equal(api.classifyTokenPrefix("duffel_live_").accepted, false);
  assert.equal(api.classifyTokenPrefix("duffel_live_").rejection, "LIVE_TOKEN_REJECTED");
  assert.equal(api.credentialPolicy({ provider:"duffel", environment:"test", application:"Weishan", credentialType:"access_token" }).accepted, true);
  assert.equal(api.credentialPolicy({ provider:"duffel", environment:"live", application:"Weishan", credentialType:"access_token" }).accepted, false);

  const normalized = normalize(api);
  assert.equal(normalized.status, "NORMALIZED");
  assert.equal(normalized.source, "Duffel Test Mode");
  assert.equal(normalized.offerRequestId, "orq_test_1");
  assert.equal(normalized.offerId, "off_test_1");
  assert.equal(normalized.liveMode, false);
  assert.equal(normalized.owner.name, "Duffel Airways");
  assert.equal(normalized.owner.iataCode, "ZZ");
  assert.equal(normalized.sourceEnvironment, "TEST");
  assert.equal(normalized.priceRealism, "NON_REALISTIC_TEST_DATA");
  assert.equal(normalized.scheduleRealism, "NON_REALISTIC_TEST_DATA");
  assert.equal(normalized.publicHandoff, "NO_PUBLIC_HANDOFF");
  assert.equal(normalized.normalized.success, true);
  assert.equal(normalized.normalized.evidence.provider, "duffel_test");
  assert.equal(normalized.normalized.evidence.sourceType, "SANDBOX");
  assert.equal(normalized.normalized.evidence.priceAuthority, "AUTHORIZED_SANDBOX");
  assert.equal(normalized.normalized.evidence.search.origin, "LHR");
  assert.equal(normalized.normalized.evidence.search.destination, "JFK");
  assert.equal(normalized.normalized.evidence.search.departureDate, "2026-10-10");
  assert.equal(normalized.normalized.evidence.search.passengers.total, 1);
  assert.equal(normalized.normalized.evidence.segments[0].flightNumber, "100");
  assert.equal(normalized.normalized.evidence.price, 123.45);
  assert.equal(normalized.normalized.evidence.currency, "GBP");
  assert.equal(normalized.normalized.evidence.taxFeeBasis, "PARTIAL");
  assert.equal(normalized.normalized.evidence.availability, "AVAILABLE");
  assert.equal(normalized.normalized.evidence.handoffQuality, "NO_HANDOFF");
  assert.equal(normalized.normalized.evidence.handoffUrl, null);
  assert.equal(normalized.normalized.evidence.dataClass, "SANDBOX_TEST_DATA");
  assert.equal(normalized.normalized.evidence.comparableAsCurrentPrice, false);
  assert.equal(normalized.rawProviderResponsePersisted, false);
  assert.equal(normalized.rendererSecretAccess, false);
  assert.equal(normalized.apiRequests, 0);
  assert.equal(normalized.BOOKING, false);
  assert.equal(normalized.ORDER, false);
  assert.equal(normalized.PAYMENT, false);

  const response = api.normalizeOfferRequestResponse(Object.assign(request(), { offers:[offer(), offer({ id:"off_test_2", total_amount:"150.00" })] }), { observedAt:"2026-09-01T10:00:00.000Z", evaluatedAt:"2026-09-01T10:05:00.000Z" });
  assert.equal(response.status, "NORMALIZED");
  assert.equal(response.offerCount, 2);
  assert.equal(response.liveMode, false);
  assert.equal(response.testEnvironmentClassification, "TEST_ENVIRONMENT_DATA");
  assert.equal(response.realCurrentFare, false);
  assert.equal(response.publicBetaLiveFare, false);
  assert.equal(response.publicHandoff, "NO_PUBLIC_HANDOFF");

  const changedPrice = normalize(api, request(), offer({ id:"off_price_changed", total_amount:"130.50" }));
  const comparison = api.compareNormalizedOffers([normalized, changedPrice]);
  assert.equal(comparison.status, "COMPARED");
  assert.equal(comparison.comparison.comparable, false);
  assert.equal(comparison.comparison.reasons.includes("SOURCE_AUTHORITY_NOT_LIVE"), true);
  assert.equal(comparison.comparison.reasons.includes("FLIGHT_HANDOFF_NOT_EXACT"), true);
  assert.equal(comparison.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);

  assertReason(api.compareNormalizedOffers([normalized, normalize(api, request({ slices:[{ origin:"LHR", destination:"JFK", departure_date:"2026-10-11" }] }), offer({ id:"wrong_date" }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([normalized, normalize(api, request({ passengers:[{ type:"adult" }, { type:"adult" }] }), offer({ id:"wrong_pax" }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([normalized, normalize(api, request({ cabin_class:"business" }), offer({ id:"wrong_cabin", slices:[{ segments:[segment({})] }] }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([normalized, normalize(api, request({ slices:[{ origin:"LHR", destination:"JFK", departure_date:"2026-10-10" }, { origin:"JFK", destination:"LHR", departure_date:"2026-10-20" }] }), offer({ id:"round_trip", slices:[{ segments:[segment()] }, { segments:[segment({ origin:{ iata_code:"JFK" }, destination:{ iata_code:"LHR" }, departing_at:"2026-10-20T09:00:00Z", arriving_at:"2026-10-20T21:00:00Z", marketing_carrier_flight_number:"101" })] }] }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([normalized, normalize(api, request(), offer({ id:"connecting", slices:[{ segments:[
    segment({ destination:{ iata_code:"DUB" }, arriving_at:"2026-10-10T10:00:00Z", marketing_carrier_flight_number:"200" }),
    segment({ origin:{ iata_code:"DUB" }, destination:{ iata_code:"JFK" }, departing_at:"2026-10-10T11:00:00Z", arriving_at:"2026-10-10T15:00:00Z", marketing_carrier_flight_number:"201" })
  ] }] }))]), "FLIGHT_IDENTITY_MISMATCH");
  assertReason(api.compareNormalizedOffers([normalized, normalize(api, request(), offer({ id:"expired", expires_at:"2026-09-01T10:04:00Z" }))]), "AVAILABILITY_NOT_AUTHORITATIVE");
  assert.equal(normalize(api, request(), offer({ id:"invalid_price", total_amount:"not-a-number" })).normalized.error.code, "FLIGHT_PRICE_TRUTH_INVALID");
  assert.equal(api.compareNormalizedOffers([normalized, normalize(api, request(), offer({ id:"invalid_price", total_amount:"not-a-number" }))]).comparison.error.code, "FLIGHT_COMPARISON_INPUT_INVALID");
  assertReason(api.compareNormalizedOffers([normalized, normalize(api, request(), offer({ id:"usd", total_currency:"USD" }))]), "CROSS_CURRENCY_NOT_COMPARABLE");

  assert.equal(api.normalizeOfferRequestResponse(Object.assign(request(), { live_mode:true, offers:[] })).error.code, "LIVE_MODE_REJECTED");
  assert.equal(normalize(api, request(), offer({ live_mode:true })).error.code, "LIVE_MODE_REJECTED");
  assert.equal(normalize(api, request(), offer({ order_id:"ord_forbidden" })).error.code, "FLIGHT_TRANSACTION_FIELDS_REJECTED");
  assert.equal(normalize(api, request(), offer({ payment:{ type:"card" } })).error.code, "FLIGHT_TRANSACTION_FIELDS_REJECTED");

  const scorecard = api.buildRealFlightSourceScorecard();
  assert.equal(scorecard.BEST_REMAINING_REAL_FLIGHT_SOURCE, "Skyscanner Travel API / Flights Live Prices");
  assert.equal(scorecard.REAL_FARE_ACCESS_STATE, "PARTNER_APPROVAL_REQUIRED");
  assert.equal(scorecard.FLIGHT_REAL_PRICE_COVERAGE, "LIVE_SOURCE_BLOCKED");
  assert.equal(scorecard.scorecard.find(function (source) { return source.SOURCE === "Travelport TripServices Flights"; }).CURRENT_BLOCKER, "TRAVELPORT_PROVISIONING_REQUIRED");
  assert.equal(scorecard.scorecard.find(function (source) { return source.SOURCE === "XiamenAir Open Platform / NDC"; }).CURRENT_BLOCKER, "XIAMENAIR_DEVELOPER_CERTIFICATION_IP_ALLOWLIST_AND_SERVICE_PERMISSION_REQUIRED");

  const serialized = JSON.stringify({ plan, payload, normalized, response, comparison, scorecard });
  assert.equal(serialized.includes("duffel_test_SYNTHETIC"), false);
  assert.equal(serialized.includes("Bearer duffel_"), false);
  assert.equal(serialized.includes("client_secret"), false);
  assert.equal(serialized.includes("paymentUrl"), false);
  assert.equal(serialized.includes("checkoutUrl"), false);
  assert.equal(serialized.includes("orderUrl"), false);
  assert.equal(serialized.includes("card_id"), false);
  console.log("DUFFEL_TEST_FLIGHT_SOURCE_ADAPTER_TEST_PASS");
}

main();
