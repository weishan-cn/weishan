;(function () {
  "use strict";

  const VERSION = "4.3.5";
  const MODULE_NAME = "cunard_public_cruise_handoff_adapter_v1";
  const HOST = "www.cunard.com";
  const BASE = "https://www.cunard.com";

  const SOURCE_SCORECARD = Object.freeze({
    SOURCE:"Cunard public cruise detail pages",
    CURRENT_ACCESS:"PUBLIC_OFFICIAL_WEBSITE",
    ACCOUNT_REQUIRED:false,
    COMMERCIAL_CONTRACT_REQUIRED:false,
    SCRAPING_REQUIRED:false,
    PUBLIC_SEARCH_URL:"YES",
    SEARCH_RECONSTRUCTION:"PARTIAL",
    SAILING_ID_IN_URL:"YES",
    DEPARTURE_DATE_IN_URL:"PAGE_CONTEXT_NOT_URL",
    SHIP_IN_URL:"PAGE_CONTEXT_NOT_URL",
    CABIN_CONTEXT_IN_URL:"YES_WHEN_CATEGORY_QUERY_PRESENT",
    PRICE_VISIBLE_PUBLICLY:"YES_ON_SELECTED_PUBLIC_PAGES",
    PRICE_BASIS_CLEAR:"YES_WHEN_CUNARD_FARE_COPY_VISIBLE",
    TAX_FEE_SEMANTICS:"PARTIAL",
    AVAILABILITY_VISIBLE:"PARTIAL",
    DEEPLINK_STABILITY:"STRONG_FOR_VOYAGE_DETAIL_PARTIAL_FOR_CABIN_QUERY",
    LOGIN_REQUIRED:false,
    CURRENTLY_USABLE:true,
    SOURCE_ROLE:"HANDOFF_ONLY_WITH_OPTIONAL_INDICATIVE_PRICE_CONTEXT"
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function upper(value) {
    return text(value).toUpperCase();
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
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
    };
  }

  function failure(code, details) {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      success:false,
      error:{ code:code, details:Array.isArray(details) ? details.slice() : [] }
    }, boundary()));
  }

  function handoffApi() {
    const api = window.WeishanTravelExactHandoffSemantics;
    return api && typeof api.classifyTravelHandoff === "function" ? api : null;
  }

  function voyageCode(value) {
    const normalized = upper(value);
    return /^[A-Z][0-9A-Z]{3,8}$/.test(normalized) ? normalized : null;
  }

  function countryPath(value) {
    const normalized = text(value || "en-us").toLowerCase();
    return /^(en-us|en-gb|en-au)$/.test(normalized) ? normalized : "en-us";
  }

  function cabinCode(value) {
    const normalized = upper(value);
    return /^[A-Z0-9_]{1,12}$/.test(normalized) ? normalized : null;
  }

  function category(value) {
    const normalized = upper(value);
    if (["INTERIOR", "OCEANVIEW", "BALCONY", "SUITE"].indexOf(normalized) >= 0) return normalized;
    if (normalized === "INSIDE") return "INTERIOR";
    if (normalized === "OUTSIDE") return "OCEANVIEW";
    return "UNKNOWN";
  }

  function calendarDate(value) {
    const result = text(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) return null;
    const date = new Date(result + "T00:00:00.000Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === result ? result : null;
  }

  function urlHasTrackingOnly(url) {
    return Array.from(url.searchParams.keys()).every(function (key) {
      return /^utm_|^(cid|icid|ref|affiliate|campaign)$/i.test(key);
    });
  }

  function hasExactVoyagePath(url, code) {
    const expected = new RegExp("^/(?:en-us|en-gb|en-au)/find-a-cruise/" + code + "/" + code + "/?$", "i");
    return expected.test(url.pathname);
  }

  function buildCunardVoyageUrl(input) {
    const safe = input || {};
    const code = voyageCode(safe.voyageCode || safe.cruiseCode || safe.sailingId);
    if (!code) return null;
    const locale = countryPath(safe.locale);
    const url = new URL(BASE + "/" + locale + "/find-a-cruise/" + code + "/" + code);
    const categoryCode = cabinCode(safe.categoryCode);
    const cruiseCode = voyageCode(safe.cruiseCode || code);
    const rateCode = cabinCode(safe.rateCode);
    const typeCode = cabinCode(safe.typeCode);
    if (categoryCode) url.searchParams.set("categoryCode", categoryCode);
    if (cruiseCode) url.searchParams.set("cruiseCode", cruiseCode);
    if (rateCode) url.searchParams.set("rateCode", rateCode);
    if (typeCode) url.searchParams.set("typeCode", typeCode);
    return url.toString();
  }

  function classifyPriceContext(input) {
    const safe = input || {};
    const amount = typeof safe.leadInPrice === "number" && Number.isFinite(safe.leadInPrice) && safe.leadInPrice >= 0 ? safe.leadInPrice : null;
    const currency = /^[A-Z]{3}$/.test(upper(safe.currency)) ? upper(safe.currency) : null;
    const basis = upper(safe.priceBasis || "");
    if (amount === null || !currency) return { priceState:"PRICE_UNAVAILABLE", amount:null, currency:null, priceBasis:"UNKNOWN_BASIS", userFacingRealPrice:false };
    if (basis === "PER_PERSON_DOUBLE_OCCUPANCY" || basis === "STARTING_FROM") {
      return { priceState:"PRICE_INDICATIVE", amount:amount, currency:currency, priceBasis:basis, userFacingRealPrice:false };
    }
    return { priceState:"PRICE_UNAVAILABLE", amount:null, currency:null, priceBasis:"UNKNOWN_BASIS", userFacingRealPrice:false };
  }

  function buildPublicCruiseHandoffCandidate(input) {
    const api = handoffApi();
    if (!api) return failure("TRAVEL_EXACT_HANDOFF_SEMANTICS_MISSING");
    const safe = input || {};
    const code = voyageCode(safe.voyageCode || safe.sailingId);
    const departureDate = calendarDate(safe.departureDate);
    const ship = text(safe.ship);
    const cabinCategory = category(safe.cabinCategory);
    const generatedUrl = safe.handoffUrl ? text(safe.handoffUrl) : buildCunardVoyageUrl(safe);
    if (!code || !departureDate || !ship || !generatedUrl) return failure("CUNARD_HANDOFF_INPUT_INVALID");
    let url;
    try {
      url = new URL(generatedUrl);
    } catch (error) {
      return failure("CUNARD_HANDOFF_URL_INVALID");
    }
    if (url.hostname.toLowerCase() !== HOST) return failure("CUNARD_HANDOFF_HOST_INVALID");
    const exactVoyagePath = hasExactVoyagePath(url, code);
    const exactCabinCandidate = Boolean(cabinCode(safe.categoryCode) || cabinCode(safe.typeCode));
    const requestedQuality = !exactVoyagePath ? "NO_HANDOFF" : (exactCabinCandidate ? "EXACT_SAILING_CABIN_HANDOFF" : "EXACT_SAILING_HANDOFF");
    const handoff = api.classifyTravelHandoff({
      travelType:"CRUISE",
      requestedQuality:requestedQuality,
      handoffUrl:url.toString(),
      allowedHosts:[HOST],
      ephemeral:Boolean(safe.ephemeral || text(safe.sessionId)),
      context:{
        sailingPreserved:exactVoyagePath,
        shipPreserved:exactVoyagePath && ship.length > 0 && !safe.shipMismatch,
        departureDatePreserved:exactVoyagePath && Boolean(departureDate) && !safe.departureDateMismatch,
        occupancyPreserved:Boolean(safe.occupancyPreserved),
        cabinCategoryPreserved:exactCabinCandidate && cabinCategory !== "UNKNOWN" && !safe.cabinMismatch,
        itineraryPreserved:exactVoyagePath,
        departurePortPreserved:exactVoyagePath && Boolean(text(safe.departurePort))
      }
    });
    const price = classifyPriceContext(safe);
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      success:true,
      sourceScorecard:SOURCE_SCORECARD,
      sourceRole:"HANDOFF_ONLY",
      provider:"cunard_public",
      cruiseLine:"Cunard",
      ship:ship,
      sailingId:code,
      departureDate:departureDate,
      cabinCategory:cabinCategory,
      priceState:price.priceState,
      indicativePrice:price.amount,
      currency:price.currency,
      priceBasis:price.priceBasis,
      priceVerified:false,
      userFacingRealPrice:false,
      handoff:handoff,
      publicBetaState:price.priceState === "PRICE_INDICATIVE" ? "BETA_READY_INDICATIVE_ONLY" : "HANDOFF_ONLY",
      apiCallCount:0,
      scraping:false,
      accountRequired:false,
      commercialContractRequired:false,
      genericHome:url.pathname === "/" || /\/(en-us|en-gb|en-au)\/?$/.test(url.pathname),
      trackingOnly:url.search ? urlHasTrackingOnly(url) : false,
      rawProviderResponsePersisted:false
    }, boundary()));
  }

  function buildSecondPassCandidateSummary() {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"READY",
      candidatesReviewed:14,
      lowFrictionCandidates:[
        { SOURCE:"Cunard public voyage detail URL", ROLE:"HANDOFF_ONLY", CURRENTLY_USABLE:true, SCRAPING_REQUIRED:false, ACCOUNT_REQUIRED:false },
        { SOURCE:"Princess public cruise search/detail pages", ROLE:"IDENTITY_OR_HANDOFF_ONLY", CURRENTLY_USABLE:"PARTIAL", SCRAPING_REQUIRED:false, ACCOUNT_REQUIRED:false },
        { SOURCE:"Expedia Group affiliate links/widgets", ROLE:"HANDOFF_OR_WIDGET_ONLY", CURRENTLY_USABLE:"ACCOUNT_REVIEW_REQUIRED", SCRAPING_REQUIRED:false, ACCOUNT_REQUIRED:true }
      ],
      bestLowFrictionCruiseSource:"Cunard public voyage detail URL",
      sourceRole:"HANDOFF_ONLY_WITH_OPTIONAL_INDICATIVE_PRICE_CONTEXT",
      realPriceCapability:"NO_LOW_FRICTION_STRUCTURED_REAL_PRICE_SOURCE_CONFIRMED",
      indicativePriceCapability:"PARTIAL_WHEN_OFFICIAL_CUNARD_FARE_COPY_VISIBLE",
      identity:"STRONG_FOR_VOYAGE_CODE_SHIP_DEPARTURE_DATE",
      exactHandoff:"PARTIAL_TO_STRONG_DEPENDING_CABIN_QUERY_CONTEXT",
      cruiseBetaState:"HANDOFF_ONLY",
      cruiseBiggestGap:"NO_LOW_FRICTION_REAL_PRICE_SOURCE"
    }, boundary()));
  }

  window.WeishanCunardPublicCruiseHandoffAdapter = Object.freeze({
    VERSION,
    MODULE_NAME,
    SOURCE_SCORECARD,
    buildCunardVoyageUrl,
    buildPublicCruiseHandoffCandidate,
    buildSecondPassCandidateSummary
  });
})();
