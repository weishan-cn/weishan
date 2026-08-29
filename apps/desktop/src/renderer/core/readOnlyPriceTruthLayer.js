;(function () {
  "use strict";

  const VERSION = "4.4.0";
  const MODULE_NAME = "read_only_price_truth_layer_v1";
  const PRICE_COMPLETENESS = Object.freeze(["TOTAL_CONFIRMED", "PARTIAL_PRICE", "BASE_ONLY", "UNKNOWN_COMPONENTS"]);
  const EVIDENCE_TRUTH_CLASSES = Object.freeze(["REAL_PROVIDER_PRICE", "SANDBOX_TEST_DATA", "FIXTURE_TEST_DATA", "INDICATIVE_PRICE", "NO_VERIFIED_PRICE"]);
  const SOURCE_TYPES = Object.freeze(["PROVIDER_PRODUCTION_READ_ONLY", "PROVIDER_PRODUCTION_TRANSACTIONAL", "PROVIDER_TEST_API", "PUBLIC_READ_ONLY", "AFFILIATE_FEED", "PUBLIC_WEB_RESULT", "MANUAL_HANDOFF", "SANDBOX", "MOCK", "FIXTURE"]);
  const DOMAINS = Object.freeze(["FLIGHT", "HOTEL", "PRODUCT"]);
  const AVAILABILITY = Object.freeze(["AVAILABLE", "LIMITED", "UNAVAILABLE", "UNKNOWN"]);
  const PRICE_BASIS = Object.freeze(["ITEM_TOTAL", "TOTAL_STAY", "PER_NIGHT", "TOTAL_ITINERARY", "UNKNOWN"]);
  const SECRET_KEY_RE = /(secret|token|password|authorization|api[_-]?key|private[_-]?key|cookie)/i;

  function text(value) { return String(value == null ? "" : value).trim(); }
  function upper(value) { return text(value).toUpperCase(); }
  function finiteAmount(value) {
    if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
    if (typeof value === "string" && /^\d+(?:\.\d{1,6})?$/.test(value.trim())) {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    }
    return null;
  }
  function enumValue(value, values, fallback) {
    const normalized = upper(value);
    return values.indexOf(normalized) >= 0 ? normalized : fallback;
  }
  function isoInstant(value) {
    const raw = text(value);
    const parsed = Date.parse(raw);
    return /^\d{4}-\d{2}-\d{2}T/.test(raw) && Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  }
  function calendarDate(value) {
    const raw = text(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const parsed = new Date(raw + "T00:00:00.000Z");
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw ? raw : null;
  }
  function currency(value) {
    const normalized = upper(value);
    return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
  }
  function identifier(value, max) {
    const normalized = text(value);
    return normalized && normalized.length <= (max || 240) && !/[\u0000-\u001f\u007f]/.test(normalized) ? normalized : null;
  }
  function containsSecretLikeField(value) {
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return SECRET_KEY_RE.test(key) || containsSecretLikeField(value[key]);
    });
  }
  function safeHttpsUrl(value) {
    const raw = text(value);
    if (!raw) return null;
    try {
      const url = new URL(raw);
      const local = /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname);
      const secret = Array.from(url.searchParams.keys()).some(function (key) { return SECRET_KEY_RE.test(key); });
      if (url.protocol !== "https:" || url.username || url.password || local || secret) return null;
      return url.toString();
    } catch (error) {
      return null;
    }
  }
  function boundary() {
    return Object.freeze({
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false,
      purchaseAuthority:false,
      bookingAuthority:false,
      paymentAuthority:false,
      ticketIssuanceAuthority:false,
      emailSendAuthority:false,
      providerCommissionAffectsRecommendation:false
    });
  }
  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freeze(value[key]); });
    return Object.freeze(value);
  }
  function result(payload) { return freeze(Object.assign({}, payload, boundary())); }

  function normalizeAirportSet(value) {
    const input = Array.isArray(value) ? value : [value];
    const codes = input.map(upper).filter(function (code) { return /^[A-Z]{3}$/.test(code); });
    return Array.from(new Set(codes)).sort();
  }

  function nonNegativeInteger(value) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
  }

  function buildProductContext(raw) {
    const itemId = identifier(raw.itemId || raw.productId, 160);
    const productName = identifier(raw.productName || raw.title, 240);
    const variant = identifier(raw.variant, 160);
    const condition = enumValue(raw.condition, ["NEW", "USED", "REFURBISHED", "UNKNOWN"], "UNKNOWN");
    if (!itemId && !productName) return { success:false, code:"PRODUCT_IDENTITY_INVALID" };
    return {
      success:true,
      itemId:itemId,
      productName:productName,
      variant:variant,
      condition:condition,
      identityKey:[itemId || productName, variant || "UNKNOWN_VARIANT", condition].join("|")
    };
  }

  function buildHotelContext(raw) {
    const propertyId = identifier(raw.propertyId, 160);
    const propertyName = identifier(raw.propertyName || raw.hotelName, 240);
    const checkIn = calendarDate(raw.checkIn);
    const checkOut = calendarDate(raw.checkOut);
    const rooms = nonNegativeInteger(raw.rooms);
    const adults = nonNegativeInteger(raw.adults);
    const children = nonNegativeInteger(raw.children == null ? 0 : raw.children);
    const roomType = identifier(raw.roomType, 160);
    const ratePlan = identifier(raw.ratePlan, 160);
    const nights = checkIn && checkOut ? Math.round((Date.parse(checkOut + "T00:00:00.000Z") - Date.parse(checkIn + "T00:00:00.000Z")) / 86400000) : 0;
    if ((!propertyId && !propertyName) || !checkIn || !checkOut || nights < 1) return { success:false, code:"HOTEL_CONTEXT_INVALID" };
    if (!rooms || !adults || children === null) return { success:false, code:"HOTEL_OCCUPANCY_INVALID" };
    return {
      success:true,
      propertyId:propertyId,
      propertyName:propertyName,
      checkIn:checkIn,
      checkOut:checkOut,
      nights:nights,
      rooms:rooms,
      adults:adults,
      children:children,
      roomType:roomType,
      ratePlan:ratePlan,
      identityKey:[propertyId || propertyName, checkIn, checkOut, rooms, adults, children, roomType || "UNKNOWN_ROOM", ratePlan || "UNKNOWN_RATE"].join("|")
    };
  }

  function normalizePriceEvidence(input, options) {
    const raw = input && typeof input === "object" ? input : {};
    const opts = options && typeof options === "object" ? options : {};
    if (containsSecretLikeField(raw)) return result({ success:false, code:"SECRET_LIKE_INPUT_REJECTED" });

    const domain = enumValue(raw.domain, DOMAINS, null);
    const sourceType = enumValue(raw.sourceType, SOURCE_TYPES, null);
    const truthClass = enumValue(raw.evidenceTruthClass, EVIDENCE_TRUTH_CLASSES, "NO_VERIFIED_PRICE");
    const retrievedAt = isoInstant(raw.retrievedAt);
    const evaluatedAt = isoInstant(opts.evaluatedAt || raw.evaluatedAt || new Date().toISOString());
    const maxAgeSeconds = Number.isSafeInteger(opts.maxAgeSeconds) && opts.maxAgeSeconds >= 30 ? opts.maxAgeSeconds : 900;
    const ageSeconds = retrievedAt && evaluatedAt ? Math.round((Date.parse(evaluatedAt) - Date.parse(retrievedAt)) / 1000) : null;
    const evidenceFreshness = ageSeconds === null || ageSeconds < 0 ? "UNKNOWN" : (ageSeconds <= maxAgeSeconds ? "CURRENT" : "STALE");
    const totalPrice = finiteAmount(raw.totalPrice);
    const basePrice = finiteAmount(raw.basePrice !== undefined ? raw.basePrice : raw.baseFare);
    const taxes = finiteAmount(raw.taxes);
    const fees = finiteAmount(raw.fees);
    const shipping = finiteAmount(raw.shipping);
    const priceCompleteness = enumValue(raw.priceCompleteness, PRICE_COMPLETENESS, "UNKNOWN_COMPONENTS");
    const isoCurrency = currency(raw.currency);
    const availabilityStatus = enumValue(raw.availabilityStatus, AVAILABILITY, "UNKNOWN");
    const sourceId = identifier(raw.sourceId, 160);
    const sourceName = identifier(raw.sourceName, 160);
    const handoff = safeHttpsUrl(raw.deepLink || raw.manualHandoff);
    const testSource = ["PROVIDER_TEST_API", "SANDBOX", "MOCK", "FIXTURE"].indexOf(sourceType) >= 0;
    const realTruthAllowed = truthClass === "REAL_PROVIDER_PRICE" && !testSource && ["PROVIDER_PRODUCTION_READ_ONLY", "PUBLIC_READ_ONLY"].indexOf(sourceType) >= 0;
    const originAirports = normalizeAirportSet(raw.originAirports || raw.origin);
    const destinationAirports = normalizeAirportSet(raw.destinationAirports || raw.destination);
    const departureDate = calendarDate(raw.departureDate);
    const priceBasis = enumValue(raw.priceBasis, PRICE_BASIS, domain === "FLIGHT" ? "TOTAL_ITINERARY" : "UNKNOWN");
    const productContext = domain === "PRODUCT" ? buildProductContext(raw) : null;
    const hotelContext = domain === "HOTEL" ? buildHotelContext(raw) : null;

    if (!domain || !sourceType || !sourceId || !sourceName) return result({ success:false, code:"SOURCE_METADATA_INVALID" });
    if (truthClass === "REAL_PROVIDER_PRICE" && !realTruthAllowed) return result({ success:false, code:"REAL_PRICE_SOURCE_CLASS_INVALID" });
    if (domain === "FLIGHT" && (!originAirports.length || !destinationAirports.length || !departureDate)) return result({ success:false, code:"FLIGHT_CONTEXT_INVALID" });
    if (productContext && productContext.success !== true) return result({ success:false, code:productContext.code });
    if (hotelContext && hotelContext.success !== true) return result({ success:false, code:hotelContext.code });
    if (domain === "PRODUCT" && priceBasis !== "ITEM_TOTAL") return result({ success:false, code:"PRODUCT_PRICE_BASIS_INVALID" });
    if (domain === "HOTEL" && ["TOTAL_STAY", "PER_NIGHT"].indexOf(priceBasis) < 0) return result({ success:false, code:"HOTEL_PRICE_BASIS_INVALID" });
    if (domain === "FLIGHT" && priceBasis !== "TOTAL_ITINERARY") return result({ success:false, code:"FLIGHT_PRICE_BASIS_INVALID" });
    if (totalPrice !== null && (!isoCurrency || !retrievedAt)) return result({ success:false, code:"NUMERIC_PRICE_EVIDENCE_INCOMPLETE" });
    if (priceCompleteness === "TOTAL_CONFIRMED" && totalPrice === null) return result({ success:false, code:"CONFIRMED_TOTAL_MISSING" });

    const identityKey = domain === "FLIGHT"
      ? [originAirports.join(","), destinationAirports.join(","), departureDate, text(raw.departureTime), text(raw.arrivalTime), upper(raw.carrier), upper(raw.flightNumber), upper(raw.cabin)]
        .join("|")
      : (domain === "PRODUCT" ? productContext.identityKey : hotelContext.identityKey);
    const comparisonContextKey = domain === "FLIGHT"
      ? [originAirports.join(","), destinationAirports.join(","), departureDate, upper(raw.cabin)].join("|")
      : (domain === "PRODUCT"
        ? productContext.identityKey
        : [hotelContext.checkIn, hotelContext.checkOut, hotelContext.rooms, hotelContext.adults, hotelContext.children].join("|"));
    const basisComparable = domain === "HOTEL" ? priceBasis === "TOTAL_STAY" : true;
    const comparable = realTruthAllowed && evidenceFreshness === "CURRENT" && availabilityStatus === "AVAILABLE" && totalPrice !== null && isoCurrency && priceCompleteness === "TOTAL_CONFIRMED" && basisComparable;

    return result({
      success:true,
      evidence:freeze({
        domain:domain,
        sourceId:sourceId,
        sourceName:sourceName,
        sourceType:sourceType,
        retrievedAt:retrievedAt,
        currency:isoCurrency,
        basePrice:basePrice,
        baseFare:basePrice,
        taxes:taxes,
        fees:fees,
        shipping:shipping,
        totalPrice:totalPrice,
        priceCompleteness:priceCompleteness,
        priceBasis:priceBasis,
        availabilityStatus:availabilityStatus,
        itemId:productContext && productContext.itemId || null,
        productName:productContext && productContext.productName || null,
        variant:productContext && productContext.variant || null,
        condition:productContext && productContext.condition || null,
        propertyId:hotelContext && hotelContext.propertyId || null,
        propertyName:hotelContext && hotelContext.propertyName || null,
        checkIn:hotelContext && hotelContext.checkIn || null,
        checkOut:hotelContext && hotelContext.checkOut || null,
        nights:hotelContext && hotelContext.nights || null,
        rooms:hotelContext && hotelContext.rooms || null,
        adults:hotelContext && hotelContext.adults || null,
        children:hotelContext && hotelContext.children !== undefined ? hotelContext.children : null,
        roomType:hotelContext && hotelContext.roomType || null,
        ratePlan:hotelContext && hotelContext.ratePlan || null,
        origin:identifier(raw.originName || raw.origin, 160),
        destination:identifier(raw.destinationName || raw.destination, 160),
        originAirports:originAirports,
        destinationAirports:destinationAirports,
        departureDate:departureDate,
        departureTime:identifier(raw.departureTime, 40),
        arrivalTime:identifier(raw.arrivalTime, 40),
        flightNumber:identifier(raw.flightNumber, 40),
        carrier:identifier(raw.carrier, 160),
        cabin:identifier(raw.cabin, 80),
        baggage:identifier(raw.baggage, 240),
        refundability:identifier(raw.refundability, 120),
        deepLink:handoff,
        evidenceFreshness:evidenceFreshness,
        freshnessAgeSeconds:ageSeconds,
        evidenceTruthClass:truthClass,
        identityKey:identityKey,
        comparisonContextKey:comparisonContextKey,
        comparableAsVerifiedTotal:Boolean(comparable),
        displayAsLiveCurrentPrice:Boolean(realTruthAllowed && evidenceFreshness === "CURRENT" && totalPrice !== null),
        rawProviderResponsePersisted:false,
        rendererCredentialAccess:false
      })
    });
  }

  function comparePriceEvidence(records) {
    const valid = (Array.isArray(records) ? records : []).filter(function (record) { return record && record.success === true && record.evidence; }).map(function (record) { return record.evidence; });
    const byIdentitySource = new Map();
    valid.forEach(function (evidence) {
      const key = evidence.identityKey + "|" + evidence.sourceId + "|" + String(evidence.totalPrice) + "|" + String(evidence.currency);
      if (!byIdentitySource.has(key) || Date.parse(evidence.retrievedAt || 0) > Date.parse(byIdentitySource.get(key).retrievedAt || 0)) byIdentitySource.set(key, evidence);
    });
    const deduplicated = Array.from(byIdentitySource.values());
    const comparable = deduplicated.filter(function (evidence) { return evidence.comparableAsVerifiedTotal; });
    const currencies = Array.from(new Set(comparable.map(function (evidence) { return evidence.currency; })));
    const comparisonContexts = Array.from(new Set(comparable.map(function (evidence) { return evidence.comparisonContextKey; })));
    const identities = Array.from(new Set(comparable.map(function (evidence) { return evidence.identityKey; })));
    const conflicts = [];
    identities.forEach(function (identity) {
      const same = comparable.filter(function (item) { return item.identityKey === identity; });
      const prices = Array.from(new Set(same.map(function (item) { return item.currency + ":" + item.totalPrice; })));
      if (prices.length > 1) conflicts.push({ identityKey:identity, observations:same });
    });
    if (!comparable.length) return result({ success:true, comparable:false, reason:"NO_COMPARABLE_VERIFIED_TOTAL", winner:null, observations:deduplicated, conflicts:conflicts });
    if (comparisonContexts.length !== 1) return result({ success:true, comparable:false, reason:"MATERIAL_SEARCH_CONTEXT_MISMATCH", winner:null, observations:deduplicated, comparisonContexts:comparisonContexts, conflicts:conflicts });
    if (currencies.length !== 1) return result({ success:true, comparable:false, reason:"CROSS_CURRENCY_CONVERSION_UNAVAILABLE", winner:null, observations:deduplicated, currencyGroups:currencies, conflicts:conflicts });
    const ranked = comparable.slice().sort(function (a, b) { return a.totalPrice - b.totalPrice || a.sourceName.localeCompare(b.sourceName); });
    return result({ success:true, comparable:true, reason:null, winner:ranked[0], observations:deduplicated, ranked:ranked, conflicts:conflicts });
  }

  function buildFlightSearchIntent(input) {
    const raw = input && typeof input === "object" ? input : { rawText:input };
    const normalizer = window.WeishanFlightIntentNormalizer;
    const normalized = normalizer && typeof normalizer.normalizeFlightIntent === "function"
      ? normalizer.normalizeFlightIntent(raw.rawText || raw.text || raw)
      : null;
    const cityMap = {
      "成都":{ cityCode:"CTU", airports:["CTU", "TFU"] },
      "上海":{ cityCode:"SHA", airports:["PVG", "SHA"] }
    };
    if (!normalized || normalized.status !== "ready") return result({ success:false, code:"FLIGHT_SEARCH_INTENT_INCOMPLETE", normalizedIntent:normalized });
    const origin = cityMap[normalized.route.originCity];
    const destination = cityMap[normalized.route.destinationCity];
    if (!origin || !destination) return result({ success:false, code:"CITY_AIRPORT_GROUP_NOT_RESOLVED", normalizedIntent:normalized });
    return result({
      success:true,
      search:freeze({
        originCity:normalized.route.originCity,
        destinationCity:normalized.route.destinationCity,
        originCityCode:origin.cityCode,
        destinationCityCode:destination.cityCode,
        originAirports:origin.airports.slice(),
        destinationAirports:destination.airports.slice(),
        departureDate:normalized.departureDate,
        tripType:"ONE_WAY",
        passengers:{ adults:1, children:0, infants:0 },
        passengerAssumption:"未指定乘客人数，按现有产品默认值 1 位成人查询",
        cabin:"ECONOMY",
        sortPreference:normalized.sortIntent === "lowest_price" ? "LOWEST_VERIFIED_TOTAL" : "BALANCED"
      })
    });
  }

  function buildFlightDataSourceInventory() {
    return freeze([
      { name:"Flight Provider Sandbox", type:"SANDBOX", currentStatus:"OFFLINE_TEST_ONLY", realPriceCapable:false, livePriceCapable:false, accountRequired:false, credentialRequired:false, productionAccessRequired:false, readOnlyCapable:true, bookingCapable:false, currentlyEnabled:true, currentlySafeToUse:true, constraint:"Predictable fixture/test evidence only; never live." },
      { name:"Amadeus Self-Service", type:"PROVIDER_TEST_API", currentStatus:"DECOMMISSIONED", realPriceCapable:false, livePriceCapable:false, accountRequired:true, credentialRequired:true, productionAccessRequired:true, readOnlyCapable:false, bookingCapable:false, currentlyEnabled:false, currentlySafeToUse:false, constraint:"Repository source truth records Self-Service retirement; current access is enterprise-only." },
      { name:"Duffel", type:"PROVIDER_TEST_API", currentStatus:"TEST_BLOCKED", realPriceCapable:true, livePriceCapable:true, accountRequired:true, credentialRequired:true, productionAccessRequired:true, readOnlyCapable:true, bookingCapable:true, currentlyEnabled:false, currentlySafeToUse:false, constraint:"Test prices are not real; live mode requires an eligible commercial account and approved access." },
      { name:"Skyscanner Live Prices", type:"PROVIDER_PRODUCTION_READ_ONLY", currentStatus:"PENDING_EXTERNAL_APPROVAL", realPriceCapable:true, livePriceCapable:true, accountRequired:true, credentialRequired:true, productionAccessRequired:true, readOnlyCapable:true, bookingCapable:false, currentlyEnabled:false, currentlySafeToUse:false, constraint:"Partnership approval and API key are required." },
      { name:"Travelport Air Search", type:"PROVIDER_PRODUCTION_READ_ONLY", currentStatus:"BLOCKED_CREDENTIAL_MISSING", realPriceCapable:true, livePriceCapable:true, accountRequired:true, credentialRequired:true, productionAccessRequired:true, readOnlyCapable:true, bookingCapable:true, currentlyEnabled:false, currentlySafeToUse:false, constraint:"Enterprise provisioning and credentials required." },
      { name:"Sabre Bargain Finder Max", type:"PROVIDER_PRODUCTION_READ_ONLY", currentStatus:"BLOCKED_CREDENTIAL_MISSING", realPriceCapable:true, livePriceCapable:true, accountRequired:true, credentialRequired:true, productionAccessRequired:true, readOnlyCapable:true, bookingCapable:true, currentlyEnabled:false, currentlySafeToUse:false, constraint:"Enterprise provisioning and credentials required." },
      { name:"Google Flights", type:"MANUAL_HANDOFF", currentStatus:"MANUAL_SEARCH_ONLY", realPriceCapable:false, livePriceCapable:false, accountRequired:false, credentialRequired:false, productionAccessRequired:false, readOnlyCapable:false, bookingCapable:false, currentlyEnabled:true, currentlySafeToUse:true, constraint:"Human-controlled search handoff; no price is ingested." },
      { name:"Trip.com / 携程", type:"MANUAL_HANDOFF", currentStatus:"MANUAL_SEARCH_ONLY", realPriceCapable:false, livePriceCapable:false, accountRequired:false, credentialRequired:false, productionAccessRequired:false, readOnlyCapable:false, bookingCapable:false, currentlyEnabled:true, currentlySafeToUse:true, constraint:"Human-controlled search handoff; no price is ingested." },
      { name:"全网搜索", type:"PUBLIC_WEB_RESULT", currentStatus:"MANUAL_SEARCH_ONLY", realPriceCapable:false, livePriceCapable:false, accountRequired:false, credentialRequired:false, productionAccessRequired:false, readOnlyCapable:false, bookingCapable:false, currentlyEnabled:true, currentlySafeToUse:true, constraint:"No scraping or automated extraction; handoff only." }
    ]);
  }

  function buildPriceUserState(input) {
    const raw = input && typeof input === "object" ? input : {};
    const records = Array.isArray(raw.records) ? raw.records : [];
    const comparison = comparePriceEvidence(records);
    const verified = comparison.observations.filter(function (evidence) {
      return evidence.evidenceTruthClass === "REAL_PROVIDER_PRICE" && evidence.displayAsLiveCurrentPrice;
    });
    const cards = verified.slice().sort(function (a, b) {
      if (a.currency === b.currency && a.totalPrice !== null && b.totalPrice !== null) return a.totalPrice - b.totalPrice;
      return String(a.currency || "").localeCompare(String(b.currency || "")) || a.sourceName.localeCompare(b.sourceName);
    }).slice(0, 5).map(function (evidence) {
      return freeze({
        price:evidence.totalPrice,
        currency:evidence.currency,
        source:evidence.sourceName,
        retrievedAt:evidence.retrievedAt,
        freshness:evidence.evidenceFreshness,
        priceCompleteness:evidence.priceCompleteness,
        priceBasis:evidence.priceBasis,
        domain:evidence.domain,
        productName:evidence.productName,
        variant:evidence.variant,
        condition:evidence.condition,
        propertyName:evidence.propertyName,
        checkIn:evidence.checkIn,
        checkOut:evidence.checkOut,
        nights:evidence.nights,
        occupancy:evidence.domain === "HOTEL" ? { rooms:evidence.rooms, adults:evidence.adults, children:evidence.children } : null,
        roomType:evidence.roomType,
        ratePlan:evidence.ratePlan,
        carrier:evidence.carrier,
        flightNumber:evidence.flightNumber,
        route:[evidence.origin, evidence.destination].filter(Boolean).join(" → "),
        departureTime:evidence.departureTime,
        arrivalTime:evidence.arrivalTime,
        taxesKnown:evidence.taxes !== null,
        feesKnown:evidence.fees !== null,
        shippingKnown:evidence.shipping !== null,
        handoffUrl:evidence.deepLink,
        actionLabel:"去平台确认"
      });
    });
    const loading = raw.status === "LOADING";
    const sourceFailed = raw.status === "SOURCE_UNAVAILABLE";
    const domain = enumValue(raw.domain || (cards[0] && cards[0].domain), DOMAINS, "PRODUCT");
    const pendingLabel = domain === "HOTEL" ? "酒店搜索结果待验证" : (domain === "FLIGHT" ? "机票搜索结果待验证" : "商品搜索结果待验证");
    return result({
      success:true,
      status:loading ? "LOADING" : (cards.length ? "VERIFIED_RESULTS" : (sourceFailed ? "SOURCE_UNAVAILABLE" : "NO_VERIFIED_RESULTS")),
      domain:domain,
      title:loading ? "正在查找当前价格…" : (cards.length ? "已找到 " + cards.length + " 个可验证报价" : "搜索条件已准备 · " + pendingLabel),
      message:loading ? "正在向已授权的只读价格源查询。" : (cards.length ? "价格可能变化，以平台最终页面为准。" : (sourceFailed ? "价格来源暂时不可用，请稍后再试或前往平台确认。" : "暂未获取到可验证的实时报价（暂无真实价格结果）")),
      cards:cards,
      verifiedCount:cards.length,
      comparable:comparison.comparable,
      winner:comparison.winner,
      sourceConflicts:comparison.conflicts,
      manualHandoffAvailable:raw.manualHandoffAvailable !== false,
      manualHandoffLabel:"去平台确认",
      testEvidenceSuppressedFromLiveUi:records.some(function (record) { return record && record.success && record.evidence && ["SANDBOX_TEST_DATA", "FIXTURE_TEST_DATA"].indexOf(record.evidence.evidenceTruthClass) >= 0; }),
      aiRequired:false
    });
  }

  function createSearchCoordinator(fetchEvidence) {
    let generation = 0;
    let active = null;
    return freeze({
      search:function (query) {
        generation += 1;
        const current = generation;
        if (active && typeof active.abort === "function") active.abort();
        const controller = typeof AbortController === "function" ? new AbortController() : { signal:{ aborted:false }, abort:function () { this.signal.aborted = true; } };
        active = controller;
        return Promise.resolve().then(function () { return fetchEvidence(query, { signal:controller.signal, requestGeneration:current }); }).then(function (value) {
          if (current !== generation || controller.signal.aborted) return result({ success:false, code:"STALE_PRICE_RESPONSE_IGNORED", stale:true });
          active = null;
          return result({ success:true, stale:false, value:value });
        }, function () {
          if (current !== generation || controller.signal.aborted) return result({ success:false, code:"STALE_PRICE_RESPONSE_IGNORED", stale:true });
          active = null;
          return result({ success:false, code:"PRICE_SOURCE_UNAVAILABLE", stale:false });
        });
      },
      cancel:function () { generation += 1; if (active && typeof active.abort === "function") active.abort(); active = null; },
      getGeneration:function () { return generation; }
    });
  }

  window.WeishanReadOnlyPriceTruthLayer = Object.freeze({
    VERSION,
    MODULE_NAME,
    PRICE_COMPLETENESS,
    EVIDENCE_TRUTH_CLASSES,
    SOURCE_TYPES,
    DOMAINS,
    AVAILABILITY,
    PRICE_BASIS,
    normalizePriceEvidence,
    comparePriceEvidence,
    buildFlightSearchIntent,
    buildFlightDataSourceInventory,
    buildPriceUserState,
    createSearchCoordinator,
    boundary
  });
})();
