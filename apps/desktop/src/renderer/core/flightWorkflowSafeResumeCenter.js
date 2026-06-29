;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_VERSION = "2.2.5";
  const CENTER_NAME = "flight_workflow_safe_resume_center_v1";
  const FORBIDDEN_RE = /https?:\/\/\S+|token|key|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_RE, "redacted"); }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalse = /(Stored|Included|Allowed|Enabled)$/.test(name) && raw === false;
      if (/(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, autoResume:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function recoveryOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.recoverySummary) return safe.recoverySummary;
    if (safe.recoveryState) return { status:"loaded", state:safe.recoveryState };
    if (safe.loadedRecovery) return safe.loadedRecovery;
    const api = window.WeishanFlightWorkflowRecoveryStore || {};
    if (safe.storageLike && typeof api.loadFlightWorkflowRecoveryState === "function") return api.loadFlightWorkflowRecoveryState(safe.storageLike);
    return null;
  }
  function continuityOf(state) {
    const api = window.WeishanFlightWorkflowContinuityManager || {};
    return typeof api.buildFlightWorkflowContinuity === "function" ? api.buildFlightWorkflowContinuity(state || {}) : stripUnsafe(state || {});
  }
  function evaluateFlightWorkflowResumeAvailability(input) {
    try {
      const recovery = recoveryOf(input || {});
      if (!recovery) return "unavailable";
      if (recovery.reason === "corrupted_storage" || recovery.status === "failed_safe") return "failed_safe";
      const state = recovery.state || recovery;
      const continuity = continuityOf(state);
      if (continuity.status === "blocked") return "blocked";
      if (recovery.status === "empty" || recovery.reason === "empty" || !state) return "unavailable";
      return "available";
    } catch (error) { return "failed_safe"; }
  }
  function buildFlightWorkflowResumePreview(input) {
    const recovery = recoveryOf(input || {});
    const state = recovery && (recovery.state || recovery) || {};
    const continuity = continuityOf(state);
    return clone({ workflowId:safeText(continuity.workflowId || state.workflowId || ""), currentStage:safeText(continuity.currentStage || state.currentStage || ""), stageLabel:safeText(continuity.stageLabel || state.stageLabel || ""), nextStepLabel:safeText(continuity.resumePlan && continuity.resumePlan.nextStepLabel || state.nextStepLabel || ""), selectedCandidateSummary:stripUnsafe(state.selectedCandidateSummary || state.selectedCandidate || null), platformCheckSummary:stripUnsafe(state.platformCheckSummary || state.manualPlatformCheckSummary || null), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }
  function buildFlightWorkflowSafeResumeCenter(input) {
    try {
      const availability = evaluateFlightWorkflowResumeAvailability(input || {});
      const preview = availability === "available" || availability === "blocked" ? buildFlightWorkflowResumePreview(input || {}) : null;
      return clone({ centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_VERSION, title:"恢复上次机票工作流", status:availability, resumeSource:"local_redacted_workflow_state", resumePreview:preview, actions:{ canResume:availability === "available", canClear:true, autoResume:false, autoOpen:false }, actionExecutionResult:stripUnsafe((input || {}).actionExecutionResult || null), actionPolicyDecision:stripUnsafe((input || {}).actionPolicyDecision || null), eventLedgerSummary:stripUnsafe((input || {}).eventLedgerSummary || null), lastActionId:safeText((input || {}).lastActionId || (input || {}).eventLedgerSummary && (input || {}).eventLedgerSummary.lastActionId || ""), lastActionStatus:safeText((input || {}).lastActionStatus || (input || {}).eventLedgerSummary && (input || {}).eventLedgerSummary.lastActionStatus || ""), lastActionMessage:safeText((input || {}).lastActionMessage || (input || {}).eventLedgerSummary && (input || {}).eventLedgerSummary.lastActionMessage || ""), safety:safety(), redacted:true });
    } catch (error) {
      return clone({ centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_VERSION, status:"failed_safe", resumeSource:"local_redacted_workflow_state", resumePreview:null, actions:{ canResume:false, canClear:true, autoResume:false, autoOpen:false }, safety:safety(), redacted:true });
    }
  }
  function buildFlightWorkflowSafeResumeCenterAuditDraft(input) {
    const center = buildFlightWorkflowSafeResumeCenter(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_AUDIT_DRAFT", centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_VERSION, status:center.status, canResume:center.actions.canResume === true, lastActionId:center.lastActionId || "", lastActionStatus:center.lastActionStatus || "", lastActionMessage:center.lastActionMessage || "", eventLedgerSummary:center.eventLedgerSummary || null, autoResume:false, autoOpen:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true });
  }
  window.WeishanFlightWorkflowSafeResumeCenter = { FLIGHT_WORKFLOW_SAFE_RESUME_CENTER_VERSION, CENTER_NAME, buildFlightWorkflowSafeResumeCenter, evaluateFlightWorkflowResumeAvailability, buildFlightWorkflowResumePreview, buildFlightWorkflowSafeResumeCenterAuditDraft };
})();
