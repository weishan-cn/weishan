"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILES = [
  "apps/desktop/src/renderer/core/globalCommerceFeedSecurity.js",
  "apps/desktop/src/renderer/core/flightShoppingProviderPolicy.js",
  "apps/desktop/src/renderer/core/flightShoppingItineraryIdentity.js",
  "apps/desktop/src/renderer/core/flightShoppingEvidence.js"
];

function load() {
  const window = {}; window.window = window;
  const context = vm.createContext({ window, URL, console, Date, Set, Map, JSON, Object, Array, String, Number, Boolean, RegExp });
  FILES.forEach(function (file) { vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); });
  return window;
}
function json(value) { return JSON.parse(JSON.stringify(value)); }
function provider(overrides) {
  return Object.assign({
    provider:"synthetic_gds", environment:"fixture", sourceClass:"SYNTHETIC_FIXTURE", contentSourceClass:"MIXED",
    realFareCapability:"LIVE", availabilityAuthority:"AUTHORITATIVE", currencyAuthority:"PROVIDER_SUPPLIED",
    handoffCapability:"ALLOWED", comparisonPermission:"ALLOWED", displayPermission:"ALLOWED", cachePermission:"LIMITED",
    metasearchPermission:"ALLOWED", credentialRequirement:"NONE", credentialStoreReference:null, costPolicy:"FREE_AUTHORIZED",
    bookingCapabilityPresentButDisabled:true, authorizationClass:"SYNTHETIC_FIXTURE_ONLY",
    transportPolicy:{ allowedHosts:["handoff.synthetic-flight.invalid"], maxResponseBytes:262144, maxRetries:1, automaticRetry:false },
    rateLimit:{ maxRequests:10, windowSeconds:60, scheduledPolling:false }
  }, overrides || {});
}
function search(overrides) {
  return Object.assign({ origin:"PVG", destination:"SIN", departureDate:"2026-10-10", returnDate:null,
    tripType:"ONE_WAY", cabin:"ECONOMY", passengers:{ adults:1, children:0, infants:0 } }, overrides || {});
}
function segment(overrides) {
  return Object.assign({ segmentSequence:1, journey:"OUTBOUND", origin:"PVG", destination:"SIN",
    departureAt:"2026-10-10T02:00:00.000Z", arrivalAt:"2026-10-10T08:00:00.000Z", travelDate:"2026-10-10",
    marketingCarrier:"SA", operatingCarrier:"SA", flightNumber:"100", cabin:"ECONOMY", bookingClass:"Y" }, overrides || {});
}
function itinerary(overrides) {
  return Object.assign({ itineraryId:"itinerary-1", search:search(), segments:[segment()] }, overrides || {});
}
function offer(overrides) {
  return Object.assign({
    fareOfferId:"fare-1", totalAmount:1200, currency:"CNY", totalSemantics:"ONE_WAY_ALL_PASSENGERS", providerSuppliedTotal:true,
    baseFare:950, taxes:200, mandatoryFees:50, taxCompleteness:"COMPLETE", feeCompleteness:"COMPLETE",
    priceClass:"REAL_LIVE_FARE", fareSourceType:"ATPCO", brandedFare:"STANDARD", refundability:"ALLOWED", changeability:"CONDITIONAL",
    baggage:"INCLUDED", seat:"UNKNOWN", availability:"AUTHORITATIVE_AVAILABILITY",
    observedAt:"2026-09-01T10:00:00.000Z", retrievedAt:"2026-09-01T10:00:02.000Z", providerUpdatedAt:"UNKNOWN",
    offerExpiresAt:"2026-09-01T10:30:00.000Z", providerValidUntil:"UNKNOWN", lastTicketingDate:"UNKNOWN",
    metasearchPriceState:"NOT_APPLICABLE", market:{ country:"CN", pointOfSale:"CN", residency:"UNKNOWN", locale:"zh-CN" },
    handoffType:"PARTNER_HANDOFF", handoffUrl:"https://handoff.synthetic-flight.invalid/fare/1",
    contentSource:"Synthetic Mixed Content", airlineOrOta:"Synthetic Airline", commercialMetadata:{ commission:0.02, epc:0.5 }
  }, overrides || {});
}
function evidence(api, overrides) {
  const value = overrides || {};
  return api.createFlightShoppingEvidence({ providerPolicy:value.providerPolicy || provider(), itinerary:value.itinerary || itinerary(),
    offer:value.offer || offer(), evaluatedAt:value.evaluatedAt || "2026-09-01T10:05:00.000Z" });
}

