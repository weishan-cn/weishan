;(function () {
  "use strict";

  const VERSION = "4.3.2";
  const MODULE_NAME = "global_travel_real_source_acquisition_sweep_v1";

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

  function first(array) {
    return Array.isArray(array) && array.length ? array[0] : null;
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
      TICKETING:false
    };
  }

  function failure(code, details) {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"FAILED",
      code:code,
      details:Array.isArray(details) ? details.slice() : []
    }, boundary()));
  }

  function travelTruth() {
    const api = window.WeishanGlobalTravelPriceTruthFoundation;
    return api && typeof api.normalizeHotelOffer === "function" ? api : null;
  }

  function buildSourceMatrix() {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"READY",
      sources:[
        {
          SOURCE:"Hotelbeds",
          DOMAIN:"HOTELS",
          ACCESS_MODEL:"existing developer account; evaluation credentials stored; official test endpoint",
          PRICE_CAPABILITY:"hotel availability returns room/rate prices; checkrates can re-evaluate recheck rates",
          IDENTITY:"hotel code, hotel name, stay dates, occupancy, room code/name, board/rate key",
          FRESHNESS:"availability/checkrates response-time evidence; evaluation quota limited",
          HANDOFF:"provider-booking API has rateKey, but Weishan handoff remains disabled until legal/display approval",
          COST:"evaluation quota documented as limited; production/certification separate",
          HUMAN_ACTION:"Production/public display and booking boundaries still require separate approval",
          BLOCKER:"HOTELBEDS_EVALUATION_READONLY_APPROVED_PRODUCTION_DEFERRED",
          RECOMMENDATION:"BEST_HOTEL_SOURCE_EVALUATION_VALIDATION_READY_PRODUCTION_REQUIRES_SEPARATE_APPROVAL"
        },
        {
          SOURCE:"Amadeus Self-Service",
          DOMAIN:"FLIGHTS",
          ACCESS_MODEL:"self-service developer test environment with free quota; production has quota/billing thresholds",
          PRICE_CAPABILITY:"Flight Offers Search returns published-rate flight offers; pricing endpoint can confirm selected offer",
          IDENTITY:"origin/destination/date/passengers/cabin plus segments, carrier, flight number",
          FRESHNESS:"test environment subset; production live Flight Offers Search for broader results",
          HANDOFF:"API supports booking/order flow, but Weishan must keep read-only exact-search handoff until separate approval",
          COST:"test free quota; production free threshold then paid overage",
          HUMAN_ACTION:"Amadeus account/app credential authorization if chosen",
          BLOCKER:"AMADEUS_CREDENTIALS_NOT_APPROVED_FOR_THIS_PASS",
          RECOMMENDATION:"BEST_FLIGHT_SOURCE_FOR_LOW_FRICTION_SELF_SERVICE"
        },
        {
          SOURCE:"Skyscanner Live Prices",
          DOMAIN:"FLIGHTS",
          ACCESS_MODEL:"partner API",
          PRICE_CAPABILITY:"real-time flight prices across supply partners via create/poll and itinerary refresh",
          IDENTITY:"route/date/passengers/currency/itinerary ids and agents",
          FRESHNESS:"live search plus refresh endpoint; some cached first results",
          HANDOFF:"deep/referral style Skyscanner or partner handoff depending API response",
          COST:"commercial/partner relationship",
          HUMAN_ACTION:"commercial qualification; do not fake MAU/traffic",
          BLOCKER:"MATURITY_OR_PARTNER_APPROVAL_REQUIRED",
          RECOMMENDATION:"HIGH_VALUE_AFTER_TRAFFIC_OR_PARTNER_APPROVAL"
        },
        {
          SOURCE:"Duffel",
          DOMAIN:"FLIGHTS",
          ACCESS_MODEL:"developer dashboard and test tokens",
          PRICE_CAPABILITY:"offers include airline owner, slices/segments, total amount, currency and expiration",
          IDENTITY:"offer request id, slices, segments, passengers, owner, expires_at",
          FRESHNESS:"offers expire quickly, commonly around 30 minutes",
          HANDOFF:"API is oriented to order creation; Weishan exact handoff needs non-booking UX/legal review",
          COST:"test mode risk-free; live mode/commercial policy separate",
          HUMAN_ACTION:"Duffel account/test-token clearance if chosen",
          BLOCKER:"ORDER_ORIENTED_FLOW_NEEDS_READ_ONLY_BOUNDARY",
          RECOMMENDATION:"GOOD_ENGINEERING_TEST_SOURCE_NOT_BEST_HANDOFF_SOURCE_YET"
        },
        {
          SOURCE:"Traveltek Cruise Connect",
          DOMAIN:"CRUISES",
          ACCESS_MODEL:"Connect Manager credentials; GraphQL API / commercial cruise API",
          PRICE_CAPABILITY:"cruise search exposes lead-in cabin prices; cruise query path for detailed cabin availability/pricing",
          IDENTITY:"cruise id, ship, embark/disembark dates, ports, product, cabin type/grade",
          FRESHNESS:"real-time availability/pricing positioning, mediated external cruise-line APIs",
          HANDOFF:"booking API exists; Weishan handoff must remain search/sailing only until written permission",
          COST:"commercial access likely",
          HUMAN_ACTION:"official commercial/API access request",
          BLOCKER:"COMMERCIAL_CREDENTIALS_REQUIRED",
          RECOMMENDATION:"BEST_CRUISE_SOURCE_CANDIDATE_OFFLINE_ADAPTER_READY"
        },
        {
          SOURCE:"Revelex",
          DOMAIN:"CRUISES",
          ACCESS_MODEL:"enterprise API/services contact",
          PRICE_CAPABILITY:"official site claims real-time cruise availability, pricing, itineraries",
          IDENTITY:"provider-defined cruise/cabin/itinerary objects",
          FRESHNESS:"enterprise/API dependent",
          HANDOFF:"headless/booking flow likely; handoff/display rights need contract",
          COST:"commercial",
          HUMAN_ACTION:"sales/demo inquiry only",
          BLOCKER:"ENTERPRISE_SALES_REQUIRED",
          RECOMMENDATION:"SECONDARY_CRUISE_COMMERCIAL_CANDIDATE"
        },
        {
          SOURCE:"Odysseus Solutions",
          DOMAIN:"CRUISES",
          ACCESS_MODEL:"B2B technology/sales",
          PRICE_CAPABILITY:"cruise data cache and booking engine with pricing/availability",
          IDENTITY:"provider-defined sailing/cabin/static content",
          FRESHNESS:"data-cache/live-connectivity dependent",
          HANDOFF:"B2B/B2C booking engine; non-booking handoff requires permission",
          COST:"commercial",
          HUMAN_ACTION:"sales inquiry only",
          BLOCKER:"ENTERPRISE_SALES_REQUIRED",
          RECOMMENDATION:"TERTIARY_CRUISE_COMMERCIAL_CANDIDATE"
        }
      ]
    }, boundary()));
  }

  function normalizeHotelbedsEvaluationRate(input) {
    const api = travelTruth();
    if (!api) return failure("TRAVEL_PRICE_TRUTH_FOUNDATION_MISSING", ["load globalTravelPriceTruthFoundation first"]);
    const payload = clone(input);
    const hotel = payload && payload.hotel;
    const room = hotel && first(hotel.rooms);
    const rate = room && first(room.rates);
    const stay = payload && payload.request && payload.request.stay;
    const occupancy = first(payload && payload.request && payload.request.occupancies);
    if (!hotel || !room || !rate || !stay || !occupancy) return failure("HOTELBEDS_EVALUATION_FIXTURE_INVALID");
    const mapped = {
      sourcePolicy:{
        provider:"hotelbeds_evaluation",
        sourceType:"EVALUATION",
        priceAuthority:"AUTHORIZED_SANDBOX",
        allowedHandoffHosts:["developer.hotelbeds.com", "api.test.hotelbeds.com"],
        maxAgeSeconds:1800
      },
      propertyId:String(hotel.code),
      propertyName:hotel.name,
      locationKey:hotel.destinationCode || hotel.zoneCode || String(hotel.code),
      checkIn:stay.checkIn,
      checkOut:stay.checkOut,
      occupancy:{ adults:occupancy.adults, children:occupancy.children || 0, rooms:occupancy.rooms || 1 },
      roomType:room.name || room.code,
      ratePlan:rate.boardName || rate.boardCode || rate.rateKey,
      meals:rate.boardName || rate.boardCode || "UNKNOWN",
      refundability:Array.isArray(rate.cancellationPolicies) && rate.cancellationPolicies.length ? "PARTIALLY_REFUNDABLE" : "UNKNOWN",
      paymentTiming:rate.paymentType === "AT_WEB" ? "PAY_NOW" : "UNKNOWN",
      basePrice:number(rate.net),
      tax:null,
      fees:null,
      totalPrice:number(rate.net || rate.sellingRate),
      currency:rate.currency,
      priceBasis:"TOTAL_STAY",
      taxFeeBasis:"INCLUDED",
      availability:"AVAILABLE",
      observedAt:payload.observedAt,
      evaluatedAt:payload.evaluatedAt,
      handoffQuality:"EXACT_PROPERTY_HANDOFF",
      handoffUrl:"https://developer.hotelbeds.com/documentation/hotels/booking-api/workflow/"
    };
    const normalized = api.normalizeHotelOffer(mapped);
    return deepFreeze(Object.assign({
      adapter:"hotelbeds_evaluation_offline_adapter_v1",
      status:normalized.success ? "NORMALIZED" : "FAILED",
      dataClass:normalized.success ? normalized.evidence.dataClass : null,
      liveApiCall:false,
      rawProviderResponsePersisted:false,
      secretAccess:false,
      normalized:normalized
    }, boundary()));
  }

  function normalizeAmadeusFlightOffer(input) {
    const api = travelTruth();
    if (!api) return failure("TRAVEL_PRICE_TRUTH_FOUNDATION_MISSING", ["load globalTravelPriceTruthFoundation first"]);
    const offer = clone(input);
    const itinerary = first(offer && offer.itineraries);
    const segments = itinerary && Array.isArray(itinerary.segments) ? itinerary.segments : [];
    const firstSegment = first(segments);
    const lastSegment = segments[segments.length - 1];
    if (!offer || !itinerary || !segments.length || !firstSegment || !lastSegment) return failure("AMADEUS_FLIGHT_FIXTURE_INVALID");
    const departureDate = String(firstSegment.departure && firstSegment.departure.at || "").slice(0, 10);
    const mapped = {
      sourcePolicy:{
        provider:"amadeus_self_service_test",
        sourceType:"GDS",
        priceAuthority:offer.testEnvironment === true ? "AUTHORIZED_SANDBOX" : "AUTHORITATIVE",
        allowedHandoffHosts:["developers.amadeus.com"],
        maxAgeSeconds:1800
      },
      search:{
        origin:firstSegment.departure.iataCode,
        destination:lastSegment.arrival.iataCode,
        departureDate:departureDate,
        returnDate:null,
        tripType:"ONE_WAY",
        cabin:offer.cabin || "ECONOMY",
        passengers:{ adults:offer.adults || 1, children:offer.children || 0, infants:offer.infants || 0 }
      },
      segments:segments.map(function (segment) {
        return {
          journey:"OUTBOUND",
          origin:segment.departure.iataCode,
          destination:segment.arrival.iataCode,
          departureAt:segment.departure.at,
          arrivalAt:segment.arrival.at,
          airline:segment.carrierCode,
          operatingAirline:(segment.operating && segment.operating.carrierCode) || segment.carrierCode,
          flightNumber:segment.number,
          cabin:offer.cabin || "ECONOMY"
        };
      }),
      fareFamily:offer.fareFamily || "UNKNOWN",
      refundability:offer.refundability || "UNKNOWN",
      changeability:offer.changeability || "UNKNOWN",
      baggage:offer.baggage || "UNKNOWN",
      price:number(offer.price && offer.price.grandTotal),
      currency:offer.price && offer.price.currency,
      priceBasis:"TOTAL_ITINERARY",
      taxFeeBasis:offer.price && offer.price.grandTotal ? "INCLUDED" : "UNKNOWN",
      availability:Number(offer.numberOfBookableSeats || 0) > 0 ? "AVAILABLE" : "UNKNOWN",
      observedAt:offer.observedAt,
      evaluatedAt:offer.evaluatedAt,
      handoffQuality:"EXACT_SEARCH_RECONSTRUCTION",
      handoffUrl:"https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/"
    };
    const normalized = api.normalizeFlightOffer(mapped);
    return deepFreeze(Object.assign({
      adapter:"amadeus_self_service_offline_adapter_v1",
      status:normalized.success ? "NORMALIZED" : "FAILED",
      dataClass:normalized.success ? normalized.evidence.dataClass : null,
      liveApiCall:false,
      rawProviderResponsePersisted:false,
      secretAccess:false,
      normalized:normalized
    }, boundary()));
  }

  function normalizeTraveltekCruiseSearchResult(input) {
    const api = travelTruth();
    if (!api) return failure("TRAVEL_PRICE_TRUTH_FOUNDATION_MISSING", ["load globalTravelPriceTruthFoundation first"]);
    const result = clone(input);
    const price = first(result && result.leadInPrices);
    if (!result || !price) return failure("TRAVELTEK_CRUISE_FIXTURE_INVALID");
    const fare = number(price.fare);
    const taxes = number(price.taxesFeesAndPortExpenses);
    const mapped = {
      sourcePolicy:{
        provider:"traveltek_cruise_connect",
        sourceType:"CRUISE_AGGREGATOR",
        priceAuthority:"AUTHORIZED_SANDBOX",
        allowedHandoffHosts:["schema.cruiseconnect.traveltek.net", "www.traveltek.com"],
        maxAgeSeconds:1800
      },
      cruiseLine:(result.ship && result.ship.cruiseLine) || result.supplierName || "UNKNOWN",
      ship:(result.ship && result.ship.name) || "UNKNOWN",
      shipId:result.ship && result.ship.id,
      sailingId:result.id,
      itineraryId:result.product && result.product.id,
      departurePort:result.embarkPort,
      returnPort:result.disembarkPort,
      portsOfCall:Array.isArray(result.itineraryItems) ? result.itineraryItems.map(function (item) { return item.portCode; }) : [],
      destinationRegion:result.generalDestination || "UNKNOWN",
      departureDate:result.embarkDate,
      returnDate:result.disembarkDate,
      durationNights:result.duration,
      durationDays:Number(result.duration) + 1,
      market:result.market || "US",
      occupancy:{ adults:2, children:0, infants:0, cabins:1 },
      cabinCategory:price.cabinType === "OUTSIDE" ? "OCEANVIEW" : price.cabinType,
      cabinSubcategory:price.cabinDescription || price.cabinGrade,
      cabinAssignment:"UNKNOWN",
      fareBasis:price.rateCode || "UNKNOWN",
      baseFare:fare,
      portTaxes:taxes,
      governmentFees:null,
      portFees:null,
      mandatoryFees:null,
      gratuities:null,
      totalPrice:fare !== null && taxes !== null ? fare + taxes : null,
      price:fare !== null && taxes !== null ? fare + taxes : fare,
      currency:price.currency,
      priceBasis:"STARTING_FROM",
      costCompleteness:"PARTIAL_TOTAL",
      taxFeeBasis:"PARTIAL",
      availability:price.available === true ? "CABIN_CATEGORY_AVAILABLE" : "UNKNOWN",
      promotion:"UNKNOWN_PROMOTION",
      observedAt:result.observedAt,
      evaluatedAt:result.evaluatedAt,
      handoffQuality:"EXACT_SAILING_HANDOFF",
      handoffUrl:"https://schema.cruiseconnect.traveltek.net/"
    };
    const normalized = api.normalizeCruiseOffer(mapped);
    return deepFreeze(Object.assign({
      adapter:"traveltek_cruise_connect_offline_adapter_v1",
      status:normalized.success ? "NORMALIZED" : "FAILED",
      dataClass:normalized.success ? normalized.evidence.dataClass : null,
      liveApiCall:false,
      rawProviderResponsePersisted:false,
      secretAccess:false,
      normalized:normalized
    }, boundary()));
  }

  window.WeishanGlobalTravelRealSourceAcquisitionSweep = Object.freeze({
    VERSION,
    MODULE_NAME,
    buildSourceMatrix,
    normalizeHotelbedsEvaluationRate,
    normalizeAmadeusFlightOffer,
    normalizeTraveltekCruiseSearchResult
  });
})();
