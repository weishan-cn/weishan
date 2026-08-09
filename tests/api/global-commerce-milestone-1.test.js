const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "../../apps/desktop/src/renderer/core");
const windowRef = {};
windowRef.window = windowRef;
const context = vm.createContext({ window:windowRef, Set, Number, Object, Array, String, Boolean, RegExp });
[
  "globalCommerceInputGuard.js",
  "globalCommerceArchitecture.js",
  "globalCommerceRegionResolver.js",
  "globalCommerceRegionCatalog.js",
  "globalCommerceProviderRegistry.js",
  "globalCommerceSession.js",
  "globalCommerceCheckoutIntent.js",
  "globalCommerceRedirectIntent.js",
  "globalCommerceArtifact.js",
  "globalCommerceRuntimeSkeleton.js"
].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context));

const resolver = windowRef.WeishanGlobalCommerceRegionResolver;
const catalog = windowRef.WeishanGlobalCommerceRegionCatalog;
const providers = windowRef.WeishanGlobalCommerceProviderRegistry;
const session = windowRef.WeishanGlobalCommerceSession;
const checkout = windowRef.WeishanGlobalCommerceCheckoutIntent;
const redirect = windowRef.WeishanGlobalCommerceRedirectIntent;
const artifact = windowRef.WeishanGlobalCommerceArtifact;
const runtime = windowRef.WeishanGlobalCommerceRuntimeSkeleton;
const architecture = windowRef.WeishanGlobalCommerceArchitecture;

assert.equal(resolver.resolveCommerceRegion({ countryCode:"US" }).value.countryCode, "US");
assert.equal(resolver.resolveCommerceRegion({ countryCode:"JP" }).value.countryCode, "JP");
assert.equal(resolver.resolveCommerceRegion({ countryCode:"UK" }).value.countryCode, "GB");
assert.equal(resolver.resolveCommerceRegion({ countryCode:"BR" }).code, "REGION_UNSUPPORTED");
const regionInput = { countryCode:"GB" };
assert.deepEqual(JSON.parse(JSON.stringify(resolver.resolveCommerceRegion(regionInput))), JSON.parse(JSON.stringify(resolver.resolveCommerceRegion(regionInput))));
assert.equal(catalog.listRegions().length, 10);
assert.equal(new Set(catalog.listRegions().map((region) => region.countryCode)).size, 10);
assert.equal(catalog.findRegion("UK").value.countryCode, "GB");
assert.equal(providers.listProviders().every((provider) => provider.runtimeConnected === false), true);
assert.equal(providers.listProviders().every((provider) => !Object.prototype.hasOwnProperty.call(provider, "endpoint") && !Object.prototype.hasOwnProperty.call(provider, "token")), true);
assert.deepEqual(JSON.parse(JSON.stringify(providers.findProviders({ region:"JP", businessType:"PRODUCT" }).value.map((provider) => provider.providerId))), ["reference.product.jp"]);

assert.equal(session.createCommerceSession({ sessionId:"fixed-session", region:"JP", businessType:"PRODUCT" }).success, true);
assert.equal(session.createCommerceSession({ region:"JP" }).code, "COMMERCE_SESSION_REJECTED");
assert.equal(session.createCommerceSession({ sessionId:"fixed", token:"no" }).code, "COMMERCE_SESSION_REJECTED");
assert.equal(checkout.createCheckoutIntent({ intentType:"BUY", decisionState:"ELIGIBLE" }).value.intentType, "BUY");
assert.equal(checkout.createCheckoutIntent({ intentType:"BUY", decisionState:"NOT_ELIGIBLE" }).value.intentType, "VIEW_DETAILS");
assert.equal(checkout.createCheckoutIntent({ intentType:"BOOK", decisionState:"NOT_ELIGIBLE" }).value.executionEnabled, false);
assert.equal(redirect.createRedirectIntent({ intentId:"i1", providerId:"reference.product.jp", landingType:"PRODUCT", targetReference:"listing-1" }).value.executionEnabled, false);
assert.equal(redirect.createRedirectIntent({ intentId:"i1", providerId:"reference.product.jp", landingType:"PRODUCT", targetReference:"https://example.test" }).code, "REDIRECT_INTENT_REJECTED");
const firstArtifact = artifact.createCommerceArtifact({ type:"REGION_ARTIFACT", payload:{ countryCode:"JP", url:"blocked" } });
assert.equal(firstArtifact.success, true);
assert.equal(Object.prototype.hasOwnProperty.call(firstArtifact.value.payload, "url"), false);
assert.equal(artifact.createCommerceArtifact({ type:"UNKNOWN", payload:{} }).code, "COMMERCE_ARTIFACT_REJECTED");
const plan = runtime.createOfflineExecutionPlan();
assert.equal(plan.success, true);
assert.equal(plan.plan.connected, false);
assert.equal(plan.plan.executable, false);
assert.equal(plan.plan.stages.includes("globalDiscoveryBoundary"), true);
assert.equal(plan.plan.activationSnapshot.runtimeEnabled, false);
assert.equal(runtime.validatePipelineCompatibility().success, true);
assert.equal(architecture.CAPABILITY_MATRIX.every((entry) => entry.runtimeEnabled === false && entry.executionEnabled === false), true);
for (let index = 0; index < 20; index += 1) assert.deepEqual(JSON.parse(JSON.stringify(runtime.createOfflineExecutionPlan())), JSON.parse(JSON.stringify(plan)));

const getterInput = {};
Object.defineProperty(getterInput, "countryCode", { get() { throw new Error("must not execute"); } });
assert.equal(resolver.resolveCommerceRegion(getterInput).success, false);
console.log("GLOBAL_COMMERCE_MILESTONE_1 PASS");
