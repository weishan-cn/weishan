const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js"]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxConnector;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_CONNECTOR_VERSION, "2.4.1");

  const ready = api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    connectorMode:"fixture",
    fixturePayload:{ providerId:"fixture_provider", providerName:"Fixture Provider", redacted:true }
  });
  assert.equal(ready.appVersion, "2.4.1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.connectorBoundary.connectorMode, "fixture");
  assert.equal(ready.connectorBoundary.canCallNetwork, false);
  assert.equal(ready.connectorBoundary.canReadProductionKey, false);
  assert.equal(ready.connectorOutput.canEnterPricePipeline, true);

  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" }
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" }
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    providerResponseContract:{ status:"ready" }
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" }
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    networkEnabled:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    productionKeyRead:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    rawResponseStored:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    rawResponseExposedToRenderer:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    rawResponseLogged:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    bookingUrl:"https://blocked.example"
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    checkout:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    payment:true
  }).status, "blocked");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" },
    ticketing:true
  }).status, "blocked");

  const safeJson = JSON.stringify(api.buildGlobalShoppingReadOnlyProviderSandboxConnector({ token:"abc", key:"def", secret:"ghi" }));
  assert.equal(/abc|def|ghi|bookingUrl|paymentUrl|orderUrl|checkoutUrl/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_PROVIDER_SANDBOX_CONNECTOR PASS");
}

main();
