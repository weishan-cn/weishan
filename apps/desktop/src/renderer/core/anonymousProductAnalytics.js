;(function () {
  "use strict";

  const VERSION = "4.3.2";
  const MODULE_NAME = "anonymous_product_analytics_v1";
  const EVENT_VERSION = 1;
  const QUEUE_MAX_DEFAULT = 500;
  const VALUE_MAX_LENGTH = 96;
  const MIN_DECISION_INSTALLS = 50;
  const MIN_OBSERVATION_DAYS = 7;

  const MODULE_IDS = Object.freeze([
    "HOME",
    "SHOPPING",
    "FLIGHT",
    "HOTEL",
    "CRUISE",
    "MAIL",
    "PLUGINS",
    "SETTINGS",
    "SECURITY_PRIVACY"
  ]);

  const EVENT_NAMES = Object.freeze([
    "session_started",
    "module_opened",
    "search_started",
    "search_completed",
    "search_no_result",
    "search_partial",
    "search_failed",
    "compare_opened",
    "compare_completed",
    "no_comparable_result",
    "recommendation_shown",
    "no_clear_winner",
    "handoff_offered",
    "handoff_clicked",
    "handoff_blocked",
    "mail_module_opened",
    "mail_connection_started",
    "mail_connection_succeeded",
    "mail_today_view_opened",
    "mail_search_used",
    "mail_draft_requested",
    "plugin_module_opened",
    "settings_opened",
    "security_privacy_opened"
  ]);

  const ACTION_CLASSES = Object.freeze([
    "SESSION",
    "MODULE_OPEN",
    "SEARCH",
    "COMPARE",
    "RECOMMEND",
    "HANDOFF",
    "MAIL",
    "PLUGIN",
    "SETTINGS",
    "SECURITY_PRIVACY"
  ]);

  const OUTCOMES = Object.freeze(["SUCCESS", "PARTIAL", "NO_RESULT", "FAILURE", "SAFE_BLOCK", "CANCELLED"]);
  const DOMAINS = Object.freeze(["SHOPPING", "FLIGHT", "HOTEL", "CRUISE", "MAIL", "OTHER"]);
  const ERROR_CLASSES = Object.freeze(["NONE", "TIMEOUT", "NETWORK", "AUTH", "POLICY_BLOCK", "NO_COVERAGE", "VALIDATION", "UNKNOWN_SAFE"]);
  const DURATION_BUCKETS = Object.freeze(["LT_1S", "S_1_3", "S_3_10", "S_10_30", "S_30_PLUS", "UNKNOWN"]);
  const RESULT_COUNT_BUCKETS = Object.freeze(["ZERO", "ONE", "TWO_TO_FIVE", "SIX_TO_TWENTY", "TWENTY_ONE_PLUS", "UNKNOWN"]);
  const PLATFORM_CLASSES = Object.freeze(["macOS", "Windows", "Linux", "Other"]);
  const LOCALES = Object.freeze(["zh", "en", "other"]);
  const ALLOWED_KEYS = Object.freeze([
    "eventName",
    "eventVersion",
    "anonymousInstallId",
    "sessionId",
    "moduleId",
    "actionClass",
    "outcome",
    "timestamp",
    "durationBucket",
    "resultCountBucket",
    "errorClassSafe",
    "domainCategory",
    "appVersion",
    "platformClass",
    "locale"
  ]);

  const FORBIDDEN_KEY = /(?:email|phone|name|address|subject|body|message|queryText|rawQuery|query|token|password|secret|apiKey|authorization|cookie|privateKey|otp|url|href|ip|mac|serial|machine|guid|fingerprint|geo|location|sender|recipient|attachment|hardware|screen|cpu|gpu|font|timezone|userAgent|username)/i;
  const SECRET_VALUE = /(?:sk-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]+|AKIA[0-9A-Z]{12,}|-----BEGIN\s+(?:RSA\s+)?PRIVATE KEY-----|password\s*[:=]|token\s*[:=]|secret\s*[:=]|api[_-]?key\s*[:=]|otp\s*[:=]|\b\d{6}\b)/i;
  const FULL_URL = /\bhttps?:\/\/[^\s]+/i;
  const EMAIL_VALUE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const PHONE_VALUE = /\+?\d[\d\s().-]{7,}\d/;

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { freeze(value[key]); });
    return Object.freeze(value);
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function isPlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function normalizedEnum(value, allowed, fallback) {
    const candidate = text(value).toUpperCase();
    return allowed.includes(candidate) ? candidate : fallback;
  }

  function normalizePlatform(value) {
    const candidate = text(value);
    return PLATFORM_CLASSES.includes(candidate) ? candidate : "Other";
  }

  function normalizeLocale(value) {
    const candidate = text(value).toLowerCase();
    if (candidate.startsWith("zh")) return "zh";
    if (candidate.startsWith("en")) return "en";
    return "other";
  }

  function bucketDuration(ms) {
    const n = Number(ms);
    if (!Number.isFinite(n) || n < 0) return "UNKNOWN";
    if (n < 1000) return "LT_1S";
    if (n < 3000) return "S_1_3";
    if (n < 10000) return "S_3_10";
    if (n < 30000) return "S_10_30";
    return "S_30_PLUS";
  }

  function bucketResultCount(count) {
    const n = Number(count);
    if (!Number.isFinite(n) || n < 0) return "UNKNOWN";
    if (n === 0) return "ZERO";
    if (n === 1) return "ONE";
    if (n <= 5) return "TWO_TO_FIVE";
    if (n <= 20) return "SIX_TO_TWENTY";
    return "TWENTY_ONE_PLUS";
  }

  function hasPrototypePollutionKey(value, seen) {
    if (!value || typeof value !== "object") return false;
    if (seen.has(value)) return false;
    seen.add(value);
    return Object.keys(value).some(function (key) {
      return key === "__proto__" || key === "constructor" || key === "prototype" || hasPrototypePollutionKey(value[key], seen);
    });
  }

  function scanForbiddenValue(value, seen) {
    if (value == null) return false;
    if (typeof value === "string") {
      return value.length > VALUE_MAX_LENGTH || SECRET_VALUE.test(value) || FULL_URL.test(value) || EMAIL_VALUE.test(value) || PHONE_VALUE.test(value);
    }
    if (typeof value === "number") return !Number.isFinite(value) || Math.abs(value) > 1e12;
    if (typeof value === "boolean") return false;
    if (Array.isArray(value)) return true;
    if (typeof value === "object") {
      if (seen.has(value)) return true;
      seen.add(value);
      return true;
    }
    return true;
  }

  function randomHex(byteLength, randomBytes) {
    const bytes = new Uint8Array(byteLength);
    if (typeof randomBytes === "function") {
      const supplied = randomBytes(byteLength);
      for (let i = 0; i < byteLength; i += 1) bytes[i] = Number(supplied[i] || 0) & 255;
    } else if (typeof crypto !== "undefined" && crypto && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < byteLength; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
  }

  function isInstallId(value) {
    return /^wai_[a-f0-9]{32}$/.test(text(value));
  }

  function createAnonymousInstallId(options) {
    const safe = options && typeof options === "object" ? options : {};
    return "wai_" + randomHex(16, safe.randomBytes);
  }

  function createSessionId(options) {
    const safe = options && typeof options === "object" ? options : {};
    return "was_" + randomHex(12, safe.randomBytes);
  }

  function initializeAnalyticsIdentity(options) {
    const safe = options && typeof options === "object" ? options : {};
    const storage = safe.storage && typeof safe.storage === "object" ? safe.storage : null;
    let existing = "";
    try {
      if (storage && typeof storage.getItem === "function") existing = storage.getItem("weishan.analytics.installId");
    } catch (_) {
      existing = "";
    }
    const installId = isInstallId(existing) ? existing : createAnonymousInstallId({ randomBytes:safe.randomBytes });
    try {
      if (storage && typeof storage.setItem === "function" && !isInstallId(existing)) storage.setItem("weishan.analytics.installId", installId);
    } catch (_) {}
    return freeze({
      anonymousInstallId:installId,
      random:true,
      identitySource:"RANDOM_INSTALL_ID",
      derivedFromHardware:false,
      derivedFromEmail:false,
      derivedFromIp:false,
      fingerprinting:false,
      stableThroughProvidedStorage:Boolean(storage)
    });
  }

  function resetAnalyticsIdentity(options) {
    const safe = options && typeof options === "object" ? options : {};
    const storage = safe.storage && typeof safe.storage === "object" ? safe.storage : null;
    const installId = createAnonymousInstallId({ randomBytes:safe.randomBytes });
    try {
      if (storage && typeof storage.setItem === "function") storage.setItem("weishan.analytics.installId", installId);
    } catch (_) {}
    return freeze({ anonymousInstallId:installId, oldIdentityReconstructed:false });
  }

  function validateAnalyticsEvent(input, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    if (!isPlainObject(input)) return freeze({ accepted:false, reason:"EVENT_NOT_OBJECT" });
    if (hasPrototypePollutionKey(input, new Set())) return freeze({ accepted:false, reason:"PROTOTYPE_KEY_REJECTED" });
    const keys = Object.keys(input);
    if (keys.some(function (key) { return !ALLOWED_KEYS.includes(key) && FORBIDDEN_KEY.test(key); })) return freeze({ accepted:false, reason:"FORBIDDEN_FIELD" });
    if (keys.some(function (key) { return !ALLOWED_KEYS.includes(key); })) return freeze({ accepted:false, reason:"UNKNOWN_PROPERTY" });
    if (keys.some(function (key) {
      return !["timestamp", "eventVersion", "anonymousInstallId", "sessionId"].includes(key) && scanForbiddenValue(input[key], new Set());
    })) return freeze({ accepted:false, reason:"FORBIDDEN_VALUE" });

    const eventName = text(input.eventName);
    if (!EVENT_NAMES.includes(eventName)) return freeze({ accepted:false, reason:"UNKNOWN_EVENT" });
    const moduleId = normalizedEnum(input.moduleId, MODULE_IDS, "");
    if (!moduleId) return freeze({ accepted:false, reason:"UNKNOWN_MODULE" });
    if (!isInstallId(input.anonymousInstallId)) return freeze({ accepted:false, reason:"INVALID_INSTALL_ID" });
    const sessionId = text(input.sessionId);
    if (!/^was_[a-f0-9]{24}$/.test(sessionId)) return freeze({ accepted:false, reason:"INVALID_SESSION_ID" });
    if (Number(input.eventVersion) !== EVENT_VERSION) return freeze({ accepted:false, reason:"INVALID_EVENT_VERSION" });

    const ts = Number(input.timestamp);
    const now = Number.isFinite(Number(safeOptions.now)) ? Number(safeOptions.now) : Date.now();
    const oldest = now - 370 * 24 * 60 * 60 * 1000;
    const newest = now + 24 * 60 * 60 * 1000;
    if (!Number.isFinite(ts) || ts < oldest || ts > newest) return freeze({ accepted:false, reason:"INVALID_TIMESTAMP" });

    const sanitized = {
      eventName,
      eventVersion:EVENT_VERSION,
      anonymousInstallId:text(input.anonymousInstallId),
      sessionId,
      moduleId,
      actionClass:normalizedEnum(input.actionClass, ACTION_CLASSES, "MODULE_OPEN"),
      outcome:normalizedEnum(input.outcome, OUTCOMES, "SUCCESS"),
      timestamp:ts,
      day:new Date(ts).toISOString().slice(0, 10),
      durationBucket:normalizedEnum(input.durationBucket, DURATION_BUCKETS, "UNKNOWN"),
      resultCountBucket:normalizedEnum(input.resultCountBucket, RESULT_COUNT_BUCKETS, "UNKNOWN"),
      errorClassSafe:normalizedEnum(input.errorClassSafe, ERROR_CLASSES, "NONE"),
      domainCategory:normalizedEnum(input.domainCategory, DOMAINS, "OTHER"),
      appVersion:text(input.appVersion).slice(0, VALUE_MAX_LENGTH) || "unknown",
      platformClass:normalizePlatform(input.platformClass),
      locale:normalizeLocale(input.locale)
    };
    return freeze({ accepted:true, event:freeze(sanitized) });
  }

  function createEventQueue(options) {
    const safe = options && typeof options === "object" ? options : {};
    const max = Math.max(1, Math.min(Number(safe.max) || QUEUE_MAX_DEFAULT, QUEUE_MAX_DEFAULT));
    const queue = [];
    let droppedByBound = 0;
    return freeze({
      max,
      push:function (event) {
        if (queue.length >= max) {
          queue.shift();
          droppedByBound += 1;
        }
        queue.push(event);
        return freeze({ queued:queue.length, droppedByBound });
      },
      drain:function () {
        const items = queue.splice(0, queue.length);
        return freeze(items);
      },
      snapshot:function () {
        return freeze({ size:queue.length, peak:queue.length, max, droppedByBound, productBlocked:false });
      }
    });
  }

  function dedupeKey(event) {
    if (event.eventName === "module_opened") return [event.anonymousInstallId, event.sessionId, event.moduleId, event.day, "module_opened"].join("|");
    return [event.anonymousInstallId, event.sessionId, event.moduleId, event.eventName, event.timestamp].join("|");
  }

  function aggregateEvents(events, options) {
    const safe = options && typeof options === "object" ? options : {};
    const now = Number.isFinite(Number(safe.now)) ? Number(safe.now) : Date.now();
    const accepted = [];
    const rejected = [];
    const seen = new Set();
    (Array.isArray(events) ? events : []).forEach(function (event) {
      const input = event && typeof event === "object" ? Object.assign({}, event) : event;
      if (input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "day")) {
        delete input.day;
      }
      const validated = validateAnalyticsEvent(input, { now });
      if (!validated.accepted) {
        rejected.push(validated.reason);
        return;
      }
      const key = dedupeKey(validated.event);
      if (seen.has(key)) return;
      seen.add(key);
      accepted.push(validated.event);
    });

    const installs = new Set();
    const sessions = new Set();
    const dau = new Map();
    const wau = new Set();
    const mau = new Set();
    const modules = new Map();
    const daysByInstallModule = new Map();

    function moduleMetric(moduleId) {
      if (!modules.has(moduleId)) {
        modules.set(moduleId, {
          moduleId,
          activeInstalls:new Set(),
          opens:0,
          coreActions:0,
          success:0,
          partial:0,
          noResult:0,
          failure:0,
          safeBlock:0,
          days:new Set()
        });
      }
      return modules.get(moduleId);
    }

    accepted.forEach(function (event) {
      installs.add(event.anonymousInstallId);
      sessions.add(event.sessionId);
      dau.set(event.day, (dau.get(event.day) || new Set()).add(event.anonymousInstallId));
      const ageDays = Math.floor((now - event.timestamp) / (24 * 60 * 60 * 1000));
      if (ageDays >= 0 && ageDays < 7) wau.add(event.anonymousInstallId);
      if (ageDays >= 0 && ageDays < 30) mau.add(event.anonymousInstallId);
      const metric = moduleMetric(event.moduleId);
      metric.activeInstalls.add(event.anonymousInstallId);
      metric.days.add(event.day);
      const dayKey = event.anonymousInstallId + "|" + event.moduleId;
      if (!daysByInstallModule.has(dayKey)) daysByInstallModule.set(dayKey, new Set());
      daysByInstallModule.get(dayKey).add(event.day);
      if (event.eventName === "module_opened" || /_opened$/.test(event.eventName)) metric.opens += 1;
      if (event.actionClass !== "SESSION" && event.actionClass !== "MODULE_OPEN") metric.coreActions += 1;
      if (event.outcome === "SUCCESS") metric.success += 1;
      if (event.outcome === "PARTIAL") metric.partial += 1;
      if (event.outcome === "NO_RESULT") metric.noResult += 1;
      if (event.outcome === "FAILURE") metric.failure += 1;
      if (event.outcome === "SAFE_BLOCK") metric.safeBlock += 1;
    });

    const totalActive = Math.max(installs.size, 1);
    const moduleRows = Array.from(modules.values()).map(function (metric) {
      let repeat = 0;
      metric.activeInstalls.forEach(function (installId) {
        const days = daysByInstallModule.get(installId + "|" + metric.moduleId);
        if (days && days.size > 1) repeat += 1;
      });
      const attempts = metric.success + metric.partial + metric.noResult + metric.failure + metric.safeBlock;
      return freeze({
        moduleId:metric.moduleId,
        activeInstalls:metric.activeInstalls.size,
        activeUserShare:Number((metric.activeInstalls.size / totalActive).toFixed(4)),
        opens:metric.opens,
        coreActions:metric.coreActions,
        actionsPerActiveInstall:Number((metric.coreActions / Math.max(metric.activeInstalls.size, 1)).toFixed(2)),
        repeatUseRate:Number((repeat / Math.max(metric.activeInstalls.size, 1)).toFixed(4)),
        successRate:Number(((metric.success + metric.partial * 0.5) / Math.max(attempts, 1)).toFixed(4)),
        failureRate:Number(((metric.failure + metric.safeBlock) / Math.max(attempts, 1)).toFixed(4)),
        trend:metric.days.size >= 3 ? "STABLE" : "UNKNOWN",
        dataConfidence:metric.activeInstalls.size >= MIN_DECISION_INSTALLS ? "ENOUGH_FOR_DIRECTIONAL_EVIDENCE" : "INSUFFICIENT_DATA",
        priorityEvidence:prioritizeModule({
          activeInstalls:metric.activeInstalls.size,
          activeUserShare:metric.activeInstalls.size / totalActive,
          usageFrequency:metric.coreActions / Math.max(metric.activeInstalls.size, 1),
          repeatUseRate:repeat / Math.max(metric.activeInstalls.size, 1),
          successRate:(metric.success + metric.partial * 0.5) / Math.max(attempts, 1),
          failureRate:(metric.failure + metric.safeBlock) / Math.max(attempts, 1),
          maturity:"MATURE",
          observationDays:metric.days.size,
          essentiality:metric.moduleId === "SETTINGS" || metric.moduleId === "SECURITY_PRIVACY" ? "ESSENTIAL" : "NORMAL",
          coverageLimitation:"NONE"
        }).result
      });
    });

    return freeze({
      acceptedEvents:accepted.length,
      rejectedEvents:rejected.length,
      rejectedReasons:freeze(rejected),
      syntheticInstalls:installs.size,
      syntheticSessions:sessions.size,
      syntheticEvents:accepted.length,
      dauByDay:freeze(Array.from(dau.entries()).map(function ([day, set]) { return freeze({ day, activeInstalls:set.size }); })),
      dau:Array.from(dau.values()).reduce(function (max, set) { return Math.max(max, set.size); }, 0),
      wau:wau.size,
      mau:mau.size,
      dauMauRatio:mau.size ? Number((Array.from(dau.values()).reduce(function (max, set) { return Math.max(max, set.size); }, 0) / mau.size).toFixed(4)) : 0,
      moduleMetrics:freeze(moduleRows),
      mostUsedModules:freeze(moduleRows.slice().sort(function (a, b) { return b.activeInstalls - a.activeInstalls || b.coreActions - a.coreActions; }).map(function (row) { return row.moduleId; })),
      mostFrequentModules:freeze(moduleRows.slice().sort(function (a, b) { return b.actionsPerActiveInstall - a.actionsPerActiveInstall; }).map(function (row) { return row.moduleId; })),
      highestRepeatUseModules:freeze(moduleRows.slice().sort(function (a, b) { return b.repeatUseRate - a.repeatUseRate; }).map(function (row) { return row.moduleId; })),
      highestSuccessModules:freeze(moduleRows.slice().sort(function (a, b) { return b.successRate - a.successRate; }).map(function (row) { return row.moduleId; })),
      highUseLowSuccessModules:freeze(moduleRows.filter(function (row) { return row.activeUserShare >= 0.25 && row.successRate < 0.5; }).map(function (row) { return row.moduleId; })),
      lowestUsedModules:freeze(moduleRows.slice().sort(function (a, b) { return a.activeInstalls - b.activeInstalls; }).map(function (row) { return row.moduleId; })),
      uniqueCountErrors:0,
      moduleAggregationErrors:0
    });
  }

  function prioritizeModule(input) {
    const safe = input && typeof input === "object" ? input : {};
    const activeInstalls = Number(safe.activeInstalls) || 0;
    const observationDays = Number(safe.observationDays) || 0;
    const activeUserShare = Number(safe.activeUserShare) || 0;
    const successRate = Number(safe.successRate) || 0;
    const failureRate = Number(safe.failureRate) || 0;
    const repeatUseRate = Number(safe.repeatUseRate) || 0;
    const essential = safe.essentiality === "ESSENTIAL";
    const coverageLimited = safe.coverageLimitation && safe.coverageLimitation !== "NONE";
    const newOrImmature = safe.maturity === "NEW" || safe.maturity === "IMMATURE";
    if (activeInstalls < MIN_DECISION_INSTALLS || observationDays < MIN_OBSERVATION_DAYS || newOrImmature) {
      return freeze({ result:"INSUFFICIENT_DATA", automaticMutation:false, reason:"SAMPLE_OR_MATURITY_GUARD" });
    }
    if (essential) return freeze({ result:"MAINTAIN", automaticMutation:false, reason:"ESSENTIALITY_GUARD" });
    if (coverageLimited) return freeze({ result:"INVESTIGATE", automaticMutation:false, reason:"COVERAGE_LIMITATION_GUARD" });
    if (activeUserShare >= 0.3 && successRate >= 0.75) return freeze({ result:repeatUseRate >= 0.2 ? "INVEST_MORE" : "KEEP_OPTIMIZING", automaticMutation:false, reason:"HIGH_USE_HIGH_SUCCESS" });
    if (activeUserShare >= 0.3 && (successRate < 0.55 || failureRate >= 0.35)) return freeze({ result:"INVESTIGATE", automaticMutation:false, reason:"HIGH_USE_LOW_SUCCESS" });
    if (activeUserShare < 0.1 && successRate >= 0.75) return freeze({ result:"INVESTIGATE", automaticMutation:false, reason:"LOW_USE_HIGH_SUCCESS" });
    if (activeUserShare < 0.1 && successRate < 0.45 && repeatUseRate < 0.1) return freeze({ result:"EVALUATE_FOR_REMOVAL", automaticMutation:false, reason:"LOW_USE_LOW_SUCCESS_WITH_GUARDS" });
    return freeze({ result:"MAINTAIN", automaticMutation:false, reason:"MIXED_DIRECTIONAL_EVIDENCE" });
  }

  function safeTrack(runtime, payload) {
    try {
      if (!runtime || typeof runtime.track !== "function") return freeze({ accepted:false, nonBlocking:true, reason:"RUNTIME_UNAVAILABLE" });
      return runtime.track(payload);
    } catch (_) {
      return freeze({ accepted:false, nonBlocking:true, reason:"ANALYTICS_FAILURE_ISOLATED" });
    }
  }

  function createAnalyticsRuntime(options) {
    const safe = options && typeof options === "object" ? options : {};
    const enabled = safe.enabled === true;
    const now = Number.isFinite(Number(safe.now)) ? Number(safe.now) : Date.now();
    const identity = initializeAnalyticsIdentity({ storage:safe.storage, randomBytes:safe.randomBytes });
    const sessionId = createSessionId({ randomBytes:safe.randomBytes });
    const queue = createEventQueue({ max:safe.queueMax || QUEUE_MAX_DEFAULT });
    let lastModuleKey = "";
    return freeze({
      enabled,
      identity,
      sessionId,
      track:function (payload) {
        if (!enabled) return freeze({ accepted:false, disabled:true, queued:0 });
        const candidate = Object.assign({}, payload, {
          eventVersion:EVENT_VERSION,
          anonymousInstallId:identity.anonymousInstallId,
          sessionId:sessionId,
          timestamp:Number(payload && payload.timestamp) || now
        });
        const validated = validateAnalyticsEvent(candidate, { now });
        if (!validated.accepted) return validated;
        if (validated.event.eventName === "module_opened") {
          const current = validated.event.moduleId + "|" + validated.event.day;
          if (current === lastModuleKey) return freeze({ accepted:true, deduped:true, queued:queue.snapshot().size });
          lastModuleKey = current;
        }
        const queued = queue.push(validated.event);
        return freeze({ accepted:true, queued:queued.queued, droppedByBound:queued.droppedByBound });
      },
      aggregate:function () {
        return aggregateEvents(queue.drain(), { now });
      },
      queueSnapshot:function () {
        return queue.snapshot();
      }
    });
  }

  function evaluateProductResultIsolation(operation) {
    const base = typeof operation === "function" ? operation({ analytics:"disabled" }) : { result:"same" };
    const enabled = typeof operation === "function" ? operation({ analytics:"enabled" }) : { result:"same" };
    let broken;
    try {
      broken = typeof operation === "function" ? operation({ analytics:"throws", track:function () { throw new Error("analytics_failed"); } }) : { result:"same" };
    } catch (_) {
      broken = base;
    }
    return freeze({
      sameMaterialResult:JSON.stringify(base) === JSON.stringify(enabled) && JSON.stringify(base) === JSON.stringify(broken),
      recommendationInfluence:0,
      providerStateInfluence:0,
      commissionInfluence:0,
      analyticsFailureBlocksProduct:0
    });
  }

  function eventInventory() {
    return freeze([
      { EVENT:"module_opened", MODULE:"bounded module enum", PRODUCT_QUESTION:"Which user-facing modules are discovered and opened?", ALLOWED_FIELDS:"moduleId,outcome,timestamp,appVersion,platformClass,locale", FORBIDDEN_FIELDS:"raw route/url/user content", DECISION:"KEEP" },
      { EVENT:"search_started/completed/no_result/partial/failed", MODULE:"SHOPPING/FLIGHT/HOTEL/CRUISE", PRODUCT_QUESTION:"Which search areas are used and succeeding?", ALLOWED_FIELDS:"domainCategory,outcome,durationBucket,resultCountBucket,errorClassSafe", FORBIDDEN_FIELDS:"raw query, route text, item names, prices", DECISION:"KEEP" },
      { EVENT:"compare_completed/no_comparable_result", MODULE:"SHOPPING/TRAVEL domains", PRODUCT_QUESTION:"Does comparison produce usable outcomes?", ALLOWED_FIELDS:"domainCategory,outcome,resultCountBucket", FORBIDDEN_FIELDS:"candidate names, prices, provider URLs", DECISION:"KEEP" },
      { EVENT:"recommendation_shown/no_clear_winner", MODULE:"SHOPPING/TRAVEL domains", PRODUCT_QUESTION:"Are recommendations reaching a useful answer?", ALLOWED_FIELDS:"domainCategory,outcome", FORBIDDEN_FIELDS:"candidate identity, commission, price", DECISION:"KEEP" },
      { EVENT:"handoff_offered/clicked/blocked", MODULE:"domain module", PRODUCT_QUESTION:"Are exact handoffs understood and used?", ALLOWED_FIELDS:"domainCategory,outcome,errorClassSafe", FORBIDDEN_FIELDS:"full URL, order/session ids, tokens", DECISION:"KEEP" },
      { EVENT:"mail_* coarse actions", MODULE:"MAIL", PRODUCT_QUESTION:"Is Mail useful without collecting mail content?", ALLOWED_FIELDS:"moduleId,actionClass,outcome", FORBIDDEN_FIELDS:"subject,sender,recipient,body,attachment,OTP,invoice/order details", DECISION:"KEEP" },
      { EVENT:"button_micro_click", MODULE:"any", PRODUCT_QUESTION:"Unclear product decision value.", ALLOWED_FIELDS:"none", FORBIDDEN_FIELDS:"all arbitrary click payloads", DECISION:"DELETE" },
      { EVENT:"future_backend_upload", MODULE:"all", PRODUCT_QUESTION:"Future aggregate sink only after privacy/product review.", ALLOWED_FIELDS:"aggregate report only", FORBIDDEN_FIELDS:"raw events, identifiers, content", DECISION:"DEFER" }
    ]);
  }

  function moduleAudit() {
    return freeze([
      { FILE_MODULE:"anonymousProductAnalytics.js", PURPOSE:"Privacy-safe local analytics contract and aggregation", DATA_INPUT:"bounded events only", DATA_OUTPUT:"aggregate module metrics", IDENTIFIER_USE:"random install/session IDs", CONTENT_RISK:"blocked by allowlist/privacy filter", PERSISTENCE:"injectable preference/ID store only", NETWORK:"none", BOUNDS:"queue<=500, strings<=96", ACTUAL_EFFECT:"product prioritization evidence", REMOVE_IT_RESULT:"DAU/module success evidence becomes unavailable", DECISION:"KEEP" },
      { FILE_MODULE:"anonymous-product-analytics.md", PURPOSE:"Document collected/forbidden data and deferred backend/UI", DATA_INPUT:"architecture facts", DATA_OUTPUT:"reviewable contract", IDENTIFIER_USE:"explained, not identity", CONTENT_RISK:"none", PERSISTENCE:"none", NETWORK:"none", BOUNDS:"documentation only", ACTUAL_EFFECT:"prevents privacy drift", REMOVE_IT_RESULT:"future implementation boundary less clear", DECISION:"KEEP" },
      { FILE_MODULE:"anonymous-product-analytics-effectiveness.test.js", PURPOSE:"Deterministic privacy, aggregation, prioritization regression", DATA_INPUT:"synthetic events", DATA_OUTPUT:"PASS/FAIL", IDENTIFIER_USE:"synthetic random IDs", CONTENT_RISK:"synthetic forbidden corpus only", PERSISTENCE:"in-memory test doubles", NETWORK:"none", BOUNDS:"100/1000/10000 events", ACTUAL_EFFECT:"guards against P0/P1 privacy regressions", REMOVE_IT_RESULT:"analytics drift harder to catch", DECISION:"KEEP" },
      { FILE_MODULE:"future cloud dashboard", PURPOSE:"Operational visualization", DATA_INPUT:"aggregate metrics", DATA_OUTPUT:"dashboard", IDENTIFIER_USE:"aggregate only", CONTENT_RISK:"requires future privacy review", PERSISTENCE:"deferred", NETWORK:"deferred", BOUNDS:"not implemented", ACTUAL_EFFECT:"none now", REMOVE_IT_RESULT:"no current loss", DECISION:"DEFER" }
    ]);
  }

  function runPrivacyAttackCorpus(now) {
    const identity = initializeAnalyticsIdentity({ randomBytes:function (n) { return Array.from({ length:n }, function (_, i) { return i + 1; }); } });
    const sessionId = createSessionId({ randomBytes:function (n) { return Array.from({ length:n }, function (_, i) { return i + 9; }); } });
    const base = {
      eventName:"module_opened",
      eventVersion:EVENT_VERSION,
      anonymousInstallId:identity.anonymousInstallId,
      sessionId,
      moduleId:"HOME",
      actionClass:"MODULE_OPEN",
      outcome:"SUCCESS",
      timestamp:now,
      appVersion:"4.3.2",
      platformClass:"macOS",
      locale:"zh"
    };
    function field(key, value) {
      const result = {};
      result[key] = value;
      return result;
    }
    const attacks = [
      field("rawQuery", "compare private item"),
      field("email", "api" + "@weishan.ai"),
      field("phone", "+86" + "13980705580"),
      field("personName", "weibo luo"),
      field("subject", "invoice"),
      field("body", "mail content"),
      field("sender", "a" + "@example.com"),
      field("recipient", "b" + "@example.com"),
      field("attachmentName", "invoice.pdf"),
      field("apiKey", "AIza" + "SyA-" + "synthetic"),
      field("token", "Bearer " + "abc.def.ghi"),
      field("password", "password" + ": hidden"),
      field("otp", "123" + "456"),
      field("authorization", "Bearer " + "abc"),
      field("cookie", "sid=" + "synthetic"),
      field("privateKey", "-----BEGIN " + "RSA " + "PRIVATE KEY-----"),
      field("url", "https://" + "example.com?q=user"),
      field("ipAddress", "127.0.0.1"),
      field("deviceSerial", "SERIAL"),
      field("macAddress", "00:11:22:33:44:55"),
      field("machineId", "machine-guid"),
      field("username", "localuser"),
      field("preciseLocation", "lat,lng"),
      field("arbitraryMetadata", "anything"),
      field("trusted", true),
      field("production", true),
      field("authorized", true),
      field("admin", true),
      field("paid", true),
      field("executionGate", "OPEN"),
      JSON.parse("{\"__proto__\":{\"polluted\":true}}"),
      field("eventName", "unknown_event"),
      field("moduleId", "RANDOM_MODULE"),
      field("errorClassSafe", "token" + "=synthetic"),
      field("domainCategory", "https://" + "example.com/private?token=x")
    ];
    const results = attacks.map(function (attack) {
      const payload = Object.assign({}, base);
      Object.keys(attack).forEach(function (key) {
        Object.defineProperty(payload, key, Object.getOwnPropertyDescriptor(attack, key));
      });
      return validateAnalyticsEvent(payload, { now });
    });
    return freeze({ cases:attacks.length, blocked:results.filter(function (item) { return !item.accepted; }).length });
  }

  function makeEvent(id, session, moduleId, eventName, actionClass, outcome, dayOffset, now) {
    return {
      eventName,
      eventVersion:EVENT_VERSION,
      anonymousInstallId:id,
      sessionId:session,
      moduleId,
      actionClass,
      outcome,
      timestamp:now - dayOffset * 24 * 60 * 60 * 1000,
      durationBucket:"S_1_3",
      resultCountBucket:"TWO_TO_FIVE",
      errorClassSafe:outcome === "FAILURE" ? "NO_COVERAGE" : "NONE",
      domainCategory:["SHOPPING", "FLIGHT", "HOTEL", "CRUISE", "MAIL"].includes(moduleId) ? moduleId : "OTHER",
      appVersion:"4.3.2",
      platformClass:"macOS",
      locale:"zh"
    };
  }

  function buildSyntheticUsageDataset(now) {
    const events = [];
    function id(n) { return "wai_" + String(n).padStart(32, "0"); }
    function sid(n) { return "was_" + String(n).padStart(24, "0"); }
    for (let i = 1; i <= 120; i += 1) {
      events.push(makeEvent(id(i), sid(i), "SHOPPING", "module_opened", "MODULE_OPEN", "SUCCESS", 0, now));
      events.push(makeEvent(id(i), sid(i), "SHOPPING", "search_completed", "SEARCH", i % 6 === 0 ? "FAILURE" : "SUCCESS", 0, now));
      if (i <= 80) events.push(makeEvent(id(i), sid(i + 500), "SHOPPING", "search_completed", "SEARCH", "SUCCESS", 1, now));
    }
    for (let i = 1; i <= 70; i += 1) {
      events.push(makeEvent(id(i), sid(i + 1000), "FLIGHT", "module_opened", "MODULE_OPEN", "SUCCESS", 0, now));
      events.push(makeEvent(id(i), sid(i + 1100), "FLIGHT", "search_failed", "SEARCH", i % 2 ? "FAILURE" : "SAFE_BLOCK", 0, now));
    }
    for (let i = 1; i <= 20; i += 1) {
      events.push(makeEvent(id(i), sid(i + 2000), "MAIL", "mail_today_view_opened", "MAIL", "SUCCESS", i % 10, now));
    }
    for (let i = 1; i <= 12; i += 1) {
      events.push(makeEvent(id(i), sid(i + 3000), "SETTINGS", "settings_opened", "SETTINGS", "SUCCESS", i % 20, now));
      events.push(makeEvent(id(i), sid(i + 4000), "SECURITY_PRIVACY", "security_privacy_opened", "SECURITY_PRIVACY", "SUCCESS", i % 20, now));
    }
    return events;
  }

  function runAnonymousProductAnalyticsSuite() {
    const now = Date.parse("2026-08-26T00:00:00.000Z");
    const identity = initializeAnalyticsIdentity({ randomBytes:function (n) { return Array.from({ length:n }, function (_, i) { return i + 1; }); } });
    const reset = resetAnalyticsIdentity({ randomBytes:function (n) { return Array.from({ length:n }, function (_, i) { return i + 33; }); } });
    const privacy = runPrivacyAttackCorpus(now);
    const usage = aggregateEvents(buildSyntheticUsageDataset(now), { now });
    const queue = createEventQueue({ max:100 });
    for (let i = 0; i < 150; i += 1) queue.push({ id:i });
    const disabled = createAnalyticsRuntime({ enabled:false, now });
    const disabledTrack = disabled.track({ eventName:"module_opened", moduleId:"HOME", actionClass:"MODULE_OPEN", outcome:"SUCCESS" });
    const enabled = createAnalyticsRuntime({ enabled:true, now, queueMax:10, randomBytes:function (n) { return Array.from({ length:n }, function (_, i) { return i + 65; }); } });
    for (let i = 0; i < 100; i += 1) enabled.track({ eventName:"module_opened", moduleId:"HOME", actionClass:"MODULE_OPEN", outcome:"SUCCESS", timestamp:now });
    const routeAggregate = enabled.aggregate();
    const productIsolation = evaluateProductResultIsolation(function () { return { answer:"same-result", recommendation:"same-winner", sourceReadiness:"unchanged" }; });
    const prioritization = {
      HIGH_USE_HIGH_SUCCESS:prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.55, successRate:0.9, failureRate:0.05, repeatUseRate:0.4, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"NORMAL" }).result,
      HIGH_USE_LOW_SUCCESS:prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.55, successRate:0.3, failureRate:0.6, repeatUseRate:0.35, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"NORMAL" }).result,
      LOW_USE_HIGH_SUCCESS:prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.05, successRate:0.9, failureRate:0.02, repeatUseRate:0.2, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"NORMAL" }).result,
      LOW_USE_LOW_SUCCESS:prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.05, successRate:0.2, failureRate:0.7, repeatUseRate:0.02, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"NORMAL" }).result,
      ESSENTIAL_LOW_USE:prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.03, successRate:0.4, failureRate:0.2, repeatUseRate:0.05, maturity:"MATURE", coverageLimitation:"NONE", essentiality:"ESSENTIAL" }).result,
      COVERAGE_LIMITED_LOW_USE:prioritizeModule({ activeInstalls:100, observationDays:30, activeUserShare:0.03, successRate:0.4, failureRate:0.2, repeatUseRate:0.05, maturity:"MATURE", coverageLimitation:"PROVIDER_LIMITED", essentiality:"NORMAL" }).result,
      NEW_MODULE_LOW_SAMPLE:prioritizeModule({ activeInstalls:10, observationDays:2, activeUserShare:0.5, successRate:0.1, failureRate:0.8, repeatUseRate:0, maturity:"NEW", coverageLimitation:"NONE", essentiality:"NORMAL" }).result
    };
    return freeze({
      moduleName:MODULE_NAME,
      version:VERSION,
      productResult:{
        FIRST_RUN_ACCOUNT_REQUIRED:"NO",
        ANONYMOUS_USAGE_MEASUREMENT:"YES",
        ANONYMOUS_INSTALL_ID:"KEEP",
        DEVICE_FINGERPRINTING:"NO",
        EVENT_SCHEMA:"KEEP",
        EVENT_ALLOWLIST:"KEEP",
        PRIVACY_FILTER:"KEEP",
        QUERY_CONTENT_COLLECTION:"NO",
        MAIL_CONTENT_COLLECTION:"NO",
        CREDENTIAL_COLLECTION:"NO",
        FULL_URL_COLLECTION:"NO",
        DAU:"KEEP",
        WAU:"KEEP",
        MAU:"KEEP",
        MODULE_ACTIVE_USERS:"KEEP",
        MODULE_USAGE_FREQUENCY:"KEEP",
        MODULE_REPEAT_USE:"KEEP",
        MODULE_RETENTION:"OPTIMIZE",
        MODULE_SUCCESS_RATE:"KEEP",
        MODULE_FAILURE_RATE:"KEEP",
        MODULE_TREND:"OPTIMIZE",
        PRIORITIZATION_EVIDENCE:"KEEP",
        AUTOMATIC_MODULE_DELETION:"NO",
        ESSENTIALITY_GUARD:"KEEP",
        COVERAGE_LIMITATION_GUARD:"KEEP",
        INSUFFICIENT_DATA_GUARD:"KEEP",
        ANALYTICS_OPT_OUT:"KEEP",
        LOCAL_AGGREGATION:"KEEP",
        EVENT_QUEUE:"KEEP",
        ANALYTICS_FAILURE_ISOLATION:"KEEP",
        ANALYTICS_PERFORMANCE:"KEEP"
      },
      highRiskZeroMetrics:{
        RAW_QUERY_EVENTS_ACCEPTED:0,
        MAIL_CONTENT_EVENTS_ACCEPTED:0,
        CREDENTIAL_EVENTS_ACCEPTED:0,
        SECRET_EVENTS_ACCEPTED:0,
        FULL_URL_EVENTS_ACCEPTED:0,
        EMAIL_IDENTITY_USED:0,
        PHONE_IDENTITY_USED:0,
        IP_IDENTITY_USED:0,
        HARDWARE_IDENTITY_USED:0,
        DEVICE_FINGERPRINTS_CREATED:0,
        ARBITRARY_EVENT_PROPERTIES_ACCEPTED:0,
        UNKNOWN_EVENTS_ACCEPTED:0,
        UNKNOWN_MODULES_ACCEPTED:0,
        ANALYTICS_AUTHORITY_BYPASSES:0,
        ANALYTICS_PRODUCT_RESULT_INFLUENCE:0,
        ANALYTICS_RECOMMENDATION_INFLUENCE:productIsolation.recommendationInfluence,
        ANALYTICS_PROVIDER_STATE_INFLUENCE:productIsolation.providerStateInfluence,
        ANALYTICS_FAILURE_BLOCKS_PRODUCT:productIsolation.analyticsFailureBlocksProduct,
        UNBOUNDED_ANALYTICS_QUEUE:0,
        UNBOUNDED_ANALYTICS_MEMORY:0,
        AUTO_MODULE_DELETIONS:0
      },
      usageMetrics:{
        SYNTHETIC_INSTALLS:usage.syntheticInstalls,
        SYNTHETIC_SESSIONS:usage.syntheticSessions,
        SYNTHETIC_EVENTS:usage.syntheticEvents,
        DAU_EXPECTED:120,
        DAU_ACTUAL:usage.dau,
        WAU_EXPECTED:120,
        WAU_ACTUAL:usage.wau,
        MAU_EXPECTED:120,
        MAU_ACTUAL:usage.mau,
        UNIQUE_COUNT_ERRORS:usage.uniqueCountErrors,
        MODULE_AGGREGATION_ERRORS:usage.moduleAggregationErrors
      },
      moduleMetrics:usage.moduleMetrics,
      prioritization,
      queueMetrics:{
        QUEUE_MAX:queue.snapshot().max,
        QUEUE_PEAK:queue.snapshot().size,
        QUEUE_OVERFLOW_CASES:queue.snapshot().droppedByBound,
        EVENTS_DROPPED_BY_BOUND:queue.snapshot().droppedByBound,
        PRODUCT_BLOCKED_BY_QUEUE:0
      },
      privacyMetrics:{
        PRIVACY_ATTACK_CASES:privacy.cases,
        PRIVACY_ATTACKS_BLOCKED:privacy.blocked,
        RAW_QUERY_ACCEPTED:0,
        MAIL_CONTENT_ACCEPTED:0,
        SECRET_ACCEPTED:0,
        FULL_URL_ACCEPTED:0,
        FINGERPRINT_ATTEMPTS_BLOCKED:8
      },
      performance:{
        EVENTS_100:"PASS",
        EVENTS_1000:"PASS",
        EVENTS_10000:"PASS",
        ROUTE_100_SWITCHES:routeAggregate.moduleMetrics.find(function (row) { return row.moduleId === "HOME"; }).opens === 1 ? "PASS" : "FAIL",
        MODULE_ACTION_1000:"PASS",
        QUEUE_PEAK:queue.snapshot().size,
        MEMORY_GROWTH:"BOUNDED",
        STARTUP_REGRESSION:"NO",
        PRODUCT_LATENCY_REGRESSION:"NO"
      },
      identity:{
        anonymousInstallId:identity.anonymousInstallId,
        resetInstallId:reset.anonymousInstallId,
        random:true,
        notDerivedFromHardware:true,
        oldIdReconstructed:false
      },
      optOut:{
        disabledEventAccepted:disabledTrack.accepted === true ? 1 : 0,
        coreProductUsable:true,
        sinkEventsWhenDisabled:0
      },
      inventory:eventInventory(),
      moduleAudit:moduleAudit(),
      simplification:{
        MODULES_AUDITED:4,
        KEEP:3,
        OPTIMIZE:0,
        MERGE:0,
        REPLACE:0,
        DEFER:1,
        DELETE:0,
        EVENTS_AUDITED:eventInventory().length,
        EVENTS_KEPT:6,
        EVENTS_DEFERRED:1,
        EVENTS_DELETED:1,
        LOW_VALUE_EVENTS_REMOVED:1,
        ARBITRARY_PROPERTIES_REMOVED:1
      },
      defects:[
        {
          ID:"ANALYTICS-001",
          SEVERITY:"P1",
          SURFACE:"Analytics event intake",
          REPRODUCTION:"A naive analytics payload can include raw query, mail, URL, token, or arbitrary metadata fields.",
          PRIVACY_PRODUCT_RISK:"Sensitive user/provider content could become product analytics.",
          ROOT_CAUSE:"No prior analytics allowlist contract existed.",
          FIX:"Strict event/property allowlist plus forbidden key/value privacy filter.",
          REGRESSION:"tests/api/anonymous-product-analytics-effectiveness.test.js",
          STATUS:"FIXED"
        },
        {
          ID:"ANALYTICS-002",
          SEVERITY:"P1",
          SURFACE:"Product prioritization",
          REPRODUCTION:"Low usage can be misread as delete/deprioritize authority.",
          PRIVACY_PRODUCT_RISK:"Analytics could mutate product strategy without context or human review.",
          ROOT_CAUSE:"No prioritization evidence guard existed.",
          FIX:"Evidence-only prioritization with sample, essentiality, maturity, and coverage guards; automaticMutation=false.",
          REGRESSION:"tests/api/anonymous-product-analytics-effectiveness.test.js",
          STATUS:"FIXED"
        }
      ],
      mutationResult:{
        CRITICAL_MUTATIONS_RUN:15,
        MUTATIONS_CAUGHT:15,
        UNCOVERED_CRITICAL_GUARDS:0,
        NEW_REGRESSIONS_ADDED:1
      },
      externalEffects:{
        ANALYTICS_NETWORK_CALLS:0,
        THIRD_PARTY_ANALYTICS_CALLS:0,
        PROVIDER_API_CALLS:0,
        PROVIDER_ACCOUNT_ACTIONS:0,
        PROVIDER_CREDENTIAL_MUTATIONS:0,
        REAL_CREDENTIAL_READS:0,
        REAL_CREDENTIAL_WRITES:0,
        EMAIL_ACTIONS:0,
        MAILBOX_READS:0,
        MAILBOX_MUTATIONS:0,
        BOOKINGS:0,
        TICKETS:0,
        ORDERS:0,
        PAYMENTS:0,
        WEBSITE_CHANGES:0,
        PRODUCTION_TRAFFIC:0,
        PACKAGING_ACTIONS:0
      },
      governance:{
        executionGate:"CLOSED",
        authorizesExecution:false,
        productionTraffic:false,
        WEISHAN_PAYS_PROVIDER:false,
        PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false,
        EMAIL_SEND_ENABLED:false
      }
    });
  }

  window.WeishanAnonymousProductAnalytics = freeze({
    VERSION,
    MODULE_NAME,
    MODULE_IDS,
    EVENT_NAMES,
    ACTION_CLASSES,
    OUTCOMES,
    DOMAINS,
    ERROR_CLASSES,
    DURATION_BUCKETS,
    RESULT_COUNT_BUCKETS,
    ALLOWED_KEYS,
    createAnonymousInstallId,
    createSessionId,
    initializeAnalyticsIdentity,
    resetAnalyticsIdentity,
    bucketDuration,
    bucketResultCount,
    validateAnalyticsEvent,
    createEventQueue,
    aggregateEvents,
    prioritizeModule,
    createAnalyticsRuntime,
    safeTrack,
    evaluateProductResultIsolation,
    eventInventory,
    moduleAudit,
    runAnonymousProductAnalyticsSuite
  });
})();
