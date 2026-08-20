;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const PRICE_CLASSES = Object.freeze(["REAL_LIVE_FARE", "REAL_FARE_WITH_CONDITIONS", "INDICATIVE_FARE", "FROM_PRICE", "TEST_FARE", "SANDBOX_TEST_DATA", "STALE_OR_UNKNOWN"]);
  const TOTAL_SEMANTICS = Object.freeze(["ONE_WAY_PER_PERSON", "ONE_WAY_ALL_PASSENGERS", "ROUND_TRIP_PER_PERSON", "ROUND_TRIP_ALL_PASSENGERS"]);
  const COMPLETENESS = Object.freeze(["COMPLETE", "INCOMPLETE", "UNKNOWN"]);
  const AVAILABILITY = Object.freeze(["AUTHORITATIVE_AVAILABILITY", "LIMITED_AVAILABILITY_SIGNAL", "AVAILABILITY_UNKNOWN"]);
  const INCLUSION = Object.freeze(["INCLUDED", "NOT_INCLUDED", "UNKNOWN"]);
  const RULE_STATES = Object.freeze(["ALLOWED", "NOT_ALLOWED", "CONDITIONAL", "UNKNOWN"]);
  const HANDOFF_TYPES = Object.freeze(["AIRLINE_DIRECT_HANDOFF", "OTA_HANDOFF", "METASEARCH_HANDOFF", "PARTNER_HANDOFF", "NO_VERIFIED_HANDOFF"]);
  const METASEARCH_PRICE_STATES = Object.freeze(["NOT_APPLICABLE", "SEARCH_RESULT_PRICE", "REFRESHED_PRICE", "REPRICE_REQUIRED"]);
  const FARE_SOURCE_TYPES = Object.freeze(["ATPCO", "NDC", "LCC", "PRIVATE_CONTENT", "OTA", "METASEARCH", "MIXED", "UNKNOWN"]);
  const FORBIDDEN_TRANSACTION_KEYS = Object.freeze(["ordertoken", "bookingurl", "checkouturl", "paymenturl", "pnr", "ticketnumber", "paymentobject", "orderobject", "ticketingobject"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function boundary() {
    return { userDecisionRequired:true, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, productionAffected:false,
      BOOKING:false, ORDER:false, PAYMENT:false, TICKETING:false, TICKET_ISSUANCE:false, booking:false, order:false, payment:false, ticketing:false,
      WEISHAN_PAYS_PROVIDER:false, PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false };
  }
  function failure(code) { return deepFreeze(Object.assign({ success:false, error:{ code:code, stage:"FLIGHT_SHOPPING_EVIDENCE", recoverable:true, message:"Flight shopping evidence was rejected safely." } }, boundary())); }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function identifier(value) { const result = text(value); return result && result.length <= 240 && !/[\u0000-\u001f\u007f]/.test(result) ? result : null; }
  function enumValue(value, allowed) { const result = text(value).toUpperCase(); return allowed.indexOf(result) >= 0 ? result : null; }
  function amount(value) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null; }
  function currency(value) { const result = text(value).toUpperCase(); return /^[A-Z]{3}$/.test(result) ? result : null; }
  function timestamp(value, unknownAllowed) {
    if (value == null || text(value) === "" || text(value).toUpperCase() === "UNKNOWN") return unknownAllowed ? "UNKNOWN" : null;
    const result = text(value);
    return /^\d{4}-\d{2}-\d{2}T/.test(result) && calendarDate(result.slice(0, 10)) && Number.isFinite(Date.parse(result)) ? result : null;
  }
  function calendarDate(value) {
    const result = text(value), match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result);
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.toISOString().slice(0, 10) === result ? result : null;
  }
  function normalizedKey(value) { return String(value).replace(/[^a-z0-9]/gi, "").toLowerCase(); }
  function containsTransactionFields(value) {
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return FORBIDDEN_TRANSACTION_KEYS.indexOf(normalizedKey(key)) >= 0 || containsTransactionFields(value[key]);
    });
  }
  function commercialMetadata(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const output = {};
    ["commission", "affiliateRate", "payout", "conversion", "epc"].forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(value, key) && ["string", "number"].indexOf(typeof value[key]) >= 0) output[key] = value[key];
    });
    return output;
  }
  function fareContextSignature(evidence) {
    return JSON.stringify({ itinerary:evidence.itinerary.identityKey, passengers:evidence.passengers, cabin:evidence.cabin,
      brandedFare:evidence.brandedFare, refundability:evidence.refundability, changeability:evidence.changeability,
      baggage:evidence.baggage, seat:evidence.seat, totalSemantics:evidence.totalSemantics });
  }
  function createFlightShoppingEvidence(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    const policyApi = window.WeishanFlightShoppingProviderPolicy || {};
    const itineraryApi = window.WeishanFlightShoppingItineraryIdentity || {};
    if (typeof security.clonePlain !== "function" || typeof policyApi.createFlightProviderPolicy !== "function" || typeof itineraryApi.createItineraryIdentity !== "function") return failure("FOUNDATION_DEPENDENCY_UNAVAILABLE");
    const checked = security.clonePlain(input);
    if (!checked.success) return failure("FARE_INPUT_REJECTED");
    const source = checked.value;
    if (containsTransactionFields(source)) return failure("TRANSACTION_FIELDS_REJECTED");
    const policyResult = policyApi.createFlightProviderPolicy(source.providerPolicy);
    const itineraryResult = itineraryApi.createItineraryIdentity(source.itinerary);
    if (!policyResult.success) return failure("PROVIDER_POLICY_INVALID");
    if (!itineraryResult.success) return failure("ITINERARY_IDENTITY_INVALID");
    const policy = policyResult.policy, itinerary = itineraryResult.itinerary, offer = source.offer || {};
    const totalAmount = amount(offer.totalAmount), baseFare = offer.baseFare == null ? null : amount(offer.baseFare);
    const taxes = offer.taxes == null ? null : amount(offer.taxes), mandatoryFees = offer.mandatoryFees == null ? null : amount(offer.mandatoryFees);
    const isoCurrency = currency(offer.currency);
    const totalSemantics = enumValue(offer.totalSemantics, TOTAL_SEMANTICS);
    const taxCompleteness = enumValue(offer.taxCompleteness, COMPLETENESS), feeCompleteness = enumValue(offer.feeCompleteness, COMPLETENESS);
    const requestedPriceClass = enumValue(offer.priceClass, PRICE_CLASSES);
    const fareSourceType = enumValue(offer.fareSourceType, FARE_SOURCE_TYPES);
    const metasearchPriceState = enumValue(offer.metasearchPriceState, METASEARCH_PRICE_STATES);
    if (totalAmount === null || !isoCurrency || !totalSemantics || !taxCompleteness || !feeCompleteness || !requestedPriceClass || !fareSourceType || !metasearchPriceState || offer.providerSuppliedTotal !== true) return failure("FARE_AMOUNT_CONTRACT_INVALID");
    if ((totalSemantics.indexOf("ROUND_TRIP") === 0) !== (itinerary.tripType === "ROUND_TRIP")) return failure("TOTAL_SEMANTICS_TRIP_MISMATCH");
    const priceClassLiveAllowed = policy.realFareCapability === "LIVE" && ["REAL_LIVE_FARE", "REAL_FARE_WITH_CONDITIONS"].indexOf(requestedPriceClass) >= 0;
    if (["REAL_LIVE_FARE", "REAL_FARE_WITH_CONDITIONS"].indexOf(requestedPriceClass) >= 0 && !priceClassLiveAllowed) return failure("REAL_FARE_CLASS_NOT_AUTHORIZED");
    if (policy.realFareCapability === "TEST_ONLY" && ["TEST_FARE", "SANDBOX_TEST_DATA"].indexOf(requestedPriceClass) < 0) return failure("TEST_FARE_CLASS_REQUIRED");
    const observedAt = timestamp(offer.observedAt, false), retrievedAt = timestamp(offer.retrievedAt, false);
    const providerUpdatedAt = timestamp(offer.providerUpdatedAt, true), offerExpiresAt = timestamp(offer.offerExpiresAt, true);
    const providerValidUntil = timestamp(offer.providerValidUntil, true), lastTicketingDate = offer.lastTicketingDate == null || text(offer.lastTicketingDate).toUpperCase() === "UNKNOWN" ? "UNKNOWN" : calendarDate(offer.lastTicketingDate);
    const evaluatedAt = timestamp(source.evaluatedAt, false);
    if (!observedAt || !retrievedAt || !providerUpdatedAt || !offerExpiresAt || !providerValidUntil || !lastTicketingDate || !evaluatedAt) return failure("FARE_TIMESTAMP_INVALID");
    const expired = (offerExpiresAt !== "UNKNOWN" && Date.parse(offerExpiresAt) <= Date.parse(evaluatedAt)) ||
      (providerValidUntil !== "UNKNOWN" && Date.parse(providerValidUntil) <= Date.parse(evaluatedAt)) ||
      (lastTicketingDate !== "UNKNOWN" && Date.parse(lastTicketingDate + "T23:59:59.999Z") <= Date.parse(evaluatedAt));
    const effectivePriceClass = expired ? "STALE_OR_UNKNOWN" : requestedPriceClass;
    const availabilityInput = enumValue(offer.availability, AVAILABILITY);
    if (!availabilityInput) return failure("AVAILABILITY_INVALID");
    let availability = "AVAILABILITY_UNKNOWN";
    if (policy.availabilityAuthority === "AUTHORITATIVE" && availabilityInput === "AUTHORITATIVE_AVAILABILITY") availability = availabilityInput;
    else if (policy.availabilityAuthority !== "NONE" && availabilityInput !== "AVAILABILITY_UNKNOWN") availability = "LIMITED_AVAILABILITY_SIGNAL";
    const refundability = enumValue(offer.refundability, RULE_STATES), changeability = enumValue(offer.changeability, RULE_STATES);
    const baggage = enumValue(offer.baggage, INCLUSION), seat = enumValue(offer.seat, INCLUSION);
    if (!refundability || !changeability || !baggage || !seat) return failure("FARE_CONDITIONS_INVALID");
    const handoffType = enumValue(offer.handoffType, HANDOFF_TYPES);
    if (!handoffType) return failure("HANDOFF_CLASSIFICATION_INVALID");
    let handoffUrl = null;
    if (handoffType === "NO_VERIFIED_HANDOFF") {
      if (offer.handoffUrl != null && text(offer.handoffUrl)) return failure("UNVERIFIED_HANDOFF_URL_REJECTED");
    } else {
      if (policy.handoffCapability !== "ALLOWED") return failure("HANDOFF_NOT_AUTHORIZED");
      const handoff = security.validateHttpsUrl(offer.handoffUrl, policy.transportPolicy.allowedHosts);
      if (!handoff.success) return failure("HANDOFF_URL_REJECTED");
      handoffUrl = handoff.url;
    }
    const market = offer.market || {};
    const marketContext = { country:text(market.country).toUpperCase() || "UNKNOWN", pointOfSale:text(market.pointOfSale).toUpperCase() || "UNKNOWN",
      residency:text(market.residency).toUpperCase() || "UNKNOWN", locale:text(market.locale) || "UNKNOWN" };
    const brandedFare = offer.brandedFare == null || text(offer.brandedFare) === "" ? "UNKNOWN" : identifier(offer.brandedFare);
    const fareOfferId = identifier(offer.fareOfferId), contentSource = identifier(offer.contentSource), airlineOrOta = identifier(offer.airlineOrOta);
    if (!fareOfferId || !contentSource || !airlineOrOta) return failure("PROVENANCE_INCOMPLETE");
    const materiallyConditional = requestedPriceClass === "REAL_FARE_WITH_CONDITIONS" || refundability !== "ALLOWED" || changeability !== "ALLOWED" || baggage !== "INCLUDED" || seat !== "INCLUDED";
    const metasearchUseAllowed = policy.sourceClass !== "METASEARCH" || policy.metasearchPermission === "ALLOWED";
    const comparable = !expired && metasearchUseAllowed && policy.comparisonPermission === "ALLOWED" && policy.displayPermission === "ALLOWED" && policy.costPolicy === "FREE_AUTHORIZED" &&
      ["REAL_LIVE_FARE", "REAL_FARE_WITH_CONDITIONS"].indexOf(effectivePriceClass) >= 0 && metasearchPriceState !== "SEARCH_RESULT_PRICE" && metasearchPriceState !== "REPRICE_REQUIRED";
    const evidenceId = [policy.provider, policy.environment, itinerary.identityKey, fareOfferId, observedAt].join(":");
    const evidence = {
      evidenceId:evidenceId, provider:policy.provider, environment:policy.environment, sourceClass:policy.sourceClass, contentSourceClass:policy.contentSourceClass,
      itinerary:itinerary, passengers:itinerary.passengers, cabin:itinerary.cabin, fareOfferId:fareOfferId,
      totalAmount:totalAmount, currency:isoCurrency, totalSemantics:totalSemantics, providerSuppliedTotal:true,
      baseFare:baseFare, taxes:taxes, mandatoryFees:mandatoryFees, taxCompleteness:taxCompleteness, feeCompleteness:feeCompleteness,
      priceClass:effectivePriceClass, originalPriceClass:requestedPriceClass, fareSourceType:fareSourceType, brandedFare:brandedFare,
      refundability:refundability, changeability:changeability, baggage:baggage, seat:seat, materiallyConditional:materiallyConditional,
      availability:availability, observedAt:observedAt, retrievedAt:retrievedAt, providerUpdatedAt:providerUpdatedAt,
      offerExpiresAt:offerExpiresAt, providerValidUntil:providerValidUntil, lastTicketingDate:lastTicketingDate, expired:expired,
      metasearchPriceState:metasearchPriceState, market:marketContext, handoffType:handoffType, handoffUrl:handoffUrl,
      comparisonPermission:policy.comparisonPermission, displayPermission:policy.displayPermission, cachePermission:policy.cachePermission,
      metasearchPermission:policy.metasearchPermission, comparisonEligible:comparable,
      providerCostPolicy:policy.costPolicy, providerEligibility:policy.costPolicy === "FREE_AUTHORIZED" ? "ELIGIBLE" : policy.costPolicy,
      provenance:{ provider:policy.provider, contentSource:contentSource, airlineOrOta:airlineOrOta, itineraryId:itinerary.itineraryId,
        fareOfferId:fareOfferId, handoffType:handoffType, handoffUrl:handoffUrl },
      credentialStoreReference:policy.credentialStoreReference,
      rendererSecretAccess:false, rawProviderResponsePersisted:false
    };
    return deepFreeze(Object.assign({ success:true, evidence:evidence, commercialMetadata:commercialMetadata(offer.commercialMetadata) }, boundary()));
  }
  function compareFlightShoppingEvidence(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    const checked = typeof security.clonePlain === "function" ? security.clonePlain(input) : failure("SECURITY_DEPENDENCY_UNAVAILABLE");
    if (!checked.success || !Array.isArray(checked.value) || checked.value.length < 2) return failure("COMPARISON_INPUT_INVALID");
    const records = checked.value;
    if (!records.every(function (item) { return item && item.success === true && item.evidence; })) return failure("COMPARISON_EVIDENCE_INVALID");
    const evidence = records.map(function (item) { return item.evidence; });
    const reasons = [];
    if (new Set(evidence.map(function (item) { return item.itinerary.identityKey; })).size > 1) reasons.push("ITINERARY_IDENTITY_MISMATCH");
    if (new Set(evidence.map(function (item) { return JSON.stringify(item.passengers); })).size > 1) reasons.push("PASSENGER_CONTEXT_MISMATCH");
    if (new Set(evidence.map(function (item) { return item.currency; })).size > 1) reasons.push("CURRENCY_NORMALIZATION_REQUIRED");
    if (new Set(evidence.map(fareContextSignature)).size > 1) reasons.push("FARE_CONTEXT_MISMATCH");
    if (evidence.some(function (item) { return !item.comparisonEligible || ["REAL_LIVE_FARE", "REAL_FARE_WITH_CONDITIONS"].indexOf(item.priceClass) < 0; })) reasons.push("NON_COMPARABLE_FARE_CLASS");
    const observationKeys = new Map();
    evidence.forEach(function (item) {
      const key = [item.provider, item.environment, item.fareOfferId, item.observedAt].join("|");
      if (!observationKeys.has(key)) observationKeys.set(key, new Set());
      observationKeys.get(key).add(item.totalAmount + "|" + item.currency);
    });
    if (Array.from(observationKeys.values()).some(function (prices) { return prices.size > 1; })) reasons.push("FARE_EVIDENCE_CONFLICT");
    const uniqueReasons = Array.from(new Set(reasons)).sort();
    if (uniqueReasons.length) return deepFreeze(Object.assign({ success:true, comparable:false, reasons:uniqueReasons, cheapestEvidenceId:null, observations:evidence }, boundary()));
    const sorted = evidence.slice().sort(function (a, b) { return a.totalAmount - b.totalAmount || a.evidenceId.localeCompare(b.evidenceId); });
    return deepFreeze(Object.assign({ success:true, comparable:true, reasons:[], cheapestEvidenceId:sorted[0].evidenceId,
      cheapestAmount:sorted[0].totalAmount, currency:sorted[0].currency, observations:sorted }, boundary()));
  }

  window.WeishanFlightShoppingEvidence = Object.freeze({
    VERSION, PRICE_CLASSES, TOTAL_SEMANTICS, COMPLETENESS, AVAILABILITY, INCLUSION, RULE_STATES, HANDOFF_TYPES,
    METASEARCH_PRICE_STATES, FARE_SOURCE_TYPES, FORBIDDEN_TRANSACTION_KEYS, createFlightShoppingEvidence, compareFlightShoppingEvidence
  });
})();
