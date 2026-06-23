;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION = "2.1.62";
  const CONTINUITY_NAME = "flight_workflow_continuity_manager_v1";
  const DEFAULT_WORKFLOW_ID = "deterministic-flight-workflow-continuity-v2.1.62";
  const FORBIDDEN_NAME_RE = /(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|key|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }

  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalse = /(Stored|Included|Allowed|Enabled)$/.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }

  function safety() {
    return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true };
  }

  function stateOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    return safe.workflowStateSummary || safe.workflowState || safe.state || {};
  }

  function intentOf(input, state) {
    const safe = input && typeof input === "object" ? input : {};
    return safe.flightIntentSummary || (state && state.intent) || safe.intent || {};
  }

  function routeOf(intent, state) {
    const route = intent && intent.route || state && state.route || {};
    return { originCity:safeText(route.originCity || intent.origin || ""), destinationCity:safeText(route.destinationCity || intent.destination || "") };
  }

  function collectedSummaryFor(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.collectedSummary && typeof safe.collectedSummary === "object") return Object.assign({ routeReady:false, dateReady:false, directPreferenceReady:false, sortIntentReady:false, selectedCandidateReady:false, handoffReceiptReady:false, platformCheckReady:false }, stripUnsafe(safe.collectedSummary));
    const state = stateOf(safe);
    const intent = intentOf(safe, state);
    const route = routeOf(intent, state);
    const selected = safe.selectedCandidate || state.selectedCandidate || safe.selectedCandidateSummary || null;
    const handoff = safe.handoffReceiptSummary || safe.handoffReceipt || safe.providerHandoffReceipt || null;
    const platformCheck = safe.platformCheckSummary || safe.manualPlatformCheckSummary || safe.manualPlatformCheckEvidence || null;
    return {
      routeReady:!!(route.originCity && route.destinationCity),
      dateReady:!!(intent.departureDate || state.departureDate),
      directPreferenceReady:typeof intent.directOnly === "boolean" || typeof state.directOnly === "boolean",
      sortIntentReady:!!(intent.sortIntent || state.sortIntent),
      selectedCandidateReady:!!selected,
      handoffReceiptReady:!!handoff,
      platformCheckReady:!!platformCheck
    };
  }

  function missingFieldsFor(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (Array.isArray(safe.missingFields)) return safe.missingFields.map(safeText);
    if (safe.workflowStateSummary && Array.isArray(safe.workflowStateSummary.missingFields)) return safe.workflowStateSummary.missingFields.map(safeText);
    const explicit = toArray(safe.missingFields || safe.workflowStateSummary && safe.workflowStateSummary.missingFields);
    if (explicit.length) return explicit.map(safeText);
    const state = stateOf(safe);
    const intent = intentOf(safe, state);
    const route = routeOf(intent, state);
    const missing = [];
    if (!route.originCity) missing.push("origin");
    if (!route.destinationCity) missing.push("destination");
    if (!(intent.departureDate || state.departureDate)) missing.push("departureDate");
    return missing;
  }

  function hasTopCandidates(input) {
    const safe = input && typeof input === "object" ? input : {};
    return toArray(safe.topCandidates).length > 0 || toArray(safe.dryRunTopCandidates).length > 0 || Number(safe.topCandidateCount || 0) > 0 || Number(safe.evidenceSummary && safe.evidenceSummary.topCandidateCount || 0) > 0;
  }

  function stageFromStatus(status) {
    if (status === "needs_clarification") return "clarification";
    if (status === "evidence_ready") return "evidence";
    if (status === "awaiting_platform_check") return "platform_check";
    if (status === "completed_read_only") return "reconciliation";
    if (status === "blocked") return "blocked";
    return "decision";
  }

  function stageLabel(stage) {
    const labels = { intent:"识别机票需求", clarification:"补充缺失信息", evidence:"候选证据已生成", decision:"选择候选", handoff:"确认前往平台", platform_check:"记录平台核对结果", reconciliation:"只读流程完成", blocked:"安全阻断" };
    return labels[stage] || "识别机票需求";
  }

  function evaluateFlightWorkflowContinuityState(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return "failed_safe";
      const safe = input;
      const state = stateOf(safe);
      const status = safe.status || safe.workflowStatus || state.status || safe.flightIntentSummary && safe.flightIntentSummary.status || "";
      if (status === "blocked" || safe.restrictedCategory === true) return "blocked";
      const collected = collectedSummaryFor(safe);
      const missing = missingFieldsFor(safe);
      if (!collected.routeReady || !collected.dateReady || missing.length) return "needs_clarification";
      if (collected.platformCheckReady && (safe.reconciliationSummary || safe.platformCheckOutcomeSummary || safe.status === "completed_read_only")) return "completed_read_only";
      if (collected.handoffReceiptReady && !collected.platformCheckReady) return "awaiting_platform_check";
      if (collected.selectedCandidateReady && !collected.handoffReceiptReady) return "resumable";
      if (hasTopCandidates(safe)) return "evidence_ready";
      return "resumable";
    } catch (error) {
      return "failed_safe";
    }
  }

  function buildFlightWorkflowResumePlan(input) {
    const status = typeof input === "string" ? input : evaluateFlightWorkflowContinuityState(input || {});
    const map = {
      needs_clarification:{ nextStepId:"clarification", nextStepLabel:"补充缺失信息", primaryActionLabel:"补充信息", secondaryActionLabels:["复制搜索条件"], canResume:true },
      evidence_ready:{ nextStepId:"select_candidate", nextStepLabel:"选择候选", primaryActionLabel:"选择候选", secondaryActionLabels:["重新运行只读报价"], canResume:true },
      resumable:{ nextStepId:"provider_handoff", nextStepLabel:"确认前往平台", primaryActionLabel:"去平台确认", secondaryActionLabels:["记录平台核对结果"], canResume:true },
      awaiting_platform_check:{ nextStepId:"platform_check", nextStepLabel:"记录平台核对结果", primaryActionLabel:"记录平台核对结果", secondaryActionLabels:["重新核对平台页面"], canResume:true },
      completed_read_only:{ nextStepId:"none", nextStepLabel:"只读流程完成", primaryActionLabel:"查看只读证据", secondaryActionLabels:["重新运行只读报价"], canResume:false },
      blocked:{ nextStepId:"blocked", nextStepLabel:"安全阻断", primaryActionLabel:"不可继续", secondaryActionLabels:[], canResume:false },
      failed_safe:{ nextStepId:"failed_safe", nextStepLabel:"安全降级", primaryActionLabel:"不可继续", secondaryActionLabels:[], canResume:false }
    };
    return clone(Object.assign({ canResume:false, nextStepId:"failed_safe", nextStepLabel:"安全降级", primaryActionLabel:"不可继续", secondaryActionLabels:[] }, map[status] || map.failed_safe));
  }

  function buildFlightWorkflowContinuity(input) {
    try {
      const safe = input && typeof input === "object" ? input : {};
      const status = evaluateFlightWorkflowContinuityState(safe);
      const currentStage = stageFromStatus(status);
      const resumePlan = buildFlightWorkflowResumePlan(status);
      return sanitizeFlightWorkflowContinuity({
        continuityName:CONTINUITY_NAME,
        appVersion:FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION,
        status:status,
        workflowId:safe.workflowId || safe.workflowStateSummary && safe.workflowStateSummary.workflowId || DEFAULT_WORKFLOW_ID,
        currentStage:currentStage,
        stageLabel:stageLabel(currentStage),
        collectedSummary:collectedSummaryFor(safe),
        missingFields:missingFieldsFor(safe),
        resumePlan:resumePlan,
        selectedCandidateSummary:stripUnsafe(safe.selectedCandidateSummary || safe.selectedCandidate || null),
        handoffReceiptSummary:stripUnsafe(safe.handoffReceiptSummary || safe.handoffReceipt || null),
        platformCheckSummary:stripUnsafe(safe.platformCheckSummary || safe.manualPlatformCheckSummary || safe.manualPlatformCheckEvidence || null),
        reconciliationSummary:stripUnsafe(safe.reconciliationSummary || null),
        safety:safety(),
        redacted:true
      });
    } catch (error) {
      return sanitizeFlightWorkflowContinuity({ continuityName:CONTINUITY_NAME, appVersion:FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION, status:"failed_safe", workflowId:DEFAULT_WORKFLOW_ID, currentStage:"blocked", stageLabel:"安全降级", collectedSummary:{}, missingFields:[], resumePlan:buildFlightWorkflowResumePlan("failed_safe"), safety:safety(), redacted:true });
    }
  }

  function sanitizeFlightWorkflowContinuity(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    safe.continuityName = CONTINUITY_NAME;
    safe.appVersion = FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION;
    safe.workflowId = safe.workflowId || DEFAULT_WORKFLOW_ID;
    safe.safety = Object.assign(safety(), stripUnsafe(safe.safety || {}));
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.rawResponseStored = false;
    safe.secretStored = false;
    safe.redacted = true;
    return clone(safe);
  }

  function buildFlightWorkflowContinuityAuditDraft(input) {
    const continuity = buildFlightWorkflowContinuity(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_CONTINUITY_AUDIT_DRAFT", continuityName:CONTINUITY_NAME, appVersion:FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION, status:continuity.status, currentStage:continuity.currentStage, nextStepId:continuity.resumePlan && continuity.resumePlan.nextStepId || "", canResume:continuity.resumePlan && continuity.resumePlan.canResume === true, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
  }

  window.WeishanFlightWorkflowContinuityManager = { FLIGHT_WORKFLOW_CONTINUITY_MANAGER_VERSION, CONTINUITY_NAME, buildFlightWorkflowContinuity, evaluateFlightWorkflowContinuityState, buildFlightWorkflowResumePlan, sanitizeFlightWorkflowContinuity, buildFlightWorkflowContinuityAuditDraft };
})();
