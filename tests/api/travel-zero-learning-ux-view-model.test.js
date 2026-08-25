#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const sourcePath = path.join(root, "apps/desktop/src/renderer/core/travelZeroLearningUxViewModel.js");

function loadModule() {
  const context = {
    window:{},
    URL,
    Intl,
    Date,
    Number,
    String,
    Object,
    Array,
    RegExp,
    console
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(sourcePath, "utf8"), context, { filename:sourcePath });
  return context.window.WeishanTravelZeroLearningUxViewModel;
}

const ux = loadModule();

assert.equal(ux.MODULE_NAME, "travel_zero_learning_ux_view_model_v1");

function json(value) {
  return JSON.stringify(value);
}

function assertNoInternalLeak(model) {
  const serialized = json(model);
  assert.equal(/COMMERCIAL_CREDENTIALS_REQUIRED|MTLS_CERTIFICATE_REQUIRED|HTTP\s*401|OAuth|client_secret|API key|Authorization|Bearer|\/Users\/|apps\/desktop|stack trace/i.test(serialized), false, serialized);
}

function assertGovernance(model) {
  assert.equal(model.executionGate, "CLOSED");
  assert.equal(model.authorizesExecution, false);
  assert.equal(model.productionTraffic, false);
  assert.equal(model.WEISHAN_PAYS_PROVIDER, false);
  assert.equal(model.PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION, false);
  assert.equal(model.BOOKING, false);
  assert.equal(model.ORDER, false);
  assert.equal(model.PAYMENT, false);
  assert.equal(model.TICKING, undefined);
  assert.equal(model.TICKETING, false);
}

{
  const model = ux.buildTravelZeroLearningUxViewModel({
    domain:"flight",
    search:{ origin:"PVG", destination:"LHR", departureDate:"2026-10-01", returnDate:"2026-10-10", cabin:"Economy" },
    results:[{
      airline:"Example Air",
      flightNumber:"EA88",
      origin:"PVG",
      destination:"LHR",
      departureTime:"2026-10-01 09:00",
      arrivalTime:"2026-10-01 16:30",
      cabin:"Economy",
      availability:"seats shown in test environment",
      price:{ amount:690, currency:"USD", priceBasis:"TOTAL_ITINERARY", priceState:"SANDBOX_TEST_DATA", taxesIncluded:true, feesIncluded:true, testData:true },
      handoff:{ url:"https://example-air.test/search?pv=pvg-lhr", quality:"EXACT_ITINERARY_HANDOFF" }
    }]
  });
  assert.equal(model.domain, "FLIGHT");
  assert.equal(model.cards.length, 1);
  assert.equal(model.cards[0].price.publicState, "TEST_DATA");
  assert.equal(model.cards[0].price.publicLivePrice, false);
  assert.match(model.cards[0].price.display, /Test data/);
  assert.equal(model.cards[0].price.basisLabel, "total itinerary");
  assert.equal(model.cards[0].handoff.cta, "View flight");
  assert.equal(model.cards[0].handoff.autoOpen, false);
  assert.equal(model.metrics.NO_PROVIDER_KNOWLEDGE_REQUIRED, true);
  assert.equal(model.metrics.TEST_DATA_ISOLATED, true);
  assertNoInternalLeak(model);
  assertGovernance(model);
}

{
  const model = ux.buildTravelZeroLearningUxViewModel({
    domain:"flight",
    search:{ origin:"PVG", destination:"LHR", departureDate:"2026-10-10", returnDate:"2026-10-01" },
    results:[]
  });
  assert.match(model.validationErrors.join(" "), /Return date must be after departure date/);
  assert.equal(model.cards.length, 0);
  assert.equal(model.metrics.SEARCH_COMPLETED, false);
}

{
  const model = ux.buildTravelZeroLearningUxViewModel({
    domain:"flight",
    search:{ origin:"PVG", destination:"LHR", departureDate:"2026-10-01" },
    results:[{
      airline:"Wrong Date Air",
      flightNumber:"WD1",
      origin:"PVG",
      destination:"LHR",
      departureTime:"2026-11-01 09:00",
      contextMatches:false,
      price:{ amount:500, currency:"USD", priceBasis:"TOTAL_ITINERARY", priceState:"CURRENT_PRICE" },
      handoff:{ url:"https://wrong-date.example/search", quality:"EXACT_ITINERARY_HANDOFF" }
    }]
  });
  assert.equal(model.cards.length, 0);
  assert.equal(model.filteredOutCount, 1);
  assert.equal(model.noResults, true);
}

