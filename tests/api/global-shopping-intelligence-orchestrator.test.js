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
    "apps/desktop/src/renderer/core/globalShoppingDecisionEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseSafetyFilter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderErrorNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderConfigurationSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFeatureFlag.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderVersionRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderProductionReadiness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCapabilityModel.js",
    "apps/desktop/src/renderer/core/globalShoppingAdapterCapabilityResolver.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingBookingSandboxAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderHealthSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGateway.js",
    "apps/desktop/src/renderer/core/globalShoppingIntentClassifier.js",
    "apps/desktop/src/renderer/core/globalShoppingEntityExtractor.js",
    "apps/desktop/src/renderer/core/globalShoppingWorkflowStateModel.js",
    "apps/desktop/src/renderer/core/globalShoppingMultiProviderComparisonEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingIntelligenceOrchestrator.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingIntelligenceOrchestrator;
  const result = api.buildGlobalShoppingIntelligenceOrchestration({
    category:"hotel",
    userIntent:"帮我找东京酒店 2026-08-10 入住",
    candidates:[
      {
        platformName:"Booking",
        providerId:"booking",
        title:"东京酒店",
        trustLevel:"high",
        targetUrl:"https://www.booking.com/searchresults.zh-cn.html?ss=tokyo",
        shoppingContext:{ preferredMarket:"JP", currency:"JPY", language:"zh-CN", destinationCountry:"JP", regionContext:{ country:"JP", language:"ja", source:{ country:"user_selected" } } },
        providerIntelligence:{ providerId:"booking", coverageScore:75, qualityScore:82, adapterStatus:"sandbox" },
        providerCoverage:{ coverageScore:80, countryCoverage:1, categoryCoverage:1, languageCoverage:1 },
        providerHealth:{ healthStatus:"healthy" },
        providerCompetition:{ leader:{ providerId:"booking" }, advantages:["酒店覆盖更强"] },
        dataSource:{ sourceType:"sandbox", sourceStatus:"sandbox" },
        dataQuality:{ qualityLevel:"medium" },
        dataProvenance:{ decisionId:"booking:hotel:1" },
        taxSummary:{ taxConfidence:"estimated" },
        landedCostResult:{ totalEstimate:{ label:"预计到手价" }, taxConfidence:"estimated" },
        providerRanking:{ rankingReason:["地区匹配"], routeConfidence:"high" },
        recommendationReason:"酒店覆盖更强"
      }
    ]
  });

  assert.equal(api.GLOBAL_SHOPPING_INTELLIGENCE_ORCHESTRATOR_VERSION, "4.2.8");
  assert.equal(result.intentClassification.intentType, "hotel");
  assert.equal(result.entityExtraction.entities.city, "东京");
  assert.equal(result.workflowState.currentStage, "recommended");
  assert.equal(result.decision.recommendation.platformName, "Booking");
  assert.equal(result.gatewayDecision.reason, "sandbox_only");
  assert.equal(result.gatewayDecision.gatewayStatus, "sandbox");
  assert.equal(result.comparison.winner.provider.length > 0, true);
  console.log("GLOBAL_SHOPPING_INTELLIGENCE_ORCHESTRATOR PASS");
}

main();
