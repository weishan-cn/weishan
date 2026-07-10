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
    "apps/desktop/src/renderer/core/globalShoppingProviderIntelligenceRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingCategoryIntelligenceModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCompetitionEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderHealthEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPolicyEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingMarketCategoryMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingContextEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCapabilityModel.js",
    "apps/desktop/src/renderer/core/globalShoppingAdapterCapabilityResolver.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderOnboardingRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialDomainVerifier.js",
    "apps/desktop/src/renderer/core/globalShoppingRegionalProviderSelector.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRankingEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRouter.js",
    "apps/desktop/src/renderer/core/globalShoppingRealPriceResultModel.js",
    "apps/desktop/src/renderer/core/globalShoppingTaxRuleRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingLandedCostEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderTrustRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingRecommendationReasonEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceFreshnessModel.js",
    "apps/desktop/src/renderer/core/globalShoppingAvailabilityFreshnessModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFallbackEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformCandidateFactory.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPlatformCandidateFactory;
  const product = api.buildGlobalShoppingPlatformCandidates({
    category:"product",
    normalizedFields:{ productQuery:"iPhone 16 Pro" }
  });
  const flight = api.buildGlobalShoppingPlatformCandidates({
    category:"flight",
    normalizedFields:{ originText:"成都", destinationText:"上海", dateText:"7 月 15 日" }
  });
  const hotel = api.buildGlobalShoppingPlatformCandidates({
    category:"hotel",
    normalizedFields:{ destinationText:"东京" }
  });
  assert.equal(api.GLOBAL_SHOPPING_PLATFORM_CANDIDATE_FACTORY_VERSION, "4.2.8");
  assert.equal(product.length >= 8, true);
  assert.equal(flight.length >= 8, true);
  assert.equal(hotel.length >= 5, true);
  assert.equal(product.every((item) => item.readOnlyCandidate === true), true);
  assert.equal(flight.every((item) => /checkout|payment|order/i.test(item.targetUrl || "") === false), true);
  assert.equal(product[0].shoppingContext.preferredMarket.length > 0, true);
  assert.equal(product[0].providerSummary.routingScore > 0, true);
  assert.equal(product[0].providerRanking.totalScore > 0, true);
  assert.equal(Array.isArray(product[0].providerRanking.rankingReason), true);
  assert.equal(product[0].trustVerification.status, "ready");
  assert.equal(product[0].realPriceResult.readOnlyPreparation, true);
  assert.equal(product[0].sourceType, "sandbox");
  assert.equal(product[0].adapterStatus.sourceType, "sandbox");
  assert.equal(typeof product[0].adapterCapability.productSearch, "boolean");
  assert.equal(typeof product[0].marketMatched, "boolean");
  assert.equal(product[0].regionReason.length > 0, true);
  assert.equal(typeof product[0].officialDomainStatus.verified, "boolean");
  assert.equal(product[0].dataSource.sourceType, "sandbox");
  assert.equal(product[0].dataFreshness.freshnessLevel.length > 0, true);
  assert.equal(product[0].dataQuality.qualityLevel.length > 0, true);
  assert.equal(product[0].dataProvenance.transformations.length >= 3, true);
  assert.equal(product[0].providerIntelligence.providerId.length > 0, true);
  assert.equal(product[0].providerCoverage.coverageScore > 0, true);
  assert.equal(product[0].providerHealth.healthStatus.length > 0, true);
  assert.equal(Array.isArray(product[0].providerCompetition.advantages), true);
  assert.equal(Array.isArray(product[0].providerPolicyDecision.rankedProviderIds), true);
  assert.equal(product[0].marketCategoryMatrix.rowCount > 0, true);
  assert.equal(product[0].categoryIntelligence.categoryId.length > 0, true);
  assert.equal(product[0].priceFreshness.freshnessLevel.length > 0, true);
  assert.equal(product[0].availabilityFreshness.availabilityStatus.length > 0, true);
  assert.equal(typeof product[0].fallbackInfo.availableFallback, "boolean");
  assert.equal(product[0].landedCostResult.taxConfidence.length > 0, true);
  assert.equal(Array.isArray(product[0].taxSummary.rules), true);
  assert.equal(Array.isArray(product[0].recommendationReasonDetail.reasons), true);
  assert.match(product[0].feeNote, /sandbox adapter|平台页面/);
  assert.match(flight[0].feeNote, /平台页面/);
  console.log("GLOBAL_SHOPPING_PLATFORM_CANDIDATE_FACTORY PASS");
}

main();
