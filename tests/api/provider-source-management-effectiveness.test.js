const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "../../apps/desktop/src/renderer/core");
const windowRef = {};
windowRef.window = windowRef;
vm.runInContext(
  fs.readFileSync(path.join(root, "providerSourceManagement.js"), "utf8"),
  vm.createContext({ window:windowRef, Object, Array, String, Number, Boolean, JSON, Set })
);

const api = windowRef.WeishanProviderSourceManagement;

assert.equal(api.VERSION, "4.2.8");
assert.equal(api.GOVERNANCE.executionGate, "CLOSED");
assert.equal(api.GOVERNANCE.authorizesExecution, false);
assert.equal(api.GOVERNANCE.productionTraffic, false);

const inventory = api.inventory();
assert.equal(inventory.success, true);
assert.ok(inventory.sources.length >= 15);
assert.equal(new Set(inventory.sources.map((row) => row.SOURCE_ID.toLowerCase())).size, inventory.sources.length);
assert.equal(inventory.sources.every((row) => row.SOURCE_ID === row.SOURCE_ID.toLowerCase()), true);

const cheapshark = api.evaluateSource({ sourceId:"cheapshark", live:true, production:true, capabilities:["booking"] }, {
  domain:"SHOPPING",
  category:"games",
  use:"LIVE_PRICE"
});
assert.equal(cheapshark.success, true);
assert.equal(cheapshark.currentEligibility, "ELIGIBLE_LIVE_PRICE");
assert.equal(cheapshark.capabilities.includes("booking"), false);
assert.equal(cheapshark.productionTraffic, false);

const ebayLive = api.evaluateSource({ sourceId:"ebay_sandbox", environment:"PRODUCTION", ready:true }, {
  domain:"SHOPPING",
  category:"marketplace",
  use:"LIVE_PRICE"
});
assert.equal(ebayLive.eligibility.eligible, false);
assert.ok(ebayLive.eligibility.reasons.includes("NON_LIVE_ENVIRONMENT"));
assert.ok(ebayLive.eligibility.reasons.includes("SANDBOX_TEST_DATA_NOT_LIVE"));

const storedCredential = api.evaluateSource("ai_connector_user_managed", { domain:"AI", category:"ai", use:"READ_ONLY" });
assert.equal(storedCredential.eligibility.eligible, false);
assert.ok(storedCredential.eligibility.reasons.includes("CREDENTIAL_STORED_NOT_AUTH_VALIDATED"));

assert.equal(api.evaluateSource("amadeus_self_service", { domain:"FLIGHT", category:"flight", use:"LIVE_PRICE" }).readiness, "DECOMMISSIONED");
assert.ok(api.evaluateSource("amadeus_self_service", { domain:"FLIGHT", category:"flight", use:"LIVE_PRICE" }).eligibility.reasons.includes("DECOMMISSIONED"));
assert.ok(api.evaluateSource("skyscanner_live_prices", { domain:"FLIGHT", category:"flight", use:"LIVE_PRICE" }).eligibility.reasons.includes("PENDING_EXTERNAL_APPROVAL"));
assert.ok(api.evaluateSource("hotelbeds_evaluation", { domain:"HOTEL", category:"hotel", use:"LIVE_PRICE" }).eligibility.reasons.includes("AUTH_FAILED"));
assert.ok(api.evaluateSource("cunard_public_handoff", { domain:"CRUISE", category:"cruise", use:"LIVE_PRICE" }).eligibility.reasons.includes("HANDOFF_ONLY"));

assert.equal(api.evaluateSource("cheapshark", { domain:"FLIGHT", category:"flight", use:"LIVE_PRICE" }).eligibility.eligible, false);
assert.ok(api.evaluateSource("cheapshark", { domain:"FLIGHT", category:"flight", use:"LIVE_PRICE" }).eligibility.reasons.includes("DOMAIN_MISMATCH"));
assert.equal(api.evaluateSource("cheapshark", { domain:"SHOPPING", category:"electronics", use:"LIVE_PRICE" }).eligibility.eligible, false);
assert.ok(api.evaluateSource("cheapshark", { domain:"SHOPPING", category:"electronics", use:"LIVE_PRICE" }).eligibility.reasons.includes("CATEGORY_SCOPE_MISMATCH"));

