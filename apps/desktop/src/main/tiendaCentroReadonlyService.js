"use strict";

const path = require("node:path");
const { fileURLToPath } = require("node:url");

const TIENDA_CENTRO_READONLY_SERVICE_VERSION = "1.0.0";
const PROVIDER_ID = "tienda_centro_public";
const PROVIDER_NAME = "Tienda Centro";
const API_ORIGIN = "https://tiendacentro.com";
const SOURCE_ATTRIBUTION_URL = "https://tiendacentro.com/";
const SEARCH_PATH = "/wp-json/wc/store/v1/products";
const USER_AGENT = "Weishan/1.0 (+https://weishan.ai)";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RESPONSE_BYTES = 384 * 1024;
const DEFAULT_CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 24;
const MAX_PROVIDER_REQUESTS_PER_MINUTE = 6;
const MAX_CONCURRENT_PROVIDER_REQUESTS = 2;
const ALLOWED_PAYLOAD_KEYS = new Set(["query", "requestId", "limit"]);
const TRUSTED_RENDERER_PATH = path.resolve(__dirname, "../index.html");
const SECRET_KEY_RE = /(secret|token|password|authorization|api[_-]?key|private[_-]?key|cookie|credential)/i;
const BLOCKED_PRODUCT_PATH_RE = /\/(?:cart|checkout|my-account|wp-admin|wp-login)(?:\/|$)/i;
const PROMPT_STOP_WORDS = new Set([
  "actual", "argentina", "buscar", "buy", "comprar", "current", "find", "help", "precio", "price", "real",
  "please", "quiero", "search", "stock", "帮我", "当前", "价格", "商品", "购买", "查找", "真实"
]);

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function plainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null ? value : null;
}

function text(value, max = 240) {
  const normalized = String(value == null ? "" : value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) return "";
  return normalized;
}

