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
    "apps/desktop/src/renderer/core/providerConfirmationHandoffUi.js",
    "apps/desktop/src/renderer/core/trustedFlightSourceEvidenceReport.js",
    "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js",
    "apps/desktop/src/renderer/core/realFlightPriceFetchSafetyGate.js",
    "apps/desktop/src/renderer/core/realFlightPriceProviderAdapterSlot.js",
    "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js",
    "apps/desktop/src/renderer/core/realFlightPriceEvidenceReport.js"
  ]);

  const api = windowRef.WeishanRealFlightPriceEvidenceReport;
  assert.equal(api.REAL_FLIGHT_PRICE_EVIDENCE_REPORT_VERSION, "2.1.43");

  const report = api.buildRealFlightPriceEvidenceReport({
    origin: "上海",
    destination: "成都",
    departureDate: "2026-07-15",
    tripType: "one_way",
    passengerCount: 1,
    cabinClass: "economy",
    directOnly: true,
    sortIntent: "低价优先"
  }, { dryRunEnabled: false, hasSecureCredentialReference: false });

  assert.equal(report.reportName, "real_flight_price_evidence_report_v1");
  assert.equal(report.appVersion, "2.1.43");
  assert.equal(report.mode, "read_only_beta");
  assert.equal(report.userFacingRealPriceEnabled, false);
  assert.equal(report.debugEvidenceEnabled, true);
  assert.equal(report.provider.providerMode, "fixture");
  assert.equal(report.provider.fareSource, "fixture_read_only");
  assert.equal(report.fetchSafety.status, "allowed");
  assert.equal(report.fetchSafety.networkAllowed, false);
  assert.equal(report.priceQuote.currency, "CNY");
  assert.equal(report.priceQuote.baseFare, 860);
  assert.equal(report.priceQuote.taxesAndFees, 110);
  assert.equal(report.priceQuote.providerFees, 40);
  assert.equal(report.priceQuote.totalPrice, 1010);
  assert.equal(report.priceQuote.bookingUrl, null);
  assert.equal(report.priceQuote.checkoutUrl, null);
  assert.equal(report.priceQuote.paymentUrl, null);
  assert.equal(report.priceQuote.orderUrl, null);
  assert.equal(report.integrity.totalMatchesBreakdown, true);
  assert.equal(report.integrity.showableAsRealPrice, false);
  assert.equal(report.integrity.showableAsCandidateEvidence, true);
  assert.equal(report.integrity.userFacingCaveatRequired, true);
  assert.equal(report.integrity.caveat, "价格、库存、税费和规则以平台页面为准。");
  assert.equal(report.handoff.safeProviderHandoffReady, true);
  assert.equal(report.handoff.safeProviderHandoffUrl.startsWith("https://www.google.com/travel/flights"), true);
  assert.equal(report.handoff.bookingUrl, null);
  assert.equal(report.handoff.autoOpen, false);
  assert.equal(report.handoff.requiresConfirmation, true);
  assert.equal(report.safety.checkout, "blocked");
  assert.equal(report.safety.payment, "blocked");
  assert.equal(report.safety.order, "blocked");
  assert.equal(report.safety.identityUpload, "blocked");
  assert.equal(report.readiness.betaReady, true);
  assert.equal(report.readiness.canShowInDebugPanel, true);
  assert.equal(report.readiness.canReplaceMainResultCard, false);
  assert.equal(report.readiness.finalDecision, "debug_price_evidence_ready");
  assert.equal(report.trustedFlightSourceEvidence.safeProviderHandoffReady, true);
  assert.equal(report.trustedFlightSourceEvidence.realPriceClaimAllowed, false);
  assert.equal(report.redacted, true);

  const summary = api.summarizeRealFlightPriceEvidenceReport(report);
  assert.equal(summary.reportName, "real_flight_price_evidence_report_v1");
  assert.equal(summary.mode, "read_only_beta");
  assert.equal(summary.userFacingRealPriceEnabled, false);
  assert.equal(summary.debugEvidenceEnabled, true);
  assert.equal(summary.safeProviderHandoffReady, true);
  assert.equal(summary.canReplaceMainResultCard, false);
  assert.equal(summary.finalDecision, "debug_price_evidence_ready");
  assert.equal(summary.redacted, true);

  const readiness = api.evaluateRealFlightPriceBetaReadiness(report);
  assert.equal(readiness.betaReady, true);
  assert.equal(readiness.canShowInDebugPanel, true);
  assert.equal(readiness.canReplaceMainResultCard, false);
  assert.equal(readiness.finalDecision, "debug_price_evidence_ready");
  assert.equal(readiness.redacted, true);

  const audit = api.getRealFlightPriceEvidenceReportAuditDraft({ origin: "上海", destination: "成都", departureDate: "2026-07-15" }, { dryRunEnabled: false, hasSecureCredentialReference: false });
  assert.equal(audit.eventType, "REAL_FLIGHT_PRICE_EVIDENCE_REPORT_DRAFT");
  assert.equal(audit.appVersion, "2.1.43");
  assert.equal(audit.mode, "read_only_beta");
  assert.equal(audit.userFacingRealPriceEnabled, false);
  assert.equal(audit.debugEvidenceEnabled, true);
  assert.equal(audit.safeProviderHandoffReady, true);
  assert.equal(audit.bookingUrlDisplayedCount, 0);
  assert.equal(audit.paymentAttemptCount, 0);
  assert.equal(audit.orderAttemptCount, 0);
  assert.equal(audit.identityUploadAttemptCount, 0);
  assert.equal(audit.rawTokenDisplayedCount, 0);
  assert.equal(audit.rawApiKeyDisplayedCount, 0);
  assert.equal(audit.rawEndpointDisplayedCount, 0);
  assert.equal(audit.realProviderCallCount, 0);
  assert.equal(audit.redacted, true);

  assert.equal(api.assertRealFlightPriceEvidenceReportSafe(report), true);
  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes("token"), false);
  assert.equal(serialized.includes("apiKey"), false);
  assert.equal(serialized.includes("secret"), false);
  assert.equal(serialized.includes("bookingUrl\":null"), true);
  assert.equal(serialized.includes("paymentUrl\":null"), true);
  assert.equal(serialized.includes("orderUrl\":null"), true);

  console.log("REAL_FLIGHT_PRICE_EVIDENCE_REPORT_CORE PASS");
}

main();
