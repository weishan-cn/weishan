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
  const windowRef = load(["apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js"]);
  const api = windowRef.WeishanRealFlightPriceReadOnlyProviderContract;

  assert.equal(api.REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_VERSION, "4.0.6");

  const contract = api.getRealFlightPriceReadOnlyProviderContract();
  assert.equal(contract.contractName, "real_flight_price_read_only_provider_contract_v1");
  assert.equal(contract.appVersion, "4.0.6");
  assert.equal(contract.mode, "read_only");
  assert.equal(contract.readOnly, true);
  assert.equal(contract.capabilities.searchFlights, true);
  assert.equal(contract.capabilities.readPrice, true);
  assert.equal(contract.capabilities.readTaxesAndFees, true);
  assert.equal(contract.capabilities.readFreshness, true);
  assert.equal(contract.capabilities.booking, false);
  assert.equal(contract.capabilities.payment, false);
  assert.equal(contract.capabilities.order, false);
  assert.equal(contract.capabilities.identityUpload, false);
  assert.equal(contract.redacted, true);

  const valid = api.validateRealFlightPriceProviderResponse({
    providerId: "real_flight_fixture",
    providerName: "Real Flight Fixture",
    route: "SHA/PVG -> CTU/TFU",
    departureDate: "2026-07-15",
    currency: "CNY",
    baseFare: 860,
    taxesAndFees: 110,
    providerFees: 40,
    totalPrice: 1010,
    priceUpdatedAt: "2026-06-20T00:00:00.000Z",
    fareSource: "fixture_read_only",
    handoffCandidate: { safeProviderHandoffUrl: "https://www.google.com/travel/flights", redacted: true },
    redacted: true
  });
  assert.equal(valid.validationDecision, "pass");
  assert.equal(valid.totalMatchesBreakdown, true);
  assert.equal(valid.capabilities.booking, false);
  assert.equal(valid.capabilities.payment, false);
  assert.equal(valid.capabilities.order, false);
  assert.equal(valid.capabilities.identityUpload, false);

  const blocked = api.validateRealFlightPriceProviderResponse({
    providerId: "real_flight_fixture",
    providerName: "Real Flight Fixture",
    route: "SHA/PVG -> CTU/TFU",
    departureDate: "2026-07-15",
    currency: "CNY",
    baseFare: 860,
    taxesAndFees: 110,
    providerFees: 40,
    totalPrice: 1010,
    priceUpdatedAt: "2026-06-20T00:00:00.000Z",
    fareSource: "fixture_read_only",
    handoffCandidate: { safeProviderHandoffUrl: "https://www.google.com/travel/flights", redacted: true },
    bookingUrl: "https://evil.example/book",
    token: "demo-token",
    apiKey: "demo-key",
    credentialValue: "demo-credential",
    redacted: true
  });
  assert.equal(blocked.validationDecision, "blocked");
  assert.equal(blocked.forbiddenFieldsPresent.includes("bookingUrl"), true);
  assert.equal(blocked.forbiddenFieldsPresent.includes("token"), true);
  assert.equal(blocked.forbiddenFieldsPresent.includes("apiKey"), true);
  assert.equal(blocked.forbiddenFieldsPresent.includes("credentialValue"), true);

  const audit = api.buildRealFlightPriceProviderContractAuditDraft(valid);
  assert.equal(audit.eventType, "REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_DRAFT");
  assert.equal(audit.appVersion, "4.0.6");
  assert.equal(audit.readOnly, true);
  assert.equal(audit.bookingDisplayedCount, 0);
  assert.equal(audit.paymentDisplayedCount, 0);
  assert.equal(audit.orderDisplayedCount, 0);
  assert.equal(audit.identityUploadDisplayedCount, 0);
  assert.equal(audit.rawTokenDisplayedCount, 0);
  assert.equal(audit.rawApiKeyDisplayedCount, 0);
  assert.equal(audit.redacted, true);

  assert.equal(api.assertRealFlightPriceReadOnlyProviderContractSafe(contract), true);
  assert.equal(JSON.stringify(contract).includes("bookingUrl"), true);
  assert.equal(JSON.stringify(contract).includes("apiKey"), true);

  console.log("REAL_FLIGHT_PRICE_READ_ONLY_PROVIDER_CONTRACT_CORE PASS");
}

main();
