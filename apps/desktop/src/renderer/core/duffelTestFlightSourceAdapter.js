;(function () {
  "use strict";

  const VERSION = "4.3.3";
  const MODULE_NAME = "duffel_test_flight_source_adapter_v1";
  const OFFICIAL_DOCS = Object.freeze({
    testMode:"https://duffel.com/docs/api/overview/test-mode",
    offerRequests:"https://duffel.com/docs/api/v2/offer-requests",
    testYourIntegration:"https://duffel.com/docs/api/overview/test-your-integration",
    makingRequests:"https://duffel.com/docs/api/overview/making-requests",
    servicesAgreement:"https://duffel.com/services-agreement",
    frontendTokenBoundary:"https://help.duffel.com/hc/en-gb/articles/4504698704530-Can-I-use-the-Duffel-API-directly-from-my-frontend-application-or-mobile-app",
    goLive:"https://help.duffel.com/hc/en-gb/articles/360019685579-How-do-I-go-live-once-I-ve-built-my-integration"
  });
  const ACCOUNT_ACCESS = Object.freeze({
    CURRENT_DUFFEL_TEST_ACCESS:"AVAILABLE_IN_DOCUMENTATION_BUT_ACCOUNT_CREATION_BLOCKED_FOR_WEISHAN",
    TEST_MODE_AVAILABLE:true,
    TEST_TOKENS_AVAILABLE:true,
    TEST_LIVE_RESOURCE_ISOLATION:true,
    TEST_TOKEN_PREFIX:"duffel_test_",
    LIVE_TOKEN_PREFIX:"duffel_live_",
    TEST_MODE_DATA:"TEST_ENVIRONMENT_DATA",
    PRICE_REALISM:"NON_REALISTIC_TEST_DATA",
    SCHEDULE_REALISM:"NON_REALISTIC_TEST_DATA",
    ACCOUNT_CREATED:false,
    TEST_TOKEN_CREATED:false,
    TEST_TOKEN_SECURELY_STORED:false,
    AUTH_VALIDATED:false,
    OFFER_REQUESTS:0,
    BLOCKERS:[
      "DUFFEL_SIGNUP_COUNTRY_OF_INCORPORATION_DOES_NOT_LIST_MAINLAND_CHINA_IN_CURRENT_VISIBLE_FORM",
      "DUFFEL_SERVICES_AGREEMENT_REQUIRES_LEGAL_REVIEW_BEFORE_ACCOUNT_CREATION",
      "DUFFEL_AGREEMENT_CONTAINS_KYC_PAYMENT_CARD_FEES_DEPOSIT_AND_METASEARCH_RESTRICTIONS"
    ],
    RECOMMENDATION:"LEGAL_AND_ACCOUNT_ELIGIBILITY_REVIEW_BEFORE_DUFFEL_ACCOUNT_CREATION"
  });
  const LIVE_SOURCE_SCORECARD = Object.freeze([
    {
      SOURCE:"Skyscanner Travel API / Flights Live Prices",
      REAL_CURRENT_FARE_CAPABILITY:"YES_AFTER_PARTNER_APPROVAL",
      PREPROD_OR_LIVE:"PARTNER_API",
      IDENTITY:"strong itinerary, leg, agent, quote and refresh identity when provisioned",
      PRICE_DETAIL:"live prices across supply partners, with price accuracy managed through partner workflow",
      FRESHNESS:"create/poll/refresh semantics; prices can change and partner must handle mismatch reporting",
      HANDOFF:"STRONG_DEEPLINK_REQUIREMENT; user is redirected to provider site and landing page must show the selected deal",
      ACCESS_FRICTION:"HIGH",
      COMMERCIAL_FRICTION:"HIGH; commercial use only, established business, minimum 100K MAU stated",
      CURRENT_BLOCKER:"PARTNER_APPROVAL_AND_MAU_BUSINESS_QUALIFICATION_REQUIRED",
      PUBLIC_BETA_VALUE:"HIGHEST_IF_APPROVED"
    },
    {
      SOURCE:"Travelport TripServices Flights",
      REAL_CURRENT_FARE_CAPABILITY:"YES_WHEN_PROVISIONED",
      PREPROD_OR_LIVE:"PRE_PRODUCTION_AND_PRODUCTION",
      IDENTITY:"strong access-group/PCC, catalog product offering, segment, fare and product identity",
      PRICE_DETAIL:"Air Search and AirPrice can search and confirm pricing on selected itineraries",
      FRESHNESS:"AirPrice confirmation; OAuth token valid 24h, provider-provisioned credentials required",
      HANDOFF:"ENTERPRISE_WORKFLOW; read-only user handoff requires separate product/legal boundary",
      ACCESS_FRICTION:"HIGH",
      COMMERCIAL_FRICTION:"HIGH; provisioning, organization credentials and likely sales/customer relationship",
      CURRENT_BLOCKER:"TRAVELPORT_PROVISIONING_REQUIRED",
      PUBLIC_BETA_VALUE:"HIGH_FOR_REAL_FARE_BACKEND_AFTER_COMMERCIAL_ACCESS"
    },
    {
      SOURCE:"Sabre APIs",
      REAL_CURRENT_FARE_CAPABILITY:"YES_WHEN_PROVISIONED",
      PREPROD_OR_LIVE:"CERTIFICATION_AND_PRODUCTION",
      IDENTITY:"strong IPCC/EPR, session, itinerary, fare and segment identity",
      PRICE_DETAIL:"air shopping/pricing available after Sabre provisioning",
      FRESHNESS:"certification environment available, but transactions and scan charges require careful boundary",
      HANDOFF:"BOOKING_ORIENTED; Weishan must keep search/evidence separate from booking/ticketing",
      ACCESS_FRICTION:"HIGH",
      COMMERCIAL_FRICTION:"HIGH; Sabre Sales/provisioning and IPCC credentials required",
      CURRENT_BLOCKER:"SABRE_SALES_OR_PROVISIONING_REQUIRED",
      PUBLIC_BETA_VALUE:"HIGH_ENTERPRISE_OPTION_NOT_FASTEST"
    },
    {
      SOURCE:"XiamenAir Open Platform / NDC",
      REAL_CURRENT_FARE_CAPABILITY:"YES_AFTER_DEVELOPER_CERTIFICATION_AND_API_PERMISSION",
      PREPROD_OR_LIVE:"TEST_ENVIRONMENT_THEN_PRODUCTION",
      IDENTITY:"official airline NDC application/API capability identity",
      PRICE_DETAIL:"official NDC offer/search flow includes flight offer products after permission",
      FRESHNESS:"provider test/prod workflow, IP allowlist and service capability approval required",
      HANDOFF:"AIRLINE_DIRECT_NDC; booking/payment/ticketing APIs exist and must remain disabled",
      ACCESS_FRICTION:"HIGH",
      COMMERCIAL_FRICTION:"MEDIUM_HIGH; developer certification, IP allowlist, service capability approval and agreements",
      CURRENT_BLOCKER:"XIAMENAIR_DEVELOPER_CERTIFICATION_IP_ALLOWLIST_AND_SERVICE_PERMISSION_REQUIRED",
      PUBLIC_BETA_VALUE:"PROMISING_CHINA_DIRECT_PILOT_AFTER_APPROVAL"
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
  function failure(code, stage, details) {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      success:false,
      status:"FAILED",
      error:{ code:code, stage:stage || "DUFFEL_TEST_FLIGHT_SOURCE", recoverable:true, details:Array.isArray(details) ? details.slice() : [] }
    }, boundary()));
  }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function upper(value) { return text(value).toUpperCase(); }
  function amount(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null;
  }
  function first(array) { return Array.isArray(array) && array.length ? array[0] : null; }
  function last(array) { return Array.isArray(array) && array.length ? array[array.length - 1] : null; }
  function dateOnly(value) {
    const result = text(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(result) ? result : null;
  }
  function cabin(value) {
    const normalized = upper(value).replace(/\s+/g, "_");
    if (["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"].indexOf(normalized) >= 0) return normalized;
    return "ECONOMY";
  }
  function normalizeInstant(value) {
    const result = text(value);
    if (!result) return null;
    const parsed = Date.parse(result);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  }
  function normalizedKey(value) {
    return String(value).replace(/[^a-z0-9]/gi, "").toLowerCase();
  }
  function containsTransactionFields(value) {
    const forbidden = ["booking", "bookingurl", "checkout", "checkouturl", "order", "orderid", "payment", "paymenturl", "pnr", "ticket", "ticketing", "reservation", "card", "cardid"];
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return forbidden.indexOf(normalizedKey(key)) >= 0 || containsTransactionFields(value[key]);
    });
  }
  function sourcePolicy() {
    return {
      provider:"duffel_test",
      sourceType:"SANDBOX",
      priceAuthority:"AUTHORIZED_SANDBOX",
      allowedHandoffHosts:["duffel.com", "app.duffel.com"],
      maxAgeSeconds:900
    };
  }
  function mapCarrier(carrier) {
    if (!carrier || typeof carrier !== "object") return null;
    return {
      id:text(carrier.id),
      name:text(carrier.name),
      iataCode:upper(carrier.iata_code || carrier.iataCode)
    };
  }
  function mapSegment(segment, journey, travelCabin) {
    const origin = segment && (segment.origin || segment.departure_airport || {});
    const destination = segment && (segment.destination || segment.arrival_airport || {});
    const marketing = mapCarrier(segment && (segment.marketing_carrier || segment.marketingCarrier || segment.owner));
    const operating = mapCarrier(segment && (segment.operating_carrier || segment.operatingCarrier || segment.marketing_carrier || segment.owner));
    return {
      journey:journey,
      origin:upper(origin.iata_code || origin.iataCode || segment && segment.origin_iata_code),
      destination:upper(destination.iata_code || destination.iataCode || segment && segment.destination_iata_code),
      departureAt:normalizeInstant(segment && (segment.departing_at || segment.departureAt)),
      arrivalAt:normalizeInstant(segment && (segment.arriving_at || segment.arrivalAt)),
      airline:(marketing && marketing.iataCode) || (operating && operating.iataCode),
      operatingAirline:(operating && operating.iataCode) || (marketing && marketing.iataCode),
      flightNumber:text(segment && (segment.marketing_carrier_flight_number || segment.flightNumber || segment.number)),
      cabin:travelCabin
    };
  }
  function mapSegments(offer, travelCabin) {
    const rows = [];
    (Array.isArray(offer && offer.slices) ? offer.slices : []).forEach(function (slice, sliceIndex) {
      const journey = sliceIndex === 0 ? "OUTBOUND" : "INBOUND";
      (Array.isArray(slice && slice.segments) ? slice.segments : []).forEach(function (segment) {
        rows.push(mapSegment(segment, journey, travelCabin));
      });
    });
    return rows;
  }
  function passengersFromRequest(request) {
    const rows = Array.isArray(request && request.passengers) ? request.passengers : [];
    const adults = rows.filter(function (passenger) { return text(passenger && passenger.type) === "adult"; }).length || 1;
    const children = rows.filter(function (passenger) { return text(passenger && passenger.type) === "child"; }).length;
    const infants = rows.filter(function (passenger) { return text(passenger && passenger.type) === "infant_without_seat" || text(passenger && passenger.type) === "infant"; }).length;
    return { adults:adults, children:children, infants:infants };
  }
  function buildOfferRequestPayload(input) {
    const safe = input || {};
    const tripType = upper(safe.tripType || (safe.returnDate ? "ROUND_TRIP" : "ONE_WAY"));
    const slices = [{ origin:upper(safe.origin), destination:upper(safe.destination), departure_date:dateOnly(safe.departureDate) }];
    if (tripType === "ROUND_TRIP") slices.push({ origin:upper(safe.destination), destination:upper(safe.origin), departure_date:dateOnly(safe.returnDate) });
    const adults = Number.isSafeInteger(safe.adults) ? safe.adults : 1;
    const passengers = [];
    for (let i = 0; i < adults; i += 1) passengers.push({ type:"adult" });
    const payload = {
      data:{
        cabin_class:text(safe.cabinClass || "economy").toLowerCase(),
        slices:slices,
        passengers:passengers
      }
    };
    const valid = /^[A-Z]{3}$/.test(slices[0].origin) && /^[A-Z]{3}$/.test(slices[0].destination) &&
      !!slices[0].departure_date && slices[0].origin !== slices[0].destination && adults >= 1 && adults <= 9 &&
      ["economy", "premium_economy", "business", "first"].indexOf(payload.data.cabin_class) >= 0 &&
      (tripType === "ONE_WAY" || !!slices[1].departure_date);
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      success:valid,
      method:"POST",
      endpoint:"https://api.duffel.com/air/offer_requests",
      headers:{ "Duffel-Version":"v2", "Accept":"application/json", "Content-Type":"application/json", Authorization:"SERVICE_MANAGED_BEARER_TOKEN_REDACTED" },
      payload:valid ? payload : null,
      liveModeAllowed:false,
      orderEndpointAllowed:false,
      paymentEndpointAllowed:false,
      tokenIncluded:false,
      rawTokenExposed:false
    }, boundary()));
  }
  function classifyTokenPrefix(prefix) {
    const value = text(prefix);
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      prefix:value,
      mode:value === "duffel_test_" ? "test" : value === "duffel_live_" ? "live" : "unknown",
      accepted:value === "duffel_test_",
      rejection:value === "duffel_live_" ? "LIVE_TOKEN_REJECTED" : value === "duffel_test_" ? null : "UNKNOWN_TOKEN_PREFIX_REJECTED",
      persisted:false,
      rendererReadable:false,
      rawTokenExposed:false
    }, boundary()));
  }
  function credentialPolicy(descriptor) {
    const safe = descriptor || {};
    const accepted = text(safe.provider) === "duffel" && text(safe.environment) === "test" && text(safe.application) === "Weishan" && text(safe.credentialType) === "access_token";
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      accepted:accepted,
      target:accepted ? "duffel / test / Weishan / access_token" : null,
      rawSecretReadable:false,
      rendererSecretAccess:false,
      ipcSecretPayload:false,
      plaintextPersistence:false
    }, boundary()));
  }
  function normalizeDuffelOffer(offerRequest, offer, options) {
    const truth = window.WeishanGlobalTravelPriceTruthFoundation;
    if (!truth || typeof truth.normalizeFlightOffer !== "function") return failure("TRAVEL_PRICE_TRUTH_FOUNDATION_MISSING");
    const request = clone(offerRequest && offerRequest.data ? offerRequest.data : offerRequest);
    const candidate = clone(offer && offer.data ? offer.data : offer);
    const context = Object.assign({ observedAt:null, evaluatedAt:null }, options || {});
    if (!request || !candidate) return failure("DUFFEL_OFFER_SCHEMA_INVALID");
    if (containsTransactionFields(candidate) || containsTransactionFields(request)) return failure("FLIGHT_TRANSACTION_FIELDS_REJECTED");
    if (request.live_mode !== false || candidate.live_mode !== false) return failure("LIVE_MODE_REJECTED");
    const firstSlice = first(request.slices);
    const lastSlice = last(request.slices);
    const travelCabin = cabin(request.cabin_class || candidate.cabin_class);
    const passengerCounts = passengersFromRequest(request);
    const mapped = {
      sourcePolicy:sourcePolicy(),
      search:{
        origin:firstSlice && upper(firstSlice.origin),
        destination:firstSlice && upper(firstSlice.destination),
        departureDate:firstSlice && dateOnly(firstSlice.departure_date),
        returnDate:Array.isArray(request.slices) && request.slices.length > 1 ? dateOnly(lastSlice && lastSlice.departure_date) : null,
        tripType:Array.isArray(request.slices) && request.slices.length > 1 ? "ROUND_TRIP" : "ONE_WAY",
        cabin:travelCabin,
        passengers:passengerCounts
      },
      segments:mapSegments(candidate, travelCabin),
      fareFamily:candidate.fare_brand_name || candidate.fare_brand && candidate.fare_brand.name || "STANDARD",
      refundability:candidate.conditions && candidate.conditions.refund_before_departure && candidate.conditions.refund_before_departure.allowed ? "REFUNDABLE" : "UNKNOWN",
      changeability:candidate.conditions && candidate.conditions.change_before_departure && candidate.conditions.change_before_departure.allowed ? "FEE_APPLIES" : "UNKNOWN",
      baggage:candidate.baggage || "UNKNOWN",
      price:amount(candidate.total_amount),
      currency:candidate.total_currency,
      priceBasis:"TOTAL_ITINERARY",
      taxFeeBasis:candidate.tax_amount || candidate.base_amount ? "PARTIAL" : "UNKNOWN",
      availability:normalizeInstant(candidate.expires_at) && Date.parse(candidate.expires_at) > Date.parse(context.evaluatedAt || new Date().toISOString()) ? "AVAILABLE" : "UNAVAILABLE",
      observedAt:context.observedAt || request.created_at,
      evaluatedAt:context.evaluatedAt || request.created_at,
      handoffQuality:"NO_HANDOFF",
      handoffUrl:null
    };
    const normalized = truth.normalizeFlightOffer(mapped);
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:normalized.success ? "NORMALIZED" : "FAILED",
      source:"Duffel Test Mode",
      offerRequestId:text(request.id),
      offerId:text(candidate.id),
      liveMode:request.live_mode === false && candidate.live_mode === false ? false : null,
      owner:mapCarrier(candidate.owner),
      expiresAt:normalizeInstant(candidate.expires_at),
      normalized:normalized,
      dataClass:normalized.success ? normalized.evidence.dataClass : null,
      sourceEnvironment:"TEST",
      priceRealism:"NON_REALISTIC_TEST_DATA",
      scheduleRealism:"NON_REALISTIC_TEST_DATA",
      publicHandoff:"NO_PUBLIC_HANDOFF",
      apiOfferReference:text(candidate.id) || null,
      offlineFixture:true,
      liveApiCall:false,
      apiRequests:0,
      rawProviderResponsePersisted:false,
      rendererSecretAccess:false
    }, boundary()));
  }
  function normalizeOfferRequestResponse(response, options) {
    const request = clone(response && response.data ? response.data : response);
    if (!request || request.live_mode !== false || containsTransactionFields(request)) return failure(request && request.live_mode === true ? "LIVE_MODE_REJECTED" : "DUFFEL_OFFER_REQUEST_SCHEMA_INVALID");
    const offers = (Array.isArray(request.offers) ? request.offers : []).map(function (offer) { return normalizeDuffelOffer(request, offer, options); });
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"NORMALIZED",
      offerRequestId:text(request.id),
      liveMode:false,
      createdAt:normalizeInstant(request.created_at),
      offerCount:offers.length,
      offers:offers,
      testEnvironmentClassification:"TEST_ENVIRONMENT_DATA",
      realCurrentFare:false,
      publicBetaLiveFare:false,
      publicHandoff:"NO_PUBLIC_HANDOFF",
      apiRequests:0,
      rawProviderResponsePersisted:false
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
      liveApiCall:false,
      apiRequests:0
    }, boundary()));
  }
  function buildReadOnlyValidationPlan() {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"ACCOUNT_LEGAL_BLOCKED_OFFLINE_READY",
      accountAccess:clone(ACCOUNT_ACCESS),
      credentialTarget:"duffel / test / Weishan / access_token",
      allowedRequests:["POST /air/offer_requests"],
      maximumControlledOfferRequests:2,
      forbiddenRequests:["POST /air/orders", "POST /payments", "POST /payment_intents", "live token creation", "live mode requests"],
      noPublicHandoff:true,
      testModeDataClass:"SANDBOX_TEST_DATA",
      priceRealism:"NON_REALISTIC_TEST_DATA",
      scheduleRealism:"NON_REALISTIC_TEST_DATA",
      officialDocs:clone(OFFICIAL_DOCS)
    }, boundary()));
  }
  function buildRealFlightSourceScorecard() {
    return deepFreeze(Object.assign({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"READY",
      BEST_REMAINING_REAL_FLIGHT_SOURCE:"Skyscanner Travel API / Flights Live Prices",
      REAL_FARE_ACCESS_STATE:"PARTNER_APPROVAL_REQUIRED",
      CURRENT_BLOCKER:"SKYSCANNER_PARTNER_APPROVAL_AND_100K_MAU_QUALIFICATION_REQUIRED",
      EXPECTED_HUMAN_COMMERCIAL_FRICTION:"HIGH",
      FLIGHT_REAL_PRICE_COVERAGE:"LIVE_SOURCE_BLOCKED",
      FLIGHT_BETA_STATE:"TEST_INTEGRATION_READY_ONLY_AFTER_DUFFEL_CREDENTIALS; LIVE_SOURCE_BLOCKED",
      scorecard:clone(LIVE_SOURCE_SCORECARD)
    }, boundary()));
  }

  window.WeishanDuffelTestFlightSourceAdapter = Object.freeze({
    VERSION,
    MODULE_NAME,
    OFFICIAL_DOCS,
    ACCOUNT_ACCESS,
    buildOfferRequestPayload,
    classifyTokenPrefix,
    credentialPolicy,
    normalizeDuffelOffer,
    normalizeOfferRequestResponse,
    compareNormalizedOffers,
    buildReadOnlyValidationPlan,
    buildRealFlightSourceScorecard
  });
})();
