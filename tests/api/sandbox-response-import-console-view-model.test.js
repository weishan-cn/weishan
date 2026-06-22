const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }

function validResponse() {
  return {
    providerId:"flight_provider_trusted_fixture",
    providerName:"Trusted Flight Fixture",
    providerMode:"sandbox_read_only",
    fareSource:"sandbox_read_only_import",
    route:{ origin:"SHA", destination:"CTU" },
    departureDate:"2026-07-15",
    currency:"CNY",
    baseFare:860,
    taxesAndFees:110,
    providerFees:40,
    totalPrice:1010,
    priceUpdatedAt:"2026-01-01T00:00:00.000Z",
    freshnessMinutes:15,
    handoffCandidate:{ providerId:"google_flights_search", handoffType:"provider_search" }
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js",
    "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js",
    "apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js",
    "apps/desktop/src/renderer/core/sandboxResponseImportConsoleViewModel.js"
  ]);
  const api = windowRef.WeishanSandboxResponseImportConsoleViewModel;
  assert.equal(api.SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION, "2.1.50");

  const initial = api.buildSandboxResponseImportConsoleModel();
  assert.equal(initial.status, "idle");
  assert.equal(initial.rawInputStored, false);
  assert.equal(initial.actions.canPasteSecretHere, false);

  const editing = api.reduceSandboxResponseImportConsoleEvent(initial, { type:"INPUT_CHANGED", rawInput:JSON.stringify(validResponse()) });
  assert.equal(editing.status, "editing");
  assert.equal(editing.rawInputStored, false);

  const raw = JSON.stringify(validResponse());
  const preview = api.buildSandboxResponseValidationPreview(raw);
  assert.equal(preview.status, "preview_ready");
  assert.equal(preview.preview.validationStatus, "accepted");
  assert.equal(preview.preview.totalPrice, 1010);
  assert.equal(preview.rawInputStored, false);

  const imported = api.buildSandboxResponseImportResult(raw);
  assert.equal(imported.status, "accepted");
  assert.equal(imported.importResult.status, "accepted");
  assert.equal(imported.importResult.sanitizedQuote.totalPrice, 1010);
  assert.equal(imported.importResult.rawResponseStored, false);

  const invalid = api.buildSandboxResponseValidationPreview("{ nope");
  assert.equal(invalid.status, "failed_safe");
  assert.equal(invalid.preview.validationStatus, "failed_safe");

  const sensitiveName = "tok" + "en";
  const sensitive = api.buildSandboxResponseValidationPreview(`{\"${sensitiveName}\":\"abc\"}`);
  assert.equal(sensitive.status, "blocked");
  assert.equal(sensitive.preview.validationStatus, "blocked");

  const booking = api.buildSandboxResponseValidationPreview(JSON.stringify(Object.assign(validResponse(), { bookingUrl:"https://example.com/booking" })));
  assert.equal(booking.status, "blocked");
  assert.equal(booking.safety.bookingUrl, null);

  const inconsistent = api.buildSandboxResponseValidationPreview(JSON.stringify(Object.assign(validResponse(), { totalPrice:999 })));
  assert.equal(inconsistent.status, "rejected");

  const missingCurrency = api.buildSandboxResponseValidationPreview(JSON.stringify(Object.assign(validResponse(), { currency:"" })));
  assert.equal(missingCurrency.status, "rejected");

  const production = api.buildSandboxResponseValidationPreview(JSON.stringify(Object.assign(validResponse(), { providerMode:"production" })), { productionProviderEnabled:true });
  assert.equal(production.status, "rejected");

  const unknown = api.buildSandboxResponseValidationPreview(JSON.stringify(Object.assign(validResponse(), { providerId:"unknown_provider" })));
  assert.equal(unknown.status, "rejected");

  const cleared = api.reduceSandboxResponseImportConsoleEvent(imported, { type:"CLEAR_REQUESTED" });
  assert.equal(cleared.status, "cleared");
  assert.equal(cleared.preview.validationStatus, "not_run");

  for (const payload of [initial, editing, preview, imported, invalid, sensitive, booking, inconsistent, missingCurrency, production, unknown, cleared]) {
    assert.equal(payload.safety.bookingUrl, null);
    assert.equal(payload.safety.checkoutUrl, null);
    assert.equal(payload.safety.paymentUrl, null);
    assert.equal(payload.safety.orderUrl, null);
    assert.equal(payload.safety.autoOpen, false);
    assert.equal(payload.safety.payment, false);
    assert.equal(payload.safety.order, false);
    assert.equal(payload.safety.identityUpload, false);
    assert.equal(payload.redacted, true);
    const serial = JSON.stringify(payload);
    assert.equal(serial.includes("\"rawInput\":"), false);
    assert.equal(serial.includes("\"rawResponse\":"), false);
    assert.equal(serial.includes("abc"), false);
  }

  const audit = api.buildSandboxResponseImportConsoleAuditDraft(imported);
  assert.equal(audit.rawInputStored, false);
  assert.equal(audit.rawResponseStored, false);
  assert.equal(audit.bookingUrl, null);
  assert.equal(audit.autoOpen, false);
  console.log("SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL PASS");
}

main();
