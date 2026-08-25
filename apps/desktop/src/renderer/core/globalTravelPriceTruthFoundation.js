;(function () {
  "use strict";

  const VERSION = "4.3.1";
  const FLIGHT_PRICE_BASIS = Object.freeze(["TOTAL_ITINERARY", "PER_PASSENGER", "FROM_PRICE", "UNKNOWN_BASIS"]);
  const HOTEL_PRICE_BASIS = Object.freeze(["PER_NIGHT", "TOTAL_STAY", "PER_ROOM", "PER_PERSON", "UNKNOWN_BASIS"]);
  const CRUISE_PRICE_BASIS = Object.freeze(["PER_PERSON", "PER_PERSON_DOUBLE_OCCUPANCY", "PER_CABIN", "TOTAL_BOOKING", "STARTING_FROM", "PRICE_RANGE", "DEPOSIT_ONLY", "INSTALLMENT", "UNKNOWN_BASIS"]);
  const FLIGHT_HANDOFF_QUALITY = Object.freeze(["EXACT_ITINERARY_HANDOFF", "EXACT_SEARCH_RECONSTRUCTION", "ROUTE_SEARCH_HANDOFF", "GENERIC_PROVIDER_PAGE", "NO_HANDOFF"]);
  const HOTEL_HANDOFF_QUALITY = Object.freeze(["EXACT_STAY_HANDOFF", "EXACT_PROPERTY_HANDOFF", "PROPERTY_SEARCH_HANDOFF", "OTA_SEARCH_HANDOFF", "GENERIC_OTA_HOME", "NO_HANDOFF"]);
  const CRUISE_HANDOFF_QUALITY = Object.freeze(["EXACT_SAILING_CABIN_HANDOFF", "EXACT_SAILING_HANDOFF", "EXACT_ITINERARY_HANDOFF", "SAILING_SEARCH_HANDOFF", "CRUISE_LINE_SEARCH_HANDOFF", "GENERIC_CRUISE_HOME", "NO_HANDOFF"]);
  const PRICE_AUTHORITIES = Object.freeze(["AUTHORITATIVE", "AUTHORIZED_SANDBOX", "INDICATIVE", "UNKNOWN"]);
  const AVAILABILITY_STATES = Object.freeze(["AVAILABLE", "LIMITED", "UNKNOWN", "UNAVAILABLE"]);
  const CRUISE_AVAILABILITY_STATES = Object.freeze(["SAILING_AVAILABLE", "CABIN_CATEGORY_AVAILABLE", "SPECIFIC_RATE_AVAILABLE", "UNKNOWN", "SOLD_OUT", "WAITLISTED"]);
  const REFUNDABILITY_STATES = Object.freeze(["REFUNDABLE", "PARTIALLY_REFUNDABLE", "NON_REFUNDABLE", "UNKNOWN"]);
  const PAYMENT_TIMING = Object.freeze(["PAY_NOW", "PAY_LATER", "UNKNOWN"]);
  const TAX_FEE_BASIS = Object.freeze(["INCLUDED", "EXCLUDED", "PARTIAL", "UNKNOWN"]);
  const COST_COMPLETENESS = Object.freeze(["KNOWN_TOTAL", "PARTIAL_TOTAL", "BASE_ONLY", "UNKNOWN_TOTAL"]);
  const CRUISE_CABIN_CATEGORIES = Object.freeze(["INTERIOR", "OCEANVIEW", "BALCONY", "SUITE", "UNKNOWN"]);
  const CRUISE_PROMOTIONS = Object.freeze(["NONE", "MEMBER_RATE", "LOYALTY_RATE", "RESIDENT_RATE", "MILITARY_RATE", "SENIOR_RATE", "KIDS_FREE", "THIRD_GUEST_DISCOUNT", "FLASH_SALE", "COUPON_REQUIRED", "PACKAGE_RATE", "UNKNOWN_PROMOTION"]);
  const SOURCE_TYPES = Object.freeze(["GDS", "NDC", "METASEARCH", "OTA", "AIRLINE_DIRECT", "HOTEL_DIRECT", "HOTEL_AGGREGATOR", "CRUISE_LINE_DIRECT", "CRUISE_AGGREGATOR", "SANDBOX", "EVALUATION", "OFFLINE_FIXTURE"]);
  const FORBIDDEN_TRANSACTION_KEYS = Object.freeze(["booking", "bookingurl", "checkout", "checkouturl", "order", "orderid", "payment", "paymenturl", "pnr", "ticket", "ticketing", "reservation"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function boundary() {
    return {
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false,
      productionAffected:false,
      BOOKING:false,
      ORDER:false,
      PAYMENT:false,
      TICKETING:false,
      TICKET_ISSUANCE:false,
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    };
  }

  function failure(code, stage) {
    return deepFreeze(Object.assign({
      success:false,
      error:{ code:code, stage:stage || "GLOBAL_TRAVEL_PRICE_TRUTH", recoverable:true }
    }, boundary()));
  }

  function text(value) { return String(value == null ? "" : value).trim(); }
  function upper(value) { return text(value).toUpperCase(); }
  function enumValue(value, allowed) {
    const normalized = upper(value);
    return allowed.indexOf(normalized) >= 0 ? normalized : null;
  }
  function identifier(value, max) {
    const result = text(value);
    return result && result.length <= (max || 240) && !/[\u0000-\u001f\u007f]/.test(result) ? result : null;
  }
  function airport(value) {
    const result = upper(value);
    return /^[A-Z]{3}$/.test(result) ? result : null;
  }
  function carrier(value) {
    const result = upper(value);
    return /^[A-Z0-9]{2,3}$/.test(result) ? result : null;
  }
  function flightNumber(value) {
    const result = upper(value);
    return /^[A-Z0-9]{1,6}$/.test(result) ? result : null;
  }
  function currency(value) {
    const result = upper(value);
    return /^[A-Z]{3}$/.test(result) ? result : null;
  }
  function amount(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
  }
  function integer(value, min, max) {
    return Number.isSafeInteger(value) && value >= min && value <= max ? value : null;
  }
  function calendarDate(value) {
    const result = text(value);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result);
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.toISOString().slice(0, 10) === result ? result : null;
  }
  function instant(value) {
    const result = text(value);
    if (!/^\d{4}-\d{2}-\d{2}T/.test(result) || !calendarDate(result.slice(0, 10))) return null;
    const parsed = Date.parse(result);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  }
  function normalizedKey(value) {
    return String(value).replace(/[^a-z0-9]/gi, "").toLowerCase();
  }
  function containsTransactionFields(value) {
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      if (key === "checkOut" || key === "checkoutDate") return containsTransactionFields(value[key]);
      return FORBIDDEN_TRANSACTION_KEYS.indexOf(normalizedKey(key)) >= 0 || containsTransactionFields(value[key]);
    });
  }
  function clonePlain(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return null;
      return JSON.parse(JSON.stringify(input));
    } catch (error) {
      return null;
    }
  }
  function hostFromUrl(value) {
    try {
      const url = new URL(text(value));
      return url.protocol === "https:" && !/^(\d+\.){3}\d+$/.test(url.hostname) ? url.hostname.toLowerCase() : null;
    } catch (error) {
      return null;
    }
  }
  function allowedUrl(value, allowedHosts) {
    if (!text(value)) return null;
    const host = hostFromUrl(value);
    if (!host) return null;
    const hosts = Array.isArray(allowedHosts) ? allowedHosts.map(function (item) { return text(item).toLowerCase(); }) : [];
    return hosts.indexOf(host) >= 0 ? text(value) : null;
  }
  function sourcePolicy(input) {
    const source = input || {};
    const provider = identifier(source.provider, 160);
    const sourceType = enumValue(source.sourceType, SOURCE_TYPES);
    const priceAuthority = enumValue(source.priceAuthority, PRICE_AUTHORITIES);
    const allowedHosts = Array.isArray(source.allowedHandoffHosts) ? source.allowedHandoffHosts.map(function (host) { return text(host).toLowerCase(); }).filter(Boolean).sort() : [];
    const maxAgeSeconds = integer(source.maxAgeSeconds, 60, 604800);
    if (!provider || !sourceType || !priceAuthority || !allowedHosts.length || maxAgeSeconds === null) return null;
    if (!allowedHosts.every(function (host) { return hostFromUrl("https://" + host + "/") === host; })) return null;
    return { provider:provider, sourceType:sourceType, priceAuthority:priceAuthority, allowedHandoffHosts:allowedHosts, maxAgeSeconds:maxAgeSeconds };
  }
  function freshness(observedAt, evaluatedAt, maxAgeSeconds) {
    const observed = instant(observedAt);
    const evaluated = instant(evaluatedAt);
    if (!observed || !evaluated) return { state:"INVALID", ageSeconds:null };
    const ageSeconds = Math.round((Date.parse(evaluated) - Date.parse(observed)) / 1000);
    if (ageSeconds < 0) return { state:"INVALID", ageSeconds:ageSeconds };
    return { state:ageSeconds <= maxAgeSeconds ? "CURRENT" : "STALE", ageSeconds:ageSeconds };
  }

  function normalizeFlightSearch(input) {
    const passengers = input.passengers || {};
    const adults = integer(passengers.adults, 1, 9);
    const children = integer(passengers.children || 0, 0, 9);
    const infants = integer(passengers.infants || 0, 0, 9);
    const total = adults === null || children === null || infants === null ? null : adults + children + infants;
    const search = {
      origin:airport(input.origin),
      destination:airport(input.destination),
      departureDate:calendarDate(input.departureDate),
      returnDate:input.returnDate == null || input.returnDate === "" ? null : calendarDate(input.returnDate),
      tripType:enumValue(input.tripType, ["ONE_WAY", "ROUND_TRIP"]),
      cabin:enumValue(input.cabin, ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]),
      passengers:{ adults:adults, children:children, infants:infants, total:total }
    };
    if (!search.origin || !search.destination || search.origin === search.destination || !search.departureDate || !search.tripType || !search.cabin || total === null || total > 9 || infants > adults) return null;
    if ((search.tripType === "ROUND_TRIP") !== Boolean(search.returnDate)) return null;
    return search;
  }
  function normalizeSegments(input, search) {
    if (!Array.isArray(input) || input.length < 1 || input.length > 8) return null;
    const segments = input.map(function (raw, index) {
      return {
        sequence:index + 1,
        journey:enumValue(raw.journey, ["OUTBOUND", "INBOUND"]),
        origin:airport(raw.origin),
        destination:airport(raw.destination),
        departureAt:instant(raw.departureAt),
        arrivalAt:instant(raw.arrivalAt),
        airline:carrier(raw.airline || raw.marketingCarrier),
        operatingAirline:carrier(raw.operatingAirline || raw.operatingCarrier || raw.airline || raw.marketingCarrier),
        flightNumber:flightNumber(raw.flightNumber),
        cabin:enumValue(raw.cabin, ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"])
      };
    });
    if (segments.some(function (segment) {
      return !segment.journey || !segment.origin || !segment.destination || segment.origin === segment.destination || !segment.departureAt ||
        !segment.arrivalAt || Date.parse(segment.arrivalAt) <= Date.parse(segment.departureAt) || !segment.airline || !segment.operatingAirline ||
        !segment.flightNumber || !segment.cabin || segment.cabin !== search.cabin;
    })) return null;
    const outbound = segments.filter(function (segment) { return segment.journey === "OUTBOUND"; });
    const inbound = segments.filter(function (segment) { return segment.journey === "INBOUND"; });
    if (!outbound.length || outbound[0].origin !== search.origin || outbound[outbound.length - 1].destination !== search.destination) return null;
    if (search.tripType === "ROUND_TRIP" && (!inbound.length || inbound[0].origin !== search.destination || inbound[inbound.length - 1].destination !== search.origin)) return null;
    if (search.tripType === "ONE_WAY" && inbound.length) return null;
    return segments;
  }
  function flightIdentity(search, segments) {
    return JSON.stringify({
      origin:search.origin,
      destination:search.destination,
      departureDate:search.departureDate,
      returnDate:search.returnDate,
      tripType:search.tripType,
      passengers:search.passengers,
      cabin:search.cabin,
      segments:segments.map(function (segment) {
        return [segment.sequence, segment.journey, segment.origin, segment.destination, segment.departureAt, segment.arrivalAt, segment.airline, segment.operatingAirline, segment.flightNumber, segment.cabin].join("|");
      })
    });
  }
  function normalizeFlightOffer(input) {
    const source = clonePlain(input);
    if (!source || containsTransactionFields(source)) return failure("FLIGHT_TRANSACTION_FIELDS_REJECTED", "FLIGHT_PRICE_TRUTH");
    const policy = sourcePolicy(source.sourcePolicy || {});
    const search = normalizeFlightSearch(source.search || {});
    const segments = search ? normalizeSegments(source.segments, search) : null;
    const priceBasis = enumValue(source.priceBasis, FLIGHT_PRICE_BASIS);
    const price = amount(source.price);
    const isoCurrency = currency(source.currency);
    const taxFeeBasis = enumValue(source.taxFeeBasis, TAX_FEE_BASIS);
    const availability = enumValue(source.availability, AVAILABILITY_STATES);
    const handoffQuality = enumValue(source.handoffQuality, FLIGHT_HANDOFF_QUALITY);
    const handoffUrl = handoffQuality && handoffQuality !== "NO_HANDOFF" && policy ? allowedUrl(source.handoffUrl, policy.allowedHandoffHosts) : null;
    const fresh = policy ? freshness(source.observedAt, source.evaluatedAt, policy.maxAgeSeconds) : { state:"INVALID", ageSeconds:null };
    if (!policy || !search || !segments || !priceBasis || price === null || !isoCurrency || !taxFeeBasis || !availability || !handoffQuality || (handoffQuality !== "NO_HANDOFF" && !handoffUrl) || fresh.state === "INVALID") return failure("FLIGHT_PRICE_TRUTH_INVALID", "FLIGHT_PRICE_TRUTH");
    const exactComparable = priceBasis === "TOTAL_ITINERARY" &&
      policy.priceAuthority === "AUTHORITATIVE" &&
      fresh.state === "CURRENT" &&
      availability === "AVAILABLE" &&
      taxFeeBasis === "INCLUDED" &&
      (handoffQuality === "EXACT_ITINERARY_HANDOFF" || handoffQuality === "EXACT_SEARCH_RECONSTRUCTION") &&
      source.fareFamily !== "UNKNOWN" &&
      source.refundability !== "UNKNOWN";
    return deepFreeze(Object.assign({
      success:true,
      evidence:{
        travelType:"FLIGHT",
        provider:policy.provider,
        sourceType:policy.sourceType,
        priceAuthority:policy.priceAuthority,
        search:search,
        segments:segments,
        identityKey:flightIdentity(search, segments),
        stopCount:segments.filter(function (segment) { return segment.journey === "OUTBOUND"; }).length - 1,
        fareFamily:identifier(source.fareFamily || "UNKNOWN", 120),
        refundability:enumValue(source.refundability, REFUNDABILITY_STATES) || "UNKNOWN",
        changeability:enumValue(source.changeability, ["ALLOWED", "FEE_APPLIES", "NOT_ALLOWED", "UNKNOWN"]) || "UNKNOWN",
        baggage:enumValue(source.baggage, ["INCLUDED", "NOT_INCLUDED", "UNKNOWN"]) || "UNKNOWN",
        price:price,
        currency:isoCurrency,
        priceBasis:priceBasis,
        taxFeeBasis:taxFeeBasis,
        availability:availability,
        observedAt:instant(source.observedAt),
        evaluatedAt:instant(source.evaluatedAt),
        freshness:fresh.state,
        freshnessAgeSeconds:fresh.ageSeconds,
        handoffQuality:handoffQuality,
        handoffUrl:handoffUrl,
        comparableAsCurrentPrice:exactComparable,
        dataClass:policy.priceAuthority === "AUTHORIZED_SANDBOX" ? "SANDBOX_TEST_DATA" : "TRAVEL_PRICE_EVIDENCE",
        rendererSecretAccess:false,
        rawProviderResponsePersisted:false
      }
    }, boundary()));
  }

  function hotelIdentity(input) {
    return JSON.stringify({
      propertyId:input.propertyId,
      propertyName:input.propertyName.toLowerCase(),
      locationKey:input.locationKey.toLowerCase(),
      checkIn:input.checkIn,
      checkOut:input.checkOut,
      nights:input.nights,
      occupancy:input.occupancy,
      roomType:input.roomType.toLowerCase(),
      ratePlan:input.ratePlan.toLowerCase()
    });
  }
  function normalizeHotelOffer(input) {
    const source = clonePlain(input);
    if (!source || containsTransactionFields(source)) return failure("HOTEL_TRANSACTION_FIELDS_REJECTED", "HOTEL_PRICE_TRUTH");
    const policy = sourcePolicy(source.sourcePolicy || {});
    const checkIn = calendarDate(source.checkIn);
    const checkOut = calendarDate(source.checkOut);
    const nights = checkIn && checkOut ? Math.round((Date.parse(checkOut + "T00:00:00.000Z") - Date.parse(checkIn + "T00:00:00.000Z")) / 86400000) : null;
    const occupancy = source.occupancy || {};
    const normalized = {
      propertyId:identifier(source.propertyId, 160),
      propertyName:identifier(source.propertyName, 240),
      locationKey:identifier(source.locationKey, 160),
      checkIn:checkIn,
      checkOut:checkOut,
      nights:nights,
      occupancy:{ adults:integer(occupancy.adults, 1, 9), children:integer(occupancy.children || 0, 0, 9), rooms:integer(occupancy.rooms || 1, 1, 9) },
      roomType:identifier(source.roomType, 160),
      ratePlan:identifier(source.ratePlan, 160)
    };
    const priceBasis = enumValue(source.priceBasis, HOTEL_PRICE_BASIS);
    const basePrice = source.basePrice == null ? null : amount(source.basePrice);
    const tax = source.tax == null ? null : amount(source.tax);
    const fees = source.fees == null ? null : amount(source.fees);
    const totalPrice = amount(source.totalPrice);
    const isoCurrency = currency(source.currency);
    const taxFeeBasis = enumValue(source.taxFeeBasis, TAX_FEE_BASIS);
    const availability = enumValue(source.availability, AVAILABILITY_STATES);
    const refundability = enumValue(source.refundability, REFUNDABILITY_STATES);
    const payTiming = enumValue(source.paymentTiming, PAYMENT_TIMING);
    const handoffQuality = enumValue(source.handoffQuality, HOTEL_HANDOFF_QUALITY);
    const handoffUrl = handoffQuality && handoffQuality !== "NO_HANDOFF" && policy ? allowedUrl(source.handoffUrl, policy.allowedHandoffHosts) : null;
    const fresh = policy ? freshness(source.observedAt, source.evaluatedAt, policy.maxAgeSeconds) : { state:"INVALID", ageSeconds:null };
    if (!policy || !normalized.propertyId || !normalized.propertyName || !normalized.locationKey || !normalized.checkIn || !normalized.checkOut || nights < 1 ||
      normalized.occupancy.adults === null || normalized.occupancy.children === null || normalized.occupancy.rooms === null || !normalized.roomType || !normalized.ratePlan ||
      !priceBasis || totalPrice === null || !isoCurrency || !taxFeeBasis || !availability || !refundability || !payTiming || !handoffQuality ||
      (handoffQuality !== "NO_HANDOFF" && !handoffUrl) || fresh.state === "INVALID") return failure("HOTEL_PRICE_TRUTH_INVALID", "HOTEL_PRICE_TRUTH");
    const exactComparable = priceBasis === "TOTAL_STAY" &&
      policy.priceAuthority === "AUTHORITATIVE" &&
      fresh.state === "CURRENT" &&
      availability === "AVAILABLE" &&
      taxFeeBasis === "INCLUDED" &&
      (handoffQuality === "EXACT_STAY_HANDOFF" || handoffQuality === "EXACT_PROPERTY_HANDOFF") &&
      refundability === "REFUNDABLE" &&
      payTiming !== "UNKNOWN";
    return deepFreeze(Object.assign({
      success:true,
      evidence:{
        travelType:"HOTEL",
        provider:policy.provider,
        sourceType:policy.sourceType,
        priceAuthority:policy.priceAuthority,
        propertyId:normalized.propertyId,
        propertyName:normalized.propertyName,
        locationKey:normalized.locationKey,
        checkIn:normalized.checkIn,
        checkOut:normalized.checkOut,
        nights:normalized.nights,
        occupancy:normalized.occupancy,
        roomType:normalized.roomType,
        ratePlan:normalized.ratePlan,
        identityKey:hotelIdentity(normalized),
        meals:identifier(source.meals || "UNKNOWN", 80),
        refundability:refundability,
        paymentTiming:payTiming,
        basePrice:basePrice,
        tax:tax,
        fees:fees,
        totalPrice:totalPrice,
        currency:isoCurrency,
        priceBasis:priceBasis,
        taxFeeBasis:taxFeeBasis,
        availability:availability,
        observedAt:instant(source.observedAt),
        evaluatedAt:instant(source.evaluatedAt),
        freshness:fresh.state,
        freshnessAgeSeconds:fresh.ageSeconds,
        handoffQuality:handoffQuality,
        handoffUrl:handoffUrl,
        comparableAsCurrentPrice:exactComparable,
        dataClass:policy.priceAuthority === "AUTHORIZED_SANDBOX" ? "SANDBOX_TEST_DATA" : "TRAVEL_PRICE_EVIDENCE",
        rendererSecretAccess:false,
        rawProviderResponsePersisted:false
      }
    }, boundary()));
  }

  function portCode(value) {
    const result = upper(value);
    return /^[A-Z0-9]{3,8}$/.test(result) ? result : null;
  }
  function normalizePorts(value) {
    if (!Array.isArray(value)) return [];
    const ports = value.map(function (item) { return portCode(item); }).filter(Boolean);
    return Array.from(new Set(ports));
  }
  function cruiseIdentity(input) {
    return JSON.stringify({
      cruiseLine:input.cruiseLine.toLowerCase(),
      shipId:input.shipId || "UNKNOWN",
      ship:input.ship.toLowerCase(),
      sailingId:input.sailingId || "UNKNOWN",
      itineraryId:input.itineraryId || "UNKNOWN",
      departurePort:input.departurePort,
      returnPort:input.returnPort,
      portsOfCall:input.portsOfCall,
      destinationRegion:input.destinationRegion.toLowerCase(),
      departureDate:input.departureDate,
      returnDate:input.returnDate,
      durationNights:input.durationNights,
      market:input.market.toUpperCase()
    });
  }
  function cruiseCabinIdentity(input) {
    return JSON.stringify({
      sailing:input.identityKey,
      cabinCategory:input.cabinCategory,
      cabinSubcategory:input.cabinSubcategory.toLowerCase(),
      cabinAssignment:input.cabinAssignment,
      occupancy:input.occupancy,
      fareBasis:input.fareBasis.toLowerCase()
    });
  }
  function normalizeCruiseOffer(input) {
    const source = clonePlain(input);
    if (!source || containsTransactionFields(source)) return failure("CRUISE_TRANSACTION_FIELDS_REJECTED", "CRUISE_PRICE_TRUTH");
    const policy = sourcePolicy(source.sourcePolicy || {});
    const departureDate = calendarDate(source.departureDate);
    const returnDate = calendarDate(source.returnDate);
    const durationNights = integer(source.durationNights, 1, 365);
    const durationDays = integer(source.durationDays || (durationNights === null ? null : durationNights + 1), 2, 366);
    const occupancy = source.occupancy || {};
    const adults = integer(occupancy.adults, 1, 9);
    const children = integer(occupancy.children || 0, 0, 9);
    const infants = integer(occupancy.infants || 0, 0, 9);
    const cabins = integer(occupancy.cabins || 1, 1, 9);
    const guests = adults === null || children === null || infants === null ? null : adults + children + infants;
    const normalized = {
      cruiseLine:identifier(source.cruiseLine, 160),
      ship:identifier(source.ship, 160),
      shipId:source.shipId == null || text(source.shipId) === "" ? null : identifier(source.shipId, 160),
      sailingId:source.sailingId == null || text(source.sailingId) === "" ? null : identifier(source.sailingId, 160),
      itineraryId:source.itineraryId == null || text(source.itineraryId) === "" ? null : identifier(source.itineraryId, 160),
      departurePort:portCode(source.departurePort),
      returnPort:portCode(source.returnPort || source.arrivalPort),
      portsOfCall:normalizePorts(source.portsOfCall),
      destinationRegion:identifier(source.destinationRegion, 160),
      departureDate:departureDate,
      returnDate:returnDate,
      durationNights:durationNights,
      durationDays:durationDays,
      market:identifier(source.market || "UNKNOWN", 80),
      occupancy:{ adults:adults, children:children, infants:infants, guests:guests, cabins:cabins },
      cabinCategory:enumValue(source.cabinCategory, CRUISE_CABIN_CATEGORIES),
      cabinSubcategory:identifier(source.cabinSubcategory || "UNKNOWN", 160),
      cabinAssignment:enumValue(source.cabinAssignment || "UNKNOWN", ["SPECIFIC_CABIN", "GUARANTEE", "ASSIGNED_LATER", "UNKNOWN"]),
      fareBasis:identifier(source.fareBasis || "UNKNOWN", 160)
    };
    const priceBasis = enumValue(source.priceBasis, CRUISE_PRICE_BASIS);
    const price = amount(source.price);
    const priceHigh = source.priceHigh == null ? null : amount(source.priceHigh);
    const baseFare = source.baseFare == null ? null : amount(source.baseFare);
    const portTaxes = source.portTaxes == null ? null : amount(source.portTaxes);
    const governmentFees = source.governmentFees == null ? null : amount(source.governmentFees);
    const portFees = source.portFees == null ? null : amount(source.portFees);
    const mandatoryFees = source.mandatoryFees == null ? null : amount(source.mandatoryFees);
    const serviceCharges = source.serviceCharges == null ? null : amount(source.serviceCharges);
    const gratuities = source.gratuities == null ? null : amount(source.gratuities);
    const fuelSurcharge = source.fuelSurcharge == null ? null : amount(source.fuelSurcharge);
    const totalPrice = source.totalPrice == null ? null : amount(source.totalPrice);
    const isoCurrency = currency(source.currency);
    const costCompleteness = enumValue(source.costCompleteness, COST_COMPLETENESS);
    const taxFeeBasis = enumValue(source.taxFeeBasis, TAX_FEE_BASIS);
    const availability = enumValue(source.availability, CRUISE_AVAILABILITY_STATES);
    const promotion = enumValue(source.promotion || "NONE", CRUISE_PROMOTIONS);
    const handoffQuality = enumValue(source.handoffQuality, CRUISE_HANDOFF_QUALITY);
    const handoffUrl = handoffQuality && handoffQuality !== "NO_HANDOFF" && policy ? allowedUrl(source.handoffUrl, policy.allowedHandoffHosts) : null;
    const fresh = policy ? freshness(source.observedAt, source.evaluatedAt, policy.maxAgeSeconds) : { state:"INVALID", ageSeconds:null };
    const dateDurationConsistent = departureDate && returnDate && durationNights !== null &&
      Math.round((Date.parse(returnDate + "T00:00:00.000Z") - Date.parse(departureDate + "T00:00:00.000Z")) / 86400000) === durationNights;
    if (!policy || !normalized.cruiseLine || !normalized.ship || !normalized.departurePort || !normalized.returnPort || !normalized.destinationRegion ||
      !normalized.departureDate || !normalized.returnDate || !dateDurationConsistent || !normalized.market || normalized.occupancy.guests === null ||
      normalized.occupancy.guests < 1 || normalized.occupancy.infants > normalized.occupancy.adults || !normalized.cabinCategory || !normalized.cabinSubcategory ||
      !normalized.cabinAssignment || !normalized.fareBasis || !priceBasis || price === null || (priceBasis === "PRICE_RANGE" && priceHigh === null) ||
      !isoCurrency || !costCompleteness || !taxFeeBasis || !availability || !promotion || !handoffQuality ||
      (handoffQuality !== "NO_HANDOFF" && !handoffUrl) || fresh.state === "INVALID") return failure("CRUISE_PRICE_TRUTH_INVALID", "CRUISE_PRICE_TRUTH");
    const identityKey = cruiseIdentity(normalized);
    const cabinKey = cruiseCabinIdentity(Object.assign({}, normalized, { identityKey:identityKey }));
    const conditionalPromotion = promotion !== "NONE";
    const exactComparable = priceBasis === "TOTAL_BOOKING" &&
      policy.priceAuthority === "AUTHORITATIVE" &&
      fresh.state === "CURRENT" &&
      availability === "SPECIFIC_RATE_AVAILABLE" &&
      costCompleteness === "KNOWN_TOTAL" &&
      taxFeeBasis === "INCLUDED" &&
      !conditionalPromotion &&
      (handoffQuality === "EXACT_SAILING_CABIN_HANDOFF" || handoffQuality === "EXACT_SAILING_HANDOFF");
    return deepFreeze(Object.assign({
      success:true,
      evidence:{
        travelType:"CRUISE",
        provider:policy.provider,
        sourceType:policy.sourceType,
        priceAuthority:policy.priceAuthority,
        cruiseLine:normalized.cruiseLine,
        ship:normalized.ship,
        shipId:normalized.shipId,
        sailingId:normalized.sailingId,
        itineraryId:normalized.itineraryId,
        departurePort:normalized.departurePort,
        returnPort:normalized.returnPort,
        portsOfCall:normalized.portsOfCall,
        destinationRegion:normalized.destinationRegion,
        departureDate:normalized.departureDate,
        returnDate:normalized.returnDate,
        durationNights:normalized.durationNights,
        durationDays:normalized.durationDays,
        market:normalized.market,
        occupancy:normalized.occupancy,
        cabinCategory:normalized.cabinCategory,
        cabinSubcategory:normalized.cabinSubcategory,
        cabinAssignment:normalized.cabinAssignment,
        fareBasis:normalized.fareBasis,
        identityKey:identityKey,
        cabinIdentityKey:cabinKey,
        price:price,
        priceHigh:priceHigh,
        baseFare:baseFare,
        portTaxes:portTaxes,
        governmentFees:governmentFees,
        portFees:portFees,
        mandatoryFees:mandatoryFees,
        serviceCharges:serviceCharges,
        gratuities:gratuities,
        fuelSurcharge:fuelSurcharge,
        totalPrice:totalPrice,
        currency:isoCurrency,
        priceBasis:priceBasis,
        costCompleteness:costCompleteness,
        taxFeeBasis:taxFeeBasis,
        availability:availability,
        promotion:promotion,
        conditionalPromotion:conditionalPromotion,
        observedAt:instant(source.observedAt),
        evaluatedAt:instant(source.evaluatedAt),
        freshness:fresh.state,
        freshnessAgeSeconds:fresh.ageSeconds,
        handoffQuality:handoffQuality,
        handoffUrl:handoffUrl,
        comparableAsCurrentPrice:exactComparable,
        dataClass:policy.priceAuthority === "AUTHORIZED_SANDBOX" ? "SANDBOX_TEST_DATA" : "TRAVEL_PRICE_EVIDENCE",
        rendererSecretAccess:false,
        rawProviderResponsePersisted:false
      }
    }, boundary()));
  }

  function comparableFailureReasons(evidence, type) {
    const reasons = [];
    if (new Set(evidence.map(function (item) { return item.identityKey; })).size > 1) reasons.push(type + "_IDENTITY_MISMATCH");
    if (type === "CRUISE" && new Set(evidence.map(function (item) { return item.cabinIdentityKey; })).size > 1) reasons.push("CRUISE_CABIN_CONTEXT_MISMATCH");
    if (new Set(evidence.map(function (item) { return item.currency; })).size > 1) reasons.push("CROSS_CURRENCY_NOT_COMPARABLE");
    evidence.forEach(function (item) {
      if (!item.comparableAsCurrentPrice) {
        if (item.freshness !== "CURRENT") reasons.push("STALE_OR_INVALID_FRESHNESS");
        if (type === "CRUISE" ? item.availability !== "SPECIFIC_RATE_AVAILABLE" : item.availability !== "AVAILABLE") reasons.push("AVAILABILITY_NOT_AUTHORITATIVE");
        if (item.priceAuthority !== "AUTHORITATIVE") reasons.push("SOURCE_AUTHORITY_NOT_LIVE");
        if (type === "FLIGHT" && item.priceBasis !== "TOTAL_ITINERARY") reasons.push("FLIGHT_PRICE_BASIS_MISMATCH");
        if (type === "HOTEL" && item.priceBasis !== "TOTAL_STAY") reasons.push("HOTEL_PRICE_BASIS_MISMATCH");
        if (type === "CRUISE" && item.priceBasis !== "TOTAL_BOOKING") reasons.push("CRUISE_PRICE_BASIS_MISMATCH");
        if (item.taxFeeBasis !== "INCLUDED") reasons.push("TAX_FEE_BASIS_MISMATCH");
        if (type === "FLIGHT" && (item.fareFamily === "UNKNOWN" || item.refundability === "UNKNOWN" || item.baggage === "UNKNOWN")) reasons.push("FLIGHT_FARE_CONDITIONS_INCOMPLETE");
        if (type === "HOTEL" && item.refundability !== "REFUNDABLE") reasons.push("HOTEL_REFUNDABILITY_MISMATCH");
        if (type === "HOTEL" && item.paymentTiming === "UNKNOWN") reasons.push("HOTEL_PAYMENT_TIMING_UNKNOWN");
        if (type === "CRUISE" && item.costCompleteness !== "KNOWN_TOTAL") reasons.push("CRUISE_TOTAL_COST_INCOMPLETE");
        if (type === "CRUISE" && item.conditionalPromotion) reasons.push("CRUISE_PROMOTION_CONDITIONAL");
        if (type === "FLIGHT" && ["EXACT_ITINERARY_HANDOFF", "EXACT_SEARCH_RECONSTRUCTION"].indexOf(item.handoffQuality) < 0) reasons.push("FLIGHT_HANDOFF_NOT_EXACT");
        if (type === "HOTEL" && ["EXACT_STAY_HANDOFF", "EXACT_PROPERTY_HANDOFF"].indexOf(item.handoffQuality) < 0) reasons.push("HOTEL_HANDOFF_NOT_EXACT");
        if (type === "CRUISE" && ["EXACT_SAILING_CABIN_HANDOFF", "EXACT_SAILING_HANDOFF"].indexOf(item.handoffQuality) < 0) reasons.push("CRUISE_HANDOFF_NOT_EXACT");
      }
    });
    return Array.from(new Set(reasons)).sort();
  }
  function compareEvidence(records, type) {
    if (!Array.isArray(records) || records.length < 2 || records.some(function (record) { return !record || record.success !== true || !record.evidence || record.evidence.travelType !== type; })) return failure(type + "_COMPARISON_INPUT_INVALID", type + "_PRICE_TRUTH");
    const evidence = records.map(function (record) { return record.evidence; });
    const reasons = comparableFailureReasons(evidence, type);
    const priceKey = type === "FLIGHT" ? "price" : "totalPrice";
    if (reasons.length) return deepFreeze(Object.assign({ success:true, comparable:false, reasons:reasons, selectedEvidenceId:null, observations:evidence }, boundary()));
    const sorted = evidence.slice().sort(function (a, b) {
      return a[priceKey] - b[priceKey] || a.provider.localeCompare(b.provider) || a.handoffUrl.localeCompare(b.handoffUrl);
    });
    return deepFreeze(Object.assign({
      success:true,
      comparable:true,
      reasons:[],
      selectedProvider:sorted[0].provider,
      selectedAmount:sorted[0][priceKey],
      currency:sorted[0].currency,
      selectedHandoffUrl:sorted[0].handoffUrl,
      observations:sorted
    }, boundary()));
  }

  window.WeishanGlobalTravelPriceTruthFoundation = Object.freeze({
    VERSION,
    FLIGHT_PRICE_BASIS,
    HOTEL_PRICE_BASIS,
    CRUISE_PRICE_BASIS,
    FLIGHT_HANDOFF_QUALITY,
    HOTEL_HANDOFF_QUALITY,
    CRUISE_HANDOFF_QUALITY,
    PRICE_AUTHORITIES,
    AVAILABILITY_STATES,
    CRUISE_AVAILABILITY_STATES,
    REFUNDABILITY_STATES,
    PAYMENT_TIMING,
    TAX_FEE_BASIS,
    COST_COMPLETENESS,
    CRUISE_CABIN_CATEGORIES,
    CRUISE_PROMOTIONS,
    SOURCE_TYPES,
    normalizeFlightOffer,
    normalizeHotelOffer,
    normalizeCruiseOffer,
    compareFlightOffers:function (records) { return compareEvidence(records, "FLIGHT"); },
    compareHotelOffers:function (records) { return compareEvidence(records, "HOTEL"); },
    compareCruiseOffers:function (records) { return compareEvidence(records, "CRUISE"); }
  });
})();
