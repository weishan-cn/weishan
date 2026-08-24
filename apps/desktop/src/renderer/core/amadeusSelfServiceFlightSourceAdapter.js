;(function () {
  "use strict";

  const VERSION = "4.3.3";
  const MODULE_NAME = "amadeus_self_service_flight_source_adapter_v1";
  const OFFICIAL_DOCS = Object.freeze({
    quickStart:"https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/quick-start/",
    faq:"https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/",
    pricing:"https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/pricing/",
    flightOffersSearch:"https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/",
    openApiSpec:"https://github.com/amadeus4dev/amadeus-open-api-specification/blob/main/spec/json/FlightOffersSearch_v2_swagger_specification.json"
  });
  const SOURCE_MATRIX = Object.freeze([
    {
      SOURCE:"Amadeus Self-Service",
      CURRENT_2026_ACCESS:"SELF_SERVICE_AVAILABLE; free test environment and quota; production is separate",
      FARE_CAPABILITY:"Flight Offers Search returns provider-priced offers; Flight Offers Price can reprice a selected offer without creating an order",
      DATA_REALISM:"TEST_SUBSET_REAL_DATA_LIMITED; production is real-time/full data after approval/quota",
      IDENTITY:"route/date/passengers/cabin plus itineraries, segments, carrier, flight number and offer id",
      PRICE_DETAIL:"grandTotal/currency plus base/fees/taxes/traveler pricing where returned",
      FRESHNESS:"offer observed/retrieved time and optional last ticketing/expiry fields; no freshness is inferred from cache",
      HANDOFF:"EXACT_SEARCH_RECONSTRUCTION in Weishan beta; booking/order APIs remain disabled",
      ACCESS_FRICTION:"LOW; account/app credentials required but no booking, payment, card, KYC, or enterprise sales needed for test",
      BLOCKER:"AMADEUS_ACCOUNT_APP_CREDENTIAL_APPROVAL_REQUIRED",
      RECOMMENDATION:"BEST_FLIGHT_SOURCE"
    },
    {
      SOURCE:"Duffel",
      CURRENT_2026_ACCESS:"SELF_SERVICE_AVAILABLE with test tokens",
      FARE_CAPABILITY:"Offers include total_amount/currency, slices/segments, owner, expires_at",
      DATA_REALISM:"TEST_MODE_NOT_REALISTIC_FOR_SCHEDULES_OR_PRICES; Duffel Airways is reliable but synthetic",
      IDENTITY:"strong offer/slice/segment/passenger identity",
      PRICE_DETAIL:"strong total/currency and expiry, good for engineering tests",
      FRESHNESS:"offer expires_at gives short-lived evidence; availability is rechecked around order workflows",
      HANDOFF:"ORDER_ORIENTED; exact non-booking merchant handoff unresolved",
      ACCESS_FRICTION:"LOW_MEDIUM; developer/test easy, but read-only/handoff product boundary weaker",
      BLOCKER:"READ_ONLY_HANDOFF_BOUNDARY_REQUIRED",
      RECOMMENDATION:"SECONDARY_ENGINEERING_TEST_SOURCE"
    },
    {
      SOURCE:"Skyscanner Live Prices",
      CURRENT_2026_ACCESS:"PARTNER_APPLICATION_REQUIRED",
      FARE_CAPABILITY:"Live create/poll returns current best prices from airline/inventory partners; itinerary refresh can update selected itinerary",
      DATA_REALISM:"LIVE_PARTNER_DATA",
      IDENTITY:"strong itinerary/agent/leg identity after partner access",
      PRICE_DETAIL:"good price/currency/agent detail, plus refresh state",
      FRESHNESS:"create may return cached subset; poll and refresh improve freshness",
      HANDOFF:"partner/metasearch handoff likely strong after contract",
      ACCESS_FRICTION:"HIGH; partnerships team review/API key required",
      BLOCKER:"PARTNER_APPROVAL_REQUIRED",
      RECOMMENDATION:"HIGH_VALUE_AFTER_PARTNER_APPROVAL"
    },
    {
      SOURCE:"Travelport TripServices",
      CURRENT_2026_ACCESS:"PROVISIONING_OR_TRIAL_CREDENTIALS_REQUIRED",
      FARE_CAPABILITY:"Search/AirPrice can shop and price air offers",
      DATA_REALISM:"GDS/NDC/LCC real-time when provisioned",
      IDENTITY:"strong offer/product/segment/branded fare identity",
      PRICE_DETAIL:"strong Product/Price/TermsAndConditions detail",
      FRESHNESS:"AirPrice can confirm selected search result, but credentials/provisioning required",
      HANDOFF:"enterprise workflow includes booking/ticketing; Weishan read-only handoff requires product/legal boundary",
      ACCESS_FRICTION:"HIGH; account manager/sales/provisioning",
      BLOCKER:"ENTERPRISE_PROVISIONING_REQUIRED",
      RECOMMENDATION:"ENTERPRISE_CANDIDATE_NOT_FASTEST"
    },
    {
      SOURCE:"Sabre",
      CURRENT_2026_ACCESS:"PROVISIONING_OR_SALES_REQUIRED_FOR_FULL_TRAVEL_API_CREDENTIALS",
      FARE_CAPABILITY:"Bargain Finder Max/Air Shopping can return low-fare offers when provisioned",
      DATA_REALISM:"GDS/NDC/LCC depending Sabre provisioning",
      IDENTITY:"strong GDS/NDC itinerary and fare identity when provisioned",
      PRICE_DETAIL:"strong enterprise air-shopping price detail",
      FRESHNESS:"certification/test endpoints exist, but access is provisioned",
      HANDOFF:"booking/ticketing workflows exist and must remain disabled",
      ACCESS_FRICTION:"HIGH; Sabre credentials/IPCC/provisioning or sales route",
      BLOCKER:"SABRE_PROVISIONING_REQUIRED",
      RECOMMENDATION:"ENTERPRISE_CANDIDATE_NOT_FASTEST"
    }
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }
  function boundary() {
    return {
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false,
      productionAffected:false,
      WEISHAN_PAYS_PROVIDER:false,
      PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false,
      BOOKING:false,
      ORDER:false,
      PAYMENT:false,
      TICKETING:false,
      TICKET_ISSUANCE:false
    };
  }
  function failure(code, details) {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      success:false,
      status:"FAILED",
      error:{ code:code, stage:"AMADEUS_SELF_SERVICE_FLIGHT_SOURCE", recoverable:true, details:Array.isArray(details) ? details.slice() : [] }
    }, boundary()));
  }
  function text(value) {
    return String(value == null ? "" : value).trim();
  }
  function upper(value) {
    return text(value).toUpperCase();
  }
  function amount(value) {
    const result = Number(value);
    return Number.isFinite(result) && result >= 0 ? Math.round(result * 100) / 100 : null;
  }
  function first(array) {
    return Array.isArray(array) && array.length ? array[0] : null;
  }
  function last(array) {
    return Array.isArray(array) && array.length ? array[array.length - 1] : null;
  }
  function dateOnly(value) {
    const result = text(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(result) ? result : null;
  }
  function normalizeInstant(value) {
    const result = text(value);
    if (!result) return null;
    if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(result)) return result;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(result)) return result.replace(/(:\d{2})?$/, function (match) { return match || ":00"; }) + ".000Z";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(result)) return result + "Z";
    return result;
  }
  function cabin(value) {
    const normalized = upper(value).replace(/\s+/g, "_");
    if (["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"].indexOf(normalized) >= 0) return normalized;
    return "ECONOMY";
  }
  function passengerTotal(context) {
    const adults = Number.isSafeInteger(context && context.adults) ? context.adults : 1;
    const children = Number.isSafeInteger(context && context.children) ? context.children : 0;
    const infants = Number.isSafeInteger(context && context.infants) ? context.infants : 0;
    return { adults:adults, children:children, infants:infants, total:adults + children + infants };
  }
  function travelerCabin(offer, fallback) {
    const pricing = first(offer && offer.travelerPricings);
    const details = first(pricing && pricing.fareDetailsBySegment);
    return cabin((details && details.cabin) || offer.cabin || fallback);
  }
  function sourcePolicyFor(environment) {
    const test = environment !== "production";
    return {
      provider:test ? "amadeus_self_service_test" : "amadeus_self_service",
      sourceType:"GDS",
      priceAuthority:test ? "AUTHORIZED_SANDBOX" : "AUTHORITATIVE",
      allowedHandoffHosts:["developers.amadeus.com"],
      maxAgeSeconds:1800
    };
  }
  function normalizedKey(value) {
    return String(value).replace(/[^a-z0-9]/gi, "").toLowerCase();
  }
  function containsTransactionFields(value) {
    const forbidden = ["booking", "bookingurl", "checkout", "checkouturl", "order", "orderid", "payment", "paymenturl", "pnr", "ticket", "ticketing", "reservation"];
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return forbidden.indexOf(normalizedKey(key)) >= 0 || containsTransactionFields(value[key]);
    });
  }
  function mapSegments(itineraries, travelCabin) {
    const rows = [];
    (Array.isArray(itineraries) ? itineraries : []).forEach(function (itinerary, itineraryIndex) {
      (Array.isArray(itinerary.segments) ? itinerary.segments : []).forEach(function (segment) {
        rows.push({
          journey:itineraryIndex === 0 ? "OUTBOUND" : "INBOUND",
          origin:segment && segment.departure && segment.departure.iataCode,
          destination:segment && segment.arrival && segment.arrival.iataCode,
          departureAt:normalizeInstant(segment && segment.departure && segment.departure.at),
          arrivalAt:normalizeInstant(segment && segment.arrival && segment.arrival.at),
          airline:segment && segment.carrierCode,
          operatingAirline:(segment && segment.operating && segment.operating.carrierCode) || (segment && segment.carrierCode),
          flightNumber:segment && segment.number,
          cabin:travelCabin
        });
      });
    });
    return rows;
  }
  function officialSchemaSummary() {
    return deepFreeze({
      source:"Amadeus Self-Service Flight Offers Search v2",
      requestFields:["originLocationCode", "destinationLocationCode", "departureDate", "returnDate", "adults", "children", "infants", "travelClass", "currencyCode", "max"],
      responseFields:["type", "id", "source", "numberOfBookableSeats", "itineraries[].segments[]", "price.currency", "price.grandTotal", "price.base", "price.fees[]", "travelerPricings[]"],
      readOnlySearchAllowed:true,
      orderCreationRequired:false,
      transactionFieldsRejected:true,
      officialDocs:OFFICIAL_DOCS
    });
  }
  function buildSourceMatrix() {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"READY",
      selectedSource:"Amadeus Self-Service",
      sources:clone(SOURCE_MATRIX)
    }, boundary()));
  }
  function selectBestFlightSource() {
    return deepFreeze(Object.assign({
      BEST_FLIGHT_SOURCE:"Amadeus Self-Service",
      WHY:[
        "lowest current access friction among serious flight fare candidates",
        "official self-service test environment/free quota supports read-only Flight Offers Search before booking/order work",
        "Flight Offers Search schema carries enough route, segment, passenger, cabin, total price, currency and availability evidence for the existing truth foundation",
        "Duffel is easier for engineering but official test mode is not realistic for schedules/prices; Skyscanner/Travelport/Sabre are higher-value later but gated by partner or enterprise provisioning"
      ],
      CURRENT_ACCESS_STATE:"OFFLINE_ADAPTER_READY_ACCOUNT_NOT_CREATED",
      ACCOUNT_CREATED:false,
      CREDENTIALS_AVAILABLE:false,
      CONTROLLED_REQUESTS:0,
      AUTH_VALIDATED:false,
      REAL_FARE_VALIDATED:false,
      EXACT_HANDOFF:"EXACT_SEARCH_RECONSTRUCTION",
      FLIGHT_REAL_PRICE_COVERAGE:"OFFLINE_SCHEMA_READY_TEST_ENVIRONMENT_NEXT",
      FLIGHT_BETA_STATE:"READY_FOR_AMADEUS_SELF_SERVICE_ACCOUNT_APP_CREDENTIAL_PASS"
    }, boundary()));
  }
  function normalizeFlightOffer(input, options) {
    const truth = window.WeishanGlobalTravelPriceTruthFoundation;
    if (!truth || typeof truth.normalizeFlightOffer !== "function") return failure("TRAVEL_PRICE_TRUTH_FOUNDATION_MISSING");
    const offer = clone(input);
    const context = Object.assign({ environment:"test", tripType:null, cabin:null, adults:1, children:0, infants:0, observedAt:null, evaluatedAt:null }, options || {});
    if (containsTransactionFields(offer)) return failure("FLIGHT_TRANSACTION_FIELDS_REJECTED");
    const itineraries = offer && Array.isArray(offer.itineraries) ? offer.itineraries : [];
    const outbound = first(itineraries);
    const inbound = itineraries.length > 1 ? itineraries[1] : null;
    const firstOutbound = first(outbound && outbound.segments);
    const lastOutbound = last(outbound && outbound.segments);
    if (!offer || !firstOutbound || !lastOutbound) return failure("AMADEUS_FLIGHT_OFFER_SCHEMA_INVALID");
    const travelCabin = travelerCabin(offer, context.cabin);
    const passengers = passengerTotal(context);
    const mapped = {
      sourcePolicy:sourcePolicyFor(context.environment),
      search:{
        origin:firstOutbound.departure && firstOutbound.departure.iataCode,
        destination:lastOutbound.arrival && lastOutbound.arrival.iataCode,
        departureDate:dateOnly(firstOutbound.departure && firstOutbound.departure.at),
        returnDate:inbound ? dateOnly(first(inbound.segments) && first(inbound.segments).departure && first(inbound.segments).departure.at) : null,
        tripType:context.tripType || (inbound ? "ROUND_TRIP" : "ONE_WAY"),
        cabin:travelCabin,
        passengers:{ adults:passengers.adults, children:passengers.children, infants:passengers.infants }
      },
      segments:mapSegments(itineraries, travelCabin),
      fareFamily:offer.fareFamily || offer.pricingOptions && first(offer.pricingOptions.fareType) || "PUBLISHED",
      refundability:offer.refundability || "UNKNOWN",
      changeability:offer.changeability || "UNKNOWN",
      baggage:offer.baggage || "UNKNOWN",
      price:amount(offer.price && (offer.price.grandTotal || offer.price.total)),
      currency:offer.price && offer.price.currency,
      priceBasis:offer.priceBasis || "TOTAL_ITINERARY",
      taxFeeBasis:offer.taxFeeBasis || (offer.price && offer.price.grandTotal ? "INCLUDED" : "UNKNOWN"),
      availability:Number(offer.numberOfBookableSeats || 0) > 0 ? "AVAILABLE" : "UNKNOWN",
      observedAt:context.observedAt || offer.observedAt,
      evaluatedAt:context.evaluatedAt || offer.evaluatedAt,
      handoffQuality:offer.handoffQuality || "EXACT_SEARCH_RECONSTRUCTION",
      handoffUrl:offer.handoffUrl || "https://developers.amadeus.com/"
    };
    const normalized = truth.normalizeFlightOffer(mapped);
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:normalized.success ? "NORMALIZED" : "FAILED",
      source:"Amadeus Self-Service",
      officialSchema:officialSchemaSummary(),
      normalized:normalized,
      dataClass:normalized.success ? normalized.evidence.dataClass : null,
      offlineFixture:true,
      liveApiCall:false,
      apiRequests:0,
      credentialAccess:false,
      secretAccess:false,
      rendererSecretAccess:false,
      rawProviderResponsePersisted:false,
      transactionFieldsRejected:true
    }, boundary()));
  }
  function compareNormalizedOffers(records) {
    const truth = window.WeishanGlobalTravelPriceTruthFoundation;
    if (!truth || typeof truth.compareFlightOffers !== "function") return failure("TRAVEL_PRICE_TRUTH_FOUNDATION_MISSING");
    const normalized = (Array.isArray(records) ? records : []).map(function (item) { return item && item.normalized; });
    const comparison = truth.compareFlightOffers(normalized);
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:comparison.success ? "COMPARED" : "FAILED",
      comparison:comparison,
      commissionInfluence:false,
      apiRequests:0,
      liveApiCall:false
    }, boundary()));
  }

  window.WeishanAmadeusSelfServiceFlightSourceAdapter = Object.freeze({
    VERSION,
    MODULE_NAME,
    OFFICIAL_DOCS,
    officialSchemaSummary,
    buildSourceMatrix,
    selectBestFlightSource,
    normalizeFlightOffer,
    compareNormalizedOffers
  });
})();
