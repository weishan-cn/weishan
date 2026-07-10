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
    "apps/desktop/src/renderer/core/globalShoppingProviderProductionReadiness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCapabilityModel.js",
    "apps/desktop/src/renderer/core/globalShoppingAdapterCapabilityResolver.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderConfigurationSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFeatureFlag.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderVersionRegistry.js",
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
  const readinessApi = windowRef.WeishanGlobalShoppingProviderProductionReadiness;
  const api = windowRef.WeishanGlobalShoppingProviderGateway;
  const ready = readinessApi.buildGlobalShoppingProviderProductionReadiness({
    providerId:"apple_official",
    configuration:{ providerId:"apple_official", valid:true, status:"ready", adapterVersion:"4.2.8-ready", contractVersion:"4.2.8" },
    featureFlag:{ enabled:true, flagState:"enabled" },
    version:{ providerId:"apple_official", adapterVersion:"4.2.8-ready", contractVersion:"4.2.8", compatibility:"contract_compatible", status:"active" },
    permissionAllowed:true,
    transactionAllowed:false,
    compliance:{ allowed:true, reason:"allowed" },
    adapterStatus:{ stage:"ready", status:"ready" }
  });
  const blocked = readinessApi.buildGlobalShoppingProviderProductionReadiness({
    providerId:"booking",
    configuration:{ providerId:"booking", valid:false, status:"draft", invalidReason:"sensitive_field_detected", containsSensitiveFields:true },
    featureFlag:{ enabled:false, flagState:"disabled", reason:"provider_disabled" },
    version:{ providerId:"booking", status:"deprecated" },
    permissionAllowed:false,
    transactionAllowed:true,
    compliance:{ allowed:false, reason:"compliance_blocked" },
    adapterStatus:{ stage:"sandbox", status:"testing" }
  });
  const result = api.buildGlobalShoppingProviderGatewayResult({
    providerId:"amazon_us",
    operation:"searchProducts",
    payload:{ query:"iphone", category:"product", currency:"USD" },
    regionContext:{ country:"US" }
  });

  assert.equal(ready.readinessLevel, "ready");
  assert.equal(ready.ready, true);
  assert.equal(blocked.readinessLevel, "blocked");
  assert.ok(blocked.blockers.includes("sensitive_field_detected"));
  assert.ok(blocked.blockers.includes("transaction_permission_forbidden"));
  assert.equal(result.status, "sandbox");
  assert.equal(result.metadata.configurationCheck.status, "sandbox");
  assert.equal(result.metadata.featureFlagCheck.flagState, "sandbox_enabled");
  assert.equal(result.metadata.versionCheck.status, "testing");
  assert.equal(result.metadata.productionReadiness.readinessLevel, "sandbox");
  assert.equal(result.audit.configurationCheck.valid, true);
  console.log("GLOBAL_SHOPPING_PROVIDER_PRODUCTION_READINESS PASS");
}

main();
