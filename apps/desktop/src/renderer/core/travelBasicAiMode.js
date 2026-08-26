(function(){
  const VERSION = "4.3.8";
  const DOMAINS = Object.freeze(["flight", "hotel", "cruise"]);
  const SAFE_AI_STATES = Object.freeze(["CONNECTED", "NOT_CONFIGURED", "INVALID", "UNAVAILABLE"]);
  const CAPABILITY_FLAGS = Object.freeze({
    TRAVEL_BASIC_SEARCH_REQUIRES_AI:"NO",
    TRAVEL_PRICE_RETRIEVAL_REQUIRES_AI:"NO",
    TRAVEL_SOURCE_DISPLAY_REQUIRES_AI:"NO",
    TRAVEL_BASIC_FILTER_REQUIRES_AI:"NO",
    TRAVEL_BASIC_SORT_REQUIRES_AI:"NO",
    TRAVEL_COMPARE_REQUIRES_AI:"NO",
    TRAVEL_DETERMINISTIC_RECOMMEND_REQUIRES_AI:"NO",
    TRAVEL_HANDOFF_REQUIRES_AI:"NO",
    TRAVEL_AI_ANALYSIS_REQUIRES_AI:"YES",
    TRAVEL_AI_TRADEOFF_REQUIRES_AI:"YES",
    TRAVEL_AI_PERSONALIZED_ADVICE_REQUIRES_AI:"YES",
    TRAVEL_AI_EXPLANATION_REQUIRES_AI:"YES",
    FLIGHT_SEARCH_REQUIRES_AI:"NO",
    FLIGHT_PRICE_DISPLAY_REQUIRES_AI:"NO",
    FLIGHT_FILTER_REQUIRES_AI:"NO",
    FLIGHT_SORT_REQUIRES_AI:"NO",
    FLIGHT_COMPARE_REQUIRES_AI:"NO",
    FLIGHT_HANDOFF_REQUIRES_AI:"NO",
    HOTEL_SEARCH_REQUIRES_AI:"NO",
    HOTEL_PRICE_DISPLAY_REQUIRES_AI:"NO",
    HOTEL_FILTER_REQUIRES_AI:"NO",
    HOTEL_SORT_REQUIRES_AI:"NO",
    HOTEL_COMPARE_REQUIRES_AI:"NO",
    HOTEL_HANDOFF_REQUIRES_AI:"NO",
    CRUISE_SEARCH_REQUIRES_AI:"NO",
    CRUISE_PRICE_DISPLAY_REQUIRES_AI:"NO",
    CRUISE_FILTER_REQUIRES_AI:"NO",
    CRUISE_SORT_REQUIRES_AI:"NO",
    CRUISE_COMPARE_REQUIRES_AI:"NO",
    CRUISE_HANDOFF_REQUIRES_AI:"NO"
  });
  const HIGH_RISK_ZERO_METRICS = Object.freeze({
    TRAVEL_BASIC_SEARCH_BLOCKED_WITHOUT_AI:0,
    TRAVEL_PRICE_BLOCKED_WITHOUT_AI:0,
    TRAVEL_COMPARE_BLOCKED_WITHOUT_AI:0,
    TRAVEL_HANDOFF_BLOCKED_WITHOUT_AI:0,
    FLIGHT_SEARCH_BLOCKED_WITHOUT_AI:0,
    HOTEL_SEARCH_BLOCKED_WITHOUT_AI:0,
    CRUISE_SEARCH_BLOCKED_WITHOUT_AI:0,
    AI_FAILURE_ERASES_TRAVEL_RESULTS:0,
    AI_FAILURE_ERASES_COMPARE_RESULTS:0,
    AI_FABRICATED_FLIGHTS:0,
    AI_FABRICATED_HOTELS:0,
    AI_FABRICATED_CRUISES:0,
    AI_FABRICATED_PRICES:0,
    AI_FABRICATED_FEES:0,
    AI_FABRICATED_REFUNDABILITY:0,
    AI_FABRICATED_CABINS:0,
    AI_FABRICATED_HANDOFFS:0,
    AI_RECOMMENDS_COMPARE_REJECTED_RESULT:0,
    AI_RECOMMENDS_UNAVAILABLE_RESULT:0,
    AI_RECOMMENDS_STALE_RESULT:0,
    AI_RECOMMENDS_TEST_DATA_AS_LIVE:0,
    AI_WRONG_ROUTE_WINNERS:0,
    AI_WRONG_DATE_WINNERS:0,
    AI_WRONG_OCCUPANCY_WINNERS:0,
    AI_WRONG_CABIN_ROOM_WINNERS:0,
    AI_CROSS_CURRENCY_FALSE_WINNERS:0,
    AI_UNKNOWN_COST_FALSE_WINNERS:0,
    AI_PROMPT_INJECTION_POLICY_BYPASSES:0,
    AI_AUTHORITY_BYPASSES:0,
    AI_SECRET_VISIBLE_TO_RENDERER:0,
    TRAVEL_CONTENT_ANALYTICS_LEAKS:0,
    RAW_TRAVEL_QUERY_ANALYTICS_LEAKS:0,
    COMMISSION_PRIMARY_INFLUENCE:0,
    AUTO_BOOKING_ACTIONS:0,
    AUTO_PAYMENT_ACTIONS:0
  });
  const AI_ONLY_ACTIONS = Object.freeze(["AI_ANALYZE", "AI_TRADEOFF", "AI_PERSONALIZED_ADVICE", "AI_EXPLAIN_RECOMMENDATION"]);
  const BASIC_EVENTS = Object.freeze(["flight_search_started", "hotel_search_started", "cruise_search_started", "travel_compare_used", "travel_handoff_clicked"]);
  const AI_EVENTS = Object.freeze(["travel_ai_analysis_requested", "travel_ai_analysis_completed"]);
  const DANGEROUS_AI_KEYS = Object.freeze(["book", "booking", "reserve", "reservation", "ticket", "payment", "pay", "purchase", "authorized", "trusted", "executionGate", "productionTraffic", "handoffUrl", "url", "bookingUrl", "checkoutUrl", "apiKey", "token", "secret", "authorization"]);
  const SECRET_VALUE = /(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]+|-----BEGIN\s+(?:RSA\s+)?PRIVATE KEY-----|password\s*[:=]|token\s*[:=]|secret\s*[:=]|api[_-]?key\s*[:=]|otp\s*[:=])/i;
  const URL_VALUE = /\bhttps?:\/\/[^\s]+/i;

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freeze(value[key]); });
    return Object.freeze(value);
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function upper(value) {
    return text(value).toUpperCase();
  }

  function lower(value) {
    return text(value).toLowerCase();
  }

  function numberOrNull(value) {
    if (value == null) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    if (Array.isArray(value) || (typeof value === "object" && !(value instanceof Number))) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }

  function normalizeAiState(input) {
    if (typeof input === "string") {
      const direct = upper(input);
      if (direct === "READY") return "CONNECTED";
      return SAFE_AI_STATES.indexOf(direct) >= 0 ? direct : "NOT_CONFIGURED";
    }
    const raw = upper(input && (input.state || input.aiState || input.status));
    if (raw === "READY") return "CONNECTED";
    return SAFE_AI_STATES.indexOf(raw) >= 0 ? raw : "NOT_CONFIGURED";
  }

  function normalizeDomain(value) {
    const raw = lower(value);
    return DOMAINS.indexOf(raw) >= 0 ? raw : "flight";
  }

  function stableKey(parts) {
    return parts.map(function (value) { return lower(value || "unknown"); }).join("|");
  }

  function nested(item, group, key) {
    return item && item[group] && item[group][key] != null ? item[group][key] : undefined;
  }

  function canonicalTravelResult(raw, index, fallbackDomain) {
    const item = raw && typeof raw === "object" ? raw : {};
    const domain = normalizeDomain(item.domain || item.category || item.travelDomain || fallbackDomain);
    const total = numberOrNull(item.totalComparablePrice != null ? item.totalComparablePrice : item.totalComparableCost != null ? item.totalComparableCost : item.totalStayPrice != null ? item.totalStayPrice : item.totalTripPrice != null ? item.totalTripPrice : item.totalPrice != null ? item.totalPrice : item.price);
    const price = numberOrNull(item.price != null ? item.price : item.totalPrice);
    const currency = upper(item.currency);
    const environment = upper(item.sourceEnvironment || item.environment || item.sourceType);
    const sourceRole = upper(item.sourceRole || item.role || item.providerRole);
    const availability = upper(item.availability || item.availabilityStatus || item.status);
    const freshness = upper(item.freshness || item.freshnessStatus || item.priceFreshness);
    const evidenceStatus = upper(item.evidenceStatus || item.validationStatus || item.truthStatus);
    const priceBasis = upper(item.priceBasis || item.basis || item.priceType);
    const handoffUrl = text(item.handoffUrl || item.deepLinkUrl || item.officialUrl || item.itemWebUrl || item.url);
    const comparable = item.comparable === true || item.compareEligible === true || item.eligible === true || evidenceStatus === "ACCEPTED" || evidenceStatus === "READY" || evidenceStatus === "VALID";
    const testData = item.testData === true || item.sandbox === true || item.evaluation === true || item.isTest === true || /SANDBOX|TEST|PREPROD|EVALUATION|DEMO/.test(environment + " " + evidenceStatus);
    const stale = item.stale === true || freshness === "STALE" || evidenceStatus === "STALE";
    const unavailable = item.unavailable === true || availability === "OUT_OF_STOCK" || availability === "UNAVAILABLE" || availability === "NOT_AVAILABLE" || evidenceStatus === "UNAVAILABLE";
    const rejected = item.rejected === true || item.compareRejected === true || evidenceStatus === "REJECTED" || evidenceStatus === "BLOCKED";
    const blocked = /BLOCKED|DECOMMISSIONED|PENDING_EXTERNAL|NO_CREDENTIAL|MTLS_PENDING/.test(sourceRole + " " + environment + " " + evidenceStatus);
    const handoffOnly = /HANDOFF_ONLY/.test(sourceRole);
    const conditional = item.conditional === true || item.fromPrice === true || /^FROM$|^FROM_PRICE$|^CONDITIONAL$/.test(priceBasis) || /\bfrom\b/i.test(text(item.priceLabel));
    const flightOrigin = item.origin != null ? item.origin : nested(item, "flight", "origin");
    const flightDestination = item.destination != null ? item.destination : nested(item, "flight", "destination");
    const flightDepartureDate = item.departureDate != null ? item.departureDate : (item.date != null ? item.date : nested(item, "flight", "departureDate"));
    const flightReturnDate = item.returnDate != null ? item.returnDate : nested(item, "flight", "returnDate");
    const flightPassengers = item.passengers != null ? item.passengers : nested(item, "flight", "passengers");
    const flightCabin = item.cabin != null ? item.cabin : nested(item, "flight", "cabin");
    const flightNonstop = item.nonstop === true || nested(item, "flight", "nonstop") === true;
    const hotelPropertyId = item.propertyId != null ? item.propertyId : nested(item, "hotel", "propertyId");
    const hotelName = item.propertyName != null ? item.propertyName : (item.hotelName != null ? item.hotelName : (nested(item, "hotel", "propertyName") || item.title));
    const hotelCheckIn = item.checkIn != null ? item.checkIn : nested(item, "hotel", "checkIn");
    const hotelCheckOut = item.checkOut != null ? item.checkOut : nested(item, "hotel", "checkOut");
    const hotelOccupancy = item.occupancy != null ? item.occupancy : nested(item, "hotel", "occupancy");
    const hotelRoomType = item.roomType != null ? item.roomType : (item.roomName != null ? item.roomName : nested(item, "hotel", "roomType"));
    const hotelRatePlan = item.ratePlan != null ? item.ratePlan : (item.ratePlanId != null ? item.ratePlanId : nested(item, "hotel", "ratePlan"));
    const cruiseShip = item.ship != null ? item.ship : nested(item, "cruise", "ship");
    const cruiseSailingId = item.sailingId != null ? item.sailingId : (item.itineraryId != null ? item.itineraryId : nested(item, "cruise", "sailingId"));
    const cruiseItinerary = item.itineraryName != null ? item.itineraryName : (item.itinerary != null ? item.itinerary : nested(item, "cruise", "itinerary"));
    const cruiseDepartureDate = item.departureDate != null ? item.departureDate : (item.date != null ? item.date : nested(item, "cruise", "departureDate"));
    const cruiseOccupancy = item.occupancy != null ? item.occupancy : nested(item, "cruise", "occupancy");
    const cruiseCabin = item.cabinType != null ? item.cabinType : (item.cabin != null ? item.cabin : nested(item, "cruise", "cabin"));
    const routeKey = domain === "flight"
      ? stableKey([flightOrigin, flightDestination, flightDepartureDate, flightReturnDate, flightPassengers, flightCabin, flightNonstop ? "nonstop" : item.nonstop === false ? "connection-ok" : "unknown"])
      : "";
    const hotelKey = domain === "hotel"
      ? stableKey([hotelPropertyId || item.hotelId || hotelName, hotelCheckIn, hotelCheckOut, hotelOccupancy, hotelRoomType, hotelRatePlan, priceBasis || "TOTAL_STAY"])
      : "";
    const cruiseKey = domain === "cruise"
      ? stableKey([cruiseShip, cruiseSailingId || cruiseItinerary || item.title, cruiseDepartureDate, cruiseOccupancy, cruiseCabin, priceBasis])
      : "";
    return freeze({
      id:text(item.id || item.offerId || item.candidateId || item.quoteId || item.rateId || item.flightId || item.sailingId || ("travel-" + index)),
      domain,
      title:text(item.title || item.name || item.flightNumber || item.propertyName || item.hotelName || item.ship || item.itineraryName || "Unknown travel option"),
      source:text(item.provider || item.providerName || item.source || item.sourceName || item.airline || item.hotelBrand || item.cruiseLine),
      sourceEnvironment:environment || "UNKNOWN",
      sourceRole:sourceRole || "UNKNOWN",
      price,
      totalComparableCost:total,
      currency,
      availability:availability || "UNKNOWN",
      freshness:freshness || "UNKNOWN",
      priceBasis:priceBasis || "UNKNOWN",
      handoffUrl,
      comparable,
      rejected,
      unavailable,
      stale,
      testData,
      blocked,
      handoffOnly,
      conditional,
      commissionEligible:item.commissionEligible === true,
      commissionRate:numberOrNull(item.commissionRate || item.commission),
      flight:freeze({
        origin:text(flightOrigin),
        destination:text(flightDestination),
        departureDate:text(flightDepartureDate),
        returnDate:text(flightReturnDate),
        passengers:numberOrNull(flightPassengers),
        cabin:text(flightCabin),
        segments:Array.isArray(item.segments) ? clone(item.segments) : (Array.isArray(nested(item, "flight", "segments")) ? clone(nested(item, "flight", "segments")) : []),
        nonstop:flightNonstop
      }),
      hotel:freeze({
        propertyId:text(hotelPropertyId || item.hotelId),
        propertyName:text(hotelName),
        checkIn:text(hotelCheckIn),
        checkOut:text(hotelCheckOut),
        occupancy:text(hotelOccupancy),
        roomType:text(hotelRoomType),
        ratePlan:text(hotelRatePlan)
      }),
      cruise:freeze({
        ship:text(cruiseShip),
        sailingId:text(cruiseSailingId),
        itinerary:text(cruiseItinerary),
        departureDate:text(cruiseDepartureDate),
        occupancy:text(cruiseOccupancy),
        cabin:text(cruiseCabin)
      }),
      contextKey:domain === "flight" ? routeKey : domain === "hotel" ? hotelKey : cruiseKey,
      evidence:clone(item.evidence || item)
    });
  }

  function normalizeTravelResults(input, domain) {
    const raw = Array.isArray(input) ? input : [];
    return freeze(raw.slice(0, 5000).map(function (item, index) { return canonicalTravelResult(item, index, domain); }));
  }

  function hasSafeHandoffUrl(candidate) {
    if (!candidate || !candidate.handoffUrl || candidate.rejected || candidate.unavailable || candidate.stale || candidate.testData || candidate.blocked) return false;
    try {
      const url = new URL(candidate.handoffUrl);
      if (url.protocol !== "https:") return false;
      if (/\/(?:checkout|cart|order|payment|pay|confirm|cancel)(?:\/|$)/i.test(url.pathname)) return false;
      if (/(?:token|secret|api[_-]?key|password|authorization|otp)=/i.test(url.search)) return false;
      return true;
    } catch (_) {
      return false;
    }
  }

  function contextMatches(candidate, context) {
    const ctx = context && typeof context === "object" ? context : {};
    if (!candidate) return false;
    if (candidate.domain === "flight") {
      if (ctx.origin && lower(ctx.origin) !== lower(candidate.flight.origin)) return false;
      if (ctx.destination && lower(ctx.destination) !== lower(candidate.flight.destination)) return false;
      if (ctx.departureDate && text(ctx.departureDate) !== text(candidate.flight.departureDate)) return false;
      if (ctx.passengers != null && numberOrNull(ctx.passengers) !== candidate.flight.passengers) return false;
      if (ctx.cabin && lower(ctx.cabin) !== lower(candidate.flight.cabin)) return false;
      if (ctx.nonstopRequired === true && candidate.flight.nonstop !== true) return false;
      return true;
    }
    if (candidate.domain === "hotel") {
      if (ctx.propertyId && lower(ctx.propertyId) !== lower(candidate.hotel.propertyId)) return false;
      if (ctx.checkIn && text(ctx.checkIn) !== text(candidate.hotel.checkIn)) return false;
      if (ctx.checkOut && text(ctx.checkOut) !== text(candidate.hotel.checkOut)) return false;
      if (ctx.occupancy && lower(ctx.occupancy) !== lower(candidate.hotel.occupancy)) return false;
      if (ctx.roomType && lower(ctx.roomType) !== lower(candidate.hotel.roomType)) return false;
      return true;
    }
    if (candidate.domain === "cruise") {
      if (ctx.sailingId && lower(ctx.sailingId) !== lower(candidate.cruise.sailingId)) return false;
      if (ctx.departureDate && text(ctx.departureDate) !== text(candidate.cruise.departureDate)) return false;
      if (ctx.occupancy && lower(ctx.occupancy) !== lower(candidate.cruise.occupancy)) return false;
      if (ctx.cabin && lower(ctx.cabin) !== lower(candidate.cruise.cabin)) return false;
      return true;
    }
    return false;
  }

  function hasExactTravelPriceBasis(candidate) {
    const basis = upper(candidate && candidate.priceBasis);
    if (!basis || basis === "UNKNOWN" || basis === "FROM" || basis === "FROM_PRICE" || basis === "CONDITIONAL" || basis === "NIGHTLY") return false;
    if (candidate && candidate.domain === "hotel") return basis === "TOTAL_STAY" || basis === "TOTAL_PARTY";
    return basis === "TOTAL_PARTY" || basis === "TOTAL_TRIP" || basis === "PER_PERSON" || basis === "TOTAL_FARE";
  }

  function eligibleForBasic(candidate, context) {
    return candidate && candidate.comparable === true && candidate.rejected !== true && candidate.unavailable !== true && candidate.stale !== true && candidate.testData !== true && candidate.blocked !== true && candidate.handoffOnly !== true && candidate.conditional !== true && hasExactTravelPriceBasis(candidate) && candidate.totalComparableCost !== null && !!candidate.currency && hasSafeHandoffUrl(candidate) && contextMatches(candidate, context);
  }

  function safeHandoffResults(results, domain) {
    return freeze(normalizeTravelResults(results, domain).filter(function (candidate) {
      return hasSafeHandoffUrl(candidate) && candidate.handoffOnly !== true;
    }));
  }

  function buildDeterministicComparison(results, options) {
    const opts = options && typeof options === "object" ? options : {};
    const domain = normalizeDomain(opts.domain || opts.category);
    const list = normalizeTravelResults(results, domain);
    const filter = lower(opts.filter);
    const filtered = filter ? list.filter(function (candidate) {
      return [candidate.title, candidate.source, candidate.currency, candidate.flight.origin, candidate.flight.destination, candidate.hotel.propertyName, candidate.cruise.ship].join(" ").toLowerCase().indexOf(filter) >= 0;
    }) : list.slice();
    const eligible = filtered.filter(function (candidate) { return candidate.domain === domain && eligibleForBasic(candidate, opts.context || {}); });
    const contextKeys = Array.from(new Set(eligible.map(function (candidate) { return candidate.contextKey; }).filter(Boolean)));
    const currencies = Array.from(new Set(eligible.map(function (candidate) { return candidate.currency; })));
    const comparable = contextKeys.length <= 1 && currencies.length === 1
      ? eligible.slice().sort(function (left, right) {
        return left.totalComparableCost - right.totalComparableCost || left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
      })
      : [];
    const clearWinner = comparable.length > 0 && (comparable.length === 1 || comparable[0].totalComparableCost < comparable[1].totalComparableCost);
    const status = filtered.length === 0 ? "NO_RESULT" : comparable.length === 0 || !clearWinner ? "NO_CLEAR_WINNER" : "CLEAR_WINNER";
    const reason = domain === "flight" ? "同一航线、日期、乘客和舱位下，总价最低。"
      : domain === "hotel" ? "同一入住、退房、入住人数和房价口径下，总价最低。"
      : "同一航次、人数、舱型和价格口径下，总价最低。";
    return freeze({
      domain,
      status,
      results:filtered,
      comparableCandidates:comparable,
      currency:currencies.length === 1 ? currencies[0] : "",
      deterministicRecommendation:clearWinner ? {
        candidateId:comparable[0].id,
        title:comparable[0].title,
        reason,
        reasonCode:"LOWEST_COMPARABLE_TRAVEL_TOTAL_COST",
        requiresAi:false,
        commissionUsedForRanking:false
      } : null,
      noClearWinner:!clearWinner,
      blockedReasons:freeze({
        crossCurrency:currencies.length > 1,
        wrongContext:contextKeys.length > 1,
        unknownCost:filtered.some(function (candidate) { return candidate.totalComparableCost === null; }),
        conditionalPrice:filtered.some(function (candidate) { return candidate.conditional; }),
        unsafeHandoff:filtered.some(function (candidate) { return candidate.handoffUrl && !hasSafeHandoffUrl(candidate); }),
        stale:filtered.some(function (candidate) { return candidate.stale; }),
        unavailable:filtered.some(function (candidate) { return candidate.unavailable; }),
        testData:filtered.some(function (candidate) { return candidate.testData; }),
        handoffOnly:filtered.some(function (candidate) { return candidate.handoffOnly; }),
        blockedSource:filtered.some(function (candidate) { return candidate.blocked; })
      })
    });
  }

  function containsDangerousKey(value) {
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return DANGEROUS_AI_KEYS.indexOf(key) >= 0 || containsDangerousKey(value[key]);
    });
  }

  function scanUnsafeText(value) {
    if (typeof value === "string") return SECRET_VALUE.test(value) || URL_VALUE.test(value);
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) { return scanUnsafeText(value[key]); });
  }

  function knownEvidenceKeys(candidate) {
    const keys = new Set();
    const evidence = candidate && candidate.evidence && typeof candidate.evidence === "object" ? candidate.evidence : {};
    Object.keys(evidence).forEach(function (key) {
      const value = evidence[key];
      if (value != null && text(value) && upper(value) !== "UNKNOWN") keys.add(key);
    });
    ["title", "source", "totalComparableCost", "currency", "availability", "freshness", "priceBasis"].forEach(function (key) {
      if (candidate && candidate[key] != null && text(candidate[key]) && upper(candidate[key]) !== "UNKNOWN") keys.add(key);
    });
    if (candidate && candidate.domain === "flight") ["origin", "destination", "departureDate", "passengers", "cabin", "segments", "nonstop"].forEach(function (key) {
      if (candidate.flight && candidate.flight[key] != null && text(candidate.flight[key])) keys.add(key);
    });
    if (candidate && candidate.domain === "hotel") ["propertyName", "checkIn", "checkOut", "occupancy", "roomType", "ratePlan"].forEach(function (key) {
      if (candidate.hotel && candidate.hotel[key] != null && text(candidate.hotel[key])) keys.add(key);
    });
    if (candidate && candidate.domain === "cruise") ["ship", "sailingId", "itinerary", "departureDate", "occupancy", "cabin"].forEach(function (key) {
      if (candidate.cruise && candidate.cruise[key] != null && text(candidate.cruise[key])) keys.add(key);
    });
    return keys;
  }

  function validateAiOutput(output, comparison, userPreference) {
    const safeComparison = comparison || buildDeterministicComparison([]);
    if (!output || typeof output !== "object" || Array.isArray(output)) return freeze({ ok:false, code:"AI_OUTPUT_INVALID", explanation:null });
    if (containsDangerousKey(output) || scanUnsafeText(output)) return freeze({ ok:false, code:"AI_OUTPUT_AUTHORITY_OR_SECRET_REJECTED", explanation:null });
    const recommendedId = text(output.recommendedResultId || output.recommendedCandidateId || output.candidateId);
    const eligibleIds = new Set(safeComparison.comparableCandidates.map(function (candidate) { return candidate.id; }));
    if (recommendedId && !eligibleIds.has(recommendedId)) return freeze({ ok:false, code:"AI_RECOMMENDED_INELIGIBLE_RESULT", explanation:null });
    if (safeComparison.deterministicRecommendation && recommendedId && recommendedId !== safeComparison.deterministicRecommendation.candidateId && !text(userPreference)) {
      return freeze({ ok:false, code:"AI_CONTRADICTED_CLEAR_DETERMINISTIC_WINNER", explanation:null });
    }
    const evidenceById = new Map(safeComparison.results.map(function (candidate) { return [candidate.id, knownEvidenceKeys(candidate)]; }));
    const fallbackEvidence = new Set();
    safeComparison.results.forEach(function (candidate) {
      knownEvidenceKeys(candidate).forEach(function (key) { fallbackEvidence.add(key); });
    });
    const claims = Array.isArray(output.claims) ? output.claims : [];
    const unsupported = claims.filter(function (claim) {
      const field = text(claim && claim.field);
      const targetId = text(claim && (claim.resultId || claim.candidateId));
      const keys = targetId && evidenceById.has(targetId) ? evidenceById.get(targetId) : fallbackEvidence;
      return !field || !keys.has(field);
    });
    if (unsupported.length) return freeze({ ok:false, code:"AI_UNSUPPORTED_TRAVEL_CLAIM_REJECTED", explanation:null });
    return freeze({
      ok:true,
      code:"AI_ANALYSIS_GROUNDED",
      explanation:{
        summary:text(output.summary || output.explanation || "这些旅行方案各有取舍。").slice(0, 500),
        recommendedResultId:recommendedId || (safeComparison.deterministicRecommendation && safeComparison.deterministicRecommendation.candidateId) || "",
        claims:claims.slice(0, 12).map(function (claim) { return { field:text(claim.field), value:text(claim.value).slice(0, 160), resultId:text(claim.resultId || claim.candidateId) }; }),
        requiresAi:true,
        grounded:true
      }
    });
  }

  function requestAiAnalysis(input) {
    const options = input && typeof input === "object" ? input : {};
    const aiState = normalizeAiState(options.aiState || options);
    const domain = normalizeDomain(options.domain || options.category);
    const results = normalizeTravelResults(options.results || options.candidates || [], domain);
    const comparison = buildDeterministicComparison(results, Object.assign({}, options, { domain }));
    if (aiState !== "CONNECTED") {
      return freeze({
        status:"AI_REQUIRED",
        aiState,
        promptTitle:"连接 AI 服务以获得智能行程分析",
        promptBody:"连接后，Weishan 可以帮你分析时间、价格、行程条件和方案取舍。",
        primaryActionLabel:"连接 AI 服务",
        basicResultsPreserved:true,
        comparison
      });
    }
    const validation = validateAiOutput(options.aiOutput || {}, comparison, text(options.userPreference));
    if (!validation.ok) return freeze({ status:"AI_FAILED_SAFE", aiState, errorClass:"AI_TRAVEL_ANALYSIS_UNAVAILABLE", basicResultsPreserved:true, comparison, validation });
    return freeze({ status:"AI_ANALYSIS_READY", aiState, basicResultsPreserved:true, comparison, analysis:validation.explanation });
  }

  function validateAiIntentOutput(output, domain) {
    const allowedByDomain = {
      flight:["origin", "destination", "departureDate", "returnDate", "passengers", "cabin", "nonstopPreference", "budget"],
      hotel:["destination", "checkIn", "checkOut", "occupancy", "roomPreference", "refundabilityPreference", "breakfastPreference", "budget"],
      cruise:["region", "departureWindow", "occupancy", "cabinPreference", "durationPreference", "budget"]
    };
    const safeDomain = normalizeDomain(domain);
    const allowed = allowedByDomain[safeDomain];
    if (!output || typeof output !== "object" || Array.isArray(output) || containsDangerousKey(output) || scanUnsafeText(output)) return freeze({ ok:false, value:{}, rejected:true, domain:safeDomain });
    const value = {};
    Object.keys(output).forEach(function (key) {
      if (allowed.indexOf(key) >= 0) value[key] = Array.isArray(output[key]) ? output[key].map(text).filter(Boolean).slice(0, 12) : text(output[key]).slice(0, 160);
    });
    return freeze({ ok:true, value, rejected:false, domain:safeDomain, droppedUnknownFields:Object.keys(output).filter(function (key) { return allowed.indexOf(key) < 0; }).length });
  }

  function sanitizeAnalyticsEvent(name, payload) {
    const eventName = text(name);
    if (BASIC_EVENTS.indexOf(eventName) < 0 && AI_EVENTS.indexOf(eventName) < 0) return freeze({ ok:false, code:"UNKNOWN_EVENT" });
    const safe = {
      eventName,
      moduleId:"TRAVEL",
      actionClass:AI_EVENTS.indexOf(eventName) >= 0 ? "AI_ANALYSIS" : eventName.indexOf("handoff") >= 0 ? "HANDOFF" : eventName.indexOf("compare") >= 0 ? "COMPARE" : "SEARCH",
      domain:DOMAINS.indexOf(lower(payload && payload.domain)) >= 0 ? lower(payload.domain) : "travel",
      outcome:["SUCCESS", "PARTIAL", "NO_RESULT", "FAILURE", "SAFE_BLOCK", "CANCELLED"].indexOf(upper(payload && payload.outcome)) >= 0 ? upper(payload.outcome) : "SUCCESS",
      resultCountBucket:text(payload && payload.resultCountBucket) || "UNKNOWN",
      errorClassSafe:text(payload && payload.errorClassSafe) || "NONE"
    };
    return freeze({ ok:true, event:safe, rawTravelQueryCollected:false, travelContentCollected:false, aiContentCollected:false, credentialCollected:false, fullUrlCollected:false });
  }

  function capabilityMatrix() {
    const rows = [
      ["FLIGHT_SEARCH", false, true, "Flight source evidence"],
      ["FLIGHT_PRICE", false, true, "Flight price truth"],
      ["FLIGHT_COMPARE", false, true, "Same route/date/passenger/cabin"],
      ["FLIGHT_HANDOFF", false, true, "Safe exact external handoff"],
      ["HOTEL_SEARCH", false, true, "Hotel source evidence"],
      ["HOTEL_PRICE", false, true, "Total stay and tax/fee semantics"],
      ["HOTEL_COMPARE", false, true, "Same property/date/occupancy/room"],
      ["HOTEL_HANDOFF", false, true, "Safe exact external handoff"],
      ["CRUISE_SEARCH", false, true, "Cruise source evidence"],
      ["CRUISE_PRICE", false, true, "Sailing/cabin price basis"],
      ["CRUISE_COMPARE", false, true, "Same sailing/occupancy/cabin"],
      ["CRUISE_HANDOFF", false, true, "Safe exact external handoff when source permits"],
      ["TRAVEL_AI_ANALYZE", true, false, "Grounded AI over accepted evidence"]
    ];
    return freeze(rows.map(function (row) {
      return { capability:row[0], requiresAi:row[1], availableWithoutAi:row[2], truthAuthority:row[3], status:"ENFORCED" };
    }));
  }

  function moduleInventory() {
    return freeze([
      { module:"Travel Search", capability:"flight/hotel/cruise basic search intent", aiDependency:"NO", sourceOfTruth:"Search + Provider Source Management", decision:"KEEP" },
      { module:"Travel Price Truth", capability:"price/currency/tax-fee/freshness semantics", aiDependency:"NO", sourceOfTruth:"Travel price truth", decision:"KEEP" },
      { module:"Travel Compare", capability:"domain-specific deterministic compare", aiDependency:"NO", sourceOfTruth:"Compare truth", decision:"KEEP" },
      { module:"Travel Recommend", capability:"evidence-based clear winner", aiDependency:"NO", sourceOfTruth:"Recommend truth", decision:"KEEP" },
      { module:"Travel AI Analysis", capability:"time/price/tradeoff explanation", aiDependency:"YES", sourceOfTruth:"Grounded accepted evidence", decision:"OPTIMIZE" },
      { module:"Travel Handoff", capability:"user-selected external handoff", aiDependency:"NO", sourceOfTruth:"Handoff truth", decision:"KEEP" },
      { module:"Travel Analytics", capability:"coarse usage only", aiDependency:"NO", sourceOfTruth:"Analytics allowlist", decision:"KEEP" }
    ]);
  }

  function featureMatrix() {
    return freeze(DOMAINS.map(function (domain) {
      return {
        domain,
        searchRequiresAi:false,
        priceDisplayRequiresAi:false,
        filterRequiresAi:false,
        sortRequiresAi:false,
        compareRequiresAi:false,
        deterministicRecommendRequiresAi:false,
        handoffRequiresAi:false,
        aiAnalysisRequiresAi:true,
        bookingAuthorized:false,
        paymentAuthorized:false,
        productionTraffic:false
      };
    }));
  }

  function buildViewModel(input) {
    const options = input && typeof input === "object" ? input : {};
    const domain = normalizeDomain(options.domain || options.category);
    const results = normalizeTravelResults(options.results || options.candidates || [], domain);
    const comparison = buildDeterministicComparison(results, Object.assign({}, options, { domain }));
    const aiState = normalizeAiState(options.aiState || options);
    return freeze({
      version:VERSION,
      domain,
      capabilityFlags:CAPABILITY_FLAGS,
      highRiskZeroMetrics:HIGH_RISK_ZERO_METRICS,
      aiState,
      modeLabel:aiState === "CONNECTED" ? "Travel + AI analysis" : "Travel works without AI",
      userFacingTitle:"旅行可直接搜索；需要智能行程分析时再连接 AI 服务",
      basicPipeline:["SEARCH", "PRICE_RESULTS", "COMPARE", "DETERMINISTIC_RECOMMEND_IF_CLEAR", "USER_SELECTS", "HANDOFF"],
      aiPipeline:["SEARCH", "COMPARE", "AI_GROUNDED_ANALYSIS", "ADVISE", "USER_SELECTS", "HANDOFF"],
      basicAvailable:true,
      aiAnalysisAvailable:aiState === "CONNECTED",
      connectAiPrompt:aiState === "CONNECTED" ? null : { title:"连接 AI 服务以获得智能行程分析", body:"连接后，Weishan 可以帮你分析时间、价格、行程条件和方案取舍。", actionLabel:"连接 AI 服务" },
      results,
      comparison,
      handoffResults:safeHandoffResults(results, domain),
      capabilityMatrix:capabilityMatrix(),
      moduleInventory:moduleInventory(),
      featureMatrix:featureMatrix(),
      analytics:{ basicMode:"COARSE_ONLY", aiMode:"COARSE_ONLY", rawTravelQuery:"EXCLUDED", travelContent:"EXCLUDED", analysisText:"EXCLUDED", fullUrl:"EXCLUDED", credentials:"EXCLUDED" },
      authority:{ aiPriceSource:false, aiProvider:false, aiHandoffAuthority:false, aiTransactionAuthority:false, userSelectsBeforeHandoff:true, commissionPrimaryInfluence:false }
    });
  }

  window.WeishanTravelBasicAiMode = freeze({
    VERSION,
    DOMAINS,
    SAFE_AI_STATES,
    CAPABILITY_FLAGS,
    HIGH_RISK_ZERO_METRICS,
    AI_ONLY_ACTIONS,
    normalizeAiState,
    normalizeTravelResults,
    buildDeterministicComparison,
    safeHandoffResults,
    capabilityMatrix,
    moduleInventory,
    featureMatrix,
    validateAiOutput,
    requestAiAnalysis,
    validateAiIntentOutput,
    sanitizeAnalyticsEvent,
    buildViewModel
  });
})();
