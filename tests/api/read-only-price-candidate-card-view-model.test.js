const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/providerConfirmationHandoffUi.js",
    "apps/desktop/src/renderer/core/providerSandboxBindingWizard.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRefreshStateStore.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteInteractiveRefreshUiController.js",
    "apps/desktop/src/renderer/core/readOnlyPriceCandidateCardViewModel.js"
  ]);
  const api = windowRef.WeishanReadOnlyPriceCandidateCardViewModel;
  assert.equal(api.READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION, "2.1.48");

  const card = api.buildReadOnlyPriceCandidateCardViewModel({ task:{ title:"7月15日上海到成都最便宜的机票" }, providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", report:{ provider:{ providerMode:"fixture" }, handoff:{ safeProviderHandoffUrl:"https://www.google.com/travel/flights" } }, flightFields:{ origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", goal:"低价优先", directPreference:"直达优先" } });
  assert.equal(card.visible, true);
  assert.equal(card.title, "只读候选价");
  assert.equal(card.providerMode, "fixture");
  assert.equal(card.priceTruthLabel, "只读候选价 · 平台最终为准 · 未锁价 · 不代表可出票");
  assert.equal(card.providerConfirmationRequired, true);
  assert.equal(card.confirmationUi.continueButtonDisabled, false);
  assert.equal(card.bookingUrl, null);
  assert.equal(card.noAutoOpen, true);
  assert.equal(card.noPayment, true);
  assert.equal(card.noOrder, true);
  assert.equal(card.noIdentityUpload, true);
  assert.equal(card.refreshButton.label, "刷新只读报价");
  assert.equal(card.refreshButton.enabled, true);
  assert.equal(card.refreshButton.autoRun, false);
  assert.equal(card.refreshButton.payment, false);
  assert.equal(card.refreshButton.order, false);
  assert.equal(card.refreshButton.identityUpload, false);
  assert.equal(card.refreshButton.autoRefresh, false);
  assert.equal(card.refreshStateSummary.summary, "最近一次刷新：未运行");
  assert.equal(card.providerBindingWizardSummary.title, "Provider 沙盒绑定准备");
  assert.equal(card.interactiveRefreshState.status, "idle");
  assert.equal(card.clearRefreshStateButton.label, "清除刷新状态");

  const html = api.renderReadOnlyPriceCandidateCardHtml(card);
  assert.equal(html.includes("只读候选价"), true);
  assert.equal(html.includes("平台最终为准"), true);
  assert.equal(html.includes("未锁价"), true);
  assert.equal(html.includes("不代表可出票"), true);
  assert.equal(html.includes("去平台确认"), true);
  assert.equal(html.includes("刷新只读报价"), true);
  assert.equal(html.includes("清除刷新状态"), true);
  assert.equal(html.includes("最近一次刷新：未运行"), true);
  assert.equal(html.includes("Provider 沙盒绑定准备"), true);
  assert.equal(html.includes("仅更新候选证据，不代表已锁价或可出票"), true);
  assert.equal(html.includes("价格、库存、税费和规则以平台页面为准"), true);
  assert.equal(html.includes("Limited Beta"), false);
  assert.equal(html.includes("bookingUrl"), false);

  const failedCard = api.buildReadOnlyPriceCandidateCardViewModel({ interactiveRefreshState:{ status:"failed_safe", refreshErrorBanner:"只读报价刷新失败，已安全降级" }, report:{ handoff:{ safeProviderHandoffUrl:null } } });
  assert.equal(failedCard.refreshErrorBanner, "只读报价刷新失败，已安全降级");
  assert.equal(api.renderReadOnlyPriceCandidateCardHtml(failedCard).includes("只读报价刷新失败，已安全降级"), true);

  const recoveredCard = api.buildReadOnlyPriceCandidateCardViewModel({ interactiveRefreshState:{ status:"idle", recoveryStatus:"recovered", state:{ lastRefreshStatus:"refreshed", showableAsCandidateEvidence:true }, recoveredEvidenceSummary:{ available:true, source:"local_redacted_state", showableAsRealPrice:false, showableAsCandidateEvidence:true, canReplaceMainResultCard:false } }, report:{ handoff:{ safeProviderHandoffUrl:null } } });
  assert.equal(recoveredCard.recoveredEvidenceSummary.available, true);
  assert.equal(api.renderReadOnlyPriceCandidateCardHtml(recoveredCard).includes("已恢复最近一次只读证据"), true);

  const sandboxCard = api.buildReadOnlyPriceCandidateCardViewModel({ providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", providerMode:"sandbox_read_only", report:{ provider:{ providerMode:"sandbox_read_only" }, handoff:{ safeProviderHandoffUrl:"https://www.google.com/travel/flights" } } });
  assert.equal(sandboxCard.title, "只读沙盒价");
  assert.equal(sandboxCard.providerMode, "sandbox_read_only");
  assert.equal(sandboxCard.providerModeLabel, "只读沙盒价");
  assert.equal(sandboxCard.candidatePriceLabel, "只读沙盒价");
  assert.equal(sandboxCard.refreshButton.enabled, false);
  assert.equal(sandboxCard.providerBindingWizardSummary.status, "needs_setup");
  assert.equal(api.renderReadOnlyPriceCandidateCardHtml(sandboxCard).includes("只读沙盒价"), true);

  const productionCard = api.buildReadOnlyPriceCandidateCardViewModel({ providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", providerMode:"production_disabled", report:{ provider:{ providerMode:"production_disabled" }, handoff:{ safeProviderHandoffUrl:null } } });
  assert.equal(productionCard.title, "生产价格未启用");
  assert.equal(productionCard.confirmationUi.continueButtonDisabled, true);
  assert.equal(productionCard.safeProviderHandoffUrl, null);
  assert.equal(productionCard.refreshButton.enabled, false);

  const missingUrlCard = api.buildReadOnlyPriceCandidateCardViewModel({ providerId:"google_flights_search", report:{ handoff:{ safeProviderHandoffUrl:null } } });
  assert.equal(missingUrlCard.visible, true);
  assert.equal(missingUrlCard.gate.status, "blocked");
  assert.equal(missingUrlCard.confirmationUi.status, "blocked");
  assert.equal(missingUrlCard.confirmationUi.continueButtonDisabled, true);
  assert.equal(missingUrlCard.safeProviderHandoffUrl, null);
  assert.equal(missingUrlCard.bookingUrl, null);
  assert.equal(missingUrlCard.refreshButton.enabled, true);
  assert.equal(missingUrlCard.noAutoOpen, true);
  const missingUrlHtml = api.renderReadOnlyPriceCandidateCardHtml(missingUrlCard);
  assert.equal(missingUrlHtml.includes("当前平台确认链接未通过安全检查"), true);
  assert.equal(missingUrlHtml.includes("disabled"), true);

  const blocked = api.buildReadOnlyPriceCandidateCardViewModel({ restrictedCategory:true, providerId:"unknown", report:{ handoff:{ safeProviderHandoffUrl:"https://www.google.com/travel/flights" } } });
  assert.equal(blocked.visible, false);
  assert.equal(blocked.gate.status, "blocked");
  assert.equal(api.renderReadOnlyPriceCandidateCardHtml(blocked), "");

  assert.equal(api.assertReadOnlyPriceCandidateCardViewModelSafe(card), true);
  assert.equal(api.assertReadOnlyPriceCandidateCardViewModelSafe(missingUrlCard), true);
  const commerceAgentPageSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/routes/CommerceAgentPage.js"), "utf8");
  assert.equal(commerceAgentPageSource.includes('safeProviderHandoffCandidate.safeProviderHandoffUrl || "https://www.google.com/travel/flights"'), false);
  console.log("READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_CORE PASS");
}

main();
