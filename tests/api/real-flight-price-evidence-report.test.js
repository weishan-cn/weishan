const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/providerConfirmationHandoffUi.js",
    "apps/desktop/src/renderer/core/trustedFlightSourceEvidenceReport.js",
    "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js",
    "apps/desktop/src/renderer/core/providerSandboxBindingWizard.js",
    "apps/desktop/src/renderer/core/providerCredentialReadinessPanel.js",
    "apps/desktop/src/renderer/core/singleFlightProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/realFlightPriceFetchSafetyGate.js",
    "apps/desktop/src/renderer/core/realFlightPriceProviderAdapterSlot.js",
    "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js",
    "apps/desktop/src/renderer/core/realFlightPriceEvidenceReport.js"
  ]);

  const api = windowRef.WeishanRealFlightPriceEvidenceReport;
  assert.equal(api.REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION, "2.1.60");

  const report = api.buildRealFlightPriceEvidenceReport({ origin:"上海", destination:"成都", departureDate:"2026-07-15" });
  assert.equal(report.reportName, "real_flight_price_evidence_report_v1");
  assert.equal(report.appVersion, "2.1.60");
  assert.equal(report.mode, "read_only_beta");
  assert.equal(report.userFacingRealPriceEnabled, false);
  assert.equal(report.providerConnector.connectorName, "single_flight_provider_sandbox_connector_v1");
  assert.equal(report.providerConnector.status, "fixture_ready");
  assert.equal(report.provider.providerMode, "fixture");
  assert.equal(report.fetchSafety.status, "allowed");
  assert.equal(report.fetchSafety.networkAllowed, false);
  assert.equal(report.priceQuote.totalPrice, 1010);
  assert.equal(report.priceQuote.bookingUrl, null);
  assert.equal(report.handoff.safeProviderHandoffReady, true);
  assert.equal(report.handoff.safeProviderHandoffUrl.startsWith("https://www.google.com/travel/flights"), true);
  assert.equal(report.handoff.bookingUrl, null);
  assert.equal(report.handoff.autoOpen, false);
  assert.equal(report.readiness.canUseFixtureEvidence, true);
  assert.equal(report.readiness.canUseSandboxReadOnlyEvidence, false);
  assert.equal(report.readiness.productionProviderEnabled, false);
  assert.equal(report.readiness.userFacingRealPriceEnabled, false);
  assert.equal(report.readiness.showableAsRealPrice, false);
  assert.equal(report.readiness.canReplaceMainResultCard, false);
  assert.equal(report.readiness.finalDecision, "fixture_refresh_ready");
  assert.equal(report.refresh.refreshSupported, true);
  assert.equal(report.refresh.refreshMode, "fixture");
  assert.equal(report.refresh.lastRefreshStatus, "not_run");
  assert.equal(report.refresh.userTriggeredOnly, true);
  assert.equal(report.refresh.autoRefresh, false);
  assert.equal(report.credentialReadiness.status, "fixture_ready");
  assert.equal(report.credentialReadiness.productionProviderEnabled, false);
  assert.equal(report.credentialReadiness.wizardSummary.title, "Provider 沙盒绑定准备");

  const sandboxReport = api.buildRealFlightPriceEvidenceReport({ origin:"上海", destination:"成都", departureDate:"2026-07-15", providerMode:"sandbox_read_only" }, { providerMode:"sandbox_read_only", providerId:"google_flights_search", sandboxDryRunEnabled:true, hasSecureCredentialReference:true });
  assert.equal(sandboxReport.mode, "sandbox_read_only_evidence");
  assert.equal(sandboxReport.providerConnector.status, "sandbox_ready");
  assert.equal(sandboxReport.providerConnector.networkAllowed, false);
  assert.equal(sandboxReport.provider.providerMode, "sandbox_read_only");
  assert.equal(sandboxReport.priceQuote.fareSource, "sandbox_read_only_stub");
  assert.equal(sandboxReport.fetchSafety.status, "allowed");
  assert.equal(sandboxReport.readiness.canUseFixtureEvidence, false);
  assert.equal(sandboxReport.readiness.canUseSandboxReadOnlyEvidence, true);
  assert.equal(sandboxReport.readiness.finalDecision, "sandbox_read_only_refresh_ready");
  assert.equal(sandboxReport.credentialReadiness.status, "sandbox_ready");
  assert.equal(sandboxReport.refresh.refreshMode, "sandbox_read_only");
  assert.equal(sandboxReport.userFacingRealPriceEnabled, false);
  assert.equal(sandboxReport.readiness.canReplaceMainResultCard, false);

  const productionReport = api.buildRealFlightPriceEvidenceReport({ providerMode:"production" }, { providerMode:"production", providerId:"google_flights_search" });
  assert.equal(productionReport.providerConnector.providerMode, "production_disabled");
  assert.equal(productionReport.providerConnector.status, "disabled");
  assert.equal(productionReport.providerConnector.productionProviderEnabled, false);
  assert.equal(productionReport.readiness.finalDecision, "refresh_disabled");
  assert.equal(productionReport.refresh.refreshMode, "disabled");

  const blockedReport = api.buildRealFlightPriceEvidenceReport({ restrictedCategoryDecision:"blocked" });
  assert.equal(blockedReport.fetchSafety.status, "blocked");
  assert.equal(blockedReport.readiness.finalDecision, "blocked");
  assert.equal(blockedReport.handoff.safeProviderHandoffReady, false);
  assert.equal(blockedReport.handoff.safeProviderHandoffUrl, null);


  const importQuote = { providerId:"google_flights_search", providerName:"Google Flights", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-06-20T00:00:00.000Z", freshnessMinutes:0, safeProviderHandoffReady:false, safeProviderHandoffUrl:null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, booking:false, payment:false, order:false, identityUpload:false, redacted:true };
  const importReport = api.buildRealFlightPriceEvidenceReport({ origin:"上海", destination:"成都", departureDate:"2026-07-15", providerMode:"sandbox_read_only" }, { sandboxImport:{ status:"accepted", importStatus:"accepted", lastImportStatus:"accepted", normalizedQuote:importQuote, rawResponseStored:false, sanitized:true, redacted:true }, sandboxImportQuote:importQuote, sandboxImportStatus:"accepted" });
  assert.equal(importReport.mode, "sandbox_read_only_import_evidence");
  assert.equal(importReport.sandboxImport.lastImportStatus, "accepted");
  assert.equal(importReport.sandboxImport.rawResponseStored, false);
  assert.equal(importReport.sandboxImport.showableAsRealPrice, false);
  assert.equal(importReport.readiness.finalDecision, "sandbox_import_evidence_ready");
  assert.equal(importReport.priceQuote.bookingUrl, null);
  assert.equal(importReport.handoff.autoOpen, false);

  const rejectedImportReport = api.buildRealFlightPriceEvidenceReport({ providerMode:"sandbox_read_only" }, { sandboxImport:{ status:"rejected", importStatus:"rejected", lastImportStatus:"rejected", rawResponseStored:false, sanitized:true, redacted:true }, sandboxImportStatus:"rejected" });
  assert.equal(rejectedImportReport.readiness.finalDecision, "sandbox_import_rejected");
  assert.equal(rejectedImportReport.sandboxImport.importedEvidenceAvailable, false);

  const summary = api.summarizeRealFlightPriceEvidenceReport(sandboxReport);
  assert.equal(summary.connectorStatus, "sandbox_ready");
  assert.equal(summary.finalDecision, "sandbox_read_only_refresh_ready");
  assert.equal(summary.canReplaceMainResultCard, false);

  const readiness = api.evaluateRealFlightPriceBetaReadiness(sandboxReport);
  assert.equal(readiness.canUseSandboxReadOnlyEvidence, true);
  assert.equal(readiness.productionProviderEnabled, false);
  assert.equal(readiness.showableAsRealPrice, false);

  const audit = api.getRealFlightPriceEvidenceReportAuditDraft({ origin:"上海", destination:"成都" });
  assert.equal(audit.appVersion, "2.1.60");
  assert.equal(audit.connectorStatus, "fixture_ready");
  assert.equal(audit.bookingUrlDisplayedCount, 0);
  assert.equal(audit.paymentAttemptCount, 0);
  assert.equal(audit.orderAttemptCount, 0);
  assert.equal(audit.identityUploadAttemptCount, 0);
  assert.equal(audit.realProviderCallCount, 0);
  assert.equal(audit.lastRefreshStatus, "not_run");
  assert.equal(audit.autoRefresh, false);

  assert.equal(api.assertRealFlightPriceEvidenceReportSafe(report), true);
  const serialized = JSON.stringify({ report, sandboxReport, productionReport, blockedReport });
  assert.equal(serialized.includes('"bookingUrl":null'), true);
  assert.equal(serialized.includes('"paymentUrl":null'), true);
  assert.equal(serialized.includes('"orderUrl":null'), true);
  console.log("REAL_FLIGHT_PRICE_EVIDENCE_REPORT_CORE PASS");
}

main();
