"use strict";

const GLOBAL_SHOPPING_READONLY_RESULT_CACHE_VERSION = "4.2.8";
const DEFAULT_TTL_MS = 60 * 1000;
const DEFAULT_MAX_ENTRIES = 20;

function clone(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
}

function text(value) {
  return String(value == null ? "" : value).trim();
}

function integerInRange(value, fallback, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, Math.round(next)));
}

function normalizeCacheKeyPart(value, maxLength) {
  return text(value).slice(0, maxLength || 80).toLowerCase();
}

function buildReadonlyResultCacheKey(input) {
  const safe = input && typeof input === "object" ? input : {};
  return [
    normalizeCacheKeyPart(safe.keyword, 120),
    String(integerInRange(safe.page, 1, 1, 50)),
    String(integerInRange(safe.hits, 10, 1, 10)),
    normalizeCacheKeyPart(safe.destinationCountry, 12),
    normalizeCacheKeyPart(safe.currency, 12)
  ].join("|");
}

function freshnessFor(entry, nowMs, ttlMs) {
  const ageMs = Math.max(0, nowMs - Number(entry && entry.cachedAtMs || 0));
  if (!Number(entry && entry.cachedAtMs)) return { freshnessLevel:"unknown", ageSeconds:null };
  if (ageMs <= ttlMs) return { freshnessLevel:"fresh", ageSeconds:Math.round(ageMs / 1000) };
  if (ageMs <= ttlMs * 2) return { freshnessLevel:"recent", ageSeconds:Math.round(ageMs / 1000) };
  if (ageMs <= ttlMs * 4) return { freshnessLevel:"stale", ageSeconds:Math.round(ageMs / 1000) };
  return { freshnessLevel:"expired", ageSeconds:Math.round(ageMs / 1000) };
}

function createGlobalShoppingReadonlyResultCache(options = {}) {
  const ttlMs = integerInRange(options.ttlMs, DEFAULT_TTL_MS, 1000, 10 * 60 * 1000);
  const maxEntries = integerInRange(options.maxEntries, DEFAULT_MAX_ENTRIES, 1, 200);
  const now = typeof options.now === "function" ? options.now : Date.now;
  const store = new Map();

  function trimIfNeeded() {
    while (store.size > maxEntries) {
      const oldestKey = store.keys().next().value;
      store.delete(oldestKey);
    }
  }

  function getMeta(entry) {
    const currentNow = Number(now());
    const freshness = freshnessFor(entry, currentNow, ttlMs);
    return {
      freshnessLevel:freshness.freshnessLevel,
      ageSeconds:freshness.ageSeconds,
      cachedAt:text(entry && entry.cachedAt || ""),
      expiresAt:text(entry && entry.expiresAt || ""),
      redacted:true
    };
  }

  return {
    version:GLOBAL_SHOPPING_READONLY_RESULT_CACHE_VERSION,
    buildKey:buildReadonlyResultCacheKey,
    get:function (input) {
      const key = buildReadonlyResultCacheKey(input);
      const entry = store.get(key);
      if (!entry) return { hit:false, key, value:null, metadata:getMeta(null) };
      const metadata = getMeta(entry);
      if (metadata.freshnessLevel === "expired") {
        store.delete(key);
        return { hit:false, key, value:null, metadata };
      }
      return {
        hit:true,
        key:key,
        value:clone(entry.value),
        metadata:metadata
      };
    },
    set:function (input, value) {
      const key = buildReadonlyResultCacheKey(input);
      const cachedAtMs = Number(now());
      const cachedAt = new Date(cachedAtMs).toISOString();
      const expiresAt = new Date(cachedAtMs + ttlMs).toISOString();
      store.set(key, {
        key,
        cachedAtMs,
        cachedAt,
        expiresAt,
        value:clone(value)
      });
      trimIfNeeded();
      return {
        key,
        metadata:getMeta(store.get(key))
      };
    },
    clear:function () {
      store.clear();
      return { ok:true, redacted:true };
    },
    inspect:function () {
      return {
        entryCount:store.size,
        maxEntries,
        ttlMs,
        keys:Array.from(store.keys()),
        redacted:true
      };
    }
  };
}

module.exports = {
  GLOBAL_SHOPPING_READONLY_RESULT_CACHE_VERSION,
  buildReadonlyResultCacheKey,
  createGlobalShoppingReadonlyResultCache
};
