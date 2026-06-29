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
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/providerConfirmationHandoffUi.js"
  ]);

  const registryApi = windowRef.WeishanTrustedFlightSourceRegistry;
  const deepLinkGateApi = windowRef.WeishanSafeProviderDeepLinkHandoffGate;
  const confirmationUiApi = windowRef.WeishanProviderConfirmationHandoffUi;

  const calls = {
    registry: 0,
    readiness: 0,
    deepLink: 0,
    ui: 0
  };

  const originalGetRegistry = registryApi.getTrustedFlightSourceRegistry;
  const originalEvaluateReadiness = registryApi.evaluateTrustedFlightSourceReadiness;
  const originalEvaluateGate = deepLinkGateApi.evaluateSafeProviderDeepLinkHandoff;
  const originalBuildUi = confirmationUiApi.buildProviderConfirmationHandoffUiModel;

  registryApi.getTrustedFlightSourceRegistry = function () {
    calls.registry += 1;
    return originalGetRegistry.apply(this, arguments);
  };
  registryApi.evaluateTrustedFlightSourceReadiness = function () {
    calls.readiness += 1;
    return originalEvaluateReadiness.apply(this, arguments);
  };
  deepLinkGateApi.evaluateSafeProviderDeepLinkHandoff = function () {
    calls.deepLink += 1;
    return originalEvaluateGate.apply(this, arguments);
  };
  confirmationUiApi.buildProviderConfirmationHandoffUiModel = function () {
    calls.ui += 1;
    return originalBuildUi.apply(this, arguments);
  };

  vm.runInContext(
    fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/trustedFlightSourceEvidenceReport.js"), "utf8"),
    vm.createContext({ window: windowRef, console, URL }),
    { filename: "apps/desktop/src/renderer/core/trustedFlightSourceEvidenceReport.js" }
  );

  const api = windowRef.WeishanTrustedFlightSourceEvidenceReport;
  assert.equal(api.TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_VERSION, "2.1.98");

  const report = api.buildTrustedFlightSourceEvidenceReport();
  assert.equal(report.reportName, "trusted_flight_source_evidence_report_v1");
  assert.equal(report.appVersion, "2.1.98");
  assert.equal(report.status, "evidence_report_only");
  assert.equal(report.mode, "read_only");
  assert.equal(report.generatedAt, null);
  assert.equal(report.registry.status, "skeleton_ready");
  assert.equal(report.registry.sourceCount, 6);
  assert.equal(report.registry.manualSearchOnlyCount, 2);
  assert.equal(report.registry.fixtureOnlyCount, 4);
  assert.equal(report.registry.productionProviderCount, 0);
  assert.equal(report.registry.providers.length, 6);
  assert.equal(report.registry.providers.filter((provider) => provider.accessMode === "manual_search_only").every((provider) => provider.capabilitySummary.providerConfirmationLink === "confirmation_required"), true);
  assert.equal(report.registry.providers.find((provider) => provider.accessMode === "fixture_only").capabilitySummary.providerConfirmationLink, "disabled");
  assert.equal(report.deepLinkGate.providerConfirmationLink, "disabled");
  assert.equal(report.deepLinkGate.safeProviderHandoffUrl, null);
  assert.equal(report.deepLinkGate.bookingUrl, null);
  assert.equal(report.deepLinkGate.autoOpen, false);
  assert.equal(report.confirmationUi.continueButtonDisabled, true);
  assert.equal(report.confirmationUi.cancelButtonEnabled, true);
  assert.equal(report.safety.productionProviderAggregation, "disabled");
  assert.equal(report.safety.payment, "disabled");
  assert.equal(report.safety.order, "disabled");
  assert.equal(report.safety.identityUpload, "disabled");
  assert.equal(report.safety.tokenExposure, "redacted");
  assert.equal(report.safety.apiKeyExposure, "redacted");
  assert.equal(report.readiness.limitedBetaReady, false);
  assert.equal(report.readiness.safeProviderHandoffReady, false);
  assert.equal(report.readiness.realPriceClaimAllowed, false);
  assert.equal(report.readiness.bookingClaimAllowed, false);
  assert.equal(report.readiness.finalDecision, "blocked");
  assert.equal(report.redacted, true);

  const summary = api.summarizeTrustedFlightSourceEvidence(report);
  assert.equal(summary.sourceCount, 6);
  assert.equal(summary.manualSearchOnlyCount, 2);
  assert.equal(summary.fixtureOnlyCount, 4);
  assert.equal(summary.productionProviderCount, 0);
  assert.equal(summary.productionProviderAggregation, "disabled");
  assert.equal(summary.realProviderNetwork, "disabled");
  assert.equal(summary.realPriceClaimAllowed, false);
  assert.equal(summary.bookingClaimAllowed, false);
  assert.equal(summary.limitedBetaReady, false);
  assert.equal(summary.safeProviderHandoffReady, false);
  assert.equal(summary.finalDecision, "blocked");
  assert.equal(summary.redacted, true);

  const readiness = api.evaluateTrustedFlightSourceLimitedBetaReadiness(report);
  assert.equal(readiness.limitedBetaReady, false);
  assert.equal(readiness.safeProviderHandoffReady, false);
  assert.equal(readiness.userFacingClaimAllowed, false);
  assert.equal(readiness.realPriceClaimAllowed, false);
  assert.equal(readiness.bookingClaimAllowed, false);
  assert.equal(readiness.finalDecision, "blocked");
  assert.equal(readiness.redacted, true);

  const blockedReadiness = api.evaluateTrustedFlightSourceLimitedBetaReadiness({ registry: { sourceCount: 0 } });
  assert.equal(blockedReadiness.limitedBetaReady, false);
  assert.equal(blockedReadiness.finalDecision, "blocked");

  const audit = api.getTrustedFlightSourceEvidenceReportAuditDraft();
  assert.equal(audit.eventType, "TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_DRAFT");
  assert.equal(audit.reportName, "trusted_flight_source_evidence_report_v1");
  assert.equal(audit.appVersion, "2.1.98");
  assert.equal(audit.mode, "read_only");
  assert.equal(audit.generatedAt, null);
  assert.equal(audit.sourceCount, 6);
  assert.equal(audit.manualSearchOnlyCount, 2);
  assert.equal(audit.fixtureOnlyCount, 4);
  assert.equal(audit.productionProviderCount, 0);
  assert.equal(audit.productionProviderAggregation, "disabled");
  assert.equal(audit.realProviderNetwork, "disabled");
  assert.equal(audit.realPriceClaimAllowed, false);
  assert.equal(audit.bookingClaimAllowed, false);
  assert.equal(audit.limitedBetaReady, false);
  assert.equal(audit.safeProviderHandoffReady, false);
  assert.equal(audit.finalDecision, "blocked");
  assert.equal(audit.redacted, true);

  assert.equal(api.assertTrustedFlightSourceEvidenceReportSafe(report), true);

  assert.equal(calls.registry > 0, true);
  assert.equal(calls.readiness > 0, true);
  assert.equal(calls.deepLink > 0, true);
  assert.equal(calls.ui > 0, true);

  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes("http://"), false);
  assert.equal(serialized.includes("https://www.google.com/travel/flights"), true);
  assert.equal(serialized.includes("checkoutUrl"), false);
  assert.equal(serialized.includes("paymentUrl"), false);
  assert.equal(serialized.includes("orderUrl"), false);
  assert.equal(serialized.includes("rawToken"), false);
  assert.equal(serialized.includes("rawApiKey"), false);

  console.log("TRUSTED_FLIGHT_SOURCE_EVIDENCE_REPORT_CORE PASS");
}

main();
