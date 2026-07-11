const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
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
    "apps/desktop/src/renderer/core/globalShoppingRakutenAuthAbstraction.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRequestSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenResponseSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenFieldMapping.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRateLimitModel.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenErrorMapping.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenAuditTrace.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRealProviderAdapterContractLayer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderProductionReadiness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingAmazonSandboxAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderHealthSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseSafetyFilter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderErrorNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGateway.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderGateway;
  const result = api.buildGlobalShoppingProviderGatewayResult({
    providerId:"amazon_japan",
    operation:"searchProducts",
    payload:{ query:"Nintendo Switch" },
    regionContext:{ country:"JP" }
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_GATEWAY_VERSION, "4.2.8");
  assert.equal(result.status, "sandbox");
  assert.equal(result.metadata.gatewayMode, "sandbox_only");
  assert.equal(result.metadata.configurationCheck.status, "sandbox");
  assert.equal(result.metadata.featureFlagCheck.flagState, "sandbox_enabled");
  assert.equal(result.metadata.versionCheck.status, "testing");
  assert.equal(result.metadata.productionReadiness.readinessLevel, "sandbox");
  assert.equal(result.metadata.realProviderPreparation.status, "sandbox_only");
  assert.equal(result.audit.permissionResult.allowed, true);
  assert.equal(result.result.status, "sandbox");

  const rakuten = api.buildGlobalShoppingProviderGatewayResult({
    providerId:"rakuten_japan",
    operation:"searchProducts",
    payload:{ query:"Nintendo Switch" },
    regionContext:{ country:"JP" }
  });
  assert.equal(rakuten.metadata.realProviderPreparation.status, "documented");
  assert.equal(rakuten.metadata.productionReadiness.providerPreparationState, "documented");
  assert.equal(rakuten.audit.realProviderPreparation.status, "documented");
  console.log("GLOBAL_SHOPPING_PROVIDER_GATEWAY PASS");
}

main();