function isoInstant(value) {
  const raw = text(value, 80);
  const parsed = Date.parse(raw);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(raw) || !Number.isFinite(parsed)) return "";
  return new Date(parsed).toISOString();
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function sanitizePayload(payload) {
  const safe = plainRecord(payload);
  if (!safe) return { valid:false, payload:{ query:"", requestId:"", limit:1 } };
  const unexpectedKeys = Object.keys(safe).filter((key) => !ALLOWED_PAYLOAD_KEYS.has(key));
  const fieldTypesValid = Object.prototype.hasOwnProperty.call(safe, "query")
    && Object.prototype.hasOwnProperty.call(safe, "requestId")
    && typeof safe.query === "string"
    && typeof safe.requestId === "string"
    && (safe.limit === undefined || typeof safe.limit === "number");
  const query = text(safe.query, 120);
  const requestId = text(safe.requestId, 120);
  const invalidQuery = !query || /https?:\/\//i.test(query) || /[<>]/.test(query) || /(?:script|javascript:)/i.test(query);
  return {
    valid:unexpectedKeys.length === 0 && fieldTypesValid && !invalidQuery && Boolean(requestId),
    payload:{ query, requestId, limit:clampInteger(safe.limit, 1, 1, 1) }
  };
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
  if (tokens.length < 2) return false;
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

function safeError(code) {
  return {
    ok:false,
    status:"unavailable",
    code,
    providerId:PROVIDER_ID,
    providerName:PROVIDER_NAME,
    results:[],
    redacted:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    productionTraffic:false
  };
}

async function readJson(fetchImpl, url, options) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutMs = clampInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 1000, 15000);
  const maxBytes = clampInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, 4096, 1024 * 1024);
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetchImpl(url, {
      method:"GET",
      headers:{ Accept:"application/json", "User-Agent":USER_AGENT },
      redirect:"error",
      signal:controller ? controller.signal : undefined
    });
    if (!response.ok) throw Object.assign(new Error("http_failure"), { safeCode:"SOURCE_HTTP_ERROR" });
    const contentLength = response.headers && typeof response.headers.get === "function"
      ? Number(response.headers.get("content-length"))
      : NaN;
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw Object.assign(new Error("response_too_large"), { safeCode:"SOURCE_RESPONSE_TOO_LARGE" });
    }
    if (!response.body || typeof response.body.getReader !== "function") {
      throw Object.assign(new Error("response_stream_required"), { safeCode:"SOURCE_RESPONSE_INVALID" });
    }
    const reader = response.body.getReader();
    const chunks = [];
    let totalBytes = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        const chunk = Buffer.from(part.value || []);
        totalBytes += chunk.byteLength;
        if (totalBytes > maxBytes) {
          if (typeof reader.cancel === "function") await reader.cancel();
          throw Object.assign(new Error("response_too_large"), { safeCode:"SOURCE_RESPONSE_TOO_LARGE" });
        }
        chunks.push(chunk);
      }
    } finally {
      if (typeof reader.releaseLock === "function") reader.releaseLock();
    }
    const body = Buffer.concat(chunks, totalBytes).toString("utf8");
    try {
      return body ? JSON.parse(body) : [];
    } catch (_) {
      throw Object.assign(new Error("invalid_json"), { safeCode:"SOURCE_RESPONSE_INVALID" });
    }
  } catch (error) {
    if (error && error.name === "AbortError") throw Object.assign(new Error("timeout"), { safeCode:"SOURCE_TIMEOUT" });
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
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

function selectExactProduct(payload, query, retrievedAt) {
  const results = Array.isArray(payload) ? payload.slice(0, 3) : [];
  for (const item of results) {
    const normalized = normalizeProduct(item, query, retrievedAt);
    if (normalized) return normalized;
  }
  return null;
}

function createTiendaCentroReadonlyService(options = {}) {
  const fetchImpl = options.fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
  const now = typeof options.now === "function" ? options.now : () => new Date().toISOString();
  const inFlight = new Map();
  const cache = new Map();
  const requestTimestamps = [];
  let activeProviderRequests = 0;
  const cacheTtlMs = clampInteger(options.cacheTtlMs, DEFAULT_CACHE_TTL_MS, 1000, 5 * 60 * 1000);

  function currentIso() {
    return isoInstant(now()) || new Date().toISOString();
  }

  function remember(key, result, storedAt) {
    if (!result || result.ok !== true) return;
    cache.delete(key);
    cache.set(key, { storedAt, result });
    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  }

  function consumeProviderRequestBudget(atMs) {
    while (requestTimestamps.length && atMs - requestTimestamps[0] >= 60 * 1000) requestTimestamps.shift();
    if (requestTimestamps.length >= MAX_PROVIDER_REQUESTS_PER_MINUTE) return false;
    requestTimestamps.push(atMs);
    return true;
  }

  async function requestProviderJson(url, atMs) {
    if (activeProviderRequests >= MAX_CONCURRENT_PROVIDER_REQUESTS) {
      throw Object.assign(new Error("concurrency_limited"), { safeCode:"SOURCE_CONCURRENCY_LIMITED" });
    }
    if (!consumeProviderRequestBudget(atMs)) {
      throw Object.assign(new Error("rate_limited"), { safeCode:"SOURCE_RATE_LIMITED" });
    }
    activeProviderRequests += 1;
    try {
      return await readJson(fetchImpl, url, options);
    } finally {
      activeProviderRequests -= 1;
    }
  }

  async function execute(payload) {
    const sanitized = sanitizePayload(payload);
    if (!sanitized.valid) return Object.assign(safeError("SOURCE_INPUT_INVALID"), { requestId:sanitized.payload.requestId || "" });
    if (!fetchImpl) return Object.assign(safeError("SOURCE_UNAVAILABLE"), { requestId:sanitized.payload.requestId });
    const key = normalizeIdentity(sanitized.payload.query);
    const observedAt = currentIso();
    const observedAtMs = Date.parse(observedAt);
    const cached = cache.get(key);
    if (cached && observedAtMs - cached.storedAt >= 0 && observedAtMs - cached.storedAt <= cacheTtlMs) {
      return Object.assign({}, cached.result, { requestId:sanitized.payload.requestId, requestCount:0, cacheStatus:"memory_hit" });
    }
    if (cached) cache.delete(key);
    if (inFlight.has(key)) {
      return inFlight.get(key).then((result) => Object.assign({}, result, { requestId:sanitized.payload.requestId }));
    }
    const promise = (async () => {
      try {
        const searchPayload = await requestProviderJson(buildSearchUrl(sanitized.payload.query), observedAtMs);
        const selected = selectExactProduct(searchPayload, sanitized.payload.query, observedAt);
        return {
          ok:true,
          status:selected ? "ready" : "no_results",
          code:selected ? "" : "SOURCE_NO_EXACT_RESULTS",
          providerId:PROVIDER_ID,
          providerName:PROVIDER_NAME,
          sourceType:"PUBLIC_READ_ONLY",
          sourceAttributionUrl:SOURCE_ATTRIBUTION_URL,
          requestId:sanitized.payload.requestId,
          fetchedAt:observedAt,
          requestCount:1,
          results:selected ? [selected] : [],
          redacted:true,
          executionGate:"CLOSED",
          authorizesExecution:false,
          productionTraffic:false
        };
      } catch (error) {
        return Object.assign(safeError(error && error.safeCode || "SOURCE_UNAVAILABLE"), { requestId:sanitized.payload.requestId });
      }
    })().then((result) => {
      remember(key, result, observedAtMs);
      return result;
    }).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise.then((result) => Object.assign({}, result, { requestId:sanitized.payload.requestId }));
  }

  return {
    version:TIENDA_CENTRO_READONLY_SERVICE_VERSION,
    search:execute,
    getStatus:() => ({
      ok:true,
      connected:false,
      configured:true,
      networkValidated:false,
      providerStatus:"CONFIGURED",
      providerId:PROVIDER_ID,
      providerName:PROVIDER_NAME,
      executionMode:"public_readonly",
      sourceType:"PUBLIC_READ_ONLY",
      sourceAttributionUrl:SOURCE_ATTRIBUTION_URL,
      coverageRegion:"Argentina",
      allowedMethods:["GET"],
      cachePolicy:{ scope:"memory_only", ttlMs:cacheTtlMs, maxEntries:MAX_CACHE_ENTRIES, persistent:false },
      throttlePolicy:{ windowMs:60000, maxProviderRequests:MAX_PROVIDER_REQUESTS_PER_MINUTE, maxConcurrentRequests:MAX_CONCURRENT_PROVIDER_REQUESTS, retryCount:0 },
      responsePolicy:{ maxBytes:clampInteger(options.maxResponseBytes, DEFAULT_MAX_RESPONSE_BYTES, 4096, 1024 * 1024), timeoutMs:clampInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 1000, 15000) },
      redacted:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false
    })
  };
}

