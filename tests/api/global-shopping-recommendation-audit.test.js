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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingRecommendationAudit.js");
  const api = windowRef.WeishanGlobalShoppingRecommendationAudit;
  const result = api.buildGlobalShoppingRecommendationAudit({
    decisionId:"audit:1",
    provider:"Amazon Japan",
    region:"JP",
    rankingFactors:["地区匹配度高", "可信度较高"],
    confidence:"medium",
    warnings:["价格以平台页面为准。"],
    gatewayPath:"provider_gateway/sandbox_only",
    permissionResult:{ allowed:true, requiredPermission:"search" },
    providerStatus:"registry_only",
    dataQuality:{ qualityLevel:"medium" },
    dataSource:{ sourceType:"sandbox" }
  });

  assert.equal(api.GLOBAL_SHOPPING_RECOMMENDATION_AUDIT_VERSION, "4.2.8");
  assert.equal(result.provider, "Amazon Japan");
  assert.equal(result.rankingFactors.length, 2);
  assert.equal(result.providerStatus, "registry_only");
  assert.equal(result.permissionResult.allowed, true);
  console.log("GLOBAL_SHOPPING_RECOMMENDATION_AUDIT PASS");
}

main();
