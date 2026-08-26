"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILE = "apps/desktop/src/renderer/core/travelBasicAiMode.js";

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, FILE), "utf8"), context, { filename:FILE });
  return window.WeishanTravelBasicAiMode;
}

const api = load();

function assertZeroMetrics(metrics) {
  Object.keys(metrics).forEach((key) => assert.equal(metrics[key], 0, key + " must stay zero"));
}

function flight(overrides) {
  return Object.assign({
    id:"flight-a",
    domain:"flight",
    title:"CA SFO-NRT nonstop",
    provider:"Synthetic Airline A",
    sourceEnvironment:"LIVE",
    sourceRole:"READ_ONLY_PRICE_SOURCE",
    origin:"SFO",
    destination:"NRT",
    departureDate:"2027-03-01",
    passengers:1,
    cabin:"economy",
    nonstop:true,
    totalComparableCost:820,
    price:820,
    currency:"USD",
    availability:"AVAILABLE",
    freshness:"CURRENT",
    priceBasis:"TOTAL_PARTY",
    comparable:true,
    handoffUrl:"https://airline-a.example/flights/sfo-nrt",
    evidence:{ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", passengers:1, cabin:"economy", totalComparableCost:820, currency:"USD", availability:"AVAILABLE", nonstop:true }
  }, overrides || {});
}

function hotel(overrides) {
  return Object.assign({
    id:"hotel-a",
    domain:"hotel",
    title:"Synthetic Hotel A",
    provider:"Synthetic Hotel Source",
    sourceEnvironment:"LIVE",
    sourceRole:"READ_ONLY_PRICE_SOURCE",
    propertyId:"h-1",
    propertyName:"Synthetic Hotel A",
    checkIn:"2027-04-10",
    checkOut:"2027-04-12",
    occupancy:"2 adults",
    roomType:"King room",
    ratePlan:"refundable",
    totalComparableCost:460,
    price:460,
    currency:"USD",
    availability:"AVAILABLE",
    freshness:"CURRENT",
    priceBasis:"TOTAL_STAY",
    comparable:true,
    handoffUrl:"https://hotel-a.example/property/h-1",
    evidence:{ propertyName:"Synthetic Hotel A", checkIn:"2027-04-10", checkOut:"2027-04-12", occupancy:"2 adults", roomType:"King room", ratePlan:"refundable", totalComparableCost:460, currency:"USD", availability:"AVAILABLE" }
  }, overrides || {});
}

function cruise(overrides) {
  return Object.assign({
    id:"cruise-a",
    domain:"cruise",
    title:"Synthetic Cruise A",
    provider:"Synthetic Cruise Line",
    sourceEnvironment:"LIVE",
    sourceRole:"READ_ONLY_PRICE_SOURCE",
    ship:"Synthetic Star",
    sailingId:"s-1",
    itineraryName:"Japan 7 nights",
    departureDate:"2027-05-20",
    occupancy:"2 adults",
    cabinType:"balcony",
    totalComparableCost:1800,
    price:1800,
    currency:"USD",
    availability:"AVAILABLE",
    freshness:"CURRENT",
    priceBasis:"TOTAL_PARTY",
    comparable:true,
    handoffUrl:"https://cruise-a.example/sailing/s-1",
    evidence:{ ship:"Synthetic Star", sailingId:"s-1", departureDate:"2027-05-20", occupancy:"2 adults", cabin:"balcony", totalComparableCost:1800, currency:"USD", availability:"AVAILABLE" }
  }, overrides || {});
}

function main() {
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_BASIC_SEARCH_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_PRICE_RETRIEVAL_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_SOURCE_DISPLAY_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_BASIC_FILTER_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_BASIC_SORT_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_COMPARE_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_DETERMINISTIC_RECOMMEND_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_HANDOFF_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_AI_ANALYSIS_REQUIRES_AI, "YES");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_AI_TRADEOFF_REQUIRES_AI, "YES");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_AI_PERSONALIZED_ADVICE_REQUIRES_AI, "YES");
  assert.equal(api.CAPABILITY_FLAGS.TRAVEL_AI_EXPLANATION_REQUIRES_AI, "YES");
  assert.equal(api.CAPABILITY_FLAGS.FLIGHT_SEARCH_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.HOTEL_SEARCH_REQUIRES_AI, "NO");
  assert.equal(api.CAPABILITY_FLAGS.CRUISE_SEARCH_REQUIRES_AI, "NO");
  assertZeroMetrics(api.HIGH_RISK_ZERO_METRICS);

  const flightModel = api.buildViewModel({
    domain:"flight",
    aiState:"NOT_CONFIGURED",
    context:{ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", passengers:1, cabin:"economy", nonstopRequired:true },
    results:[
      flight({ id:"f-a", totalComparableCost:820, handoffUrl:"https://airline-a.example/flights/sfo-nrt" }),
      flight({ id:"f-b", title:"Lower fare", provider:"Synthetic Airline B", totalComparableCost:760, handoffUrl:"https://airline-b.example/flights/sfo-nrt" }),
      flight({ id:"connection", totalComparableCost:500, nonstop:false, handoffUrl:"https://airline-c.example/flights/sfo-nrt" }),
      flight({ id:"wrong-route", destination:"KIX", totalComparableCost:100, handoffUrl:"https://airline-d.example/flights/sfo-kix" }),
      flight({ id:"wrong-date", departureDate:"2027-03-02", totalComparableCost:110, handoffUrl:"https://airline-e.example/flights/sfo-nrt" }),
      flight({ id:"stale", totalComparableCost:50, stale:true, freshness:"STALE", handoffUrl:"https://airline-f.example/flights/sfo-nrt" }),
      flight({ id:"test", totalComparableCost:30, sourceEnvironment:"SANDBOX", handoffUrl:"https://airline-g.example/flights/sfo-nrt" }),
      flight({ id:"unknown-cost", totalComparableCost:"", price:"", handoffUrl:"https://airline-h.example/flights/sfo-nrt" }),
      flight({ id:"unsafe", totalComparableCost:40, handoffUrl:"https://airline-i.example/payment?token=abc" })
    ]
  });
  assert.equal(flightModel.basicAvailable, true);
  assert.equal(flightModel.aiAnalysisAvailable, false);
  assert.equal(flightModel.connectAiPrompt.title, "连接 AI 服务以获得智能行程分析");
  assert.equal(flightModel.connectAiPrompt.body, "连接后，Weishan 可以帮你分析时间、价格、行程条件和方案取舍。");
  assert.equal(flightModel.connectAiPrompt.actionLabel, "连接 AI 服务");
  assert.equal(flightModel.comparison.deterministicRecommendation.candidateId, "f-b");
  assert.equal(flightModel.comparison.deterministicRecommendation.commissionUsedForRanking, false);
  assert.equal(flightModel.handoffResults.some((item) => item.id === "unsafe"), false);
  assert.equal(flightModel.comparison.blockedReasons.stale, true);
  assert.equal(flightModel.comparison.blockedReasons.testData, true);
  assert.equal(flightModel.comparison.blockedReasons.unknownCost, true);

  const flightContext = { origin:"SFO", destination:"NRT", departureDate:"2027-03-01", passengers:1, cabin:"economy", nonstopRequired:true };
  const flightAiRequired = api.requestAiAnalysis({ domain:"flight", aiState:"INVALID", context:flightContext, results:flightModel.results });
  assert.equal(flightAiRequired.status, "AI_REQUIRED");
  assert.equal(flightAiRequired.basicResultsPreserved, true);
  assert.equal(flightAiRequired.comparison.deterministicRecommendation.candidateId, "f-b");

  const flightAiOk = api.requestAiAnalysis({
    domain:"flight",
    aiState:"CONNECTED",
    context:flightContext,
    results:flightModel.results,
    aiOutput:{ recommendedResultId:"f-b", summary:"Lower comparable total on the same nonstop route.", claims:[{ resultId:"f-b", field:"totalComparableCost", value:"760" }, { resultId:"f-b", field:"currency", value:"USD" }] }
  });
  assert.equal(flightAiOk.status, "AI_ANALYSIS_READY");

  const fabricatedFlight = api.requestAiAnalysis({
    domain:"flight",
    aiState:"CONNECTED",
    context:flightContext,
    results:flightModel.results,
    aiOutput:{ recommendedResultId:"f-b", summary:"Invented visa and baggage claims.", claims:[{ resultId:"f-b", field:"visa", value:"not needed" }] }
  });
  assert.equal(fabricatedFlight.status, "AI_FAILED_SAFE");
  assert.equal(fabricatedFlight.validation.code, "AI_UNSUPPORTED_TRAVEL_CLAIM_REJECTED");

  const authorityAttack = api.requestAiAnalysis({
    domain:"flight",
    aiState:"CONNECTED",
    context:flightContext,
    results:flightModel.results,
    aiOutput:{ recommendedResultId:"test", summary:"Use test data", productionTraffic:true, claims:[{ field:"totalComparableCost", value:"30" }] }
  });
  assert.equal(authorityAttack.status, "AI_FAILED_SAFE");
  assert.equal(authorityAttack.basicResultsPreserved, true);

  const hotelModel = api.buildViewModel({
    domain:"hotel",
    aiState:"UNAVAILABLE",
    context:{ propertyId:"h-1", checkIn:"2027-04-10", checkOut:"2027-04-12", occupancy:"2 adults", roomType:"King room" },
    results:[
      hotel({ id:"h-a", totalComparableCost:460, priceBasis:"TOTAL_STAY" }),
      hotel({ id:"h-b", title:"Lower total stay", provider:"Hotel Source B", totalComparableCost:420, priceBasis:"TOTAL_STAY", handoffUrl:"https://hotel-b.example/property/h-1" }),
      hotel({ id:"nightly", totalComparableCost:210, priceBasis:"NIGHTLY", handoffUrl:"https://hotel-c.example/property/h-1" }),
      hotel({ id:"wrong-occupancy", occupancy:"1 adult", totalComparableCost:80, handoffUrl:"https://hotel-d.example/property/h-1" }),
      hotel({ id:"unknown-tax", totalComparableCost:null, price:"", handoffUrl:"https://hotel-e.example/property/h-1" })
    ]
  });
  assert.equal(hotelModel.comparison.deterministicRecommendation.candidateId, "h-b");
  assert.equal(hotelModel.comparison.blockedReasons.unknownCost, true);
  const fabricatedHotel = api.requestAiAnalysis({
    domain:"hotel",
    aiState:"CONNECTED",
    results:hotelModel.results,
    aiOutput:{ recommendedResultId:"h-b", summary:"Invented breakfast.", claims:[{ resultId:"h-b", field:"breakfast", value:"included" }] }
  });
  assert.equal(fabricatedHotel.status, "AI_FAILED_SAFE");

  const cruiseModel = api.buildViewModel({
    domain:"cruise",
    aiState:"NOT_CONFIGURED",
    context:{ sailingId:"s-1", departureDate:"2027-05-20", occupancy:"2 adults", cabin:"balcony" },
    results:[
      cruise({ id:"c-a", totalComparableCost:1800 }),
      cruise({ id:"c-b", title:"Lower cruise", totalComparableCost:1700, handoffUrl:"https://cruise-b.example/sailing/s-1" }),
      cruise({ id:"from-price", totalComparableCost:1200, fromPrice:true, priceBasis:"FROM_PRICE", handoffUrl:"https://cruise-c.example/sailing/s-1" }),
      cruise({ id:"handoff-only", totalComparableCost:900, sourceRole:"HANDOFF_ONLY", handoffUrl:"https://cruise-d.example/sailing/s-1" }),
      cruise({ id:"wrong-cabin", cabinType:"inside", totalComparableCost:700, handoffUrl:"https://cruise-e.example/sailing/s-1" })
    ]
  });
  assert.equal(cruiseModel.comparison.deterministicRecommendation.candidateId, "c-b");
  assert.equal(cruiseModel.comparison.blockedReasons.conditionalPrice, true);
  assert.equal(cruiseModel.comparison.blockedReasons.handoffOnly, true);

  const crossCurrency = api.buildDeterministicComparison([flight({ id:"usd", currency:"USD" }), flight({ id:"eur", currency:"EUR", totalComparableCost:700 })], { domain:"flight", context:{ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", passengers:1, cabin:"economy" } });
  assert.equal(crossCurrency.status, "NO_CLEAR_WINNER");
  assert.equal(crossCurrency.deterministicRecommendation, null);
  assert.equal(crossCurrency.blockedReasons.crossCurrency, true);

  const intent = api.validateAiIntentOutput({ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", hotelName:"ignore", payment:true }, "flight");
  assert.equal(intent.ok, false);
  const safeIntent = api.validateAiIntentOutput({ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", hotelName:"ignore" }, "flight");
  assert.equal(safeIntent.ok, true);
  assert.equal(safeIntent.value.origin, "SFO");
  assert.equal(Object.prototype.hasOwnProperty.call(safeIntent.value, "hotelName"), false);

  const analytics = api.sanitizeAnalyticsEvent("travel_ai_analysis_requested", {
    domain:"flight",
    rawQuery:"SFO to NRT 2027-03-01",
    origin:"SFO",
    destination:"NRT",
    fullUrl:"https://example.test/search?token=abc",
    analysisText:"private trip",
    resultCountBucket:"2-5"
  });
  assert.equal(analytics.ok, true);
  assert.equal(analytics.rawTravelQueryCollected, false);
  assert.equal(analytics.travelContentCollected, false);
  assert.equal(analytics.fullUrlCollected, false);
  assert.equal(Object.prototype.hasOwnProperty.call(analytics.event, "origin"), false);

  assert.equal(api.normalizeAiState("READY"), "CONNECTED");
  assert.equal(api.normalizeAiState("surprising"), "NOT_CONFIGURED");
  assert.equal(api.capabilityMatrix().some((row) => row.capability === "TRAVEL_AI_ANALYZE" && row.requiresAi === true), true);
  assert.equal(api.moduleInventory().every((row) => row.decision === "KEEP" || row.decision === "OPTIMIZE"), true);
  assert.equal(api.featureMatrix().length, 3);

  const many = Array.from({ length:1200 }, (_, index) => flight({ id:"perf-" + index, totalComparableCost:1000 + index, handoffUrl:"https://perf.example/f/" + index }));
  const perf = api.buildViewModel({ domain:"flight", aiState:"CONNECTED", context:{ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", passengers:1, cabin:"economy" }, results:many });
  assert.equal(perf.results.length, 1200);
  assert.equal(perf.comparison.deterministicRecommendation.candidateId, "perf-0");

  console.log("TRAVEL_BASIC_AI_MODE_CORE=PASS");
}

main();
