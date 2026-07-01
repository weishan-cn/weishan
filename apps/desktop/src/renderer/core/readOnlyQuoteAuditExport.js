;(function () {
  "use strict";

  const READ_ONLY_QUOTE_AUDIT_EXPORT_VERSION = "2.6.0";
  const EXPORT_NAME = "read_only_quote_audit_export_v1";
  const FORBIDDEN_NAME_RE = /(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i;
  const CAVEAT = "本导出仅为只读候选证据，平台最终为准，未锁价，不代表可出票。";

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

  function containsForbidden(value) {
    if (Array.isArray(value)) return value.some(containsForbidden);
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (name) {
      const next = value[name];
      const allowedSafetyFlag = /Included$|Stored$/.test(name) && next === false;
      const allowedNullUrl = /Url$/.test(name) && next === null;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedSafetyFlag && !allowedNullUrl) return true;
      return containsForbidden(next);
    });
  }

  function sessionSummary(session) {
    const api = window.WeishanReadOnlyQuoteSessionManager || {};
    if (api && typeof api.buildReadOnlyQuoteSessionSummary === "function") return api.buildReadOnlyQuoteSessionSummary(session);
    return stripUnsafe(session && typeof session === "object" ? session : {});
  }

  function topCandidatesFrom(session) {
    const safe = session && typeof session === "object" ? session : {};
    const dryRunCandidates = safe.dryRunTopCandidates || (safe.ranking && safe.ranking.topCandidates) || (safe.sandboxDryRunSummary && safe.sandboxDryRunSummary.dryRunTopCandidates);
    if (Array.isArray(dryRunCandidates)) return stripUnsafe(dryRunCandidates.slice(0, 3));
    const summary = safe.sessionSummary || safe;
    if (summary.dryRun && summary.dryRun.selectedCandidate) return [stripUnsafe(summary.dryRun.selectedCandidate)];
    return [];
  }

  function reportCenterFrom(session) {
    const api = window.WeishanReadOnlyQuoteSessionReportCenter || {};
    if (api && typeof api.buildReadOnlyQuoteSessionReportCenter === "function") return api.buildReadOnlyQuoteSessionReportCenter(session);
    return null;
  }

  function buildReadOnlyQuoteAuditExport(session, options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const summary = sessionSummary(session);
    const safe = stripUnsafe(session && typeof session === "object" ? session : {}) || {};
    const reportCenter = reportCenterFrom(Object.assign({}, safe, { sessionSummary: summary }));
    return clone({
      exportName: EXPORT_NAME,
      appVersion: READ_ONLY_QUOTE_AUDIT_EXPORT_VERSION,
      exportType: "redacted_json_preview",
      generatedAt: safeOptions.generatedAt || null,
      sessionSummary: summary,
      runTimelineSummary: stripUnsafe(safe.runTimelineSummary || safe.timelineSummary || summary.runTimelineSummary || null),
      topCandidates: topCandidatesFrom(session),
      selectedCandidate: stripUnsafe(safe.selectedCandidate || summary.selection || null),
      historySummary: stripUnsafe(safe.runHistorySummary || summary.history || null),
      deltaSummary: stripUnsafe(safe.quoteDeltaSummary || summary.deltaCompare || null),
      replaySummary: stripUnsafe(safe.replaySummary || summary.replay || null),
      reportCenterSummary: stripUnsafe(reportCenter ? { reportCenterName: reportCenter.reportCenterName, appVersion: reportCenter.appVersion, status: reportCenter.status, actions: reportCenter.actions } : null),
      userFacingSummary: stripUnsafe(reportCenter && reportCenter.userFacingSummary || null),
      decisionAssistantSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.decisionAssistantSummary || null),
      candidateComparisonSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.candidateComparisonSummary || null),
      recommendationExplanation: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.recommendationExplanation || null),
      decisionSafetyWarnings: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.decisionSafetyWarnings || []),
      handoffChecklistSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.handoffChecklistSummary || safe.handoffChecklistSummary || null),
      handoffReceiptSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.handoffReceiptSummary || safe.handoffReceiptSummary || null),
      manualPlatformCheckSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.manualPlatformCheckSummary || safe.manualPlatformCheckSummary || null),
      platformCheckDeltaSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.platformCheckDeltaSummary || safe.platformCheckDeltaSummary || null),
      reconciliationSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.reconciliationSummary || safe.reconciliationSummary || null),
      confidenceLabelSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.confidenceLabelSummary || safe.confidenceLabelSummary || null),
      safeNextStepSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.safeNextStepSummary || safe.safeNextStepSummary || null),
      platformCheckOutcomeSummary: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.platformCheckOutcomeSummary || safe.platformCheckOutcomeSummary || null),
      platformCheckWarnings: stripUnsafe(reportCenter && reportCenter.safetyReport && reportCenter.safetyReport.platformCheckWarnings || []),
      safetyReportSummary: stripUnsafe(reportCenter && reportCenter.safetyReport ? { rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true } : null),
      exportValidationWarnings: ["redacted_json_preview only", "不包含原始响应、密钥、交易链接或身份信息", "平台最终为准", "未锁价", "不代表可出票"],
      safety: {
        rawResponseIncluded: false,
        secretIncluded: false,
        bookingUrlIncluded: false,
        paymentUrlIncluded: false,
        orderUrlIncluded: false,
        identityIncluded: false,
        redacted: true
      },
      caveat: CAVEAT,
      redacted: true
    });
  }

  function validateReadOnlyQuoteAuditExport(exportModel) {
    const safe = exportModel && typeof exportModel === "object" ? exportModel : {};
    const valid = safe.exportName === EXPORT_NAME &&
      safe.appVersion === READ_ONLY_QUOTE_AUDIT_EXPORT_VERSION &&
      safe.exportType === "redacted_json_preview" &&
      safe.generatedAt === null &&
      safe.redacted === true &&
      safe.safety && safe.safety.rawResponseIncluded === false &&
      safe.safety.secretIncluded === false &&
      safe.safety.bookingUrlIncluded === false &&
      safe.safety.paymentUrlIncluded === false &&
      safe.safety.orderUrlIncluded === false &&
      safe.safety.identityIncluded === false &&
      !containsForbidden(safe);
    return clone({
      valid: valid,
      status: valid ? "pass" : "blocked",
      rawResponseIncluded: false,
      secretIncluded: false,
      bookingUrlIncluded: false,
      paymentUrlIncluded: false,
      orderUrlIncluded: false,
      identityIncluded: false,
      caveatPresent: text(safe.caveat).indexOf("本导出仅为只读候选证据") >= 0,
      reportCenterSummary: !!safe.reportCenterSummary,
      userFacingSummary: !!safe.userFacingSummary,
      safetyReportSummary: !!safe.safetyReportSummary,
      decisionAssistantSummary: !!safe.decisionAssistantSummary,
      candidateComparisonSummary: !!safe.candidateComparisonSummary,
      recommendationExplanation: !!safe.recommendationExplanation,
      decisionSafetyWarnings: Array.isArray(safe.decisionSafetyWarnings) ? safe.decisionSafetyWarnings.slice(0, 8) : [],
      handoffChecklistSummary: !!safe.handoffChecklistSummary,
      handoffReceiptSummary: !!safe.handoffReceiptSummary,
      manualPlatformCheckSummary: !!safe.manualPlatformCheckSummary,
      platformCheckDeltaSummary: !!safe.platformCheckDeltaSummary,
      reconciliationSummary: !!safe.reconciliationSummary,
      confidenceLabelSummary: !!safe.confidenceLabelSummary,
      safeNextStepSummary: !!safe.safeNextStepSummary,
      platformCheckOutcomeSummary: !!safe.platformCheckOutcomeSummary,
      exportValidationWarnings: Array.isArray(safe.exportValidationWarnings) ? safe.exportValidationWarnings.slice(0, 8) : [],
      redacted: true
    });
  }

  function buildReadOnlyQuoteAuditExportPreview(session, options) {
    const exportModel = buildReadOnlyQuoteAuditExport(session, options);
    const validation = validateReadOnlyQuoteAuditExport(exportModel);
    return clone({
      title: "Audit Export",
      previewLabel: "Redacted JSON Preview",
      actionLabel: "查看脱敏审计预览",
      exportModel: exportModel,
      validation: validation,
      caveat: CAVEAT,
      safetyLine: "不包含原始响应、密钥、交易链接或身份信息",
      fileWrite: false,
      upload: false,
      redacted: true
    });
  }

  function buildReadOnlyQuoteAuditExportAuditDraft(session, options) {
    const preview = buildReadOnlyQuoteAuditExportPreview(session, options);
    return clone({
      eventType: "READ_ONLY_QUOTE_AUDIT_EXPORT_DRAFT",
      exportName: EXPORT_NAME,
      appVersion: READ_ONLY_QUOTE_AUDIT_EXPORT_VERSION,
      exportType: "redacted_json_preview",
      validationStatus: preview.validation.status,
      rawResponseIncluded: false,
      secretIncluded: false,
      bookingUrlIncluded: false,
      paymentUrlIncluded: false,
      orderUrlIncluded: false,
      identityIncluded: false,
      fileWrite: false,
      upload: false,
      caveat: CAVEAT,
      redacted: true
    });
  }

  window.WeishanReadOnlyQuoteAuditExport = {
    READ_ONLY_QUOTE_AUDIT_EXPORT_VERSION,
    EXPORT_NAME,
    buildReadOnlyQuoteAuditExport,
    validateReadOnlyQuoteAuditExport,
    buildReadOnlyQuoteAuditExportPreview,
    buildReadOnlyQuoteAuditExportAuditDraft
  };
})();
