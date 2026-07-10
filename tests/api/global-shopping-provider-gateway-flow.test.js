const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingProviderCapabilityModel.js",
    "apps/desktop/src/renderer/core/globalShoppingAdapterCapabilityResolver.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderConfigurationSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFeatureFlag.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderVersionRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderProductionReadiness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingAmazonSandboxAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderHealthSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseSafetyFilter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderErrorNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGateway.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderGateway;
  const result = api.buildGlobalShoppingProviderGatewayResult({
    providerId:"amazon_us",
    operation:"searchProducts",
    payload:{ query:"iphone", currency:"USD", capturedAt:"2026-07-10T00:00:00.000Z" },
    regionContext:{ country:"US" }
  });

  assert.equal(result.status, "sandbox");
  assert.equal(result.result.sourceType, "sandbox");
  assert.equal(Array.isArray(result.result.normalizedResults), true);
  assert.equal(result.result.normalizedResults[0].confidence, "mock");
  assert.equal(result.metadata.configurationCheck.status, "sandbox");
  assert.equal(result.metadata.featureFlagCheck.flagState, "sandbox_enabled");
  assert.equal(result.metadata.versionCheck.status, "testing");
  assert.equal(result.metadata.productionReadiness.readinessLevel, "sandbox");
  assert.equal(Array.isArray(result.audit.gatewayTrace), true);
  assert.equal(result.audit.gatewayTrace.length >= 5, true);
  console.log("GLOBAL_SHOPPING_PROVIDER_GATEWAY_FLOW PASS");
}

main();
