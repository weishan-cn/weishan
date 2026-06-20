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
  assert.equal(/https?:\/\/[^"]*(booking|checkout|payment|order)/i.test(serialized), false);
  assert.equal(/fake price|mock price|demo price|AI 估价/i.test(serialized), false);
  assert.equal(/(sk-[A-Za-z0-9_-]{12,}|rawApiKey"\s*:\s*"[^"]+|rawToken"\s*:\s*"[^"]+)/i.test(serialized), false);
}

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/providerEndpointAllowlistEnforcement.js",
  "apps/desktop/src/renderer/core/providerSandboxRealKeyDryRunGate.js",
  "apps/desktop/src/renderer/core/readOnlyProviderAdapterContract.js",
  "apps/desktop/src/renderer/core/commerceReadonlyAdapterContractGate.js",
  "apps/desktop/src/renderer/core/adapters/flightReadOnlyProviderAdapterV1.js"
]);

const contractApi = windowRef.WeishanReadOnlyProviderAdapterContract;
const gateApi = windowRef.WeishanCommerceReadonlyAdapterContractGate;
const flightApi = windowRef.WeishanFlightReadOnlyProviderAdapterV1;

function main() {
  assert.equal(contractApi.READ_ONLY_PROVIDER_ADAPTER_CONTRACT_VERSION, "2.1.27");
  const contract = contractApi.buildAdapterContract();
  assert.equal(contract.contractVersion, "2.1.27");
  assert.equal(contract.phase, "read_only_provider_adapter_contract_v1");
  assert.equal(contract.status, "adapter contract draft-ready");
  assert.equal(contract.mode, "offline_fixture_only");
  assert.equal(contract.networkPolicy, "disabled");
  assert.equal(contract.credentialPolicy, "metadata_only");
  assert.equal(contract.endpointPolicy, "disabled");
  assert.equal(contract.resultPolicy, "normalized_draft_only");
  assert.equal(contract.realProviderConnection, "disabled");
  assert.equal(contract.realNetwork, "disabled");
  assert.equal(contract.realEndpoint, "disabled");
  assert.equal(contract.realPrice, "disabled");
  assert.equal(contract.availability, "disabled");
  assert.equal(contract.bookingUrl, "disabled");
  assert.equal(contract.payment, "disabled");
  assert.equal(contract.order, "disabled");
  assert.equal(contract.identityUpload, "disabled");
  assert.equal(contract.redacted, true);

  for (const method of [
    "getAdapterMetadata",
    "validateCredentialScope",
    "validateReadinessGates",
    "runOfflineFixtureSearch",
    "normalizeProviderResult",
    "validateResultSchema",
    "attachSourceLabel",
    "runDryRun"
  ]) {
    assert.equal(contract.allowedMethods.includes(method), true);
  }

  for (const method of [
    "connect",
    "fetch",
    "request",
    "post",
    "createOrder",
    "pay",
    "checkout",
    "uploadIdentity",
    "revealCredential",
    "exportCredential",
    "testEndpoint"
  ]) {
    assert.equal(contract.blockedMethods.includes(method), true);
    assert.equal(typeof contractApi[method], "function");
    const blocked = contractApi[method]();
    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.redacted, true);
  }

  const auditDraft = contractApi.buildReadOnlyProviderAdapterAuditDraft(contract);
  assert.equal(auditDraft.eventType, "READ_ONLY_PROVIDER_ADAPTER_V1_DRAFT");
  assert.equal(auditDraft.networkAttemptCount, 0);
  assert.equal(auditDraft.realApiKeyReadCount, 0);
  assert.equal(auditDraft.realEndpointConnectCount, 0);
  assert.equal(auditDraft.realProviderResultCount, 0);
  assert.equal(auditDraft.realPriceReturnCount, 0);
  assert.equal(auditDraft.bookingUrlReturnCount, 0);
  assert.equal(auditDraft.paymentAttemptCount, 0);
  assert.equal(auditDraft.orderAttemptCount, 0);
  assert.equal(auditDraft.identityUploadAttemptCount, 0);
  assert.equal(auditDraft.redacted, true);
  assert.equal(contractApi.assertReadOnlyProviderAdapterContractSafe(contract), true);

  const gate = gateApi.buildReadonlyAdapterContractGateDisplay();
  assert.equal(gate.version, "2.1.27");
  assert.equal(gate.gateStatus, "draft-ready");
  assert.equal(gate.adapterExecution, "offline fixture only");
  assert.equal(gate.realNetwork, "disabled");
  assert.equal(gate.realEndpoint, "disabled");
  assert.equal(gate.capabilities.canReadRealProviderResult, false);
  assert.equal(gate.capabilities.canDisplayRealPrice, false);
  assert.equal(gate.capabilities.canDisplayBookingUrl, false);
  assert.equal(gate.capabilities.canCreateBooking, false);
  assert.equal(gate.capabilities.canPay, false);
  assert.equal(gateApi.assertReadonlyAdapterContractGateSafe(gate), true);

  assert.equal(flightApi.FLIGHT_READONLY_PROVIDER_ADAPTER_V1_VERSION, "2.1.27");
  const metadata = flightApi.getAdapterMetadata();
  assert.equal(metadata.adapterId, "flight_readonly_provider_adapter_v1");
  assert.equal(metadata.providerCategory, "flight");
  assert.equal(metadata.mode, "offline_fixture_only");
  assert.equal(metadata.networkPolicy, "disabled");
  assert.equal(metadata.credentialPolicy, "metadata_only");
  assert.equal(metadata.endpointPolicy, "disabled");
  assert.equal(metadata.redacted, true);

  const fixture = flightApi.runOfflineFixtureSearch("7 月 15 日上海到成都最便宜的机票");
  assert.equal(fixture.resultType, "flight_provider_offline_fixture_result");
  assert.equal(fixture.sourceLabel, "offline fixture / no real provider");
  assert.equal(fixture.querySummary.from, "上海");
  assert.equal(fixture.querySummary.to, "成都");
  assert.equal(fixture.querySummary.date, "7 月 15 日");
  assert.equal(fixture.querySummary.sort, "低价优先");
  assert.equal(fixture.candidateSummary[0].priceStatus, "real price disabled");
  assert.equal(fixture.availability, false);
  assert.equal(fixture.bookingUrl, null);
  assert.equal(fixture.realProvider, false);
  assert.equal(fixture.realNetwork, false);
  assert.equal(fixture.realPrice, false);
  assert.equal(fixture.payment, false);
  assert.equal(fixture.order, false);
  assert.equal(fixture.identityUpload, false);
  assert.equal(fixture.redacted, true);

  for (const method of ["connect", "fetch", "request", "post", "createOrder", "pay", "checkout", "uploadIdentity", "revealCredential", "exportCredential", "testEndpoint"]) {
    const blocked = flightApi[method]();
    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.redacted, true);
  }

  const endpointDecision = flightApi.validateEndpointAllowlist("https://provider-sandbox.invalid/sandbox/dry-run");
  assert.equal(endpointDecision.finalDecision, "allowlisted_sandbox_only");
  const preparedDryRun = flightApi.prepareSandboxDryRun({ endpointCandidate:"https://provider-sandbox.invalid/sandbox/dry-run", credentialScopeConsent:true, sandboxKey:"WEISHAN_SANDBOX_TEST_KEY_000000" });
  assert.equal(preparedDryRun.dryRunDecision, "ready");
  const simulatedDryRun = flightApi.runSandboxDryRunWithSimulatedTransport({ endpointCandidate:"https://provider-sandbox.invalid/sandbox/dry-run", credentialScopeConsent:true, sandboxKey:"WEISHAN_SANDBOX_TEST_KEY_000000" });
  assert.equal(simulatedDryRun.dryRunDecision, "pass");
  assert.equal(simulatedDryRun.transport, "simulated");
  assert.equal(simulatedDryRun.realNetwork, false);
  assert.equal(simulatedDryRun.networkAttemptCount, 0);
  assert.equal(simulatedDryRun.realEndpointConnectCount, 0);
  assert.equal(simulatedDryRun.resultExposure, "console-only");
  assert.equal(simulatedDryRun.priceExposure, "disabled");
  assert.equal(simulatedDryRun.bookingUrlExposure, "disabled");

  const flightAudit = flightApi.buildAuditDraft();
  assert.equal(flightAudit.eventType, "READ_ONLY_PROVIDER_ADAPTER_V1_DRAFT");
  assert.equal(flightAudit.networkAttemptCount, 0);
  assert.equal(flightAudit.realApiKeyReadCount, 0);
  assert.equal(flightAudit.realEndpointConnectCount, 0);
  assert.equal(flightAudit.realProviderResultCount, 0);
  assert.equal(flightAudit.realPriceReturnCount, 0);
  assert.equal(flightAudit.bookingUrlReturnCount, 0);
  assert.equal(flightAudit.paymentAttemptCount, 0);
  assert.equal(flightAudit.orderAttemptCount, 0);
  assert.equal(flightAudit.identityUploadAttemptCount, 0);
  assert.equal(flightAudit.redacted, true);
  assert.equal(flightApi.assertFlightReadOnlyProviderAdapterV1Safe(fixture), true);

  assertNoDangerousSurface(contract);
  assertNoDangerousSurface(gate);
  assertNoDangerousSurface(fixture);
  assertNoDangerousSurface(flightAudit);

  console.log("READ_ONLY_PROVIDER_ADAPTER_V1_CORE PASS");
}

main();
