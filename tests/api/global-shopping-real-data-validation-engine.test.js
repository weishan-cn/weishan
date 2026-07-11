const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingDataFreshnessEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingDataQualityEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingRealDataValidationEngine.js"
  ]);
  const freshnessApi = windowRef.WeishanGlobalShoppingDataFreshnessEngine;
  const qualityApi = windowRef.WeishanGlobalShoppingDataQualityEngine;
  const api = windowRef.WeishanGlobalShoppingRealDataValidationEngine;

  const fresh = freshnessApi.buildGlobalShoppingDataFreshness({
    timestamp:"2026-07-10T00:00:00.000Z",
    now:"2026-07-10T00:03:00.000Z"
  });
  const highQuality = qualityApi.buildGlobalShoppingDataQuality({
    sourceTrust:"high",
    completeness:0.96,
    freshness:fresh,
    officialVerification:true,
    consistency:0.93
  });
  const validated = api.buildGlobalShoppingRealDataValidation({
    providerId:"rakuten_japan",
    title:"Nintendo Switch OLED",
    price:37980,
    currency:"JPY",
    expectedCurrency:"JPY",
    availability:"in_stock",
    officialUrl:"https://item.rakuten.co.jp/example/switch-oled/",
    dataFreshness:fresh,
    officialDomainStatus:{ verified:true, trustLevel:"verified" },
    responseProvenance:{
      providerIdentity:"rakuten_japan",
      responseProvenance:"rakuten_official_api",
      sourceType:"rakuten_api"
    },
    dataQuality:highQuality,
    sourceType:"rakuten_api"
  });

  const review = api.buildGlobalShoppingRealDataValidation({
    providerId:"rakuten_japan",
    title:"Nintendo Switch OLED",
    price:null,
    currency:"USD",
    expectedCurrency:"JPY",
    availability:"",
    officialUrl:"https://item.rakuten.co.jp/example/switch-oled/",
    dataFreshness:{ freshnessLevel:"expired" },
    officialDomainStatus:{ verified:true, trustLevel:"verified" },
    responseProvenance:{
      providerIdentity:"rakuten_japan",
      responseProvenance:"",
      sourceType:"rakuten_api"
    },
    dataQuality:{ qualityScore:0.62 }
  });

  const blocked = api.buildGlobalShoppingRealDataValidation({
    providerId:"",
    title:"",
    price:100,
    currency:"JPY",
    officialUrl:"https://unknown.example.com/item",
    dataFreshness:{ freshnessLevel:"fresh" },
    officialDomainStatus:{ verified:false, trustLevel:"blocked" },
    responseProvenance:{ sourceType:"unknown" },
    dataQuality:{ qualityScore:0.3 }
  });

  assert.equal(api.GLOBAL_SHOPPING_REAL_DATA_VALIDATION_ENGINE_VERSION, "4.2.8");
  assert.equal(validated.validationStatus, "validated");
  assert.equal(validated.confidence, "high");
  assert.equal(review.validationStatus, "needs_review");
  assert.equal(review.warnings.some((item) => /价格缺失/.test(item)), true);
  assert.equal(blocked.validationStatus, "blocked");
  assert.equal(blocked.blockers.includes("official_domain_unverified"), true);
  console.log("GLOBAL_SHOPPING_REAL_DATA_VALIDATION_ENGINE PASS");
}

main();
