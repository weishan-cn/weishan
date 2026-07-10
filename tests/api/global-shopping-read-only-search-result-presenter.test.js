const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingRegionIntelligenceEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingMarketProfileRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingDataSourceModel.js",
    "apps/desktop/src/renderer/core/globalShoppingDataFreshnessEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingDataQualityEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingDataProvenance.js",
    "apps/desktop/src/renderer/core/globalShoppingRecommendationAudit.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderIntelligenceRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingCategoryIntelligenceModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCompetitionEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderHealthEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPolicyEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingMarketCategoryMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCapabilityModel.js",
    "apps/desktop/src/renderer/core/globalShoppingAdapterCapabilityResolver.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderOnboardingRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialDomainVerifier.js",
    "apps/desktop/src/renderer/core/globalShoppingRegionalProviderSelector.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRankingEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRouter.js",
    "apps/desktop/src/renderer/core/globalShoppingContextEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingRealPriceResultModel.js",
    "apps/desktop/src/renderer/core/globalShoppingTaxRuleRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingLandedCostEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderTrustRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingRecommendationReasonEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingUserPreferenceModel.js",
    "apps/desktop/src/renderer/core/globalShoppingConfidenceEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingComparisonMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingDecisionEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderConfigurationSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFeatureFlag.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderVersionRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderProductionReadiness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseSafetyFilter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderErrorNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRateLimitModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCachePolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGateway.js",
    "apps/desktop/src/renderer/core/globalShoppingIntentClassifier.js",
    "apps/desktop/src/renderer/core/globalShoppingEntityExtractor.js",
    "apps/desktop/src/renderer/core/globalShoppingWorkflowStateModel.js",
    "apps/desktop/src/renderer/core/globalShoppingMultiProviderComparisonEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingIntelligenceOrchestrator.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceFreshnessModel.js",
    "apps/desktop/src/renderer/core/globalShoppingAvailabilityFreshnessModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFallbackEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformCandidateFactory.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultRanker.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultPresenter.js"
  ]);
  const factory = windowRef.WeishanGlobalShoppingPlatformCandidateFactory;
  const api = windowRef.WeishanGlobalShoppingReadOnlySearchResultPresenter;
  const presentation = api.buildGlobalShoppingReadOnlySearchResultPresentation({
    category:"hotel",
    inputSummary:"帮我找东京酒店",
    candidates:factory.buildGlobalShoppingPlatformCandidates({
      category:"hotel",
      normalizedFields:{ destinationText:"东京" }
    })
  });
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER_VERSION, "4.2.8");
  assert.equal(presentation.topResults.length, 3);
  assert.equal(presentation.candidateCount >= 5, true);
  assert.match(presentation.recommendation.title, /优先查看/);
  assert.match(presentation.userFacingSummary.caveat, /只读候选入口/);
  assert.equal(typeof presentation.decisionResult, "object");
  assert.equal(Array.isArray((presentation.comparisonMatrix || {}).rows), true);
  assert.equal(presentation.topResults[0].sourceType, "sandbox");
  assert.equal(Array.isArray((presentation.architectureSummary || {}).intelligenceLayers), true);
  assert.equal(presentation.architectureSummary.intelligenceLayers.includes("region_intelligence"), true);
  assert.equal(presentation.architectureSummary.intelligenceLayers.includes("data_quality"), true);
  assert.equal(presentation.architectureSummary.intelligenceLayers.includes("provider_intelligence"), true);
  assert.equal(presentation.dataSource.sourceType, "sandbox");
  assert.equal(presentation.providerIntelligence.providerId.length > 0, true);
  assert.equal(presentation.providerCoverage.coverageScore > 0, true);
  assert.equal(typeof presentation.userFacingSummary.providerIntelligenceLabel, "string");
  assert.equal(typeof presentation.userFacingSummary.dataGovernanceLabel, "string");
  assert.equal(presentation.intentClassification.intentType, "hotel");
  assert.equal(presentation.workflowState.currentStage, "recommended");
  assert.equal(presentation.gatewayDecision.gatewayStatus, "sandbox");
  assert.equal(typeof presentation.userFacingSummary.workflowLabel, "string");
  assert.equal(typeof presentation.userFacingSummary.gatewayLabel, "string");
  console.log("GLOBAL_SHOPPING_READ_ONLY_SEARCH_RESULT_PRESENTER PASS");
}

main();
