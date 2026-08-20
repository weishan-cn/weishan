"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const {
  EBAY_SANDBOX_CLASSIFICATION,
  EBAY_SANDBOX_OAUTH_ENDPOINT,
  EBAY_SANDBOX_BROWSE_ENDPOINT,
  EBAY_CREDENTIAL_DESCRIPTOR,
  createEbaySandboxReadonlyValidator
} = require(path.join(ROOT, "apps/desktop/src/main/ebaySandboxReadonlyValidator.js"));

const TEST_CLIENT_ID = "WEISHAN_EBAY_TEST_CLIENT_ID";
const TEST_CLIENT_SECRET = "WEISHAN_EBAY_TEST_CLIENT_SECRET";
const TEST_TOKEN = "WEISHAN_EBAY_TEST_APPLICATION_TOKEN";

function response(status, payload) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async () => JSON.stringify(payload)
  };
}

function credentialStore() {
  return {
    mainProcess:{
      async withCredentialBundle(descriptor, types, callback) {
        assert.deepEqual(descriptor, EBAY_CREDENTIAL_DESCRIPTOR);
        assert.deepEqual(types, ["client_secret"]);
        const value = await callback({ client_secret:TEST_CLIENT_SECRET });
        assert.equal(JSON.stringify(value).includes(TEST_CLIENT_SECRET), false);
        return { ok:true, value, redacted:true };
      }
    }
  };
}

