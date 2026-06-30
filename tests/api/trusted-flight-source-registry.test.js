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
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js"]);
  const api = windowRef.WeishanTrustedFlightSourceRegistry;
  assert.equal(api.TRUSTED_FLIGHT_SOURCE_REGISTRY_VERSION, "2.3.9");

  const registry = api.getTrustedFlightSourceRegistry();
  assert.equal(registry.phase, "trusted_flight_source_registry_skeleton_only");
  assert.equal(registry.status, "skeleton only");
  assert.equal(registry.productionProvider, "disabled");
  assert.equal(registry.safeProviderHandoffPolicy, "confirmation_required");
  assert.equal(registry.canUseNetwork, false);
  assert.equal(registry.canUseApiKey, false);
  assert.equal(registry.canConnectEndpoint, false);
  assert.equal(registry.canReturnBookingUrl, false);
  assert.equal(registry.canPay, false);
  assert.equal(registry.canCreateOrder, false);
  assert.equal(registry.canUploadIdentity, false);
  assert.equal(registry.redacted, true);
  assert.equal(Array.isArray(registry.trustedSources), true);
  assert.equal(registry.trustedSources.length, 6);

  const google = api.getTrustedFlightSourceById("google_flights_search");
  assert.equal(google.accessMode, "manual_search_only");
  assert.equal(google.productionProvider, "disabled");
  assert.equal(google.safeProviderHandoffUrl.startsWith("https://www.google.com/travel/flights"), true);
  assert.equal(google.bookingUrl, false);
  assert.equal(google.payment, false);
  assert.equal(google.order, false);
  assert.equal(google.identityUpload, false);
  assert.equal(google.canUseNetwork, false);
  assert.equal(google.canUseApiKey, false);
  assert.equal(google.canConnectEndpoint, false);
  assert.equal(google.redacted, true);

  const trip = api.evaluateTrustedFlightSourceReadiness("trip_com_ctrip_search");
  assert.equal(trip.readinessDecision, "manual_search_only");
  assert.equal(trip.productionProvider, "disabled");
  assert.equal(trip.providerConfirmationRequired, true);
  assert.equal(trip.safeProviderHandoffUrl.startsWith("https://www.trip.com/flights"), true);
  assert.equal(trip.redacted, true);

  const fixture = api.evaluateTrustedFlightSourceReadiness("trusted_flight_fixture");
  assert.equal(fixture.readinessDecision, "fixture_only");
  assert.equal(fixture.productionProvider, "disabled");
  assert.equal(fixture.safeProviderHandoffUrl, null);
  assert.equal(fixture.redacted, true);

  const importFixture = api.evaluateTrustedFlightSourceReadiness("flight_provider_trusted_fixture");
  assert.equal(importFixture.readinessDecision, "fixture_only");
  assert.equal(importFixture.productionProvider, "disabled");
  assert.equal(importFixture.safeProviderHandoffUrl, null);
  assert.equal(importFixture.redacted, true);

  const blocked = api.evaluateTrustedFlightSourceReadiness("unknown_provider");
  assert.equal(blocked.readinessDecision, "blocked");
  assert.equal(blocked.unknownProviderBlocked, true);
  assert.equal(blocked.redacted, true);

  const audit = api.getTrustedFlightSourceRegistryAuditDraft();
  assert.equal(audit.eventType, "TRUSTED_FLIGHT_SOURCE_REGISTRY_DRAFT");
  assert.equal(audit.trustedSourceCount, 6);
  assert.equal(audit.manualSearchOnlyCount, 2);
  assert.equal(audit.fixtureOnlyCount, 4);
  assert.equal(audit.safeProviderHandoffReadyCount, 2);
  assert.equal(audit.productionProviderDisabledCount, 6);
  assert.equal(audit.bookingUrlDisplayedCount, 0);
  assert.equal(audit.paymentAttemptCount, 0);
  assert.equal(audit.orderAttemptCount, 0);
  assert.equal(audit.identityUploadAttemptCount, 0);
  assert.equal(audit.realProviderCallCount, 0);
  assert.equal(audit.networkAttemptCount, 0);
  assert.equal(audit.redacted, true);

  assert.equal(api.assertTrustedFlightSourceRegistrySafe(registry), true);
  assert.equal(JSON.stringify(registry).includes("bookingUrl"), true);
  assert.equal(JSON.stringify(registry).includes("safeProviderHandoffPolicy"), true);
  assert.equal(JSON.stringify(registry).includes("rawApiKey"), false);

  console.log("TRUSTED_FLIGHT_SOURCE_REGISTRY_CORE PASS");
}

main();
