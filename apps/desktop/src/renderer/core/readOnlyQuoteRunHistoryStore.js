;(function () {
  "use strict";

  const READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION = "2.1.60";
  const STATE_NAME = "read_only_quote_run_history_store_v1";
  const STORAGE_KEY = "weishan.readOnlyQuoteRunHistory.v1";
  const FORBIDDEN_NAME_RE = /(token|key|secret|password|session|auth|credential|rawProviderResponse|rawResponse|rawPayload|identity|passport|bank|card|bookingUrl|checkoutUrl|paymentUrl|orderUrl)/i;
  const MAX_HISTORY_COUNT = 5;

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

  function safeEmptyHistory() {
    return {
      stateName: STATE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION,
      history: [],
      totalRunCount: 0,
      latestRunId: null,
      latestRunIndex: 0,
      latestStatus: "not_run",
      summary: "运行历史：暂无本地只读沙盒运行记录",
      redacted: true
    };
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

  function normalizeStore(input) {
    if (Array.isArray(input)) {
      return {
        stateName: STATE_NAME,
        appVersion: READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION,
        history: input.slice(),
        redacted: true
      };
    }
    const safe = input && typeof input === "object" ? input : {};
    if (safe.stateName !== STATE_NAME || safe.appVersion !== READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION || !Array.isArray(safe.history)) {
      return safeEmptyHistory();
    }
    return {
      stateName: STATE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION,
      history: safe.history.slice(),
      redacted: true
    };
  }

  function pruneReadOnlyQuoteRunHistory(history, limit) {
    const max = Math.max(1, Number(limit) || MAX_HISTORY_COUNT);
    const list = Array.isArray(history) ? history.slice() : (history && Array.isArray(history.history) ? history.history.slice() : []);
    return list.slice(Math.max(0, list.length - max));
  }

  function candidateSummary(candidate, rank) {
    const safe = candidate && typeof candidate === "object" ? candidate : {};
    return {
      rank: number(safe.rank) || rank || null,
      quoteId: text(safe.quoteId || ("quote_" + (rank || 1))),
      providerId: text(safe.providerId || ""),
      providerName: text(safe.providerName || ""),
      providerMode: text(safe.providerMode || "sandbox_read_only"),
      responseShape: text(safe.responseShape || "unsupported"),
      fareSource: text(safe.fareSource || "sandbox_read_only_import"),
      currency: text(safe.currency || ""),
      baseFare: safe.baseFare == null ? null : safe.baseFare,
      taxesAndFees: safe.taxesAndFees == null ? null : safe.taxesAndFees,
      providerFees: safe.providerFees == null ? null : safe.providerFees,
      totalPrice: safe.totalPrice == null ? null : safe.totalPrice,
      freshnessMinutes: safe.freshnessMinutes == null ? null : safe.freshnessMinutes,
      taxFeeIntegrityStatus: text(safe.taxFeeIntegrityStatus || "complete"),
      safeProviderHandoffReady: safe.safeProviderHandoffReady === true,
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

  function selectedCandidateSummary(selection) {
    const safe = selection && typeof selection === "object" ? selection : {};
    if (!safe || typeof safe !== "object" || (!safe.quoteId && !safe.providerId && !safe.providerName)) return null;
    return candidateSummary(safe, number(safe.selectedRank) || number(safe.rank) || null);
  }

  function timelineSummary(timeline) {
    const safe = timeline && typeof timeline === "object" ? timeline : {};
    return {
      timelineName: text(safe.timelineName || "read_only_quote_run_timeline_v1"),
      appVersion: text(safe.appVersion || READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION),
      runId: text(safe.runId || ""),
      status: text(safe.status || "not_run"),
      summary: text(safe.summary || ""),
      stepCount: Number.isFinite(Number(safe.stepCount)) ? Number(safe.stepCount) : 0,
      rawResponseStored: false,
      productionProviderEnabled: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      autoOpen: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    };
  }

  function sanitizeReadOnlyQuoteRunHistoryEntry(runResult) {
    const safe = stripUnsafe(runResult && typeof runResult === "object" ? runResult : {}) || {};
    const ranking = safe.ranking && typeof safe.ranking === "object" ? safe.ranking : {};
    const dryRunTopCandidates = Array.isArray(safe.dryRunTopCandidates) ? safe.dryRunTopCandidates : (Array.isArray(ranking.topCandidates) ? ranking.topCandidates : (Array.isArray(safe.topCandidates) ? safe.topCandidates : []));
    const selectedCandidate = safe.selectedCandidate && typeof safe.selectedCandidate === "object" ? safe.selectedCandidate : null;
    const runTimelineSummary = timelineSummary(safe.runTimelineSummary || safe.timelineSummary || {});
    return clone({
      historyEntryName: "read_only_quote_run_history_entry_v1",
      appVersion: READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION,
      runId: text(safe.runId || ""),
      runIndex: number(safe.runIndex) || null,
      runMode: text(safe.runMode || "read_only_sandbox"),
      status: text(safe.status || "not_run"),
      topCandidates: pruneReadOnlyQuoteRunHistory(dryRunTopCandidates.map(function (candidate, index) { return candidateSummary(candidate, index + 1); }), MAX_HISTORY_COUNT).slice(0, 3),
      selectedCandidate: selectedCandidateSummary(selectedCandidate),
      timelineSummary: runTimelineSummary,
      rawResponseStored: false,
      productionProviderEnabled: false,
      networkAllowed: false,
      redacted: true
    });
  }

  function readStorage(storageLike) {
    if (storageLike && typeof storageLike.getItem === "function") return storageLike;
    if (typeof window !== "undefined" && window.localStorage && typeof window.localStorage.getItem === "function") return window.localStorage;
    return null;
  }

  function loadReadOnlyQuoteRunHistory(storageLike) {
    const storage = readStorage(storageLike);
    if (!storage || typeof storage.getItem !== "function") return safeEmptyHistory();
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return safeEmptyHistory();
      const parsed = JSON.parse(raw);
      const normalized = normalizeStore(parsed);
      if (normalized.stateName !== STATE_NAME || normalized.appVersion !== READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION) return safeEmptyHistory();
      const history = pruneReadOnlyQuoteRunHistory(Array.isArray(normalized.history) ? normalized.history.map(sanitizeReadOnlyQuoteRunHistoryEntry) : [], MAX_HISTORY_COUNT);
      return clone(Object.assign({}, safeEmptyHistory(), {
        history: history,
        totalRunCount: history.length,
        latestRunId: history.length ? text(history[history.length - 1].runId || null) : null,
        latestRunIndex: history.length ? (number(history[history.length - 1].runIndex) || history.length) : 0,
        latestStatus: history.length ? text(history[history.length - 1].status || "not_run") : "not_run",
        summary: history.length ? ("运行历史：最近一次沙盒运行 " + text(history[history.length - 1].runId || "未命名") + " · " + text(history[history.length - 1].status || "not_run")) : "运行历史：暂无本地只读沙盒运行记录"
      }));
    } catch (error) {
      return safeEmptyHistory();
    }
  }

  function saveReadOnlyQuoteRunHistory(history, storageLike) {
    const storage = readStorage(storageLike);
    const normalized = normalizeStore(history);
    if (storage && typeof storage.setItem === "function") storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return clone(normalized);
  }

  function appendReadOnlyQuoteRunHistory(runResult, storageLike, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const current = loadReadOnlyQuoteRunHistory(storageLike);
    const nextIndex = number(safeOptions.runIndex) || current.history.length + 1;
    const entry = sanitizeReadOnlyQuoteRunHistoryEntry(Object.assign({}, runResult, { runIndex: nextIndex }));
    const nextHistory = pruneReadOnlyQuoteRunHistory(current.history.concat([entry]), MAX_HISTORY_COUNT);
    const saved = saveReadOnlyQuoteRunHistory({
      stateName: STATE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION,
      history: nextHistory,
      redacted: true
    }, storageLike);
    saved.sessionEventPayload = {
      type: "HISTORY_APPENDED",
      eventType: "HISTORY_APPENDED",
      runId: entry.runId,
      historySummary: buildReadOnlyQuoteRunHistorySummary(saved),
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    };
    return clone(saved);
  }

  function clearReadOnlyQuoteRunHistory(storageLike) {
    const storage = readStorage(storageLike);
    if (storage && typeof storage.removeItem === "function") storage.removeItem(STORAGE_KEY);
    return safeEmptyHistory();
  }

  function buildReadOnlyQuoteRunHistorySummary(history) {
    const safe = normalizeStore(history);
    const list = pruneReadOnlyQuoteRunHistory(Array.isArray(safe.history) ? safe.history.map(sanitizeReadOnlyQuoteRunHistoryEntry) : [], MAX_HISTORY_COUNT);
    const latest = list.length ? list[list.length - 1] : null;
    return clone({
      historyStoreName: STATE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION,
      totalRunCount: list.length,
      latestRunId: latest ? latest.runId : null,
      latestRunIndex: latest ? latest.runIndex : 0,
      latestStatus: latest ? latest.status : "not_run",
      latestTopCandidateCount: latest && Array.isArray(latest.topCandidates) ? latest.topCandidates.length : 0,
      recentRunIds: list.map(function (entry) { return entry.runId; }),
      summary: latest ? ("运行历史：最近一次沙盒运行 " + text(latest.runId || "未命名") + " · " + text(latest.status || "not_run") + " · Top 3 候选报价 " + String((latest.topCandidates || []).length || 0)) : "运行历史：暂无本地只读沙盒运行记录",
      redacted: true
    });
  }

  function createReadOnlyQuoteRunHistoryStore(storageLike) {
    const storage = readStorage(storageLike);
    return {
      stateName: STATE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION,
      load: function () { return loadReadOnlyQuoteRunHistory(storage); },
      append: function (runResult, options) { return appendReadOnlyQuoteRunHistory(runResult, storage, options); },
      clear: function () { return clearReadOnlyQuoteRunHistory(storage); },
      prune: function (history, limit) { return pruneReadOnlyQuoteRunHistory(history, limit); },
      summary: function (history) { return buildReadOnlyQuoteRunHistorySummary(history || loadReadOnlyQuoteRunHistory(storage)); },
      redacted: true
    };
  }

  window.WeishanReadOnlyQuoteRunHistoryStore = {
    READ_ONLY_QUOTE_RUN_HISTORY_STORE_VERSION,
    STATE_NAME,
    STORAGE_KEY,
    createReadOnlyQuoteRunHistoryStore,
    appendReadOnlyQuoteRunHistory,
    loadReadOnlyQuoteRunHistory,
    clearReadOnlyQuoteRunHistory,
    sanitizeReadOnlyQuoteRunHistoryEntry,
    pruneReadOnlyQuoteRunHistory,
    buildReadOnlyQuoteRunHistorySummary
  };
})();