async function main() {
  const requests = [];
  const validator = createEbaySandboxReadonlyValidator({
    credentialStore:credentialStore(),
    fetchImpl:async (url, init) => {
      requests.push({ url, init });
      if (url === EBAY_SANDBOX_OAUTH_ENDPOINT) {
        assert.equal(init.method, "POST");
        assert.equal(init.headers.Authorization, "Basic " + Buffer.from(TEST_CLIENT_ID + ":" + TEST_CLIENT_SECRET).toString("base64"));
        assert.match(init.body, /grant_type=client_credentials/);
        assert.match(init.body, /scope=https%3A%2F%2Fapi\.ebay\.com%2Foauth%2Fapi_scope/);
        return response(200, { access_token:TEST_TOKEN, expires_in:7200, token_type:"Application Access Token" });
      }
      assert.match(url, new RegExp("^" + EBAY_SANDBOX_BROWSE_ENDPOINT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\?"));
      assert.equal(init.method, "GET");
      assert.equal(init.headers.Authorization, "Bearer " + TEST_TOKEN);
      assert.equal(init.headers["X-EBAY-C-MARKETPLACE-ID"], "EBAY_US");
      return response(200, {
        itemSummaries:[{
          itemId:"v1|sandbox-item|0",
          title:"Sandbox drone",
          price:{ value:"19.99", currency:"USD" },
          itemWebUrl:"https://www.sandbox.ebay.com/itm/sandbox-item",
          buyingOptions:["FIXED_PRICE"],
          itemEndDate:"2099-01-01T00:00:00.000Z"
        }]
      });
    }
  });

  const result = await validator.validate({ clientId:TEST_CLIENT_ID, query:"drone" });
  assert.equal(result.ok, true);
  assert.equal(result.classification, EBAY_SANDBOX_CLASSIFICATION);
  assert.equal(result.oauth, "PASS");
  assert.equal(result.browse, "PASS");
  assert.equal(result.sandboxItemReturned, true);
  assert.equal(result.priceCurrencyReturned, true);
  assert.equal(result.officialUrlReturned, true);
  assert.equal(result.item.title, "Sandbox drone");
  assert.deepEqual(result.item.price, { value:"19.99", currency:"USD" });
  assert.equal(result.item.availability.status, "OFFERED_BY_SANDBOX_LISTING");
  assert.equal(result.item.availability.authoritativeCurrentStock, false);
  assert.equal(result.item.realCurrentMarketPrice, false);
  assert.equal(result.item.purchasableAuthority, false);
  assert.equal(result.requestCount, 2);
  assert.equal(result.tokenPersisted, false);
  assert.equal(result.rawResponsePersisted, false);
  assert.equal(result.executionGate, "CLOSED");
  assert.equal(result.authorizesExecution, false);
  assert.equal(result.productionTraffic, false);
  assert.equal(result.transactionalCapabilities, false);
  const serialized = JSON.stringify(result);
  for (const forbidden of [TEST_CLIENT_ID, TEST_CLIENT_SECRET, TEST_TOKEN, "Authorization", "access_token"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden + " leaked");
  }
  assert.equal(requests.length, 2);

  let oauthFailureRequests = 0;
  const oauthFailure = await createEbaySandboxReadonlyValidator({
    credentialStore:credentialStore(),
    fetchImpl:async () => {
      oauthFailureRequests += 1;
      return response(401, { error:"invalid_client", error_description:TEST_CLIENT_SECRET });
    }
  }).validate({ clientId:TEST_CLIENT_ID });
  assert.equal(oauthFailure.ok, false);
  assert.equal(oauthFailure.oauth, "FAIL");
  assert.equal(oauthFailure.error.code, "HTTP_ERROR");
  assert.equal(oauthFailure.error.status, 401);
  assert.equal(oauthFailureRequests, 1);
  assert.equal(JSON.stringify(oauthFailure).includes(TEST_CLIENT_SECRET), false);

  let browseFailureRequests = 0;
  const browseFailure = await createEbaySandboxReadonlyValidator({
    credentialStore:credentialStore(),
    fetchImpl:async () => {
      browseFailureRequests += 1;
      return browseFailureRequests === 1
        ? response(200, { access_token:TEST_TOKEN })
        : response(403, { message:TEST_TOKEN });
    }
  }).validate({ clientId:TEST_CLIENT_ID });
  assert.equal(browseFailure.ok, false);
  assert.equal(browseFailure.oauth, "PASS");
  assert.equal(browseFailure.browse, "FAIL");
  assert.equal(browseFailure.error.status, 403);
  assert.equal(browseFailureRequests, 2);
  assert.equal(JSON.stringify(browseFailure).includes(TEST_TOKEN), false);

  const invalidClient = await validator.validate({ clientId:"invalid client id" });
  assert.equal(invalidClient.ok, false);
  assert.equal(invalidClient.error.code, "INVALID_CLIENT_ID");
  assert.equal(invalidClient.requestCount, 0);

  const missingStore = await createEbaySandboxReadonlyValidator({ fetchImpl:async () => response(500, {}) })
    .validate({ clientId:TEST_CLIENT_ID });
  assert.equal(missingStore.error.code, "CREDENTIAL_STORE_UNAVAILABLE");
  assert.equal(missingStore.requestCount, 0);

  let unsafeUrlRequests = 0;
  const unsafeUrlResult = await createEbaySandboxReadonlyValidator({
    credentialStore:credentialStore(),
    fetchImpl:async () => {
      unsafeUrlRequests += 1;
      return unsafeUrlRequests === 1
        ? response(200, { access_token:TEST_TOKEN })
        : response(200, { itemSummaries:[{ itemId:"x", title:"x", price:{ value:"1", currency:"USD" }, itemWebUrl:"https://evil.example/item" }] });
    }
  }).validate({ clientId:TEST_CLIENT_ID });
  assert.equal(unsafeUrlResult.ok, true);
  assert.equal(unsafeUrlResult.sandboxItemReturned, true);
  assert.equal(unsafeUrlResult.priceCurrencyReturned, true);
  assert.equal(unsafeUrlResult.officialUrlReturned, false);
  assert.equal(unsafeUrlResult.item.officialItemWebUrl, null);
  assert.equal(unsafeUrlRequests, 2);

  const moduleSource = require("node:fs").readFileSync(path.join(ROOT, "apps/desktop/src/main/ebaySandboxReadonlyValidator.js"), "utf8");
  const mainSource = require("node:fs").readFileSync(path.join(ROOT, "apps/desktop/src/main.js"), "utf8");
  assert.equal(moduleSource.includes("api.ebay.com/identity/v1/oauth2/token"), false);
  assert.equal(moduleSource.includes("provider-credential:list-metadata"), false);
  assert.equal(moduleSource.includes("ipcMain"), false);
  assert.equal(mainSource.includes("WEISHAN_EBAY_SANDBOX_VALIDATE"), true);
  assert.equal(mainSource.includes("ebay-sandbox-readonly-validator"), true);

  console.log("EBAY_SANDBOX_READONLY_VALIDATOR PASS requests=2 classification=SANDBOX_TEST_DATA");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
