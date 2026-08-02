const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
["globalDiscoveryErrorContract.js", "globalDiscoveryInputGuard.js", "globalDiscoveryEngine.js", "globalDiscoveryWorkspace.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, "apps/desktop/src/renderer/core", file), "utf8"), context));

const guard = windowRef.WeishanGlobalDiscoveryInputGuard;
const engine = windowRef.WeishanGlobalDiscoveryEngine;
const workspace = windowRef.WeishanGlobalDiscoveryWorkspace;

function provider(id, domain, markets) {
  return { providerId:id, displayName:id, domains:[domain], markets, capabilities:{ search:true, redirect:true, availability:true, price:true, shipping:true, tax:true, inventory:true } };
}

function productCandidate(id, price, currency) {
  return { candidateId:id, title:"Matrix Product", variant:"Standard", price, shipping:10, tax:5, currency:currency || "JPY", seller:"Matrix", provider:"matrix-jp", officialSeller:id === "official", deliveryDays:2, redirectUrl:"fixture://provider/product/" + id };
}

function workspaceResult(fixtures) {
  return workspace.runGlobalDiscoveryWorkspace(Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { fixtures }));
}

function workspaceResultFor(state, fixtures) {
  return workspace.runGlobalDiscoveryWorkspace(Object.assign({}, state, { fixtures }));
}

function assertContract(result, code, stage) {
  assert.equal(result.error.code, code);
  assert.equal(result.error.stage, stage);
  assert.equal(result.error.recoverable, true);
  assert.deepEqual(Object.keys(result.error).sort(), ["code", "detailsSummary", "recoverable", "stage", "userMessage"]);
  assert.equal(Object.prototype.hasOwnProperty.call(result.error, "stack"), false);
}

