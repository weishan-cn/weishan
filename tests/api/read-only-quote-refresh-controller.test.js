const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function assertSafety(payload) {
  assert.equal(payload.userFacing, false);
  assert.equal(payload.canReplace, false);
  assert.equal(payload.showableAsRealPrice, false);
  assert.equal(payload.productionProviderEnabled, false);
  assert.equal(payload.bookingUrl, null);
  assert.equal(payload.checkoutUrl, null);
  assert.equal(payload.paymentUrl, null);
  assert.equal(payload.orderUrl, null);
  assert.equal(payload.autoOpen, false);
  assert.equal(payload.autoRefresh, false);
  assert.equal(payload.refreshButton.label, "刷新只读报价");
  assert.equal(payload.refreshButton.requiresConfirmation, false);
  assert.equal(payload.refreshButton.autoRun, false);
  assert.equal(payload.refreshButton.autoRefresh, false);
  assert.equal(payload.refreshButton.payment, false);
  assert.equal(payload.refreshButton.order, false);
  assert.equal(payload.refreshButton.identityUpload, false);
  assert.equal(payload.redacted, true);
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/providerConfirmationHandoffUi.js",
    "apps/desktop/src/renderer/core/providerSandboxBindingWizard.js",
    "apps/desktop/src/renderer/core/providerCredentialReadinessPanel.js",
    "apps/desktop/src/renderer/core/singleFlightProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/trustedFlightSourceEvidenceReport.js",
    "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js",
    "apps/desktop/src/renderer/core/realFlightPriceFetchSafetyGate.js",
    "apps/desktop/src/renderer/core/realFlightPriceProviderAdapterSlot.js",
    "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js",
    "apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js",
    "apps/desktop/src/renderer/core/sandboxProviderResponseImportStateStore.js",
    "apps/desktop/src/renderer/core/realFlightPriceEvidenceReport.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRefreshStateStore.js",
    "apps/desktop/src/renderer/core/readOnlyPriceCandidateCardViewModel.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRefreshController.js"
  ]);
  const api = windowRef.WeishanReadOnlyQuoteRefreshController;
  assert.equal(api.READ_ONLY_QUOTE_REFRESH_CONTROLLER_VERSION, "2.2.0");

  const request = api.buildReadOnlyQuoteRefreshRequest({ origin:"上海", destination:"成都", departureDate:"2026-07-15" });
  assert.equal(request.controllerName, "read_only_quote_refresh_controller_v1");
  assert.equal(request.appVersion, "2.2.0");
  assert.equal(request.autoRun, false);
  assert.equal(request.autoOpen, false);
  assert.equal(request.bookingUrl, null);

  const availability = api.evaluateReadOnlyQuoteRefreshAvailability({ origin:"上海", destination:"成都" });
  assert.equal(availability.status, "available");
  assert.equal(availability.providerCredentialReadiness.status, "fixture_ready");
  assert.equal(availability.refreshButton.enabled, true);
  assertSafety(availability);

  const refreshed = api.runReadOnlyQuoteRefresh({ origin:"上海", destination:"成都", departureDate:"2026-07-15" });
  assert.equal(refreshed.status, "refreshed");
  assert.equal(refreshed.connectorStatus.status, "fixture_ready");
  assert.equal(refreshed.priceEvidenceReport.refresh.lastRefreshStatus, "refreshed");
  assert.equal(refreshed.priceEvidenceReport.readiness.finalDecision, "fixture_refresh_ready");
  assert.equal(refreshed.candidateCard.refreshButton.enabled, true);
  assert.equal(refreshed.showableAsCandidateEvidence, true);
  assertSafety(refreshed);

  const sandbox = api.runReadOnlyQuoteRefresh({ providerMode:"sandbox_read_only" }, { providerMode:"sandbox_read_only", hasSecureCredentialReference:true, sandboxDryRunEnabled:true });
  assert.equal(sandbox.status, "refreshed");
  assert.equal(sandbox.providerCredentialReadiness.status, "sandbox_ready");
  assert.equal(sandbox.priceEvidenceReport.readiness.finalDecision, "sandbox_read_only_refresh_ready");
  assertSafety(sandbox);

  const production = api.evaluateReadOnlyQuoteRefreshAvailability({ providerMode:"production" }, { providerMode:"production" });
  assert.equal(production.status, "disabled");
  assert.equal(production.refreshButton.enabled, false);
  assertSafety(production);

  const blocked = api.runReadOnlyQuoteRefresh({ restrictedCategoryDecision:"blocked" });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.showableAsCandidateEvidence, false);
  assertSafety(blocked);

  const storage = (() => { const data = new Map(); return { getItem:(name) => data.has(name) ? data.get(name) : null, setItem:(name, value) => data.set(name, String(value)), removeItem:(name) => data.delete(name) }; })();
  const persisted = api.runAndPersistReadOnlyQuoteRefresh({ origin:"上海", destination:"成都" }, { storageLike:storage });
  assert.equal(persisted.status, "refreshed");
  assert.equal(persisted.persistedRefreshState.lastRefreshStatus, "refreshed");
  assert.equal(persisted.refreshStateSummary.summary, "最近一次刷新：已刷新");
  const loadedEvidence = api.loadLastReadOnlyQuoteRefreshEvidence({ storageLike:storage });
  assert.equal(loadedEvidence.state.lastRefreshStatus, "refreshed");
  assert.equal(loadedEvidence.storageHealth.status, "healthy");
  assert.equal(api.clearLastReadOnlyQuoteRefreshEvidence({ storageLike:storage }).state.lastRefreshStatus, "not_run");

  const originalEvidence = windowRef.WeishanRealFlightPriceEvidenceReport.buildRealFlightPriceEvidenceReport;
  windowRef.WeishanRealFlightPriceEvidenceReport.buildRealFlightPriceEvidenceReport = () => { throw new Error("safe failure"); };
  const failed = api.runAndPersistReadOnlyQuoteRefresh({ origin:"上海", destination:"成都" }, { storageLike:storage });
  assert.equal(failed.status, "failed_safe");
  assert.equal(failed.persistedRefreshState.lastRefreshStatus, "failed_safe");
  assert.equal(failed.refreshStateSummary.summary, "最近一次刷新：安全失败");
  assert.equal(failed.errorSummary, "只读报价刷新失败，已安全降级");
  windowRef.WeishanRealFlightPriceEvidenceReport.buildRealFlightPriceEvidenceReport = originalEvidence;


  const sandboxImported = api.runAndPersistSandboxImportRefresh({ providerId:"google_flights_search", providerName:"Google Flights", route:{ origin:"上海", destination:"成都" }, departureDate:"2026-07-15", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-06-20T00:00:00.000Z", fareSource:"sandbox_read_only_import", handoffCandidate:{ providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", searchOnly:true, redacted:true } }, { storageLike:storage });
  assert.equal(sandboxImported.status, "refreshed");
  assert.equal(sandboxImported.lastImportStatus, "accepted");
  assert.equal(sandboxImported.priceEvidenceReport.readiness.finalDecision, "sandbox_import_evidence_ready");
  assert.equal(sandboxImported.candidateCard.sandboxImportSummary.rawResponseStored, false);
  assert.equal(sandboxImported.candidateCard.importedEvidenceBanner.includes("导入响应已脱敏"), true);
  assert.equal(sandboxImported.bookingUrl, null);
  assert.equal(sandboxImported.autoOpen, false);
  const lastSandboxImport = api.loadLastSandboxImportEvidence({ storageLike:storage });
  assert.equal(lastSandboxImport.state.lastImportStatus, "accepted");
  assert.equal(lastSandboxImport.sandboxImportStateSummary.importedEvidenceAvailable, true);
  assert.equal(api.clearLastSandboxImportEvidence({ storageLike:storage }).state.lastImportStatus, "not_run");

  const audit = api.buildReadOnlyQuoteRefreshAuditDraft({ origin:"上海", destination:"成都" });
  assert.equal(audit.eventType, "READ_ONLY_QUOTE_REFRESH_CONTROLLER_AUDIT_DRAFT");
  assert.equal(audit.autoRun, false);
  assert.equal(audit.autoRefresh, false);
  assert.equal(audit.bookingUrl, null);
  assert.equal(audit.productionProviderEnabled, false);
  assert.equal(audit.redacted, true);

  const source = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/readOnlyQuoteRefreshController.js"), "utf8");
  assert.equal(source.includes("window.open"), false);
  assert.equal(source.includes("openExternal"), false);
  const serialized = JSON.stringify({ request, availability, refreshed, sandbox, production, blocked, audit });
  for (const word of ["checkoutUrl\":\"", "paymentUrl\":\"", "orderUrl\":\""]) assert.equal(serialized.includes(word), false);
  console.log("READ_ONLY_QUOTE_REFRESH_CONTROLLER_CORE PASS");
}

main();