function main() {
  const window = load();
  const policyApi = window.WeishanFlightShoppingProviderPolicy;
  const identityApi = window.WeishanFlightShoppingItineraryIdentity;
  const fareApi = window.WeishanFlightShoppingEvidence;

  const policy = policyApi.createFlightProviderPolicy(provider());
  assert.equal(policy.success, true);
  assert.equal(policy.policy.provider, "synthetic_gds");
  assert.equal(policy.policy.sourceClass, "SYNTHETIC_FIXTURE");
  assert.equal(policy.policy.contentSourceClass, "MIXED");
  assert.equal(policy.policy.realFareCapability, "LIVE");
  assert.equal(policy.policy.bookingCapabilityPresentButDisabled, true);
  assert.equal(policy.policy.networkTransportImplemented, false);
  assert.equal(policy.policy.rendererSecretAccess, false);
  assert.equal(policy.policy.rawResponsePersistence, false);
  assert.equal(policy.policy.transportPolicy.arbitraryBaseUrlAllowed, false);
  assert.equal(policy.policy.transportPolicy.redirectFollowing, false);
  assert.equal(policy.policy.rateLimit.scheduledPolling, false);
  assert.equal(policy.policy.executionGate, "CLOSED");
  assert.equal(policy.policy.BOOKING, false);
  assert.equal(Object.isFrozen(policy.policy), true);
  assert.equal(Object.isFrozen(policy.policy.transportPolicy), true);
  assert.equal(policyApi.createFlightProviderPolicy(provider({ bookingCapabilityPresentButDisabled:false })).error.code, "BOOKING_CAPABILITY_MUST_BE_DISABLED");
  assert.equal(policyApi.createFlightProviderPolicy(provider({ transportPolicy:{ allowedHosts:["127.0.0.1"], maxResponseBytes:10000, maxRetries:0, automaticRetry:false } })).error.code, "TRANSPORT_POLICY_INVALID");
  assert.equal(policyApi.createFlightProviderPolicy(provider({ transportPolicy:{ allowedHosts:["handoff.synthetic-flight.invalid"], maxResponseBytes:10000, maxRetries:3, automaticRetry:false } })).error.code, "TRANSPORT_POLICY_INVALID");
  assert.equal(policyApi.createFlightProviderPolicy(provider({ rateLimit:{ maxRequests:1, windowSeconds:1, scheduledPolling:true } })).error.code, "RATE_LIMIT_POLICY_INVALID");
  assert.equal(policyApi.createFlightProviderPolicy(provider({ provider:"unsafe\u0000provider" })).error.code, "PROVIDER_POLICY_INCOMPLETE");
  assert.equal(policyApi.createFlightProviderPolicy(provider({ credentialRequirement:"SERVICE_MANAGED", credentialStoreReference:null })).error.code, "CREDENTIAL_STORE_REFERENCE_REQUIRED");
  const credentialPolicy = policyApi.createFlightProviderPolicy(provider({ credentialRequirement:"SERVICE_MANAGED", credentialStoreReference:"flight/fixture/app/client_secret" }));
  assert.equal(credentialPolicy.success, true);
  assert.equal(credentialPolicy.policy.credentialStoreReference, "flight/fixture/app/client_secret");

  const validSearch = identityApi.validateFlightSearchInput(search());
  assert.equal(validSearch.success, true);
  assert.equal(validSearch.search.origin, "PVG");
  assert.equal(validSearch.search.destination, "SIN");
  assert.equal(validSearch.search.passengers.total, 1);
  assert.equal(validSearch.search.maxTripDays, 366);
  assert.equal(identityApi.validateFlightSearchInput(search({ origin:"Shanghai" })).error.code, "SEARCH_INPUT_INVALID");
  assert.equal(identityApi.validateFlightSearchInput(search({ destination:"PVG" })).error.code, "SEARCH_INPUT_INVALID");
  assert.equal(identityApi.validateFlightSearchInput(search({ departureDate:"2026-02-30" })).error.code, "SEARCH_INPUT_INVALID");
  assert.equal(identityApi.validateFlightSearchInput(search({ tripType:"ROUND_TRIP", returnDate:null })).error.code, "RETURN_DATE_CONTRACT_INVALID");
  assert.equal(identityApi.validateFlightSearchInput(search({ tripType:"ROUND_TRIP", returnDate:"2028-01-01" })).error.code, "TRIP_LENGTH_INVALID");
  assert.equal(identityApi.validateFlightSearchInput(search({ passengers:{ adults:-1, children:0, infants:0 } })).error.code, "SEARCH_INPUT_INVALID");
  assert.equal(identityApi.validateFlightSearchInput(search({ passengers:{ adults:1, children:0, infants:2 } })).error.code, "PASSENGER_CONTEXT_INVALID");
  assert.equal(identityApi.validateFlightSearchInput(search({ passengers:{ adults:8, children:2, infants:0 } })).error.code, "PASSENGER_CONTEXT_INVALID");
  assert.equal(identityApi.validateFlightSearchInput(search({ passengers:{ adults:NaN, children:0, infants:0 } })).success, false);
  assert.equal(identityApi.validateFlightSearchInput(search({ passengers:{ adults:Infinity, children:0, infants:0 } })).success, false);

  const direct = identityApi.createItineraryIdentity(itinerary());
  assert.equal(direct.success, true);
  assert.equal(direct.itinerary.segmentCount, 1);
  assert.equal(direct.itinerary.stopCount, 0);
  assert.equal(direct.itinerary.codeshare, false);
  assert.equal(direct.itinerary.identitySufficient, true);
  assert.equal(direct.itinerary.segments[0].marketingCarrier, "SA");
  assert.equal(direct.itinerary.segments[0].operatingCarrier, "SA");
  assert.equal(Object.isFrozen(direct.itinerary.segments), true);
  const connectionSegments = [
    segment({ destination:"BKK", arrivalAt:"2026-10-10T06:00:00.000Z", marketingCarrier:"SA", operatingCarrier:"OP" }),
    segment({ segmentSequence:2, origin:"BKK", destination:"SIN", departureAt:"2026-10-10T08:00:00.000Z", arrivalAt:"2026-10-10T10:00:00.000Z", marketingCarrier:"SA", operatingCarrier:"OP", flightNumber:"101" })
  ];
  const connection = identityApi.createItineraryIdentity(itinerary({ segments:connectionSegments }));
  assert.equal(connection.success, true);
  assert.equal(connection.itinerary.segmentCount, 2);
  assert.equal(connection.itinerary.stopCount, 1);
  assert.equal(connection.itinerary.codeshare, true);
  assert.deepEqual(json(connection.itinerary.segments.map(function (item) { return item.segmentSequence; })), [1, 2]);
  assert.equal(identityApi.createItineraryIdentity(itinerary({ segments:connectionSegments.slice().reverse() })).success, false);
  assert.equal(identityApi.createItineraryIdentity(itinerary({ segments:[segment({ departureAt:"2026-02-30T02:00:00.000Z" })] })).success, false);
  assert.equal(identityApi.createItineraryIdentity(itinerary({ segments:[segment({ marketingCarrier:"" })] })).success, false);
  assert.equal(identityApi.createItineraryIdentity(itinerary({ itineraryId:"unsafe\u0000id" })).error.code, "ITINERARY_IDENTIFIER_INVALID");
  const roundTripSegments = [segment(), segment({ segmentSequence:2, journey:"INBOUND", origin:"SIN", destination:"PVG", departureAt:"2026-10-20T02:00:00.000Z", arrivalAt:"2026-10-20T08:00:00.000Z", travelDate:"2026-10-20", flightNumber:"200" })];
  const roundTripInput = itinerary({ search:search({ tripType:"ROUND_TRIP", returnDate:"2026-10-20" }), segments:roundTripSegments });
  const roundTrip = identityApi.createItineraryIdentity(roundTripInput);
  assert.equal(roundTrip.success, true);
  assert.equal(roundTrip.itinerary.tripType, "ROUND_TRIP");
  assert.equal(roundTrip.itinerary.segmentCount, 2);

  const live = evidence(fareApi, {});
  assert.equal(live.success, true);
  assert.equal(live.evidence.priceClass, "REAL_LIVE_FARE");
  assert.equal(live.evidence.totalAmount, 1200);
  assert.equal(live.evidence.currency, "CNY");
  assert.equal(live.evidence.totalSemantics, "ONE_WAY_ALL_PASSENGERS");
  assert.equal(live.evidence.providerSuppliedTotal, true);
  assert.equal(live.evidence.taxCompleteness, "COMPLETE");
  assert.equal(live.evidence.feeCompleteness, "COMPLETE");
  assert.equal(live.evidence.availability, "AUTHORITATIVE_AVAILABILITY");
  assert.equal(live.evidence.providerUpdatedAt, "UNKNOWN");
  assert.equal(live.evidence.handoffType, "PARTNER_HANDOFF");
  assert.equal(live.evidence.handoffUrl, "https://handoff.synthetic-flight.invalid/fare/1");
  assert.equal(live.evidence.provenance.provider, "synthetic_gds");
  assert.equal(live.evidence.provenance.contentSource, "Synthetic Mixed Content");
  assert.equal(live.evidence.provenance.airlineOrOta, "Synthetic Airline");
  assert.equal(live.evidence.comparisonEligible, true);
  assert.equal(live.evidence.rawProviderResponsePersisted, false);
  assert.equal(live.BOOKING, false);
  assert.equal(live.TICKET_ISSUANCE, false);
  assert.equal(Object.isFrozen(live.evidence.provenance), true);

  const ndc = evidence(fareApi, { providerPolicy:provider({ contentSourceClass:"NDC" }), offer:offer({ priceClass:"REAL_FARE_WITH_CONDITIONS", fareSourceType:"NDC", brandedFare:"FLEX", baggage:"INCLUDED", seat:"INCLUDED", refundability:"CONDITIONAL" }) });
  assert.equal(ndc.success, true);
  assert.equal(ndc.evidence.fareSourceType, "NDC");
  assert.equal(ndc.evidence.brandedFare, "FLEX");
  assert.equal(ndc.evidence.materiallyConditional, true);
  assert.equal(ndc.evidence.order, undefined);
  const metasearch = evidence(fareApi, { providerPolicy:provider({ sourceClass:"METASEARCH", contentSourceClass:"METASEARCH_CONTENT" }), offer:offer({ priceClass:"INDICATIVE_FARE", fareSourceType:"METASEARCH", metasearchPriceState:"REPRICE_REQUIRED", handoffType:"METASEARCH_HANDOFF" }) });
  assert.equal(metasearch.success, true);
  assert.equal(metasearch.evidence.metasearchPriceState, "REPRICE_REQUIRED");
  assert.equal(metasearch.evidence.comparisonEligible, false);
  const refreshed = evidence(fareApi, { providerPolicy:provider({ sourceClass:"METASEARCH", contentSourceClass:"METASEARCH_CONTENT" }), offer:offer({ fareSourceType:"METASEARCH", metasearchPriceState:"REFRESHED_PRICE", handoffType:"METASEARCH_HANDOFF" }) });
  assert.equal(refreshed.success, true);
  assert.equal(refreshed.evidence.comparisonEligible, true);
  const prohibitedMetasearch = evidence(fareApi, { providerPolicy:provider({ sourceClass:"METASEARCH", contentSourceClass:"METASEARCH_CONTENT", metasearchPermission:"PROHIBITED" }), offer:offer({ fareSourceType:"METASEARCH", metasearchPriceState:"REFRESHED_PRICE", handoffType:"METASEARCH_HANDOFF" }) });
  assert.equal(prohibitedMetasearch.success, true);
  assert.equal(prohibitedMetasearch.evidence.comparisonEligible, false);
  const ota = evidence(fareApi, { providerPolicy:provider({ provider:"synthetic_ota", sourceClass:"OTA", contentSourceClass:"OTA_CONTENT" }), offer:offer({ fareSourceType:"OTA", airlineOrOta:"Synthetic OTA", handoffType:"OTA_HANDOFF" }) });
  assert.equal(ota.success, true);
  assert.equal(ota.evidence.sourceClass, "OTA");
  assert.equal(ota.evidence.provenance.airlineOrOta, "Synthetic OTA");
  const lcc = evidence(fareApi, { providerPolicy:provider({ contentSourceClass:"LCC" }), offer:offer({ fareSourceType:"LCC", baggage:"NOT_INCLUDED", seat:"NOT_INCLUDED", taxCompleteness:"UNKNOWN", feeCompleteness:"UNKNOWN" }) });
  assert.equal(lcc.success, true);
  assert.equal(lcc.evidence.baggage, "NOT_INCLUDED");
  assert.equal(lcc.evidence.seat, "NOT_INCLUDED");
  assert.equal(lcc.evidence.taxCompleteness, "UNKNOWN");
  const sandbox = evidence(fareApi, { providerPolicy:provider({ realFareCapability:"TEST_ONLY" }), offer:offer({ priceClass:"SANDBOX_TEST_DATA" }) });
  assert.equal(sandbox.success, true);
  assert.equal(sandbox.evidence.priceClass, "SANDBOX_TEST_DATA");
  assert.equal(sandbox.evidence.comparisonEligible, false);
  assert.equal(evidence(fareApi, { providerPolicy:provider({ realFareCapability:"TEST_ONLY" }) }).error.code, "REAL_FARE_CLASS_NOT_AUTHORIZED");
  const roundTripFare = evidence(fareApi, { itinerary:roundTripInput, offer:offer({ totalSemantics:"ROUND_TRIP_ALL_PASSENGERS" }) });
  assert.equal(roundTripFare.success, true);
  assert.equal(roundTripFare.evidence.totalSemantics, "ROUND_TRIP_ALL_PASSENGERS");
  assert.equal(evidence(fareApi, { itinerary:roundTripInput }).error.code, "TOTAL_SEMANTICS_TRIP_MISMATCH");

  const expired = evidence(fareApi, { evaluatedAt:"2026-09-01T11:00:00.000Z" });
  assert.equal(expired.success, true);
  assert.equal(expired.evidence.expired, true);
  assert.equal(expired.evidence.priceClass, "STALE_OR_UNKNOWN");
  assert.equal(expired.evidence.comparisonEligible, false);
  const ticketingExpired = evidence(fareApi, { offer:offer({ offerExpiresAt:"UNKNOWN", lastTicketingDate:"2026-08-31" }) });
  assert.equal(ticketingExpired.evidence.expired, true);
  assert.equal(ticketingExpired.evidence.priceClass, "STALE_OR_UNKNOWN");
  const unknownAvailability = evidence(fareApi, { providerPolicy:provider({ availabilityAuthority:"NONE" }) });
  assert.equal(unknownAvailability.evidence.availability, "AVAILABILITY_UNKNOWN");
  const limitedAvailability = evidence(fareApi, { providerPolicy:provider({ availabilityAuthority:"LIMITED_SIGNAL" }), offer:offer({ availability:"AUTHORITATIVE_AVAILABILITY" }) });
  assert.equal(limitedAvailability.evidence.availability, "LIMITED_AVAILABILITY_SIGNAL");
  assert.equal(evidence(fareApi, { offer:offer({ totalAmount:-1 }) }).error.code, "FARE_AMOUNT_CONTRACT_INVALID");
  assert.equal(evidence(fareApi, { offer:offer({ totalAmount:NaN }) }).error.code, "FARE_INPUT_REJECTED");
  assert.equal(evidence(fareApi, { offer:offer({ totalAmount:Infinity }) }).error.code, "FARE_INPUT_REJECTED");
  assert.equal(evidence(fareApi, { offer:offer({ totalAmount:"1200" }) }).error.code, "FARE_AMOUNT_CONTRACT_INVALID");
  assert.equal(evidence(fareApi, { offer:offer({ currency:"CN" }) }).error.code, "FARE_AMOUNT_CONTRACT_INVALID");
  assert.equal(evidence(fareApi, { offer:offer({ providerUpdatedAt:"not-a-time" }) }).error.code, "FARE_TIMESTAMP_INVALID");
  assert.equal(evidence(fareApi, { offer:offer({ providerUpdatedAt:"2026-02-30T10:00:00.000Z" }) }).error.code, "FARE_TIMESTAMP_INVALID");
  assert.equal(evidence(fareApi, { offer:offer({ lastTicketingDate:"2026-02-30" }) }).error.code, "FARE_TIMESTAMP_INVALID");
  assert.equal(evidence(fareApi, { offer:offer({ fareOfferId:"unsafe\u0000offer" }) }).error.code, "PROVENANCE_INCOMPLETE");
  assert.equal(evidence(fareApi, { offer:offer({ handoffUrl:"http://handoff.synthetic-flight.invalid/x" }) }).error.code, "HANDOFF_URL_REJECTED");
  assert.equal(evidence(fareApi, { offer:offer({ handoffUrl:"https://127.0.0.1/x" }) }).error.code, "HANDOFF_URL_REJECTED");
  assert.equal(evidence(fareApi, { offer:offer({ handoffUrl:"javascript:alert(1)" }) }).error.code, "HANDOFF_URL_REJECTED");
  assert.equal(evidence(fareApi, { offer:offer({ handoffType:"NO_VERIFIED_HANDOFF", handoffUrl:null }) }).success, true);
  assert.equal(evidence(fareApi, { offer:offer({ handoffType:"NO_VERIFIED_HANDOFF" }) }).error.code, "UNVERIFIED_HANDOFF_URL_REJECTED");
  assert.equal(evidence(fareApi, { offer:offer({ bookingUrl:"https://handoff.synthetic-flight.invalid/book" }) }).error.code, "TRANSACTION_FIELDS_REJECTED");
  assert.equal(evidence(fareApi, { offer:offer({ paymentObject:{ amount:1200 } }) }).error.code, "TRANSACTION_FIELDS_REJECTED");
  const getter = offer(); Object.defineProperty(getter, "totalAmount", { get:function () { throw new Error("must not execute"); } });
  assert.equal(evidence(fareApi, { offer:getter }).error.code, "FARE_INPUT_REJECTED");
  const polluted = Object.create({ polluted:true }); Object.assign(polluted, offer());
  assert.equal(evidence(fareApi, { offer:polluted }).error.code, "FARE_INPUT_REJECTED");

  const commissionChanged = evidence(fareApi, { offer:offer({ commercialMetadata:{ commission:0.99, epc:999 } }) });
  assert.notDeepEqual(json(live.commercialMetadata), json(commissionChanged.commercialMetadata));
  assert.deepEqual(json(live.evidence), json(commissionChanged.evidence));
  assert.equal(commissionChanged.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);
  const paid = evidence(fareApi, { providerPolicy:provider({ costPolicy:"LAYER_3_DEFERRED" }) });
  assert.equal(paid.success, true);
  assert.equal(paid.evidence.providerEligibility, "LAYER_3_DEFERRED");
  assert.equal(paid.evidence.comparisonEligible, false);

  const cheaper = evidence(fareApi, { providerPolicy:provider({ provider:"synthetic_gds_two" }), offer:offer({ fareOfferId:"fare-2", totalAmount:1100 }) });
  let comparison = fareApi.compareFlightShoppingEvidence([live, cheaper]);
  assert.equal(comparison.success, true);
  assert.equal(comparison.comparable, true);
  assert.equal(comparison.cheapestEvidenceId, cheaper.evidence.evidenceId);
  assert.equal(comparison.cheapestAmount, 1100);
  const crossCurrency = evidence(fareApi, { providerPolicy:provider({ provider:"synthetic_gds_eur" }), offer:offer({ fareOfferId:"fare-eur", totalAmount:160, currency:"EUR" }) });
  comparison = fareApi.compareFlightShoppingEvidence([live, crossCurrency]);
  assert.equal(comparison.comparable, false);
  assert.equal(comparison.reasons.includes("CURRENCY_NORMALIZATION_REQUIRED"), true);
  const differentItinerary = evidence(fareApi, { providerPolicy:provider({ provider:"synthetic_other" }), itinerary:itinerary({ itineraryId:"other", segments:[segment({ flightNumber:"999" })] }), offer:offer({ fareOfferId:"other" }) });
  comparison = fareApi.compareFlightShoppingEvidence([live, differentItinerary]);
  assert.equal(comparison.reasons.includes("ITINERARY_IDENTITY_MISMATCH"), true);
  const groupItinerary = itinerary({ search:search({ passengers:{ adults:2, children:0, infants:0 } }) });
  const groupFare = evidence(fareApi, { providerPolicy:provider({ provider:"synthetic_group" }), itinerary:groupItinerary, offer:offer({ fareOfferId:"group" }) });
  comparison = fareApi.compareFlightShoppingEvidence([live, groupFare]);
  assert.equal(comparison.reasons.includes("PASSENGER_CONTEXT_MISMATCH"), true);
  const flexFare = evidence(fareApi, { providerPolicy:provider({ provider:"synthetic_flex" }), offer:offer({ fareOfferId:"flex", brandedFare:"FLEX" }) });
  comparison = fareApi.compareFlightShoppingEvidence([live, flexFare]);
  assert.equal(comparison.reasons.includes("FARE_CONTEXT_MISMATCH"), true);
  comparison = fareApi.compareFlightShoppingEvidence([live, sandbox]);
  assert.equal(comparison.reasons.includes("NON_COMPARABLE_FARE_CLASS"), true);
  const conflict = evidence(fareApi, { offer:offer({ totalAmount:1300 }) });
  comparison = fareApi.compareFlightShoppingEvidence([live, conflict]);
  assert.equal(comparison.comparable, false);
  assert.equal(comparison.reasons.includes("FARE_EVIDENCE_CONFLICT"), true);
  assert.equal(comparison.cheapestEvidenceId, null);

  const sourceText = FILES.slice(1).map(function (file) { return fs.readFileSync(path.join(ROOT, file), "utf8"); }).join("\n");
  assert.equal(/\bfetch\s*\(/.test(sourceText), false);
  assert.equal(/XMLHttpRequest|WebSocket|EventSource|ipcRenderer|ipcMain/.test(sourceText), false);
  assert.equal(/Skyscanner|Travelport|Sabre|Amadeus|China Eastern|Ryanair/.test(sourceText), false);
  assert.equal(sourceText.includes('executionGate:"CLOSED"'), true);
  assert.equal(sourceText.includes("productionTraffic:false"), true);
  assert.equal(sourceText.includes("PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false"), true);
  assert.equal(sourceText.includes("WEISHAN_PAYS_PROVIDER:false"), true);

  console.log("GLOBAL_FLIGHT_SHOPPING_EVIDENCE_FOUNDATION PASS");
}

main();
