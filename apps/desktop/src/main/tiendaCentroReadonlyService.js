"use strict";

const {
  clampInteger,
  createMerchantNativeReadonlyService
} = require("./merchantNativeReadonlyServiceCore");

const TIENDA_CENTRO_READONLY_SERVICE_VERSION = "1.0.0";
const PROVIDER_ID = "tienda_centro_public";
const PROVIDER_NAME = "Tienda Centro";
const API_ORIGIN = "https://tiendacentro.com";
const SOURCE_ATTRIBUTION_URL = "https://tiendacentro.com/";
const SEARCH_PATH = "/wp-json/wc/store/v1/products";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RESPONSE_BYTES = 384 * 1024;
const DEFAULT_CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 24;
const MAX_PROVIDER_REQUESTS_PER_MINUTE = 6;
const MAX_CONCURRENT_PROVIDER_REQUESTS = 2;
const SOURCE_ID = "tienda_centro_public_api";
const BLOCKED_PRODUCT_PATH_RE = /\/(?:cart|checkout|my-account|wp-admin|wp-login)(?:\/|$)/i;
const PROMPT_STOP_WORDS = new Set([
  "actual", "argentina", "buscar", "buy", "comprar", "current", "find", "help", "precio", "price", "real",
  "please", "quiero", "search", "stock", "帮我", "当前", "价格", "商品", "购买", "查找", "真实"
]);

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function text(value, max = 240) {
  const normalized = String(value == null ? "" : value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) return "";
  return normalized;
}

function normalizeIdentity(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function identityTokens(value) {
  return normalizeIdentity(value).split(" ").filter((token) => token.length >= 2 && !PROMPT_STOP_WORDS.has(token));
}

function exactProductIdentityMatch(query, title) {
  const normalizedQuery = normalizeIdentity(query);
  const normalizedTitle = normalizeIdentity(title);
  if (!normalizedQuery || !normalizedTitle) return false;
  if (normalizedQuery === normalizedTitle) return true;
  const tokens = Array.from(new Set(identityTokens(query)));
  if (!tokens.length) return false;
  const titleTokens = new Set(identityTokens(title));
  return tokens.every((token) => titleTokens.has(token));
}

function safeProductUrl(value) {
  try {
    const parsed = new URL(text(value, 1000));
    if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== "tiendacentro.com") return "";
    if (parsed.username || parsed.password || parsed.hash || parsed.search) return "";
    if (BLOCKED_PRODUCT_PATH_RE.test(parsed.pathname)) return "";
    return parsed.toString();
  } catch (_) {
    return "";
  }
}

function priceFromMinorUnits(value, minorUnit) {
  if (!/^\d+$/.test(String(value == null ? "" : value))) return null;
  const minor = clampInteger(minorUnit, 2, 0, 4);
  const amount = Number(value) / Math.pow(10, minor);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function normalizeAvailability(value) {
  const status = text(value, 40).toLowerCase();
  if (status === "instock") return "AVAILABLE";
  if (status === "outofstock") return "UNAVAILABLE";
  if (status === "onbackorder") return "CONDITIONAL";
  return "UNKNOWN";
}

function normalizeCondition(title) {
  const normalized = normalizeIdentity(title);
  if (/\b(?:usado|used)\b/.test(normalized)) return "USED";
  if (/\b(?:reacondicionado|refurbished|renewed)\b/.test(normalized)) return "REFURBISHED";
  if (/\b(?:nuevo|new)\b/.test(normalized)) return "NEW";
  return "UNKNOWN";
}

function buildSearchUrl(query) {
  const url = new URL(SEARCH_PATH, API_ORIGIN);
  url.searchParams.set("search", query);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "3");
  return url.toString();
}

