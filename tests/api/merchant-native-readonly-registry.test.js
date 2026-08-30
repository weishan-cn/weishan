const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.resolve(__dirname, "../..");
const {
  createMerchantNativeReadonlyService,
  validateFixedSourceUrl
} = require(path.join(ROOT, "apps/desktop/src/main/merchantNativeReadonlyServiceCore.js"));
const {
  SEARCH_CHANNEL,
  STATUS_CHANNEL,
  STATIC_SOURCE_DEFINITIONS,
  createMerchantNativeReadonlyRegistry,
  registerMerchantNativeReadonlyHandlers
} = require(path.join(ROOT, "apps/desktop/src/main/merchantNativeReadonlyRegistry.js"));
const { createTiendaCentroReadonlyService } = require(path.join(ROOT, "apps/desktop/src/main/tiendaCentroReadonlyService.js"));

function response(payload) {
  const bytes = Buffer.from(JSON.stringify(payload));
  let delivered = false;
  return {
    ok:true,
    headers:{ get:() => String(bytes.byteLength) },
    body:{
      getReader() {
        return {
          read:async () => delivered ? { done:true } : (delivered = true, { done:false, value:bytes }),
          cancel:async () => { delivered = true; },
          releaseLock() {}
        };
      }
    }
  };
}

function tiendaProduct() {
  return [{
    id:14035,
    name:"CELULAR IPHONE 17 256 GB NUEVO",
    permalink:"https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/",
    on_sale:true,
    prices:{
      price:"1564200",
      regular_price:"2450000",
      sale_price:"1564200",
      currency_code:"ARS",
      currency_minor_unit:0
    }
  }];
}

