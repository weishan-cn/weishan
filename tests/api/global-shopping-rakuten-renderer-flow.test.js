const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files, extraWindow = {}) {
  const window = Object.assign({
    localStorage:{
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    }
  }, extraWindow);
  window.window = window;
  const context = vm.createContext({ window, console, URL, setTimeout, clearTimeout, fetch:async () => ({ ok:false, status:500, json:async () => ({}) }) });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

async function main() {
  const files = [
    "apps/desktop/src/renderer/core/globalShoppingProviderConfigurationSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFeatureFlag.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderVersionRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderProductionReadiness.js",
    "apps/desktop/src/renderer/core/globalShoppingRealProviderExecutionGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseSafetyFilter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderErrorNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGateway.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultRanker.js",
    "apps/desktop/src/renderer/core/globalShoppingDecisionEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySearchResultPresenter.js",
    "apps/desktop/src/renderer/core/commerceSearch.js"
  ];
  const windowRef = load(files, {
    WeishanCommerceLocalLawCompliance:{
      evaluateLocalLawCompliance() {
        return {
          complianceVersion:"4.2.8",
          phase:"local_law_compliance_gate",
          complianceStatus:"verified_readonly",
          searchStatus:"allowed",
          canSearchProvider:true,
          canDisplayPrice:true,
          canShowRedirectButton:true,
          canCheckout:false,
          canPay:false,
          canStoreIdentity:false,
          canShowPrice:true,
          canShowBookingButton:true,
          canShowCheckoutButton:false,
          strictestRuleWins:true,
          unknownLegalityBlocks:true,
          noLegalAdvice:true,
          reason:"readonly_search_allowed",
          privacy:{ storeRawCoordinates:false, logRawCoordinates:false, shareWithThirdParty:false, useForAds:false, useForTracking:false },
          safety:{ noRealLegalDatabase:true, noNetworkLegalLookup:true, noPriceDisplayWhenUnverified:true, noRedirectWhenUnverified:true, noCheckout:true, noPayment:true, noOrderSubmit:true, noIdentityStorage:true }
        };
      },
      explainLocalLawBlockReason() {
        return "readonly_search_allowed";
      }
    },
    WeishanCommerceLocationPolicy:{
      locationHealthForCommerce() {
        return {
          shippingDestination:{ country:"JP", configured:true, source:"manual" },
          shippingDestinationRequiredForAccuratePrice:true,
          hasShippingDestination:true,
          locationRequiredForAccuratePrice:false,
          hasPreciseLocation:false,
          canCalculateAccurateLandedCost:true,
          canShowAccuratePrice:true,
          canShowRedirectButton:true,
          canShowPrice:true,
          canShowBookingButton:true,
          canShowCheckoutButton:false,
          landedCostAccuracy:"estimated"
        };
      }
    },
    weishanGlobalShopping:{
      getRakutenReadonlyStatus:async () => ({
        connected:false,
        readinessLevel:"sandbox",
        executionMode:"external_link_only",
        providerId:"rakuten_japan"
      })
    },
    WeishanGlobalShoppingPlatformCandidateFactory:{
      buildGlobalShoppingPlatformCandidates() {
        return [
          {
            id:"fallback-1",
            platformName:"Rakuten",
            title:"Nintendo Switch OLED",
            targetUrl:"https://search.rakuten.co.jp/search/mall/Nintendo%20Switch/",
            priceLabel:"到平台查看实时价格",
            currency:"JPY",
            isOfficial:true,
            trustLevel:"high",
            sourceType:"official",
            feeNote:"最终价格以平台页面为准",
            riskNote:"Weishan 不收款、不代下单、不保存平台账号密码。",
            recommendationReason:"官方入口"
          }
        ];
      }
    }
  });

  const api = windowRef.WeishanCommerceSearch;
  const result = await api.searchCommerceCandidates({
    taskId:"TASK-1",
    category:"ecommerce",
    inputSummary:"帮我找 Nintendo Switch 价格"
  });
  assert.equal(result.ok, true);
  assert.equal(result.providerName, "Rakuten");
  assert.equal(result.realProviderReadonlyStatus.executionMode, "external_link_only");
  assert.equal(result.readOnlySearchTopResults.length, 1);
  assert.equal(result.readOnlySearchTopResults[0].platformName, "Rakuten");
  console.log("GLOBAL_SHOPPING_RAKUTEN_RENDERER_FLOW PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