function main() {
  [null, false, true, 0, 1, "safe", [], {}].forEach((value) => assert.equal(guard.guardAndCloneInput(value).valid, true));
  assert.equal(guard.guardAndCloneInput(undefined).valid, false);
  [Infinity, -Infinity, NaN].forEach((value) => assert.equal(guard.guardAndCloneInput(value).code, "INVALID_NUMBER"));
  const getter = {}; Object.defineProperty(getter, "value", { get() { throw new Error("must not run"); } });
  const setter = {}; Object.defineProperty(setter, "value", { set() {} });
  const circular = {}; circular.self = circular;
  const proto = {}; Object.defineProperty(proto, "__proto__", { value:"blocked" });
  const constructor = {}; Object.defineProperty(constructor, "constructor", { value:"blocked" });
  const prototype = {}; Object.defineProperty(prototype, "prototype", { value:"blocked" });
  const symbol = {}; symbol[Symbol("unsafe")] = true;
  [getter, setter, circular, proto, constructor, prototype, { callback() {} }, symbol].forEach((value) => assert.equal(guard.guardAndCloneInput(value).valid, false));
  let deep = {}; for (let index = 0; index < 10; index += 1) deep = { child:deep };
  assert.equal(guard.guardAndCloneInput(deep).code, "MAX_DEPTH_EXCEEDED");
  assert.equal(guard.guardAndCloneInput(Array.from({ length:101 }, () => "x")).code, "MAX_NODES_EXCEEDED");
  const largeText = "x".repeat(50000);
  assert.equal(guard.guardAndCloneInput({ query:largeText }).valid, true);

  const engineFunctions = ["resolveDiscoveryRegion", "createProviderCapabilityContract", "validateProviderCapabilityContract", "selectDiscoveryProviders", "normalizeDiscoveryCandidates", "buildDiscoveryComparison", "createRedirectIntent", "createGlobalDiscoveryPlan"];
  engineFunctions.forEach((name) => {
    const result = engine[name](getter);
    assert.equal(result.error.code, "NORMALIZATION_REJECTED", name);
    assert.equal(Object.prototype.hasOwnProperty.call(result.error, "stack"), false, name);
  });
  assert.equal(engine.normalizeDiscoveryCandidate("product", getter).error.code, "NORMALIZATION_REJECTED");

  const jp = provider("matrix-jp", "product", ["JP"]);
  const us = provider("matrix-us", "product", ["US"]);
  const selected = engine.selectDiscoveryProviders({ domain:"product", shippingDestination:"JP", providers:[jp, us] });
  assert.deepEqual(JSON.parse(JSON.stringify(selected.providers.map((item) => item.providerId))), ["matrix-jp"]);
  const secondJp = provider("matrix-jp-second", "product", ["JP"]);
  const multiple = engine.selectDiscoveryProviders({ domain:"product", shippingDestination:"JP", providers:[jp, secondJp, us] });
  assert.deepEqual(JSON.parse(JSON.stringify(multiple.providers.map((item) => item.providerId))), ["matrix-jp", "matrix-jp-second"]);
  assert.deepEqual(JSON.parse(JSON.stringify(engine.selectDiscoveryProviders({ domain:"product", shippingDestination:"JP", providers:[jp, secondJp, us] }).providers)), JSON.parse(JSON.stringify(multiple.providers)));
  assert.equal(engine.validateProviderCapabilityContract(Object.assign({}, jp, { capabilities:Object.assign({}, jp.capabilities, { search:false }) })).valid, false);
  const noProvider = workspaceResult({ providers:[], candidates:[] });
  assertContract(noProvider, "NO_PROVIDER", "PROVIDER_SELECTION");
  const unmatched = workspaceResult({ providers:[us], candidates:[] });
  assertContract(unmatched, "NO_PROVIDER", "PROVIDER_SELECTION");
  const invalidProvider = workspaceResult({ providers:[Object.assign({}, jp, { capabilities:Object.assign({}, jp.capabilities, { redirect:false }) })], candidates:[] });
  assertContract(invalidProvider, "NORMALIZATION_REJECTED", "INPUT_GUARD");
  const missingSearch = workspaceResult({ providers:[Object.assign({}, jp, { capabilities:Object.assign({}, jp.capabilities, { search:false }) })], candidates:[] });
  assertContract(missingSearch, "NORMALIZATION_REJECTED", "INPUT_GUARD");
  const unknown = workspace.runGlobalDiscoveryWorkspace(workspace.transitionGlobalDiscoveryWorkspace(workspace.createGlobalDiscoveryWorkspaceState(), { type:"TYPE", businessType:"car" }));
  assertContract(unknown, "UNSUPPORTED_BUSINESS_TYPE", "INPUT");
  assert.equal(workspace.CATALOG.product.providers.length, 3);

  const normalizedProduct = engine.normalizeDiscoveryCandidate("product", productCandidate("p", 100, "JPY"));
  const normalizedHotel = engine.normalizeDiscoveryCandidate("hotel", { candidateId:"h", hotelName:"Matrix Hotel", roomType:"King", checkIn:"2026-01-01", checkOut:"2026-01-02", subtotal:100, tax:10, fees:5, cityTax:2, currency:"JPY", provider:"hotel", redirectUrl:"fixture://provider/hotel/h" });
  const normalizedFlight = engine.normalizeDiscoveryCandidate("flight", { candidateId:"f", airline:"Matrix Air", departure:"A", arrival:"B", stops:0, baggage:"20kg", subtotal:100, tax:10, fees:5, fuel:2, baggageFee:3, currency:"JPY", provider:"flight", redirectUrl:"fixture://provider/flight/f" });
  const normalizedStock = engine.normalizeDiscoveryCandidate("stock", { candidateId:"s", symbol:"M", exchange:"NASDAQ", lastPrice:12, currency:"USD", provider:"stock", redirectUrl:"fixture://provider/stock/s" });
  assert.deepEqual([normalizedProduct.total, normalizedHotel.total, normalizedFlight.total, normalizedStock.total], [115, 117, 120, 12]);
  const invalidStockAmount = engine.normalizeDiscoveryCandidate("stock", { candidateId:"bad", symbol:"M", exchange:"NASDAQ", lastPrice:"not-a-number", currency:"USD", provider:"stock", redirectUrl:"fixture://provider/stock/bad" });
  assert.equal(invalidStockAmount.total, null);
  const invalidStockWorkspace = workspaceResultFor(workspace.createGlobalDiscoveryWorkspaceState({ businessType:"stock" }), { providers:[provider("stock", "stock", ["US"])], candidates:[{ candidateId:"bad", symbol:"M", exchange:"NASDAQ", lastPrice:"not-a-number", currency:"USD", provider:"stock", redirectUrl:"fixture://provider/stock/bad" }] });
  assertContract(invalidStockWorkspace, "NORMALIZATION_REJECTED", "INPUT_GUARD");
  const ordered = engine.normalizeDiscoveryCandidates({ domain:"product", candidates:[productCandidate("first", 100), productCandidate("second", 110)] });
  assert.deepEqual(JSON.parse(JSON.stringify(ordered.map((item) => item.candidateId))), ["first", "second"]);
  ordered[0].title = "Mutated";
  assert.equal(engine.normalizeDiscoveryCandidates({ domain:"product", candidates:[productCandidate("first", 100)] })[0].title, "Matrix Product");
  const invalidCurrency = workspaceResult({ providers:[jp], candidates:[productCandidate("bad-currency", 100, "BAD1")] });
  assertContract(invalidCurrency, "NORMALIZATION_REJECTED", "INPUT_GUARD");
  const invalidUrl = workspaceResult({ providers:[jp], candidates:[Object.assign(productCandidate("bad-url", 100), { redirectUrl:"invalid" })] });
  assertContract(invalidUrl, "NORMALIZATION_REJECTED", "INPUT_GUARD");
  const emptyTitle = engine.normalizeDiscoveryCandidate("product", Object.assign(productCandidate("empty-title", 100), { title:"" }));
  assert.equal(emptyTitle.title, "");
  [getter, setter, circular, proto, { callback() {} }, symbol].forEach((value) => assert.equal(engine.normalizeDiscoveryCandidate("product", value).error.code, "NORMALIZATION_REJECTED"));

  const sameCurrency = engine.buildDiscoveryComparison({ domain:"product", candidates:[productCandidate("first", 120), productCandidate("official", 100)] });
  assert.equal(sameCurrency.currencyComparable, true);
  assert.equal(sameCurrency.candidates[0].candidateId, "official");
  assert.equal(sameCurrency.recommendations.bestPrice.candidateId, "official");
  assert.equal(sameCurrency.candidates[0].total, 115);
  const mixedCurrency = engine.buildDiscoveryComparison({ domain:"product", candidates:[productCandidate("jpy", 100, "JPY"), productCandidate("usd", 1, "USD")] });
  assert.equal(mixedCurrency.currencyComparable, false);
  assert.equal(mixedCurrency.recommendations.bestPrice, null);
  const tied = engine.buildDiscoveryComparison({ domain:"product", candidates:[productCandidate("first", 100), productCandidate("second", 100)] });
  assert.equal(tied.recommendations.bestPrice.candidateId, "first");
  assert.deepEqual(JSON.parse(JSON.stringify(engine.buildDiscoveryComparison({ domain:"product", candidates:[productCandidate("first", 100)] }))), JSON.parse(JSON.stringify(engine.buildDiscoveryComparison({ domain:"product", candidates:[productCandidate("first", 100)] }))));
  const fourCandidates = workspaceResult({ providers:[jp], candidates:[productCandidate("a", 100), productCandidate("b", 101), productCandidate("c", 102), productCandidate("d", 103)] });
  assert.equal(fourCandidates.normalizedCandidates.length, 3);

  const productPlan = engine.createGlobalDiscoveryPlan({ domain:"product", shippingDestination:"JP", providers:[jp], candidates:[productCandidate("product", 100)] });
  const hotelPlan = engine.createGlobalDiscoveryPlan({ domain:"hotel", hotelCountry:"JP", providers:[provider("hotel", "hotel", ["JP"])], candidates:[normalizedHotel] });
  const flightPlan = engine.createGlobalDiscoveryPlan({ domain:"flight", departure:"CN", arrival:"JP", providers:[provider("flight", "flight", ["CN", "JP"])], candidates:[normalizedFlight] });
  const stockPlan = engine.createGlobalDiscoveryPlan({ domain:"stock", exchange:"NASDAQ", region:"US", providers:[provider("stock", "stock", ["US"])], candidates:[normalizedStock] });
  [productPlan, hotelPlan, flightPlan, stockPlan].forEach((plan) => assert.equal(plan.execution.networkRequests, 0));
  assert.equal(productPlan.comparison.recommendations.bestValue.candidateId, "product");
  assert.equal(hotelPlan.comparison.recommendations.bestPrice.candidateId, "h");
  assert.equal(flightPlan.comparison.recommendations.bestFlexibility.candidateId, "f");
  assert.equal(stockPlan.comparison.recommendations.bestPrice.candidateId, "s");
  assert.equal(engine.buildDiscoveryComparison({ domain:"product", candidates:[] }).recommendations.bestPrice, null);
  const noResult = workspaceResult({ providers:[jp], candidates:[] });
  assertContract(noResult, "NO_RESULT", "NORMALIZATION");
  const isolatedFixtures = { providers:[provider("isolated-jp", "product", ["JP"])], candidates:[] };
  const isolatedResult = workspaceResult(isolatedFixtures);
  isolatedFixtures.providers[0].markets[0] = "US";
  assert.deepEqual(JSON.parse(JSON.stringify(isolatedResult.selectedProviders[0].matchedMarkets)), ["JP"]);
  // derived partial state only; this is not Provider failure coverage.
  const partialFixtures = { providers:[provider("partial-jp", "product", ["JP"])], candidates:[productCandidate("partial", 100)] };
  const partialInputSnapshot = JSON.stringify(partialFixtures);
  const derivedPartial = workspaceResult(partialFixtures);
  assert.equal(derivedPartial.searchState, "PARTIAL");
  assert.equal(derivedPartial.error, null);
  assert.equal(Object.prototype.hasOwnProperty.call(derivedPartial, "errorCode"), false);
  assert.equal(derivedPartial.normalizedCandidates.length, 1);
  assert.equal(derivedPartial.recommendations.bestPrice.candidateId, "partial");
  assert.equal(JSON.stringify(partialFixtures), partialInputSnapshot);
  assert.deepEqual(JSON.parse(JSON.stringify(workspaceResult({ providers:[provider("partial-jp", "product", ["JP"])], candidates:[productCandidate("partial", 100)] }))), JSON.parse(JSON.stringify(derivedPartial)));
  derivedPartial.normalizedCandidates[0].provider = "Mutated";
  assert.equal(workspaceResult({ providers:[provider("partial-jp", "product", ["JP"])], candidates:[productCandidate("partial", 100)] }).normalizedCandidates[0].provider, "matrix-jp");
  assert.equal(windowRef.WeishanGlobalDiscoveryErrorContract.CODES.includes("PARTIAL_PROVIDER_RESULT"), true);

  const projectionInput = Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState({ query:"Projection Query", destination:"Japan", paymentRegion:"JP", currencyPreference:"JPY" }), {
    accessToken:"audit-access-token",
    refreshToken:"audit-refresh-token",
    providerResponse:"audit-provider-response",
    stack:"audit-stack",
    internalError:"audit-internal-error",
    futureUnknownField:"audit-future-field",
    fixtures:{ providers:[provider("projection-jp", "product", ["JP"])], candidates:[productCandidate("projection", 100)] }
  });
  const projectionSnapshot = JSON.stringify(projectionInput);
  const projected = workspace.runGlobalDiscoveryWorkspace(projectionInput);
  assert.equal(projected.businessType, "product");
  assert.equal(projected.query, "Projection Query");
  assert.equal(projected.destination, "Japan");
  assert.equal(projected.paymentRegion, "JP");
  assert.equal(projected.currencyPreference, "JPY");
  assert.equal(Object.prototype.hasOwnProperty.call(projected, "fixtures"), false);
  ["accessToken", "refreshToken", "providerResponse", "stack", "internalError", "futureUnknownField"].forEach((key) => assert.equal(Object.prototype.hasOwnProperty.call(projected, key), false));
  ["audit-access-token", "audit-refresh-token", "audit-provider-response", "audit-stack", "audit-internal-error", "audit-future-field"].forEach((marker) => assert.equal(JSON.stringify(projected).includes(marker), false));
  assert.equal(JSON.stringify(projectionInput), projectionSnapshot);
  assert.deepEqual(JSON.parse(JSON.stringify(workspace.runGlobalDiscoveryWorkspace(projectionInput))), JSON.parse(JSON.stringify(projected)));
  ["authorization", "cookie", "secret", "password", "endpoint"].forEach((key) => {
    const marker = "audit-" + key;
    const rejected = workspace.runGlobalDiscoveryWorkspace(Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { [key]:marker }));
    assert.equal(rejected.error.code, "NORMALIZATION_REJECTED");
    assert.equal(JSON.stringify(rejected).includes(marker), false);
  });

  const validRedirect = workspace.createRedirectIntent(productCandidate("redirect", 100), workspace.createGlobalDiscoveryWorkspaceState());
  assert.equal(validRedirect.status, "CREATED");
  assert.equal(workspace.updateRedirectIntent(validRedirect, "CANCEL").status, "CANCELLED");
  assert.equal(workspace.createRedirectIntent({ candidateId:"missing" }, workspace.createGlobalDiscoveryWorkspaceState()).code, "REDIRECT_REJECTED");
  const rejectedRedirect = workspaceResult({ redirectIntent:{ redirectUrl:"https://untrusted.example/offer" } });
  assertContract(rejectedRedirect, "REDIRECT_REJECTED", "REDIRECT");
  assert.notEqual(rejectedRedirect.error.code, "INVALID_DESTINATION");
  assert.equal(JSON.stringify(rejectedRedirect).includes("untrusted.example"), false);
  assert.equal(workspaceResult({ redirectIntent:{ redirectUrl:"fixture://provider/product/approved" } }).searchState, "COMPLETED");

  const deterministicInputs = [
    workspace.createGlobalDiscoveryWorkspaceState(),
    Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { query:"" }),
    Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { query:"x", destination:"" }),
    Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { fixtures:{ providers:[], candidates:[] } }),
    Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { fixtures:{ providers:[provider("deterministic-jp", "product", ["JP"])], candidates:[] } }),
    Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { fixtures:{ providers:[provider("deterministic-jp", "product", ["JP"])], candidates:[Object.assign(productCandidate("bad", 100), { currency:"BAD1" })] } }),
    Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { fixtures:{ redirectIntent:{ redirectUrl:"https://untrusted.example/deterministic" } } }),
    workspace.transitionGlobalDiscoveryWorkspace(workspace.createGlobalDiscoveryWorkspaceState(), { type:"TYPE", businessType:"car" }),
    Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { fixtures:{ providers:[provider("deterministic-jp", "product", ["JP"])], candidates:[productCandidate("derived", 100)] } })
  ];
  deterministicInputs.forEach((input) => {
    const expected = JSON.stringify(workspace.runGlobalDiscoveryWorkspace(input));
    for (let index = 0; index < 20; index += 1) assert.equal(JSON.stringify(workspace.runGlobalDiscoveryWorkspace(input)), expected);
  });
  const deterministicMixed = JSON.stringify(engine.buildDiscoveryComparison({ domain:"product", candidates:[productCandidate("det-jpy", 100, "JPY"), productCandidate("det-usd", 1, "USD")] }));
  for (let index = 0; index < 20; index += 1) assert.equal(JSON.stringify(engine.buildDiscoveryComparison({ domain:"product", candidates:[productCandidate("det-jpy", 100, "JPY"), productCandidate("det-usd", 1, "USD")] })), deterministicMixed);
  const deterministicCancel = JSON.stringify(workspace.updateRedirectIntent(validRedirect, "CANCEL"));
  for (let index = 0; index < 20; index += 1) assert.equal(JSON.stringify(workspace.updateRedirectIntent(validRedirect, "CANCEL")), deterministicCancel);
  console.log("GLOBAL_DISCOVERY_TEST_MATRIX PASS");
}

main();