const duplicateSelection = api.selectEligibleSources({
  domain:"SHOPPING",
  category:"games",
  use:"LIVE_PRICE",
  sources:[
    { sourceId:"cheapshark", domain:"SHOPPING", environment:"PUBLIC", readiness:"READY_READ_ONLY", authState:"NOT_APPLICABLE", priceState:"REAL_PROVIDER_PRICE", capabilities:["price"], categoryScope:["games"], commissionEligible:false },
    { sourceId:"CheapShark", domain:"SHOPPING", environment:"PUBLIC", readiness:"READY_READ_ONLY", authState:"NOT_APPLICABLE", priceState:"REAL_PROVIDER_PRICE", capabilities:["price"], categoryScope:["games"], commissionEligible:true, commissionRate:99 },
    { sourceId:"duffel_test", domain:"FLIGHT", environment:"TEST", readiness:"READY_TEST_ONLY", authState:"AUTH_VALIDATED", priceState:"TEST_ENVIRONMENT_DATA", capabilities:["price"], categoryScope:["flight"] }
  ]
});
assert.deepEqual(duplicateSelection.eligibleSources, ["cheapshark"]);
assert.equal(duplicateSelection.duplicateSourceCountEffects, 0);
assert.equal(duplicateSelection.commissionReadinessInfluence, 0);

const transitions = [
  ["NO_ACCOUNT", "READY_LIVE"],
  ["TEST_ONLY", "PRODUCTION_READY"],
  ["DECOMMISSIONED", "READY"],
  ["BLOCKED", "ACTIVE"],
  ["CREDENTIAL_STORED", "AUTH_VALIDATED"]
];
transitions.forEach(([current, next]) => {
  const result = api.applyStateTransition({ current, next, evidence:{} });
  assert.equal(result.allowed, false, `${current}->${next}`);
});
assert.equal(api.applyStateTransition({ current:"CREDENTIAL_STORED", next:"AUTH_VALIDATED", evidence:{ authProbeOk:true } }).allowed, true);

const partial = api.ingestSourceFailure({ failedSourceId:"cheapshark", availableSourceIds:["cheapshark", "open_prices"], failureClass:"SCHEMA" });
assert.equal(partial.sourceQuarantined, true);
assert.equal(partial.partialFailureIsolated, true);
assert.deepEqual(partial.remainingSourceIds, ["open_prices"]);
assert.equal(partial.retryAllowed, false);
assert.equal(api.ingestSourceFailure({ failedSourceId:"only", availableSourceIds:["only"], failureClass:"AUTH" }).allFailureTruthful, true);
assert.equal(api.ingestSourceFailure({ failedSourceId:"timeout", availableSourceIds:["timeout", "other"], failureClass:"TIMEOUT" }).retryAllowed, true);

const metrics = api.metrics();
[
  "FALSE_READY_SOURCES",
  "TEST_AS_LIVE_SOURCES",
  "DECOMMISSIONED_AS_ACTIVE",
  "BLOCKED_AS_ACTIVE",
  "CREDENTIAL_STORED_AS_AUTH_VALIDATED",
  "FAKE_CAPABILITY_ACCEPTED",
  "FAKE_ENVIRONMENT_ACCEPTED",
  "FAKE_PRODUCTION_ACCEPTED",
  "CROSS_DOMAIN_SOURCE_ELIGIBILITY",
  "CATEGORY_SCOPE_VIOLATIONS",
  "DUPLICATE_SOURCE_COUNT_EFFECTS",
  "COMMISSION_READINESS_INFLUENCE",
  "GOVERNANCE_BYPASSES"
].forEach((key) => assert.equal(metrics[key], 0, key));

const hundredSources = Array.from({ length:100 }, (_, index) => ({
  sourceId:"synthetic_source_" + index,
  displayName:"Synthetic " + index,
  domain:"SHOPPING",
  environment:index % 2 ? "SANDBOX" : "PUBLIC",
  readiness:index % 2 ? "READY_TEST_ONLY" : "READY_READ_ONLY",
  authState:"NOT_APPLICABLE",
  priceState:index % 2 ? "SANDBOX_TEST_DATA" : "REAL_PROVIDER_PRICE",
  capabilities:["price"],
  categoryScope:["games"]
}));
assert.equal(api.selectEligibleSources({ domain:"SHOPPING", category:"games", use:"LIVE_PRICE", sources:hundredSources }).eligibleSources.length, 50);

const thousandSources = Array.from({ length:1000 }, (_, index) => ({
  sourceId:"bulk_source_" + index,
  domain:index % 3 === 0 ? "SHOPPING" : "FLIGHT",
  environment:"PUBLIC",
  readiness:"READY_READ_ONLY",
  authState:"NOT_APPLICABLE",
  priceState:"REAL_PROVIDER_PRICE",
  capabilities:["price"],
  categoryScope:[index % 3 === 0 ? "games" : "flight"]
}));
assert.equal(api.selectEligibleSources({ domain:"SHOPPING", category:"games", use:"LIVE_PRICE", sources:thousandSources }).eligibleSources.length, 334);

console.log("PROVIDER_SOURCE_MANAGEMENT_EFFECTIVENESS PASS sources=" + inventory.sources.length + " mutations=10 highRiskMetrics=0 synthetic100=PASS synthetic1000=PASS");
