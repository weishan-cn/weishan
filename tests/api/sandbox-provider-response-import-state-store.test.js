const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function memoryStorage() { const data = new Map(); return { getItem:(name) => data.has(name) ? data.get(name) : null, setItem:(name, value) => data.set(name, String(value)), removeItem:(name) => data.delete(name) }; }

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/sandboxProviderResponseImportStateStore.js"]);
  const api = windowRef.WeishanSandboxProviderResponseImportStateStore;
  assert.equal(api.SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE_VERSION, "4.0.8");
  const storage = memoryStorage();
  const state = api.saveSandboxProviderResponseImportState({
    lastImportStatus:"accepted",
    normalizedQuote:{ providerId:"google_flights_search", providerName:"Google Flights", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-06-20T00:00:00.000Z" },
    rawResponse:{ should:"not persist" },
    apiKey:"redacted",
    bookingUrl:"https://example.com/booking",
    autoOpen:true
  }, storage);
  assert.equal(state.lastImportStatus, "accepted");
  assert.equal(state.importedEvidenceAvailable, true);
  assert.equal(state.rawResponseStored, false);
  assert.equal(state.bookingUrl, null);
  assert.equal(state.autoOpen, false);
  assert.equal("rawResponse" in state, false);
  assert.equal("apiKey" in state, false);
  const loaded = api.loadSandboxProviderResponseImportState(storage);
  assert.equal(loaded.totalPrice, 1010);
  assert.equal(loaded.showableAsRealPrice, false);
  assert.equal(loaded.canReplaceMainResultCard, false);
  const summary = api.buildSandboxProviderResponseImportStateSummary(loaded);
  assert.equal(summary.importStatusBadge, "只读沙盒导入证据");
  assert.equal(summary.importedEvidenceBanner.includes("导入响应已脱敏"), true);
  assert.equal(summary.rawResponseStored, false);
  storage.setItem(api.STORAGE_KEY, "not json");
  assert.equal(api.loadSandboxProviderResponseImportState(storage).lastImportStatus, "not_run");
  storage.setItem(api.STORAGE_KEY, JSON.stringify({ stateName:"other", appVersion:"0.0.0" }));
  assert.equal(api.loadSandboxProviderResponseImportState(storage).lastImportStatus, "not_run");
  assert.equal(api.clearSandboxProviderResponseImportState(storage).lastImportStatus, "not_run");
  console.log("SANDBOX_PROVIDER_RESPONSE_IMPORT_STATE_STORE PASS");
}
main();
