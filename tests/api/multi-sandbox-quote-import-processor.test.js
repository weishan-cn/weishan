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
    "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js",
    "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js",
    "apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js",
    "apps/desktop/src/renderer/core/providerSandboxQuoteNormalizer.js",
    "apps/desktop/src/renderer/core/multiSandboxQuoteImportProcessor.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateRanking.js"
  ]);
  const api = windowRef.WeishanMultiSandboxQuoteImportProcessor;
  assert.equal(api.MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR_VERSION, "2.1.94");
  const mixed = api.importMultiSandboxQuotes(JSON.stringify([
    { providerId:"flight_provider_trusted_fixture", providerName:"Trusted Flight Fixture", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", route:{ origin:"SHA", destination:"CTU" }, departureDate:"2026-07-15", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-01-01T00:00:00.000Z", freshnessMinutes:15, handoffCandidate:{ providerId:"google_flights_search", handoffType:"provider_search" } },
    { providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:975 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } },
    { providerId:"airline_official_sandbox_stub", providerName:"Airline Official Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", origin:"SHA", destination:"CTU", departOn:"2026-07-15", money:{ currency:"CNY", base:780, taxes:130, fees:20, grandTotal:930 }, updatedAt:"2026-01-01T00:00:00.000Z", freshnessMinutes:8, handoffCandidate:{ providerId:"airline_official_sandbox_stub", handoffType:"provider_search" } }
  ]));
  assert.equal(mixed.status, "accepted");
  assert.equal(mixed.totalInputCount, 3);
  assert.equal(mixed.acceptedCount, 3);
  assert.equal(mixed.rejectedCount, 0);
  assert.equal(mixed.blockedCount, 0);
  assert.equal(mixed.sourceBreakdown.providerCount, 3);
  assert.equal(JSON.stringify(mixed.sourceBreakdown.providerIds), JSON.stringify(["flight_provider_trusted_fixture", "trip_com_sandbox_stub", "airline_official_sandbox_stub"]));
  assert.equal(JSON.stringify(mixed.sourceBreakdown.fareSources), JSON.stringify(["sandbox_read_only_import"]));
  assert.equal(mixed.quotes[0].responseShape, "weishan_normalized_quote");
  assert.equal(mixed.quotes[1].responseShape, "trip_com_stub_quote");
  assert.equal(mixed.quotes[2].responseShape, "airline_official_stub_quote");
  const ranking = windowRef.WeishanReadOnlyQuoteCandidateRanking.buildTopReadOnlyQuoteCandidates(mixed.quotes, { rankingScope:"imported_sandbox_quotes_only" });
  assert.equal(ranking.sourceBreakdown.providerCount, 3);
  assert.equal(ranking.rankingExplanation, "仅按导入样本中的只读候选证据排序，平台最终为准。");
  assert.equal(JSON.stringify(ranking.topCandidates.map((item) => item.quoteId)), JSON.stringify([mixed.quotes[2].quoteId, mixed.quotes[1].quoteId, mixed.quotes[0].quoteId]));
  assert.equal(ranking.topCandidates[0].providerName, "Airline Official Sandbox Stub");
  assert.equal(ranking.topCandidates[0].responseShape, "airline_official_stub_quote");
  assert.equal(ranking.topCandidates[0].safeProviderHandoffReady, true);
  assert.equal(ranking.topCandidates[0].bookingUrl, null);
  const partial = api.importMultiSandboxQuotes(JSON.stringify([
    { providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:975 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } },
    { providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:974 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } }
  ]));
  assert.equal(partial.status, "partial");
  assert.equal(partial.acceptedCount, 1);
  assert.equal(partial.rejectedCount + partial.blockedCount, 1);
  const blocked = api.importMultiSandboxQuotes(JSON.stringify([{ token:"abc" }]));
  assert.equal(blocked.status, "blocked");
  const serial = JSON.stringify([mixed, partial, blocked]);
  assert.equal(serial.includes("\"rawInput\":"), false);
  assert.equal(serial.includes("\"rawResponse\":"), false);
  assert.equal(/token|key|secret/i.test(serial), false);
  for (const payload of [mixed, partial, blocked]) {
    assert.equal(payload.rawResponseStored, false);
    for (const item of payload.quotes || []) {
      assert.equal(item.rawResponseStored, false);
      assert.equal(item.bookingUrl, null);
      assert.equal(item.checkoutUrl, null);
      assert.equal(item.paymentUrl, null);
      assert.equal(item.orderUrl, null);
      assert.equal(item.responseShape ? true : false, true);
    }
  }
  const audit = api.buildMultiSandboxQuoteImportAuditDraft(mixed);
  assert.equal(audit.rawResponseStored, false);
  assert.equal(audit.bookingUrl, null);
  console.log("MULTI_SANDBOX_QUOTE_IMPORT_PROCESSOR PASS");
}
main();