function trustedTiendaCentroSender(event) {
  try {
    const sender = event && event.sender;
    const frame = event && event.senderFrame;
    if (!sender || !frame || typeof sender.getURL !== "function" || sender.mainFrame !== frame) return false;
    const senderUrl = new URL(sender.getURL());
    const frameUrl = new URL(String(frame.url || ""));
    return senderUrl.protocol === "file:" && frameUrl.protocol === "file:"
      && path.resolve(fileURLToPath(senderUrl)) === TRUSTED_RENDERER_PATH
      && path.resolve(fileURLToPath(frameUrl)) === TRUSTED_RENDERER_PATH;
  } catch (_) {
    return false;
  }
}

function registerTiendaCentroReadonlyHandlers(ipcMain, options = {}) {
  const service = options.service || createTiendaCentroReadonlyService(options);
  const validateSender = typeof options.validateSender === "function" ? options.validateSender : trustedTiendaCentroSender;
  ipcMain.handle("global-shopping:tienda-centro-readonly-search", async (event, payload) => {
    if (!validateSender(event)) return safeError("SOURCE_CALLER_INVALID");
    return service.search(payload || {});
  });
  ipcMain.handle("global-shopping:tienda-centro-readonly-status", async (event) => {
    if (!validateSender(event)) return safeError("SOURCE_CALLER_INVALID");
    return service.getStatus();
  });
  return service;
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
  exactProductIdentityMatch,
  createTiendaCentroReadonlyService,
  registerTiendaCentroReadonlyHandlers,
  trustedTiendaCentroSender
};
