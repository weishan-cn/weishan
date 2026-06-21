const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/realFlightPriceFetchSafetyGate.js"
  ]);
  const api = windowRef.WeishanRealFlightPriceFetchSafetyGate;

  assert.equal(api.REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION, "2.1.43");

  const defaultGate = api.evaluateRealFlightPriceFetchSafety({ providerId: "real_flight_fixture", providerMode: "fixture" });
  assert.equal(defaultGate.status, "allowed");
  assert.equal(defaultGate.decision, "fixture_provider_allowed");
  assert.equal(defaultGate.readOnly, true);
  assert.equal(defaultGate.networkAllowed, false);
  assert.equal(defaultGate.booking, false);
  assert.equal(defaultGate.payment, false);
  assert.equal(defaultGate.order, false);
  assert.equal(defaultGate.identityUpload, false);

  const sandboxAllowed = api.evaluateRealFlightPriceFetchSafety({ providerId: "real_flight_sandbox", providerMode: "sandbox", hasSecureCredentialReference: true, dryRunEnabled: true });
  assert.equal(sandboxAllowed.status, "allowed");
  assert.equal(sandboxAllowed.decision, "sandbox_dry_run_allowed");
  assert.equal(sandboxAllowed.networkAllowed, true);

  const sandboxDisabled = api.evaluateRealFlightPriceFetchSafety({ providerId: "real_flight_sandbox", providerMode: "sandbox", hasSecureCredentialReference: true, dryRunEnabled: false });
  assert.equal(sandboxDisabled.status, "disabled");
  assert.equal(sandboxDisabled.decision, "disabled_missing_dry_run_flag");

  const productionDisabled = api.evaluateRealFlightPriceFetchSafety({ providerId: "real_flight_fixture", providerMode: "production_disabled", hasSecureCredentialReference: true, dryRunEnabled: true });
  assert.equal(productionDisabled.status, "disabled");
  assert.equal(productionDisabled.decision, "production_disabled");
  assert.equal(productionDisabled.networkAllowed, false);

  const restricted = api.evaluateRealFlightPriceFetchSafety({ providerId: "real_flight_fixture", providerMode: "fixture", restrictedCategoryDecision: "blocked" });
  assert.equal(restricted.status, "blocked");
  assert.equal(restricted.decision, "blocked_restricted_category");

  const unknown = api.evaluateRealFlightPriceFetchSafety({ providerId: "unknown_provider", providerMode: "fixture" });
  assert.equal(unknown.status, "blocked");
  assert.equal(unknown.decision, "blocked_unknown_provider");

  const missingCredential = api.evaluateRealFlightPriceFetchSafety({ providerId: "real_flight_sandbox", providerMode: "sandbox", hasSecureCredentialReference: false, dryRunEnabled: true });
  assert.equal(missingCredential.status, "disabled");
  assert.equal(missingCredential.decision, "disabled_missing_secure_credential");

  const audit = api.buildRealFlightPriceFetchSafetyAudit({ providerId: "real_flight_fixture", providerMode: "fixture" });
  assert.equal(audit.eventType, "REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_DRAFT");
  assert.equal(audit.appVersion, "2.1.43");
  assert.equal(audit.readOnly, true);
  assert.equal(audit.booking, false);
  assert.equal(audit.payment, false);
  assert.equal(audit.order, false);
  assert.equal(audit.identityUpload, false);
  assert.equal(audit.realProviderCallCount, 0);
  assert.equal(audit.realApiKeyReadCount, 0);
  assert.equal(audit.realEndpointConnectCount, 0);
  assert.equal(audit.redacted, true);

  assert.equal(api.isRealFlightPriceFetchAllowed({ providerId: "real_flight_fixture", providerMode: "fixture" }), true);
  assert.equal(api.isRealFlightPriceFetchAllowed({ providerId: "unknown_provider", providerMode: "fixture" }), false);
  assert.equal(api.assertRealFlightPriceFetchSafetyGateSafe(defaultGate), true);

  console.log("REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_CORE PASS");
}

main();
