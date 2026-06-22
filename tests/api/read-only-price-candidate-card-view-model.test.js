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
    "apps/desktop/src/renderer/core/readOnlyPriceCandidateCardViewModel.js"
  ]);
  const api = windowRef.WeishanReadOnlyPriceCandidateCardViewModel;
  const gateApi = windowRef.WeishanSafeProviderDeepLinkHandoffGate;
  const confirmationApi = windowRef.WeishanProviderConfirmationHandoffUi;

  assert.equal(api.READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION, "2.1.44");

  const card = api.buildReadOnlyPriceCandidateCardViewModel({
    task: { title: "7月15日上海到成都最便宜的机票", rawInput: "7月15日上海到成都最便宜的机票" },
    providerId: "google_flights_search",
    providerName: "Google Flights",
    providerType: "flight_search",
    report: { handoff: { safeProviderHandoffUrl: "https://www.google.com/travel/flights" } },
    flightFields: {
      origin: "上海",
      destination: "成都",
      dateDisplay: "7 月 15 日",
      goal: "低价优先",
      directPreference: "直达优先"
    }
  });

  assert.equal(card.visible, true);
  assert.equal(card.cardType, "read_only_price_candidate");
  assert.equal(card.title, "只读候选价");
  assert.equal(card.priceDisplay, "¥1010");
  assert.equal(card.priceTruthLabel, "只读候选价 · 平台最终为准 · 未锁价 · 不代表可出票");
  assert.equal(card.providerConfirmationRequired, true);
  assert.equal(card.noAutoOpen, true);
  assert.equal(card.noBookingUrl, true);
  assert.equal(card.noPayment, true);
  assert.equal(card.noOrder, true);
  assert.equal(card.noIdentityUpload, true);
  assert.equal(card.redacted, true);
  assert.equal(card.gate.status, "confirmation_required");
  assert.equal(card.confirmationUi.status, "confirmation_required");
  assert.equal(card.confirmationUi.continueButtonDisabled, false);
  assert.equal(card.confirmationUi.cancelButtonEnabled, true);
  assert.equal(card.audit.redacted, true);
  assert.equal(card.audit.safeProviderHandoffUrlDisplayedCount, 0);
  assert.equal(card.audit.bookingUrlDisplayedCount, 0);
  assert.equal(card.audit.paymentActionDisplayedCount, 0);
  assert.equal(card.audit.orderActionDisplayedCount, 0);
  assert.equal(card.audit.identityUploadAttemptCount, 0);

  const html = api.renderReadOnlyPriceCandidateCardHtml(card);
  assert.equal(html.includes("只读候选价"), true);
  assert.equal(html.includes("平台最终为准"), true);
  assert.equal(html.includes("未锁价"), true);
  assert.equal(html.includes("不代表可出票"), true);
  assert.equal(html.includes("唯珊不会付款、不会下单、不会上传证件或银行卡"), true);
  assert.equal(html.includes("去平台确认"), true);
  assert.equal(html.includes("Limited Beta"), false);
  assert.equal(html.includes("bookingUrl"), false);
  assert.equal(html.includes("确认后打开可信平台确认页"), true);

  const audit = api.getReadOnlyPriceCandidateCardViewModelAuditDraft(card);
  assert.equal(audit.eventType, "READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_DRAFT");
  assert.equal(audit.visible, true);
  assert.equal(audit.providerConfirmationRequired, true);
  assert.equal(audit.redacted, true);

  const blocked = api.buildReadOnlyPriceCandidateCardViewModel({
    restrictedCategory: true,
    providerId: "unknown",
    report: { handoff: { safeProviderHandoffUrl: "https://www.google.com/travel/flights" } }
  });
  assert.equal(blocked.visible, false);
  assert.equal(blocked.gate.status, "blocked");
  assert.equal(blocked.confirmationUi.status, "blocked");
  assert.equal(api.renderReadOnlyPriceCandidateCardHtml(blocked), "");
  assert.equal(api.assertReadOnlyPriceCandidateCardViewModelSafe(card), true);
  assert.equal(api.assertReadOnlyPriceCandidateCardViewModelSafe(blocked), true);

  const missingUrlCard = api.buildReadOnlyPriceCandidateCardViewModel({
    providerId: "trusted_flight_fixture",
    providerName: "Trusted Flight Fixture",
    providerType: "fixture",
    report: { handoff: { safeProviderHandoffUrl: null } },
    flightFields: {
      origin: "上海",
      destination: "成都",
      dateDisplay: "7 月 15 日",
      goal: "低价优先",
      directPreference: "直达优先"
    }
  });
  assert.equal(missingUrlCard.visible, true);
  assert.equal(missingUrlCard.gate.status, "blocked");
  assert.equal(missingUrlCard.confirmationUi.status, "blocked");
  assert.equal(missingUrlCard.confirmationUi.continueButtonDisabled, true);
  assert.equal(missingUrlCard.safeProviderHandoffUrl, null);
  const missingUrlHtml = api.renderReadOnlyPriceCandidateCardHtml(missingUrlCard);
  assert.equal(missingUrlHtml.includes("当前平台确认链接未通过安全检查"), true);
  assert.equal(missingUrlHtml.includes("disabled"), true);

  const safeGate = gateApi.evaluateSafeProviderDeepLinkHandoff({
    providerId: "google_flights_search",
    providerName: "Google Flights",
    searchOnly: true,
    safeProviderHandoffUrl: "https://www.google.com/travel/flights"
  });
  const confirmation = confirmationApi.buildProviderConfirmationHandoffUiModel(safeGate);
  assert.equal(confirmation.title, "前往平台确认");
  assert.equal(confirmation.showInMainFlow, false);

  const commerceAgentPageSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/routes/CommerceAgentPage.js"), "utf8");
  assert.equal(commerceAgentPageSource.includes('safeProviderHandoffCandidate.safeProviderHandoffUrl || "https://www.google.com/travel/flights"'), false);

  console.log("READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_CORE PASS");
}

main();
