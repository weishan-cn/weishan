;(function () {
  "use strict";

  const PROVIDER_FAILURE_RETRY_RESILIENCE_VERSION = "4.2.8";
  const MODULE_NAME = "provider_failure_retry_resilience_v1";
  const TERMINAL_NON_RETRYABLE = /^(AUTH|BLOCKED_POLICY|DECOMMISSIONED|CREDENTIAL_MISSING|CANCELLED|MALFORMED_RESPONSE)$/;
  const RETRYABLE = /^(NETWORK|TIMEOUT|RATE_LIMIT|SOURCE_UNAVAILABLE)$/;
  const DEFAULT_MAX_ATTEMPTS = 2;
  const DEFAULT_TIMEOUT_MS = 5000;
  const DEFAULT_BACKOFF_MS = 100;
  const MAX_ATTEMPTS_CAP = 3;
  const MAX_DELAY_MS = 30000;

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function finiteNumber(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(parsed)));
  }

  function sanitizeErrorMessage(value) {
    return text(value || "provider_source_failed")
      .replace(/https?:\/\/\S+/ig, "redacted-url")
      .replace(/bearer\s+[a-z0-9._~+/-]+/ig, "bearer redacted")
      .replace(/(token|api[_-]?key|secret|password|authorization|x-signature)\s*[:=]\s*["']?[^"',\s}]+/ig, "$1=redacted")
      .slice(0, 160) || "provider_source_failed";
  }

  function normalizeCategory(value) {
    const raw = text(value || "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (/^(NETWORK|ECONNRESET|ENOTFOUND|EAI_AGAIN|CONNECTION_RESET)$/.test(raw)) return "NETWORK";
    if (/^(TIMEOUT|ETIMEDOUT|ABORT_TIMEOUT|REQUEST_TIMEOUT)$/.test(raw)) return "TIMEOUT";
    if (/^(AUTH|UNAUTHORIZED|FORBIDDEN|401|403)$/.test(raw)) return "AUTH";
    if (/^(RATE_LIMIT|TOO_MANY_REQUESTS|429)$/.test(raw)) return "RATE_LIMIT";
    if (/^(BLOCKED|BLOCKED_POLICY|POLICY_BLOCKED|DECOMMISSIONED)$/.test(raw)) return raw === "DECOMMISSIONED" ? "DECOMMISSIONED" : "BLOCKED_POLICY";
    if (/^(MALFORMED|MALFORMED_RESPONSE|SCHEMA_INVALID|INVALID_RESPONSE)$/.test(raw)) return "MALFORMED_RESPONSE";
    if (/^(SOURCE_UNAVAILABLE|UNAVAILABLE|SERVICE_UNAVAILABLE|503|502)$/.test(raw)) return "SOURCE_UNAVAILABLE";
    if (/^(CREDENTIAL_MISSING|MISSING_CREDENTIAL|NO_CREDENTIAL)$/.test(raw)) return "CREDENTIAL_MISSING";
    if (/^(CANCELLED|CANCELED|ABORTED|ABORT_ERROR)$/.test(raw)) return "CANCELLED";
    return "UNKNOWN";
  }

  function classifyProviderFailure(input) {
    const safe = obj(input);
    const code = finiteNumber(safe.statusCode || safe.code, 0, 0, 999);
    const message = sanitizeErrorMessage(safe.message || safe.error || safe.reason || "");
    let category = normalizeCategory(safe.category || safe.failureClass || safe.code);
    if (category === "UNKNOWN") {
      if (code === 408 || /timeout/i.test(message)) category = "TIMEOUT";
      else if (code === 401 || code === 403 || /unauthori[sz]ed|forbidden/i.test(message)) category = "AUTH";
      else if (code === 429 || /rate.?limit|too many/i.test(message)) category = "RATE_LIMIT";
      else if (code === 502 || code === 503 || /unavailable|service/i.test(message)) category = "SOURCE_UNAVAILABLE";
      else if (/network|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(message)) category = "NETWORK";
      else if (/blocked.?policy|policy.?blocked|decommissioned/i.test(message)) category = /decommissioned/i.test(message) ? "DECOMMISSIONED" : "BLOCKED_POLICY";
      else if (/malformed|invalid response|schema/i.test(message)) category = "MALFORMED_RESPONSE";
      else if (/credential.*missing|missing.*credential/i.test(message)) category = "CREDENTIAL_MISSING";
      else if (/cancel|abort/i.test(message)) category = "CANCELLED";
    }
    const retryable = RETRYABLE.test(category) && !TERMINAL_NON_RETRYABLE.test(category);
    return clone({
      moduleName:MODULE_NAME,
      appVersion:PROVIDER_FAILURE_RETRY_RESILIENCE_VERSION,
      category,
      retryable,
      code,
      message,
      redacted:true
    });
  }

  function parseRetryAfterMs(value, options) {
    const safe = obj(options);
    const cap = finiteNumber(safe.maxDelayMs, MAX_DELAY_MS, 0, MAX_DELAY_MS);
    if (value == null || value === "") return null;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return Math.max(0, Math.min(cap, Math.floor(numeric * 1000)));
    const parsedDate = Date.parse(String(value));
    if (!Number.isFinite(parsedDate)) return null;
    const now = Number.isFinite(Number(safe.nowMs)) ? Number(safe.nowMs) : Date.now();
    return Math.max(0, Math.min(cap, parsedDate - now));
  }

  function buildRetryDecision(input) {
    const safe = obj(input);
    const failure = classifyProviderFailure(safe.failure || safe.error || safe);
    const attempt = finiteNumber(safe.attempt, 1, 1, MAX_ATTEMPTS_CAP);
    const maxAttempts = finiteNumber(safe.maxAttempts, DEFAULT_MAX_ATTEMPTS, 1, MAX_ATTEMPTS_CAP);
    const baseDelayMs = finiteNumber(safe.backoffMs, DEFAULT_BACKOFF_MS, 1, MAX_DELAY_MS);
    const retryAfterMs = failure.category === "RATE_LIMIT" ? parseRetryAfterMs(safe.retryAfter || obj(safe.failure).retryAfter, safe) : null;
    const delayMs = Math.max(1, Math.min(MAX_DELAY_MS, retryAfterMs == null ? baseDelayMs * Math.pow(2, Math.max(0, attempt - 1)) : retryAfterMs));
    const shouldRetry = failure.retryable === true && attempt < maxAttempts;
    return clone({
      moduleName:MODULE_NAME,
      appVersion:PROVIDER_FAILURE_RETRY_RESILIENCE_VERSION,
      shouldRetry,
      reason:shouldRetry ? "retryable_transient_failure" : (failure.retryable ? "max_attempts_reached" : "non_retryable_failure"),
      failureCategory:failure.category,
      attempt,
      maxAttempts,
      delayMs,
      retryAfterMs,
      redacted:true
    });
  }

  function createController() {
    let currentRequestId = "";
    return {
      start:function (requestId) {
        currentRequestId = text(requestId);
        return currentRequestId;
      },
      current:function () {
        return currentRequestId;
      },
      isCurrent:function (requestId) {
        return text(requestId) && text(requestId) === currentRequestId;
      },
      cancel:function (requestId) {
        if (!requestId || text(requestId) === currentRequestId) currentRequestId = "";
        return { status:"cancelled", requestId:text(requestId || ""), redacted:true };
      }
    };
  }

  function timeoutPromise(ms, timers) {
    let timer = null;
    const api = timers || {};
    const setTimer = api.setTimeout || setTimeout;
    const clearTimer = api.clearTimeout || clearTimeout;
    const promise = new Promise(function (_, reject) {
      timer = setTimer(function () {
        const error = new Error("source timeout");
        error.category = "TIMEOUT";
        reject(error);
      }, Math.max(1, ms));
    });
    return {
      promise,
      clear:function () {
        if (timer != null) clearTimer(timer);
        timer = null;
      }
    };
  }

  async function sleep(ms, scheduler) {
    if (typeof scheduler === "function") return scheduler(ms);
    return new Promise(function (resolve) { setTimeout(resolve, Math.max(1, ms)); });
  }

  async function executeProviderSourceRequest(input) {
    const safe = obj(input);
    const requestId = text(safe.requestId || "request");
    const domain = text(safe.domain || "provider");
    const sourceId = text(safe.sourceId || "source");
    const operation = text(safe.operation || "read");
    const run = typeof safe.run === "function" ? safe.run : function () { return Promise.resolve({ status:"no_results", results:[] }); };
    const isCurrent = typeof safe.isCurrent === "function" ? safe.isCurrent : function () { return true; };
    const signal = safe.signal || null;
    const timeoutMs = finiteNumber(safe.timeoutMs, DEFAULT_TIMEOUT_MS, 1, MAX_DELAY_MS);
    const maxAttempts = finiteNumber(safe.maxAttempts, DEFAULT_MAX_ATTEMPTS, 1, MAX_ATTEMPTS_CAP);
    const attempts = [];
    let finalFailure = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (signal && signal.aborted) {
        return clone({ status:"cancelled", requestId, domain, sourceId, operation, attempts, error:classifyProviderFailure({ category:"CANCELLED" }), redacted:true });
      }
      if (!isCurrent(requestId, domain)) {
        return clone({ status:"stale_response_ignored", requestId, domain, sourceId, operation, attempts, redacted:true });
      }
      const timeout = timeoutPromise(timeoutMs, safe.timers);
      try {
        const value = await Promise.race([Promise.resolve().then(function () { return run({ attempt, requestId, domain, sourceId, operation, signal }); }), timeout.promise]);
        timeout.clear();
        if (signal && signal.aborted) {
          return clone({ status:"cancelled", requestId, domain, sourceId, operation, attempts, error:classifyProviderFailure({ category:"CANCELLED" }), redacted:true });
        }
        if (!isCurrent(requestId, domain)) {
          return clone({ status:"stale_response_ignored", requestId, domain, sourceId, operation, attempts, redacted:true });
        }
        return clone({ status:"success", requestId, domain, sourceId, operation, attempts:attempts.concat([{ attempt, status:"success" }]), result:value, redacted:true });
      } catch (error) {
        timeout.clear();
        const failure = classifyProviderFailure(error);
        attempts.push({ attempt, status:"failed", failureCategory:failure.category });
        finalFailure = failure;
        if (failure.category === "CANCELLED" || (signal && signal.aborted)) {
          return clone({ status:"cancelled", requestId, domain, sourceId, operation, attempts, error:failure, redacted:true });
        }
        if (!isCurrent(requestId, domain)) {
          return clone({ status:"stale_response_ignored", requestId, domain, sourceId, operation, attempts, redacted:true });
        }
        const decision = buildRetryDecision({
          failure,
          retryAfter:error && error.retryAfter,
          attempt,
          maxAttempts,
          backoffMs:safe.backoffMs,
          maxDelayMs:safe.maxDelayMs
        });
        if (decision.shouldRetry !== true) {
          return clone({ status:"failed_safe", requestId, domain, sourceId, operation, attempts, error:failure, retryDecision:decision, redacted:true });
        }
        attempts[attempts.length - 1].retryScheduled = true;
        await sleep(decision.delayMs, safe.sleep);
      }
    }
    return clone({ status:"failed_safe", requestId, domain, sourceId, operation, attempts, error:finalFailure || classifyProviderFailure({ category:"UNKNOWN" }), redacted:true });
  }

  async function executeProviderSourceBatch(input) {
    const safe = obj(input);
    const sources = Array.isArray(safe.sources) ? safe.sources.slice() : [];
    const requestId = text(safe.requestId || "batch");
    const domain = text(safe.domain || "provider");
    const outcomes = await Promise.all(sources.map(function (source, index) {
      const item = obj(source);
      return executeProviderSourceRequest(Object.assign({}, safe, item, {
        requestId,
        domain,
        sourceId:text(item.sourceId || "source-" + index)
      }));
    }));
    const successes = outcomes.filter(function (item) { return item.status === "success"; });
    const stale = outcomes.filter(function (item) { return item.status === "stale_response_ignored"; });
    const cancelled = outcomes.filter(function (item) { return item.status === "cancelled"; });
    if (sources.length === 0) {
      return clone({ status:"no_results", requestId, domain, outcomes, results:[], failureSummary:{ failed:0, succeeded:0 }, redacted:true });
    }
    if (stale.length === outcomes.length) {
      return clone({ status:"stale_response_ignored", requestId, domain, outcomes, results:[], redacted:true });
    }
    if (cancelled.length === outcomes.length) {
      return clone({ status:"cancelled", requestId, domain, outcomes, results:[], redacted:true });
    }
    const results = [];
    successes.forEach(function (item) {
      const value = obj(item.result);
      if (Array.isArray(value.results)) value.results.forEach(function (result) { results.push(result); });
      else if (value.result) results.push(value.result);
    });
    const failed = outcomes.length - successes.length - stale.length - cancelled.length;
    const status = successes.length
      ? (failed > 0 ? "partial_results" : (results.length ? "success" : "no_results"))
      : "all_sources_failed";
    return clone({
      status,
      requestId,
      domain,
      outcomes,
      results,
      failureSummary:{
        succeeded:successes.length,
        failed,
        staleIgnored:stale.length,
        cancelled:cancelled.length
      },
      redacted:true
    });
  }

  window.WeishanProviderFailureRetryResilience = {
    PROVIDER_FAILURE_RETRY_RESILIENCE_VERSION,
    MODULE_NAME,
    classifyProviderFailure,
    buildRetryDecision,
    parseRetryAfterMs,
    createController,
    executeProviderSourceRequest,
    executeProviderSourceBatch
  };
})();
