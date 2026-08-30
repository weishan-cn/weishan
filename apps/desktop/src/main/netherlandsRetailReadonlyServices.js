"use strict";

const { clampInteger, createMerchantNativeReadonlyService } = require("./merchantNativeReadonlyServiceCore");

const BLOCKED_PATH_RE = /\/(?:cart|checkout|account|admin|login)(?:\/|$)/i;
const STOP_WORDS = new Set(["netherlands", "nederland", "price", "current", "find", "search", "荷兰", "价格", "查找"]);

function record(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function text(value, max = 240) {
  const clean = String(value == null ? "" : value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return clean && clean.length <= max && !/[\u0000-\u001f\u007f]/.test(clean) ? clean : "";
}
function identity(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}
function tokens(value) { return identity(value).split(" ").filter((token) => token.length >= 2 && !STOP_WORDS.has(token)); }
function exactIdentity(query, title) {
  const wanted = Array.from(new Set(tokens(query)));
  const actual = new Set(tokens(title));
  return wanted.length > 0 && wanted.every((token) => actual.has(token));
}
function searchCandidateIdentity(query, title) {
  const wanted = new Set(tokens(query));
  const candidate = Array.from(new Set(tokens(title)));
  return candidate.length >= 2 && candidate.every((token) => wanted.has(token));
}
function safeUrl(value, host, prefix) {
  try {
    const parsed = new URL(text(value, 1000));
    if (parsed.protocol !== "https:" || parsed.hostname !== host || parsed.username || parsed.password || parsed.hash || parsed.search) return "";
    if (!parsed.pathname.startsWith(prefix) || BLOCKED_PATH_RE.test(parsed.pathname)) return "";
    return parsed.toString();
  } catch (_) { return ""; }
}
function money(minor, digits) {
  if (!/^\d+$/.test(String(minor == null ? "" : minor))) return null;
  const value = Number(minor) / Math.pow(10, clampInteger(digits, 2, 0, 4));
  return Number.isFinite(value) && value > 0 ? value : null;
}
function commonResult(input) {
  return Object.assign({
    condition:"UNKNOWN", priceCompleteness:"PARTIAL_PRICE", priceBasis:"ITEM_TOTAL",
    shippingStatus:"UNKNOWN", taxStatus:"UNKNOWN", feesStatus:"UNKNOWN"
  }, input);
}

const C_AND_C = Object.freeze({
  version:"1.0.0",
  source:Object.freeze({ sourceId:"cc_asian_market_public_api", providerId:"cc_asian_market_public", providerName:"C&C Asian Market", sourceAttributionUrl:"https://ccasianmarket.nl/" }),
  policy:Object.freeze({ origin:"https://ccasianmarket.nl", method:"GET", allowedPath:(path) => path === "/wp-json/wc/store/v1/products", allowedQueryKeys:new Set(["search", "page", "per_page"]) }),
  limits:Object.freeze({ timeoutMs:8000, maxResponseBytes:384 * 1024, cacheTtlMs:60000, maxCacheEntries:24, maxRequestsPerMinute:6, maxConcurrentRequests:2, maxRetries:0 }),
  cacheKey:(payload) => identity(payload.query),
  async executeSource({ payload, fetchedAt, requestJson }) {
    const url = new URL("/wp-json/wc/store/v1/products", "https://ccasianmarket.nl");
    url.searchParams.set("search", String(payload.query).replace(/[-‐‑‒–—]+/g, " ")); url.searchParams.set("page", "1"); url.searchParams.set("per_page", "10");
    const data = await requestJson(url.toString());
    const results = (Array.isArray(data) ? data : []).slice(0, 10).map((item) => {
      const safe = record(item); const prices = record(safe.prices); const title = text(safe.name);
      const officialUrl = safeUrl(safe.permalink, "ccasianmarket.nl", "/product/");
      const price = money(prices.price, prices.currency_minor_unit); const currency = text(prices.currency_code, 3).toUpperCase();
      if (!title || !exactIdentity(payload.query, title) || !officialUrl || !price || currency !== "EUR") return null;
      return commonResult({ productId:text(safe.id, 80), canonicalProductIdentity:identity(title), title, merchant:"C&C Asian Market", price, currency, currencyMinorUnit:clampInteger(prices.currency_minor_unit, 2, 0, 4), officialUrl, retrievedAt:fetchedAt, availabilityStatus:safe.is_in_stock === true ? "AVAILABLE" : (safe.is_in_stock === false ? "UNAVAILABLE" : "UNKNOWN") });
    }).filter(Boolean).slice(0, payload.limit);
    return { status:results.length ? "ready" : "no_results", code:results.length ? "" : "SOURCE_NO_EXACT_RESULTS", requestCount:1, results };
  },
  statusExtras:Object.freeze({ coverageRegion:"Netherlands" })
});

function cleanShopifyPath(value) {
  const raw = text(value, 1000).split("?")[0];
  return /^\/products\/[a-z0-9-]+$/.test(raw) ? raw : "";
}
const DUTCHSHOPPER = Object.freeze({
  version:"1.0.0",
  source:Object.freeze({ sourceId:"dutchshopper_public_api", providerId:"dutchshopper_public", providerName:"Dutchshopper", sourceAttributionUrl:"https://dutchshopper.com/" }),
  policy:Object.freeze({ origin:"https://dutchshopper.com", method:"GET", allowedPath:(path) => path === "/search/suggest.json" || /^\/products\/[a-z0-9-]+\.js$/.test(path), allowedQueryKeys:new Set(["q", "resources[type]", "resources[limit]"]) }),
  limits:Object.freeze({ timeoutMs:8000, maxResponseBytes:512 * 1024, cacheTtlMs:60000, maxCacheEntries:24, maxRequestsPerMinute:6, maxConcurrentRequests:2, maxRetries:0 }),
  cacheKey:(payload) => identity(payload.query),
  async executeSource({ payload, fetchedAt, requestJson }) {
    const search = new URL("/search/suggest.json", "https://dutchshopper.com");
    search.searchParams.set("q", payload.query); search.searchParams.set("resources[type]", "product"); search.searchParams.set("resources[limit]", "10");
    const searchData = await requestJson(search.toString());
    const products = record(record(record(searchData).resources).results).products;
    const candidate = (Array.isArray(products) ? products : []).slice(0, 10).find((item) => searchCandidateIdentity(payload.query, record(item).title) && cleanShopifyPath(record(item).url));
    if (!candidate) return { status:"no_results", code:"SOURCE_NO_EXACT_RESULTS", requestCount:1, results:[] };
    const productPath = cleanShopifyPath(candidate.url);
    const detail = record(await requestJson(new URL(productPath + ".js", "https://dutchshopper.com").toString()));
    const variant = record(Array.isArray(detail.variants) ? detail.variants[0] : null);
    const title = text(detail.title); const price = money(variant.price, 2);
    const officialUrl = safeUrl(new URL(productPath, "https://dutchshopper.com").toString(), "dutchshopper.com", "/products/");
    const displayTitle = title + (variant.weight ? " " + String(variant.weight) + "ml" : "");
    if (!title || !exactIdentity(payload.query, displayTitle) || !price || !officialUrl || detail.available !== true) throw Object.assign(new Error("invalid_source_response"), { safeCode:"SOURCE_RESPONSE_INVALID" });
    return { status:"ready", code:"", requestCount:2, results:[commonResult({ productId:text(detail.id, 80), canonicalProductIdentity:identity(displayTitle), title:displayTitle, merchant:"Dutchshopper", price, currency:"EUR", currencyMinorUnit:2, officialUrl, retrievedAt:fetchedAt, availabilityStatus:variant.available === true ? "AVAILABLE" : "UNAVAILABLE" })] };
  },
  statusExtras:Object.freeze({ coverageRegion:"Netherlands" })
});

function createCAndCAsianMarketReadonlyService(options = {}) { return createMerchantNativeReadonlyService(C_AND_C, options); }
function createDutchshopperReadonlyService(options = {}) { return createMerchantNativeReadonlyService(DUTCHSHOPPER, options); }

module.exports = { C_AND_C, DUTCHSHOPPER, exactIdentity, createCAndCAsianMarketReadonlyService, createDutchshopperReadonlyService };
