const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const {
  createGlobalShoppingRakutenReadonlyService
} = require(path.join(ROOT, "apps/desktop/src/main/globalShoppingRakutenReadonlyService.js"));

function createResponse(status, payload) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async () => JSON.stringify(payload)
  };
}

async function main() {
  let attempts = 0;
  const service = createGlobalShoppingRakutenReadonlyService({
    env:{
      RAKUTEN_APPLICATION_ID:"runtime-app-id",
      RAKUTEN_ACCESS_KEY:"runtime-access-key"
    },
    now:() => "2026-07-11T00:00:00.000Z",
    providerApproval:"APPROVED_FOR_READONLY_TEST",
    retryLimit:1,
    fetchImpl:async (url) => {
      attempts += 1;
      assert.match(url, /openapi\.rakuten\.co\.jp/);
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
  });

  const result = await service.search({
    keyword:"Nintendo",
    page:1,
    hits:3,
    sort:"standard",
    destinationCountry:"JP",
    currency:"JPY"
  });
  assert.equal(result.status, "ready");
  assert.equal(result.sourceType, "rakuten_official_api");
  assert.equal(result.resultCount, 1);
  assert.equal(result.results[0].title, "Nintendo Switch OLED");
  assert.equal(result.results[0].officialDomainStatus.verified, true);
  assert.equal(result.results[0].realDataValidation.validationStatus, "validated");
  assert.equal(result.results[0].dataSource.sourceType, "rakuten_official_api");
  assert.equal(JSON.stringify(result).includes("runtime-access-key"), false);
  assert.equal(attempts, 1);

  let lazyInitCalls = 0;
  const lazyService = createGlobalShoppingRakutenReadonlyService({
    env:{},
    createSharedApis:() => {
      lazyInitCalls += 1;
      throw new Error("shared init failed");
    },
    fetchImpl:async () => {
      throw new Error("should not fetch");
    }
  });
  assert.equal(lazyInitCalls, 0);
  const unavailable = await lazyService.search({
    keyword:"Nintendo",
    page:1,
    hits:3,
    sort:"standard",
    destinationCountry:"JP",
    currency:"JPY"
  });
  assert.equal(lazyInitCalls, 1);
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.error.category, "shared_api_initialization_failed");
  const unavailableStatus = lazyService.getStatus();
  assert.equal(unavailableStatus.status, "unavailable");
  assert.equal(lazyInitCalls, 1);

  const missingCredentialService = createGlobalShoppingRakutenReadonlyService({
    env:{},
    fetchImpl:async () => {
      throw new Error("should not fetch");
    }
  });
  const degraded = await missingCredentialService.search({
    keyword:"Nintendo",
    page:1,
    hits:3,
    sort:"standard",
    destinationCountry:"JP",
    currency:"JPY"
  });
  assert.equal(degraded.status, "degraded");
  assert.equal(degraded.error.category, "not_approved");
  assert.equal(missingCredentialService.manualLiveCheckStatus(), "REAL_PROVIDER_LIVE_CHECK BLOCKED_PROVIDER_NOT_APPROVED");

  let retryCalls = 0;
  const rateLimitService = createGlobalShoppingRakutenReadonlyService({
    env:{
      RAKUTEN_APPLICATION_ID:"runtime-app-id",
      RAKUTEN_ACCESS_KEY:"runtime-access-key"
    },
    retryLimit:1,
    providerApproval:"APPROVED_FOR_READONLY_TEST",
    fetchImpl:async () => {
      retryCalls += 1;
      return createResponse(429, { message:"rate limited" });
    }
  });
  const rateLimited = await rateLimitService.search({
    keyword:"Nintendo",
    page:1,
    hits:3,
    sort:"standard",
    destinationCountry:"JP",
    currency:"JPY"
  });
  assert.equal(rateLimited.status, "degraded");
  assert.equal(rateLimited.error.category, "rate_limit");
  assert.equal(retryCalls, 2);

  console.log("GLOBAL_SHOPPING_RAKUTEN_MAIN_READONLY_SERVICE PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
