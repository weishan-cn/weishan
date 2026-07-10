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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingConfidenceEngine.js");
  const api = windowRef.WeishanGlobalShoppingConfidenceEngine;
  const medium = api.buildGlobalShoppingConfidence({
    candidate:{
      platformName:"Amazon Japan",
      priceLabel:"到平台查看实时价格",
      isOfficial:true,
      trustVerification:{ status:"ready", trustLevel:"high" },
      landedCostResult:{ taxConfidence:"estimated" },
      providerRanking:{ totalScore:88 },
      taxSummary:{ taxConfidence:"estimated" },
      targetUrl:"https://www.amazon.co.jp/s?k=switch",
      recommendationReasonDetail:{ reasons:["市场匹配"] }
    }
  });
  const low = api.buildGlobalShoppingConfidence({
    candidate:{
      platformName:"Unknown",
      trustVerification:{ status:"needs_review", trustLevel:"review" },
      landedCostResult:{ taxConfidence:"unknown" }
    }
  });

  assert.equal(api.GLOBAL_SHOPPING_CONFIDENCE_ENGINE_VERSION, "4.2.8");
  assert.equal(medium.confidence, "medium");
  assert.equal(low.confidence, "low");
  console.log("GLOBAL_SHOPPING_CONFIDENCE_ENGINE PASS");
}

main();
