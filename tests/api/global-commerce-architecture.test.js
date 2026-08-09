const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const windowRef = {};
windowRef.window = windowRef;
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/renderer/core/globalCommerceArchitecture.js"), "utf8"),
  vm.createContext({ window:windowRef })
);

const architecture = windowRef.WeishanGlobalCommerceArchitecture;

assert.deepEqual(
  JSON.parse(JSON.stringify(architecture.PIPELINE)),
  ["discovery", "pricing", "availability", "merchantTrust", "decision", "checkoutIntent", "analytics"]
);
assert.equal(architecture.ARCHITECTURE_VERSION, "GLOBAL_COMMERCE_ARCHITECTURE_V2");
assert.deepEqual(
  JSON.parse(JSON.stringify(architecture.LEGACY_PHASE_1_CORE_PROCESSING_SEQUENCE)),
  ["discovery", "pricing", "availability", "merchantTrust", "decision", "checkoutIntent", "analytics"]
);
assert.deepEqual(
  JSON.parse(JSON.stringify(architecture.FROZEN_COMMERCE_CORE_SEQUENCE)),
  ["pricing", "availability", "merchantTrust", "decision"]
);
assert.deepEqual(
  JSON.parse(JSON.stringify(architecture.PRODUCT_LEVEL_LOGICAL_FLOW)),
  ["commerceSessionContext", "regionResolver", "regionCatalog", "providerRegistry", "globalDiscoveryBoundary", "pricing", "availability", "merchantTrust", "decision", "checkoutIntent", "redirectIntent", "externalPlatformBoundary"]
);
assert.deepEqual(JSON.parse(JSON.stringify(architecture.GLOBAL_DISCOVERY_BOUNDARY)), {
  boundaryType:"GLOBAL_DISCOVERY", connected:false, mutable:false, executionEnabled:false
});
assert.deepEqual(JSON.parse(JSON.stringify(architecture.EXTERNAL_PLATFORM_BOUNDARY)), {
  boundaryType:"EXTERNAL_PLATFORM", connected:false, executionEnabled:false, handoffEnabled:false
});
assert.equal(architecture.PRICE_SNAPSHOT.status, "contract_only");
assert.deepEqual(JSON.parse(JSON.stringify(architecture.PRICE_SNAPSHOT.required)), ["currency", "effectivePrice", "priceConfidence"]);
assert.deepEqual(JSON.parse(JSON.stringify(architecture.AVAILABILITY.statuses)), ["IN_STOCK", "LIMITED", "OUT_OF_STOCK", "REGION_RESTRICTED", "PREORDER", "BACKORDER"]);
assert.deepEqual(JSON.parse(JSON.stringify(architecture.MERCHANT_TRUST.merchantTypes)), ["OFFICIAL", "AUTHORIZED", "MARKETPLACE", "INDIVIDUAL"]);
assert.equal(architecture.DECISION.required.includes("explainability"), true);
assert.equal(architecture.CHECKOUT_INTENT.userInitiatedRequired, true);
assert.equal(architecture.CHECKOUT_INTENT.executesCheckout, false);
assert.equal(architecture.CHECKOUT_INTENT.acceptsPayment, false);
assert.equal(architecture.CHECKOUT_INTENT.createsOrder, false);
assert.equal(architecture.ANALYTICS.collectsData, false);
assert.equal(architecture.DEPENDENCIES.discovery.implementation, "external_frozen_contract");
["pricing", "availability", "merchantTrust", "decision", "checkoutIntent", "analytics"].forEach((name) => {
  assert.equal(architecture.DEPENDENCIES[name].implementation, "none");
});
assert.deepEqual(JSON.parse(JSON.stringify(architecture.ACTIVATION)), {
  architectureOnly:true,
  runtimeEnabled:false,
  providerExecutionEnabled:false,
  networkEnabled:false,
  discoveryMutationAllowed:false,
  checkoutExecutionEnabled:false,
  analyticsCollectionEnabled:false,
  redirectExecutionEnabled:false,
  paymentExecutionEnabled:false,
  orderExecutionEnabled:false,
  inventoryRuntimeEnabled:false,
  settlementEnabled:false,
  merchantCenterEnabled:false,
  factoryDirectEnabled:false
});
Object.keys(architecture.ACTIVATION).forEach((key) => {
  if (key !== "architectureOnly") assert.equal(architecture.ACTIVATION[key], false);
});
assert.equal(architecture.OFFLINE_SKELETON_READINESS.runtimeOrchestratorSkeletonReady, true);
assert.equal(architecture.ACTIVATION.runtimeEnabled, false);
assert.equal(architecture.CAPABILITY_MATRIX.every((entry) => entry.runtimeEnabled === false && entry.executionEnabled === false), true);
assert.equal(architecture.CAPABILITY_MATRIX.find((entry) => entry.capability === "ProviderRuntime").skeletonReady, false);
assert.deepEqual(JSON.parse(JSON.stringify(architecture.PROVIDER_SELECTION_POLICY.targetProviderRange)), { min:8, max:10 });
assert.deepEqual(JSON.parse(JSON.stringify(architecture.PROVIDER_SELECTION_POLICY.maxDisplayedCandidates)), { min:2, max:3 });
assert.equal(Object.isFrozen(architecture), true);
console.log("GLOBAL_COMMERCE_ARCHITECTURE_SKELETON PASS");