{
  const model = ux.buildTravelZeroLearningUxViewModel({
    domain:"hotel",
    search:{ destination:"Tokyo", checkIn:"2026-11-02", checkOut:"2026-11-05", guests:2 },
    results:[{
      propertyName:"Long Name Hotel <script>alert(1)</script> ".repeat(8),
      location:"Tokyo",
      roomName:"Superior Twin",
      availability:"available",
      price:{ amount:180, currency:"USD", priceBasis:"PER_NIGHT", priceState:"CURRENT_PRICE", taxesIncluded:false, feesIncluded:false, observedAt:"2026-08-25T10:00:00Z" },
      handoff:{ url:"https://hotel.example/property/123", quality:"EXACT_STAY_HANDOFF" }
    }]
  });
  const card = model.cards[0];
  assert.equal(card.price.basisLabel, "per night");
  assert.match(card.subtitle, /3 nights/);
  assert.match(card.price.taxesAndFeesLabel, /may change/);
  assert.equal(card.handoff.cta, "View hotel");
  assert.equal(/<script>/i.test(json(model)), false);
  assert.equal(card.title.endsWith("…"), true);
  assertNoInternalLeak(model);
}

{
  const model = ux.buildTravelZeroLearningUxViewModel({
    domain:"hotel",
    search:{ destination:"Singapore", checkIn:"2026-12-10", checkOut:"2026-12-12", guests:2 },
    results:[{
      propertyName:"Quiet Harbor Hotel",
      location:"Singapore",
      roomName:"Deluxe",
      availability:"availability not proven",
      price:{ priceState:"PRICE_UNAVAILABLE", priceBasis:"TOTAL_STAY", currency:"USD" },
      handoff:{ url:"https://hotel.example/property/quiet-harbor", quality:"EXACT_PROPERTY_HANDOFF" }
    }]
  });
  assert.equal(model.cards[0].price.publicState, "PRICE_UNAVAILABLE");
  assert.match(model.cards[0].userWarnings.join(" "), /No reliable price/);
  assert.equal(model.cards[0].handoff.cta, "View hotel");
}

{
  const invalid = ux.buildTravelZeroLearningUxViewModel({
    domain:"hotel",
    search:{ destination:"Paris", checkIn:"2026-12-12", checkOut:"2026-12-12" },
    results:[]
  });
  assert.match(invalid.validationErrors.join(" "), /Check-out must be after check-in/);
}

{
  const model = ux.buildTravelZeroLearningUxViewModel({
    domain:"cruise",
    search:{ destination:"Caribbean", departureDate:"2027-01-12", guests:2 },
    results:[{
      ship:"Queen Example",
      itinerary:"Eastern Caribbean",
      departureDate:"2027-01-12",
      departurePort:"Miami",
      cabinCategory:"Balcony",
      price:{ amount:499, currency:"USD", priceBasis:"PER_PERSON_DOUBLE_OCCUPANCY", priceState:"FROM_PRICE" },
      handoff:{ url:"https://cruise.example/sailing/abc", quality:"EXACT_SAILING_CABIN_HANDOFF" }
    }]
  });
  assert.equal(model.cards[0].price.publicState, "INDICATIVE_PRICE");
  assert.match(model.cards[0].price.display, /From/);
  assert.equal(model.cards[0].price.basisLabel, "per person, double occupancy");
  assert.equal(model.cards[0].handoff.cta, "View sailing");
  assert.match(model.cards[0].userWarnings.join(" "), /indicative price/);
}

{
  const unavailable = ux.buildTravelZeroLearningUxViewModel({
    domain:"cruise",
    search:{ destination:"Alaska", departureDate:"2027-06-01", guests:2 },
    results:[{
      ship:"Northern Star",
      itinerary:"Alaska Inside Passage",
      departureDate:"2027-06-01",
      price:{ priceState:"PRICE_UNAVAILABLE", priceBasis:"TOTAL_BOOKING" },
      handoff:{ url:"https://cruise.example/search/alaska", quality:"GENERIC_HOME" }
    }]
  });
  assert.equal(unavailable.cards[0].price.publicState, "PRICE_UNAVAILABLE");
  assert.equal(unavailable.cards[0].handoff.cta, "Open search");
  assert.equal(unavailable.cards[0].handoff.downgraded, true);
}

