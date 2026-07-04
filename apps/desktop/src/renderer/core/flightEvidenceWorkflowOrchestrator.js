;(function () {
  "use strict";

  const FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION = "4.1.8";
  const ORCHESTRATOR_NAME = "flight_evidence_workflow_orchestrator_v1";
  const WORKFLOW_ID = "deterministic-flight-evidence-workflow-v2.4.1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? text(value).replace(/https?:\/\/\S+|token|key|secret|password/ig, "redacted") : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalseStored = /(Stored|Included)$/.test(name) && raw === false;
      if (/(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|safeProviderHandoffUrl|safeProviderHandoffHost|safeProviderHandoffDisplayHost|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i.test(name) && !allowedNullUrl && !allowedFalseStored) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function baseSafety(extra) { return Object.assign({ dryRunRan:false, dryRunAllowed:false, networkAllowed:false, booking:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, autoOpen:false, redacted:true }, stripUnsafe(extra || {})); }
  function step(id, status) {
    const labels = { intent_normalized:"识别机票需求", clarification:"补充缺失信息", session_created:"创建只读报价会话", sandbox_dry_run:"运行只读沙盒报价", evidence:"生成候选证据", top_candidates:"生成 Top 3 候选", decision_assistant:"生成推荐理由", report_center:"生成候选对比", confidence_label:"生成候选价置信标签", next_step_coach:"生成下一步安全建议", handoff_readiness:"准备平台确认" };
    return { id, label:labels[id] || id, status, redacted:true };
  }
  function skippedEvidenceSteps() { return ["session_created", "sandbox_dry_run", "evidence", "top_candidates", "decision_assistant", "report_center", "confidence_label", "next_step_coach", "handoff_readiness"].map(function (id) { return step(id, "skipped"); }); }
  function normalizeCandidate(candidate, index) {
    const safe = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
    return Object.assign({}, safe, { rank:safe.rank || safe.selectedRank || index + 1, recommendationType:"candidate_evidence_only", safeProviderHandoffUrl:null, safeProviderHandoffDisplayHost:"", safeProviderHandoffHost:"", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true });
  }
  function normalizeIntentInput(input) {
    const safe = input && typeof input === "object" ? input : { rawText:input };
    if (safe.workflowState && safe.workflowState.intent) return safe.workflowState.intent;
    if (safe.state && safe.state.intent) return safe.state.intent;
    if (safe.flightIntentSummary) return safe.flightIntentSummary;
    const normalizer = window.WeishanFlightIntentNormalizer || {};
    return typeof normalizer.normalizeFlightIntent === "function" ? normalizer.normalizeFlightIntent(safe) : { status:"not_flight", missingFields:[], clarificationQuestions:[], safety:{ dryRunAllowed:false, redacted:true }, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true };
  }
  function buildState(intent, status, evidenceSummary, selectedCandidate) {
    const stateApi = window.WeishanFlightWorkflowStateMachine || {};
    if (typeof stateApi.createFlightWorkflowState !== "function") return { status:status || intent.status || "failed_safe", intent:intent, evidenceSummary:evidenceSummary || null, selectedCandidate:selectedCandidate || null, missingFields:intent.missingFields || [], clarificationQuestions:intent.clarificationQuestions || [], redacted:true };
    let state = stateApi.createFlightWorkflowState({ intent:intent });
    if (status === "evidence_ready") state = stateApi.reduceFlightWorkflowEvent(state, { type:"EVIDENCE_READY", evidenceSummary:evidenceSummary || null, selectedCandidate:selectedCandidate || null });
    if (status === "provider_confirmation_ready") state = stateApi.reduceFlightWorkflowEvent(state, { type:"CANDIDATE_SELECTED", selectedCandidate:selectedCandidate || null });
    return state;
  }
  function clarificationFor(intent) {
    const loop = window.WeishanFlightClarificationLoop || {};
    return typeof loop.buildFlightClarificationPrompt === "function" ? loop.buildFlightClarificationPrompt(intent || {}) : { status:"needs_answer", missingFields:intent && intent.missingFields || [], questions:intent && intent.clarificationQuestions || [], safety:{ asksIdentity:false, asksPayment:false, asksCredential:false, redacted:true }, redacted:true };
  }
  function maybeMergeClarification(intent, input) {
    const safe = input && typeof input === "object" ? input : {};
    const answer = safe.clarificationAnswer || safe.answer || null;
    if (!answer) return { intent:intent, clarificationSummary:clarificationFor(intent) };
    const loop = window.WeishanFlightClarificationLoop || {};
    if (typeof loop.mergeFlightClarificationAnswer !== "function") return { intent:intent, clarificationSummary:clarificationFor(intent) };
    const merged = loop.mergeFlightClarificationAnswer(intent || {}, answer);
    return { intent:merged.mergedIntent || intent, clarificationSummary:merged };
  }
  function buildWorkflowStateSummary(state) {
    const stateApi = window.WeishanFlightWorkflowStateMachine || {};
    return typeof stateApi.buildFlightWorkflowStateSummary === "function" ? stateApi.buildFlightWorkflowStateSummary(state || {}) : stripUnsafe(state || {});
  }
  function persistState(state, input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.persistWorkflowState !== true) return null;
    const storeApi = window.WeishanFlightWorkflowStateStore || {};
    return typeof storeApi.saveFlightWorkflowState === "function" ? storeApi.saveFlightWorkflowState(state || {}, safe.storageLike || null) : null;
  }


  function continuityInputFor(workflow, input) {
    const safe = input && typeof input === "object" ? input : {};
    return Object.assign({}, safe, workflow || {}, {
      workflowStateSummary:workflow && workflow.workflowStateSummary || safe.workflowStateSummary || null,
      selectedCandidate:workflow && workflow.selectedCandidate || safe.selectedCandidate || null,
      topCandidates:workflow && workflow.topCandidates || safe.topCandidates || [],
      handoffReceiptSummary:workflow && workflow.handoffReceiptSummary || safe.handoffReceiptSummary || safe.handoffReceipt || null,
      manualPlatformCheckSummary:workflow && workflow.manualPlatformCheckSummary || safe.manualPlatformCheckSummary || safe.manualPlatformCheckEvidence || null,
      reconciliationSummary:workflow && workflow.reconciliationSummary || safe.reconciliationSummary || null
    });
  }

  function enrichFlightEvidenceWorkflow(workflow, input) {
    const base = workflow && typeof workflow === "object" ? workflow : {};
    const continuityInput = continuityInputFor(base, input);
    const continuityApi = window.WeishanFlightWorkflowContinuityManager || {};
    const confirmationApi = window.WeishanUserConfirmationStatePanel || {};
    const recoveryApi = window.WeishanFlightWorkflowRecoveryStore || {};
    const resumeApi = window.WeishanFlightWorkflowResumeCoach || {};
    const actionApi = window.WeishanFlightWorkflowActionQueue || {};
    const timelineApi = window.WeishanFlightWorkflowProgressTimeline || {};
    const resumeCenterApi = window.WeishanFlightWorkflowSafeResumeCenter || {};
    const continuitySummary = typeof continuityApi.buildFlightWorkflowContinuity === "function" ? continuityApi.buildFlightWorkflowContinuity(continuityInput) : null;
    const confirmationStateSummary = typeof confirmationApi.buildUserConfirmationStatePanel === "function" ? confirmationApi.buildUserConfirmationStatePanel(continuityInput) : null;
    const recoverySummary = typeof recoveryApi.sanitizeFlightWorkflowRecoveryState === "function" ? recoveryApi.sanitizeFlightWorkflowRecoveryState(Object.assign({}, continuityInput, { continuitySummary:continuitySummary })) : null;
    const resumeCoachSummary = typeof resumeApi.buildFlightWorkflowResumeCoach === "function" ? resumeApi.buildFlightWorkflowResumeCoach({ continuitySummary:continuitySummary, confirmationStateSummary:confirmationStateSummary, recoverySummary:recoverySummary }) : null;
    const actionQueueSummary = typeof actionApi.buildFlightWorkflowActionQueue === "function" ? actionApi.buildFlightWorkflowActionQueue(Object.assign({}, continuityInput, { continuitySummary:continuitySummary, confirmationStateSummary:confirmationStateSummary, recoverySummary:recoverySummary, resumeCoachSummary:resumeCoachSummary })) : null;
    const progressTimelineSummary = typeof timelineApi.buildFlightWorkflowProgressTimeline === "function" ? timelineApi.buildFlightWorkflowProgressTimeline(Object.assign({}, continuityInput, { continuitySummary:continuitySummary })) : null;
    const safeResumeCenterSummary = typeof resumeCenterApi.buildFlightWorkflowSafeResumeCenter === "function" ? resumeCenterApi.buildFlightWorkflowSafeResumeCenter({ recoverySummary:recoverySummary, continuitySummary:continuitySummary }) : null;
    const blockedActions = actionQueueSummary && Array.isArray(actionQueueSummary.blockedActions) ? actionQueueSummary.blockedActions : [];
    const enabledAction = actionQueueSummary && Array.isArray(actionQueueSummary.actions) ? actionQueueSummary.actions.find(function (action) { return action.enabled === true; }) : null;
    const resumeActions = resumeCoachSummary && Array.isArray(resumeCoachSummary.allowedActions) ? resumeCoachSummary.allowedActions : [];
    return sanitizeFlightEvidenceWorkflow(Object.assign({}, base, {
      continuitySummary:continuitySummary,
      confirmationStateSummary:confirmationStateSummary,
      recoverySummary:recoverySummary,
      resumeCoachSummary:resumeCoachSummary,
      actionQueueSummary:actionQueueSummary,
      progressTimelineSummary:progressTimelineSummary,
      safeResumeCenterSummary:safeResumeCenterSummary,
      blockedActions:blockedActions,
      currentActionLabel:enabledAction && enabledAction.label || "",
      nextSafeActionLabel:enabledAction && enabledAction.label || continuitySummary && continuitySummary.resumePlan && continuitySummary.resumePlan.nextStepLabel || "",
      currentStage:continuitySummary && continuitySummary.currentStage || base.currentStage || "",
      workflowStageLabel:continuitySummary && continuitySummary.stageLabel || base.workflowStageLabel || "",
      nextStepLabel:continuitySummary && continuitySummary.resumePlan && continuitySummary.resumePlan.nextStepLabel || base.nextStepLabel || "",
      canResumeWorkflow:!!(continuitySummary && continuitySummary.resumePlan && continuitySummary.resumePlan.canResume === true),
      resumeActions:resumeActions
    }));
  }

  function buildFlightEvidenceWorkflow(input) { return runFlightEvidenceWorkflow(input); }

  function runFlightEvidenceWorkflow(input) {
    try {
      const safe = input && typeof input === "object" ? input : { rawText: input };
      const normalized = maybeMergeClarification(normalizeIntentInput(safe), safe);
      const intent = normalized.intent || {};
      const clarificationSummary = normalized.clarificationSummary || clarificationFor(intent);
      if (intent.status === "blocked") {
        const state = buildState(intent, "blocked", null, null);
        const workflowStateSummary = buildWorkflowStateSummary(state);
        const uiApi = window.WeishanFlightWorkflowUiPresenter || {};
        const uiPresenter = typeof uiApi.buildFlightWorkflowUiPresenter === "function" ? uiApi.buildFlightWorkflowUiPresenter({ workflowStateSummary:workflowStateSummary, clarificationQuestions:[] }) : null;
        return enrichFlightEvidenceWorkflow({ orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:"blocked", workflowStatus:"blocked", flightIntentSummary:intent, workflowStateSummary:workflowStateSummary, clarificationSummary:clarificationSummary, workflowStepList:uiPresenter && uiPresenter.stepList || [], workflowUserMessage:uiPresenter && uiPresenter.userMessage || "已安全阻断。", routeSummary:intent.routeSummary || "", tripSummary:intent.tripSummary || "", missingFields:[], clarificationQuestions:[], workflowSteps:[step("intent_normalized", "blocked"), step("clarification", "skipped")].concat(skippedEvidenceSteps()), topCandidates:[], selectedCandidate:null, safety:baseSafety({ dryRunRan:false, dryRunAllowed:false }), persistedWorkflowState:persistState(state, safe), bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }, safe);
      }
      const missing = Array.isArray(intent.missingFields) ? intent.missingFields : [];
      if (intent.status === "needs_clarification" || missing.length || intent.status === "not_flight") {
        const state = buildState(intent, "needs_clarification", null, null);
        const workflowStateSummary = buildWorkflowStateSummary(state);
        const questions = clarificationSummary.questions || intent.clarificationQuestions || [];
        const uiApi = window.WeishanFlightWorkflowUiPresenter || {};
        const uiPresenter = typeof uiApi.buildFlightWorkflowUiPresenter === "function" ? uiApi.buildFlightWorkflowUiPresenter({ workflowStateSummary:workflowStateSummary, clarificationQuestions:questions }) : null;
        return enrichFlightEvidenceWorkflow({ orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:intent.status === "not_flight" ? "not_flight" : "needs_clarification", workflowStatus:intent.status === "not_flight" ? "not_flight" : "needs_clarification", flightIntentSummary:intent, workflowStateSummary:workflowStateSummary, clarificationSummary:clarificationSummary, workflowStepList:uiPresenter && uiPresenter.stepList || [], workflowUserMessage:uiPresenter && uiPresenter.userMessage || "需要补充信息。信息完整后再生成候选证据。", routeSummary:intent.routeSummary || "", tripSummary:intent.tripSummary || "", missingFields:missing, clarificationQuestions:questions, workflowSteps:[step("intent_normalized", "completed"), step("clarification", "pending")].concat(skippedEvidenceSteps()), topCandidates:[], selectedCandidate:null, safety:baseSafety({ dryRunRan:false, dryRunAllowed:false }), persistedWorkflowState:persistState(state, safe), bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }, safe);
      }

      const readyState = buildState(intent, "ready_for_evidence", null, null);
      const dryRunApi = window.WeishanMultiProviderSandboxDryRunOrchestrator || {};
      const dryRun = typeof dryRunApi.runMultiProviderSandboxDryRun === "function" ? dryRunApi.runMultiProviderSandboxDryRun({ rawInput:intent.tripSummary, origin:intent.route && intent.route.originCity, destination:intent.route && intent.route.destinationCity, departureDate:intent.departureDate, directOnly:intent.directOnly, sortIntent:intent.sortIntent }, { persistToHistory:false }) : { status:"failed_safe", dryRunTopCandidates:[], selectedCandidate:null };
      const topCandidates = (Array.isArray(dryRun.dryRunTopCandidates) ? dryRun.dryRunTopCandidates : (Array.isArray(dryRun.topCandidates) ? dryRun.topCandidates : [])).slice(0, 3).map(normalizeCandidate);
      const selectedCandidate = normalizeCandidate(dryRun.selectedCandidate || topCandidates[0] || {}, 0);
      const workflowState = buildState(intent, selectedCandidate && selectedCandidate.rank ? "provider_confirmation_ready" : "evidence_ready", { topCandidateCount:topCandidates.length, platformFinal:true, redacted:true }, selectedCandidate);
      const workflowStateSummary = buildWorkflowStateSummary(workflowState);
      const workflowMeta = { flightIntentSummary:intent, workflowStateSummary:workflowStateSummary, clarificationSummary:clarificationSummary, workflowStatus:"evidence_ready", routeSummary:intent.routeSummary, tripSummary:intent.tripSummary, missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。" };
      const decisionApi = window.WeishanReadOnlyQuoteDecisionAssistant || {};
      const reportApi = window.WeishanReadOnlyQuoteSessionReportCenter || {};
      const confidenceApi = window.WeishanReadOnlyCandidateConfidenceLabeler || {};
      const coachApi = window.WeishanReadOnlyQuoteSafeNextStepCoach || {};
      const uiApi = window.WeishanFlightWorkflowUiPresenter || {};
      const uiPresenter = typeof uiApi.buildFlightWorkflowUiPresenter === "function" ? uiApi.buildFlightWorkflowUiPresenter({ workflowStateSummary:workflowStateSummary, clarificationQuestions:[] }) : null;
      const workflowStepList = uiPresenter && uiPresenter.stepList || [];
      const workflowSteps = [step("intent_normalized", "completed"), step("clarification", "completed"), step("session_created", "completed"), step("sandbox_dry_run", "completed"), step("evidence", "completed"), step("top_candidates", "completed"), step("decision_assistant", "completed"), step("report_center", "completed"), step("confidence_label", "completed"), step("next_step_coach", "completed"), step("handoff_readiness", "completed")];
      const workflowContinuitySeed = enrichFlightEvidenceWorkflow(Object.assign({}, workflowMeta, { workflowStepList:workflowStepList, topCandidates, selectedCandidate }), safe);
      const workflowContinuityFields = { continuitySummary:workflowContinuitySeed.continuitySummary || null, confirmationStateSummary:workflowContinuitySeed.confirmationStateSummary || null, recoverySummary:workflowContinuitySeed.recoverySummary || null, resumeCoachSummary:workflowContinuitySeed.resumeCoachSummary || null, currentStage:workflowContinuitySeed.currentStage || "", workflowStageLabel:workflowContinuitySeed.workflowStageLabel || "", nextStepLabel:workflowContinuitySeed.nextStepLabel || "", canResumeWorkflow:workflowContinuitySeed.canResumeWorkflow === true, resumeActions:workflowContinuitySeed.resumeActions || [] };
      const decisionAssistant = typeof decisionApi.buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi.buildReadOnlyQuoteDecisionAssistant(Object.assign({}, workflowMeta, workflowContinuityFields, { workflowStepList:workflowStepList, topCandidates, selectedCandidate, sessionSummary:dryRun.sessionSummary, runHistorySummary:dryRun.runHistorySummary, quoteDeltaSummary:dryRun.quoteDeltaSummary, replaySummary:dryRun.replaySummary })) : null;
      const confidenceLabelSummary = typeof confidenceApi.buildReadOnlyCandidateConfidenceLabel === "function" ? confidenceApi.buildReadOnlyCandidateConfidenceLabel({ selectedCandidate, safeProviderHandoffReady:selectedCandidate.safeProviderHandoffReady === true, reconciliationSummary:{ status:"needs_platform_check", confidenceLabel:"不可确认", nextStep:"前往平台确认", redacted:true } }) : null;
      const safeNextStepSummary = typeof coachApi.buildReadOnlyQuoteSafeNextStepCoach === "function" ? coachApi.buildReadOnlyQuoteSafeNextStepCoach({ selectedCandidate, confidenceLabelSummary, reconciliationSummary:{ status:"needs_platform_check", confidenceLabel:"不可确认", nextStep:"前往平台确认", redacted:true } }) : null;
      const reportCenterSummary = typeof reportApi.buildReadOnlyQuoteSessionReportCenter === "function" ? reportApi.buildReadOnlyQuoteSessionReportCenter(Object.assign({}, workflowMeta, workflowContinuityFields, { workflowStepList:workflowStepList, topCandidates, selectedCandidate, sessionSummary:dryRun.sessionSummary, auditExportPreview:dryRun.auditExportPreview, runHistorySummary:dryRun.runHistorySummary, quoteDeltaSummary:dryRun.quoteDeltaSummary, replaySummary:dryRun.replaySummary, decisionAssistant, confidenceLabelSummary, safeNextStepSummary })) : null;
      return enrichFlightEvidenceWorkflow({ orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:"ready", workflowStatus:"evidence_ready", flightIntentSummary:intent, workflowStateSummary:workflowStateSummary, clarificationSummary:clarificationSummary, workflowStepList:workflowStepList, workflowUserMessage:workflowMeta.workflowUserMessage, routeSummary:intent.routeSummary, tripSummary:intent.tripSummary, missingFields:[], clarificationQuestions:[], workflowSteps, dryRunSummary:stripUnsafe(dryRun), topCandidates, selectedCandidate, decisionAssistant, reportCenterSummary, confidenceLabelSummary, safeNextStepSummary, safeProviderHandoffReady:selectedCandidate.safeProviderHandoffReady === true, handoffReadiness:{ status:selectedCandidate.safeProviderHandoffReady === true ? "confirmation_required" : "blocked", requiresUserConfirmation:true, autoOpen:false, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }, safety:baseSafety({ dryRunRan:true, dryRunAllowed:true }), persistedWorkflowState:persistState(workflowState, safe), bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }, safe);
    } catch (error) {
      return enrichFlightEvidenceWorkflow({ orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:"failed_safe", workflowStatus:"failed_safe", flightIntentSummary:null, workflowStateSummary:null, clarificationSummary:null, routeSummary:"", tripSummary:"", missingFields:[], clarificationQuestions:[], workflowSteps:[step("intent_normalized", "failed_safe")].concat(skippedEvidenceSteps()), topCandidates:[], selectedCandidate:null, safety:baseSafety({ dryRunRan:false, dryRunAllowed:false }), bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }, input);
    }
  }

  function buildFlightEvidenceWorkflowSummary(input) {
    const workflow = input && input.orchestratorName === ORCHESTRATOR_NAME ? input : runFlightEvidenceWorkflow(input);
    return clone({ title:"机票请求工作流", status:workflow.status, workflowStatus:workflow.workflowStatus, routeSummary:workflow.routeSummary || "", tripSummary:workflow.tripSummary || "", flightIntentSummary:workflow.flightIntentSummary || null, workflowStateSummary:workflow.workflowStateSummary || null, clarificationSummary:workflow.clarificationSummary || null, continuitySummary:workflow.continuitySummary || null, confirmationStateSummary:workflow.confirmationStateSummary || null, recoverySummary:workflow.recoverySummary || null, resumeCoachSummary:workflow.resumeCoachSummary || null, actionQueueSummary:workflow.actionQueueSummary || null, progressTimelineSummary:workflow.progressTimelineSummary || null, safeResumeCenterSummary:workflow.safeResumeCenterSummary || null, blockedActions:workflow.blockedActions || [], currentActionLabel:workflow.currentActionLabel || "", nextSafeActionLabel:workflow.nextSafeActionLabel || "", currentStage:workflow.currentStage || "", workflowStageLabel:workflow.workflowStageLabel || "", nextStepLabel:workflow.nextStepLabel || "", canResumeWorkflow:workflow.canResumeWorkflow === true, resumeActions:workflow.resumeActions || [], actionQueue:workflow.actionQueueSummary || null, progressTimeline:workflow.progressTimelineSummary || null, safeResumeCenter:workflow.safeResumeCenterSummary || null, nextSafeAction:workflow.nextSafeActionLabel || "", workflowSteps:workflow.workflowSteps || [], workflowStepList:workflow.workflowStepList || [], workflowUserMessage:workflow.workflowUserMessage || "", missingFields:workflow.missingFields || [], clarificationQuestions:workflow.clarificationQuestions || [], topCandidateCount:(workflow.topCandidates || []).length, selectedCandidateRank:workflow.selectedCandidate && workflow.selectedCandidate.rank || null, selectedCandidateProvider:workflow.selectedCandidate && workflow.selectedCandidate.providerName || "", decisionAvailable:!!workflow.decisionAssistant, confidenceLabel:workflow.confidenceLabelSummary && workflow.confidenceLabelSummary.confidenceLabel || "不可确认", nextStep:workflow.nextStepLabel || workflow.safeNextStepSummary && workflow.safeNextStepSummary.recommendation || "前往平台确认", safeProviderHandoffReady:workflow.safeProviderHandoffReady === true, platformFinal:true, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  function buildFlightEvidenceWorkflowAuditDraft(input) {
    const workflow = input && input.orchestratorName === ORCHESTRATOR_NAME ? input : runFlightEvidenceWorkflow(input);
    return clone({ eventType:"FLIGHT_EVIDENCE_WORKFLOW_AUDIT_DRAFT", orchestratorName:ORCHESTRATOR_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, workflowId:WORKFLOW_ID, status:workflow.status, workflowStatus:workflow.workflowStatus, routeSummary:workflow.routeSummary || "", tripSummary:workflow.tripSummary || "", workflowStateSummary:workflow.workflowStateSummary || null, clarificationSummary:workflow.clarificationSummary || null, continuitySummary:workflow.continuitySummary || null, confirmationStateSummary:workflow.confirmationStateSummary || null, recoverySummary:workflow.recoverySummary || null, resumeCoachSummary:workflow.resumeCoachSummary || null, actionQueueSummary:workflow.actionQueueSummary || null, progressTimelineSummary:workflow.progressTimelineSummary || null, safeResumeCenterSummary:workflow.safeResumeCenterSummary || null, blockedActions:workflow.blockedActions || [], currentActionLabel:workflow.currentActionLabel || "", nextSafeActionLabel:workflow.nextSafeActionLabel || "", currentStage:workflow.currentStage || "", nextStepLabel:workflow.nextStepLabel || "", canResumeWorkflow:workflow.canResumeWorkflow === true, stepCount:(workflow.workflowSteps || []).length, topCandidateCount:(workflow.topCandidates || []).length, dryRunRan:workflow.safety && workflow.safety.dryRunRan === true, networkAllowed:false, rawResponseStored:false, secretStored:false, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
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
