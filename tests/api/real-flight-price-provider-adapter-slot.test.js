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
    "apps/desktop/src/renderer/core/realFlightPriceProviderAdapterSlot.js"
  ]);
  const api = windowRef.WeishanRealFlightPriceProviderAdapterSlot;

  assert.equal(api.REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION, "2.1.43");

  const slot = api.getRealFlightPriceProviderAdapterSlotStatus();
  assert.equal(slot.slotName, "real_flight_price_provider_adapter_slot_v1");
  assert.equal(slot.providerMode, "fixture");
  assert.equal(slot.status, "allowed");
  assert.equal(slot.readOnly, true);
  assert.equal(slot.networkAllowed, false);
  assert.equal(slot.booking, false);
  assert.equal(slot.payment, false);
  assert.equal(slot.order, false);
  assert.equal(slot.identityUpload, false);
  assert.equal(slot.redacted, true);

  const quote = api.fetchRealFlightPriceReadOnlyQuote({
    origin: "上海",
    destination: "成都",
    departureDate: "2026-07-15",
    tripType: "one_way",
    passengerCount: 1,
    cabinClass: "economy",
    directOnly: true,
    sortIntent: "低价优先"
  });
  assert.equal(quote.providerId, "real_flight_fixture");
  assert.equal(quote.providerName, "Real Flight Fixture");
  assert.equal(quote.providerMode, "fixture");
  assert.equal(quote.fareSource, "fixture_read_only");
  assert.equal(quote.route, "上海 -> 成都");
  assert.equal(quote.departureDate, "2026-07-15");
  assert.equal(quote.currency, "CNY");
  assert.equal(quote.baseFare, 860);
  assert.equal(quote.taxesAndFees, 110);
  assert.equal(quote.providerFees, 40);
  assert.equal(quote.totalPrice, 1010);
  assert.equal(quote.priceUpdatedAt, "2026-06-20T00:00:00.000Z");
  assert.equal(quote.freshnessMinutes, 120);
  assert.equal(quote.freshnessStatus, "fresh");
  assert.equal(quote.taxFeeIntegrityStatus, "complete");
  assert.equal(quote.bookingUrl, null);
  assert.equal(quote.checkoutUrl, null);
  assert.equal(quote.paymentUrl, null);
  assert.equal(quote.orderUrl, null);
  assert.equal(quote.booking, false);
  assert.equal(quote.payment, false);
  assert.equal(quote.order, false);
  assert.equal(quote.identityUpload, false);
  assert.equal(quote.redacted, true);
  assert.equal(quote.handoffCandidate.providerConfirmationLink, "confirmation_required");
  assert.equal(quote.handoffCandidate.safeProviderHandoffUrl.startsWith("https://www.google.com/travel/flights"), true);

  const sandboxSlot = api.getRealFlightPriceProviderAdapterSlotStatus({ providerMode: "sandbox", dryRunEnabled: true, hasSecureCredentialReference: true });
  assert.equal(sandboxSlot.providerMode, "sandbox");
  assert.equal(sandboxSlot.status, "allowed");

  assert.equal(api.assertRealFlightPriceProviderAdapterSlotSafe(slot), true);

  const serialized = JSON.stringify(quote);
  assert.equal(serialized.includes("bookingUrl\":null"), true);
  assert.equal(serialized.includes("checkoutUrl\":null"), true);
  assert.equal(serialized.includes("paymentUrl\":null"), true);
  assert.equal(serialized.includes("orderUrl\":null"), true);
  assert.equal(serialized.includes("token"), false);
  assert.equal(serialized.includes("apiKey"), false);
  assert.equal(serialized.includes("secret"), false);

  console.log("REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_CORE PASS");
}

main();
