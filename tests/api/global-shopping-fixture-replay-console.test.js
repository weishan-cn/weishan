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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingFixtureReplayConsole.js"
  ]);
  const connector = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxConnector.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" }
  });
  const api = windowRef.WeishanGlobalShoppingFixtureReplayConsole;
  assert.equal(api.GLOBAL_SHOPPING_FIXTURE_REPLAY_CONSOLE_VERSION, "3.6.0");

  const ready = api.buildGlobalShoppingFixtureReplayConsole({
    connectorSummary:connector,
    replayPayload:{
      replayId:"replay_1",
      replayMode:"fixture",
      redacted:true,
      normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
      officialFixturePrice:{ title:"Official Fixture", basePrice:920 },
      partnerFixturePrices:[{ title:"Partner Fixture", basePrice:899 }]
    }
  });
  assert.equal(ready.appVersion, "3.6.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.replaySession.canCallNetwork, false);
  assert.equal(ready.replaySummary.officialSourceCount, 1);
  assert.equal(ready.replaySummary.partnerSourceCount, 1);

  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ replayPayload:{ replayId:"x", redacted:true } }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:false } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, networkEnabled:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, rawResponseStored:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, rawResponseExposedToRenderer:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, fileWrite:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, externalReplayFile:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, bookingUrl:"https://blocked.example" } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, payment:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, order:true } }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true, ticketing:true } }).status, "blocked");

  const safeJson = JSON.stringify(api.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"x", redacted:true }, token:"abc", secret:"def" }));
  assert.equal(/abc|def|bookingUrl|paymentUrl|orderUrl|checkoutUrl/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_FIXTURE_REPLAY_CONSOLE PASS");
}

main();
