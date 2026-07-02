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
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderResponseContract.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingFixtureReplayConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js",
    "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingNormalizedPriceCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxHandoffViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPricePipelineOrchestrator.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCandidateJourneyBoard.js"
  ]);
  const pipelineApi = windowRef.WeishanGlobalShoppingPricePipelineOrchestrator;
  const boardApi = windowRef.WeishanGlobalShoppingReadOnlyCandidateJourneyBoard;
  assert.equal(boardApi.GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_JOURNEY_BOARD_VERSION, "4.0.3");

  const responseContract = windowRef.WeishanGlobalShoppingSandboxProviderResponseContract.buildGlobalShoppingSandboxProviderResponseContract({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    credentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    normalizedSourceInputs:[{ sourceId:"official_fixture_1" }],
    officialFixturePrice:{ title:"Official Fixture", basePrice:920 },
    partnerFixturePrices:[{ title:"Partner Fixture", basePrice:899 }]
  });
  const connector = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxConnector.buildGlobalShoppingReadOnlyProviderSandboxConnector({
    providerFixture:{ providerId:"fixture_provider", providerName:"Fixture Provider" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    providerResponseContract:responseContract
  });
  const replay = windowRef.WeishanGlobalShoppingFixtureReplayConsole.buildGlobalShoppingFixtureReplayConsole({
    connectorSummary:connector,
    replayPayload:{
      replayId:"fixture_replay_journey",
      replayMode:"fixture",
      providerId:"fixture_provider",
      providerName:"Fixture Provider",
      redacted:true
    }
  });
  const normalization = windowRef.WeishanGlobalShoppingPriceSourceNormalizer.buildGlobalShoppingPriceSourceNormalizer({});
  const anchor = windowRef.WeishanGlobalShoppingOfficialPriceAnchorSlot.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates:normalization.normalizedCandidates });
  const matcher = windowRef.WeishanGlobalShoppingSameItemMatcher.buildGlobalShoppingSameItemMatcher({ normalizedCandidates:normalization.normalizedCandidates });
  const merger = windowRef.WeishanGlobalShoppingDuplicateCandidateMerger.buildGlobalShoppingDuplicateCandidateMerger({ sameItemMatcherSummary:matcher });
  const covered = windowRef.WeishanGlobalShoppingCoveredLowestCandidateBoard.buildGlobalShoppingCoveredLowestCandidateBoard({ duplicateCandidateMergerSummary:merger, officialPriceAnchorSummary:anchor });
  const normalizedBoard = windowRef.WeishanGlobalShoppingNormalizedPriceCandidateBoard.buildGlobalShoppingNormalizedPriceCandidateBoard({
    readOnlyProviderSandboxConnectorSummary:connector,
    fixtureReplayConsoleSummary:replay
  });
  const handoff = windowRef.WeishanGlobalShoppingSandboxHandoffViewModel.buildGlobalShoppingSandboxHandoffViewModel({
    sandboxDeepLinkCandidateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 跳转候选已准备", redacted:true } },
    platformAvailabilitySummary:{ status:"available", userFacingSummary:{ resultLabel:"平台候选可展示", redacted:true } },
    partnerLinkPolicySummary:{ status:"compliant", userFacingSummary:{ resultLabel:"合作链接政策合规", redacted:true } },
    legalProviderFixtureSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider fixture 已准备", redacted:true } },
    providerCredentialSafetySummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 凭据边界安全", redacted:true } },
    sandboxPriceFeedSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 价格 Feed 已准备", redacted:true } }
  });
  const pipeline = pipelineApi.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider fixture 已准备", redacted:true } },
    providerCredentialSafetyReview:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 凭据边界安全", redacted:true } },
    sandboxPriceFeedGate:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 价格 Feed 已准备", redacted:true } },
    sandboxProviderResponseContract:responseContract,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    priceSourceNormalizer:normalization,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff
  });

  const board = boardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard({
    pricePipelineOrchestratorSummary:pipeline,
    legalProviderFixtureSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Provider fixture 已准备", redacted:true } },
    coveredLowestCandidateBoardSummary:covered,
    sandboxHandoffViewModelSummary:handoff
  });
  assert.equal(board.appVersion, "4.0.3");
  assert.equal(board.status, "ready");
  assert.equal(board.title, "全球购只读候选旅程");
  assert.equal(board.cards.find((item) => item.cardId === "provider_fixture").label, "Provider Fixture");
  assert.equal(board.cards.find((item) => item.cardId === "price_pipeline").label, "价格流水线");
  assert.equal(board.cards.find((item) => item.cardId === "covered_lowest").label, "已覆盖来源较低候选价");
  assert.equal(board.cards.find((item) => item.cardId === "sandbox_handoff").label, "Sandbox 跳转预览");
  assert.ok(board.journeyRows.length >= 10);
  assert.ok(board.pipelineStageRows.length >= 10);
  assert.ok(board.disclosureRows.length >= 3);
  assert.ok(board.nextStepRows.length >= 2);

  assert.equal(boardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard({}).status, "needs_review");
  assert.equal(boardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard({
    pricePipelineOrchestratorSummary:{ status:"blocked" },
    legalProviderFixtureSummary:{ status:"ready" },
    coveredLowestCandidateBoardSummary:{ status:"ready" },
    sandboxHandoffViewModelSummary:{ status:"ready" }
  }).status, "blocked");
  assert.equal(boardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard({
    pricePipelineOrchestratorSummary:pipeline,
    legalProviderFixtureSummary:{ status:"ready" },
    coveredLowestCandidateBoardSummary:covered,
    sandboxHandoffViewModelSummary:handoff,
    note:"全网最低"
  }).status, "blocked");
  const safeJson = JSON.stringify(boardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard({
    pricePipelineOrchestratorSummary:pipeline,
    legalProviderFixtureSummary:{ status:"ready" },
    coveredLowestCandidateBoardSummary:covered,
    sandboxHandoffViewModelSummary:handoff,
    token:"abc"
  }));
  assert.equal(/abc|bookingUrl|paymentUrl|orderUrl|checkoutUrl/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_CANDIDATE_JOURNEY_BOARD PASS");
}

main();
