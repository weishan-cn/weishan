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
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderResponseContract.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxProviderResponseContract;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PROVIDER_RESPONSE_CONTRACT_VERSION, "4.2.7");

  const ready = api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    officialFixturePrice:{ title:"Official Fixture", basePrice:920 },
    partnerFixturePrices:[{ title:"Partner Fixture", basePrice:899 }]
  });
  assert.equal(ready.appVersion, "4.2.7");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Provider 响应合同已准备");
  assert.equal(ready.responseBoundary.fixtureOnly, true);
  assert.equal(ready.responseBoundary.rawResponseStored, false);
  assert.equal(ready.normalizedSummary.hasOfficialSource, true);
  assert.equal(ready.normalizedSummary.canEnterPricePipeline, true);

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }]
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }]
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }]
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" }
  }).status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    mockProviderPayload:{ rawResponseStored:true }
  });
  assert.equal(blocked.status, "blocked");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    mockProviderPayload:{ rawResponseExposedToRenderer:true }
  }).status, "blocked");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    mockProviderPayload:{ rawResponseLogged:true }
  }).status, "blocked");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    mockProviderPayload:{ realApiKeyDetected:true }
  }).status, "blocked");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    mockProviderPayload:{ userIdentityDetected:true }
  }).status, "blocked");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    mockProviderPayload:{ paymentDataDetected:true }
  }).status, "blocked");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    mockProviderPayload:{ bookingUrl:"https://blocked.example" }
  }).status, "blocked");

  assert.equal(api.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    mockProviderPayload:{ checkout:true, payment:true, ticketing:true }
  }).status, "blocked");

  const safeJson = JSON.stringify(api.buildGlobalShoppingSandboxProviderResponseContract({
    token:"abc",
    secret:"def",
    providerFixture:{ providerId:"fixture_provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }]
  }));
  assert.equal(/abc|def/.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_PROVIDER_RESPONSE_CONTRACT PASS");
}

main();
