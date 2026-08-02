const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const languageStore = {};
const windowRef = { navigator:{language:"zh-CN"}, WeishanStore:{read:(key, fallback) => Object.prototype.hasOwnProperty.call(languageStore, key) ? languageStore[key] : fallback, write:(key, value) => { languageStore[key] = value; }}, dispatchEvent() {} };
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef, CustomEvent:function CustomEvent() {} });
["i18n.js", "globalDiscoveryErrorContract.js", "globalDiscoveryInputGuard.js", "globalDiscoveryEngine.js", "globalDiscoveryWorkspace.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, "apps/desktop/src/renderer/core", file), "utf8"), context));
const api = windowRef.WeishanGlobalDiscoveryWorkspace;

function run(businessType) {
  return api.runGlobalDiscoveryWorkspace(api.transitionGlobalDiscoveryWorkspace(api.createGlobalDiscoveryWorkspaceState({ businessType }), { type:"EDIT" }));
}

function main() {
  const product = run("product");
  const hotel = run("hotel");
  const flight = run("flight");
  const stock = run("stock");
  assert.equal(product.searchState, "COMPLETED");
  assert.equal(product.resolvedMarket.primaryMarket, "JP");
  assert.equal(hotel.resolvedMarket.primaryMarket, "JP");
  assert.equal(hotel.selectedProviders.length, 4);
  assert.equal(flight.resolvedMarket.markets.join(","), "CN,JP");
  assert.equal(stock.resolvedMarket.primaryMarket, "US");
  assert.equal(product.resolvedMarket.userLocationIgnored, true);
  assert.equal(hotel.normalizedCandidates[0].total, 24400);
  assert.equal(flight.normalizedCandidates[0].total, 1620);
  assert.equal(stock.recommendations.primarySource.label, "PRIMARY_SOURCE");
  assert.equal(product.normalizedCandidates.length <= 3, true);
  assert.equal(product.normalizedCandidates.every((item) => item.checkoutAvailable === false && item.paymentAvailable === false && item.orderAvailable === false), true);
  assert.equal(product.normalizedCandidates[0].redirectUrl.startsWith("fixture://"), true);
  assert.equal(Object.isFrozen(product), true);

  const defaultBusinessType = api.runGlobalDiscoveryWorkspace(api.createGlobalDiscoveryWorkspaceState());
  assert.equal(defaultBusinessType.businessType, "product");
  assert.equal(defaultBusinessType.searchState, "COMPLETED");
  ["car", "insurance", "boat"].forEach((businessType) => {
    const typed = api.transitionGlobalDiscoveryWorkspace(api.createGlobalDiscoveryWorkspaceState(), { type:"TYPE", businessType });
    const unsupported = api.runGlobalDiscoveryWorkspace(typed);
    const expected = windowRef.WeishanGlobalDiscoveryErrorContract.createGlobalDiscoveryError("UNSUPPORTED_BUSINESS_TYPE").error;
    assert.equal(unsupported.businessType, businessType);
    assert.equal(unsupported.searchState, "FAILED");
    assert.equal(unsupported.error.code, expected.code);
    assert.equal(unsupported.error.stage, expected.stage);
    assert.equal(unsupported.error.recoverable, expected.recoverable);
    assert.equal(unsupported.error.userMessage, expected.userMessage);
    assert.equal(unsupported.error.detailsSummary, expected.detailsSummary);
  });

  const lifecycle = api.createGlobalDiscoveryWorkspaceState();
  assert.equal(lifecycle.searchState, "IDLE");
  assert.equal(api.transitionGlobalDiscoveryWorkspace(lifecycle, { type:"EDIT", query:"x" }).searchState, "READY");
  assert.equal(api.transitionGlobalDiscoveryWorkspace(lifecycle, { type:"SEARCHING" }).searchState, "SEARCHING");
  assert.equal(api.runGlobalDiscoveryWorkspace(Object.assign({}, lifecycle, { query:"", destination:"" })).error.code, "INVALID_QUERY");
  assert.equal(api.runGlobalDiscoveryWorkspace(Object.assign({}, lifecycle, { query:"x", destination:"" })).error.code, "INVALID_DESTINATION");

  const duplicate = api.deduplicateGlobalDiscoveryCandidates("product", [product.normalizedCandidates[0], Object.assign({}, product.normalizedCandidates[0], { provider:"Other Demo" })], "Japan");
  assert.equal(duplicate.length, 1);
  assert.equal(duplicate[0].offers.length, 2);
  const intent = api.createRedirectIntent(product.normalizedCandidates[0], product);
  assert.equal(intent.status, "CREATED");
  assert.equal(intent.allowed, true);
  assert.equal(api.updateRedirectIntent(intent, "CONFIRM").status, "CONFIRMED");
  assert.equal(api.updateRedirectIntent(intent, "CANCEL").status, "CANCELLED");
  assert.equal(api.createRedirectIntent({ candidateId:"bad", redirectUrl:"javascript:alert(1)" }, product).status, "REJECTED");

  const crossCurrency = windowRef.WeishanGlobalDiscoveryEngine.buildDiscoveryComparison({ domain:"product", candidates:[{candidateId:"jpy",provider:"a",price:100,shipping:0,tax:0,currency:"JPY"},{candidateId:"usd",provider:"b",price:1,shipping:0,tax:0,currency:"USD"}] });
  assert.equal(crossCurrency.currencyComparable, false);
  assert.equal(crossCurrency.recommendations.bestPrice, null);
  const rendered = api.renderGlobalDiscoveryWorkspace(product);
  assert.match(rendered, /全球发现/);
  assert.match(rendered, /第三方平台完成/);
  assert.equal(/window\.open|openExternal|location\.href/.test(rendered), false);
  console.log("GLOBAL_DISCOVERY_WORKSPACE PASS");
}

main();
