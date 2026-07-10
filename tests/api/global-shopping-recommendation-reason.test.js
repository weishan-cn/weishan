const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRecommendationReasonEngine.js");
  const api = windowRef.WeishanGlobalShoppingRecommendationReasonEngine;
  const result = api.buildGlobalShoppingRecommendationReason({
    provider:{ name:"Amazon Japan", countries:["JP"], trustLevel:"high" },
    shoppingContext:{ preferredMarket:"JP" },
    providerRanking:{
      dimensionScores:{
        countryMatchScore:0.95,
        languageMatchScore:1,
        priceTransparencyScore:0.76
      }
    },
    landedCostResult:{ taxConfidence:"estimated" }
  });

  assert.equal(api.GLOBAL_SHOPPING_RECOMMENDATION_REASON_ENGINE_VERSION, "4.2.8");
  assert.equal(result.provider, "Amazon Japan");
  assert.equal(result.reasons.includes("符合当前地区与目标市场"), true);
  assert.equal(result.reasons.includes("官方可信度较高"), true);
  assert.match(result.summary, /地区|税费|可信度/);
  assert.match(result.decisionSummary, /推荐 Amazon Japan/);
  assert.equal(Array.isArray(result.structuredExplanation.whyRecommended), true);
  assert.equal(Array.isArray(result.structuredExplanation.costFactors), true);
  console.log("GLOBAL_SHOPPING_RECOMMENDATION_REASON PASS");
}

main();
