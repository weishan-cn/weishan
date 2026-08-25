;(function () {
  "use strict";

  const VERSION = "4.3.4";
  const MODULE_NAME = "traveltek_cruise_connect_adapter_v1";

  const OFFICIAL_SOURCES = Object.freeze({
    product:"https://www.traveltek.com/products/cruiseconnect/",
    schema:"https://schema.cruiseconnect.traveltek.net/",
    playground:"https://playground.cruiseconnect.traveltek.net/"
  });

  const SOURCE_SCORECARD = Object.freeze({
    SOURCE:"Traveltek Cruise Connect",
    CURRENT_2026_ACCESS:"COMMERCIAL_CREDENTIALS_REQUIRED",
    ACCOUNT_REQUIRED:true,
    SALES_CONTACT_REQUIRED:true,
    FREE_TEST:"NOT_CONFIRMED",
    SANDBOX:"DOCUMENTED_SANDBOX_ENDPOINT_BUT_CREDENTIALS_REQUIRED",
    PAID:"LIKELY_COMMERCIAL",
    KYC:"BUSINESS_APPROVAL_LIKELY",
    BUSINESS_APPROVAL:true,
    REAL_PRICE:"YES_FOR_AUTHORIZED_USERS",
    CABIN_PRICE:"LEAD_IN_BY_CABIN_TYPE_IN_SEARCH; DETAILED_CABIN_PRICE_REQUIRES_CRUISE_DETAIL_QUERY",
    OCCUPANCY_PRICE:"REQUIRES_DETAIL_QUERY_OR_CREDENTIAL_VALIDATION",
    TAX_FEE_DETAIL:"FARE_AND_TAXES_FEES_PORT_EXPENSES_DOCUMENTED",
    AVAILABILITY:"SEARCH_SUMMARY_LIMITED; DETAIL_QUERY_REQUIRED_FOR_CABIN_AVAILABILITY",
    HANDOFF:"API/BOOKING_FLOW_EXISTS_BUT_PUBLIC_NON_BOOKING_HANDOFF_PERMISSION_REQUIRED",
    ACCESS_FRICTION:"HIGH",
    PUBLIC_BETA_VALUE:"HIGH_SCHEMA_VALUE_COMMERCIAL_BLOCKED"
  });

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    const result = Number(value);
    return Number.isFinite(result) && result >= 0 ? result : null;
  }

  function first(value) {
    return Array.isArray(value) && value.length ? value[0] : null;
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

  function failure(code, stage) {
    return deepFreeze(Object.assign({ moduleName:MODULE_NAME, version:VERSION, success:false, error:{ code:code, stage:stage || MODULE_NAME } }, boundary()));
  }

  function truthApi() {
    const api = window.WeishanGlobalTravelPriceTruthFoundation;
    return api && typeof api.normalizeCruiseOffer === "function" ? api : null;
  }

  function handoffApi() {
    const api = window.WeishanTravelExactHandoffSemantics;
    return api && typeof api.classifyTravelHandoff === "function" ? api : null;
  }

  function cabinType(value) {
    const normalized = text(value).toUpperCase();
    if (normalized === "OUTSIDE") return "OCEANVIEW";
    if (normalized === "INSIDE") return "INTERIOR";
    if (["INTERIOR", "OCEANVIEW", "BALCONY", "SUITE"].indexOf(normalized) >= 0) return normalized;
    return "UNKNOWN";
  }

  function port(value) {
    return text(value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "UNK";
  }

  function mapSearchResult(result, options) {
    const raw = clone(result);
    const selectedPrice = first(raw && raw.leadInPrices);
    if (!raw || !selectedPrice) return null;
    const fare = number(selectedPrice.fare);
    const taxes = number(selectedPrice.taxesFeesAndPortExpenses);
    const total = fare !== null && taxes !== null ? fare + taxes : null;
    const environment = options && options.environment === "production" ? "production" : "offline";
    return {
      sourcePolicy:{
        provider:"traveltek_cruise_connect",
        sourceType:"CRUISE_AGGREGATOR",
        priceAuthority:environment === "production" ? "AUTHORITATIVE" : "AUTHORIZED_SANDBOX",
        allowedHandoffHosts:["schema.cruiseconnect.traveltek.net", "www.traveltek.com"],
        maxAgeSeconds:1800
      },
      cruiseLine:text(raw.supplierName || raw.cruiseLine || raw.lineName || raw.ship && raw.ship.cruiseLine || "UNKNOWN"),
      ship:text(raw.ship && raw.ship.name || raw.shipName || "UNKNOWN"),
      shipId:raw.ship && (raw.ship.id || raw.ship.code),
      sailingId:text(raw.id || raw.cruiseId),
      itineraryId:raw.product && raw.product.id || raw.productId || null,
      departurePort:port(raw.embarkPort),
      returnPort:port(raw.disembarkPort || raw.returnPort),
      portsOfCall:Array.isArray(raw.itineraryItems) ? raw.itineraryItems.map(function (item) { return port(item.portCode || item.portName); }) : [],
      destinationRegion:text(raw.generalDestination || raw.destination || "UNKNOWN"),
      departureDate:raw.embarkDate,
      returnDate:raw.disembarkDate,
      durationNights:Number(raw.duration),
      durationDays:Number(raw.duration) + 1,
      market:text(raw.market || "US"),
      occupancy:{ adults:2, children:0, infants:0, cabins:1 },
      cabinCategory:cabinType(selectedPrice.cabinType),
      cabinSubcategory:text(selectedPrice.cabinDescription || selectedPrice.cabinGrade || "UNKNOWN"),
      cabinAssignment:"UNKNOWN",
      fareBasis:text(selectedPrice.rateCode || "UNKNOWN"),
      baseFare:fare,
      portTaxes:taxes,
      governmentFees:null,
      portFees:null,
      mandatoryFees:null,
      gratuities:null,
      totalPrice:total,
      price:total === null ? fare : total,
      currency:selectedPrice.currency || raw.currency,
      priceBasis:"STARTING_FROM",
      costCompleteness:total === null ? "BASE_ONLY" : "PARTIAL_TOTAL",
      taxFeeBasis:taxes === null ? "UNKNOWN" : "PARTIAL",
      availability:selectedPrice.available === false ? "UNKNOWN" : "CABIN_CATEGORY_AVAILABLE",
      promotion:"UNKNOWN_PROMOTION",
      observedAt:raw.observedAt,
      evaluatedAt:raw.evaluatedAt,
      handoffQuality:"EXACT_SAILING_HANDOFF",
      handoffUrl:OFFICIAL_SOURCES.schema
    };
  }

  function normalizeCruiseSearchResult(result, options) {
    const api = truthApi();
    if (!api) return failure("TRAVEL_PRICE_TRUTH_FOUNDATION_MISSING", "DEPENDENCY");
    const mapped = mapSearchResult(result, options || {});
    if (!mapped) return failure("TRAVELTEK_SEARCH_RESULT_INVALID", "MAPPING");
    const normalized = api.normalizeCruiseOffer(mapped);
    const handoff = handoffApi() ? handoffApi().classifyTravelHandoff({
      travelType:"CRUISE",
      requestedQuality:mapped.handoffQuality,
      handoffUrl:mapped.handoffUrl,
      allowedHosts:mapped.sourcePolicy.allowedHandoffHosts,
      context:{
        sailingPreserved:Boolean(mapped.sailingId),
        shipPreserved:Boolean(mapped.ship && mapped.ship !== "UNKNOWN"),
        departureDatePreserved:Boolean(mapped.departureDate),
        occupancyPreserved:false,
        cabinCategoryPreserved:false,
        itineraryPreserved:Boolean(mapped.itineraryId || mapped.portsOfCall.length),
        departurePortPreserved:Boolean(mapped.departurePort)
      }
    }) : null;
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      success:normalized.success === true,
      status:normalized.success ? "NORMALIZED" : "FAILED",
      sourceScorecard:SOURCE_SCORECARD,
      officialSources:OFFICIAL_SOURCES,
      selectedSource:"Traveltek Cruise Connect",
      realSourceClassification:"COMMERCIAL_BLOCKED",
      dataClass:normalized.success ? normalized.evidence.dataClass : null,
      searchSummaryOnly:true,
      leadInPriceOnly:true,
      exactCabinPrice:false,
      exactOccupancyPrice:false,
      publicHandoffReady:false,
      handoff:handoff,
      liveApiCall:false,
      apiCredentialAccess:false,
      rawProviderResponsePersisted:false,
      normalized:normalized
    }, boundary()));
  }

  function buildCruiseSourceScorecard() {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      selectedSource:"Traveltek Cruise Connect",
      sourceScorecard:SOURCE_SCORECARD,
      alternatives:[
        { SOURCE:"Revelex", CURRENT_2026_ACCESS:"ENTERPRISE_SALES_REQUIRED", REAL_PRICE:"CLAIMED", ACCESS_FRICTION:"HIGH", PUBLIC_BETA_VALUE:"MEDIUM_HIGH" },
        { SOURCE:"Odysseus Solutions", CURRENT_2026_ACCESS:"ENTERPRISE_SALES_REQUIRED", REAL_PRICE:"CLAIMED", ACCESS_FRICTION:"HIGH", PUBLIC_BETA_VALUE:"MEDIUM" },
        { SOURCE:"Direct cruise-line travel-agent portals", CURRENT_2026_ACCESS:"AGENCY_CONTRACT_OR_MANAGER_APPROVAL_REQUIRED", REAL_PRICE:"YES_IN_PORTAL", ACCESS_FRICTION:"HIGH", PUBLIC_BETA_VALUE:"LOW_FOR_API_FOUNDATION" },
        { SOURCE:"Commission-only affiliate cruise sources", CURRENT_2026_ACCESS:"NOT_PRIORITIZED", REAL_PRICE:"INSUFFICIENT_UNLESS_STRUCTURED_RATE_FEED_EXISTS", ACCESS_FRICTION:"VARIABLE", PUBLIC_BETA_VALUE:"LOW" }
      ],
      rankingRule:"REAL_PRICE_VALUE × IDENTITY_QUALITY × CABIN_DETAIL × HANDOFF ÷ ACCESS_FRICTION",
      cruiseRealPriceCoverage:"SCHEMA_READY_COMMERCIAL_BLOCKED",
      cruiseBetaState:"FOUNDATION_ONLY"
    }, boundary()));
  }

  window.WeishanTraveltekCruiseConnectAdapter = Object.freeze({
    VERSION,
    MODULE_NAME,
    OFFICIAL_SOURCES,
    SOURCE_SCORECARD,
    mapSearchResult,
    normalizeCruiseSearchResult,
    buildCruiseSourceScorecard
  });
})();
