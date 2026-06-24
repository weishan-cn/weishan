;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION = "2.1.84";
  const PREVIEW_NAME = "flight_workflow_safe_session_export_preview_v1";
  const FORBIDDEN_NAME_RE = /(rawText|rawUserText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|apiKey|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { const line = text(value); if (line === "不包含证件、银行卡、登录凭据或密钥") return line; return line.replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalse = /(Stored|Included|Allowed|Enabled|Upload|Input|Write|Download|Payment|Order|Ticketing)$/i.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function safety() { return { previewOnly:true, fileWrite:false, download:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true }; }
  function hasUnsafe(value) {
    let unsafe = false;
    function visit(item, key) {
      if (unsafe || item == null) return;
      const name = String(key || "");
      if (/rawProviderResponse|rawResponse|rawPayload|rawText|rawUserText|rawInput|token|apiKey|secret|password|credential|identity|passport|bank|card|idNumber|passportNumber/i.test(name) && item) unsafe = true;
      if (/bookingUrl|checkoutUrl|paymentUrl|orderUrl/i.test(name) && item !== null && item !== false && item !== "") unsafe = true;
      if (typeof item === "string" && (/token|apiKey|secret|password|sk-|pk-|live_|prod_|身份证|护照|银行卡|https?:\/\//i.test(item))) unsafe = true;
      if (Array.isArray(item)) item.forEach(function (child) { visit(child, name); });
      else if (item && typeof item === "object") Object.keys(item).forEach(function (childKey) { visit(item[childKey], childKey); });
    }
    visit(value, "");
    return unsafe;
  }
  function row(label, value) { return { label:safeText(label), value:safeText(value), redacted:true }; }
  function evaluateSafeSessionExportReadiness(input) {
    const safe = input && typeof input === "object" ? input : {};
    const hasWorkflow = !!(safe.workflowStateSummary || safe.workflow || safe.continuitySummary || safe.workflowId);
    const hasEvidence = !!(safe.topCandidates || safe.dryRunTopCandidates || safe.selectedCandidate || safe.sessionSummary || safe.userFacingEvidenceSummary);
    const hasAuditReview = !!(safe.auditReviewSummary || safe.auditReview || safe.auditReviewCenter || safe.auditHealth);
    const blocked = hasUnsafe(input || {});
    return clone({ hasWorkflow:hasWorkflow, hasEvidence:hasEvidence, hasAuditReview:hasAuditReview, safeToPreview:hasWorkflow && !blocked, blocked:blocked, redacted:true });
  }
  function buildSafeSessionExportSections(input) {
    const safe = input && typeof input === "object" ? input : {};
    const candidates = toArray(safe.topCandidates || safe.dryRunTopCandidates).slice(0, 3);
    const audit = safe.auditReviewSummary || safe.auditReview || safe.auditReviewCenter || {};
    return clone([
      { sectionId:"workflow_summary", title:"工作流摘要", rows:[row("workflowId", safe.workflowId || safe.workflowStateSummary && safe.workflowStateSummary.workflowId || "redacted"), row("currentStage", safe.currentStage || safe.workflowStageLabel || safe.continuitySummary && safe.continuitySummary.currentStage || ""), row("safety", "不包含付款、下单、出票链接")], redacted:true },
      { sectionId:"candidate_summary", title:"候选证据摘要", rows:[row("topCandidateCount", String(candidates.length || safe.topCandidateCount || 0)), row("selectedCandidate", safe.selectedCandidateSummary && safe.selectedCandidateSummary.line || safe.selectedCandidate && safe.selectedCandidate.providerName || "只读候选证据"), row("caveat", "平台最终为准，未锁价，不代表可出票")], redacted:true },
      { sectionId:"audit_summary", title:"安全审计摘要", rows:[row("result", audit.userFacingSummary && audit.userFacingSummary.resultLabel || audit.resultLabel || "安全检查通过"), row("credential", "不包含证件、银行卡、登录凭据或密钥"), row("links", "不包含付款、下单、出票链接")], redacted:true },
      { sectionId:"handoff_packet_preview", title:"最终安全交接包预览", rows:[row("finalReviewStatus", safe.finalReviewStatus || safe.finalSafeHandoffPacketSummary && safe.finalSafeHandoffPacketSummary.status || "仍需复核"), row("platform", "平台页面结果为准"), row("safety", "唯珊不会付款、不会下单、不会出票")], redacted:true }
    ]);
  }
  function buildFlightWorkflowSafeSessionExportPreview(input) {
    try {
      const readiness = evaluateSafeSessionExportReadiness(input || {});
      const status = readiness.blocked ? "blocked" : (readiness.safeToPreview ? "ready" : "not_ready");
      return sanitizeSafeSessionExportPreview({ previewName:PREVIEW_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION, status:status, exportType:"redacted_preview_only", canWriteFile:false, canDownload:false, sections:buildSafeSessionExportSections(input || {}), readiness:readiness, blockedReasons:readiness.blocked ? ["unsafe_input_blocked"] : (readiness.safeToPreview ? [] : ["workflow_required"]), safety:safety(), redacted:true });
    } catch (error) {
      return sanitizeSafeSessionExportPreview({ previewName:PREVIEW_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION, status:"failed_safe", exportType:"redacted_preview_only", canWriteFile:false, canDownload:false, sections:[], readiness:{ hasWorkflow:false, hasEvidence:false, hasAuditReview:false, safeToPreview:false }, blockedReasons:["failed_safe"], safety:safety(), redacted:true });
    }
  }
  function sanitizeSafeSessionExportPreview(preview) {
    const safe = stripUnsafe(preview && typeof preview === "object" ? preview : {}) || {};
    safe.previewName = PREVIEW_NAME;
    safe.appVersion = FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION;
    safe.exportType = "redacted_preview_only";
    safe.canWriteFile = false;
    safe.canDownload = false;
    safe.sections = toArray(safe.sections).map(stripUnsafe);
    safe.readiness = Object.assign({ hasWorkflow:false, hasEvidence:false, hasAuditReview:false, safeToPreview:false }, stripUnsafe(safe.readiness || {}));
    safe.blockedReasons = toArray(safe.blockedReasons).map(safeText);
    safe.safety = Object.assign(safety(), stripUnsafe(safe.safety || {}));
    safe.bookingUrl = null; safe.checkoutUrl = null; safe.paymentUrl = null; safe.orderUrl = null; safe.fileWrite = false; safe.download = false; safe.payment = false; safe.order = false; safe.ticketing = false; safe.identityUpload = false; safe.credentialInput = false; safe.rawResponseStored = false; safe.rawUserTextStored = false; safe.secretStored = false; safe.redacted = true;
    return clone(safe);
  }
  function buildFlightWorkflowSafeSessionExportPreviewAuditDraft(input) {
    const preview = buildFlightWorkflowSafeSessionExportPreview(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_AUDIT_DRAFT", previewName:PREVIEW_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION, status:preview.status, exportType:preview.exportType, sectionCount:preview.sections.length, canWriteFile:false, canDownload:false, fileWrite:false, download:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true });
  }

  window.WeishanFlightWorkflowSafeSessionExportPreview = { FLIGHT_WORKFLOW_SAFE_SESSION_EXPORT_PREVIEW_VERSION, PREVIEW_NAME, buildFlightWorkflowSafeSessionExportPreview, buildSafeSessionExportSections, evaluateSafeSessionExportReadiness, buildFlightWorkflowSafeSessionExportPreviewAuditDraft, sanitizeSafeSessionExportPreview };
})();
