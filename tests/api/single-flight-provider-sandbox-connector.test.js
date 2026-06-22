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

function assertSafePayload(payload) {
  assert.equal(payload.bookingUrl, null);
  assert.equal(payload.checkoutUrl, null);
  assert.equal(payload.paymentUrl, null);
  assert.equal(payload.orderUrl, null);
  assert.equal(payload.booking, false);
  assert.equal(payload.payment, false);
  assert.equal(payload.order, false);
  assert.equal(payload.identityUpload, false);
  assert.equal(payload.autoOpen, false);
  assert.equal(payload.redacted, true);
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/providerCredentialReadinessPanel.js",
    "apps/desktop/src/renderer/core/singleFlightProviderSandboxConnector.js"
  ]);
  const api = windowRef.WeishanSingleFlightProviderSandboxConnector;
  assert.equal(api.SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_VERSION, "2.1.46");

  const fixture = api.getSingleFlightProviderSandboxConnectorStatus();
  assert.equal(fixture.connectorName, "single_flight_provider_sandbox_connector_v1");
  assert.equal(fixture.appVersion, "2.1.46");
  assert.equal(fixture.providerMode, "fixture");
  assert.equal(fixture.status, "fixture_ready");
  assert.equal(fixture.networkAllowed, false);
  assert.equal(fixture.canUseFixtureEvidence, true);
  assertSafePayload(fixture);

  const quote = api.fetchSingleFlightProviderSandboxQuote({ origin:"上海", destination:"成都", departureDate:"2026-07-15" });
  assert.equal(quote.status, "fixture_ready");
  assert.equal(quote.fareSource, "fixture_read_only");
  assert.equal(quote.refreshAttemptId, "fixture-refresh-001");
  assert.equal(quote.currency, "CNY");
  assert.equal(quote.baseFare, 860);
  assert.equal(quote.taxesAndFees, 110);
  assert.equal(quote.providerFees, 40);
  assert.equal(quote.totalPrice, 1010);
  assertSafePayload(quote);

  const sandboxNoDryRun = api.evaluateSingleFlightProviderSandboxReadiness({ providerMode:"sandbox_read_only", providerId:"google_flights_search", hasSecureCredentialReference:true });
  assert.equal(sandboxNoDryRun.status, "disabled");
  assert.equal(sandboxNoDryRun.decision, "disabled_missing_sandbox_dry_run");

  const sandboxNoCredential = api.evaluateSingleFlightProviderSandboxReadiness({ providerMode:"sandbox_read_only", providerId:"google_flights_search", sandboxDryRunEnabled:true });
  assert.equal(sandboxNoCredential.status, "disabled");
  assert.equal(sandboxNoCredential.decision, "disabled_missing_secure_credential_reference");

  const sandboxReady = api.evaluateSingleFlightProviderSandboxReadiness({ providerMode:"sandbox_read_only", providerId:"google_flights_search", sandboxDryRunEnabled:true, hasSecureCredentialReference:true });
  assert.equal(sandboxReady.status, "sandbox_ready");
  assert.equal(sandboxReady.networkAllowed, false);
  assert.equal(sandboxReady.canUseSandboxReadOnlyEvidence, true);
  assert.equal(sandboxReady.credentialReadiness.status, "sandbox_ready");
  assertSafePayload(sandboxReady);

  const sandboxQuoteNoNetwork = api.fetchSingleFlightProviderSandboxQuote({ origin:"上海", destination:"成都" }, { providerMode:"sandbox_read_only", providerId:"google_flights_search", sandboxDryRunEnabled:true, hasSecureCredentialReference:true });
  assert.equal(sandboxQuoteNoNetwork.status, "sandbox_ready_but_network_disabled");
  assert.equal(sandboxQuoteNoNetwork.networkAllowed, undefined);
  assertSafePayload(sandboxQuoteNoNetwork);

  const sandboxQuoteNetwork = api.fetchSingleFlightProviderSandboxQuote({ origin:"上海", destination:"成都" }, { providerMode:"sandbox_read_only", providerId:"google_flights_search", sandboxDryRunEnabled:true, hasSecureCredentialReference:true, networkDryRunAllowed:true });
  assert.equal(sandboxQuoteNetwork.status, "sandbox_read_only_adapter_stub_ready");
  assert.equal(sandboxQuoteNetwork.fareSource, "sandbox_read_only_stub");
  assert.equal(sandboxQuoteNetwork.refreshAttemptId, "sandbox-read-only-refresh-001");
  assertSafePayload(sandboxQuoteNetwork);

  const production = api.evaluateSingleFlightProviderSandboxReadiness({ providerMode:"production", providerId:"google_flights_search", sandboxDryRunEnabled:true, hasSecureCredentialReference:true, networkDryRunAllowed:true });
  assert.equal(production.providerMode, "production_disabled");
  assert.equal(production.status, "disabled");
  assert.equal(production.decision, "production_disabled");
  assert.equal(production.productionProviderEnabled, false);
  assertSafePayload(production);

  const unknown = api.evaluateSingleFlightProviderSandboxReadiness({ providerMode:"fixture", providerId:"unknown_provider" });
  assert.equal(unknown.status, "blocked");
  assert.equal(unknown.decision, "blocked_unknown_provider");

  const restricted = api.evaluateSingleFlightProviderSandboxReadiness({ providerMode:"fixture", providerId:"google_flights_search", restrictedCategoryDecision:"blocked" });
  assert.equal(restricted.status, "blocked");
  assert.equal(restricted.decision, "blocked_restricted_category");

  const audit = api.buildSingleFlightProviderSandboxConnectorAuditDraft({ providerMode:"fixture", providerId:"google_flights_search" });
  assert.equal(audit.eventType, "SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_AUDIT_DRAFT");
  assert.equal(audit.productionProviderEnabled, false);
  assertSafePayload(audit);

  const forbidden = ["tok" + "en", "k" + "ey", "sec" + "ret"];
  const serialized = JSON.stringify({ fixture, quote, sandboxReady, sandboxQuoteNetwork, production, unknown, restricted, audit });
  for (const word of forbidden) assert.equal(serialized.includes(word), false);

  console.log("SINGLE_FLIGHT_PROVIDER_SANDBOX_CONNECTOR_CORE PASS");
}

main();
