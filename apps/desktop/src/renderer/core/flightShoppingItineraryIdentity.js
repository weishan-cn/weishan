;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const CABINS = Object.freeze(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]);
  const TRIP_TYPES = Object.freeze(["ONE_WAY", "ROUND_TRIP"]);
  const JOURNEYS = Object.freeze(["OUTBOUND", "INBOUND"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function boundary() { return { executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false, productionAffected:false, BOOKING:false, ORDER:false, PAYMENT:false, TICKETING:false, TICKET_ISSUANCE:false }; }
  function failure(code) { return deepFreeze(Object.assign({ success:false, error:{ code:code, stage:"FLIGHT_ITINERARY_IDENTITY", recoverable:true } }, boundary())); }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function identifier(value) { const result = text(value); return result && result.length <= 240 && !/[\u0000-\u001f\u007f]/.test(result) ? result : null; }
  function airport(value) { const result = text(value).toUpperCase(); return /^[A-Z]{3}$/.test(result) ? result : null; }
  function carrier(value) { const result = text(value).toUpperCase(); return /^[A-Z0-9]{2,3}$/.test(result) ? result : null; }
  function flightNumber(value) { const result = text(value).toUpperCase(); return /^[A-Z0-9]{1,6}$/.test(result) ? result : null; }
  function cabin(value) { const result = text(value).toUpperCase(); return CABINS.indexOf(result) >= 0 ? result : null; }
  function calendarDate(value) {
    const result = text(value);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result);
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.toISOString().slice(0, 10) === result ? result : null;
  }
  function instant(value) { const result = text(value); return /^\d{4}-\d{2}-\d{2}T/.test(result) && calendarDate(result.slice(0, 10)) && Number.isFinite(Date.parse(result)) ? result : null; }
  function passengerCount(value, minimum) { return Number.isSafeInteger(value) && value >= minimum && value <= 9 ? value : null; }
  function validateFlightSearchInput(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    if (typeof security.clonePlain !== "function") return failure("SECURITY_DEPENDENCY_UNAVAILABLE");
    const checked = security.clonePlain(input);
    if (!checked.success) return failure("SEARCH_INPUT_REJECTED");
    const source = checked.value;
    const origin = airport(source.origin), destination = airport(source.destination);
    const departureDate = calendarDate(source.departureDate);
    const returnDate = source.returnDate == null || source.returnDate === "" ? null : calendarDate(source.returnDate);
    const tripType = text(source.tripType).toUpperCase();
    const travelCabin = cabin(source.cabin);
    const adults = passengerCount(source.passengers && source.passengers.adults, 1);
    const children = passengerCount(source.passengers && source.passengers.children, 0);
    const infants = passengerCount(source.passengers && source.passengers.infants, 0);
    if (!origin || !destination || origin === destination || !departureDate || TRIP_TYPES.indexOf(tripType) < 0 || !travelCabin || adults === null || children === null || infants === null) return failure("SEARCH_INPUT_INVALID");
    if ((tripType === "ROUND_TRIP") !== Boolean(returnDate)) return failure("RETURN_DATE_CONTRACT_INVALID");
    if (returnDate) {
      const duration = (Date.parse(returnDate + "T00:00:00Z") - Date.parse(departureDate + "T00:00:00Z")) / 86400000;
      if (duration < 0 || duration > 366) return failure("TRIP_LENGTH_INVALID");
    }
    const total = adults + children + infants;
    if (total > 9 || infants > adults) return failure("PASSENGER_CONTEXT_INVALID");
    return deepFreeze(Object.assign({ success:true, search:{ origin:origin, destination:destination, departureDate:departureDate, returnDate:returnDate,
      tripType:tripType, cabin:travelCabin, passengers:{ adults:adults, children:children, infants:infants, total:total }, maxTripDays:366 } }, boundary()));
  }
  function createItineraryIdentity(input) {
    const security = window.WeishanGlobalCommerceFeedSecurity || {};
    if (typeof security.clonePlain !== "function") return failure("SECURITY_DEPENDENCY_UNAVAILABLE");
    const checked = security.clonePlain(input);
    if (!checked.success) return failure("ITINERARY_INPUT_REJECTED");
    const source = checked.value;
    const search = validateFlightSearchInput(source.search);
    if (!search.success || !Array.isArray(source.segments) || source.segments.length < 1 || source.segments.length > 8) return failure("ITINERARY_STRUCTURE_INVALID");
    const segments = [];
    for (let index = 0; index < source.segments.length; index += 1) {
      const raw = source.segments[index];
      const departureAt = instant(raw.departureAt), arrivalAt = instant(raw.arrivalAt);
      const segment = {
        segmentSequence:raw.segmentSequence,
        journey:text(raw.journey).toUpperCase(), origin:airport(raw.origin), destination:airport(raw.destination),
        departureAt:departureAt, arrivalAt:arrivalAt, travelDate:calendarDate(raw.travelDate),
        marketingCarrier:carrier(raw.marketingCarrier), operatingCarrier:carrier(raw.operatingCarrier),
        flightNumber:flightNumber(raw.flightNumber), cabin:cabin(raw.cabin), bookingClass:text(raw.bookingClass).toUpperCase() || null
      };
      if (segment.segmentSequence !== index + 1 || JOURNEYS.indexOf(segment.journey) < 0 || !segment.origin || !segment.destination || segment.origin === segment.destination || !segment.departureAt || !segment.arrivalAt || Date.parse(segment.arrivalAt) <= Date.parse(segment.departureAt) || !segment.travelDate || segment.travelDate !== segment.departureAt.slice(0, 10) || !segment.marketingCarrier || !segment.operatingCarrier || !segment.flightNumber || !segment.cabin || segment.cabin !== search.search.cabin || (segment.bookingClass && !/^[A-Z0-9]{1,4}$/.test(segment.bookingClass))) return failure("SEGMENT_IDENTITY_INVALID");
      segments.push(segment);
    }
    for (let index = 1; index < segments.length; index += 1) {
      if (segments[index].journey === segments[index - 1].journey && (segments[index - 1].destination !== segments[index].origin || Date.parse(segments[index].departureAt) <= Date.parse(segments[index - 1].arrivalAt))) return failure("SEGMENT_CONNECTION_INVALID");
      if (segments[index - 1].journey === "INBOUND" && segments[index].journey === "OUTBOUND") return failure("SEGMENT_ORDER_INVALID");
    }
    const outbound = segments.filter(function (segment) { return segment.journey === "OUTBOUND"; });
    const inbound = segments.filter(function (segment) { return segment.journey === "INBOUND"; });
    if (!outbound.length || outbound[0].origin !== search.search.origin || outbound[outbound.length - 1].destination !== search.search.destination) return failure("OUTBOUND_IDENTITY_MISMATCH");
    if (search.search.tripType === "ROUND_TRIP" && (!inbound.length || inbound[0].origin !== search.search.destination || inbound[inbound.length - 1].destination !== search.search.origin)) return failure("INBOUND_IDENTITY_MISMATCH");
    if (search.search.tripType === "ONE_WAY" && inbound.length) return failure("UNEXPECTED_INBOUND_SEGMENT");
    const identityKey = segments.map(function (segment) {
      return [segment.segmentSequence, segment.journey, segment.origin, segment.destination, segment.departureAt, segment.arrivalAt,
        segment.marketingCarrier, segment.operatingCarrier, segment.flightNumber, segment.cabin, segment.bookingClass || "UNKNOWN"].join("|");
    }).join("::");
    const itineraryId = source.itineraryId == null || text(source.itineraryId) === "" ? identityKey : identifier(source.itineraryId);
    if (!itineraryId) return failure("ITINERARY_IDENTIFIER_INVALID");
    return deepFreeze(Object.assign({ success:true, itinerary:{ itineraryId:itineraryId, identityKey:identityKey,
      tripType:search.search.tripType, origin:search.search.origin, destination:search.search.destination, passengers:search.search.passengers,
      cabin:search.search.cabin, segments:segments, segmentCount:segments.length, stopCount:Math.max(0, outbound.length - 1) + Math.max(0, inbound.length - 1),
      codeshare:segments.some(function (segment) { return segment.marketingCarrier !== segment.operatingCarrier; }), identitySufficient:true } }, boundary()));
  }

  window.WeishanFlightShoppingItineraryIdentity = Object.freeze({ VERSION, CABINS, TRIP_TYPES, JOURNEYS, validateFlightSearchInput, createItineraryIdentity });
})();
