;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_UI_PRESENTER_VERSION = "2.1.98";
  const PRESENTER_NAME = "flight_workflow_ui_presenter_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(/https?:\/\/\S+|token|key|secret|password|bookingUrl|paymentUrl|orderUrl/ig, "redacted"); }
  function stateOf(input) { return input && input.workflowStateSummary || input && input.state || input || {}; }
  function statusOf(state) { return safeText(state.status || state.workflowStatus || "idle"); }
  function buildFlightWorkflowStepList(state) {
    const status = statusOf(stateOf(state));
    function step(stepId, label, doneStatus) {
      return { stepId, label, status:doneStatus, redacted:true };
    }
    if (status === "blocked") return [step("intent", "识别机票需求", "blocked"), step("clarification", "补充缺失信息", "skipped"), step("evidence", "生成候选证据", "skipped"), step("decision", "生成推荐理由", "skipped"), step("handoff", "前往平台确认", "skipped")];
    if (status === "needs_clarification") return [step("intent", "识别机票需求", "completed"), step("clarification", "补充缺失信息", "pending"), step("evidence", "生成候选证据", "pending"), step("decision", "生成推荐理由", "pending"), step("handoff", "前往平台确认", "pending")];
    if (status === "ready_for_evidence" || status === "evidence_running") return [step("intent", "识别机票需求", "completed"), step("clarification", "补充缺失信息", "completed"), step("evidence", "生成候选证据", "pending"), step("decision", "生成推荐理由", "pending"), step("handoff", "前往平台确认", "pending")];
    if (status === "evidence_ready" || status === "provider_confirmation_ready" || status === "manual_platform_check_ready" || status === "ready") return [step("intent", "识别机票需求", "completed"), step("clarification", "补充缺失信息", "completed"), step("evidence", "生成候选证据", "completed"), step("decision", "生成推荐理由", "completed"), step("handoff", "前往平台确认", status === "provider_confirmation_ready" || status === "manual_platform_check_ready" || status === "ready" ? "ready" : "pending")];
    return [step("intent", "识别机票需求", "pending"), step("clarification", "补充缺失信息", "pending"), step("evidence", "生成候选证据", "pending"), step("decision", "生成推荐理由", "pending"), step("handoff", "前往平台确认", "pending")];
  }
  function buildFlightWorkflowUserMessage(state) {
    const safe = stateOf(state);
    const status = statusOf(safe);
    if (status === "blocked") return "已安全阻断。";
    if (status === "needs_clarification") return "需要补充信息。信息完整后再生成候选证据。";
    if (status === "ready_for_evidence") return "信息已完整，可以生成候选证据。";
    if (status === "evidence_ready" || status === "provider_confirmation_ready" || status === "ready") return "候选证据已生成，平台最终为准。";
    if (status === "failed_safe") return "工作流已安全降级。";
    return "等待机票请求。";
  }
  function currentStepLabel(status) {
    if (status === "needs_clarification") return "补充缺失信息";
    if (status === "ready_for_evidence" || status === "evidence_running") return "生成候选证据";
    if (status === "evidence_ready") return "生成推荐理由";
    if (status === "provider_confirmation_ready" || status === "manual_platform_check_ready" || status === "ready") return "前往平台确认";
    if (status === "blocked") return "安全阻断";
    return "识别机票需求";
  }
  function currentStageFor(state, status) {
    return safeText(state.currentStage || state.currentStep || (status === "manual_platform_check_ready" ? "platform_check" : status || "intent"));
  }

  function nextStepLabelFor(state, status) {
    return safeText(state.nextStepLabel || currentStepLabel(status));
  }

  function canResumeWorkflowFor(state, status) {
    if (state.canResumeWorkflow === true) return true;
    return /^(needs_clarification|ready_for_evidence|evidence_running|evidence_ready|provider_confirmation_ready|manual_platform_check_ready|ready)$/.test(status || "");
  }

  function buildFlightWorkflowUiPresenter(input) {
    const safe = input && typeof input === "object" ? input : {};
    const state = stateOf(safe);
    const status = statusOf(state);
    const questions = (safe.clarificationQuestions || state.clarificationQuestions || []).map(safeText);
    const actionQueueSummary = safe.actionQueueSummary || state.actionQueueSummary || null;
    const progressTimelineSummary = safe.progressTimelineSummary || state.progressTimelineSummary || null;
    const safeResumeCenterSummary = safe.safeResumeCenterSummary || state.safeResumeCenterSummary || null;
    const blockedActions = actionQueueSummary && Array.isArray(actionQueueSummary.blockedActions) ? actionQueueSummary.blockedActions : (Array.isArray(safe.blockedActions) ? safe.blockedActions : []);
    const enabledAction = actionQueueSummary && Array.isArray(actionQueueSummary.actions) ? actionQueueSummary.actions.find(function (action) { return action.enabled === true; }) : null;
    return clone({ presenterName:PRESENTER_NAME, appVersion:FLIGHT_WORKFLOW_UI_PRESENTER_VERSION, status, title:"机票请求工作流", workflowStageLabel:"当前工作流阶段", nextStepTitle:"下一步", resumeActionTitle:"可继续操作", currentActionTitle:"当前可继续操作", progressTimelineTitle:"进度时间线", currentStepTitle:"当前步骤", completedTitle:"已完成", pendingTitle:"待完成", blockedActionsTitle:"已阻断动作", safetyLimitTitle:"安全限制", recoveryActionLabel:"恢复上次机票工作流", actionQueueSummary:actionQueueSummary, progressTimelineSummary:progressTimelineSummary, safeResumeCenterSummary:safeResumeCenterSummary, blockedActions:blockedActions, currentActionLabel:enabledAction && enabledAction.label || "", nextSafeActionLabel:enabledAction && enabledAction.label || nextStepLabelFor(state, status), currentStepLabel:currentStepLabel(status), currentStage:currentStageFor(state, status), nextStepLabel:nextStepLabelFor(state, status), canResumeWorkflow:canResumeWorkflowFor(state, status), stepList:buildFlightWorkflowStepList(state), userMessage:buildFlightWorkflowUserMessage(state), clarificationQuestions:questions, primaryAction:status === "needs_clarification" ? "补充缺失信息" : (status === "ready_for_evidence" ? "生成候选证据" : "去平台确认"), secondaryActions:["复制搜索条件"], resumeActions:canResumeWorkflowFor(state, status) ? [nextStepLabelFor(state, status), "恢复上次机票工作流"] : [], safetyCaveat:"唯珊只提供只读候选证据，不付款、不下单、不出票。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true });
  }
  function buildFlightWorkflowUiPresenterAuditDraft(input) {
    const presenter = buildFlightWorkflowUiPresenter(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_UI_PRESENTER_AUDIT_DRAFT", presenterName:PRESENTER_NAME, appVersion:FLIGHT_WORKFLOW_UI_PRESENTER_VERSION, status:presenter.status, currentStepLabel:presenter.currentStepLabel, currentStage:presenter.currentStage, nextStepLabel:presenter.nextStepLabel, canResumeWorkflow:presenter.canResumeWorkflow === true, stepCount:presenter.stepList.length, questionCount:presenter.clarificationQuestions.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true });
  }
  window.WeishanFlightWorkflowUiPresenter = { FLIGHT_WORKFLOW_UI_PRESENTER_VERSION, PRESENTER_NAME, buildFlightWorkflowUiPresenter, buildFlightWorkflowStepList, buildFlightWorkflowUserMessage, buildFlightWorkflowUiPresenterAuditDraft };
})();
