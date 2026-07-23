const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/providerCredentialReadinessPanel.js",
    "apps/desktop/src/renderer/core/singleFlightProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/realFlightPriceProviderAdapterSlot.js"
  ]);
  const api = windowRef.WeishanRealFlightPriceProviderAdapterSlot;
  assert.equal(api.REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_VERSION, "4.2.8");

  const slot = api.getRealFlightPriceProviderAdapterSlotStatus();
  assert.equal(slot.slotName, "real_flight_price_provider_adapter_slot_v1");
  assert.equal(slot.providerMode, "fixture");
  assert.equal(slot.status, "allowed");
  assert.equal(slot.providerConnector.status, "fixture_ready");
  assert.equal(slot.networkAllowed, false);
  assert.equal(slot.bookingUrl, null);
  assert.equal(slot.autoOpen, false);

  const quote = api.fetchRealFlightPriceReadOnlyQuote({ origin:"上海", destination:"成都", departureDate:"2026-07-15", directOnly:true });
  assert.equal(quote.providerMode, "fixture");
  assert.equal(quote.fareSource, "fixture_read_only");
  assert.equal(quote.handoffType, "registry_gate_required");
  assert.equal(quote.totalPrice, 1010);
  assert.equal(quote.bookingUrl, null);
  assert.equal(quote.checkoutUrl, null);
  assert.equal(quote.paymentUrl, null);
  assert.equal(quote.orderUrl, null);
  assert.equal(quote.booking, false);
  assert.equal(quote.payment, false);
  assert.equal(quote.order, false);
  assert.equal(quote.identityUpload, false);
  assert.equal(Object.prototype.hasOwnProperty.call(quote, "safeProviderHandoffUrl"), false);

  const sandboxSlot = api.getRealFlightPriceProviderAdapterSlotStatus({ providerId:"google_flights_search", providerMode:"sandbox_read_only", sandboxDryRunEnabled:true, hasSecureCredentialReference:true });
  assert.equal(sandboxSlot.providerMode, "sandbox_read_only");
  assert.equal(sandboxSlot.status, "allowed");
  assert.equal(sandboxSlot.providerConnector.status, "sandbox_ready");
  assert.equal(sandboxSlot.networkAllowed, false);

  const productionSlot = api.getRealFlightPriceProviderAdapterSlotStatus({ providerId:"google_flights_search", providerMode:"production" });
  assert.equal(productionSlot.providerMode, "production_disabled");
  assert.equal(productionSlot.status, "disabled");
  assert.equal(productionSlot.providerConnector.productionProviderEnabled, false);

  assert.equal(api.assertRealFlightPriceProviderAdapterSlotSafe(slot), true);
  assert.equal(JSON.stringify(quote).includes("https://www.google.com/travel/flights"), false);
  console.log("REAL_FLIGHT_PRICE_PROVIDER_ADAPTER_SLOT_CORE PASS");
}

main();
