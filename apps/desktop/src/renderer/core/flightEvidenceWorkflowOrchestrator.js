;(function () {
  "use strict";

  const FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION = "2.1.60";
  const ORCHESTRATOR_NAME = "flight_evidence_workflow_orchestrator_v1";
  const WORKFLOW_ID = "deterministic-flight-evidence-workflow-v2.1.60";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      if (/(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|safeProviderHandoffUrl|safeProviderHandoffHost|safeProviderHandoffDisplayHost|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i.test(name) && !allowedNullUrl) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function step(id, status) {
    const labels = { intent_normalized:"识别机票需求", session_created:"创建只读报价会话", sandbox_dry_run:"运行只读沙盒报价", top_candidates:"生成 Top 3 候选", decision_assistant:"生成推荐理由", report_center:"生成候选对比", confidence_label:"生成候选价置信标签", next_step_coach:"生成下一步安全建议", handoff_readiness:"准备平台确认" };
    return { id, label:labels[id] || id, status, redacted:true };
  }
  function skippedSteps() { return ["session_created", "sandbox_dry_run", "top_candidates", "decision_assistant", "report_center", "confidence_label", "next_step_coach", "handoff_readiness"].map(function (id) { return step(id, "skipped"); }); }
  function fallbackNormalize(input) { return { status:"not_flight", routeSummary:"", tripSummary:"", missingFields:[], clarificationQuestions:[], safety:{ dryRunAllowed:false, networkAllowed:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }; }

  function normalizeCandidate(candidate, index) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    return Object.assign({}, safe, { rank:safe.rank || index + 1, recommendationType:"candidate_evidence_only", safeProviderHandoffUrl:null, safeProviderHandoffDisplayHost:"", safeProviderHandoffHost:"", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true });
  }

  function buildFlightEvidenceWorkflow(input) {
    return runFlightEvidenceWorkflow(input);
  }

  function runFlightEvidenceWorkflow(input) {
    try {
      const safe = input && typeof input === "object" ? input : { rawText: input };
      const normalizer = window.WeishanFlightIntentNormalizer || {};
      const intent = typeof normalizer.normalizeFlightIntent === "function" ? normalizer.normalizeFlightIntent(safe) : fallbackNormalize(safe);
      if (intent.status === "blocked") {
        return sanitizeFlightEvidenceWorkflow({ orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:"blocked", workflowStatus:"blocked", flightIntentSummary:intent, routeSummary:intent.routeSummary || "", tripSummary:intent.tripSummary || "", clarificationQuestions:[], workflowSteps:[step("intent_normalized", "blocked")].concat(skippedSteps()), dryRunSummary:null, topCandidates:[], selectedCandidate:null, decisionAssistant:null, reportCenterSummary:null, confidenceLabelSummary:null, safeNextStepSummary:null, safeProviderHandoffReady:false, safety:{ dryRunRan:false, dryRunAllowed:false, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
      }
      if (intent.status === "needs_clarification" || intent.status === "not_flight") {
        return sanitizeFlightEvidenceWorkflow({ orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:intent.status, workflowStatus:intent.status, flightIntentSummary:intent, routeSummary:intent.routeSummary || "", tripSummary:intent.tripSummary || "", clarificationQuestions:intent.clarificationQuestions || [], workflowSteps:[step("intent_normalized", intent.status)].concat(skippedSteps()), dryRunSummary:null, topCandidates:[], selectedCandidate:null, decisionAssistant:null, reportCenterSummary:null, confidenceLabelSummary:null, safeNextStepSummary:null, safeProviderHandoffReady:false, safety:{ dryRunRan:false, dryRunAllowed:false, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
      }

      const dryRunApi = window.WeishanMultiProviderSandboxDryRunOrchestrator || {};
      const dryRun = typeof dryRunApi.runMultiProviderSandboxDryRun === "function" ? dryRunApi.runMultiProviderSandboxDryRun({ rawInput:intent.tripSummary, origin:intent.route.originCity, destination:intent.route.destinationCity, departureDate:intent.departureDate, directOnly:intent.directOnly, sortIntent:intent.sortIntent }, { persistToHistory:false }) : { status:"failed_safe", dryRunTopCandidates:[], selectedCandidate:null };
      const topCandidates = (Array.isArray(dryRun.dryRunTopCandidates) ? dryRun.dryRunTopCandidates : (Array.isArray(dryRun.topCandidates) ? dryRun.topCandidates : [])).slice(0, 3).map(normalizeCandidate);
      const selectedCandidate = normalizeCandidate(dryRun.selectedCandidate || topCandidates[0] || {}, 0);
      const decisionApi = window.WeishanReadOnlyQuoteDecisionAssistant || {};
      const reportApi = window.WeishanReadOnlyQuoteSessionReportCenter || {};
      const confidenceApi = window.WeishanReadOnlyCandidateConfidenceLabeler || {};
      const coachApi = window.WeishanReadOnlyQuoteSafeNextStepCoach || {};
      const workflowMeta = { flightIntentSummary:intent, routeSummary:intent.routeSummary, tripSummary:intent.tripSummary, workflowStatus:"ready" };
      const decisionAssistant = typeof decisionApi.buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi.buildReadOnlyQuoteDecisionAssistant(Object.assign({}, workflowMeta, { topCandidates, selectedCandidate, sessionSummary:dryRun.sessionSummary, runHistorySummary:dryRun.runHistorySummary, quoteDeltaSummary:dryRun.quoteDeltaSummary, replaySummary:dryRun.replaySummary })) : null;
      const confidenceLabelSummary = typeof confidenceApi.buildReadOnlyCandidateConfidenceLabel === "function" ? confidenceApi.buildReadOnlyCandidateConfidenceLabel({ selectedCandidate, safeProviderHandoffReady:selectedCandidate.safeProviderHandoffReady === true, reconciliationSummary:{ status:"needs_platform_check", confidenceLabel:"不可确认", nextStep:"前往平台确认", redacted:true } }) : null;
      const safeNextStepSummary = typeof coachApi.buildReadOnlyQuoteSafeNextStepCoach === "function" ? coachApi.buildReadOnlyQuoteSafeNextStepCoach({ selectedCandidate, confidenceLabelSummary, reconciliationSummary:{ status:"needs_platform_check", confidenceLabel:"不可确认", nextStep:"前往平台确认", redacted:true } }) : null;
      const reportCenterSummary = typeof reportApi.buildReadOnlyQuoteSessionReportCenter === "function" ? reportApi.buildReadOnlyQuoteSessionReportCenter(Object.assign({}, workflowMeta, { topCandidates, selectedCandidate, sessionSummary:dryRun.sessionSummary, auditExportPreview:dryRun.auditExportPreview, runHistorySummary:dryRun.runHistorySummary, quoteDeltaSummary:dryRun.quoteDeltaSummary, replaySummary:dryRun.replaySummary, decisionAssistant, confidenceLabelSummary, safeNextStepSummary })) : null;
      const workflowSteps = ["intent_normalized", "session_created", "sandbox_dry_run", "top_candidates", "decision_assistant", "report_center", "confidence_label", "next_step_coach", "handoff_readiness"].map(function (id) { return step(id, "completed"); });
      return sanitizeFlightEvidenceWorkflow({ orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:"ready", workflowStatus:"ready", flightIntentSummary:intent, routeSummary:intent.routeSummary, tripSummary:intent.tripSummary, clarificationQuestions:[], workflowSteps, dryRunSummary:stripUnsafe(dryRun), topCandidates, selectedCandidate, decisionAssistant, reportCenterSummary, confidenceLabelSummary, safeNextStepSummary, safeProviderHandoffReady:selectedCandidate.safeProviderHandoffReady === true, handoffReadiness:{ status:selectedCandidate.safeProviderHandoffReady === true ? "confirmation_required" : "blocked", requiresUserConfirmation:true, autoOpen:false, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }, safety:{ dryRunRan:true, dryRunAllowed:true, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
    } catch (error) {
      return sanitizeFlightEvidenceWorkflow({ orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:"failed_safe", workflowStatus:"failed_safe", flightIntentSummary:null, routeSummary:"", tripSummary:"", clarificationQuestions:[], workflowSteps:[step("intent_normalized", "failed_safe")].concat(skippedSteps()), topCandidates:[], selectedCandidate:null, safety:{ dryRunRan:false, dryRunAllowed:false, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
    }
  }

  function buildFlightEvidenceWorkflowSummary(input) {
    const workflow = input && input.orchestratorName === ORCHESTRATOR_NAME ? input : runFlightEvidenceWorkflow(input);
    return clone({ title:"机票请求工作流", status:workflow.status, workflowStatus:workflow.workflowStatus, routeSummary:workflow.routeSummary || "", tripSummary:workflow.tripSummary || "", flightIntentSummary:workflow.flightIntentSummary || null, workflowSteps:workflow.workflowSteps || [], topCandidateCount:(workflow.topCandidates || []).length, selectedCandidateRank:workflow.selectedCandidate && workflow.selectedCandidate.rank || null, selectedCandidateProvider:workflow.selectedCandidate && workflow.selectedCandidate.providerName || "", decisionAvailable:!!workflow.decisionAssistant, confidenceLabel:workflow.confidenceLabelSummary && workflow.confidenceLabelSummary.confidenceLabel || "不可确认", nextStep:workflow.safeNextStepSummary && workflow.safeNextStepSummary.recommendation || "前往平台确认", clarificationQuestions:workflow.clarificationQuestions || [], safeProviderHandoffReady:workflow.safeProviderHandoffReady === true, platformFinal:true, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function buildFlightEvidenceWorkflowAuditDraft(input) {
    const workflow = input && input.orchestratorName === ORCHESTRATOR_NAME ? input : runFlightEvidenceWorkflow(input);
    return clone({ eventType:"FLIGHT_EVIDENCE_WORKFLOW_AUDIT_DRAFT", orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:workflow.status, workflowStatus:workflow.workflowStatus, routeSummary:workflow.routeSummary || "", tripSummary:workflow.tripSummary || "", stepCount:(workflow.workflowSteps || []).length, topCandidateCount:(workflow.topCandidates || []).length, dryRunRan:workflow.safety && workflow.safety.dryRunRan === true, networkAllowed:false, rawResponseStored:false, secretStored:false, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function sanitizeFlightEvidenceWorkflow(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.rawResponseStored = false;
    safe.secretStored = false;
    safe.redacted = true;
    return clone(safe);
  }

  window.WeishanFlightEvidenceWorkflowOrchestrator = { FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, ORCHESTRATOR_NAME, WORKFLOW_ID, buildFlightEvidenceWorkflow, runFlightEvidenceWorkflow, buildFlightEvidenceWorkflowSummary, buildFlightEvidenceWorkflowAuditDraft, sanitizeFlightEvidenceWorkflow };
})();
