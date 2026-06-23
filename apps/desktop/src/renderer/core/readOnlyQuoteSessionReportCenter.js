;(function () {
  "use strict";

  const READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION = "2.1.62";
  const REPORT_CENTER_NAME = "read_only_quote_session_report_center_v1";
  const FORBIDDEN_NAME_RE = /(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i;
  const FORBIDDEN_TEXT_RE = /全网最低|最低价保证|已锁价|可以出票|可直接出票|真实最终价|立即购买/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }

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

  function formatterApi() {
    return window.WeishanReadOnlyQuoteEvidenceSummaryFormatter || {};
  }

  function sessionApi() {
    return window.WeishanReadOnlyQuoteSessionManager || {};
  }

  function auditApi() {
    return window.WeishanReadOnlyQuoteAuditExport || {};
  }

  function decisionApi() {
    return window.WeishanReadOnlyQuoteDecisionAssistant || {};
  }

  function comparisonApi() {
    return window.WeishanReadOnlyQuoteCandidateComparisonExplainer || {};
  }

  function safeText(value) {
    return text(value).replace(FORBIDDEN_TEXT_RE, "保守候选证据");
  }

  function safeCandidates(input) {
    const safe = input && typeof input === "object" ? input : {};
    const candidates = Array.isArray(safe.topCandidates) ? safe.topCandidates
      : (Array.isArray(safe.dryRunTopCandidates) ? safe.dryRunTopCandidates
        : (safe.rankingPreview && Array.isArray(safe.rankingPreview.topCandidates) ? safe.rankingPreview.topCandidates : []));
    return candidates.slice(0, 3).map(function (candidate, index) {
      const item = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
      return Object.assign({}, item, {
        rank: item.rank || index + 1,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      });
    });
  }

  function resolveSessionSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.sessionSummary && typeof safe.sessionSummary === "object") return stripUnsafe(safe.sessionSummary);
    if (safe.session && typeof safe.session === "object" && sessionApi().buildReadOnlyQuoteSessionSummary) return sessionApi().buildReadOnlyQuoteSessionSummary(safe.session);
    if (safe.sessionName || safe.sessionId || safe.userIntentSummary) {
      return sessionApi().buildReadOnlyQuoteSessionSummary ? sessionApi().buildReadOnlyQuoteSessionSummary(safe) : stripUnsafe(safe);
    }
    return null;
  }

  function workflowFields(input) {
    const safe = input && typeof input === "object" ? input : {};
    return {
      workflowStateSummary: stripUnsafe(safe.workflowStateSummary || null),
      clarificationSummary: stripUnsafe(safe.clarificationSummary || null),
      continuitySummary: stripUnsafe(safe.continuitySummary || null),
      confirmationStateSummary: stripUnsafe(safe.confirmationStateSummary || null),
      recoverySummary: stripUnsafe(safe.recoverySummary || null),
      resumeCoachSummary: stripUnsafe(safe.resumeCoachSummary || null),
      currentStage: safeText(safe.currentStage || ""),
      workflowStageLabel: safeText(safe.workflowStageLabel || safe.continuitySummary && safe.continuitySummary.stageLabel || ""),
      nextStepLabel: safeText(safe.nextStepLabel || ""),
      canResumeWorkflow: safe.canResumeWorkflow === true,
      resumeActions: stripUnsafe(Array.isArray(safe.resumeActions) ? safe.resumeActions : (safe.resumeCoachSummary && safe.resumeCoachSummary.allowedActions || [])),
      workflowStepList: stripUnsafe(safe.workflowStepList || null),
      missingFields: Array.isArray(safe.missingFields) ? safe.missingFields.map(safeText) : [],
      clarificationQuestions: Array.isArray(safe.clarificationQuestions) ? safe.clarificationQuestions.map(safeText) : [],
      workflowUserMessage: safeText(safe.workflowUserMessage || "")
    };
  }

  function malformedSession(input) {
    const safe = input && typeof input === "object" ? input : null;
    if (!safe) return false;
    if (safe.session === null) return true;
    const session = safe.sessionSummary || safe.session || safe;
    if (!session || typeof session !== "object") return true;
    if ((session.sessionName || session.sessionId || session.userIntentSummary) && typeof session !== "object") return true;
    return false;
  }

  function buildUserFacingQuoteEvidenceSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const summary = resolveSessionSummary(safe);
    const intent = summary && summary.userIntentSummary || safe.userIntentSummary || {};
    const candidates = safeCandidates(safe);
    const formatter = formatterApi();
    const selected = safe.selectedCandidate || (summary && summary.dryRun && summary.dryRun.selectedCandidate) || (summary && summary.selection) || null;
    const selectedSummary = formatter.formatSelectedCandidateSummary ? formatter.formatSelectedCandidateSummary(selected || {}) : { line:"尚未选择候选报价。平台最终为准，未锁价，不代表可出票。", selected:false, redacted:true };
    const topSummary = formatter.formatTopCandidateSummary ? formatter.formatTopCandidateSummary(candidates) : { lines:[], redacted:true };
    const decisionAssistant = typeof decisionApi().buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi().buildReadOnlyQuoteDecisionAssistant(Object.assign({}, safe, { topCandidates:candidates, selectedCandidate:selected, handoffChecklistSummary:safe.handoffChecklistSummary || safe.handoffChecklist, handoffReceiptSummary:safe.handoffReceiptSummary || safe.handoffReceipt, manualPlatformCheckSummary:safe.manualPlatformCheckSummary || safe.manualPlatformCheckEvidence, platformCheckDeltaSummary:safe.platformCheckDeltaSummary || safe.platformCheckDelta, reconciliationSummary:safe.reconciliationSummary, confidenceLabelSummary:safe.confidenceLabelSummary, safeNextStepSummary:safe.safeNextStepSummary, platformCheckOutcomeSummary:safe.platformCheckOutcomeSummary, manualPlatformCheckEvidence:safe.manualPlatformCheckEvidence, platformCheckDelta:safe.platformCheckDelta })) : null;
    const candidateComparison = typeof comparisonApi().buildReadOnlyQuoteCandidateComparison === "function" ? comparisonApi().buildReadOnlyQuoteCandidateComparison(candidates) : null;
    const decisionAssistantSummary = formatter.formatDecisionReasoning && decisionAssistant ? formatter.formatDecisionReasoning(decisionAssistant) : null;
    const candidateComparisonSummary = formatter.formatCandidateComparisonSummary && candidateComparison ? formatter.formatCandidateComparisonSummary(candidateComparison) : null;
    return clone({
      title: "候选报价证据摘要",
      subtitle: "只读候选价 · 平台最终为准",
      routeSummary: safeText(safe.routeSummary || intent.route || ""),
      departureDate: safeText(safe.departureDate || intent.departureDate || ""),
      topCandidateCount: candidates.length,
      topCandidateSummary: topSummary,
      selectedCandidateSummary: selectedSummary,
      decisionAssistantSummary: decisionAssistantSummary,
      candidateComparisonSummary: candidateComparisonSummary,
      recommendationExplanation: decisionAssistant && decisionAssistant.reasoning || null,
      decisionSafetyWarnings: decisionAssistant && decisionAssistant.reasoning && decisionAssistant.reasoning.riskWarnings || ["平台最终为准", "未锁价", "不代表可出票", "仍需平台确认"],
      handoffChecklistSummary: stripUnsafe(safe.handoffChecklistSummary || safe.handoffChecklist || decisionAssistant && decisionAssistant.handoffChecklistSummary || null),
      handoffReceiptSummary: stripUnsafe(safe.handoffReceiptSummary || safe.handoffReceipt || decisionAssistant && decisionAssistant.handoffReceiptSummary || null),
      manualPlatformCheckSummary: stripUnsafe(safe.manualPlatformCheckSummary || safe.manualPlatformCheckEvidence || decisionAssistant && decisionAssistant.manualPlatformCheckSummary || null),
      platformCheckDeltaSummary: stripUnsafe(safe.platformCheckDeltaSummary || safe.platformCheckDelta || decisionAssistant && decisionAssistant.platformCheckDeltaSummary || null),
      reconciliationSummary: stripUnsafe(safe.reconciliationSummary || decisionAssistant && decisionAssistant.reconciliationSummary || null),
      confidenceLabelSummary: stripUnsafe(safe.confidenceLabelSummary || decisionAssistant && decisionAssistant.confidenceLabelSummary || null),
      safeNextStepSummary: stripUnsafe(safe.safeNextStepSummary || decisionAssistant && decisionAssistant.safeNextStepSummary || null),
      platformCheckOutcomeSummary: stripUnsafe(safe.platformCheckOutcomeSummary || decisionAssistant && decisionAssistant.platformCheckOutcomeSummary || null),
      workflowStateSummary: workflowFields(safe).workflowStateSummary,
      clarificationSummary: workflowFields(safe).clarificationSummary,
      continuitySummary: workflowFields(safe).continuitySummary,
      confirmationStateSummary: workflowFields(safe).confirmationStateSummary,
      recoverySummary: workflowFields(safe).recoverySummary,
      resumeCoachSummary: workflowFields(safe).resumeCoachSummary,
      currentStage: workflowFields(safe).currentStage,
      workflowStageLabel: workflowFields(safe).workflowStageLabel,
      nextStepLabel: workflowFields(safe).nextStepLabel,
      canResumeWorkflow: workflowFields(safe).canResumeWorkflow,
      resumeActions: workflowFields(safe).resumeActions,
      workflowStepList: workflowFields(safe).workflowStepList,
      missingFields: workflowFields(safe).missingFields,
      clarificationQuestions: workflowFields(safe).clarificationQuestions,
      workflowUserMessage: workflowFields(safe).workflowUserMessage,
      platformCheckWarnings: stripUnsafe(decisionAssistant && decisionAssistant.platformCheckWarnings || (safe.manualPlatformCheckEvidence ? ["平台核对结果已记录", "平台最终为准"] : ["仍需平台确认"])),
      workflowStateSummary: workflowFields(safe).workflowStateSummary,
      clarificationSummary: workflowFields(safe).clarificationSummary,
      continuitySummary: workflowFields(safe).continuitySummary,
      confirmationStateSummary: workflowFields(safe).confirmationStateSummary,
      recoverySummary: workflowFields(safe).recoverySummary,
      resumeCoachSummary: workflowFields(safe).resumeCoachSummary,
      currentStage: workflowFields(safe).currentStage,
      workflowStageLabel: workflowFields(safe).workflowStageLabel,
      nextStepLabel: workflowFields(safe).nextStepLabel,
      canResumeWorkflow: workflowFields(safe).canResumeWorkflow,
      resumeActions: workflowFields(safe).resumeActions,
      workflowStepList: workflowFields(safe).workflowStepList,
      missingFields: workflowFields(safe).missingFields,
      clarificationQuestions: workflowFields(safe).clarificationQuestions,
      workflowUserMessage: workflowFields(safe).workflowUserMessage,
      labels: ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"],
      caveat: "价格、库存、税费和规则以平台页面为准。唯珊不会付款、不会下单、不会上传证件或银行卡。",
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canReplaceMainResultCard: false,
      redacted: true
    });
  }

  function buildSafetyQuoteEvidenceReport(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    const summary = resolveSessionSummary(safe);
    const auditPreview = safe.auditExportPreview ;
    const candidates = safeCandidates(safe);
    const selected = safe.selectedCandidate || summary && summary.selection || null;
    const decisionAssistant = typeof decisionApi().buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi().buildReadOnlyQuoteDecisionAssistant(Object.assign({}, safe, { topCandidates:candidates, selectedCandidate:selected })) : null;
    const candidateComparison = typeof comparisonApi().buildReadOnlyQuoteCandidateComparison === "function" ? comparisonApi().buildReadOnlyQuoteCandidateComparison(candidates) : null;
    return clone({
      sessionSummary: summary,
      auditExportPreview: stripUnsafe(auditPreview),
      historySummary: stripUnsafe(safe.runHistorySummary || safe.historySummary || summary && summary.history || null),
      deltaSummary: stripUnsafe(safe.quoteDeltaSummary || safe.deltaSummary || summary && summary.deltaCompare || null),
      replaySummary: stripUnsafe(safe.replaySummary || summary && summary.replay || null),
      decisionAssistantSummary: stripUnsafe(decisionAssistant ? { assistantName:decisionAssistant.assistantName, appVersion:decisionAssistant.appVersion, status:decisionAssistant.status, recommendationType:decisionAssistant.recommendationType, recommendedCandidate:decisionAssistant.recommendedCandidate, actions:decisionAssistant.actions, safety:decisionAssistant.safety, handoffChecklistSummary:decisionAssistant.handoffChecklistSummary || null, handoffReceiptSummary:decisionAssistant.handoffReceiptSummary || null, manualPlatformCheckSummary:decisionAssistant.manualPlatformCheckSummary || null, platformCheckDeltaSummary:decisionAssistant.platformCheckDeltaSummary || null, reconciliationSummary:decisionAssistant.reconciliationSummary || null, confidenceLabelSummary:decisionAssistant.confidenceLabelSummary || null, safeNextStepSummary:decisionAssistant.safeNextStepSummary || null, platformCheckOutcomeSummary:decisionAssistant.platformCheckOutcomeSummary || null, continuitySummary:decisionAssistant.continuitySummary || null, confirmationStateSummary:decisionAssistant.confirmationStateSummary || null, recoverySummary:decisionAssistant.recoverySummary || null, resumeCoachSummary:decisionAssistant.resumeCoachSummary || null, currentStage:decisionAssistant.currentStage || "", workflowStageLabel:decisionAssistant.workflowStageLabel || "", nextStepLabel:decisionAssistant.nextStepLabel || "", canResumeWorkflow:decisionAssistant.canResumeWorkflow === true, resumeActions:decisionAssistant.resumeActions || [], redacted:true } : null),
      candidateComparisonSummary: stripUnsafe(candidateComparison ? { explainerName:candidateComparison.explainerName, appVersion:candidateComparison.appVersion, status:candidateComparison.status, table:candidateComparison.table, summary:candidateComparison.summary, forbiddenClaims:candidateComparison.forbiddenClaims, redacted:true } : null),
      recommendationExplanation: stripUnsafe(decisionAssistant && decisionAssistant.reasoning || null),
      decisionSafetyWarnings: decisionAssistant && decisionAssistant.reasoning && Array.isArray(decisionAssistant.reasoning.riskWarnings) ? decisionAssistant.reasoning.riskWarnings.slice(0, 6) : ["平台最终为准", "未锁价", "不代表可出票"],
      reconciliationSummary: stripUnsafe(safe.reconciliationSummary || decisionAssistant && decisionAssistant.reconciliationSummary || null),
      confidenceLabelSummary: stripUnsafe(safe.confidenceLabelSummary || decisionAssistant && decisionAssistant.confidenceLabelSummary || null),
      safeNextStepSummary: stripUnsafe(safe.safeNextStepSummary || decisionAssistant && decisionAssistant.safeNextStepSummary || null),
      platformCheckOutcomeSummary: stripUnsafe(safe.platformCheckOutcomeSummary || decisionAssistant && decisionAssistant.platformCheckOutcomeSummary || null),
      workflowStateSummary: workflowFields(safe).workflowStateSummary,
      clarificationSummary: workflowFields(safe).clarificationSummary,
      continuitySummary: workflowFields(safe).continuitySummary,
      confirmationStateSummary: workflowFields(safe).confirmationStateSummary,
      recoverySummary: workflowFields(safe).recoverySummary,
      resumeCoachSummary: workflowFields(safe).resumeCoachSummary,
      currentStage: workflowFields(safe).currentStage,
      workflowStageLabel: workflowFields(safe).workflowStageLabel,
      nextStepLabel: workflowFields(safe).nextStepLabel,
      canResumeWorkflow: workflowFields(safe).canResumeWorkflow,
      resumeActions: workflowFields(safe).resumeActions,
      workflowStepList: workflowFields(safe).workflowStepList,
      missingFields: workflowFields(safe).missingFields,
      clarificationQuestions: workflowFields(safe).clarificationQuestions,
      workflowUserMessage: workflowFields(safe).workflowUserMessage,
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

  function sanitizeReadOnlyQuoteSessionReportCenter(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    const hasSession = !!resolveSessionSummary(safe);
    const failed = malformedSession(input);
    const userFacingSummary = buildUserFacingQuoteEvidenceSummary(safe);
    const safetyReport = buildSafetyQuoteEvidenceReport(safe);
    const selected = safe.selectedCandidate || safetyReport.sessionSummary && safetyReport.sessionSummary.selection || null;
    const canConfirm = !!(selected && selected.safeProviderHandoffReady === true);
    return clone({
      reportCenterName: REPORT_CENTER_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION,
      status: failed ? "failed_safe" : (hasSession ? "ready" : "empty"),
      userFacingSummary: userFacingSummary,
      safetyReport: safetyReport,
      actions: {
        canOpenProviderConfirmation: canConfirm,
        providerConfirmationRequiresUserConfirm: true,
        canExportRedactedPreview: hasSession && !failed,
        canRecoverSession: hasSession && !failed,
        canPayHere: false,
        canOrderHere: false,
        canUploadIdentityHere: false
      },
      redacted: true
    });
  }

  function buildReadOnlyQuoteSessionReportCenter(input) {
    return sanitizeReadOnlyQuoteSessionReportCenter(input);
  }

  function buildReadOnlyQuoteSessionReportCenterAuditDraft(input) {
    const report = buildReadOnlyQuoteSessionReportCenter(input);
    return clone({
      eventType: "READ_ONLY_QUOTE_SESSION_REPORT_CENTER_AUDIT_DRAFT",
      reportCenterName: REPORT_CENTER_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION,
      status: report.status,
      topCandidateCount: report.userFacingSummary.topCandidateCount,
      decisionAssistantSummary: report.safetyReport.decisionAssistantSummary,
      candidateComparisonSummary: report.safetyReport.candidateComparisonSummary,
      recommendationExplanation: report.safetyReport.recommendationExplanation,
      decisionSafetyWarnings: report.safetyReport.decisionSafetyWarnings,
      handoffChecklistSummary: report.safetyReport.handoffChecklistSummary || null,
      handoffReceiptSummary: report.safetyReport.handoffReceiptSummary || null,
      manualPlatformCheckSummary: report.safetyReport.manualPlatformCheckSummary || null,
      platformCheckDeltaSummary: report.safetyReport.platformCheckDeltaSummary || null,
      reconciliationSummary: report.safetyReport.reconciliationSummary || null,
      confidenceLabelSummary: report.safetyReport.confidenceLabelSummary || null,
      safeNextStepSummary: report.safetyReport.safeNextStepSummary || null,
      platformCheckOutcomeSummary: report.safetyReport.platformCheckOutcomeSummary || null,
      platformCheckWarnings: report.safetyReport.platformCheckWarnings || [],
      workflowStateSummary: report.safetyReport.workflowStateSummary || null,
      clarificationSummary: report.safetyReport.clarificationSummary || null,
      workflowStepList: report.safetyReport.workflowStepList || null,
      missingFields: report.safetyReport.missingFields || [],
      clarificationQuestions: report.safetyReport.clarificationQuestions || [],
      workflowUserMessage: report.safetyReport.workflowUserMessage || "",
      continuitySummary: report.safetyReport.continuitySummary || null,
      confirmationStateSummary: report.safetyReport.confirmationStateSummary || null,
      recoverySummary: report.safetyReport.recoverySummary || null,
      resumeCoachSummary: report.safetyReport.resumeCoachSummary || null,
      currentStage: report.safetyReport.currentStage || "",
      workflowStageLabel: report.safetyReport.workflowStageLabel || "",
      nextStepLabel: report.safetyReport.nextStepLabel || "",
      canResumeWorkflow: report.safetyReport.canResumeWorkflow === true,
      resumeActions: report.safetyReport.resumeActions || [],
      canOpenProviderConfirmation: report.actions.canOpenProviderConfirmation,
      providerConfirmationRequiresUserConfirm: true,
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

  window.WeishanReadOnlyQuoteSessionReportCenter = {
    READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION,
    REPORT_CENTER_NAME,
    buildReadOnlyQuoteSessionReportCenter,
    buildUserFacingQuoteEvidenceSummary,
    buildSafetyQuoteEvidenceReport,
    buildReadOnlyQuoteSessionReportCenterAuditDraft,
    sanitizeReadOnlyQuoteSessionReportCenter
  };
})();
