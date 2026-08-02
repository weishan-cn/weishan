const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
vm.runInContext(fs.readFileSync(path.join(root, "apps/desktop/src/renderer/core/globalDiscoveryEngine.js"), "utf8"), context);
const api = windowRef.WeishanGlobalDiscoveryEngine;

function provider(providerId, domains, markets) {
  return { providerId, displayName:providerId, domains, markets, capabilities:{ search:true, redirect:true, availability:true, price:true, shipping:true, tax:true, inventory:true } };
}

function main() {
  const productRegion = api.resolveDiscoveryRegion({ domain:"product", shippingDestination:"Japan", userLocation:"US" });
  const hotelRegion = api.resolveDiscoveryRegion({ domain:"hotel", hotelCountry:"JP", userLocation:"US" });
  const flightRegion = api.resolveDiscoveryRegion({ domain:"flight", departure:"US", arrival:"JP", paymentRegion:"CN", userLocation:"GB" });
  const stockRegion = api.resolveDiscoveryRegion({ domain:"stock", exchange:"TSE", currency:"JPY", userLocation:"US" });

  assert.equal(productRegion.primaryMarket, "JP");
  assert.equal(productRegion.source, "shipping_destination");
  assert.equal(hotelRegion.primaryMarket, "JP");
  assert.deepEqual(Array.from(flightRegion.markets), ["US", "JP", "CN"]);
  assert.equal(stockRegion.primaryMarket, "JP");
  assert.equal(productRegion.userLocationIgnored, true);

  const selected = api.selectDiscoveryProviders({
    domain:"product",
    shippingDestination:"JP",
    providers:[provider("amazon-jp", ["product"], ["JP"]), provider("amazon-us", ["product"], ["US"])]
  });
  assert.deepEqual(JSON.parse(JSON.stringify(selected.providers.map((item) => item.providerId))), ["amazon-jp"]);
  assert.equal(selected.providerCalls, 0);
  assert.equal(selected.networkRequests, 0);

  const invalid = api.validateProviderCapabilityContract({ providerId:"invalid", domains:["product"], markets:["JP"], capabilities:{ search:true, redirect:false } });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.contract.paymentAccessGranted, false);

  const product = api.normalizeDiscoveryCandidate("product", { candidateId:"p1", title:"Camera", price:100, shipping:10, tax:5, currency:"JPY", seller:"Official", provider:"amazon-jp", officialSeller:true, redirectUrl:"https://example.test/item" });
  const hotel = api.normalizeDiscoveryCandidate("hotel", { candidateId:"h1", hotelName:"Tokyo Hotel", roomType:"King", checkIn:"2026-09-01", checkOut:"2026-09-03", subtotal:100, tax:10, fees:5, cityTax:2, currency:"JPY", provider:"hotel-jp", cancelPolicy:"free cancellation", breakfast:true, redirectUrl:"https://example.test/hotel" });
  const flight = api.normalizeDiscoveryCandidate("flight", { candidateId:"f1", airline:"Example Air", departure:"SFO", arrival:"NRT", stops:0, baggage:"20kg", subtotal:100, tax:20, fees:5, fuel:6, baggageFee:4, currency:"JPY", provider:"airline-jp", redirectUrl:"https://example.test/flight" });
  const stock = api.normalizeDiscoveryCandidate("stock", { candidateId:"s1", symbol:"7203", exchange:"TSE", lastPrice:2500, currency:"JPY", provider:"market-jp", redirectUrl:"https://example.test/stock" });
  assert.equal(product.total, 115);
  assert.equal(hotel.total, 117);
  assert.equal(flight.total, 135);
  assert.equal(stock.total, 2500);
  [product, hotel, flight, stock].forEach((candidate) => {
    assert.equal(candidate.checkoutAvailable, false);
    assert.equal(candidate.paymentAvailable, false);
    assert.equal(candidate.orderAvailable, false);
    assert.equal(candidate.redirect.userInitiatedRequired, true);
    assert.equal(candidate.redirect.executesRedirect, false);
  });

  const plan = api.createGlobalDiscoveryPlan({
    domain:"hotel",
    query:"Tokyo hotel",
    hotelCountry:"JP",
    providers:[provider("hotel-jp", ["hotel"], ["JP"])],
    candidates:[
      { candidateId:"a", provider:"hotel-jp", hotelName:"A", subtotal:100, tax:10, fees:0, cityTax:0, cancelPolicy:"non-refundable", currency:"JPY", redirectUrl:"https://example.test/a" },
      { candidateId:"b", provider:"hotel-jp", hotelName:"B", subtotal:105, tax:10, fees:0, cityTax:0, cancelPolicy:"free cancellation", currency:"JPY", redirectUrl:"https://example.test/b" }
    ]
  });
  assert.equal(plan.mode, "architecture_only");
  assert.equal(plan.execution.providerCalls, 0);
  assert.equal(plan.execution.networkRequests, 0);
  assert.equal(plan.execution.externalRedirects, 0);
  assert.equal(plan.comparison.recommendations.bestPrice.candidateId, "a");
  assert.equal(plan.comparison.recommendations.bestFlexibility.candidateId, "b");
  assert.equal(plan.boundaries.payments, false);
  assert.equal(plan.redirectContract.createsOrder, false);
  assert.equal(api.REDIRECT_CONTRACT.storesPaymentData, false);
  console.log("GLOBAL_DISCOVERY_ENGINE PASS");
}

main();
