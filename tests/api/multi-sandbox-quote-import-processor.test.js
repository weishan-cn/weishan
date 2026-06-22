const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) {
  const window = {}; window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}
function quote(extra = {}) {
  return Object.assign({ providerId:"flight_provider_trusted_fixture", providerName:"Trusted Flight Fixture", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", route:{ origin:"SHA", destination:"CTU" }, departureDate:"2026-07-15", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-01-01T00:00:00.000Z", freshnessMinutes:15, handoffCandidate:{ providerId:"google_flights_search", handoffType:"provider_search" } }, extra);
}
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js",
    "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js",
    "apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js",
    "apps/desktop/src/renderer/core/multiSandboxQuoteImportProcessor.js"
  ]);
  const api = windowRef.WeishanMultiSandboxQuoteImportProcessor;
  assert.equal(api.MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION, "2.1.51");
  const single = api.importMultiSandboxQuotes(JSON.stringify(quote()));
  assert.equal(single.status, "accepted");
  assert.equal(single.totalInputCount, 1);
  assert.equal(single.acceptedCount, 1);
  const array = api.importMultiSandboxQuotes(JSON.stringify([quote({ quoteId:"q1" }), quote({ quoteId:"q2", baseFare:900, taxesAndFees:100, providerFees:20, totalPrice:1020 })]));
  assert.equal(array.status, "accepted");
  assert.equal(array.totalInputCount, 2);
  assert.equal(array.acceptedCount, 2);
  const sensitive = api.importMultiSandboxQuotes("{\"token\":\"abc-real-value\"}");
  assert.equal(sensitive.status, "blocked");
  const inconsistent = api.importMultiSandboxQuotes(JSON.stringify(quote({ totalPrice:999 })));
  assert.equal(inconsistent.status, "rejected");
  const missingCurrency = api.importMultiSandboxQuotes(JSON.stringify(quote({ currency:"" })));
  assert.equal(missingCurrency.status, "rejected");
  const transaction = api.importMultiSandboxQuotes(JSON.stringify(quote({ bookingUrl:"https://example.com/booking" })));
  assert.equal(transaction.status, "blocked");
  for (const payload of [single, array, sensitive, inconsistent, missingCurrency, transaction]) {
    assert.equal(payload.rawResponseStored, false);
    const serial = JSON.stringify(payload);
    assert.equal(serial.includes("\"rawInput\":"), false);
    assert.equal(serial.includes("\"rawResponse\":"), false);
    assert.equal(/token|key|secret/i.test(serial), false);
    assert.equal(serial.includes("abc-real-value"), false);
    for (const item of payload.quotes || []) {
      assert.equal(item.bookingUrl, null);
      assert.equal(item.checkoutUrl, null);
      assert.equal(item.paymentUrl, null);
      assert.equal(item.orderUrl, null);
    }
  }
  console.log("MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR PASS");
}
main();
