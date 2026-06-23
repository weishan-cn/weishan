;(function () {
  "use strict";

  const READ_ONLY_QUOTE_RUN_TIMELINE_VERSION = "2.1.70";
  const TIMELINE_NAME = "read_only_quote_run_timeline_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function defaultSteps(status, input) {
    const overall = text(status || "completed");
    const laterStatus = overall === "blocked" ? "blocked" : (overall === "failed_safe" ? "failed_safe" : "completed");
    const historyReady = input && input.runHistorySummary && Number(input.runHistorySummary.totalRunCount || 0) > 0;
    const deltaReady = text(input && (input.compareStatus || input.quoteDeltaSummary && input.quoteDeltaSummary.compareStatus || input.quoteDeltaSummary && input.quoteDeltaSummary.status)) === "compared";
    const replayReady = input && input.replayReady === true;
    return [
      { stepId: "run_matrix_built", label: "构建 Provider 运行矩阵", status: "completed" },
      { stepId: "session_created", label: "Read-Only Quote Session", status: input && input.sessionSummary ? "completed" : "not_run" },
      { stepId: "sandbox_quotes_generated", label: "生成只读沙盒报价", status: laterStatus },
      { stepId: "quotes_normalized", label: "报价归一化", status: laterStatus },
      { stepId: "quotes_ranked", label: "Top 3 排序", status: laterStatus },
      { stepId: "session_updated", label: "只读报价会话已更新", status: input && input.sessionSummary ? "completed" : "not_run" },
      { stepId: "run_history_sanitized", label: "运行历史已脱敏", status: historyReady ? "completed" : "not_run" },
      { stepId: "run_history_persisted", label: "运行历史已保存", status: historyReady ? "completed" : "not_run" },
      { stepId: "quote_delta_compared", label: "本地只读沙盒运行对比", status: deltaReady ? "completed" : "not_run" },
      { stepId: "replay_guard_ready", label: "Replay Guard", status: replayReady ? "completed" : "not_run" },
      { stepId: "audit_export_ready", label: "Audit Export", status: input && input.auditExportReady === true ? "completed" : "not_run" },
      { stepId: "selection_ready", label: "候选选择准备", status: laterStatus }
    ];
  }

  function summarizeReadOnlyQuoteRunTimeline(timeline) {
    const safe = timeline && typeof timeline === "object" ? timeline : {};
    const steps = Array.isArray(safe.steps) ? safe.steps : [];
    const completedCount = steps.filter(function (step) { return step && step.status === "completed"; }).length;
    const blockedCount = steps.filter(function (step) { return step && step.status === "blocked"; }).length;
    const failedSafeCount = steps.filter(function (step) { return step && step.status === "failed_safe"; }).length;
    return clone({
      timelineName: TIMELINE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_TIMELINE_VERSION,
      runId: text(safe.runId || "deterministic-v2.1.70-read-only-sandbox-run"),
      status: text(safe.status || (failedSafeCount > 0 ? "failed_safe" : (blockedCount > 0 ? "blocked" : "completed"))),
      summary: steps.map(function (step) { return text(step.label || step.stepId || "step"); }).join(" · "),
      completedCount: completedCount,
      blockedCount: blockedCount,
      failedSafeCount: failedSafeCount,
      stepCount: steps.length,
      runHistorySummary: safe.runHistorySummary && typeof safe.runHistorySummary === "object" ? clone(safe.runHistorySummary) : null,
      quoteDeltaSummary: safe.quoteDeltaSummary && typeof safe.quoteDeltaSummary === "object" ? clone(safe.quoteDeltaSummary) : null,
      replaySummary: safe.replaySummary && typeof safe.replaySummary === "object" ? clone(safe.replaySummary) : null,
      compareStatus: text(safe.compareStatus || (safe.quoteDeltaSummary && (safe.quoteDeltaSummary.compareStatus || safe.quoteDeltaSummary.status)) || "not_enough_history"),
      replayStatus: text(safe.replayStatus || (safe.replaySummary && safe.replaySummary.status) || "unavailable"),
      lastRunId: text(safe.lastRunId || (safe.runHistorySummary && safe.runHistorySummary.latestRunId) || ""),
      sessionSummary: safe.sessionSummary && typeof safe.sessionSummary === "object" ? clone(safe.sessionSummary) : null,
      auditExportReady: safe.auditExportReady === true,
      rawResponseStored: false,
      productionProviderEnabled: false,
      bookingUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function buildReadOnlyQuoteRunTimeline(runResult, options) {
    const safe = runResult && typeof runResult === "object" ? runResult : {};
    const safeOptions = options && typeof options === "object" ? options : {};
    const overallStatus = text(safe.status || safeOptions.status || "completed");
    const steps = defaultSteps(overallStatus, Object.assign({}, safe, safeOptions));
    const summary = summarizeReadOnlyQuoteRunTimeline({
      runId: text(safe.runId || safeOptions.runId || "deterministic-v2.1.70-read-only-sandbox-run"),
      status: overallStatus,
      steps: steps,
      runHistorySummary: safe.runHistorySummary || safeOptions.runHistorySummary || null,
      quoteDeltaSummary: safe.quoteDeltaSummary || safeOptions.quoteDeltaSummary || null,
      replaySummary: safe.replaySummary || safeOptions.replaySummary || null,
      sessionSummary: safe.sessionSummary || safeOptions.sessionSummary || null,
      auditExportReady: safe.auditExportReady === true || safeOptions.auditExportReady === true,
      compareStatus: safe.compareStatus || safeOptions.compareStatus || "not_enough_history",
      replayStatus: safe.replayStatus || safeOptions.replayStatus || "unavailable",
      lastRunId: safe.lastRunId || safeOptions.lastRunId || (safe.runHistorySummary && safe.runHistorySummary.latestRunId) || ""
    });
    return clone({
      timelineName: TIMELINE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_TIMELINE_VERSION,
      runId: summary.runId,
      status: overallStatus,
      steps: steps,
      summary: summary.summary,
      runHistorySummary: summary.runHistorySummary,
      quoteDeltaSummary: summary.quoteDeltaSummary,
      replaySummary: summary.replaySummary,
      compareStatus: summary.compareStatus,
      replayStatus: summary.replayStatus,
      lastRunId: summary.lastRunId,
      sessionSummary: summary.sessionSummary,
      auditExportReady: summary.auditExportReady,
      rawResponseStored: false,
      productionProviderEnabled: false,
      bookingUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function appendReadOnlyQuoteRunTimelineStep(timeline, step) {
    const safe = timeline && typeof timeline === "object" ? timeline : buildReadOnlyQuoteRunTimeline({});
    const steps = Array.isArray(safe.steps) ? safe.steps.slice() : [];
    const item = step && typeof step === "object" ? step : {};
    steps.push({
      stepId: text(item.stepId || "step_" + (steps.length + 1)),
      label: text(item.label || item.stepId || "step"),
      status: text(item.status || "completed")
    });
    const next = Object.assign({}, safe, { steps: steps });
    return summarizeReadOnlyQuoteRunTimeline(next);
  }

  function buildReadOnlyQuoteRunTimelineAuditDraft(timeline) {
    const safe = summarizeReadOnlyQuoteRunTimeline(timeline);
    return clone({
      eventType: "READ_ONLY_QUOTE_RUN_TIMELINE_AUDIT_DRAFT",
      timelineName: TIMELINE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_TIMELINE_VERSION,
      runId: safe.runId,
      status: safe.status,
      stepCount: safe.stepCount,
      completedCount: safe.completedCount,
      blockedCount: safe.blockedCount,
      failedSafeCount: safe.failedSafeCount,
      compareStatus: safe.compareStatus,
      replayStatus: safe.replayStatus,
      lastRunId: safe.lastRunId,
      rawResponseStored: false,
      bookingUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  window.WeishanReadOnlyQuoteRunTimeline = {
    READ_ONLY_QUOTE_RUN_TIMELINE_VERSION,
    TIMELINE_NAME,
    buildReadOnlyQuoteRunTimeline,
    appendReadOnlyQuoteRunTimelineStep,
    summarizeReadOnlyQuoteRunTimeline,
    buildReadOnlyQuoteRunTimelineAuditDraft
  };
})();