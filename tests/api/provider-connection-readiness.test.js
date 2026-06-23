const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(source, context, { filename:file });
  }
  return window;
}

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/providerConnectionReadinessDecisionEngine.js",
  "apps/desktop/src/renderer/core/manualProviderReviewWorkflowV1.js",
  "apps/desktop/src/renderer/core/limitedRealPriceUiBetaGate.js",
  "apps/desktop/src/renderer/core/limitedBetaKillSwitch.js",
  "apps/desktop/src/renderer/core/limitedBetaRollbackGuard.js",
  "apps/desktop/src/renderer/core/manualBookingHandoff.js",
  "apps/desktop/src/renderer/core/providerConnectionReadinessConsole.js"
]);

const decisionApi = windowRef.WeishanProviderConnectionReadinessDecisionEngine;
const consoleApi = windowRef.WeishanProviderConnectionReadinessConsole;

function assertNoDangerousSurface(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/https?:\/\/[^"]*(booking|checkout|payment|order)/i.test(serialized), false);
  assert.equal(/fake price|mock price|demo price|AI 估价/i.test(serialized), false);
  assert.equal(/(sk-[A-Za-z0-9_-]{12,}|rawApiKey"\s*:\s*"[^"]+|rawToken"\s*:\s*"[^"]+)/i.test(serialized), false);
}

function main() {
  assert.equal(typeof decisionApi.evaluateProviderConnectionReadiness, "function");
  assert.equal(typeof consoleApi.buildProviderConnectionReadinessConsole, "function");

  const normalDecision = decisionApi.evaluateProviderConnectionReadiness({ providerCategory:"flight_provider" });
  assert.equal(normalDecision.finalDecision, "no-go");
  assert.equal(normalDecision.realProvider, "disabled");
  assert.equal(normalDecision.realNetwork, "disabled");
  assert.equal(normalDecision.realApiKey, "disabled");
  assert.equal(normalDecision.realEndpoint, "disabled");
  assert.equal(normalDecision.realPrice, "disabled");
  assert.equal(normalDecision.availability, "disabled");
  assert.equal(normalDecision.bookingUrl, "disabled");
  assert.equal(normalDecision.payment, "disabled");
  assert.equal(normalDecision.order, "disabled");
  assert.equal(normalDecision.identityUpload, "disabled");
  assert.equal(normalDecision.auditDraft.eventType, "PROVIDER_CONNECTION_READINESS_CONSOLE_DRAFT");
  assert.equal(normalDecision.auditDraft.networkAttemptCount, 0);
  assert.equal(normalDecision.auditDraft.realApiKeyReadCount, 0);
  assert.equal(normalDecision.auditDraft.realEndpointConnectCount, 0);
  assert.equal(normalDecision.auditDraft.realPriceReturnCount, 0);
  assert.equal(normalDecision.auditDraft.bookingUrlReturnCount, 0);
  assert.equal(normalDecision.auditDraft.paymentAttemptCount, 0);
  assert.equal(normalDecision.auditDraft.orderAttemptCount, 0);
  assert.equal(normalDecision.auditDraft.identityUploadAttemptCount, 0);
  assert.equal(normalDecision.auditDraft.redacted, true);
  assert.equal(normalDecision.credentialStorage.secureStorageImplementation, "missing");
  assert.equal(normalDecision.credentialStorage.realCredentialConnected, "no");
  assert.equal(normalDecision.credentialStorage.credentialConsent, "missing");
  assert.equal(normalDecision.credentialStorage.readonlyAdapterContract, "missing");
  assert.equal(normalDecision.credentialStorage.flightAdapterV1, "not_started");
  assert.equal(normalDecision.credentialStorage.credentialPlaintextDisplay, "disabled");
  assert.equal(normalDecision.credentialStorage.credentialExport, "disabled");
  assert.equal(decisionApi.assertProviderConnectionReadinessDecisionSafe(normalDecision), true);

  const restrictedDecision = decisionApi.evaluateProviderConnectionReadiness({ providerCategory:"restricted_provider" });
  assert.equal(restrictedDecision.finalDecision, "blocked");
  assert.equal(restrictedDecision.decisionReason, "restricted category blocked");
  assert.equal(decisionApi.assertProviderConnectionReadinessDecisionSafe(restrictedDecision), true);

  const paymentDecision = decisionApi.evaluateProviderConnectionReadiness({
    providerCategory:"hotel_provider",
    requestsPayment:true
  });
  assert.equal(paymentDecision.finalDecision, "blocked");
  assert.equal(paymentDecision.decisionReason, "forbidden capability requested");

  const consoleState = consoleApi.buildProviderConnectionReadinessConsole();
  assert.equal(consoleState.consoleVersion, "2.1.73");
  assert.equal(consoleState.status, "readiness console only");
  assert.equal(consoleState.mode, "offline planning only");
  assert.equal(consoleState.realProvider, "disabled");
  assert.equal(consoleState.realNetwork, "disabled");
  assert.equal(consoleState.realApiKey, "disabled");
  assert.equal(consoleState.realEndpoint, "disabled");
  assert.equal(consoleState.realPrice, "limited_beta_guarded_only");
  assert.equal(consoleState.availability, "disabled");
  assert.equal(consoleState.bookingUrl, "disabled");
  assert.equal(consoleState.payment, "disabled");
  assert.equal(consoleState.order, "disabled");
  assert.equal(consoleState.identityUpload, "disabled");
  assert.equal(consoleState.redacted, true);

  const categories = consoleState.categoryRows.map((row) => row.providerCategory);
  assert.equal(JSON.stringify(categories), JSON.stringify([
    "flight_provider",
    "hotel_provider",
    "product_provider",
    "local_service_provider",
    "ticket_activity_provider",
    "restricted_provider"
  ]));

  for (const row of consoleState.categoryRows) {
    assert.equal(row.realProvider, "disabled");
    assert.equal(row.realNetwork, "disabled");
    assert.equal(row.realApiKey, "disabled");
    assert.equal(row.realEndpoint, "disabled");
    assert.equal(row.realPrice, row.providerCategory === "flight_provider" ? "limited_beta_guarded_only" : "disabled");
    assert.equal(row.availability, "disabled");
    assert.equal(row.bookingUrl, "disabled");
    assert.equal(row.payment, "disabled");
    assert.equal(row.order, "disabled");
    assert.equal(row.identityUpload, "disabled");
    assert.equal(row.credentialStorage.credentialPlaintextDisplay, "disabled");
    assert.equal(row.credentialStorage.credentialExport, "disabled");
    if (row.providerCategory === "restricted_provider") {
      assert.equal(row.credentialStorage.secureStorageImplementation, "not allowed");
      assert.equal(row.credentialStorage.realCredentialConnected, "not allowed");
    } else {
      assert.equal(row.credentialStorage.secureStorageImplementation, "ready");
      assert.equal(row.credentialStorage.realCredentialConnected, "no");
      if (row.providerCategory === "flight_provider") {
        assert.equal(row.credentialStorage.credentialConsent, "draft-ready");
        assert.equal(row.credentialStorage.readonlyAdapterContract, "draft-ready");
        assert.equal(row.credentialStorage.flightAdapterV1, "offline fixture ready");
        assert.equal(row.credentialStorage.endpointAllowlistEnforcement, "draft-ready");
        assert.equal(row.credentialStorage.sandboxRealKeyDryRunGate, "draft-ready");
        assert.equal(row.credentialStorage.sandboxResponseSchemaGate, "draft-ready");
        assert.equal(row.credentialStorage.realProviderResultSchemaValidation, "draft-ready");
        assert.equal(row.credentialStorage.providerResultSourceLabelGate, "draft-ready");
        assert.equal(row.credentialStorage.priceIntegrityTaxesFeesGate, "draft-ready");
        assert.equal(row.credentialStorage.realPriceDisplayGate, "guarded-display-ready");
        assert.equal(row.credentialStorage.manualProviderReviewWorkflow, "v1");
        assert.equal(row.credentialStorage.manualReviewState, "approved_for_limited_beta");
        assert.equal(row.credentialStorage.limitedRealPriceUiBeta, "flight_only");
        assert.equal(row.credentialStorage.limitedBetaDisplayGate, "draft-ready");
        assert.equal(row.credentialStorage.limitedBetaPriceDisplay, "guarded only");
        assert.equal(row.credentialStorage.limitedBetaKillSwitch, "active");
        assert.equal(row.credentialStorage.rollbackGuard, "active");
        assert.equal(row.credentialStorage.manualBookingHandoff, "manual-only");
        assert.equal(row.credentialStorage.betaRollbackState, "not_needed");
        assert.equal(row.credentialStorage.sandboxTestPriceDisplay, "guarded only");
        assert.equal(row.credentialStorage.productionPriceDisplay, "disabled");
        assert.equal(row.credentialStorage.bookingUrlDisplay, "disabled");
        assert.equal(row.credentialStorage.sandboxDryRunTransport, "simulated only");
        assert.equal(row.readinessMatrix.credentialConsent, "draft-ready");
        assert.equal(row.readinessMatrix.readonlyAdapter, "draft-ready");
        assert.equal(row.readinessMatrix.flightAdapterV1, "offline fixture ready");
        assert.equal(row.readinessMatrix.endpointAllowlistEnforcement, "draft-ready");
        assert.equal(row.readinessMatrix.sandboxRealKeyDryRunGate, "draft-ready");
        assert.equal(row.readinessMatrix.sandboxResponseSchemaGate, "draft-ready");
        assert.equal(row.readinessMatrix.realProviderResultSchemaValidation, "draft-ready");
        assert.equal(row.readinessMatrix.providerResultSourceLabelGate, "draft-ready");
        assert.equal(row.readinessMatrix.priceIntegrityGate, "draft-ready");
        assert.equal(row.readinessMatrix.priceIntegrityTaxesFeesGate, "draft-ready");
        assert.equal(row.readinessMatrix.realPriceDisplayGate, "guarded-display-ready");
        assert.equal(row.readinessMatrix.manualProviderReviewWorkflow, "v1");
        assert.equal(row.readinessMatrix.manualReviewState, "approved_for_limited_beta");
        assert.equal(row.readinessMatrix.limitedRealPriceUiBeta, "flight_only");
        assert.equal(row.readinessMatrix.limitedBetaDisplayGate, "draft-ready");
        assert.equal(row.readinessMatrix.limitedBetaPriceDisplay, "guarded only");
        assert.equal(row.readinessMatrix.limitedBetaKillSwitch, "active");
        assert.equal(row.readinessMatrix.rollbackGuard, "active");
        assert.equal(row.readinessMatrix.manualBookingHandoff, "manual-only");
        assert.equal(row.readinessMatrix.betaRollbackState, "not_needed");
        assert.equal(row.readinessMatrix.sandboxTestPriceDisplay, "guarded only");
        assert.equal(row.readinessMatrix.productionPriceDisplay, "disabled");
        assert.equal(row.readinessMatrix.bookingUrlDisplay, "disabled");
        assert.equal(row.readinessMatrix.schemaGate, "draft-ready");
        assert.equal(row.readinessMatrix.sourceLabelGate, "draft-ready");
        assert.equal(row.readinessMatrix.sandboxDryRunTransport, "simulated only");
      } else {
        assert.equal(row.credentialStorage.credentialConsent, "missing");
        assert.equal(row.credentialStorage.readonlyAdapterContract, "missing");
        assert.equal(row.credentialStorage.flightAdapterV1, "not_started");
      }
    }
    assert.equal(["limited-beta-ready", "no-go", "blocked"].includes(row.finalDecision), true);
  }

  assert.equal(consoleState.categoryRows.filter((row) => row.finalDecision === "blocked").length, 1);
  const flightRow = consoleState.categoryRows.find((row) => row.providerCategory === "flight_provider");
  assert.equal(flightRow.credentialStorage.secureStorageImplementation, "ready");
  assert.equal(flightRow.credentialStorage.realCredentialConnected, "no");
  assert.equal(flightRow.credentialStorage.credentialConsent, "draft-ready");
  assert.equal(flightRow.credentialStorage.readonlyAdapterContract, "draft-ready");
  assert.equal(flightRow.credentialStorage.flightAdapterV1, "offline fixture ready");
  assert.equal(flightRow.credentialStorage.endpointAllowlistEnforcement, "draft-ready");
  assert.equal(flightRow.credentialStorage.sandboxRealKeyDryRunGate, "draft-ready");
  assert.equal(flightRow.credentialStorage.sandboxResponseSchemaGate, "draft-ready");
  assert.equal(flightRow.credentialStorage.realProviderResultSchemaValidation, "draft-ready");
  assert.equal(flightRow.credentialStorage.providerResultSourceLabelGate, "draft-ready");
  assert.equal(flightRow.credentialStorage.priceIntegrityTaxesFeesGate, "draft-ready");
  assert.equal(flightRow.credentialStorage.realPriceDisplayGate, "guarded-display-ready");
  assert.equal(flightRow.credentialStorage.manualProviderReviewWorkflow, "v1");
  assert.equal(flightRow.credentialStorage.manualReviewState, "approved_for_limited_beta");
  assert.equal(flightRow.credentialStorage.limitedRealPriceUiBeta, "flight_only");
  assert.equal(flightRow.credentialStorage.limitedBetaDisplayGate, "draft-ready");
  assert.equal(flightRow.credentialStorage.limitedBetaPriceDisplay, "guarded only");
  assert.equal(flightRow.credentialStorage.limitedBetaKillSwitch, "active");
  assert.equal(flightRow.credentialStorage.rollbackGuard, "active");
  assert.equal(flightRow.credentialStorage.manualBookingHandoff, "manual-only");
  assert.equal(flightRow.credentialStorage.betaRollbackState, "not_needed");
  assert.equal(flightRow.credentialStorage.sandboxTestPriceDisplay, "guarded only");
  assert.equal(flightRow.credentialStorage.productionPriceDisplay, "disabled");
  assert.equal(flightRow.credentialStorage.bookingUrlDisplay, "disabled");
  assert.equal(flightRow.credentialStorage.sandboxDryRunTransport, "simulated only");
  assert.equal(flightRow.readinessMatrix.schemaGate, "draft-ready");
  assert.equal(flightRow.readinessMatrix.sourceLabelGate, "draft-ready");
  assert.equal(flightRow.readinessMatrix.priceIntegrityGate, "draft-ready");
  assert.equal(flightRow.readinessMatrix.realPriceDisplayGate, "guarded-display-ready");
  assert.equal(flightRow.readinessMatrix.manualProviderReviewWorkflow, "v1");
  assert.equal(flightRow.readinessMatrix.manualReviewState, "approved_for_limited_beta");
  assert.equal(flightRow.readinessMatrix.limitedRealPriceUiBeta, "flight_only");
  assert.equal(flightRow.readinessMatrix.limitedBetaDisplayGate, "draft-ready");
  assert.equal(flightRow.readinessMatrix.limitedBetaPriceDisplay, "guarded only");
  assert.equal(flightRow.readinessMatrix.limitedBetaKillSwitch, "active");
  assert.equal(flightRow.readinessMatrix.rollbackGuard, "active");
  assert.equal(flightRow.readinessMatrix.manualBookingHandoff, "manual-only");
  assert.equal(flightRow.readinessMatrix.betaRollbackState, "not_needed");
  assert.equal(flightRow.readinessMatrix.sandboxTestPriceDisplay, "guarded only");
  assert.equal(flightRow.readinessMatrix.productionPriceDisplay, "disabled");
  assert.equal(flightRow.readinessMatrix.bookingUrlDisplay, "disabled");
  assert.equal(flightRow.finalDecision, "limited-beta-ready");
  assert.equal(consoleState.categoryRows.find((row) => row.providerCategory === "restricted_provider").finalDecision, "blocked");
  assert.equal(consoleState.readinessMatrix.rows.length, 6);
  assert.equal(consoleState.readinessMatrix.rows.some((row) => row.includes("flight_provider") && row.includes("draft-ready") && row.includes("approved_for_limited_beta") && row.includes("flight_only") && row.includes("simulated only") && row.includes("secure storage implementation ready") && row.includes("limited-beta-ready")), true);
  assert.equal(consoleState.readinessMatrix.rows.some((row) => row.includes("restricted_provider") && row.includes("blocked")), true);
  assert.equal(consoleState.auditDraft.approvedProviderCount, 0);
  assert.equal(consoleState.auditDraft.connectedProviderCount, 0);
  assert.equal(consoleState.auditDraft.networkAttemptCount, 0);
  assert.equal(consoleState.auditDraft.realApiKeyReadCount, 0);
  assert.equal(consoleState.auditDraft.realEndpointConnectCount, 0);
  assert.equal(consoleState.auditDraft.realPriceReturnCount, 0);
  assert.equal(consoleState.auditDraft.bookingUrlReturnCount, 0);
  assert.equal(consoleState.auditDraft.paymentAttemptCount, 0);
  assert.equal(consoleState.auditDraft.orderAttemptCount, 0);
  assert.equal(consoleState.auditDraft.identityUploadAttemptCount, 0);
  assert.equal(consoleState.auditDraft.redacted, true);
  assert.equal(consoleApi.assertProviderConnectionReadinessConsoleSafe(consoleState), true);

  assertNoDangerousSurface(normalDecision);
  assertNoDangerousSurface(restrictedDecision);
  assertNoDangerousSurface(consoleState);

  console.log("PROVIDER_CONNECTION_READINESS_CORE PASS");
}

main();
