const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function memoryStorage() { const data = new Map(); return { getItem:(name) => data.has(name) ? data.get(name) : null, setItem:(name, value) => data.set(name, String(value)), removeItem:(name) => data.delete(name) }; }

function validResponse() {
  return {
    providerId:"google_flights_search",
    providerName:"Google Flights",
    route:{ origin:"上海", destination:"成都" },
    departureDate:"2026-07-15",
    currency:"CNY",
    baseFare:860,
    taxesAndFees:110,
    providerFees:40,
    totalPrice:1010,
    priceUpdatedAt:"2026-06-20T00:00:00.000Z",
    fareSource:"sandbox_read_only_import",
    handoffCandidate:{ providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", searchOnly:true, redacted:true }
  };
}
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js",
    "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js",
    "apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js"
  ]);
  const api = windowRef.WeishanSandboxProviderDryRunHarness;
  assert.equal(api.SANDBOX_PROVIDER_DRY_RUN_HARNESS_VERSION, "4.2.2");
  const status = api.buildSandboxProviderDryRunHarnessStatus();
  assert.equal(status.rawResponseStored, false);
  assert.equal(status.bookingUrl, null);
  assert.equal(status.autoOpen, false);

  const imported = api.importSandboxProviderReadOnlyResponse(validResponse());
  assert.equal(imported.status, "accepted");
  assert.equal(imported.normalizedQuote.fareSource, "sandbox_read_only_import");
  assert.equal(imported.normalizedQuote.totalPrice, 1010);
  assert.equal(imported.rawResponseStored, false);
  assert.equal(imported.bookingUrl, null);
  assert.equal(imported.autoOpen, false);
  assert.equal(imported.payment, false);
  assert.equal(imported.order, false);
  assert.equal(imported.identityUpload, false);

  const unknown = api.importSandboxProviderReadOnlyResponse(Object.assign(validResponse(), { providerId:"unknown_provider" }));
  assert.equal(unknown.importStatus, "rejected");
  assert.equal(unknown.normalizedQuote, null);

  const inconsistent = api.importSandboxProviderReadOnlyResponse(Object.assign(validResponse(), { totalPrice:999 }));
  assert.equal(inconsistent.importStatus, "rejected");

  const unsafeName = api.importSandboxProviderReadOnlyResponse(Object.assign(validResponse(), { apiKey:"redacted" }));
  assert.equal(unsafeName.importStatus, "blocked");
  assert.equal(unsafeName.rawResponseStored, false);

  const transactionUrl = api.importSandboxProviderReadOnlyResponse(Object.assign(validResponse(), { bookingUrl:"https://example.com/booking" }));
  assert.equal(transactionUrl.importStatus, "blocked");
  assert.equal(transactionUrl.bookingUrl, null);

  const missingCurrency = api.importSandboxProviderReadOnlyResponse(Object.assign(validResponse(), { currency:"" }));
  assert.equal(missingCurrency.importStatus, "rejected");

  const audit = api.buildSandboxProviderDryRunAuditDraft(imported);
  assert.equal(audit.showableAsRealPrice, false);
  assert.equal(audit.rawResponseStored, false);
  assert.equal(audit.bookingUrl, null);
  const serialized = JSON.stringify(imported);
  assert.equal(serialized.includes("checkoutUrl\\\":\\\""), false);
  console.log("SANDBOX_PROVIDER_DRY_RUN_HARNESS PASS");
}
main();
