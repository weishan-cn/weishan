const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/multiProviderSandboxAdapterRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/providerSandboxQuoteNormalizer.js"
  ]);
  const api = windowRef.WeishanProviderSandboxQuoteNormalizer;
  assert.equal(api.PROVIDER_SANDBOX_QUOTE_NORMALIZER_VERSION, "2.1.54");
  const normalized = api.normalizeProviderSandboxQuote({ providerId:"flight_provider_trusted_fixture", providerName:"Trusted Flight Fixture", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", route:{ origin:"SHA", destination:"CTU", display:"SHA → CTU" }, departureDate:"2026-07-15", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-01-01T00:00:00.000Z", freshnessMinutes:15, handoffCandidate:{ providerId:"google_flights_search", handoffType:"provider_search" } });
  assert.equal(normalized.status, "normalized");
  assert.equal(normalized.responseShape, "weishan_normalized_quote");
  assert.equal(normalized.rawResponseStored, false);
  assert.equal(normalized.bookingUrl, null);
  assert.equal(normalized.checkoutUrl, null);
  assert.equal(normalized.paymentUrl, null);
  assert.equal(normalized.orderUrl, null);
  const trip = api.normalizeProviderSandboxQuote({ providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:975 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } });
  assert.equal(trip.status, "normalized");
  assert.equal(trip.responseShape, "trip_com_stub_quote");
  assert.equal(trip.totalPrice, 975);
  const airline = api.normalizeProviderSandboxQuote({ providerId:"airline_official_sandbox_stub", providerName:"Airline Official Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", origin:"SHA", destination:"CTU", departOn:"2026-07-15", money:{ currency:"CNY", base:780, taxes:130, fees:20, grandTotal:930 }, updatedAt:"2026-01-01T00:00:00.000Z", freshnessMinutes:8, handoffCandidate:{ providerId:"airline_official_sandbox_stub", handoffType:"provider_search" } });
  assert.equal(airline.status, "normalized");
  assert.equal(airline.responseShape, "airline_official_stub_quote");
  assert.equal(airline.totalPrice, 930);
  const inconsistent = api.normalizeProviderSandboxQuote({ providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:974 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } });
  assert.equal(inconsistent.status, "rejected");
  const missingCurrency = api.normalizeProviderSandboxQuote({ providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"", fare:820, tax:120, serviceFee:35, total:975 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } });
  assert.equal(missingCurrency.status, "rejected");
  const missingDate = api.normalizeProviderSandboxQuote({ providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:975 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } });
  assert.equal(missingDate.status, "rejected");
  const unknown = api.normalizeProviderSandboxQuote({ providerId:"unknown_provider", providerName:"Unknown", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", route:{ origin:"SHA", destination:"CTU" }, departureDate:"2026-07-15", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-01-01T00:00:00.000Z", freshnessMinutes:15, handoffCandidate:{ providerId:"google_flights_search", handoffType:"provider_search" } });
  assert.equal(unknown.status, "blocked");
  const production = api.normalizeProviderSandboxQuote({ providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"production", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:975 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } }, { productionProviderEnabled:true });
  assert.equal(production.status, "blocked");
  const secret = api.normalizeProviderSandboxQuote(JSON.stringify({ token:"abc" }));
  assert.equal(secret.status, "blocked");
  const booking = api.normalizeProviderSandboxQuote(JSON.stringify({ providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:975 }, bookingUrl:"https://example.com" }));
  assert.equal(booking.status, "blocked");
  for (const item of [normalized, trip, airline, inconsistent, missingCurrency, missingDate, unknown, production, secret, booking]) {
    assert.equal(item.rawResponseStored, false);
    assert.equal(item.bookingUrl, null);
    assert.equal(item.checkoutUrl, null);
    assert.equal(item.paymentUrl, null);
    assert.equal(item.orderUrl, null);
    const serial = JSON.stringify(item);
    assert.equal(/token|key|secret/i.test(serial), false);
  }
  const audit = api.buildProviderSandboxQuoteNormalizerAuditDraft(normalized);
  assert.equal(audit.rawResponseStored, false);
  console.log("PROVIDER_SANDBOX_QUOTE_NORMALIZER PASS");
}
main();
