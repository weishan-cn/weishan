"use strict";

const path = require("node:path");
const { fileURLToPath } = require("node:url");

const MERCHANT_NATIVE_READONLY_CORE_VERSION = "1.0.0";
const TRUSTED_RENDERER_PATH = path.resolve(__dirname, "../index.html");
const USER_AGENT = "Weishan/1.0 (+https://weishan.ai)";
const ALLOWED_PAYLOAD_KEYS = new Set(["query", "requestId", "limit"]);

function plainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null ? value : null;
}

function boundedText(value, max = 240) {
  const normalized = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) return "";
  return normalized;
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function isoInstant(value) {
  const raw = boundedText(value, 80);
  const parsed = Date.parse(raw);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(raw) || !Number.isFinite(parsed)) return "";
  return new Date(parsed).toISOString();
}

function sanitizeReadonlySearchPayload(payload) {
  const safe = plainRecord(payload);
  if (!safe) return { valid:false, payload:{ query:"", requestId:"", limit:3 } };
  const unexpectedKeys = Object.keys(safe).filter((key) => !ALLOWED_PAYLOAD_KEYS.has(key));
  const fieldTypesValid = Object.prototype.hasOwnProperty.call(safe, "query")
    && Object.prototype.hasOwnProperty.call(safe, "requestId")
    && typeof safe.query === "string"
    && typeof safe.requestId === "string"
    && (safe.limit === undefined || typeof safe.limit === "number");
  const query = boundedText(safe.query, 120);
  const requestId = boundedText(safe.requestId, 120);
  const invalidQuery = !query || /https?:\/\//i.test(query) || /[<>]/.test(query) || /(?:script|javascript:)/i.test(query);
  return {
    valid:unexpectedKeys.length === 0 && fieldTypesValid && !invalidQuery && Boolean(requestId),
    payload:{ query, requestId, limit:clampInteger(safe.limit, 3, 1, 3) }
  };
}

function safeSourceError(source, code, extra) {
  return Object.assign({}, extra && typeof extra === "object" ? extra : {}, {
    ok:false,
    status:"unavailable",
    code:boundedText(code, 80) || "SOURCE_UNAVAILABLE",
    providerId:source.providerId,
    providerName:source.providerName,
    results:[],
    redacted:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    productionTraffic:false
  });
}

function validateFixedSourceUrl(value, policy) {
  try {
    const parsed = new URL(String(value || ""));
    const expectedOrigin = new URL(policy.origin);
    if (parsed.protocol !== "https:" || parsed.origin !== expectedOrigin.origin) return false;
    if (parsed.username || parsed.password || parsed.hash) return false;
    if (typeof policy.allowedPath !== "function" || policy.allowedPath(parsed.pathname) !== true) return false;
    const allowedQueryKeys = policy.allowedQueryKeys instanceof Set ? policy.allowedQueryKeys : new Set();
    if (Array.from(parsed.searchParams.keys()).some((key) => !allowedQueryKeys.has(key))) return false;
    return policy.method === "GET";
  } catch (_) {
    return false;
  }
}

