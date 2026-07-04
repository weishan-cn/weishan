;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SAME_ITEM_MATCHER_VERSION = "4.1.9";
  const MATCHER_NAME = "global_shopping_same_item_matcher_v1";
  const CAVEAT = "当前只处理只读 fixture 候选，不代表真实平台库存、最终价、锁价或可下单能力。";
  const ITEM_TYPES = ["flight", "hotel", "product", "local_service", "unknown"];
  const SOURCE_TYPES = ["official", "authorized", "aggregator", "user_submitted", "fixture"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function lower(value) { return text(value).toLowerCase(); }
  function numberOrNull(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  function bool(value) { return value === true; }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function normalizerApi() { return window.WeishanGlobalShoppingPriceSourceNormalizer || {}; }
  function normalizedCandidates(input) {
    const safe = obj(input);
    if (toArray(safe.normalizedCandidates).length) return toArray(safe.normalizedCandidates);
    if (safe.priceSourceNormalizationSummary && toArray(safe.priceSourceNormalizationSummary.normalizedCandidates).length) {
      return toArray(safe.priceSourceNormalizationSummary.normalizedCandidates);
    }
    const api = normalizerApi();
    return typeof api.normalizeGlobalShoppingPriceSources === "function" ? api.normalizeGlobalShoppingPriceSources(safe) : [];
  }
  function sanitizeGeo(value) {
    const safe = obj(value);
    return { lat:numberOrNull(safe.lat), lng:numberOrNull(safe.lng), redacted:true };
  }
  function sanitizeCandidate(input, fallbackId) {
    const safe = obj(input);
    return clone({
      candidateId:text(safe.candidateId || fallbackId || "candidate"),
      itemType:ITEM_TYPES.indexOf(text(safe.itemType)) >= 0 ? text(safe.itemType) : "unknown",
      sourceType:SOURCE_TYPES.indexOf(text(safe.sourceType)) >= 0 ? text(safe.sourceType) : "unknown",
      sourceName:text(safe.sourceName || "Fixture Source"),
      title:text(safe.title || ""),
      brand:text(safe.brand || ""),
      model:text(safe.model || ""),
      sku:text(safe.sku || ""),
      gtin:text(safe.gtin || ""),
      upc:text(safe.upc || ""),
      ean:text(safe.ean || ""),
      mpn:text(safe.mpn || ""),
      capacity:text(safe.capacity || ""),
      color:text(safe.color || ""),
      size:text(safe.size || ""),
      countryVersion:text(safe.countryVersion || ""),
      flightNumber:text(safe.flightNumber || ""),
      departureDate:text(safe.departureDate || ""),
      originAirport:text(safe.originAirport || ""),
      destinationAirport:text(safe.destinationAirport || ""),
      departureTime:text(safe.departureTime || ""),
      arrivalTime:text(safe.arrivalTime || ""),
      cabinClass:text(safe.cabinClass || ""),
      baggageRule:text(safe.baggageRule || ""),
      hotelId:text(safe.hotelId || ""),
      hotelName:text(safe.hotelName || ""),
      address:text(safe.address || ""),
      geo:sanitizeGeo(safe.geo),
      checkIn:text(safe.checkIn || ""),
      checkOut:text(safe.checkOut || ""),
      roomType:text(safe.roomType || ""),
      occupancy:text(safe.occupancy || ""),
      breakfastIncluded:bool(safe.breakfastIncluded),
      cancellationPolicy:text(safe.cancellationPolicy || ""),
      normalizedTotal:numberOrNull(safe.normalizedTotal),
      currency:text(safe.currency || ""),
      sourceTrustLevel:text(safe.sourceTrustLevel || ""),
      fixtureOnly:safe.fixtureOnly !== false,
      sandboxOnly:safe.sandboxOnly !== false,
      readOnly:safe.readOnly !== false,
      redacted:true
    });
  }
  function join(parts) { return parts.filter(Boolean).join("|"); }
  function keyForProductExact(candidate) {
    const code = candidate.sku || candidate.gtin || candidate.upc || candidate.ean || candidate.mpn;
    if (!candidate.brand || !candidate.model || !code) return "";
    return "product-exact:" + join([lower(candidate.brand), lower(candidate.model), lower(code)]);
  }
  function keyForProductStrong(candidate) {
    if (!candidate.brand || !candidate.model) return "";
    const detailCount = [candidate.capacity, candidate.color, candidate.size, candidate.countryVersion].filter(Boolean).length;
    if (detailCount < 2) return "";
    return "product-strong:" + join([lower(candidate.brand), lower(candidate.model), lower(candidate.capacity), lower(candidate.color), lower(candidate.size), lower(candidate.countryVersion)]);
  }
  function keyForFlightExact(candidate) {
    if (!candidate.flightNumber || !candidate.departureDate || !candidate.originAirport || !candidate.destinationAirport || !candidate.cabinClass || !candidate.baggageRule) return "";
    return "flight-exact:" + join([lower(candidate.flightNumber), candidate.departureDate, lower(candidate.originAirport), lower(candidate.destinationAirport), lower(candidate.cabinClass), lower(candidate.baggageRule)]);
  }
  function keyForHotelExact(candidate) {
    if (!candidate.hotelId || !candidate.checkIn || !candidate.checkOut || !candidate.roomType || !candidate.occupancy || !candidate.cancellationPolicy) return "";
    return "hotel-exact:" + join([lower(candidate.hotelId), candidate.checkIn, candidate.checkOut, lower(candidate.roomType), lower(candidate.occupancy), lower(candidate.cancellationPolicy)]);
  }
  function hotelLocation(candidate) {
    if (candidate.address) return lower(candidate.address);
    if (candidate.geo && candidate.geo.lat != null && candidate.geo.lng != null) return String(candidate.geo.lat) + "," + String(candidate.geo.lng);
    return "";
  }
  function keyForHotelStrong(candidate) {
    if (!candidate.hotelName || !candidate.roomType || !candidate.checkIn || !candidate.checkOut) return "";
    const location = hotelLocation(candidate);
    if (!location) return "";
    return "hotel-strong:" + join([lower(candidate.hotelName), location, lower(candidate.roomType), candidate.checkIn, candidate.checkOut]);
  }
  function evaluateGlobalShoppingSameItemMatch(input) {
    const candidate = sanitizeCandidate(input, "candidate");
    if (candidate.itemType === "product") {
      if (keyForProductExact(candidate)) return clone({ itemType:"product", groupingKey:keyForProductExact(candidate), matchType:"exact", matchConfidence:"high", matchReasons:["brand_model_identifier_match"], matchWarnings:[], needsReview:false, redacted:true });
      if (keyForProductStrong(candidate)) return clone({ itemType:"product", groupingKey:keyForProductStrong(candidate), matchType:"strong", matchConfidence:"medium", matchReasons:["brand_model_spec_match"], matchWarnings:["missing_global_identifier"], needsReview:false, redacted:true });
      return clone({ itemType:"product", groupingKey:"product-review:" + candidate.candidateId, matchType:"manual_review", matchConfidence:"needs_review", matchReasons:[], matchWarnings:["missing_product_key_fields"], needsReview:true, redacted:true });
    }
    if (candidate.itemType === "flight") {
      if (keyForFlightExact(candidate)) return clone({ itemType:"flight", groupingKey:keyForFlightExact(candidate), matchType:"exact", matchConfidence:"high", matchReasons:["flight_number_route_cabin_baggage_match"], matchWarnings:[], needsReview:false, redacted:true });
      return clone({ itemType:"flight", groupingKey:"flight-review:" + candidate.candidateId, matchType:"manual_review", matchConfidence:"needs_review", matchReasons:[], matchWarnings:["missing_flight_key_fields"], needsReview:true, redacted:true });
    }
    if (candidate.itemType === "hotel") {
      if (keyForHotelExact(candidate)) return clone({ itemType:"hotel", groupingKey:keyForHotelExact(candidate), matchType:"exact", matchConfidence:"high", matchReasons:["hotel_id_room_policy_match"], matchWarnings:[], needsReview:false, redacted:true });
      if (keyForHotelStrong(candidate)) return clone({ itemType:"hotel", groupingKey:keyForHotelStrong(candidate), matchType:"strong", matchConfidence:"medium", matchReasons:["hotel_name_location_room_match"], matchWarnings:["missing_hotel_identifier"], needsReview:false, redacted:true });
      return clone({ itemType:"hotel", groupingKey:"hotel-review:" + candidate.candidateId, matchType:"manual_review", matchConfidence:"needs_review", matchReasons:[], matchWarnings:["missing_hotel_key_fields"], needsReview:true, redacted:true });
    }
    return clone({ itemType:candidate.itemType || "unknown", groupingKey:(candidate.itemType || "unknown") + "-review:" + candidate.candidateId, matchType:"manual_review", matchConfidence:"needs_review", matchReasons:[], matchWarnings:["unsupported_item_type"], needsReview:true, redacted:true });
  }
  function unsafe(input) {
    const safe = obj(input);
    const safeSafety = obj(safe.safety);
    return safe.realProviderEnabled === true || safe.networkEnabled === true || safe.noRealProvider === false || safe.noNetwork === false ||
      safe.payment === true || safe.order === true || safe.ticketing === true || safe.autoOpen === true || safe.openExternal === true ||
      safeSafety.payment === true || safeSafety.order === true || safeSafety.ticketing === true || safeSafety.autoOpen === true ||
      safeSafety.fileWrite === true || safeSafety.download === true || safeSafety.rawResponseStored === true || safeSafety.rawUserTextStored === true || safeSafety.secretStored === true ||
      Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safeSafety.bookingUrl || safeSafety.checkoutUrl || safeSafety.paymentUrl || safeSafety.orderUrl);
  }
  function canonicalItemIdFor(groupId, candidate, match) {
    return text((candidate.itemType || "unknown") + ":" + (match.groupingKey || groupId || candidate.candidateId || "review")).replace(/\s+/g, "_");
  }
  function matchGlobalShoppingSameItemCandidates(input) {
    const candidates = normalizedCandidates(input || {}).map(function (item, index) { return sanitizeCandidate(item, "candidate_" + (index + 1)); });
    const groups = {};
    candidates.forEach(function (candidate) {
      const match = evaluateGlobalShoppingSameItemMatch(candidate);
      const groupId = text(match.groupingKey || candidate.candidateId || "candidate_group");
      if (!groups[groupId]) groups[groupId] = { match:match, candidates:[] };
      groups[groupId].candidates.push(candidate);
    });
    return clone(Object.keys(groups).map(function (groupId, index) {
      const entry = groups[groupId];
      const items = entry.candidates.slice();
      const match = entry.match;
      const official = items.find(function (candidate) { return candidate.sourceType === "official"; }) || null;
      const sourceCandidateIds = items.map(function (candidate) { return candidate.candidateId; });
      const matchWarnings = [].concat(match.matchWarnings || []);
      if (official && items.some(function (candidate) { return candidate.sourceType === "user_submitted"; })) {
        matchWarnings.push("user_submitted_cannot_override_official");
      }
      return {
        groupId:text("same_item_group_" + (index + 1)),
        canonicalItemId:canonicalItemIdFor(groupId, items[0] || {}, match),
        itemType:ITEM_TYPES.indexOf(text(match.itemType)) >= 0 ? text(match.itemType) : "unknown",
        matchType:/^(exact|strong|weak|manual_review)$/.test(text(match.matchType)) ? text(match.matchType) : "manual_review",
        matchConfidence:/^(high|medium|low|needs_review)$/.test(text(match.matchConfidence)) ? text(match.matchConfidence) : "needs_review",
        candidates:clone(items),
        officialCandidateId:official ? official.candidateId : "",
        sourceCandidateIds:sourceCandidateIds,
        matchReasons:clone(match.matchReasons || []),
        matchWarnings:Array.from(new Set(matchWarnings.map(text).filter(Boolean))),
        redacted:true
      };
    }));
  }
  function buildGlobalShoppingSameItemMatchRows(input) {
    return clone(matchGlobalShoppingSameItemCandidates(input || {}).map(function (group) {
      return {
        rowId:group.groupId,
        label:group.canonicalItemId || group.groupId,
        value:(group.matchType || "manual_review") + " / " + (group.matchConfidence || "needs_review") + " / " + String(group.sourceCandidateIds.length) + " sources",
        status:group.matchConfidence === "high" ? "pass" : (group.matchConfidence === "medium" ? "warning" : "blocked"),
        redacted:true
      };
    }));
  }
  function sanitizeGlobalShoppingSameItemMatcher(matcher) {
    const safe = obj(matcher);
    const matchedGroups = toArray(safe.matchedGroups).length ? toArray(safe.matchedGroups) : matchGlobalShoppingSameItemCandidates(safe);
    const blockedReasons = [];
    if (unsafe(safe)) blockedReasons.push("unsafe_same_item_matcher_capability_detected");
    const hasCandidates = matchedGroups.some(function (group) { return toArray(group.candidates).length > 0; });
    const hasCanonicalItemId = matchedGroups.every(function (group) { return Boolean(text(group.canonicalItemId)); });
    const hasMatchConfidence = matchedGroups.every(function (group) { return Boolean(text(group.matchConfidence)); });
    const hasMatchWarnings = matchedGroups.every(function (group) { return Array.isArray(group.matchWarnings); });
    const needsReview = !matchedGroups.length || !hasCandidates || !hasCanonicalItemId || !hasMatchConfidence || !hasMatchWarnings || matchedGroups.some(function (group) {
      return group.matchConfidence === "low" || group.matchConfidence === "needs_review" || group.matchType === "manual_review";
    });
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status))
      ? text(safe.status)
      : (blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      matcherName:MATCHER_NAME,
      appVersion:GLOBAL_SHOPPING_SAME_ITEM_MATCHER_VERSION,
      status:status,
      matchedGroups:clone(matchedGroups),
      matchHealth:{
        hasCandidates:hasCandidates,
        hasCanonicalItemId:hasCanonicalItemId,
        hasMatchConfidence:hasMatchConfidence,
        hasMatchWarnings:hasMatchWarnings,
        noRealProvider:safe.noRealProvider !== false && safe.realProviderEnabled !== true,
        noNetwork:safe.noNetwork !== false && safe.networkEnabled !== true,
        noPayment:safe.payment !== true,
        noOrder:safe.order !== true,
        noTicketing:safe.ticketing !== true,
        noExternalOpen:safe.autoOpen !== true && safe.openExternal !== true
      },
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingSameItemMatchRows({ matchedGroups:matchedGroups }),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : blockedReasons,
      userFacingSummary:{
        title:"同款候选识别",
        resultLabel:status === "ready" ? "同款识别结构已准备" : (status === "blocked" ? "同款识别已阻断" : "同款识别仍需复核"),
        caveat:CAVEAT,
        redacted:true
      },
      externalDeepLinkSafetySummary:clone(safe.externalDeepLinkSafetySummary || null),
      searchParameterPrefillSummary:clone(safe.searchParameterPrefillSummary || null),
      jumpToPlatformHandoffPreviewSummary:clone(safe.jumpToPlatformHandoffPreviewSummary || null),
      externalDeepLinkSafetyStatus:text(safe.externalDeepLinkSafetyStatus || obj(safe.externalDeepLinkSafetySummary).status || ""),
      searchPrefillStatus:text(safe.searchPrefillStatus || obj(safe.searchParameterPrefillSummary).status || ""),
      handoffPreviewStatus:text(safe.handoffPreviewStatus || obj(safe.jumpToPlatformHandoffPreviewSummary).status || ""),
      safeToProceedWithSandboxDeepLinkCandidate:safe.safeToProceedWithSandboxDeepLinkCandidate === true,
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingSameItemMatcher(input) {
    try {
      return sanitizeGlobalShoppingSameItemMatcher(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSameItemMatcher({ status:"failed_safe", matchedGroups:[], blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingSameItemMatcherAuditDraft(input) {
    const matcher = buildGlobalShoppingSameItemMatcher(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SAME_ITEM_MATCHER_AUDIT_DRAFT",
      matcherName:MATCHER_NAME,
      appVersion:GLOBAL_SHOPPING_SAME_ITEM_MATCHER_VERSION,
      status:matcher.status,
      groupCount:matcher.matchedGroups.length,
      rowCount:matcher.rows.length,
      blockedReasons:matcher.blockedReasons,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingSameItemMatcher = {
    GLOBAL_SHOPPING_SAME_ITEM_MATCHER_VERSION,
    MATCHER_NAME,
    buildGlobalShoppingSameItemMatcher,
    matchGlobalShoppingSameItemCandidates,
    evaluateGlobalShoppingSameItemMatch,
    buildGlobalShoppingSameItemMatchRows,
    buildGlobalShoppingSameItemMatcherAuditDraft,
    sanitizeGlobalShoppingSameItemMatcher
  };
})();
