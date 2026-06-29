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
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunHarness.js",
    "apps/desktop/src/renderer/core/globalShoppingDryRunProviderResponseNormalizer.js"
  ]);
  const registry = windowRef.WeishanGlobalShoppingProviderAdapterRegistry.buildGlobalShoppingProviderAdapterRegistry({
    registryMode:"dry_run",
    adapterShells:[{
      adapterId:"global_fixture_provider_dry_run",
      providerId:"global_fixture_provider",
      providerName:"Global Shopping Fixture Sandbox",
      providerType:"fixture",
      adapterMode:"dry_run",
      readOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      redactedOutputOnly:true
    }]
  });
  const harness = windowRef.WeishanGlobalShoppingProviderSandboxDryRunHarness.buildGlobalShoppingProviderSandboxDryRunHarness({
    providerRequestEnvelopeSummary:{ status:"ready", redacted:true },
    realProviderSandboxGateSummary:{ status:"ready", redacted:true },
    providerCallAuditLedgerSummary:{ status:"ready", redacted:true },
    providerSandboxSafetyKillSwitchSummary:{ status:"clear", redacted:true }
  });
  const api = windowRef.WeishanGlobalShoppingDryRunProviderResponseNormalizer;
  assert.equal(api.GLOBAL_SHOPPING_DRY_RUN_PROVIDER_RESPONSE_NORMALIZER_VERSION, "2.1.98");

  const ready = api.buildGlobalShoppingDryRunProviderResponseNormalizer({
    adapterRegistry:registry,
    dryRunHarness:harness,
    responseMode:"dry_run",
    redactedResponseSummary:{
      responseMode:"dry_run",
      providerId:"global_fixture_provider",
      providerName:"Global Shopping Fixture Sandbox",
      redacted:true
    },
    fixturePrices:[{
      sourceId:"fixture_source_1",
      sourceName:"Fixture Source",
      sourceType:"fixture",
      title:"SHA-CTU Fixture",
      basePrice:920,
      taxAmount:120,
      currency:"CNY"
    }]
  });
  assert.equal(ready.appVersion, "2.1.98");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Dry-Run Provider 响应归一化器");
  assert.equal(ready.normalizedSourceInputs.length, 1);
  assert.equal(ready.responseBoundary.rawResponseAccepted, false);

  const review = api.buildGlobalShoppingDryRunProviderResponseNormalizer({
    adapterRegistry:registry,
    dryRunHarness:harness,
    responseMode:"dry_run",
    fixturePrices:[]
  });
  assert.equal(review.status, "needs_review");

  const blocked = api.buildGlobalShoppingDryRunProviderResponseNormalizer({
    adapterRegistry:registry,
    dryRunHarness:harness,
    responseMode:"dry_run",
    redactedResponseSummary:{ responseMode:"dry_run", redacted:true },
    fixturePrices:[{ title:"Unsafe Fixture", basePrice:920 }],
    rawResponseStored:true
  });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedReasons.includes("raw_response_persistence_detected"));

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_DRY_RUN_PROVIDER_RESPONSE_NORMALIZER PASS");
}

main();
