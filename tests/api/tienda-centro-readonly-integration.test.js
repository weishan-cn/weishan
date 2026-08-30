const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");

const ROOT = path.resolve(__dirname, "../..");
const {
  API_ORIGIN,
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_TIMEOUT_MS,
  MAX_CONCURRENT_PROVIDER_REQUESTS,
  MAX_PROVIDER_REQUESTS_PER_MINUTE,
  exactProductIdentityMatch,
  createTiendaCentroReadonlyService,
  SOURCE_ID
} = require(path.join(ROOT, "apps/desktop/src/main/tiendaCentroReadonlyService.js"));
const {
  SEARCH_CHANNEL,
  STATUS_CHANNEL,
  registerMerchantNativeReadonlyHandlers
} = require(path.join(ROOT, "apps/desktop/src/main/merchantNativeReadonlyRegistry.js"));

function response(payload, status = 200) {
  const bytes = Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload));
  let delivered = false;
  return {
    ok:status >= 200 && status < 300,
    status,
    headers:{ get:(name) => String(name).toLowerCase() === "content-length" ? String(bytes.byteLength) : null },
    body:{
      getReader(){
        return {
          read:async () => delivered ? { done:true } : (delivered = true, { done:false, value:bytes }),
          cancel:async () => { delivered = true; },
          releaseLock(){}
        };
      }
    }
  };
}

function product(overrides = {}) {
  return Object.assign({
    id:14035,
    name:"CELULAR IPHONE 17 256 GB NUEVO",
    slug:"celular-iphone-17-256-gb-nuevo",
    permalink:"https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/",
    on_sale:true,
    prices:{
      price:"1564200",
      regular_price:"2450000",
      sale_price:"1564200",
      currency_code:"ARS",
      currency_minor_unit:0
    }
  }, overrides);
}

function loadRendererAdapter() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, console, Date });
  [
    "apps/desktop/src/renderer/core/readOnlyPriceTruthLayer.js",
    "apps/desktop/src/renderer/core/tiendaCentroReadonlyAdapter.js"
  ].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window.WeishanTiendaCentroReadonlyAdapter;
}

async function testHappyPathAndTruthLayer() {
  const calls = [];
  const service = createTiendaCentroReadonlyService({
    now:() => "2026-08-29T15:58:48.201Z",
    fetchImpl:async (url, init) => {
      calls.push({ url, init });
      return response([product()]);
    }
  });
  const result = await service.search({ query:"CELULAR IPHONE 17 256 GB NUEVO", requestId:"request-1", limit:1 });
  assert.equal(result.ok, true);
  assert.equal(result.status, "ready");
  assert.equal(result.requestCount, 1);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].price, 1564200);
  assert.equal(result.results[0].currency, "ARS");
  assert.equal(result.results[0].currencyMinorUnit, 0);
  assert.equal(result.results[0].regularPrice, 2450000);
  assert.equal(result.results[0].salePrice, 1564200);
  assert.equal(result.results[0].onSale, true);
  assert.equal(result.results[0].condition, "NEW");
  assert.equal(result.results[0].availabilityStatus, "UNKNOWN");
  assert.equal(result.results[0].shippingStatus, "UNKNOWN");
  assert.equal(result.results[0].taxStatus, "UNKNOWN");
  assert.equal(result.results[0].feesStatus, "UNKNOWN");
  assert.equal(result.results[0].officialUrl, "https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/");
  assert.equal(result.executionGate, "CLOSED");
  assert.equal(result.authorizesExecution, false);
  assert.equal(result.productionTraffic, false);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/tiendacentro\.com\/wp-json\/wc\/store\/v1\/products\?/);
  assert.equal(new URL(calls[0].url).searchParams.get("search"), "CELULAR IPHONE 17 256 GB NUEVO");
  assert.equal(new URL(calls[0].url).searchParams.get("per_page"), "3");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.redirect, "error");
  assert.deepEqual(Object.keys(calls[0].init.headers).sort(), ["Accept", "User-Agent"]);
  assert.equal(JSON.stringify(result).match(/authorization|api[_-]?key|secret|token/i), null);

  const adapter = loadRendererAdapter();
  const normalized = adapter.normalizeResult(result, { evaluatedAt:"2026-08-29T15:58:49.201Z" });
  assert.equal(normalized.ok, true);
  assert.equal(normalized.candidates.length, 1);
  assert.equal(normalized.candidates[0].priceLabel, "ARS 1564200");
  assert.equal(normalized.candidates[0].merchantName, "Tienda Centro");
  assert.equal(normalized.candidates[0].sourceType, "tienda_centro_public_api");
  assert.equal(normalized.candidates[0].onSale, true);
  assert.equal(normalized.candidates[0].regularPrice, 2450000);
  assert.equal(normalized.candidates[0].truthEvidence.evidenceTruthClass, "REAL_PROVIDER_PRICE");
  assert.equal(normalized.candidates[0].truthEvidence.sourceType, "PUBLIC_READ_ONLY");
  assert.equal(normalized.candidates[0].truthEvidence.displayAsLiveCurrentPrice, true);
  assert.equal(normalized.candidates[0].truthEvidence.comparableAsVerifiedTotal, false);
  assert.equal(normalized.candidates[0].truthEvidence.availabilityStatus, "UNKNOWN");
  assert.equal(normalized.candidates[0].truthEvidence.shipping, null);
  assert.equal(normalized.candidates[0].truthEvidence.taxes, null);
  assert.equal(normalized.candidates[0].truthEvidence.fees, null);
  assert.equal(normalized.candidates[0].targetUrl, "https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/");
}

