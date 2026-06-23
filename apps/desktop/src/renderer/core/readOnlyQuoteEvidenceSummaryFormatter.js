;(function () {
  "use strict";

  const READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION = "2.1.72";
  const FORMATTER_NAME = "read_only_quote_evidence_summary_formatter_v1";
  const FORBIDDEN_NAME_RE = /(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i;
  const FORBIDDEN_TEXT_RE = /全网最低|最低价保证|已锁价|可以出票|可直接出票|真实最终价|立即购买|付款|下单/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }

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

  function safeLine(value) {
    return text(value).replace(FORBIDDEN_TEXT_RE, "保守候选证据");
  }

  function priceLine(candidate) {
    const amount = number(candidate && candidate.totalPrice);
    const currency = text(candidate && candidate.currency || "CNY");
    return amount == null ? "价格未单独提供" : (currency === "CNY" ? "¥" + amount : currency + " " + amount);
  }

  function formatTopCandidateSummary(candidates, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const list = Array.isArray(candidates) ? candidates.slice(0, 3).map(stripUnsafe) : [];
    const lines = list.map(function (candidate, index) {
      const provider = text(candidate.providerName || "只读沙盒");
      const source = text(candidate.responseShape || candidate.fareSource || "导入样本");
      return "#" + String(candidate.rank || index + 1) + " " + priceLine(candidate) + " · " + provider + " · " + source + " · 平台最终为准 · 未锁价 · 不代表可出票";
    });
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "Top 3 候选报价",
      scope: safeLine(safeOptions.scope || "当前导入样本 / 沙盒运行中的候选价格"),
      lines: lines,
      empty: lines.length === 0,
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canReplaceMainResultCard: false,
      redacted: true
    });
  }

  function formatSelectedCandidateSummary(candidate, options) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    const safeOptions = options && typeof options === "object" ? options : {};
    const provider = text(safe.providerName || safe.selectedProviderName || "未选择");
    const quoteId = text(safe.quoteId || safe.selectedQuoteId || "");
    const line = provider === "未选择"
      ? "尚未选择候选报价。平台最终为准，未锁价，不代表可出票。"
      : "已选择候选：" + provider + (quoteId ? " / " + quoteId : "") + " · " + priceLine(safe) + " · 平台最终为准 · 未锁价 · 不代表可出票";
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: safeOptions.title || "已选择候选摘要",
      selected: provider !== "未选择",
      line: safeLine(line),
      providerName: provider,
      quoteId: quoteId,
      requiresUserConfirm: true,
      autoOpen: false,
      redacted: true
    });
  }

  function formatDeltaSummary(delta, options) {
    const safe = stripUnsafe(delta && typeof delta === "object" ? delta : {}) || {};
    const status = text(safe.status || safe.compareStatus || "not_enough_history");
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: options && options.title || "本地只读运行对比",
      status: status,
      line: safeLine("本地只读运行对比：" + (text(safe.summary) || (status === "compared" ? "已比较本地脱敏历史" : "历史不足")) + "。平台最终为准，未锁价，不代表可出票。"),
      redacted: true
    });
  }

  function formatReplaySummary(replay, options) {
    const safe = stripUnsafe(replay && typeof replay === "object" ? replay : {}) || {};
    const status = text(safe.status || "unavailable");
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: options && options.title || "Replay Guard",
      status: status,
      line: safeLine("Replay 只恢复本地脱敏候选证据，不重新请求 provider。平台最终为准，未锁价，不代表可出票。"),
      networkAllowed: false,
      autoOpen: false,
      redacted: true
    });
  }

  function formatReadOnlyQuoteEvidenceWarnings(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      warnings: [
        "平台最终为准",
        "未锁价",
        "不代表可出票",
        "当前导入样本 / 沙盒运行中的候选价格"
      ].concat(Array.isArray(safe.extraWarnings) ? safe.extraWarnings.map(safeLine).filter(Boolean) : []).slice(0, 8),
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canPayHere: false,
      canOrderHere: false,
      redacted: true
    });
  }

  function formatDecisionReasoning(decision) {
    const safe = stripUnsafe(decision && typeof decision === "object" ? decision : {}) || {};
    const reasoning = safe.reasoning && typeof safe.reasoning === "object" ? safe.reasoning : safe;
    const primaryReason = safeLine(reasoning.primaryReason || "该候选在本次只读候选样本中合计金额较低。");
    const supportingReasons = Array.isArray(reasoning.supportingReasons) ? reasoning.supportingReasons.map(safeLine).filter(Boolean) : [
      "价格拆分完整。",
      "平台最终为准。",
      "未锁价，不代表可出票。"
    ];
    const riskWarnings = Array.isArray(reasoning.riskWarnings) ? reasoning.riskWarnings.map(safeLine).filter(Boolean) : [
      "价格、库存、税费和规则以平台页面为准。",
      "本推荐仅基于本地只读候选证据，不代表真实最终价。",
      "未锁价，不代表可出票。"
    ];
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "推荐理由",
      primaryReason: primaryReason,
      supportingReasons: supportingReasons,
      riskWarnings: riskWarnings,
      line: safeLine(primaryReason + " 平台最终为准，未锁价，不代表可出票。"),
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      redacted: true
    });
  }

  function formatCandidateComparisonSummary(comparison) {
    const safe = stripUnsafe(comparison && typeof comparison === "object" ? comparison : {}) || {};
    const table = Array.isArray(safe.table) ? safe.table.slice(0, 3) : [];
    const summary = safe.summary && typeof safe.summary === "object" ? safe.summary : {};
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "候选对比",
      candidateCount: table.length,
      lines: table.map(function (candidate) {
        return "#" + String(candidate.rank || "") + " " + (candidate.providerName || "只读候选") + " · " + priceLine(candidate) + " · " + (candidate.handoffStatus === "ready" ? "仍需前往平台确认" : "平台确认链接不可用") + " · 平台最终为准 · 未锁价 · 不代表可出票";
      }),
      lowestInLocalSampleRank: summary.lowestInLocalSampleRank || null,
      caveat: safeLine(summary.caveat || "仅比较本地只读候选样本，平台最终为准。"),
      forbiddenClaims: { lowestAcrossWeb:false, finalBookablePrice:false, priceLocked:false, ticketAvailable:false },
      redacted: true
    });
  }

  function formatProviderConfirmationWarning(candidate) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    const ready = safe.safeProviderHandoffReady === true || safe.handoffStatus === "ready";
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "仍需前往平台确认",
      ready: ready,
      warning: ready ? "仍需前往平台确认，平台最终为准，未锁价，不代表可出票。" : "当前推荐候选的平台确认链接不可用。平台最终为准，未锁价，不代表可出票。",
      providerConfirmationRequiresUserConfirm: true,
      autoOpen: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      redacted: true
    });
  }

  function formatFlightWorkflowSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    const questions = Array.isArray(safe.clarificationQuestions) ? safe.clarificationQuestions.map(safeLine).filter(Boolean) : [];
    return clone({
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      title: "机票请求工作流",
      workflowStateSummary: stripUnsafe(safe.workflowStateSummary || null),
      clarificationSummary: stripUnsafe(safe.clarificationSummary || null),
      continuitySummary: stripUnsafe(safe.continuitySummary || null),
      confirmationStateSummary: stripUnsafe(safe.confirmationStateSummary || null),
      recoverySummary: stripUnsafe(safe.recoverySummary || null),
      resumeCoachSummary: stripUnsafe(safe.resumeCoachSummary || null),
      actionQueueSummary: stripUnsafe(safe.actionQueueSummary || safe.actionQueue || null),
      progressTimelineSummary: stripUnsafe(safe.progressTimelineSummary || safe.progressTimeline || null),
      safeResumeCenterSummary: stripUnsafe(safe.safeResumeCenterSummary || safe.safeResumeCenter || null),
      blockedActions: stripUnsafe(Array.isArray(safe.blockedActions) ? safe.blockedActions : (safe.actionQueueSummary && safe.actionQueueSummary.blockedActions || [])),
      nextSafeAction: safeLine(safe.nextSafeActionLabel || safe.nextSafeAction || ""),
      actionQueue: stripUnsafe(safe.actionQueueSummary || safe.actionQueue || null),
      progressTimeline: stripUnsafe(safe.progressTimelineSummary || safe.progressTimeline || null),
      safeResumeCenter: stripUnsafe(safe.safeResumeCenterSummary || safe.safeResumeCenter || null),
      currentStage: safeLine(safe.currentStage || ""),
      workflowStageLabel: safeLine(safe.workflowStageLabel || safe.continuitySummary && safe.continuitySummary.stageLabel || ""),
      nextStepLabel: safeLine(safe.nextStepLabel || ""),
      canResumeWorkflow: safe.canResumeWorkflow === true,
      resumeActions: stripUnsafe(Array.isArray(safe.resumeActions) ? safe.resumeActions : (safe.resumeCoachSummary && safe.resumeCoachSummary.allowedActions || [])),
      workflowStepList: stripUnsafe(safe.workflowStepList || []),
      scenarioSimulationSummary: stripUnsafe(safe.scenarioSimulationSummary || null),
      safetyTestMatrixSummary: stripUnsafe(safe.safetyTestMatrixSummary || null),
      releaseReadinessSummary: stripUnsafe(safe.releaseReadinessSummary || null),
      userSafetyCopySummary: stripUnsafe(safe.userSafetyCopySummary || null),
      forbiddenCapabilitySummary: stripUnsafe(safe.forbiddenCapabilitySummary || null),
      userFacingBetaReadiness: stripUnsafe(safe.userFacingBetaReadiness || null),
      copyValidationStatus: safeLine(safe.copyValidationStatus || ""),
      missingFields: Array.isArray(safe.missingFields) ? safe.missingFields.map(safeLine) : [],
      clarificationQuestions: questions,
      workflowUserMessage: safeLine(safe.workflowUserMessage || (questions.length ? "需要补充信息。信息完整后再生成候选证据。" : "候选证据已生成，平台最终为准。")),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      redacted:true
    });
  }

  function formatFlightWorkflowAuditReviewSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"本次机票工作流审计", line:safeLine(safe.statusLabel || safe.healthLabel || "安全检查通过"), findings:Array.isArray(safe.findings) ? safe.findings.map(function(item){ return safeLine(item.label || item.message || item.findingId || ""); }).filter(Boolean).slice(0, 6) : [], bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatSafeSessionExportPreviewSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"脱敏会话摘要预览", line:safeLine(safe.readinessLabel || "仅预览，不写入文件"), sectionLabels:["工作流摘要", "候选证据摘要", "安全审计摘要"], canWriteFile:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowHumanReviewChecklistSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"前往平台前请人工复核", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.line || safe.line || "仍需补充复核"), sectionLabels:["人工复核清单", "已确认项", "未完成项"], bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowFinalSafeHandoffPacketSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"最终安全交接包", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.line || safe.line || "仍需补充复核"), sectionLabels:["行程摘要", "候选证据摘要", "平台核对摘要", "安全限制摘要"], canOpenExternalPlatform:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowOperatorConsoleSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"机票工作流运营控制台", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.resultLabel || safe.line || "存在需要注意的项目"), sectionLabels:["工作流状态", "安全状态", "最近事件", "已阻断动作", "平台确认准备状态"], bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowSafetyRegressionSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"安全回归", line:safeLine(safe.status === "pass" ? "安全回归通过" : "安全回归失败"), sectionLabels:["无交易链接", "无付款/下单/出票", "无证件/银行卡/登录凭据", "无密钥或原始响应", "无自动打开或自动刷新"], bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowScenarioSimulationSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"机票工作流场景模拟", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.resultLabel || (safe.status === "pass" ? "场景模拟通过" : (safe.status === "warning" ? "场景模拟存在警告" : (safe.status === "fail" ? "场景模拟存在失败项" : "场景模拟已记录")))), scenarioCount:Number(safe.scenarioCount || 0), passedCount:Number(safe.passedCount || 0), warningCount:Number(safe.warningCount || 0), failedCount:Number(safe.failedCount || 0), blockedCount:Number(safe.blockedCount || 0), sectionLabels:["完整机票请求", "缺少出发地", "缺少目的地", "缺少日期", "平台价格变化", "平台库存变化", "敏感输入阻断", "受限品类阻断"], caveat:"场景模拟仅用于安全回归，不代表真实票价、库存或可出票。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function formatFlightWorkflowSafetyTestMatrixSummary(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    return clone({ title:"安全测试矩阵", line:safeLine(safe.userFacingSummary && safe.userFacingSummary.resultLabel || (safe.status === "pass" ? "全部通过" : (safe.status === "warning" ? "存在警告" : (safe.status === "fail" ? "存在失败项" : "未知")))), scenarioCount:Number(safe.scenarioCount || 0), passedCount:Number(safe.passedCount || 0), warningCount:Number(safe.warningCount || 0), failedCount:Number(safe.failedCount || 0), blockedCount:Number(safe.blockedCount || 0), sectionLabels:["完整机票请求", "缺少出发地", "缺少目的地", "缺少日期", "非法交易链接阻断", "非法密钥阻断", "非法付款动作", "平台确认需要确认"], caveat:"该矩阵仅为本地安全回归检查，不代表真实票价或可出票。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function buildReadOnlyQuoteEvidenceSummaryFormatterAuditDraft(input) {
    const warnings = formatReadOnlyQuoteEvidenceWarnings(input);
    return clone({
      eventType: "READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_AUDIT_DRAFT",
      formatterName: FORMATTER_NAME,
      appVersion: READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
      warningCount: warnings.warnings.length,
      forbiddenClaimCount: 0,
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  window.WeishanReadOnlyQuoteEvidenceSummaryFormatter = {
    READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION,
    FORMATTER_NAME,
    formatTopCandidateSummary,
    formatSelectedCandidateSummary,
    formatDeltaSummary,
    formatReplaySummary,
    formatReadOnlyQuoteEvidenceWarnings,
    formatDecisionReasoning,
    formatCandidateComparisonSummary,
    formatProviderConfirmationWarning,
    formatFlightWorkflowSummary,
    formatFlightWorkflowAuditReviewSummary,
    formatSafeSessionExportPreviewSummary,
    formatFlightWorkflowHumanReviewChecklistSummary,
    formatFlightWorkflowFinalSafeHandoffPacketSummary,
    formatFlightWorkflowOperatorConsoleSummary,
    formatFlightWorkflowSafetyRegressionSummary,
    formatFlightWorkflowScenarioSimulationSummary,
    formatFlightWorkflowSafetyTestMatrixSummary,
    buildReadOnlyQuoteEvidenceSummaryFormatterAuditDraft
  };
})();
