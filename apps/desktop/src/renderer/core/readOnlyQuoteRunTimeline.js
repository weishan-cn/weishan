;(function () {
  "use strict";

  const READ_ONLY_QUOTE_RUN_TIMELINE_VERSION = "2.1.53";
  const TIMELINE_NAME = "read_only_quote_run_timeline_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function defaultSteps(status) {
    const overall = text(status || "completed");
    const laterStatus = overall === "blocked" ? "blocked" : (overall === "failed_safe" ? "failed_safe" : "completed");
    return [
      { stepId: "run_matrix_built", label: "构建 Provider 运行矩阵", status: "completed" },
      { stepId: "sandbox_quotes_generated", label: "生成只读沙盒报价", status: laterStatus },
      { stepId: "quotes_normalized", label: "报价归一化", status: laterStatus },
      { stepId: "quotes_ranked", label: "Top 3 排序", status: laterStatus },
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
      runId: text(safe.runId || "deterministic-v2.1.53-read-only-sandbox-run"),
      status: text(safe.status || (failedSafeCount > 0 ? "failed_safe" : (blockedCount > 0 ? "blocked" : "completed"))),
      summary: steps.map(function (step) { return text(step.label || step.stepId || "step"); }).join(" · "),
      completedCount: completedCount,
      blockedCount: blockedCount,
      failedSafeCount: failedSafeCount,
      stepCount: steps.length,
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
    const steps = defaultSteps(overallStatus);
    const summary = summarizeReadOnlyQuoteRunTimeline({
      runId: text(safe.runId || safeOptions.runId || "deterministic-v2.1.53-read-only-sandbox-run"),
      status: overallStatus,
      steps: steps
    });
    return clone({
      timelineName: TIMELINE_NAME,
      appVersion: READ_ONLY_QUOTE_RUN_TIMELINE_VERSION,
      runId: summary.runId,
      status: overallStatus,
      steps: steps,
      summary: summary.summary,
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