async function testExactIdentityAndFailClosedResponses() {
  assert.equal(exactProductIdentityMatch("IPHONE 17 256 GB", "CELULAR IPHONE 17 256 GB NUEVO"), true);
  assert.equal(exactProductIdentityMatch("IPHONE 17 256 GB", "CELULAR IPHONE 16 256 GB NUEVO"), false);
  assert.equal(exactProductIdentityMatch("IPHONE", "CELULAR IPHONE 17 256 GB NUEVO"), false);

  const unused = async () => { throw new Error("must not fetch"); };
  const inputService = createTiendaCentroReadonlyService({ fetchImpl:unused });
  for (const payload of [
    { query:"", requestId:"x" },
    { query:"https://example.com", requestId:"x" },
    { query:"IPHONE 17", requestId:"x", url:"https://evil.example" },
    { query:"IPHONE 17", requestId:"x", headers:{ authorization:"Bearer test" } },
    { query:{ value:"IPHONE 17" }, requestId:"x" },
    { query:"IPHONE 17", requestId:{ value:"x" } },
    { query:"IPHONE 17", requestId:"" },
    Object.assign(Object.create({ inherited:true }), { query:"IPHONE 17", requestId:"prototype" }),
    JSON.parse('{"query":"IPHONE 17","requestId":"prototype-key","__proto__":{"trusted":true}}')
  ]) {
    const result = await inputService.search(payload);
    assert.equal(result.ok, false);
    assert.equal(result.code, "SOURCE_INPUT_INVALID");
  }

  for (const [requestId, item] of [
    ["adjacent", product({ name:"CELULAR IPHONE 16 256 GB NUEVO" })],
    ["wrong-host", product({ permalink:"https://shop.tiendacentro.com/product" })],
    ["unsafe-path", product({ permalink:"https://tiendacentro.com/checkout/product" })],
    ["query-url", product({ permalink:"https://tiendacentro.com/celulares/iphone/?token=value" })],
    ["zero-price", product({ prices:Object.assign({}, product().prices, { price:"0" }) })],
    ["missing-currency", product({ prices:Object.assign({}, product().prices, { currency_code:"" }) })]
  ]) {
    const service = createTiendaCentroReadonlyService({
      now:() => "2026-08-29T15:58:48.201Z",
      fetchImpl:async () => response([item])
    });
    const result = await service.search({ query:"CELULAR IPHONE 17 256 GB NUEVO", requestId });
    assert.equal(result.ok, true);
    assert.equal(result.status, "no_results");
    assert.equal(result.results.length, 0);
  }

  const noFakeSale = createTiendaCentroReadonlyService({
    now:() => "2026-08-29T15:58:48.201Z",
    fetchImpl:async () => response([product({ on_sale:true, prices:Object.assign({}, product().prices, { sale_price:"2000000" }) })])
  });
  const noFakeSaleResult = await noFakeSale.search({ query:"CELULAR IPHONE 17 256 GB NUEVO", requestId:"sale" });
  assert.equal(noFakeSaleResult.results[0].onSale, false);
  assert.equal(noFakeSaleResult.results[0].regularPrice, null);
  assert.equal(noFakeSaleResult.results[0].salePrice, null);

  const malformedService = createTiendaCentroReadonlyService({ fetchImpl:async () => response("{not-json") });
  const malformed = await malformedService.search({ query:"IPHONE 17", requestId:"json" });
  assert.equal(malformed.ok, false);
  assert.equal(malformed.code, "SOURCE_RESPONSE_INVALID");

  let oversizedReads = 0;
  let oversizedCancelled = false;
  const tooLargeService = createTiendaCentroReadonlyService({
    maxResponseBytes:4096,
    fetchImpl:async () => ({
      ok:true,
      headers:{ get:() => null },
      body:{ getReader:() => ({
        read:async () => {
          oversizedReads += 1;
          if (oversizedReads <= 3) return { done:false, value:Buffer.alloc(2500, 120) };
          return { done:true };
        },
        cancel:async () => { oversizedCancelled = true; },
        releaseLock(){}
      }) }
    })
  });
  const tooLarge = await tooLargeService.search({ query:"IPHONE 17", requestId:"large" });
  assert.equal(tooLarge.ok, false);
  assert.equal(tooLarge.code, "SOURCE_RESPONSE_TOO_LARGE");
  assert.equal(oversizedReads, 2);
  assert.equal(oversizedCancelled, true);
}

