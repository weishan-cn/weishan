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
    "apps/desktop/src/renderer/core/globalShoppingFirstSandboxProviderConnector.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingFirstSandboxProviderConnector;
  assert.equal(api.GLOBAL_SHOPPING_FIRST_SANDBOX_PROVIDER_CONNECTOR_VERSION, "4.2.7");

  const ready = api.buildGlobalShoppingFirstSandboxProviderConnector({
    providerId:"fixture_provider",
    providerName:"Fixture Provider",
    providerType:"fixture",
    itemType:"flight",
    connectorMode:"dry_run",
    adapterRegistry:{ status:"ready", redacted:true },
    adapterShell:{ status:"ready", adapterShell:{ providerId:"fixture_provider", providerName:"Fixture Provider", providerType:"fixture", itemType:"flight" }, redacted:true },
    dryRunHarness:{ status:"ready", dryRunLifecycle:{ dryRunMode:"dry_run" }, redacted:true },
    safetyKillSwitch:{ status:"clear", redacted:true },
    requestEnvelope:{ status:"ready", requestEnvelope:{ requestMeta:{ providerId:"fixture_provider", providerName:"Fixture Provider", itemType:"flight" } }, redacted:true },
    providerRunbook:{ status:"ready", redacted:true },
    dryRunResponseNormalizer:{ status:"ready", normalizationHealth:{ noRawResponsePersistence:true, noRendererRawLeak:true }, redacted:true },
    normalizedSourceInputs:[{ sourceId:"official_1", sourceName:"Official Fixture", sourceType:"official", itemType:"flight", redacted:true }]
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "第一个 Sandbox Provider Connector");
  assert.equal(ready.connectorResult.normalizedSourceInputCount, 1);
  assert.equal(ready.connectorResult.canEnterCoverageDashboard, true);
  assert.equal(ready.connectorResult.canEnterSourceTrustScore, true);

  const review = api.buildGlobalShoppingFirstSandboxProviderConnector({
    providerId:"fixture_provider",
    providerName:"Fixture Provider",
    providerType:"fixture",
    connectorMode:"dry_run"
  });
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingFirstSandboxProviderConnector({
    adapterRegistry:{ status:"ready", redacted:true },
    adapterShell:{ status:"ready", adapterShell:{ providerId:"fixture_provider", providerName:"Fixture Provider", providerType:"fixture" }, redacted:true },
    dryRunHarness:{ status:"ready", dryRunLifecycle:{ dryRunMode:"dry_run" }, redacted:true },
    safetyKillSwitch:{ status:"clear", redacted:true },
    requestEnvelope:{ status:"ready", requestEnvelope:{ requestMeta:{ providerId:"fixture_provider", providerName:"Fixture Provider", itemType:"flight" } }, redacted:true },
    providerRunbook:{ status:"ready", redacted:true },
    hasRealEndpoint:true
  });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedReasons.includes("real_endpoint_detected"));

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_FIRST_SANDBOX_PROVIDER_CONNECTOR PASS");
}

main();
