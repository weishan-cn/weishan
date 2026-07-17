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
  const service = createGlobalShoppingRakutenReadonlyService({
    env:{
      RAKUTEN_APPLICATION_ID:"runtime-app-id",
      RAKUTEN_ACCESS_KEY:"runtime-access-key",
      RAKUTEN_AFFILIATE_ID:"runtime-affiliate-id"
    },
    fetchImpl:async () => createResponse(200, {
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
    })
  });
  const result = await service.search({
    keyword:"Nintendo",
    page:1,
    hits:3,
    sort:"standard",
    destinationCountry:"JP",
    currency:"JPY"
  });
  const raw = JSON.stringify(result);
  for (const forbidden of ["runtime-app-id", "runtime-access-key", "runtime-affiliate-id", "applicationId", "accessKey", "affiliateId", "requestUrl", "authorization"]) {
    assert.equal(raw.includes(forbidden), false, forbidden + " should not leak to renderer");
  }
  console.log("GLOBAL_SHOPPING_RAKUTEN_CREDENTIAL_ISOLATION PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
