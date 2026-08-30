"use strict";

const {
  isoInstant,
  createMerchantNativeReadonlyService
} = require("./merchantNativeReadonlyServiceCore");

const PRIJS_PROFEET_READONLY_SERVICE_VERSION = "1.0.0";
const PROVIDER_ID = "prijsprofeet_public";
const PROVIDER_NAME = "PrijsProfeet";
const API_ORIGIN = "https://www.prijsprofeet.nl";
const SOURCE_ATTRIBUTION_URL = "https://www.prijsprofeet.nl/";
const SEARCH_PATH = "/api/v1/search";
const DETAIL_PATH_PREFIX = "/api/v1/products/";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RESPONSE_BYTES = 512 * 1024;
const DEFAULT_CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 32;
const MAX_PROVIDER_REQUESTS_PER_MINUTE = 8;
const MAX_CONCURRENT_PROVIDER_REQUESTS = 4;
const SOURCE_ID = "prijsprofeet_public_api";
const SECRET_KEY_RE = /(secret|token|password|authorization|api[_-]?key|private[_-]?key|cookie|credential)/i;
const RETAILER_HOSTS = Object.freeze({
  albert_heijn:["ah.nl"],
  aldi:["aldi.nl"],
  dekamarkt:["dekamarkt.nl"],
  dirk:["dirk.nl"],
  ekoplaza:["ekoplaza.nl"],
  hoogvliet:["hoogvliet.com", "hoogvliet.nl"],
  jumbo:["jumbo.com"],
  lidl:["lidl.nl"],
  plus:["plus.nl"],
  vomar:["vomar.nl"]
});

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function text(value, max = 240) {
  const normalized = String(value == null ? "" : value).trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) return "";
  return normalized;
}

function finitePositive(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function calendarDate(value) {
  const raw = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const parsed = new Date(raw + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw ? raw : "";
}

function hostMatches(hostname, allowedSuffix) {
  const host = String(hostname || "").toLowerCase();
  const suffix = String(allowedSuffix || "").toLowerCase();
  return host === suffix || host.endsWith("." + suffix);
}

function safeRetailerUrl(value, retailer) {
  const allowed = RETAILER_HOSTS[text(retailer, 40).toLowerCase()] || [];
  if (!allowed.length) return "";
  try {
    const parsed = new URL(text(value, 1000));
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash) return "";
    if (Array.from(parsed.searchParams.keys()).some((key) => SECRET_KEY_RE.test(key))) return "";
    if (!allowed.some((suffix) => hostMatches(parsed.hostname, suffix))) return "";
    return parsed.toString();
  } catch (_) {
    return "";
  }
}

function isCurrentActivePromotion(item, today) {
  const safe = obj(item);
  const validFrom = calendarDate(safe.valid_from);
  const validUntil = calendarDate(safe.valid_until);
  return text(safe.promotion_status, 20).toLowerCase() === "active"
    && Boolean(validFrom && validUntil)
    && validFrom <= today
    && validUntil >= today;
}

function buildSearchUrl(query) {
  const url = new URL(SEARCH_PATH, API_ORIGIN);
  url.searchParams.set("q", query);
  url.searchParams.set("promotion_status", "active");
  url.searchParams.set("page", "1");
  url.searchParams.set("page_size", "10");
  return url.toString();
}

function buildDetailUrl(productId) {
  return new URL(DETAIL_PATH_PREFIX + encodeURIComponent(productId), API_ORIGIN).toString();
}

function selectSearchCandidate(payload, today) {
  const safe = obj(payload);
  const results = Array.isArray(safe.results) ? safe.results.slice(0, 10) : [];
  return results.find((item) => {
    const productId = text(obj(item).product_id, 160);
    const retailer = text(obj(item).retailer, 40).toLowerCase();
    return Boolean(productId && isCurrentActivePromotion(item, today) && safeRetailerUrl(obj(item).product_url, retailer));
  }) || null;
}

function normalizeDetail(detail, selected, fetchedAt, today) {
  const safe = obj(detail);
  const selectedSafe = obj(selected);
  const productId = text(safe.product_id, 160);
  const retailer = text(safe.retailer, 40).toLowerCase();
  const officialUrl = safeRetailerUrl(safe.product_url, retailer);
  const price = finitePositive(safe.price);
  const currency = text(safe.currency, 3).toUpperCase();
  const extractedAt = isoInstant(safe.extracted_at);
  if (!productId || productId !== text(selectedSafe.product_id, 160)) return null;
  if (!text(safe.name, 240) || !price || currency !== "EUR" || !officialUrl || !extractedAt) return null;
  if (!isCurrentActivePromotion(safe, today)) return null;
  return {
    productId,
    title:text(safe.name, 240),
    brand:text(safe.brand, 120),
    ean:/^\d{8,14}$/.test(text(safe.ean, 14)) ? text(safe.ean, 14) : "",
    price,
    currency,
    quantity:text(safe.quantity, 80),
    unit:text(safe.unit, 40),
    unitPrice:finitePositive(safe.unit_price),
    retailer,
    officialUrl,
    promotionStatus:"active",
    validFrom:calendarDate(safe.valid_from),
    validUntil:calendarDate(safe.valid_until),
    extractedAt,
    retrievedAt:fetchedAt,
    availabilityStatus:"UNKNOWN",
    priceCompleteness:"PARTIAL_PRICE",
    priceBasis:"ITEM_TOTAL"
  };
}

const PRIJS_PROFEET_STATIC_DEFINITION = Object.freeze({
  version:PRIJS_PROFEET_READONLY_SERVICE_VERSION,
  source:Object.freeze({
    sourceId:SOURCE_ID,
    providerId:PROVIDER_ID,
    providerName:PROVIDER_NAME,
    sourceAttributionUrl:SOURCE_ATTRIBUTION_URL
  }),
  policy:Object.freeze({
    origin:API_ORIGIN,
    method:"GET",
    allowedPath:(pathname) => pathname === SEARCH_PATH || /^\/api\/v1\/products\/[A-Za-z0-9._~%-]+$/.test(pathname),
    allowedQueryKeys:new Set(["q", "promotion_status", "page", "page_size"])
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
  cacheKey:(payload) => payload.query.toLowerCase(),
  async executeSource({ payload, fetchedAt, requestJson }) {
    const today = fetchedAt.slice(0, 10);
    const searchPayload = await requestJson(buildSearchUrl(payload.query));
    const selected = selectSearchCandidate(searchPayload, today);
    if (!selected) return { status:"no_results", code:"SOURCE_NO_CURRENT_RESULTS", requestCount:1, results:[] };
    const detailPayload = await requestJson(buildDetailUrl(text(selected.product_id, 160)));
    const normalized = normalizeDetail(detailPayload, selected, fetchedAt, today);
    if (!normalized) throw Object.assign(new Error("invalid_source_response"), { safeCode:"SOURCE_RESPONSE_INVALID" });
    return { status:"ready", code:"", requestCount:2, results:[normalized] };
  }
});

function createPrijsProfeetReadonlyService(options = {}) {
  return createMerchantNativeReadonlyService(PRIJS_PROFEET_STATIC_DEFINITION, options);
}

module.exports = {
  PRIJS_PROFEET_READONLY_SERVICE_VERSION,
  API_ORIGIN,
  PROVIDER_ID,
  PROVIDER_NAME,
  SOURCE_ATTRIBUTION_URL,
  MAX_CONCURRENT_PROVIDER_REQUESTS,
  SOURCE_ID,
  PRIJS_PROFEET_STATIC_DEFINITION,
  createPrijsProfeetReadonlyService
};
