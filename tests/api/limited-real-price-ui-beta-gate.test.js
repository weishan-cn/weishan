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
  "apps/desktop/src/renderer/core/manualProviderReviewWorkflowV1.js",
  "apps/desktop/src/renderer/core/limitedRealPriceUiBetaGate.js"
]);
const manualApi = windowRef.WeishanManualProviderReviewWorkflowV1;
const betaApi = windowRef.WeishanLimitedRealPriceUiBetaGate;
const priceApi = windowRef.WeishanPriceIntegrityTaxesFeesGateV1;

function main() {
  assert.equal(betaApi.LIMITED_REAL_PRICE_UI_BETA_GATE_VERSION, "2.2.2");
  assert.equal(JSON.stringify(betaApi.ALLOWED_CATEGORIES), JSON.stringify(["flight"]));
  assert.equal(JSON.stringify(betaApi.ALLOWED_PROVIDER_IDS), JSON.stringify(["flight_provider"]));
  assert.equal(betaApi.REQUIRED_BADGES.includes("Limited Beta"), true);
  assert.equal(betaApi.REQUIRED_BADGES.includes("不可付款"), true);
  assert.equal(betaApi.REQUIRED_BADGES.includes("最终以平台页面为准"), true);

  const draft = betaApi.buildLimitedRealPriceUiBetaGateDraft();
  assert.equal(draft.gateName, "limited_real_price_ui_beta_gate");
  assert.equal(draft.status, "limited beta only");
  assert.equal(draft.betaScope, "flight_only");
  assert.equal(draft.productBeta, "disabled");
  assert.equal(draft.hotelBeta, "disabled");
  assert.equal(draft.localServiceBeta, "disabled");
  assert.equal(draft.ticketActivityBeta, "disabled");
  assert.equal(draft.restrictedCategory, "blocked");
  assert.equal(draft.payment, "disabled");
  assert.equal(draft.order, "disabled");
  assert.equal(draft.bookingUrl, "disabled");
  assert.equal(draft.identityUpload, "disabled");
  assert.equal(draft.auditDraft.eventType, "LIMITED_REAL_PRICE_UI_BETA_GATE_DRAFT");
  assert.equal(draft.auditDraft.guardedBetaPriceDisplayedCount, 1);
  assert.equal(draft.auditDraft.productionPriceDisplayedCount, 0);
  assert.equal(draft.auditDraft.bookingUrlDisplayedCount, 0);
  assert.equal(draft.auditDraft.paymentAttemptCount, 0);
  assert.equal(draft.auditDraft.orderAttemptCount, 0);
  assert.equal(draft.auditDraft.identityUploadAttemptCount, 0);

  const candidate = betaApi.buildLimitedBetaFlightPriceCandidate();
  const manualProviderReview = manualApi.evaluateManualProviderReviewForBeta(manualApi.buildSampleFlightProviderReview());
  const priceIntegrityValidation = { validationDecision:"pass" };
  const allowed = betaApi.evaluateLimitedRealPriceUiBetaGate({
    candidate,
    manualProviderReview,
    priceIntegrityValidation,
    sourceLabelValidation:{ validationDecision:"pass" },
    schemaValidation:{ validationDecision:"pass" },
    displaySurface:"ordinary_result_card"
  });
  assert.equal(allowed.displayDecision, "allow_limited_beta_price_card");
  assert.equal(allowed.auditDraft.guardedBetaPriceDisplayedCount, 1);
  assert.equal(allowed.auditDraft.productionPriceDisplayedCount, 0);
  assert.equal(allowed.auditDraft.bookingUrlDisplayedCount, 0);

  const card = betaApi.buildLimitedBetaPriceCard(candidate, allowed);
  assert.equal(card.visible, true);
  assert.equal(card.title, "Limited Beta · 已验证只读价格");
  assert.equal(card.subtitle, "仅机票白名单 Beta · 不可下单 / 不可付款");
  assert.equal(card.providerManualReviewState, "approved_for_limited_beta");
  assert.equal(card.betaScope, "flight only");
  assert.equal(card.requiredBadges.includes("Limited Beta"), true);
  assert.equal(card.requiredBadges.includes("不可下单"), true);
  assert.equal(card.requiredBadges.includes("不可付款"), true);

  const missingReview = betaApi.evaluateLimitedRealPriceUiBetaGate({
    candidate,
    manualProviderReview:{ allowedForLimitedBeta:false, manualReviewState:"docs_pending" },
    priceIntegrityValidation,
    sourceLabelValidation:{ validationDecision:"pass" },
    schemaValidation:{ validationDecision:"pass" }
  });
  assert.equal(missingReview.displayDecision, "withheld");
  assert.equal(missingReview.withheldReasons.includes("Provider 人工审查未通过 / 未完成"), true);

  const product = betaApi.evaluateLimitedRealPriceUiBetaGate({
    candidate:betaApi.buildLimitedBetaFlightPriceCandidate({ providerId:"product_provider", providerCategory:"product" }),
    manualProviderReview,
    priceIntegrityValidation,
    sourceLabelValidation:{ validationDecision:"pass" },
    schemaValidation:{ validationDecision:"pass" }
  });
  assert.equal(product.displayDecision, "blocked");
  assert.equal(product.blockedReasons.includes("limited beta flight only"), true);

  const restricted = betaApi.evaluateLimitedRealPriceUiBetaGate({
    candidate:betaApi.buildLimitedBetaFlightPriceCandidate({ providerId:"restricted_provider", providerCategory:"restricted" }),
    manualProviderReview:{ allowedForLimitedBeta:false, manualReviewState:"blocked" },
    priceIntegrityValidation,
    sourceLabelValidation:{ validationDecision:"pass" },
    schemaValidation:{ validationDecision:"pass" }
  });
  assert.equal(restricted.displayDecision, "blocked");
  assert.equal(restricted.blockedReasons.includes("restricted category blocked"), true);

  const dangerous = betaApi.evaluateLimitedRealPriceUiBetaGate({
    candidate:betaApi.buildLimitedBetaFlightPriceCandidate({ bookingUrl:"https://provider.example/book" }),
    manualProviderReview,
    priceIntegrityValidation,
    sourceLabelValidation:{ validationDecision:"pass" },
    schemaValidation:{ validationDecision:"pass" }
  });
  assert.equal(dangerous.displayDecision, "blocked");
  assert.equal(dangerous.blockedReasons.includes("bookingUrl/payment/order/identity/raw payload present"), true);

  assert.equal(betaApi.assertLimitedRealPriceUiBetaGateSafe(draft), true);
  console.log("LIMITED_REAL_PRICE_UI_BETA_GATE_CORE PASS");
}

main();
