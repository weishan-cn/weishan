"use strict";

const {
  clampInteger,
  createMerchantNativeReadonlyService
} = require("./merchantNativeReadonlyServiceCore");

const MEBLOSTAN_READONLY_SERVICE_VERSION = "1.0.0";
const PROVIDER_ID = "meblostan_public";
const PROVIDER_NAME = "Meblostan";
const API_ORIGIN = "https://meblostan.pl";
const SOURCE_ATTRIBUTION_URL = "https://meblostan.pl/";
const SEARCH_PATH = "/wp-json/wc/store/v1/products";
const SOURCE_ID = "meblostan_public_api";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RESPONSE_BYTES = 384 * 1024;
const BLOCKED_PRODUCT_PATH_RE = /\/(?:cart|checkout|my-account|wp-admin|wp-login)(?:\/|$)/i;
const PROMPT_STOP_WORDS = new Set([
  "actual", "buy", "current", "find", "furniture", "help", "meble", "poland", "price", "real", "search",
  "波兰", "家具", "价格", "商品", "购买", "查找", "真实"
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
    .replace(/&(?:#8222|#8221|quot);/gi, " ")
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
  if (tokens.length < 2) return false;
  const titleTokens = new Set(identityTokens(title));
  return tokens.every((token) => titleTokens.has(token));
}

function safeProductUrl(value) {
  try {
    const parsed = new URL(text(value, 1000));
    if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== "meblostan.pl") return "";
    if (parsed.username || parsed.password || parsed.hash || parsed.search) return "";
    if (!/^\/sklep\/[^/]+\/?$/i.test(parsed.pathname) || BLOCKED_PRODUCT_PATH_RE.test(parsed.pathname)) return "";
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

function normalizeAvailability(item) {
  const safe = obj(item);
  if (safe.is_in_stock === true) return "AVAILABLE";
  if (safe.is_in_stock === false) return "UNAVAILABLE";
  const status = text(safe.stock_status, 40).toLowerCase();
  if (status === "instock") return "AVAILABLE";
  if (status === "outofstock") return "UNAVAILABLE";
  if (status === "onbackorder") return "CONDITIONAL";
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
  const onSale = safe.on_sale === true && regularPrice !== null && salePrice !== null && salePrice < regularPrice && price === salePrice;
  if (!productId || !title || !exactProductIdentityMatch(query, title) || !price || currency !== "PLN" || !officialUrl) return null;
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
    condition:"REFURBISHED",
    officialUrl,
    retrievedAt,
    availabilityStatus:normalizeAvailability(safe),
    priceCompleteness:"PARTIAL_PRICE",
    priceBasis:"ITEM_TOTAL",
    shippingStatus:"UNKNOWN",
    taxStatus:"UNKNOWN",
    feesStatus:"UNKNOWN"
  };
}

function selectExactProduct(payload, query, retrievedAt) {
  for (const item of Array.isArray(payload) ? payload.slice(0, 3) : []) {
    const normalized = normalizeProduct(item, query, retrievedAt);
    if (normalized) return normalized;
  }
  return null;
}

const MEBLOSTAN_STATIC_DEFINITION = Object.freeze({
  version:MEBLOSTAN_READONLY_SERVICE_VERSION,
  source:Object.freeze({ sourceId:SOURCE_ID, providerId:PROVIDER_ID, providerName:PROVIDER_NAME, sourceAttributionUrl:SOURCE_ATTRIBUTION_URL }),
  policy:Object.freeze({
    origin:API_ORIGIN,
    method:"GET",
    allowedPath:(pathname) => pathname === SEARCH_PATH,
    allowedQueryKeys:new Set(["search", "page", "per_page"])
  }),
  limits:Object.freeze({
    timeoutMs:DEFAULT_TIMEOUT_MS,
    maxResponseBytes:DEFAULT_MAX_RESPONSE_BYTES,
    cacheTtlMs:60 * 1000,
    maxCacheEntries:24,
    maxRequestsPerMinute:6,
    maxConcurrentRequests:2,
    maxRetries:0
  }),
  cacheKey:(payload) => normalizeIdentity(payload.query),
  async executeSource({ payload, fetchedAt, requestJson }) {
    const selected = selectExactProduct(await requestJson(buildSearchUrl(payload.query)), payload.query, fetchedAt);
    return {
      status:selected ? "ready" : "no_results",
      code:selected ? "" : "SOURCE_NO_EXACT_RESULTS",
      requestCount:1,
      results:selected ? [selected] : []
    };
  },
  statusExtras:Object.freeze({ coverageRegion:"Poland", coverageClass:"vintage_furniture_home_furnishings" })
});

function createMeblostanReadonlyService(options = {}) {
  return createMerchantNativeReadonlyService(MEBLOSTAN_STATIC_DEFINITION, options);
}

module.exports = {
  MEBLOSTAN_READONLY_SERVICE_VERSION,
  API_ORIGIN,
  PROVIDER_ID,
  PROVIDER_NAME,
  SOURCE_ATTRIBUTION_URL,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MAX_RESPONSE_BYTES,
  SOURCE_ID,
  MEBLOSTAN_STATIC_DEFINITION,
  exactProductIdentityMatch,
  createMeblostanReadonlyService
};
