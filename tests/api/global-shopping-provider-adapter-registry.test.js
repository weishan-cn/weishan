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
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistry.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderAdapterRegistry;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VERSION, "4.1.9");

  const ready = api.buildGlobalShoppingProviderAdapterRegistry({
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
  assert.equal(ready.appVersion, "4.1.9");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider Adapter 注册表");
  assert.equal(ready.rows.length, 6);
  assert.equal(ready.registryHealth.hasAdapters, true);
  assert.equal(ready.registryHealth.noNetwork, true);
  assert.equal(ready.registryBoundary.canRegisterProductionAdapter, false);

  const review = api.buildGlobalShoppingProviderAdapterRegistry({
    registryMode:"dry_run",
    adapterShells:[{
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
  assert.equal(review.status, "ready");

  const empty = api.buildGlobalShoppingProviderAdapterRegistry({
    registryMode:"dry_run",
    adapterShells:[]
  });
  assert.equal(empty.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderAdapterRegistry({
    registryMode:"dry_run",
    adapterShells:[{
      adapterId:"unsafe_adapter",
      providerId:"provider_1",
      providerName:"Unsafe Provider",
      providerType:"partner",
      adapterMode:"dry_run",
      readOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      redactedOutputOnly:true,
      hasRealEndpoint:true
    }]
  });
  assert.equal(blocked.status, "blocked");
  assert.ok(blocked.blockedReasons.includes("real_endpoint_detected"));

  const safeJson = JSON.stringify(ready);
  assert.equal(/https?:\/\/|"(token|secret|key)":"[^"]+"/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY PASS");
}

main();
