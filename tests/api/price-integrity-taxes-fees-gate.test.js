const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

const windowRef = loadRendererCore(["apps/desktop/src/renderer/core/priceIntegrityTaxesFeesGate.js"]);
const api = windowRef.WeishanPriceIntegrityTaxesFeesGateV1;

function main() {
  assert.equal(api.PRICE_INTEGRITY_TAXES_FEES_GATE_V1_VERSION, "2.1.61");

  const draft = api.buildPriceIntegrityTaxesFeesGateV1Draft();
  assert.equal(draft.gateName, "price_integrity_taxes_fees_gate_v1");
  assert.equal(draft.status, "price integrity validation only");
  assert.equal(draft.schemaVersion, "price_integrity_v1");
  assert.equal(draft.requiredFields.includes("currency"), true);
  assert.equal(draft.requiredFields.includes("taxIncluded"), true);
  assert.equal(draft.requiredFields.includes("feesIncluded"), true);
  assert.equal(draft.requiredFields.includes("shippingIncluded"), true);
  assert.equal(draft.requiredFields.includes("readonlyEvidence"), true);
  assert.equal(draft.blockedRules.some((line) => line.includes("fake/mock/demo/AI/estimated")), true);
  assert.equal(draft.blockedRules.some((line) => line.includes("bookingUrl/payment/order/checkout")), true);
  assert.equal(draft.auditDraft.eventType, "PRICE_INTEGRITY_TAXES_FEES_GATE_V1_DRAFT");
  assert.equal(draft.auditDraft.redacted, true);

  const passCandidate = api.buildSandboxVerifiedPriceCandidate();
  const pass = api.validatePriceIntegrityTaxesFees(passCandidate);
  assert.equal(pass.validationDecision, "pass");
  assert.equal(pass.displayEligibility, "eligible_for_guarded_display");
  assert.equal(pass.taxFeeCompleteness, "complete");
  assert.equal(pass.shippingCompleteness, "complete");
  assert.equal(pass.inventoryReliability, "provider_reported");
  assert.equal(pass.auditDraft.priceDisplayedCount, 1);
  assert.equal(api.assertPriceIntegrityTaxesFeesGateV1Safe(pass), true);

  const withheld = api.validatePriceIntegrityTaxesFees(api.buildSandboxVerifiedPriceCandidate({
    quoteType: "provider_readonly_price",
    currency: "",
    readonlyEvidence: ""
  }));
  assert.equal(withheld.validationDecision, "withheld");
  assert.equal(withheld.withheldReasons.includes("missing required fields"), true);
  assert.equal(withheld.withheldReasons.includes("missing or invalid currency"), true);
  assert.equal(withheld.withheldReasons.includes("real credential not connected"), true);
  assert.equal(withheld.withheldReasons.includes("manual provider review pending"), true);

  for (const quoteType of ["ai_estimate", "mock_price", "demo_price", "fake_price", "public_search_snippet_price"]) {
    const blocked = api.validatePriceIntegrityTaxesFees(api.buildSandboxVerifiedPriceCandidate({ quoteType, total:"estimated price" }));
    assert.equal(blocked.validationDecision, "blocked");
    assert.equal(blocked.blockedReasons.includes("fake/mock/demo/AI/estimated price blocked"), true);
  }

  const bookingBlocked = api.validatePriceIntegrityTaxesFees(api.buildSandboxVerifiedPriceCandidate({
    bookingUrl: "https://provider-sandbox.invalid/book",
    paymentUrl: "https://provider-sandbox.invalid/pay",
    orderUrl: "https://provider-sandbox.invalid/order"
  }));
  assert.equal(bookingBlocked.validationDecision, "blocked");
  assert.equal(bookingBlocked.blockedReasons.includes("bookingUrl/payment/order/checkout/identity field present"), true);
  assert.equal(bookingBlocked.auditDraft.bookingUrlBlockedCount, 1);
  assert.equal(bookingBlocked.auditDraft.paymentFieldBlockedCount, 1);
  assert.equal(bookingBlocked.auditDraft.orderFieldBlockedCount, 1);

  console.log("PRICE_INTEGRITY_TAXES_FEES_GATE_V1_CORE PASS");
}

main();
