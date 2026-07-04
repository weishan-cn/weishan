const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingFixtureReplayConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderResponseContract.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js",
    "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxHandoffViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPricePipelineOrchestrator.js",
    "apps/desktop/src/renderer/core/globalShoppingNormalizedPriceCandidateBoard.js"
  ]);
  const connector = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxConnector.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:{ status:"ready" }
  });
  const replay = windowRef.WeishanGlobalShoppingFixtureReplayConsole.buildGlobalShoppingFixtureReplayConsole({
    connectorSummary:connector,
    replayPayload:{ replayId:"replay_1", replayMode:"fixture", redacted:true, normalizedSourceInputs:[{ sourceId:"official_fixture_1" }], officialFixturePrice:{ title:"Official Fixture", basePrice:920 }, partnerFixturePrices:[{ title:"Partner Fixture", basePrice:899 }] }
  });
  const responseContract = windowRef.WeishanGlobalShoppingSandboxProviderResponseContract.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    officialFixturePrice:{ title:"Official Fixture", basePrice:920 },
    partnerFixturePrices:[{ title:"Partner Fixture", basePrice:899 }]
  });
  const normalization = windowRef.WeishanGlobalShoppingPriceSourceNormalizer.buildGlobalShoppingPriceSourceNormalizer({});
  const anchor = windowRef.WeishanGlobalShoppingOfficialPriceAnchorSlot.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates:normalization.normalizedCandidates });
  const matcher = windowRef.WeishanGlobalShoppingSameItemMatcher.buildGlobalShoppingSameItemMatcher({ normalizedCandidates:normalization.normalizedCandidates });
  const merger = windowRef.WeishanGlobalShoppingDuplicateCandidateMerger.buildGlobalShoppingDuplicateCandidateMerger({ sameItemMatcherSummary:matcher });
  const covered = windowRef.WeishanGlobalShoppingCoveredLowestCandidateBoard.buildGlobalShoppingCoveredLowestCandidateBoard({ duplicateCandidateMergerSummary:merger, officialPriceAnchorSummary:anchor });
  const handoff = windowRef.WeishanGlobalShoppingSandboxHandoffViewModel.buildGlobalShoppingSandboxHandoffViewModel({
    sandboxDeepLinkCandidateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 跳转候选已准备", redacted:true } },
    platformAvailabilitySummary:{ status:"available", userFacingSummary:{ resultLabel:"平台候选可展示", redacted:true } },
    partnerLinkPolicySummary:{ status:"compliant", userFacingSummary:{ resultLabel:"合作链接政策合规", redacted:true } },
    legalProviderFixtureSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider fixture 已准备", redacted:true } },
    providerCredentialSafetySummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 凭据边界安全", redacted:true } },
    sandboxPriceFeedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 价格 Feed 已准备", redacted:true } }
  });
  const pipeline = windowRef.WeishanGlobalShoppingPricePipelineOrchestrator.buildGlobalShoppingPricePipelineOrchestrator({
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    legalProviderFixtureSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider fixture 已准备", redacted:true } },
    providerCredentialSafetyReview:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 凭据边界安全", redacted:true } },
    sandboxPriceFeedGate:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 价格 Feed 已准备", redacted:true } },
    sandboxProviderResponseContract:responseContract,
    priceSourceNormalizer:normalization,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    sandboxHandoffViewModel:handoff
  });
  const api = windowRef.WeishanGlobalShoppingNormalizedPriceCandidateBoard;
  assert.equal(api.GLOBAL_SHOPPING_NORMALIZED_PRICE_CANDIDATE_BOARD_VERSION, "4.2.2");
  const board = api.buildGlobalShoppingNormalizedPriceCandidateBoard({
    readOnlyProviderSandboxConnectorSummary:connector,
    fixtureReplayConsoleSummary:replay,
    pricePipelineOrchestratorSummary:pipeline,
    officialPriceAnchorSummary:anchor,
    coveredLowestCandidateBoardSummary:covered,
    priceCandidateDisplaySummary:{ status:"ready", title:"全球购价格候选展示", caveat:"当前仅展示只读 fixture/sandbox 归一化候选", redacted:true }
  });
  assert.equal(board.appVersion, "4.2.2");
  assert.equal(board.status, "ready");
  assert.equal(board.cards.find((item) => item.cardId === "provider_connector").label, "Provider Connector");
  assert.equal(board.cards.find((item) => item.cardId === "fixture_replay").label, "Fixture 回放");
  assert.equal(board.cards.find((item) => item.cardId === "official_anchor").label, "官方参考价");
  assert.equal(board.cards.find((item) => item.cardId === "covered_lowest").label, "已覆盖来源较低候选价");
  assert.ok(board.connectorRows.length >= 1);
  assert.ok(board.replayRows.length >= 1);
  assert.ok(board.normalizedPriceRows.length >= 4);
  assert.ok(board.pipelineRows.length >= 10);
  assert.ok(board.disclosureRows.length >= 4);
  assert.equal(api.buildGlobalShoppingNormalizedPriceCandidateBoard({ fixtureReplayConsoleSummary:replay, pricePipelineOrchestratorSummary:pipeline }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingNormalizedPriceCandidateBoard({ readOnlyProviderSandboxConnectorSummary:connector, pricePipelineOrchestratorSummary:pipeline }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingNormalizedPriceCandidateBoard({ readOnlyProviderSandboxConnectorSummary:connector, fixtureReplayConsoleSummary:replay }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingNormalizedPriceCandidateBoard({ readOnlyProviderSandboxConnectorSummary:Object.assign({}, connector, { status:"blocked" }), fixtureReplayConsoleSummary:replay, pricePipelineOrchestratorSummary:pipeline }).status, "blocked");
  assert.equal(api.buildGlobalShoppingNormalizedPriceCandidateBoard({ readOnlyProviderSandboxConnectorSummary:connector, fixtureReplayConsoleSummary:replay, pricePipelineOrchestratorSummary:pipeline, note:"全网最低" }).status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingNormalizedPriceCandidateBoard({ readOnlyProviderSandboxConnectorSummary:connector, fixtureReplayConsoleSummary:replay, pricePipelineOrchestratorSummary:pipeline, token:"abc", secret:"def" }));
  assert.equal(/abc|def|bookingUrl|paymentUrl|orderUrl|checkoutUrl/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_NORMALIZED_PRICE_CANDIDATE_BOARD PASS");
}

main();
