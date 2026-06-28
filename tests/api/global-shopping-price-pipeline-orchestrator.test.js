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
    "apps/desktop/src/renderer/core/globalShoppingPricePipelineOrchestrator.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPricePipelineOrchestrator;
  assert.equal(api.GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR_VERSION, "2.1.95");

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
      replayId:"fixture_replay_pipeline",
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

  const ready = api.buildGlobalShoppingPricePipelineOrchestrator({
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
  assert.equal(ready.appVersion, "2.1.95");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "只读价格流水线已准备");
  assert.equal(ready.pipelineStages.length, 12);
  assert.equal(ready.readyOutputs.canShowFixtureCandidatePrices, true);
  assert.equal(ready.readyOutputs.canShowFixtureReplay, true);
  assert.equal(ready.readyOutputs.canShowOfficialAnchor, true);
  assert.equal(ready.readyOutputs.canShowCoveredLowestCandidate, true);
  assert.equal(ready.readyOutputs.canProceedToReadOnlyProviderSandbox, true);
  assert.equal(ready.readyOutputs.safeToProceedWithFirstRealReadOnlyProviderSandbox, true);

  assert.equal(api.buildGlobalShoppingPricePipelineOrchestrator({
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
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
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetyReview:{ status:"ready" },
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
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    priceSourceNormalizer:normalization,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff
  }).status, "needs_review");

  assert.equal(api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    sandboxProviderResponseContract:responseContract,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff
  }).status, "needs_review");

  const blocked = api.buildGlobalShoppingPricePipelineOrchestrator({
    legalProviderFixtureSummary:{ status:"ready" },
    providerCredentialSafetyReview:{ status:"ready" },
    sandboxPriceFeedGate:{ status:"ready" },
    sandboxProviderResponseContract:responseContract,
    readOnlyProviderSandboxConnector:connector,
    fixtureReplayConsole:replay,
    priceSourceNormalizer:normalization,
    officialPriceAnchorSlot:anchor,
    sameItemMatcher:matcher,
    duplicateCandidateMerger:merger,
    coveredLowestCandidateBoard:covered,
    normalizedPriceCandidateBoard:normalizedBoard,
    sandboxHandoffViewModel:handoff,
    networkEnabled:true
  });
  assert.equal(blocked.status, "blocked");
  const safeJson = JSON.stringify(blocked);
  assert.equal(/https?:\/\/blocked|token|secret/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_PRICE_PIPELINE_ORCHESTRATOR PASS");
}

main();
