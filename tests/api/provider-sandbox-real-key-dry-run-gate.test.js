const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(source, context, { filename:file });
  }
  return window;
}
function assertNoDangerousSurface(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/bookingUrl"\s*:\s*"https?:/i.test(serialized), false);
  assert.equal(/checkoutUrl|paymentUrl|orderUrl/i.test(serialized), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}|rawApiKey"\s*:\s*"[^"]+|rawToken"\s*:\s*"[^"]+/i.test(serialized), false);
}
const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/providerEndpointAllowlistEnforcement.js",
  "apps/desktop/src/renderer/core/providerSandboxRealKeyDryRunGate.js",
  "apps/desktop/src/renderer/core/priceIntegrityTaxesFeesGate.js",
  "apps/desktop/src/renderer/core/realPriceDisplayGate.js",
  "apps/desktop/src/renderer/core/adapters/flightReadOnlyProviderAdapterV1.js"
]);
const gateApi = windowRef.WeishanProviderSandboxRealKeyDryRunGate;
const flightApi = windowRef.WeishanFlightReadOnlyProviderAdapterV1;
const base = {
  providerCategory:"flight",
  providerId:"flight_provider",
  adapterId:"flight_readonly_provider_adapter_v1",
  endpointCandidate:"https://provider-sandbox.invalid/sandbox/dry-run",
  credentialScopeConsent:true,
  sandboxKey:"WEISHAN_SANDBOX_TEST_KEY_000000"
};
function main() {
  assert.equal(gateApi.PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_VERSION, "2.1.99");
  const missingConsent = gateApi.evaluateSandboxRealKeyDryRunGate(Object.assign({}, base, { credentialScopeConsent:false, consentState:"missing" }));
  assert.equal(missingConsent.dryRunDecision, "blocked");
  assert.equal(missingConsent.blockedReason, "credential consent missing");

  const missingKey = gateApi.evaluateSandboxRealKeyDryRunGate(Object.assign({}, base, { sandboxKey:"" }));
  assert.equal(missingKey.dryRunDecision, "blocked");
  assert.equal(missingKey.credentialState, "missing");

  const productionRisk = gateApi.evaluateSandboxRealKeyDryRunGate(Object.assign({}, base, { sandboxKey:"WEISHAN_PRODUCTION_KEY_RISK_000000" }));
  assert.equal(productionRisk.dryRunDecision, "blocked");
  assert.equal(productionRisk.credentialState, "blocked-production-key-risk");

  const endpointBlocked = gateApi.evaluateSandboxRealKeyDryRunGate(Object.assign({}, base, { endpointCandidate:"https://unlisted-sandbox.invalid/sandbox/dry-run" }));
  assert.equal(endpointBlocked.dryRunDecision, "blocked");
  assert.equal(endpointBlocked.endpointAllowlistDecision, "blocked");

  const adapterMissing = gateApi.evaluateSandboxRealKeyDryRunGate(Object.assign({}, base, { adapterId:"write_provider_adapter" }));
  assert.equal(adapterMissing.dryRunDecision, "blocked");
  assert.equal(adapterMissing.blockedReason, "read-only adapter missing");

  const ready = gateApi.evaluateSandboxRealKeyDryRunGate(base);
  assert.equal(ready.status, "sandbox real-key dry-run gate only");
  assert.equal(ready.mode, "controlled sandbox only");
  assert.equal(ready.credentialState, "sandbox-key-present");
  assert.equal(ready.consentState, "confirmed");
  assert.equal(ready.endpointAllowlistDecision, "allowlisted_sandbox_only");
  assert.equal(ready.dryRunDecision, "ready");
  assert.equal(ready.resultExposurePolicy, "console-only");
  assert.equal(ready.ordinaryResultExposure, "disabled");
  assert.equal(ready.realPriceExposure, "disabled");
  assert.equal(ready.bookingUrlExposure, "disabled");
  assert.equal(ready.payment, false);
  assert.equal(ready.order, false);
  assert.equal(ready.identityUpload, false);
  assert.equal(ready.redacted, true);

  const pass = gateApi.runSandboxDryRunGateWithSimulatedTransport(base);
  assert.equal(pass.dryRunDecision, "pass");
  assert.equal(pass.transport, "simulated");
  assert.equal(pass.dryRunTransport, "simulated");
  assert.equal(pass.realNetwork, false);
  assert.equal(pass.networkAttemptCount, 0);
  assert.equal(pass.endpointConnectCount, 0);
  assert.equal(pass.realEndpointConnectCount, 0);
  assert.equal(pass.credentialReadCount, 0);
  assert.equal(pass.onlySecureStorageMetadataReadCount, 1);
  assert.equal(pass.schemaValidation, "pass");
  assert.equal(pass.sourceLabelValidation, "pass");
  assert.equal(pass.resultExposure, "console-only");
  assert.equal(pass.ordinaryResultExposure, "disabled");
  assert.equal(pass.realPriceExposure, "disabled");
  assert.equal(pass.bookingUrlExposure, "disabled");
  assert.equal(pass.auditDraft.eventType, "PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_DRAFT");
  assert.equal(pass.auditDraft.networkAttemptCount, 0);
  assert.equal(pass.auditDraft.realEndpointConnectCount, 0);
  assert.equal(pass.auditDraft.realCredentialPlaintextDisplayedCount, 0);
  assert.equal(pass.auditDraft.realCredentialPlaintextExportedCount, 0);
  assert.equal(pass.auditDraft.realPriceDisplayedCount, 0);
  assert.equal(pass.auditDraft.bookingUrlDisplayedCount, 0);
  assert.equal(pass.auditDraft.paymentAttemptCount, 0);
  assert.equal(pass.auditDraft.orderAttemptCount, 0);
  assert.equal(pass.auditDraft.identityUploadAttemptCount, 0);
  assert.equal(pass.auditDraft.ordinaryResultExposureCount, 0);
  assert.equal(pass.auditDraft.redacted, true);
  assert.equal(gateApi.assertProviderSandboxRealKeyDryRunGateSafe(pass), true);

  const adapterPrepared = flightApi.prepareSandboxDryRun(base);
  assert.equal(adapterPrepared.dryRunDecision, "ready");
  const adapterRun = flightApi.runSandboxDryRunWithSimulatedTransport(base);
  assert.equal(adapterRun.dryRunDecision, "pass");
  assert.equal(adapterRun.transport, "simulated");
  assert.equal(adapterRun.realNetwork, false);
  assert.equal(adapterRun.networkAttemptCount, 0);
  assert.equal(adapterRun.realEndpointConnectCount, 0);
  assert.equal(adapterRun.resultExposure, "console-only");
  assert.equal(adapterRun.priceExposure, "guarded_sandbox_test_price");
  assert.equal(adapterRun.bookingUrlExposure, "disabled");
  assert.equal(adapterRun.priceIntegrityValidation.validationDecision, "pass");
  assert.equal(adapterRun.realPriceDisplayDecision.displayDecision, "allow");
  assert.equal(adapterRun.guardedPriceCard.visible, true);

  const slot = gateApi.buildSandboxKeySlotState({ status:"sandbox_saved", keyFingerprint:"abc12345", keyLast4:"0000" });
  assert.equal(slot.providerId, "flight_provider_sandbox_key");
  assert.equal(slot.status, "sandbox_saved");
  assert.equal(slot.finalDecision, "sandbox-key-ready");
  assert.equal(slot.redacted, true);

  assertNoDangerousSurface(ready);
  assertNoDangerousSurface(pass);
  assertNoDangerousSurface(adapterRun);
  console.log("PROVIDER_SANDBOX_REAL_KEY_DRY_RUN_GATE_CORE PASS");
}
main();
