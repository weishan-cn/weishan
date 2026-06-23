;(function () {
  "use strict";

  const READ_ONLY_QUOTE_SESSION_MANAGER_VERSION = "2.1.73";
  const SESSION_NAME = "read_only_quote_session_v1";
  const SESSION_ID = "deterministic-read-only-quote-session-v2.1.73";
  const FORBIDDEN_NAME_RE = /(token|key|secret|password|sessionToken|auth|credential|rawProviderResponse|rawResponse|rawPayload|identity|passport|bank|card|bookingUrl|checkoutUrl|paymentUrl|orderUrl)/i;

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      if (FORBIDDEN_NAME_RE.test(name)) return;
      const next = stripUnsafe(value[name]);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }

  function safeCandidate(candidate) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    return {
      rank: number(safe.rank) || number(safe.selectedRank) || null,
      quoteId: text(safe.quoteId || safe.selectedQuoteId || ""),
      providerId: text(safe.providerId || ""),
      providerName: text(safe.providerName || safe.selectedProviderName || ""),
      providerMode: text(safe.providerMode || "sandbox_read_only"),
      responseShape: text(safe.responseShape || "unsupported"),
      fareSource: text(safe.fareSource || "sandbox_read_only_import"),
      currency: text(safe.currency || ""),
      baseFare: safe.baseFare == null ? null : safe.baseFare,
      taxesAndFees: safe.taxesAndFees == null ? null : safe.taxesAndFees,
      providerFees: safe.providerFees == null ? null : safe.providerFees,
      totalPrice: safe.totalPrice == null ? null : safe.totalPrice,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    };
  }

  function safety() {
    return {
      userFacingRealPriceEnabled: false,
      showableAsRealPrice: false,
      canReplaceMainResultCard: false,
      productionProviderEnabled: false,
      networkAllowed: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      autoOpen: false,
      autoRefresh: false,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      rawResponseStored: false,
      secretStored: false,
      redacted: true
    };
  }

  function baseSession(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    const intent = safe.userIntentSummary && typeof safe.userIntentSummary === "object" ? safe.userIntentSummary : safe;
    return {
      sessionName: SESSION_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_MANAGER_VERSION,
      sessionId: SESSION_ID,
      status: text(safe.status || "open"),
      userIntentSummary: {
        route: text(intent.route || [intent.origin, intent.destination].filter(Boolean).join(" → ")),
        departureDate: text(intent.departureDate || intent.date || ""),
        directOnly: intent.directOnly === true,
        sortIntent: text(intent.sortIntent || intent.goal || "")
      },
      dryRun: {
        available: false,
        runId: null,
        topCandidateCount: 0,
        selectedCandidate: null
      },
      sandboxImport: {
        available: false,
        acceptedCount: 0,
        rejectedCount: 0,
        blockedCount: 0
      },
      ranking: {
        available: false,
        topCandidateCount: 0,
        claim: "当前导入样本/沙盒运行中的低价候选",
        canClaimLowestAcrossWeb: false,
        canClaimFinalBookablePrice: false
      },
      selection: {
        selected: false,
        selectedQuoteId: null,
        selectedProviderName: null,
        requiresConfirmation: true,
        autoOpen: false
      },
      history: {
        available: false,
        runCount: 0,
        lastRunId: null
      },
      deltaCompare: {
        available: false,
        status: "not_enough_history",
        claim: "仅比较本地只读沙盒运行结果"
      },
      replay: {
        available: false,
        status: "unavailable",
        replaySource: "local_redacted_run_history"
      },
      timeline: [],
      warnings: [],
      safety: safety(),
      redacted: true
    };
  }

  function sanitizeReadOnlyQuoteSession(session) {
    const safe = baseSession(session);
    const source = stripUnsafe(session && typeof session === "object" ? session : {}) || {};
    safe.status = ["open", "updated", "closed", "failed_safe"].indexOf(text(source.status)) >= 0 ? text(source.status) : safe.status;
    safe.userIntentSummary = Object.assign({}, safe.userIntentSummary, source.userIntentSummary && typeof source.userIntentSummary === "object" ? {
      route: text(source.userIntentSummary.route || safe.userIntentSummary.route),
      departureDate: text(source.userIntentSummary.departureDate || safe.userIntentSummary.departureDate),
      directOnly: source.userIntentSummary.directOnly === true,
      sortIntent: text(source.userIntentSummary.sortIntent || safe.userIntentSummary.sortIntent)
    } : {});
    ["dryRun", "sandboxImport", "ranking", "selection", "history", "deltaCompare", "replay"].forEach(function (name) {
      if (source[name] && typeof source[name] === "object") safe[name] = Object.assign({}, safe[name], source[name]);
    });
    safe.dryRun.selectedCandidate = safe.dryRun.selectedCandidate ? safeCandidate(safe.dryRun.selectedCandidate) : null;
    safe.ranking.claim = "当前导入样本/沙盒运行中的低价候选";
    safe.ranking.canClaimLowestAcrossWeb = false;
    safe.ranking.canClaimFinalBookablePrice = false;
    safe.selection.requiresConfirmation = true;
    safe.selection.autoOpen = false;
    safe.deltaCompare.claim = "仅比较本地只读沙盒运行结果";
    safe.replay.replaySource = "local_redacted_run_history";
    safe.timeline = Array.isArray(source.timeline) ? source.timeline.slice(0, 20).map(function (item) {
      const safeItem = stripUnsafe(item && typeof item === "object" ? item : {}) || {};
      return {
        eventType: text(safeItem.eventType || safeItem.type || ""),
        status: text(safeItem.status || "updated"),
        runId: text(safeItem.runId || ""),
        warning: text(safeItem.warning || ""),
        redacted: true
      };
    }) : [];
    safe.warnings = Array.isArray(source.warnings) ? source.warnings.map(text).filter(Boolean).slice(0, 10) : [];
    safe.safety = safety();
    safe.redacted = true;
    return clone(safe);
  }

  function createReadOnlyQuoteSession(input) {
    const session = sanitizeReadOnlyQuoteSession(baseSession(input));
    session.status = "open";
    session.timeline = [{ eventType: "SESSION_CREATED", status: "open", runId: "", warning: "", redacted: true }];
    return clone(session);
  }

  function eventPayload(event) {
    return stripUnsafe(event && typeof event === "object" ? event : {}) || {};
  }

  function updateReadOnlyQuoteSession(session, event) {
    const current = sanitizeReadOnlyQuoteSession(session && typeof session === "object" ? session : createReadOnlyQuoteSession({}));
    const payload = eventPayload(event);
    const type = text(payload.type || payload.eventType);
    const next = clone(current);
    next.status = "updated";
    if (type === "DRY_RUN_COMPLETED") {
      const dryRun = payload.dryRun || payload.result || payload;
      const candidates = Array.isArray(dryRun.dryRunTopCandidates) ? dryRun.dryRunTopCandidates : (dryRun.ranking && Array.isArray(dryRun.ranking.topCandidates) ? dryRun.ranking.topCandidates : []);
      next.dryRun = { available: true, runId: text(dryRun.runId || payload.runId || ""), topCandidateCount: candidates.slice(0, 3).length, selectedCandidate: dryRun.selectedCandidate ? safeCandidate(dryRun.selectedCandidate) : null };
      next.ranking = Object.assign({}, next.ranking, { available: candidates.length > 0, topCandidateCount: candidates.slice(0, 3).length });
    } else if (type === "SANDBOX_IMPORT_ACCEPTED" || type === "SANDBOX_IMPORT_BLOCKED") {
      const importResult = payload.importResult || payload;
      next.sandboxImport = {
        available: type === "SANDBOX_IMPORT_ACCEPTED",
        acceptedCount: number(importResult.acceptedCount) || (type === "SANDBOX_IMPORT_ACCEPTED" ? 1 : 0),
        rejectedCount: number(importResult.rejectedCount) || 0,
        blockedCount: number(importResult.blockedCount) || (type === "SANDBOX_IMPORT_BLOCKED" ? 1 : 0)
      };
    } else if (type === "CANDIDATE_SELECTED") {
      const selected = payload.selectedCandidate || payload.selection || payload;
      next.selection = {
        selected: true,
        selectedQuoteId: text(selected.selectedQuoteId || selected.quoteId || ""),
        selectedProviderName: text(selected.selectedProviderName || selected.providerName || ""),
        requiresConfirmation: true,
        autoOpen: false
      };
    } else if (type === "HISTORY_APPENDED") {
      const history = payload.historySummary || payload.history || payload;
      next.history = { available: true, runCount: number(history.totalRunCount || history.runCount) || 1, lastRunId: text(history.latestRunId || history.lastRunId || payload.runId || "") };
    } else if (type === "DELTA_COMPARED") {
      const delta = payload.deltaSummary || payload.delta || payload;
      next.deltaCompare = { available: true, status: text(delta.status || delta.compareStatus || "compared"), claim: "仅比较本地只读沙盒运行结果" };
    } else if (type === "REPLAY_COMPLETED") {
      const replay = payload.replaySummary || payload.replay || payload;
      next.replay = { available: true, status: text(replay.status || "available"), replaySource: "local_redacted_run_history" };
    } else if (type === "SESSION_CLOSED") {
      next.status = "closed";
    } else if (type === "SESSION_FAILED_SAFE") {
      next.status = "failed_safe";
      next.warnings = next.warnings.concat([text(payload.reason || "session failed safe")]).filter(Boolean).slice(0, 10);
    } else {
      next.status = "failed_safe";
      next.warnings = next.warnings.concat(["unknown event ignored: " + text(type || "unknown")]).slice(0, 10);
    }
    next.timeline = next.timeline.concat([{ eventType: type || "UNKNOWN_EVENT", status: next.status, runId: text(payload.runId || (payload.result && payload.result.runId) || ""), warning: next.warnings[next.warnings.length - 1] || "", redacted: true }]).slice(-20);
    return sanitizeReadOnlyQuoteSession(next);
  }

  function closeReadOnlyQuoteSession(session, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    return updateReadOnlyQuoteSession(session, { type: safeOptions.failedSafe ? "SESSION_FAILED_SAFE" : "SESSION_CLOSED", reason: safeOptions.reason || "" });
  }

  function buildReadOnlyQuoteSessionSummary(session) {
    const safe = sanitizeReadOnlyQuoteSession(session);
    return clone({
      sessionName: safe.sessionName,
      appVersion: safe.appVersion,
      sessionId: safe.sessionId,
      status: safe.status,
      title: "只读报价会话",
      userIntentSummary: safe.userIntentSummary,
      dryRun: safe.dryRun,
      sandboxImport: safe.sandboxImport,
      ranking: safe.ranking,
      selection: safe.selection,
      history: safe.history,
      deltaCompare: safe.deltaCompare,
      replay: safe.replay,
      timelineCount: safe.timeline.length,
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    });
  }

  function buildReadOnlyQuoteSessionAuditDraft(session) {
    const summary = buildReadOnlyQuoteSessionSummary(session);
    return clone(Object.assign({
      eventType: "READ_ONLY_QUOTE_SESSION_AUDIT_DRAFT"
    }, summary, {
      safety: safety(),
      redacted: true
    }));
  }

  window.WeishanReadOnlyQuoteSessionManager = {
    READ_ONLY_QUOTE_SESSION_MANAGER_VERSION,
    SESSION_NAME,
    SESSION_ID,
    createReadOnlyQuoteSession,
    updateReadOnlyQuoteSession,
    closeReadOnlyQuoteSession,
    buildReadOnlyQuoteSessionSummary,
    buildReadOnlyQuoteSessionAuditDraft,
    sanitizeReadOnlyQuoteSession
  };
})();
