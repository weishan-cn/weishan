const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderPolicyEngine.js");
  const api = windowRef.WeishanGlobalShoppingProviderPolicyEngine;
  const result = api.buildGlobalShoppingProviderPolicyDecision({
    userPreference:{ officialOnly:true },
    candidates:[
      {
        providerId:"apple_official",
        platformName:"Apple 官方",
        trustLevel:"high",
        isOfficial:true,
        marketMatched:true,
        dataQuality:{ qualityScore:88 },
        providerCoverage:{ coverageScore:80 }
      },
      {
        providerId:"amazon_us",
        platformName:"Amazon",
        trustLevel:"medium",
        isOfficial:false,
        marketMatched:true,
        dataQuality:{ qualityScore:74 },
        providerCoverage:{ coverageScore:82 }
      }
    ]
  });
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_POLICY_ENGINE_VERSION, "4.2.8");
  assert.equal(result.policyDecision.recommendedProviderId, "apple_official");
  assert.equal(result.policyDecision.rankedProviderIds.length, 2);
  console.log("GLOBAL_SHOPPING_PROVIDER_POLICY_ENGINE PASS");
}

main();