{
  const unsafe = ux.buildTravelZeroLearningUxViewModel({
    domain:"cruise",
    search:{ destination:"Mediterranean", departureDate:"2027-07-01", guests:2 },
    results:[{
      ship:"Sea Example",
      itinerary:"Mediterranean",
      price:{ amount:900, currency:"USD", priceBasis:"TOTAL_BOOKING", priceState:"CURRENT_PRICE" },
      handoff:{ url:"http://cruise.example/checkout/abc", quality:"EXACT_SAILING_CABIN_HANDOFF" }
    }]
  });
  assert.equal(unsafe.cards[0].handoff.safe, false);
  assert.equal(unsafe.cards[0].handoff.cta, "No safe external link");
  assert.match(unsafe.cards[0].userWarnings.join(" "), /No safe external link/);
}

{
  const partial = ux.buildTravelZeroLearningUxViewModel({
    domain:"flight",
    search:{ origin:"SFO", destination:"NRT", departureDate:"2026-11-11" },
    failures:[{ message:"HTTP 401 MTLS_CERTIFICATE_REQUIRED at /Users/boge/apps/desktop" }],
    results:[{
      airline:"Clean Air",
      flightNumber:"CA1",
      origin:"SFO",
      destination:"NRT",
      price:{ amount:800, currency:"USD", priceBasis:"TOTAL_ITINERARY", priceState:"CURRENT_PRICE" },
      handoff:{ url:"https://flight.example/offer", quality:"EXACT_ITINERARY_HANDOFF" }
    }]
  });
  assert.equal(partial.partialSourceFailure, true);
  assertNoInternalLeak(partial);
  assert.match(partial.sourceFailures[0].publicMessage, /technical setup detail/);
}

{
  const allFailed = ux.buildTravelZeroLearningUxViewModel({
    domain:"hotel",
    search:{ destination:"Bangkok", checkIn:"2026-10-01", checkOut:"2026-10-02" },
    failures:[{ message:"Provider stack trace: HTTP 401" }]
  });
  assert.equal(allFailed.allSourceFailure, true);
  assert.match(allFailed.userSummary, /No travel source returned usable results/);
  assertNoInternalLeak(allFailed);
}

{
  const weird = ux.buildTravelZeroLearningUxViewModel({
    domain:"flight",
    search:{ origin:"LAX", destination:"JFK", departureDate:"2026-09-01" },
    results:[
      { price:{ amount:NaN, currency:"USD", priceBasis:"TOTAL_ITINERARY", priceState:"CURRENT_PRICE" }, handoff:{ url:"https://flight.example/search", quality:"EXACT_ITINERARY_HANDOFF" } },
      { price:{ amount:Infinity, currency:"USD", priceBasis:"TOTAL_ITINERARY", priceState:"CURRENT_PRICE" }, handoff:{ url:"https://flight.example/search", quality:"EXACT_ITINERARY_HANDOFF" } },
      { price:{ amount:-1, currency:"USD", priceBasis:"TOTAL_ITINERARY", priceState:"CURRENT_PRICE" }, handoff:{ url:"https://flight.example/search", quality:"EXACT_ITINERARY_HANDOFF" } },
      { price:{ amount:100, currency:"UNKNOWN", priceBasis:"TOTAL_ITINERARY", priceState:"CURRENT_PRICE" }, handoff:{ url:"https://flight.example/search", quality:"EXACT_ITINERARY_HANDOFF" } }
    ]
  });
  assert.equal(weird.cards.every((card) => card.price.publicState === "PRICE_UNAVAILABLE"), true);
}

{
  const invalid = ux.buildTravelZeroLearningUxViewModel({
    domain:"cruise",
    search:{ destination:"Baltic", departureDate:"2027-08-01", guests:0 }
  });
  assert.match(invalid.validationErrors.join(" "), /Guest count must be at least 1/);
}

{
  const model = ux.buildTravelZeroLearningUxViewModel({
    domain:"hotel",
    search:{ destination:"Seoul", checkIn:"2026-11-01", checkOut:"2026-11-02" },
    results:[{
      propertyName:"Keyboard Hotel",
      price:{ amount:120, currency:"USD", priceBasis:"TOTAL_STAY", priceState:"CURRENT_PRICE" },
      handoff:{ url:"https://hotel.example/stay", quality:"EXACT_STAY_HANDOFF" }
    }]
  });
  const html = ux.renderTravelZeroLearningUxHtml(model);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /aria-label/);
  assert.equal(/Book Now|checkout/i.test(html), false);
  assert.match(html, /does not book, reserve, issue tickets, take payment, or place orders/);
}

console.log("travel-zero-learning-ux-view-model: PASS");
