const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js", "apps/desktop/src/renderer/core/providerCredentialReadinessPanel.js", "apps/desktop/src/renderer/core/singleFlightProviderSandboxConnector.js", "apps/desktop/src/renderer/core/realFlightPriceFetchSafetyGate.js"]);
  const api = windowRef.WeishanRealFlightPriceFetchSafetyGate;
  assert.equal(api.REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_VERSION, "3.6.0");

  const fixture = api.evaluateRealFlightPriceFetchSafety({ providerId:"google_flights_search", providerMode:"fixture" });
  assert.equal(fixture.status, "allowed");
  assert.equal(fixture.decision, "fixture_provider_allowed");
  assert.equal(fixture.networkAllowed, false);
  assert.equal(fixture.providerConnector.status, "fixture_ready");

  const sandbox = api.evaluateRealFlightPriceFetchSafety({ providerId:"google_flights_search", providerMode:"sandbox_read_only", sandboxDryRunEnabled:true, hasSecureCredentialReference:true });
  assert.equal(sandbox.status, "allowed");
  assert.equal(sandbox.decision, "sandbox_read_only_ready_network_disabled");
  assert.equal(sandbox.networkAllowed, false);
  assert.equal(sandbox.providerConnector.status, "sandbox_ready");

  const sandboxNetwork = api.evaluateRealFlightPriceFetchSafety({ providerId:"google_flights_search", providerMode:"sandbox_read_only", sandboxDryRunEnabled:true, hasSecureCredentialReference:true, networkDryRunAllowed:true });
  assert.equal(sandboxNetwork.status, "allowed");
  assert.equal(sandboxNetwork.decision, "sandbox_read_only_network_dry_run_allowed");
  assert.equal(sandboxNetwork.networkAllowed, true);

  const missingDryRun = api.evaluateRealFlightPriceFetchSafety({ providerId:"google_flights_search", providerMode:"sandbox_read_only", hasSecureCredentialReference:true });
  assert.equal(missingDryRun.status, "disabled");
  assert.equal(missingDryRun.decision, "disabled_missing_sandbox_dry_run");

  const production = api.evaluateRealFlightPriceFetchSafety({ providerId:"google_flights_search", providerMode:"production" });
  assert.equal(production.status, "disabled");
  assert.equal(production.decision, "production_disabled");
  assert.equal(production.productionProviderEnabled, false);

  const restricted = api.evaluateRealFlightPriceFetchSafety({ providerId:"google_flights_search", providerMode:"fixture", restrictedCategoryDecision:"blocked" });
  assert.equal(restricted.status, "blocked");
  assert.equal(restricted.decision, "blocked_restricted_category");

  const unknown = api.evaluateRealFlightPriceFetchSafety({ providerId:"unknown_provider", providerMode:"fixture" });
  assert.equal(unknown.status, "blocked");
  assert.equal(unknown.decision, "blocked_unknown_provider");

  const audit = api.buildRealFlightPriceFetchSafetyAudit({ providerId:"google_flights_search", providerMode:"fixture" });
  assert.equal(audit.appVersion, "3.6.0");
  assert.equal(audit.booking, false);
  assert.equal(audit.payment, false);
  assert.equal(audit.order, false);
  assert.equal(audit.identityUpload, false);
  assert.equal(audit.productionProviderEnabled, false);
  assert.equal(api.isRealFlightPriceFetchAllowed({ providerId:"google_flights_search", providerMode:"fixture" }), true);
  assert.equal(api.assertRealFlightPriceFetchSafetyGateSafe(fixture), true);
  console.log("REAL_FLIGHT_PRICE_FETCH_SAFETY_GATE_CORE PASS");
}

main();