function normalizeProduct(item, query, retrievedAt) {
  const safe = obj(item);
  const prices = obj(safe.prices);
  const title = text(safe.name, 240);
  const productId = text(safe.id, 80);
  const officialUrl = safeProductUrl(safe.permalink);
  const currency = text(prices.currency_code, 3).toUpperCase();
  const minorUnit = clampInteger(prices.currency_minor_unit, 2, 0, 4);
  const price = priceFromMinorUnits(prices.price, minorUnit);
  const regularPrice = priceFromMinorUnits(prices.regular_price, minorUnit);
  const salePrice = priceFromMinorUnits(prices.sale_price, minorUnit);
  const onSale = safe.on_sale === true
    && regularPrice !== null
    && salePrice !== null
    && salePrice < regularPrice
    && price === salePrice;
  if (!productId || !title || !exactProductIdentityMatch(query, title) || !price || !/^[A-Z]{3}$/.test(currency) || !officialUrl) return null;
  return {
    productId,
    title,
    merchant:PROVIDER_NAME,
    price,
    currency,
    currencyMinorUnit:minorUnit,
    regularPrice:onSale ? regularPrice : null,
    salePrice:onSale ? salePrice : null,
    onSale,
    condition:normalizeCondition(title),
    officialUrl,
    retrievedAt,
    availabilityStatus:normalizeAvailability(safe.stock_status),
    priceCompleteness:"PARTIAL_PRICE",
    priceBasis:"ITEM_TOTAL",
    shippingStatus:"UNKNOWN",
    taxStatus:"UNKNOWN",
    feesStatus:"UNKNOWN"
  };
}

function selectExactProducts(payload, query, retrievedAt, limit) {
  const results = Array.isArray(payload) ? payload.slice(0, 3) : [];
  return results.map((item) => normalizeProduct(item, query, retrievedAt)).filter(Boolean).slice(0, limit);
}

const TIENDA_CENTRO_STATIC_DEFINITION = Object.freeze({
  version:TIENDA_CENTRO_READONLY_SERVICE_VERSION,
  source:Object.freeze({
    sourceId:SOURCE_ID,
    providerId:PROVIDER_ID,
    providerName:PROVIDER_NAME,
    sourceAttributionUrl:SOURCE_ATTRIBUTION_URL
  }),
  policy:Object.freeze({
    origin:API_ORIGIN,
    method:"GET",
    allowedPath:(pathname) => pathname === SEARCH_PATH,
    allowedQueryKeys:new Set(["search", "page", "per_page"])
  }),
  limits:Object.freeze({
    timeoutMs:DEFAULT_TIMEOUT_MS,
    maxResponseBytes:DEFAULT_MAX_RESPONSE_BYTES,
    cacheTtlMs:DEFAULT_CACHE_TTL_MS,
    maxCacheEntries:MAX_CACHE_ENTRIES,
    maxRequestsPerMinute:MAX_PROVIDER_REQUESTS_PER_MINUTE,
    maxConcurrentRequests:MAX_CONCURRENT_PROVIDER_REQUESTS,
    maxRetries:0
  }),
  cacheKey:(payload) => normalizeIdentity(payload.query),
  async executeSource({ payload, fetchedAt, requestJson }) {
    const searchPayload = await requestJson(buildSearchUrl(payload.query));
    const selected = selectExactProducts(searchPayload, payload.query, fetchedAt, payload.limit);
    return {
      status:selected.length ? "ready" : "no_results",
      code:selected.length ? "" : "SOURCE_NO_EXACT_RESULTS",
      requestCount:1,
      results:selected
    };
  },
  statusExtras:Object.freeze({ coverageRegion:"Argentina" })
});

function createTiendaCentroReadonlyService(options = {}) {
  return createMerchantNativeReadonlyService(TIENDA_CENTRO_STATIC_DEFINITION, options);
}

module.exports = {
  TIENDA_CENTRO_READONLY_SERVICE_VERSION,
  API_ORIGIN,
  PROVIDER_ID,
  PROVIDER_NAME,
  SOURCE_ATTRIBUTION_URL,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_RESPONSE_BYTES,
  MAX_CONCURRENT_PROVIDER_REQUESTS,
  MAX_PROVIDER_REQUESTS_PER_MINUTE,
  SOURCE_ID,
  TIENDA_CENTRO_STATIC_DEFINITION,
  exactProductIdentityMatch,
  createTiendaCentroReadonlyService
};
