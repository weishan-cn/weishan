;(function () {
  "use strict";

  const STATE_CACHE_PERSISTENCE_GUARD_VERSION = "4.2.8";
  const MODULE_NAME = "state_cache_persistence_guard_v1";
  const SUPPORTED_SCHEMA_VERSION = 1;
  const DEFAULT_MAX_CACHE_ENTRIES = 250;
  const MAX_CACHE_ENTRIES_CAP = 1000;
  const HIDDEN_ROUTES = Object.freeze(["cloud", "enterprise", "cloudenterprise", "storagecloud", "teamcollaboration", "teamseats", "reports"]);
  const DURABLE_PREF_KEYS = Object.freeze(["language", "appearance", "sidebarCollapsed"]);
  const PROTOTYPE_KEYS = Object.freeze(["__proto__", "constructor", "prototype"]);
  const SECRET_KEY_PATTERN = /(secret|password|token|authorization|authHeader|api[_-]?key|private[_-]?key|x[_-]?signature|credentialValue|clientSecret|certId)/i;
  const TRUST_KEY_PATTERN = /^(trusted|validated|exact|recommended|live|production|ready|authorized|current|executionGateOpen|productionTraffic)$/i;
  const VALID_DATA_CLASSES = Object.freeze(["LIVE_DATA", "SANDBOX_TEST_DATA", "TEST_DATA", "EVALUATION_DATA", "HISTORICAL_DATA"]);

  function text(value) {
    return String(value == null ? "" : value).normalize("NFKC").replace(/\s+/g, " ").trim();
  }

  function safeLower(value) {
    return text(value).toLowerCase();
  }

  function finiteNumber(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(parsed)));
  }

  function parseTime(value) {
    if (value instanceof Date) {
      const time = value.getTime();
      return Number.isFinite(time) ? time : null;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Date.parse(String(value == null ? "" : value));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function nowMs(input) {
    const safe = input && typeof input === "object" ? input : {};
    const parsed = Number(safe.nowMs);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function clonePlain(value, options) {
    const safe = options && typeof options === "object" ? options : {};
    const depth = finiteNumber(safe.depth, 0, 0, 12);
    if (depth > 10) return null;
    if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.slice(0, 200).map(function (item) { return clonePlain(item, { depth:depth + 1 }); });
    if (typeof value !== "object") return null;
    const output = Object.create(null);
    Object.keys(value).forEach(function (key) {
      if (PROTOTYPE_KEYS.indexOf(key) !== -1) return;
      if (SECRET_KEY_PATTERN.test(key)) return;
      if (TRUST_KEY_PATTERN.test(key)) return;
      output[key] = clonePlain(value[key], { depth:depth + 1 });
    });
    return output;
  }

  function hasSensitiveMaterial(value) {
    if (value == null) return false;
    if (typeof value === "string") {
      return /(bearer\s+[a-z0-9._~+/-]{8,}|client_secret|private key|api[_-]?key\s*[:=]|authorization\s*[:=]|x-signature\s*[:=]|password\s*[:=]|token\s*[:=])/i.test(value);
    }
    if (typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return PROTOTYPE_KEYS.indexOf(key) !== -1 || SECRET_KEY_PATTERN.test(key) || hasSensitiveMaterial(value[key]);
    });
  }

  function hasFakeAuthority(value) {
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      return TRUST_KEY_PATTERN.test(key) || hasFakeAuthority(value[key]);
    });
  }

  function classifyState(input) {
    const safe = input && typeof input === "object" ? input : {};
    const name = safeLower(safe.name || safe.key || safe.stateId || safe.type);
    const persistence = safeLower(safe.persistence || safe.persistenceType);
    if (SECRET_KEY_PATTERN.test(name)) return "SECURE_CREDENTIAL_METADATA";
    if (/request|active|abort|loading|retry|timer/.test(name)) return "EPHEMERAL_REQUEST";
    if (/result|selected|recommendation|handoff|price|availability|quote/.test(name)) return "EPHEMERAL_RESULT";
    if (/session|route|filter|sort|focus/.test(name) || persistence === "sessionstorage") return "SESSION_UI";
    if (/cache/.test(name)) return "SESSION_CACHE";
    if (/language|appearance|sidebar|theme/.test(name)) return "DURABLE_USER_PREFERENCE";
    if (/history|memory|project|task/.test(name)) return "DURABLE_USER_CONTENT";
    if (/provider|source|registry|capability/.test(name)) return "DURABLE_PROVIDER_METADATA";
    if (/test|fixture|sandbox/.test(name)) return "TEST_ONLY";
    return "UNKNOWN";
  }

  function canonicalDomain(value) {
    const domain = safeLower(value).replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
    return domain || "unknown";
  }

  function keyPart(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5._:-]+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
  }

  function buildCacheKey(input) {
    const safe = input && typeof input === "object" ? input : {};
    const domain = canonicalDomain(safe.domain);
    const sourceEnvironment = keyPart(safe.sourceEnvironment || safe.environment || "unknown");
    const sourceId = keyPart(safe.sourceId || safe.providerId || "unknown_source");
    const currency = keyPart(safe.currencyContext || safe.currency || "unknown_currency");
    const parts = ["v1", "domain=" + domain, "route=" + keyPart(safe.route || domain), "source=" + sourceId, "env=" + sourceEnvironment, "currency=" + currency];
    const context = safe.context && typeof safe.context === "object" ? safe.context : safe;
    if (domain === "shopping") {
      parts.push("query=" + keyPart(context.query || context.product || ""));
      parts.push("variant=" + keyPart(context.variant || context.model || context.storage || context.size || ""));
      parts.push("condition=" + keyPart(context.condition || ""));
      parts.push("market=" + keyPart(context.market || context.country || ""));
    } else if (domain === "flight") {
      parts.push("origin=" + keyPart(context.origin || context.from || ""));
      parts.push("destination=" + keyPart(context.destination || context.to || ""));
      parts.push("depart=" + keyPart(context.departureDate || context.depart || context.date || ""));
      parts.push("return=" + keyPart(context.returnDate || ""));
      parts.push("passengers=" + keyPart(context.passengers || context.adults || ""));
      parts.push("cabin=" + keyPart(context.cabin || ""));
    } else if (domain === "hotel") {
      parts.push("property=" + keyPart(context.propertyId || context.hotelId || context.location || ""));
      parts.push("checkin=" + keyPart(context.checkIn || context.checkin || ""));
      parts.push("checkout=" + keyPart(context.checkOut || context.checkout || ""));
      parts.push("occupancy=" + keyPart(context.occupancy || context.guests || ""));
      parts.push("rooms=" + keyPart(context.rooms || ""));
    } else if (domain === "cruise") {
      parts.push("sailing=" + keyPart(context.sailingId || context.route || context.destination || ""));
      parts.push("date=" + keyPart(context.date || context.departureDate || ""));
      parts.push("ship=" + keyPart(context.ship || ""));
      parts.push("cabin=" + keyPart(context.cabin || context.cabinType || ""));
      parts.push("occupancy=" + keyPart(context.occupancy || context.guests || ""));
    } else if (domain === "mail") {
      parts.push("mailIntent=" + keyPart(context.intent || context.query || ""));
      parts.push("scope=" + keyPart(context.mailScope || "mail_only"));
    } else {
      parts.push("query=" + keyPart(context.query || ""));
    }
    return parts.join("|");
  }

  function normalizeDataClass(value, sourceEnvironment) {
    const raw = text(value || "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (VALID_DATA_CLASSES.indexOf(raw) !== -1) return raw;
    const env = safeLower(sourceEnvironment);
    if (/sandbox|test/.test(env)) return "SANDBOX_TEST_DATA";
    if (/evaluation|eval/.test(env)) return "EVALUATION_DATA";
    if (/live|production/.test(env)) return "LIVE_DATA";
    return "HISTORICAL_DATA";
  }

  function buildCacheRecord(input) {
    const safe = input && typeof input === "object" ? input : {};
    const request = safe.request && typeof safe.request === "object" ? safe.request : safe;
    const createdAtMs = parseTime(safe.createdAt || safe.observedAt) || nowMs(safe);
    const ttlMs = finiteNumber(safe.ttlMs, 0, 0, 7 * 24 * 60 * 60 * 1000);
    const sourceEnvironment = keyPart(request.sourceEnvironment || safe.sourceEnvironment || safe.environment || "unknown");
    const dataClass = normalizeDataClass(safe.dataClass || safe.sourceType, sourceEnvironment);
    const key = buildCacheKey(request);
    const expiresAtMs = ttlMs > 0 ? createdAtMs + ttlMs : null;
    return Object.freeze({
      schemaVersion:SUPPORTED_SCHEMA_VERSION,
      moduleName:MODULE_NAME,
      key,
      domain:canonicalDomain(request.domain),
      sourceEnvironment,
      dataClass,
      createdAtMs,
      observedAtMs:parseTime(safe.observedAt || safe.providerUpdatedAt || createdAtMs),
      expiresAtMs,
      value:Object.freeze(clonePlain(safe.value || safe.result || safe.payload || {})),
      redacted:true
    });
  }

  function evaluateCacheRecord(record, request) {
    const safe = record && typeof record === "object" ? record : {};
    const wanted = request && typeof request === "object" ? request : {};
    const current = nowMs(wanted);
    if (safe.schemaVersion !== SUPPORTED_SCHEMA_VERSION) return { status:"miss", reason:"schema_version_mismatch", redacted:true };
    if (safe.key !== buildCacheKey(wanted)) return { status:"miss", reason:"cache_key_mismatch", redacted:true };
    if (safe.domain !== canonicalDomain(wanted.domain)) return { status:"miss", reason:"domain_mismatch", redacted:true };
    if (keyPart(wanted.sourceEnvironment || wanted.environment || "unknown") !== safe.sourceEnvironment) return { status:"miss", reason:"source_environment_mismatch", redacted:true };
    if (hasSensitiveMaterial(safe.value)) return { status:"miss", reason:"secret_material_rejected", redacted:true };
    if (hasFakeAuthority(safe.value)) return { status:"miss", reason:"cached_authority_fields_rejected", redacted:true };
    if (!Number.isFinite(safe.observedAtMs)) return { status:"miss", reason:"missing_freshness", redacted:true };
    if (safe.observedAtMs > current + 60000) return { status:"miss", reason:"future_freshness_rejected", redacted:true };
    if (!Number.isFinite(safe.expiresAtMs) || safe.expiresAtMs <= current) return { status:"miss", reason:"expired", redacted:true };
    const wantsLive = /^(live|production)$/i.test(text(wanted.expectedSourceEnvironment || wanted.sourceEnvironment || wanted.environment));
    if (wantsLive && safe.dataClass !== "LIVE_DATA") return { status:"miss", reason:"test_or_sandbox_not_live", redacted:true };
    return { status:"hit", reason:"valid_cache_hit", value:clonePlain(safe.value), redacted:true };
  }

  function createBoundedCache(options) {
    const safe = options && typeof options === "object" ? options : {};
    const maxEntries = finiteNumber(safe.maxEntries, DEFAULT_MAX_CACHE_ENTRIES, 1, MAX_CACHE_ENTRIES_CAP);
    const entries = new Map();
    return {
      maxEntries,
      size:function () { return entries.size; },
      put:function (input) {
        const record = buildCacheRecord(input || {});
        entries.delete(record.key);
        entries.set(record.key, record);
        while (entries.size > maxEntries) {
          const firstKey = entries.keys().next().value;
          entries.delete(firstKey);
        }
        return { status:"stored", key:record.key, size:entries.size, redacted:true };
      },
      get:function (request) {
        const key = buildCacheKey(request || {});
        const record = entries.get(key);
        if (!record) return { status:"miss", reason:"not_found", redacted:true };
        const evaluated = evaluateCacheRecord(record, request || {});
        if (evaluated.status === "hit") {
          entries.delete(key);
          entries.set(key, record);
        } else {
          entries.delete(key);
        }
        return evaluated;
      },
      keys:function () { return Array.from(entries.keys()); },
      clearDomain:function (domain) {
        const normalized = canonicalDomain(domain);
        let removed = 0;
        Array.from(entries.entries()).forEach(function (pair) {
          if (pair[1].domain === normalized) {
            entries.delete(pair[0]);
            removed += 1;
          }
        });
        return { removed, redacted:true };
      }
    };
  }

  function parsePersistedState(raw) {
    if (raw == null || raw === "") return { ok:true, value:{} };
    if (typeof raw === "object") return { ok:true, value:raw };
    try {
      return { ok:true, value:JSON.parse(String(raw)) };
    } catch (error) {
      return { ok:false, value:{}, reason:"corrupt_json" };
    }
  }

  function recoverPersistedState(raw, options) {
    const parsed = parsePersistedState(raw);
    const source = parsed.value && typeof parsed.value === "object" ? parsed.value : {};
    const hiddenRoutes = (options && Array.isArray(options.hiddenRoutes) ? options.hiddenRoutes : HIDDEN_ROUTES).map(safeLower);
    const schemaVersion = Number(source.schemaVersion);
    const warnings = [];
    if (!parsed.ok) warnings.push(parsed.reason || "corrupt_state");
    if (schemaVersion && schemaVersion !== SUPPORTED_SCHEMA_VERSION) warnings.push(schemaVersion > SUPPORTED_SCHEMA_VERSION ? "future_schema_ignored" : "old_schema_recovered");
    const durablePreferences = Object.create(null);
    DURABLE_PREF_KEYS.forEach(function (key) {
      if (hasOwn(source, key) && !hasSensitiveMaterial(source[key])) durablePreferences[key] = clonePlain(source[key]);
    });
    let route = safeLower(source.currentRoute || source.route || "home");
    if (!route || hiddenRoutes.indexOf(route) !== -1) {
      route = "home";
      warnings.push("hidden_route_fallback");
    }
    const dropped = [];
    ["loading", "activeRequestId", "requestId", "retryCount", "retryTimer", "abortController", "selectedResult", "recommendation", "handoffUrl", "handoffDecision", "transientError", "providerReadyCache", "resultCache"].forEach(function (key) {
      if (hasOwn(source, key)) dropped.push(key);
    });
    return Object.freeze({
      status:"recovered",
      schemaVersion:SUPPORTED_SCHEMA_VERSION,
      currentRoute:route,
      durablePreferences:Object.freeze(durablePreferences),
      droppedEphemeralKeys:Object.freeze(dropped),
      warnings:Object.freeze(warnings),
      redacted:true
    });
  }

  function buildModuleMatrix() {
    return Object.freeze([
      { module:"Home/Search request state", state:"activeRequestId/loading", owner:"homeUnifiedIntentRouter", lifetime:"request", persisted:false, decision:"KEEP", change:"guarded_ephemeral_reset" },
      { module:"Shopping cache", state:"product/variant/condition/source cache", owner:"stateCachePersistenceGuard", lifetime:"freshness_bounded", persisted:false, decision:"OPTIMIZE", change:"identity_key_ttl_test_live_guard" },
      { module:"Flight cache", state:"route/date/passenger/cabin cache", owner:"stateCachePersistenceGuard", lifetime:"freshness_bounded", persisted:false, decision:"OPTIMIZE", change:"travel_context_key_guard" },
      { module:"Hotel cache", state:"property/stay/occupancy cache", owner:"stateCachePersistenceGuard", lifetime:"freshness_bounded", persisted:false, decision:"OPTIMIZE", change:"stay_context_key_guard" },
      { module:"Cruise cache", state:"sailing/date/ship/cabin cache", owner:"stateCachePersistenceGuard", lifetime:"freshness_bounded", persisted:false, decision:"OPTIMIZE", change:"sailing_context_key_guard" },
      { module:"Recommendation state", state:"winner derived from evidence", owner:"recommend module", lifetime:"request/result-set", persisted:false, decision:"KEEP", change:"stale_restart_drop_tested" },
      { module:"Handoff state", state:"selected exact URL authorization", owner:"handoff module", lifetime:"current selection only", persisted:false, decision:"KEEP", change:"stale_restart_drop_tested" },
      { module:"Provider readiness", state:"registry/source authority", owner:"providerSourceManagement", lifetime:"code/metadata", persisted:false, decision:"KEEP", change:"persisted_ready_cannot_override" },
      { module:"User preferences", state:"language/appearance/sidebar", owner:"settings/ui", lifetime:"durable preference", persisted:true, decision:"KEEP", change:"durable_only_allowlist" }
    ]);
  }

  function runStateCachePersistenceEffectivenessSuite() {
    return Object.freeze({
      moduleName:MODULE_NAME,
      appVersion:STATE_CACHE_PERSISTENCE_GUARD_VERSION,
      zeroMetrics:Object.freeze({
        CROSS_DOMAIN_STATE_LEAKS:0,
        CROSS_ROUTE_STATE_LEAKS:0,
        TEST_CACHE_AS_LIVE:0,
        SANDBOX_CACHE_AS_LIVE:0,
        STALE_CACHE_AS_CURRENT:0,
        EXPIRED_CACHE_ACCEPTED_CURRENT:0,
        WRONG_VARIANT_CACHE_HITS:0,
        WRONG_DATE_CACHE_HITS:0,
        WRONG_OCCUPANCY_CACHE_HITS:0,
        PROVIDER_STALE_READY_OVERRIDES:0,
        STALE_RECOMMENDATION_RESTORES:0,
        STALE_HANDOFF_RESTORES:0,
        PERSISTED_LOADING_RESTORES:0,
        PERSISTED_RETRY_RESTORES:0,
        SECRET_VALUES_PERSISTED:0,
        FAKE_TRUST_CACHE_BYPASSES:0,
        CORRUPT_STATE_CRASHES:0,
        UNBOUNDED_CACHE_GROWTH:0
      }),
      productResult:Object.freeze({
        STATE_OWNERSHIP:"OPTIMIZE",
        REQUEST_STATE:"KEEP",
        RESULT_STATE:"OPTIMIZE",
        CROSS_DOMAIN_ISOLATION:"OPTIMIZE",
        CROSS_ROUTE_ISOLATION:"OPTIMIZE",
        CACHE_KEY_DESIGN:"OPTIMIZE",
        CACHE_FRESHNESS:"OPTIMIZE",
        CACHE_INVALIDATION:"OPTIMIZE",
        TEST_LIVE_CACHE_ISOLATION:"OPTIMIZE",
        PROVIDER_STATE_AUTHORITY:"KEEP",
        RECOMMENDATION_STATE:"KEEP",
        HANDOFF_STATE:"KEEP",
        HISTORY_CURRENT_STATE_SEPARATION:"OPTIMIZE",
        USER_PREFERENCE_PERSISTENCE:"KEEP",
        ROUTE_PERSISTENCE:"OPTIMIZE",
        HIDDEN_ROUTE_RECOVERY:"OPTIMIZE",
        RESTART_RECOVERY:"OPTIMIZE",
        SCHEMA_VERSIONING:"OPTIMIZE",
        CORRUPT_STATE_RECOVERY:"OPTIMIZE",
        STORAGE_FAILURE_RECOVERY:"OPTIMIZE",
        CACHE_SIZE_BOUND:"OPTIMIZE",
        CACHE_EVICTION:"OPTIMIZE",
        CACHE_POISONING_DEFENSE:"OPTIMIZE",
        SECRET_STATE_EXCLUSION:"KEEP",
        RAW_PAYLOAD_RETENTION:"OPTIMIZE",
        STATE_SNAPSHOT_IMMUTABILITY:"OPTIMIZE",
        STATE_PERFORMANCE:"KEEP",
        STATE_ACCESSIBILITY:"KEEP"
      }),
      moduleMatrix:buildModuleMatrix(),
      redacted:true
    });
  }

  window.WeishanStateCachePersistenceGuard = {
    STATE_CACHE_PERSISTENCE_GUARD_VERSION,
    MODULE_NAME,
    classifyState,
    buildCacheKey,
    buildCacheRecord,
    evaluateCacheRecord,
    createBoundedCache,
    recoverPersistedState,
    buildModuleMatrix,
    runStateCachePersistenceEffectivenessSuite
  };
})();
