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

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/priceIntegrityTaxesFeesGate.js",
  "apps/desktop/src/renderer/core/realPriceDisplayGate.js"
]);
const priceApi = windowRef.WeishanPriceIntegrityTaxesFeesGateV1;
const displayApi = windowRef.WeishanRealPriceDisplayGate;

function main() {
  assert.equal(displayApi.REAL_PRICE_DISPLAY_GATE_VERSION, "2.1.90");

  const draft = displayApi.buildRealPriceDisplayGateDraft();
  assert.equal(draft.gateName, "real_price_display_gate");
  assert.equal(draft.status, "guarded real price display only");
  assert.equal(draft.sandboxTestPriceDisplay, "guarded only");
  assert.equal(draft.productionPriceDisplay, "disabled");
  assert.equal(draft.ordinaryResultDisplay, "guarded card only");
  assert.equal(draft.bookingUrl, "disabled");
  assert.equal(draft.payment, "disabled");
  assert.equal(draft.order, "disabled");
  assert.equal(draft.identityUpload, "disabled");
  assert.equal(draft.requiredBadges.includes("来源平台"), true);
  assert.equal(draft.requiredBadges.includes("最终以平台页面为准"), true);
  assert.equal(draft.auditDraft.eventType, "REAL_PRICE_DISPLAY_GATE_DRAFT");
  assert.equal(draft.auditDraft.productionPriceDisplayedCount, 0);
  assert.equal(draft.auditDraft.bookingUrlDisplayedCount, 0);

  const candidate = priceApi.buildSandboxVerifiedPriceCandidate();
  const integrity = priceApi.validatePriceIntegrityTaxesFees(candidate);
  const ordinary = displayApi.evaluateRealPriceDisplay({ candidate, priceIntegrityValidation:integrity, displaySurface:"ordinary_result_card" });
  assert.equal(ordinary.displayDecision, "allow_guarded_price_card");
  assert.equal(ordinary.requiredBadgesPresent, true);
  assert.equal(ordinary.finalPageDisclaimerPresent, true);
  assert.equal(ordinary.auditDraft.guardedPriceCardDisplayedCount, 1);
  assert.equal(ordinary.auditDraft.productionPriceDisplayedCount, 0);
  assert.equal(ordinary.auditDraft.bookingUrlDisplayedCount, 0);
  assert.equal(displayApi.assertRealPriceDisplayGateSafe(ordinary), true);

  const card = displayApi.buildGuardedPriceCard(candidate, ordinary);
  assert.equal(card.visible, true);
  assert.equal(card.title, "已验证真实价格");
  assert.equal(card.providerName, "Flight Provider Sandbox");
  assert.equal(card.currency, "CNY");
  assert.equal(card.total, 1010);
  assert.equal(card.forbiddenActions.includes("bookingUrl"), true);
  assert.equal(card.forbiddenActions.includes("payment"), true);
  assert.equal(card.forbiddenActions.includes("order"), true);

  const withheldCandidate = priceApi.buildSandboxVerifiedPriceCandidate({ quoteType:"provider_readonly_price" });
  const withheldIntegrity = priceApi.validatePriceIntegrityTaxesFees(withheldCandidate);
  const withheld = displayApi.evaluateRealPriceDisplay({ candidate:withheldCandidate, priceIntegrityValidation:withheldIntegrity, displaySurface:"ordinary_result_card" });
  assert.equal(withheld.displayDecision, "withheld");
  assert.equal(withheld.withheldReasons.includes("real credential not connected"), true);
  assert.equal(displayApi.buildGuardedPriceCard(withheldCandidate, withheld).visible, false);

  const blockedCandidate = priceApi.buildSandboxVerifiedPriceCandidate({ quoteType:"fake_price", bookingUrl:"https://provider-sandbox.invalid/book" });
  const blockedIntegrity = priceApi.validatePriceIntegrityTaxesFees(blockedCandidate);
  const blocked = displayApi.evaluateRealPriceDisplay({ candidate:blockedCandidate, priceIntegrityValidation:blockedIntegrity, displaySurface:"ordinary_result_card" });
  assert.equal(blocked.displayDecision, "blocked");
  assert.equal(blocked.blockedReasons.includes("bookingUrl/payment/order/checkout/raw field present"), true);
  assert.equal(blocked.blockedReasons.includes("fake/mock/demo/AI/estimated price blocked"), true);

  console.log("REAL_PRICE_DISPLAY_GATE_CORE PASS");
}

main();
