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
    "apps/desktop/src/renderer/core/globalShoppingRecommendationAudit.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderIntelligenceRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCompetitionEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderHealthEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPolicyEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingUserPreferenceModel.js",
    "apps/desktop/src/renderer/core/globalShoppingConfidenceEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingComparisonMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingDecisionEngine.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingDecisionEngine;
  const result = api.buildGlobalShoppingDecisionResult({
    category:"product",
    candidates:[
      {
        platformName:"Amazon Japan",
        title:"Nintendo Switch",
        targetUrl:"https://www.amazon.co.jp/s?k=switch",
        priceLabel:"到平台查看实时价格",
        isOfficial:false,
        trustLevel:"high",
        trustVerification:{ status:"ready", trustLevel:"high" },
        landedCostResult:{ totalEstimate:{ label:"预计到手价" }, taxConfidence:"estimated" },
        taxSummary:{ taxConfidence:"estimated" },
        providerRanking:{ rankingReason:["地区匹配度高"], routeConfidence:"high" },
        recommendationReason:"市场匹配",
        regionReason:"根据你的日本地区设置，优先推荐日本本地平台。",
        providerIntelligence:{ providerId:"amazon_japan", coverageScore:78, qualityScore:86, adapterStatus:"sandbox" },
        providerCoverage:{ coverageScore:84, countryCoverage:1, categoryCoverage:1, languageCoverage:1 },
        providerHealth:{ healthStatus:"limited" },
        providerCompetition:{ leader:{ providerId:"amazon_japan" }, advantages:["可信等级更高"] },
        dataSource:{ sourceType:"sandbox", sourceStatus:"sandbox", trustLevel:"high" },
        dataQuality:{ qualityLevel:"medium", warnings:["价格以平台页面为准。"] },
        dataProvenance:{ decisionId:"amazon_japan:product:1" }
      },
      {
        platformName:"Rakuten",
        title:"Nintendo Switch",
        targetUrl:"https://search.rakuten.co.jp/search/mall/switch/",
        priceLabel:"到平台查看实时价格",
        trustLevel:"medium",
        trustVerification:{ status:"ready", trustLevel:"medium" },
        landedCostResult:{ totalEstimate:{ label:"预计到手价" }, taxConfidence:"possible" },
        taxSummary:{ taxConfidence:"possible" },
        providerRanking:{ rankingReason:["本地平台"], routeConfidence:"medium" },
        recommendationReason:"本地市场"
      }
    ],
    userPreference:{ preferredCountry:"JP", lowestRisk:true }
  });

  assert.equal(api.GLOBAL_SHOPPING_DECISION_ENGINE_VERSION, "4.2.8");
  assert.equal(result.recommendation.platformName, "Amazon Japan");
  assert.equal(result.alternatives.length, 1);
  assert.equal(result.confidence.confidence, "medium");
  assert.match(result.regionalExplanation, /日本地区设置/);
  assert.equal(result.dataSource.sourceType, "sandbox");
  assert.equal(result.dataQuality.qualityLevel, "medium");
  assert.equal(result.auditReference, "audit:amazon_japan:product:1");
  assert.equal(result.recommendation.auditReference, "audit:amazon_japan:product:1");
  assert.equal(result.providerIntelligence.providerId, "amazon_japan");
  assert.match(result.coverageExplanation, /平台覆盖/);
  assert.equal(result.competitionSummary.leader.providerId, "amazon_japan");
  assert.equal(result.providerHealth.healthStatus, "limited");
  assert.equal(Array.isArray(result.warnings), true);
  console.log("GLOBAL_SHOPPING_DECISION_ENGINE PASS");
}

main();
