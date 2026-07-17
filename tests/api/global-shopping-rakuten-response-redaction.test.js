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
      RAKUTEN_ACCESS_KEY:"runtime-access-key"
    },
    fetchImpl:async () => createResponse(200, {
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
          shopUrl:"https://www.rakuten.co.jp/example/",
          availability:1
        }
      ]
    })
  });
  const result = await service.search({
    keyword:"Support",
    page:1,
    hits:3,
    sort:"standard",
    destinationCountry:"JP",
    currency:"JPY"
  });
  assert.equal(result.status, "degraded");
  assert.equal(result.error.category, "response_redacted_blocked");
  console.log("GLOBAL_SHOPPING_RAKUTEN_RESPONSE_REDACTION PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