async function testBoundsDedupeAndIpcBoundary() {
  const timeoutService = createTiendaCentroReadonlyService({
    timeoutMs:1000,
    fetchImpl:(_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name:"AbortError" })));
    })
  });
  const timedOut = await timeoutService.search({ query:"IPHONE 17", requestId:"timeout" });
  assert.equal(timedOut.ok, false);
  assert.equal(timedOut.code, "SOURCE_TIMEOUT");

  let calls = 0;
  let releaseSearch;
  const searchPromise = new Promise((resolve) => { releaseSearch = resolve; });
  const dedupeService = createTiendaCentroReadonlyService({
    now:() => "2026-08-29T15:58:48.201Z",
    fetchImpl:async () => { calls += 1; await searchPromise; return response([product()]); }
  });
  const first = dedupeService.search({ query:"CELULAR IPHONE 17 256 GB NUEVO", requestId:"dedupe-1" });
  const second = dedupeService.search({ query:"celular iphone 17 256 gb nuevo", requestId:"dedupe-2" });
  releaseSearch();
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(firstResult.requestId, "dedupe-1");
  assert.equal(secondResult.requestId, "dedupe-2");
  const cached = await dedupeService.search({ query:"CELULAR IPHONE 17 256 GB NUEVO", requestId:"cache" });
  assert.equal(calls, 1);
  assert.equal(cached.requestCount, 0);
  assert.equal(cached.cacheStatus, "memory_hit");

  const handlers = {};
  registerMerchantNativeReadonlyHandlers({ handle(channel, handler) { handlers[channel] = handler; } }, {
    services:{ [SOURCE_ID]:dedupeService }
  });
  assert.deepEqual(Object.keys(handlers).sort(), [SEARCH_CHANNEL, STATUS_CHANNEL].sort());
  const rendererUrl = pathToFileURL(path.join(ROOT, "apps/desktop/src/index.html")).href;
  const mainFrame = { url:rendererUrl };
  const sender = { getURL:() => rendererUrl, mainFrame };
  const trustedEvent = { sender, senderFrame:mainFrame };
  const remoteEvent = { sender, senderFrame:{ url:"https://untrusted.invalid/frame" } };
  assert.equal((await handlers[SEARCH_CHANNEL](remoteEvent, { sourceId:SOURCE_ID, request:{ query:"IPHONE 17", requestId:"blocked" } })).code, "SOURCE_CALLER_INVALID");
  const status = await handlers[STATUS_CHANNEL](trustedEvent, { sourceId:SOURCE_ID });
  assert.equal(status.allowedMethods.join(","), "GET");
  assert.equal(status.responsePolicy.maxBytes, DEFAULT_MAX_RESPONSE_BYTES);
  assert.equal(status.responsePolicy.timeoutMs, DEFAULT_TIMEOUT_MS);
  assert.equal(status.throttlePolicy.maxProviderRequests, MAX_PROVIDER_REQUESTS_PER_MINUTE);
  assert.equal(status.throttlePolicy.maxConcurrentRequests, MAX_CONCURRENT_PROVIDER_REQUESTS);
  assert.equal(status.throttlePolicy.retryCount, 0);
  assert.equal(status.executionGate, "CLOSED");

  let limitedCalls = 0;
  const limitedService = createTiendaCentroReadonlyService({
    now:() => "2026-08-29T15:58:48.201Z",
    fetchImpl:async () => { limitedCalls += 1; return response([]); }
  });
  for (let index = 0; index < MAX_PROVIDER_REQUESTS_PER_MINUTE; index += 1) {
    const allowed = await limitedService.search({ query:"query " + index, requestId:"rate-" + index });
    assert.equal(allowed.ok, true);
  }
  const limited = await limitedService.search({ query:"query overflow", requestId:"rate-overflow" });
  assert.equal(limited.ok, false);
  assert.equal(limited.code, "SOURCE_RATE_LIMITED");
  assert.equal(limitedCalls, MAX_PROVIDER_REQUESTS_PER_MINUTE);

  const releases = [];
  const concurrentService = createTiendaCentroReadonlyService({
    now:() => "2026-08-29T15:58:48.201Z",
    fetchImpl:async () => new Promise((resolve) => releases.push(() => resolve(response([]))))
  });
  const concurrent = Array.from({ length:MAX_CONCURRENT_PROVIDER_REQUESTS }, (_, index) => concurrentService.search({ query:"parallel " + index, requestId:"parallel-" + index }));
  await new Promise((resolve) => setImmediate(resolve));
  const concurrencyLimited = await concurrentService.search({ query:"parallel overflow", requestId:"parallel-overflow" });
  assert.equal(concurrencyLimited.ok, false);
  assert.equal(concurrencyLimited.code, "SOURCE_CONCURRENCY_LIMITED");
  releases.forEach((release) => release());
  await Promise.all(concurrent);
}

async function main() {
  assert.equal(API_ORIGIN, "https://tiendacentro.com");
  await testHappyPathAndTruthLayer();
  await testExactIdentityAndFailClosedResponses();
  await testBoundsDedupeAndIpcBoundary();
  console.log("TIENDA_CENTRO_READONLY_INTEGRATION PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
