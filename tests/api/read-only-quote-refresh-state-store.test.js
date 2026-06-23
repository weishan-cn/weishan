const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function memoryStorage() { const data = new Map(); return { getItem:(name) => data.has(name) ? data.get(name) : null, setItem:(name, value) => data.set(name, String(value)), removeItem:(name) => data.delete(name) }; }
function assertSafe(state) {
  assert.equal(state.stateName, "read_only_quote_refresh_state_v1");
  assert.equal(state.appVersion, "2.1.74");
  assert.equal(state.showableAsRealPrice, false);
  assert.equal(state.canReplaceMainResultCard, false);
  assert.equal(state.bookingUrl, null);
  assert.equal(state.checkoutUrl, null);
  assert.equal(state.paymentUrl, null);
  assert.equal(state.orderUrl, null);
  assert.equal(state.autoOpen, false);
  assert.equal(state.payment, false);
  assert.equal(state.order, false);
  assert.equal(state.identityUpload, false);
  assert.equal(state.redacted, true);
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteRefreshStateStore.js"]);
  const api = windowRef.WeishanReadOnlyQuoteRefreshStateStore;
  assert.equal(api.READ_ONLY_QUOTE_REFRESH_STATE_STORE_VERSION, "2.1.74");
  assert.equal(api.STORAGE_KEY, "weishan.readOnlyQuoteRefreshState.v1");

  const unsafe = api.sanitizeReadOnlyQuoteRefreshState({
    lastRefreshStatus:"refreshed",
    providerId:"google_flights_search",
    providerName:"Google Flights",
    providerMode:"sandbox_read_only",
    priceQuote:{ currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, freshnessStatus:"fresh", taxFeeIntegrityStatus:"complete" },
    handoff:{ safeProviderHandoffReady:true, safeProviderHandoffDisplayHost:"google.com", bookingUrl:"https://bad.example" },
    rawProviderResponse:{ nested:true },
    rawCredentialReference:"hidden",
    apiToken:"hidden",
    password:"hidden",
    sessionAuth:"hidden",
    identityDocument:"hidden",
    bankCard:"hidden",
    bookingUrl:"https://bad.example",
    checkoutUrl:"https://bad.example",
    paymentUrl:"https://bad.example",
    orderUrl:"https://bad.example",
    autoOpen:true,
    payment:true,
    order:true,
    identityUpload:true
  });
  assertSafe(unsafe);
  assert.equal(unsafe.lastRefreshStatus, "refreshed");
  assert.equal(unsafe.showableAsCandidateEvidence, false);
  assert.equal(unsafe.providerMode, "sandbox_read_only");
  assert.equal(unsafe.totalPrice, 1010);
  const serialized = JSON.stringify(unsafe);
  for (const word of ["apiToken", "password", "sessionAuth", "rawProviderResponse", "rawCredentialReference", "bankCard"]) assert.equal(serialized.includes(word), false);

  const storage = memoryStorage();
  assert.equal(api.buildReadOnlyQuoteRefreshStorageHealth(storage).status, "empty");
  const saved = api.saveReadOnlyQuoteRefreshState({ lastRefreshStatus:"failed_safe", providerMode:"fixture", showableAsCandidateEvidence:true }, storage);
  assertSafe(saved);
  assert.equal(saved.lastRefreshStatus, "failed_safe");
  assert.equal(api.buildReadOnlyQuoteRefreshStorageHealth(storage).status, "healthy");
  assert.equal(api.validateReadOnlyQuoteRefreshStoredState(saved).valid, true);
  const loaded = api.loadReadOnlyQuoteRefreshState(storage);
  assert.equal(loaded.lastRefreshStatus, "failed_safe");
  assert.equal(loaded.showableAsCandidateEvidence, true);
  const summary = api.buildReadOnlyQuoteRefreshStateSummary(loaded);
  assert.equal(summary.summary, "最近一次刷新：安全失败");
  assert.equal(summary.showableAsRealPrice, false);
  assert.equal(summary.bookingUrl, null);

  storage.setItem(api.STORAGE_KEY, "{bad json");
  assert.equal(api.buildReadOnlyQuoteRefreshStorageHealth(storage).status, "corrupted");
  assert.equal(api.loadReadOnlyQuoteRefreshState(storage).lastRefreshStatus, "not_run");
  storage.setItem(api.STORAGE_KEY, JSON.stringify({ stateName:"old_state", appVersion:"0.0.1", lastRefreshStatus:"refreshed", showableAsCandidateEvidence:true }));
  assert.equal(api.buildReadOnlyQuoteRefreshStorageHealth(storage).status, "schema_mismatch");
  assert.equal(api.loadReadOnlyQuoteRefreshState(storage).lastRefreshStatus, "not_run");
  assert.equal(api.migrateReadOnlyQuoteRefreshStateIfNeeded({ stateName:"old_state", appVersion:"0.0.1", lastRefreshStatus:"refreshed" }).lastRefreshStatus, "not_run");
  const store = api.createReadOnlyQuoteRefreshStateStore(storage);
  store.save({ lastRefreshStatus:"disabled" });
  assert.equal(store.load().lastRefreshStatus, "disabled");
  assert.equal(store.health().status, "healthy");
  assert.equal(store.clear().lastRefreshStatus, "not_run");
  console.log("READ_ONLY_QUOTE_REFRESH_STATE_STORE_CORE PASS");
}

main();