async function main() {
  assert.deepEqual(Object.keys(STATIC_SOURCE_DEFINITIONS).sort(), [
    "prijsprofeet_public_api",
    "tienda_centro_public_api"
  ]);
  assert.equal(Object.values(STATIC_SOURCE_DEFINITIONS).filter((item) => item.family === "broad_consumer_retail" && item.enabled).length, 1);
  assert.equal(STATIC_SOURCE_DEFINITIONS.tienda_centro_public_api.enabled, true);
  assert.equal("synthetic_test_merchant" in STATIC_SOURCE_DEFINITIONS, false);

  let tiendaCalls = 0;
  const tiendaService = createTiendaCentroReadonlyService({
    now:() => "2026-08-30T00:00:00.000Z",
    fetchImpl:async (url, init) => {
      tiendaCalls += 1;
      assert.equal(new URL(url).origin, "https://tiendacentro.com");
      assert.equal(init.method, "GET");
      assert.deepEqual(Object.keys(init.headers).sort(), ["Accept", "User-Agent"]);
      return response(tiendaProduct());
    }
  });
  const registry = createMerchantNativeReadonlyRegistry({ services:{ tienda_centro_public_api:tiendaService } });
  assert.deepEqual(registry.enabledSourceIds.slice().sort(), ["prijsprofeet_public_api", "tienda_centro_public_api"]);

  const valid = await registry.search({
    sourceId:"tienda_centro_public_api",
    request:{ query:"CELULAR IPHONE 17 256 GB NUEVO", requestId:"registry-1", limit:1 }
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.providerName, "Tienda Centro");
  assert.equal(valid.results.length, 1);
  assert.equal(tiendaCalls, 1);

  for (const invalid of [
    { sourceId:"unknown_merchant", request:{ query:"phone", requestId:"unknown" } },
    { sourceId:"tienda_centro_public_api", request:{ query:"phone", requestId:"extra" }, host:"evil.invalid" },
    Object.assign(Object.create({ polluted:true }), { sourceId:"tienda_centro_public_api", request:{} })
  ]) {
    const blocked = await registry.search(invalid);
    assert.equal(blocked.ok, false);
  }
  const unknown = await registry.search({ sourceId:"synthetic_test_merchant", request:{ query:"phone", requestId:"synthetic" } });
  assert.equal(unknown.code, "UNKNOWN_MERCHANT_SOURCE");
  const pollutedRequest = JSON.parse('{"sourceId":"tienda_centro_public_api","request":{"query":"phone","requestId":"polluted","__proto__":{"admin":true}}}');
  const polluted = await registry.search(pollutedRequest);
  assert.equal(polluted.code, "SOURCE_INPUT_INVALID");
  assert.equal({}.admin, undefined);

  const handlers = {};
  registerMerchantNativeReadonlyHandlers({ handle(channel, handler) { handlers[channel] = handler; } }, { registry });
  assert.deepEqual(Object.keys(handlers).sort(), [SEARCH_CHANNEL, STATUS_CHANNEL].sort());
  const rendererUrl = pathToFileURL(path.join(ROOT, "apps/desktop/src/index.html")).href;
  const mainFrame = { url:rendererUrl };
  const sender = { getURL:() => rendererUrl, mainFrame };
  const trustedEvent = { sender, senderFrame:mainFrame };
  const remoteFrame = { sender, senderFrame:{ url:"https://untrusted.invalid/frame" } };
  const subframe = { sender, senderFrame:{ url:rendererUrl } };
  assert.equal((await handlers[SEARCH_CHANNEL](remoteFrame, { sourceId:"tienda_centro_public_api", request:{} })).code, "SOURCE_CALLER_INVALID");
  assert.equal((await handlers[STATUS_CHANNEL](subframe, { sourceId:"tienda_centro_public_api" })).code, "SOURCE_CALLER_INVALID");
  assert.equal((await handlers[STATUS_CHANNEL](trustedEvent, { sourceId:"tienda_centro_public_api" })).providerName, "Tienda Centro");

  const fixedPolicy = {
    origin:"https://synthetic.invalid",
    method:"GET",
    allowedPath:(pathname) => pathname === "/public/products",
    allowedQueryKeys:new Set(["q"])
  };
  assert.equal(validateFixedSourceUrl("https://synthetic.invalid/public/products?q=phone", fixedPolicy), true);
  assert.equal(validateFixedSourceUrl("https://evil.invalid/public/products?q=phone", fixedPolicy), false);
  assert.equal(validateFixedSourceUrl("https://synthetic.invalid/private/products?q=phone", fixedPolicy), false);
  assert.equal(validateFixedSourceUrl("https://synthetic.invalid/public/products?url=https://evil.invalid", fixedPolicy), false);

  let syntheticCalls = 0;
  const synthetic = createMerchantNativeReadonlyService({
    version:"test-only",
    source:{
      sourceId:"synthetic_test_merchant",
      providerId:"synthetic_test_merchant",
      providerName:"Synthetic Test Merchant",
      sourceAttributionUrl:"https://synthetic.invalid/"
    },
    policy:fixedPolicy,
    limits:{
      timeoutMs:1000,
      maxResponseBytes:4096,
      cacheTtlMs:1000,
      maxCacheEntries:2,
      maxRequestsPerMinute:2,
      maxConcurrentRequests:1,
      maxRetries:0
    },
    async executeSource({ payload, requestJson }) {
      await requestJson("https://synthetic.invalid/public/products?q=" + encodeURIComponent(payload.query));
      return { status:"no_results", code:"SOURCE_NO_EXACT_RESULTS", requestCount:1, results:[] };
    }
  }, {
    now:() => "2026-08-30T00:00:00.000Z",
    fetchImpl:async () => { syntheticCalls += 1; return response([]); }
  });
  assert.equal((await synthetic.search({ query:"phone", requestId:"test-only" })).ok, true);
  assert.equal(syntheticCalls, 1);
  assert.equal((await registry.search({ sourceId:"synthetic_test_merchant", request:{ query:"phone", requestId:"runtime" } })).code, "UNKNOWN_MERCHANT_SOURCE");

  const mainSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/main.js"), "utf8");
  const preloadSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  assert.equal((mainSource.match(/registerMerchantNativeReadonlyHandlers/g) || []).length, 2);
  assert.equal(/registerPrijsProfeetReadonlyHandlers|registerTiendaCentroReadonlyHandlers/.test(mainSource), false);
  assert.equal(/prijsProfeetReadonlySearch|tiendaCentroReadonlySearch/.test(preloadSource), false);
  assert.match(preloadSource, /merchantNativeReadonlySearch/);
  assert.equal(/fetch\s*\(\s*url|invoke\s*\(\s*channel/.test(preloadSource), false);

  console.log("MERCHANT_NATIVE_READONLY_REGISTRY PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