async function readBoundedJson(fetchImpl, url, policy, limits) {
  if (!validateFixedSourceUrl(url, policy)) {
    throw Object.assign(new Error("source_url_rejected"), { safeCode:"SOURCE_POLICY_REJECTED" });
  }
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), limits.timeoutMs) : null;
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
    if (Number.isFinite(contentLength) && contentLength > limits.maxResponseBytes) {
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
        if (totalBytes > limits.maxResponseBytes) {
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

function normalizeStaticDefinition(definition) {
  const safe = plainRecord(definition);
  const source = safe && plainRecord(safe.source);
  const policy = safe && plainRecord(safe.policy);
  const limitsInput = safe && plainRecord(safe.limits);
  if (!safe || !source || !policy || !limitsInput || typeof safe.executeSource !== "function") {
    throw new Error("MERCHANT_SOURCE_DEFINITION_INVALID");
  }
  const sourceId = boundedText(source.sourceId, 80);
  const providerId = boundedText(source.providerId, 80);
  const providerName = boundedText(source.providerName, 120);
  const attributionUrl = boundedText(source.sourceAttributionUrl, 1000);
  if (!sourceId || !providerId || !providerName || !attributionUrl || policy.method !== "GET") {
    throw new Error("MERCHANT_SOURCE_DEFINITION_INVALID");
  }
  const limits = Object.freeze({
    timeoutMs:clampInteger(limitsInput.timeoutMs, 8000, 1000, 15000),
    maxResponseBytes:clampInteger(limitsInput.maxResponseBytes, 384 * 1024, 4096, 1024 * 1024),
    cacheTtlMs:clampInteger(limitsInput.cacheTtlMs, 60 * 1000, 1000, 5 * 60 * 1000),
    maxCacheEntries:clampInteger(limitsInput.maxCacheEntries, 24, 1, 64),
    maxRequestsPerMinute:clampInteger(limitsInput.maxRequestsPerMinute, 6, 1, 30),
    maxConcurrentRequests:clampInteger(limitsInput.maxConcurrentRequests, 2, 1, 6),
    maxRetries:0
  });
  return Object.freeze({
    version:boundedText(safe.version, 40) || "1.0.0",
    source:Object.freeze(Object.assign({}, source, { sourceId, providerId, providerName, sourceAttributionUrl:attributionUrl })),
    policy:Object.freeze(Object.assign({}, policy, {
      method:"GET",
      allowedQueryKeys:new Set(Array.from(policy.allowedQueryKeys instanceof Set ? policy.allowedQueryKeys : []))
    })),
    limits,
    sanitizePayload:typeof safe.sanitizePayload === "function" ? safe.sanitizePayload : sanitizeReadonlySearchPayload,
    cacheKey:typeof safe.cacheKey === "function" ? safe.cacheKey : (payload) => payload.query.toLowerCase(),
    executeSource:safe.executeSource,
    statusExtras:plainRecord(safe.statusExtras) || {}
  });
}

function createMerchantNativeReadonlyService(definition, options = {}) {
  const fixed = normalizeStaticDefinition(definition);
  const fetchImpl = options.fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
  const now = typeof options.now === "function" ? options.now : () => new Date().toISOString();
  const runtimeLimits = Object.freeze(Object.assign({}, fixed.limits, {
    timeoutMs:clampInteger(options.timeoutMs, fixed.limits.timeoutMs, 1000, fixed.limits.timeoutMs),
    maxResponseBytes:clampInteger(options.maxResponseBytes, fixed.limits.maxResponseBytes, 4096, fixed.limits.maxResponseBytes),
    cacheTtlMs:clampInteger(options.cacheTtlMs, fixed.limits.cacheTtlMs, 1000, fixed.limits.cacheTtlMs)
  }));
  const inFlight = new Map();
  const cache = new Map();
  const requestTimestamps = [];
  let activeRequests = 0;

  function currentIso() {
    return isoInstant(now()) || new Date().toISOString();
  }

  function consumeBudget(atMs) {
    while (requestTimestamps.length && atMs - requestTimestamps[0] >= 60 * 1000) requestTimestamps.shift();
    if (requestTimestamps.length >= runtimeLimits.maxRequestsPerMinute) return false;
    requestTimestamps.push(atMs);
    return true;
  }

  async function requestJson(url) {
    if (activeRequests >= runtimeLimits.maxConcurrentRequests) {
      throw Object.assign(new Error("concurrency_limited"), { safeCode:"SOURCE_CONCURRENCY_LIMITED" });
    }
    const atMs = Date.parse(currentIso());
    if (!consumeBudget(atMs)) throw Object.assign(new Error("rate_limited"), { safeCode:"SOURCE_RATE_LIMITED" });
    activeRequests += 1;
    try {
      return await readBoundedJson(fetchImpl, url, fixed.policy, runtimeLimits);
    } finally {
      activeRequests -= 1;
    }
  }

  function remember(key, result, storedAt) {
    if (!result || result.ok !== true) return;
    cache.delete(key);
    cache.set(key, { storedAt, result });
    while (cache.size > runtimeLimits.maxCacheEntries) cache.delete(cache.keys().next().value);
  }

  async function search(payload) {
    const sanitized = fixed.sanitizePayload(payload);
    const requestId = sanitized && sanitized.payload ? sanitized.payload.requestId : "";
    if (!sanitized || sanitized.valid !== true) return safeSourceError(fixed.source, "SOURCE_INPUT_INVALID", { requestId:requestId || "" });
    if (!fetchImpl) return safeSourceError(fixed.source, "SOURCE_UNAVAILABLE", { requestId });
    const cacheKey = boundedText(fixed.cacheKey(sanitized.payload), 240);
    if (!cacheKey) return safeSourceError(fixed.source, "SOURCE_INPUT_INVALID", { requestId });
    const fetchedAt = currentIso();
    const fetchedAtMs = Date.parse(fetchedAt);
    const cached = cache.get(cacheKey);
    if (cached && fetchedAtMs - cached.storedAt >= 0 && fetchedAtMs - cached.storedAt <= runtimeLimits.cacheTtlMs) {
      return Object.assign({}, cached.result, { requestId, requestCount:0, cacheStatus:"memory_hit" });
    }
    if (cached) cache.delete(cacheKey);
    if (inFlight.has(cacheKey)) return inFlight.get(cacheKey).then((result) => Object.assign({}, result, { requestId }));
    const promise = (async () => {
      try {
        const sourceResult = await fixed.executeSource({ payload:sanitized.payload, fetchedAt, requestJson });
        const normalized = plainRecord(sourceResult);
        if (!normalized || !Array.isArray(normalized.results)) {
          return safeSourceError(fixed.source, "SOURCE_RESPONSE_INVALID", { requestId });
        }
        return {
          ok:true,
          status:boundedText(normalized.status, 40) || (normalized.results.length ? "ready" : "no_results"),
          code:boundedText(normalized.code, 80),
          providerId:fixed.source.providerId,
          providerName:fixed.source.providerName,
          sourceType:"PUBLIC_READ_ONLY",
          sourceAttributionUrl:fixed.source.sourceAttributionUrl,
          requestId,
          fetchedAt,
          requestCount:clampInteger(normalized.requestCount, 1, 0, runtimeLimits.maxRequestsPerMinute),
          results:normalized.results,
          redacted:true,
          executionGate:"CLOSED",
          authorizesExecution:false,
          productionTraffic:false
        };
      } catch (error) {
        return safeSourceError(fixed.source, error && error.safeCode || "SOURCE_UNAVAILABLE", { requestId });
      }
    })().then((result) => {
      remember(cacheKey, result, fetchedAtMs);
      return result;
    }).finally(() => inFlight.delete(cacheKey));
    inFlight.set(cacheKey, promise);
    return promise.then((result) => Object.assign({}, result, { requestId }));
  }

  return Object.freeze({
    version:fixed.version,
    sourceId:fixed.source.sourceId,
    search,
    getStatus:() => Object.assign({}, fixed.statusExtras, {
      ok:true,
      connected:false,
      configured:true,
      networkValidated:false,
      providerStatus:"CONFIGURED",
      providerId:fixed.source.providerId,
      providerName:fixed.source.providerName,
      executionMode:"public_readonly",
      sourceType:"PUBLIC_READ_ONLY",
      sourceAttributionUrl:fixed.source.sourceAttributionUrl,
      allowedMethods:["GET"],
      cachePolicy:{ scope:"memory_only", ttlMs:runtimeLimits.cacheTtlMs, maxEntries:runtimeLimits.maxCacheEntries, persistent:false },
      throttlePolicy:{ windowMs:60000, maxProviderRequests:runtimeLimits.maxRequestsPerMinute, maxConcurrentRequests:runtimeLimits.maxConcurrentRequests, retryCount:0 },
      responsePolicy:{ maxBytes:runtimeLimits.maxResponseBytes, timeoutMs:runtimeLimits.timeoutMs },
      redacted:true,
      executionGate:"CLOSED",
      authorizesExecution:false,
      productionTraffic:false
    })
  });
}

function trustedLocalMainFrameSender(event) {
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

module.exports = {
  MERCHANT_NATIVE_READONLY_CORE_VERSION,
  boundedText,
  clampInteger,
  isoInstant,
  plainRecord,
  sanitizeReadonlySearchPayload,
  safeSourceError,
  validateFixedSourceUrl,
  createMerchantNativeReadonlyService,
  trustedLocalMainFrameSender
};
