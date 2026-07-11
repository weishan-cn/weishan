const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files, extraContext = {}) {
  const window = {};
  window.window = window;
  const context = vm.createContext(Object.assign({
    window,
    console,
    URL,
    AbortController,
    setTimeout,
    clearTimeout
  }, extraContext));
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function createResponse(status, payload) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async function () {
      return JSON.stringify(payload);
    }
  };
}

async function main() {
  const files = [
    "apps/desktop/src/renderer/core/globalShoppingProviderCapabilityModel.js",
    "apps/desktop/src/renderer/core/globalShoppingAdapterCapabilityResolver.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderConfigurationSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFeatureFlag.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderVersionRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenAuthAbstraction.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRequestSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenResponseSchema.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenFieldMapping.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRateLimitModel.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenErrorMapping.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenAuditTrace.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRealProviderAdapterContractLayer.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderProductionReadiness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPermissionModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderResponseSafetyFilter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderErrorNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingDataFreshnessEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingDataQualityEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingRealDataValidationEngine.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialDomainVerifier.js",
    "apps/desktop/src/renderer/core/globalShoppingRecommendationAudit.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterContract.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGateway.js",
    "apps/desktop/src/renderer/core/globalShoppingRakutenRealProviderAdapter.js"
  ];

  let fetchCalls = 0;
  const windowRef = load(files);
  const api = windowRef.WeishanGlobalShoppingRakutenRealProviderAdapter;
  const adapter = api.createGlobalShoppingRakutenRealProviderAdapter({
    runtime:{
      allowRealProviderReadonly:true,
      env:{
        RAKUTEN_APPLICATION_ID:"runtime-app-id",
        RAKUTEN_ACCESS_KEY:"runtime-access-key"
      },
      fetchImpl:async function (url) {
        fetchCalls += 1;
        assert.match(url, /keyword=Nintendo/);
        return createResponse(200, {
          count:1,
          page:1,
          hits:1,
          pageCount:1,
          items:[
            {
              itemName:"Nintendo Switch OLED",
              itemPrice:37980,
              itemUrl:"https://item.rakuten.co.jp/example/switch-oled/",
              shopName:"Rakuten Official Store",
              shopUrl:"https://www.rakuten.co.jp/example/",
              availability:1
            }
          ]
        });
      }
    }
  });

  const success = await adapter.searchProducts({ keyword:"Nintendo" });
  assert.equal(api.GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER_VERSION, "4.2.8");
  assert.equal(success.status, "ready");
  assert.equal(success.sourceType, "rakuten_api");
  assert.equal(success.results.length, 1);
  assert.equal(success.results[0].title, "Nintendo Switch OLED");
  assert.equal(success.results[0].price, 37980);
  assert.equal(success.results[0].dataSource.sourceType, "rakuten_api");
  assert.equal(success.results[0].realDataValidation.validationStatus, "validated");
  assert.equal(success.results[0].priceFreshness.freshnessLevel, "fresh");
  assert.equal(fetchCalls, 1);

  const invalidAdapter = api.createGlobalShoppingRakutenRealProviderAdapter({
    runtime:{
      allowRealProviderReadonly:true,
      env:{
        RAKUTEN_APPLICATION_ID:"runtime-app-id",
        RAKUTEN_ACCESS_KEY:"runtime-access-key"
      },
      fetchImpl:async function () {
        return createResponse(200, {
          count:1,
          page:1,
          hits:1,
          pageCount:1,
          items:[{ itemName:"Broken item" }]
        });
      }
    }
  });
  const invalid = await invalidAdapter.searchProducts({ keyword:"Nintendo" });
  assert.equal(invalid.status, "blocked");
  assert.equal(invalid.error.message.includes("itemPrice_missing_0"), true);

  const timeoutAdapter = api.createGlobalShoppingRakutenRealProviderAdapter({
    runtime:{
      allowRealProviderReadonly:true,
      env:{
        RAKUTEN_APPLICATION_ID:"runtime-app-id",
        RAKUTEN_ACCESS_KEY:"runtime-access-key"
      },
      fetchImpl:async function () {
        const error = new Error("aborted");
        error.name = "AbortError";
        throw error;
      }
    }
  });
  const timeout = await timeoutAdapter.searchProducts({ keyword:"Nintendo" });
  assert.equal(timeout.status, "blocked");
  assert.equal(timeout.error.category, "timeout");

  let rateLimitAttempts = 0;
  const rateLimitAdapter = api.createGlobalShoppingRakutenRealProviderAdapter({
    runtime:{
      allowRealProviderReadonly:true,
      retryLimit:1,
      retryDelayMs:1,
      env:{
        RAKUTEN_APPLICATION_ID:"runtime-app-id",
        RAKUTEN_ACCESS_KEY:"runtime-access-key"
      },
      fetchImpl:async function () {
        rateLimitAttempts += 1;
        return createResponse(429, { message:"rate limited" });
      }
    }
  });
  const rateLimit = await rateLimitAdapter.searchProducts({ keyword:"Nintendo" });
  assert.equal(rateLimit.status, "blocked");
  assert.equal(rateLimit.error.category, "rate_limit");
  assert.equal(rateLimitAttempts, 2);

  const unauthorizedAdapter = api.createGlobalShoppingRakutenRealProviderAdapter({
    runtime:{
      allowRealProviderReadonly:true,
      env:{
        RAKUTEN_APPLICATION_ID:"runtime-app-id",
        RAKUTEN_ACCESS_KEY:"runtime-access-key"
      },
      fetchImpl:async function () {
        return createResponse(401, { message:"unauthorized" });
      }
    }
  });
  const unauthorized = await unauthorizedAdapter.searchProducts({ keyword:"Nintendo" });
  assert.equal(unauthorized.status, "blocked");
  assert.equal(unauthorized.error.category, "unauthorized");

  const missingCredentials = api.createGlobalShoppingRakutenRealProviderAdapter({
    runtime:{
      allowRealProviderReadonly:true,
      fetchImpl:async function () {
        throw new Error("should not fetch");
      }
    }
  });
  const missing = await missingCredentials.searchProducts({ keyword:"Nintendo" });
  assert.equal(missing.status, "blocked");
  assert.equal(missing.error.message, "runtime_credentials_missing");

  const filteredAdapter = api.createGlobalShoppingRakutenRealProviderAdapter({
    runtime:{
      allowRealProviderReadonly:true,
      env:{
        RAKUTEN_APPLICATION_ID:"runtime-app-id",
        RAKUTEN_ACCESS_KEY:"runtime-access-key"
      },
      fetchImpl:async function () {
        return createResponse(200, {
          count:1,
          page:1,
          hits:1,
          pageCount:1,
          items:[
            {
              itemName:"Support package",
              itemPrice:1200,
              itemUrl:"https://item.rakuten.co.jp/example/support-package/",
              shopName:"support@example.com",
              shopUrl:"https://www.rakuten.co.jp/example/"
            }
          ]
        });
      }
    }
  });
  const filtered = await filteredAdapter.searchProducts({ keyword:"Support" });
  assert.equal(filtered.status, "ready");
  assert.equal(filtered.filteredFields.includes("providerName"), true);
  assert.equal(filtered.results[0].providerName, "[redacted]");

  const gateway = windowRef.WeishanGlobalShoppingProviderGateway;
  const gatewayResult = await gateway.buildGlobalShoppingProviderGatewayResultAsync({
    providerId:"rakuten_japan",
    operation:"searchProducts",
    executionMode:"real_provider_readonly",
    payload:{ keyword:"Nintendo" },
    regionContext:{ country:"JP" },
    runtime:{
      allowRealProviderReadonly:true,
      env:{
        RAKUTEN_APPLICATION_ID:"runtime-app-id",
        RAKUTEN_ACCESS_KEY:"runtime-access-key"
      },
      fetchImpl:async function () {
        return createResponse(200, {
          count:1,
          page:1,
          hits:1,
          pageCount:1,
          items:[
            {
              itemName:"Nintendo Switch Lite",
              itemPrice:21980,
              itemUrl:"https://item.rakuten.co.jp/example/switch-lite/",
              shopName:"Rakuten Official Store",
              shopUrl:"https://www.rakuten.co.jp/example/"
            }
          ]
        });
      }
    }
  });
  assert.equal(gatewayResult.status, "real_provider_readonly");
  assert.equal(gatewayResult.result.sourceType, "rakuten_api");
  assert.equal(gatewayResult.metadata.gatewayMode, "real_provider_readonly");
  assert.equal(gatewayResult.metadata.productionReadiness.readinessLevel, "sandbox");
  assert.equal(gatewayResult.result.normalizedResults.length, 1);

  console.log("GLOBAL_SHOPPING_RAKUTEN_REAL_PROVIDER_ADAPTER PASS");
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
