(function(){
  const TASK_HISTORY_SUMMARY_FORMATTER_VERSION = "4.2.8";
  const MAX_SUMMARY_LENGTH = 120;
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function compact(value, max){
    const cleaned = text(value)
      .replace(/```[\s\S]*?```/g, "代码块已隐藏")
      .replace(/https?:\/\/[^\s`"'<>()]+/g, "外部链接已隐藏")
      .replace(/\s+/g, " ");
    const limit = max || MAX_SUMMARY_LENGTH;
    return cleaned.length > limit ? cleaned.slice(0, limit - 1) + "…" : cleaned;
  }
  function categoryLabel(task){
    const raw = text(task && (task.category || task.type || task.globalProcurementIntent && task.globalProcurementIntent.category || ""));
    if (/flight|机票/.test(raw)) return "机票";
    if (/hotel|酒店/.test(raw)) return "酒店";
    if (/ticket|activity|门票|活动/.test(raw)) return "门票 / 活动";
    if (/restricted|blocked|受限/.test(raw) || task && task.status === "blocked") return "受限品类";
    if (/v2\.1\.\d+|开发|hotfix|bundle/i.test(text(task && task.text))) return "系统开发任务";
    return raw || "全球采购";
  }
  function buildTaskHistorySummary(task){
    const source = task || {};
    const rawPrompt = text(source.text || source.inputSummary || source.rawInput || source.title || "");
    const type = categoryLabel(source);
    const isDev = type === "系统开发任务" || /^任务：v2\.1\./.test(rawPrompt);
    const isRestricted = type === "受限品类" || source.status === "blocked";
    const title = isDev ? compact(rawPrompt.replace(/^任务：\s*/, ""), 40) : compact(source.title || rawPrompt || type, 44);
    const requestSummary = isDev
      ? "优化结果卡、历史摘要、手动核对入口和安全提示。完整指令已隐藏。"
      : isRestricted
        ? "该请求涉及受限品类，未搜索、未下单、未提供购买路径。"
        : compact(source.inputSummary || rawPrompt || "已生成本地规划。", MAX_SUMMARY_LENGTH);
    const resultSummary = isDev
      ? "系统改动摘要已收口；完整 prompt 不在历史卡展示。"
      : isRestricted
        ? "安全阻断；不显示购买路径。"
        : "已生成结果摘要；未下单 / 未付款。";
    return clone({
      formatterVersion:TASK_HISTORY_SUMMARY_FORMATTER_VERSION,
      title,
      type,
      status:text(source.status || "done"),
      requestSummary:compact(requestSummary, MAX_SUMMARY_LENGTH),
      resultSummary:compact(resultSummary, MAX_SUMMARY_LENGTH),
      fullPromptHidden:rawPrompt.length > MAX_SUMMARY_LENGTH || isDev,
      maxSummaryLength:MAX_SUMMARY_LENGTH,
      audit:buildTaskHistorySummaryFormatterAuditDraft({ rawPrompt:rawPrompt, formatted:true }),
      redacted:true
    });
  }
  function buildTaskHistorySummaryFormatterAuditDraft(input){
    const raw = text(input && input.rawPrompt || "");
    return clone({
      eventType:"TASK_HISTORY_SUMMARY_FORMATTER_DRAFT",
      historyCardsFormatted:input && input.formatted === true ? 1 : 0,
      longPromptHiddenCount:raw.length > MAX_SUMMARY_LENGTH || /^任务：v2\.1\./.test(raw) ? 1 : 0,
      rawPromptDisplayedCount:0,
      rawJsonDisplayedCount:0,
      maxSummaryLength:MAX_SUMMARY_LENGTH,
      redacted:true
    });
  }
  function assertTaskHistorySummarySafe(summary){
    const userText = [summary && summary.title, summary && summary.requestSummary, summary && summary.resultSummary].join(" ");
    if (/```|\b(api[_-]?key|token|endpoint)\b/i.test(userText)) throw new Error("history summary leaked raw prompt/json/secret-like text");
    if ((summary && summary.requestSummary || "").length > MAX_SUMMARY_LENGTH + 1) throw new Error("history summary too long");
    if (!summary || !summary.audit || summary.audit.redacted !== true) throw new Error("history summary audit must be redacted");
    return true;
  }
  window.WeishanTaskHistorySummaryFormatter = {
    TASK_HISTORY_SUMMARY_FORMATTER_VERSION,
    MAX_SUMMARY_LENGTH,
    buildTaskHistorySummary,
    buildTaskHistorySummaryFormatterAuditDraft,
    assertTaskHistorySummarySafe
  };
})();
