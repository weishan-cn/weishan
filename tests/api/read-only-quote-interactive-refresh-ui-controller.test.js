const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function memoryStorage() { const data = new Map(); return { getItem:(name) => data.has(name) ? data.get(name) : null, setItem:(name, value) => data.set(name, String(value)), removeItem:(name) => data.delete(name) }; }
function assertSafe(state) {
  assert.equal(state.controllerName, "read_only_quote_interactive_refresh_ui_controller_v1");
  assert.equal(state.appVersion, "4.2.7");
  assert.equal(state.safety.bookingUrl, null);
  assert.equal(state.safety.checkoutUrl, null);
  assert.equal(state.safety.paymentUrl, null);
  assert.equal(state.safety.orderUrl, null);
  assert.equal(state.safety.autoOpen, false);
  assert.equal(state.safety.autoRefresh, false);
  assert.equal(state.safety.booking, false);
  assert.equal(state.safety.payment, false);
  assert.equal(state.safety.order, false);
  assert.equal(state.safety.identityUpload, false);
  assert.equal(state.recoveredEvidenceSummary.showableAsRealPrice, false);
  assert.equal(state.recoveredEvidenceSummary.canReplaceMainResultCard, false);
  assert.equal(state.refreshButton.autoRun, false);
  assert.equal(state.redacted, true);
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
    "apps/desktop/src/renderer/core/readOnlyQuoteRefreshController.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteInteractiveRefreshUiController.js"
  ]);
  const api = windowRef.WeishanReadOnlyQuoteInteractiveRefreshUiController;
  const storeApi = windowRef.WeishanReadOnlyQuoteRefreshStateStore;
  assert.equal(api.READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_VERSION, "4.2.7");

  const initial = api.buildReadOnlyQuoteInteractiveRefreshUiState();
  assert.equal(initial.status, "idle");
  assert.equal(initial.recoveryStatus, "not_loaded");
  assert.equal(initial.refreshButton.label, "刷新只读报价");
  assertSafe(initial);

  const init = api.reduceReadOnlyQuoteRefreshUiEvent(initial, { type:"INIT" });
  assert.equal(init.status, "idle");
  assert.equal(init.safety.autoRefresh, false);

  const storage = memoryStorage();
  storeApi.saveReadOnlyQuoteRefreshState({ lastRefreshStatus:"refreshed", providerName:"Google Flights", providerMode:"fixture", fareSource:"fixture_read_only", totalPrice:1010, currency:"CNY", freshnessStatus:"fresh", taxFeeIntegrityStatus:"complete", showableAsCandidateEvidence:true }, storage);
  const recovered = api.buildReadOnlyQuoteRecoveryUiState({ storageLike:storage });
  assert.equal(recovered.recoveryStatus, "recovered");
  assert.equal(recovered.recoveredEvidenceSummary.available, true);
  assert.equal(recovered.lastRefreshSummary.totalPrice, 1010);
  assertSafe(recovered);

  storage.setItem(storeApi.STORAGE_KEY, "{bad json");
  const corrupted = api.buildReadOnlyQuoteRecoveryUiState({ storageLike:storage });
  assert.equal(corrupted.recoveryStatus, "corrupted_safe_empty");
  assertSafe(corrupted);

  const refreshing = api.reduceReadOnlyQuoteRefreshUiEvent(initial, { type:"REFRESH_CLICKED" });
  assert.equal(refreshing.status, "refreshing");
  assert.equal(refreshing.refreshButton.loading, true);
  assert.equal(refreshing.refreshButton.label, "正在刷新只读报价");
  assertSafe(refreshing);

  const clicked = api.buildReadOnlyQuoteRefreshClickResult({ origin:"上海", destination:"成都" }, { storageLike:storage });
  assert.equal(clicked.status, "refreshed");
  assert.equal(clicked.recoveryStatus, "recovered");
  assert.equal(clicked.lastRefreshStatusLabel, "已刷新");
  assertSafe(clicked);

  const success = api.reduceReadOnlyQuoteRefreshUiEvent(initial, { type:"REFRESH_SUCCEEDED", result:{ status:"refreshed", persistedRefreshState:{ lastRefreshStatus:"refreshed", showableAsCandidateEvidence:true } } });
  assert.equal(success.status, "refreshed");
  assertSafe(success);

  const originalEvidence = windowRef.WeishanRealFlightPriceEvidenceReport.buildRealFlightPriceEvidenceReport;
  windowRef.WeishanRealFlightPriceEvidenceReport.buildRealFlightPriceEvidenceReport = () => { throw new Error("safe fail"); };
  const failed = api.buildReadOnlyQuoteRefreshClickResult({ origin:"上海", destination:"成都" }, { storageLike:storage });
  assert.equal(failed.status, "failed_safe");
  assert.equal(failed.refreshErrorBanner, "只读报价刷新失败，已安全降级");
  assertSafe(failed);
  windowRef.WeishanRealFlightPriceEvidenceReport.buildRealFlightPriceEvidenceReport = originalEvidence;


  const sandboxImport = windowRef.WeishanReadOnlyQuoteRefreshController.runAndPersistSandboxImportRefresh({ providerId:"google_flights_search", providerName:"Google Flights", route:{ origin:"上海", destination:"成都" }, departureDate:"2026-07-15", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-06-20T00:00:00.000Z", fareSource:"sandbox_read_only_import", handoffCandidate:{ providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", searchOnly:true, redacted:true } }, { storageLike:storage });
  assert.equal(sandboxImport.status, "refreshed");
  const sandboxRecovery = api.buildSandboxImportRecoveryUiState({ storageLike:storage });
  assert.equal(sandboxRecovery.recoveryStatus, "recovered");
  assert.equal(sandboxRecovery.sandboxImportSummary.rawResponseStored, false);
  assert.equal(sandboxRecovery.importedEvidenceBanner.includes("导入响应已脱敏"), true);
  assert.equal(sandboxRecovery.safety.autoOpen, false);

  const disabled = api.buildReadOnlyQuoteRefreshClickResult({ providerMode:"production" }, { providerMode:"production" });
  assert.equal(disabled.status, "disabled");
  assert.equal(disabled.refreshButton.enabled, false);
  assertSafe(disabled);

  const cleared = api.reduceReadOnlyQuoteRefreshUiEvent(recovered, { type:"CLEAR_REFRESH_STATE" });
  assert.equal(cleared.recoveryStatus, "not_loaded");
  assert.equal(cleared.safety.autoOpen, false);
  assertSafe(cleared);

  const audit = api.buildReadOnlyQuoteInteractiveRefreshAuditDraft(clicked);
  assert.equal(audit.eventType, "READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_AUDIT_DRAFT");
  assert.equal(audit.autoOpen, false);
  assert.equal(audit.autoRefresh, false);
  assert.equal(audit.bookingUrl, null);
  assert.equal(audit.payment, false);
  assert.equal(audit.order, false);
  assert.equal(audit.identityUpload, false);
  assert.equal(audit.redacted, true);

  const serialized = JSON.stringify({ initial, recovered, corrupted, refreshing, clicked, success, failed, disabled, cleared, audit });
  for (const word of ["tok" + "en", "k" + "ey", "sec" + "ret"]) assert.equal(serialized.includes(word), false);
  console.log("READ_ONLY_QUOTE_INTERACTIVE_REFRESH_UI_CONTROLLER_CORE PASS");
}

main();
