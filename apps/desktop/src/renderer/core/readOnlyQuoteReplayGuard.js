;(function () {
  "use strict";

  const READ_ONLY_QUOTE_REPLAY_GUARD_VERSION = "2.1.63";
  const REPLAY_GUARD_NAME = "read_only_quote_replay_guard_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeHistory(history) {
    if (history && typeof history === "object" && Array.isArray(history.history)) return history;
    if (Array.isArray(history)) return { history: history };
    return null;
  }

  function latestEntry(history) {
    const normalized = normalizeHistory(history);
    const list = normalized && Array.isArray(normalized.history) ? normalized.history : [];
    return list.length ? list[list.length - 1] : null;
  }

  function sanitizeReplayedRun(entry) {
    const safe = entry && typeof entry === "object" ? entry : {};
    return {
      runId: text(safe.runId || ""),
      runIndex: Number(safe.runIndex) || null,
      runMode: text(safe.runMode || "read_only_sandbox"),
      status: text(safe.status || "not_run"),
      topCandidates: Array.isArray(safe.topCandidates) ? safe.topCandidates.slice(0, 3).map(function (candidate) { return clone(candidate); }) : [],
      selectedCandidate: safe.selectedCandidate && typeof safe.selectedCandidate === "object" ? clone(safe.selectedCandidate) : null,
      timelineSummary: safe.timelineSummary && typeof safe.timelineSummary === "object" ? clone(safe.timelineSummary) : null,
      redacted: true
    };
  }

  function evaluateReadOnlyQuoteReplayAvailability(history, options) {
    const normalized = normalizeHistory(history);
    if (!normalized) {
      return clone({
        replayGuardName: REPLAY_GUARD_NAME,
        appVersion: READ_ONLY_QUOTE_REPLAY_GUARD_VERSION,
        status: "unavailable",
        replaySource: "local_redacted_run_history",
        replayedRunId: null,
        replayedCandidateCount: 0,
        canReplay: false,
        userTriggeredOnly: true,
        autoReplay: false,
        autoOpen: false,
        bookingUrl: null,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      });
    }
    if (normalized.corrupted === true || normalized.schemaMismatch === true) {
      return clone({
        replayGuardName: REPLAY_GUARD_NAME,
        appVersion: READ_ONLY_QUOTE_REPLAY_GUARD_VERSION,
        status: "failed_safe",
        replaySource: "local_redacted_run_history",
        replayedRunId: null,
        replayedCandidateCount: 0,
        canReplay: false,
        userTriggeredOnly: true,
        autoReplay: false,
        autoOpen: false,
        bookingUrl: null,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      });
    }
    const entry = latestEntry(normalized);
    const candidateCount = entry && Array.isArray(entry.topCandidates) ? entry.topCandidates.length : 0;
    return clone({
      replayGuardName: REPLAY_GUARD_NAME,
      appVersion: READ_ONLY_QUOTE_REPLAY_GUARD_VERSION,
      status: entry ? "available" : "unavailable",
      replaySource: "local_redacted_run_history",
      replayedRunId: entry ? text(entry.runId || "") : null,
      replayedCandidateCount: candidateCount,
      canReplay: !!entry && candidateCount > 0,
      userTriggeredOnly: true,
      autoReplay: false,
      autoOpen: false,
      bookingUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function replayLastReadOnlyQuoteRun(history, options) {
    const availability = evaluateReadOnlyQuoteReplayAvailability(history, options);
    const normalized = normalizeHistory(history);
    const entry = latestEntry(normalized);
    if (!entry || availability.status !== "available") {
      return clone(Object.assign({}, availability, {
        replaySummary: availability.status === "failed_safe" ? "Replay Guard：历史损坏，已安全失败" : "Replay Guard：暂无可回放的本地脱敏运行历史",
        replayedRun: null,
        sessionEventPayload: {
          type: "REPLAY_COMPLETED",
          eventType: "REPLAY_COMPLETED",
          status: availability.status,
          replaySource: "local_redacted_run_history",
          bookingUrl: null,
          checkoutUrl: null,
          paymentUrl: null,
          orderUrl: null,
          rawResponseStored: false,
          secretStored: false,
          redacted: true
        }
      }));
    }
    const replayedRun = sanitizeReplayedRun(entry);
    return clone(Object.assign({}, availability, {
      replayedRunId: replayedRun.runId,
      replayedCandidateCount: Array.isArray(replayedRun.topCandidates) ? replayedRun.topCandidates.length : 0,
      replaySummary: "Replay 只恢复候选证据，不重新请求 provider · 最近一次只读运行：" + text(replayedRun.runId || "未命名"),
      replayedRun: replayedRun,
      status: "available",
      canReplay: replayedRun.topCandidates.length > 0,
      userTriggeredOnly: true,
      autoReplay: false,
      autoOpen: false,
      bookingUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      sessionEventPayload: {
        type: "REPLAY_COMPLETED",
        eventType: "REPLAY_COMPLETED",
        status: "available",
        replaySource: "local_redacted_run_history",
        runId: replayedRun.runId,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        rawResponseStored: false,
        secretStored: false,
        redacted: true
      },
      redacted: true
    }));
  }

  function buildReadOnlyQuoteReplayGuardAuditDraft(history, options) {
    const replay = replayLastReadOnlyQuoteRun(history, options);
    return clone({
      eventType: "READ_ONLY_QUOTE_REPLAY_GUARD_AUDIT_DRAFT",
      replayGuardName: REPLAY_GUARD_NAME,
      appVersion: READ_ONLY_QUOTE_REPLAY_GUARD_VERSION,
      status: replay.status,
      replaySource: replay.replaySource,
      replayedRunId: replay.replayedRunId,
      replayedCandidateCount: replay.replayedCandidateCount,
      canReplay: replay.canReplay,
      userTriggeredOnly: true,
      autoReplay: false,
      autoOpen: false,
      bookingUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  window.WeishanReadOnlyQuoteReplayGuard = {
    READ_ONLY_QUOTE_REPLAY_GUARD_VERSION,
    REPLAY_GUARD_NAME,
    evaluateReadOnlyQuoteReplayAvailability,
    replayLastReadOnlyQuoteRun,
    buildReadOnlyQuoteReplayGuardAuditDraft
  };
})();