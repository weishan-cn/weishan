const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../..");
const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef });
["globalDiscoveryErrorContract.js", "globalDiscoveryInputGuard.js", "globalDiscoveryEngine.js", "globalDiscoveryWorkspace.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, "apps/desktop/src/renderer/core", file), "utf8"), context));

const workspace = windowRef.WeishanGlobalDiscoveryWorkspace;

function provider(providerId, markets) {
  return {
    providerId,
    displayName:providerId,
    domains:["product"],
    markets,
    capabilities:{ search:true, redirect:true, availability:true, price:true, shipping:true, tax:true, inventory:true }
  };
}

function run(fixtures) {
  return workspace.runGlobalDiscoveryWorkspace(Object.assign({}, workspace.createGlobalDiscoveryWorkspaceState(), { fixtures }));
}

function assertError(result, expected) {
  assert.equal(result.error.code, expected.code);
  assert.equal(result.error.stage, expected.stage);
  assert.equal(result.error.recoverable, true);
  assert.equal(result.error.userMessage, expected.userMessage);
  assert.equal(result.error.detailsSummary, expected.detailsSummary);
  assert.deepEqual(Object.keys(result.error).sort(), ["code", "detailsSummary", "recoverable", "stage", "userMessage"]);
  assert.equal(Object.prototype.hasOwnProperty.call(result.error, "stack"), false);
}

function main() {
  const redirectRejected = run({ redirectIntent:{ redirectUrl:"https://untrusted.example/offer" } });
  assert.equal(redirectRejected.searchState, "FAILED");
  assertError(redirectRejected, { code:"REDIRECT_REJECTED", stage:"REDIRECT", userMessage:"该平台查看意图不符合安全规则。", detailsSummary:"Redirect rejected" });
  assert.equal(JSON.stringify(redirectRejected).includes("untrusted.example"), false);
  const legalRedirect = workspace.createRedirectIntent(workspace.runGlobalDiscoveryWorkspace(workspace.createGlobalDiscoveryWorkspaceState()).normalizedCandidates[0], workspace.createGlobalDiscoveryWorkspaceState());
  assert.equal(legalRedirect.status, "CREATED");
  assert.equal(workspace.updateRedirectIntent(legalRedirect, "CANCEL").status, "CANCELLED");
  assert.equal(run({ redirectIntent:{ redirectUrl:"fixture://provider/product/approved" } }).searchState, "COMPLETED");

  const emptyCandidates = { providers:[provider("jp-empty", ["JP"])], candidates:[] };
  const noResult = run(emptyCandidates);
  assert.equal(noResult.searchState, "EMPTY");
  assert.equal(noResult.selectedProviders.length, 1);
  assertError(noResult, { code:"NO_RESULT", stage:"NORMALIZATION", userMessage:"当前离线演示没有匹配结果。", detailsSummary:"No result available" });
  assert.notEqual(noResult.error.code, "NO_PROVIDER");
  assert.notEqual(noResult.error.code, "NORMALIZATION_REJECTED");
  emptyCandidates.providers[0].markets[0] = "US";
  assert.deepEqual(JSON.parse(JSON.stringify(noResult.selectedProviders[0].matchedMarkets)), ["JP"]);
  const repeatNoResult = run({ providers:[provider("jp-empty", ["JP"])], candidates:[] });
  assert.deepEqual(JSON.parse(JSON.stringify(repeatNoResult.error)), JSON.parse(JSON.stringify(noResult.error)));

  const noProviderEmpty = run({ providers:[], candidates:[] });
  assert.equal(noProviderEmpty.searchState, "EMPTY");
  assertError(noProviderEmpty, { code:"NO_PROVIDER", stage:"PROVIDER_SELECTION", userMessage:"当前目标市场没有可用的离线来源。", detailsSummary:"No provider available" });
  assert.notEqual(noProviderEmpty.error.code, "NO_RESULT");
  const noProviderMismatch = run({ providers:[provider("us-only", ["US"])], candidates:[] });
  assertError(noProviderMismatch, { code:"NO_PROVIDER", stage:"PROVIDER_SELECTION", userMessage:"当前目标市场没有可用的离线来源。", detailsSummary:"No provider available" });
  const invalidProvider = run({ providers:[{ providerId:"invalid", domains:["product"], markets:["JP"], capabilities:{ search:true, redirect:false } }], candidates:[] });
  assert.equal(invalidProvider.error.code, "NORMALIZATION_REJECTED");

  const unknownType = workspace.runGlobalDiscoveryWorkspace(Object.assign({}, workspace.transitionGlobalDiscoveryWorkspace(workspace.createGlobalDiscoveryWorkspaceState(), { type:"TYPE", businessType:"car" }), { fixtures:{ providers:[], candidates:[] } }));
  assert.equal(unknownType.error.code, "UNSUPPORTED_BUSINESS_TYPE");
  assert.notEqual(unknownType.error.code, "NO_PROVIDER");
  const defaultProduct = workspace.runGlobalDiscoveryWorkspace(workspace.createGlobalDiscoveryWorkspaceState());
  assert.equal(defaultProduct.businessType, "product");
  assert.equal(defaultProduct.searchState, "COMPLETED");
  assert.equal(workspace.CATALOG.product.providers.length, 3);
  console.log("GLOBAL_DISCOVERY_ERROR_SCENARIOS PASS");
}

main();
