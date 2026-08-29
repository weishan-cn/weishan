"use strict";

const path = require("node:path");
const { fileURLToPath } = require("node:url");

const PRIJS_PROFEET_READONLY_SERVICE_VERSION = "1.0.0";
const PROVIDER_ID = "prijsprofeet_public";
const PROVIDER_NAME = "PrijsProfeet";
const API_ORIGIN = "https://www.prijsprofeet.nl";
const SOURCE_ATTRIBUTION_URL = "https://www.prijsprofeet.nl/";
const SEARCH_PATH = "/api/v1/search";
const DETAIL_PATH_PREFIX = "/api/v1/products/";
const USER_AGENT = "Weishan/1.0 (+https://weishan.ai)";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RESPONSE_BYTES = 512 * 1024;
const DEFAULT_CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 32;
const MAX_PROVIDER_REQUESTS_PER_MINUTE = 8;
const MAX_CONCURRENT_PROVIDER_REQUESTS = 4;
const ALLOWED_PAYLOAD_KEYS = new Set(["query", "requestId", "limit"]);
const TRUSTED_RENDERER_PATH = path.resolve(__dirname, "../index.html");
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

function plainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null ? value : null;
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

function isoInstant(value) {
  const raw = text(value, 80);
  const parsed = Date.parse(raw);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(raw) || !Number.isFinite(parsed)) return "";
  return new Date(parsed).toISOString();
}

function calendarDate(value) {
  const raw = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  const parsed = new Date(raw + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw ? raw : "";
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
  const query = text(safe.query, 120).replace(/\s+/g, " ");
  const requestId = text(safe.requestId, 120);
  const invalidQuery = !query || /https?:\/\//i.test(query) || /[<>]/.test(query) || /(?:script|javascript:)/i.test(query);
  return {
    valid:unexpectedKeys.length === 0 && fieldTypesValid && !invalidQuery && Boolean(requestId),
    payload:{ query, requestId, limit:clampInteger(safe.limit, 1, 1, 1) }
  };
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
      return body ? JSON.parse(body) : {};
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

function createPrijsProfeetReadonlyService(options = {}) {
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
    const key = sanitized.payload.query.toLowerCase();
    const observedAt = currentIso();
    const observedAtMs = Date.parse(observedAt);
    const cached = cache.get(key);
    if (cached && observedAtMs - cached.storedAt >= 0 && observedAtMs - cached.storedAt <= cacheTtlMs) {
      return Object.assign({}, cached.result, {
        requestId:sanitized.payload.requestId,
        requestCount:0,
        cacheStatus:"memory_hit"
      });
    }
    if (cached) cache.delete(key);
    if (inFlight.has(key)) {
      return inFlight.get(key).then((result) => Object.assign({}, result, { requestId:sanitized.payload.requestId }));
    }
    const promise = (async () => {
      try {
        const fetchedAt = observedAt;
        const today = fetchedAt.slice(0, 10);
        const searchPayload = await requestProviderJson(buildSearchUrl(sanitized.payload.query), observedAtMs);
        const selected = selectSearchCandidate(searchPayload, today);
        if (!selected) {
          return {
            ok:true,
            status:"no_results",
            code:"SOURCE_NO_CURRENT_RESULTS",
            providerId:PROVIDER_ID,
            providerName:PROVIDER_NAME,
            sourceType:"PUBLIC_READ_ONLY",
            sourceAttributionUrl:SOURCE_ATTRIBUTION_URL,
            requestId:sanitized.payload.requestId,
            fetchedAt,
            requestCount:1,
            results:[],
            redacted:true,
            executionGate:"CLOSED",
            authorizesExecution:false,
            productionTraffic:false
          };
        }
        const detailPayload = await requestProviderJson(buildDetailUrl(text(selected.product_id, 160)), Date.parse(currentIso()));
        const normalized = normalizeDetail(detailPayload, selected, fetchedAt, today);
        if (!normalized) return Object.assign(safeError("SOURCE_RESPONSE_INVALID"), { requestId:sanitized.payload.requestId, requestCount:2 });
        return {
          ok:true,
          status:"ready",
          code:"",
          providerId:PROVIDER_ID,
          providerName:PROVIDER_NAME,
          sourceType:"PUBLIC_READ_ONLY",
          sourceAttributionUrl:SOURCE_ATTRIBUTION_URL,
          requestId:sanitized.payload.requestId,
          fetchedAt,
          requestCount:2,
          results:[normalized],
          redacted:true,
          executionGate:"CLOSED",
          authorizesExecution:false,
          productionTraffic:false
        };
      } catch (error) {
        return Object.assign(safeError(error && error.safeCode || "SOURCE_UNAVAILABLE"), {
          requestId:sanitized.payload.requestId
        });
      }
    })().then((result) => {
      remember(key, result, observedAtMs);
      return result;
    }).finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise.then((result) => Object.assign({}, result, { requestId:sanitized.payload.requestId }));
  }

  return {
    version:PRIJS_PROFEET_READONLY_SERVICE_VERSION,
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
      cachePolicy:{ scope:"memory_only", ttlMs:cacheTtlMs, maxEntries:MAX_CACHE_ENTRIES, persistent:false },
      throttlePolicy:{ windowMs:60000, maxProviderRequests:MAX_PROVIDER_REQUESTS_PER_MINUTE, maxConcurrentRequests:MAX_CONCURRENT_PROVIDER_REQUESTS, retryCount:0 },
      redacted:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false
    })
  };
}

function trustedPrijsProfeetSender(event) {
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

function registerPrijsProfeetReadonlyHandlers(ipcMain, options = {}) {
  const service = options.service || createPrijsProfeetReadonlyService(options);
  const validateSender = typeof options.validateSender === "function" ? options.validateSender : trustedPrijsProfeetSender;
  ipcMain.handle("global-shopping:prijsprofeet-readonly-search", async (event, payload) => {
    if (!validateSender(event)) return safeError("SOURCE_CALLER_INVALID");
    return service.search(payload || {});
  });
  ipcMain.handle("global-shopping:prijsprofeet-readonly-status", async (event) => {
    if (!validateSender(event)) return safeError("SOURCE_CALLER_INVALID");
    return service.getStatus();
  });
  return service;
}

module.exports = {
  PRIJS_PROFEET_READONLY_SERVICE_VERSION,
  API_ORIGIN,
  PROVIDER_ID,
  PROVIDER_NAME,
  SOURCE_ATTRIBUTION_URL,
  MAX_CONCURRENT_PROVIDER_REQUESTS,
  createPrijsProfeetReadonlyService,
  registerPrijsProfeetReadonlyHandlers,
  trustedPrijsProfeetSender
};
