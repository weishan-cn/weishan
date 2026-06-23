;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_UI_PRESENTER_VERSION = "2.1.61";
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
  function buildFlightWorkflowUiPresenter(input) {
    const safe = input && typeof input === "object" ? input : {};
    const state = stateOf(safe);
    const status = statusOf(state);
    const questions = (safe.clarificationQuestions || state.clarificationQuestions || []).map(safeText);
    return clone({ presenterName:PRESENTER_NAME, appVersion:FLIGHT_WORKFLOW_UI_PRESENTER_VERSION, status, title:"机票请求工作流", currentStepLabel:currentStepLabel(status), stepList:buildFlightWorkflowStepList(state), userMessage:buildFlightWorkflowUserMessage(state), clarificationQuestions:questions, primaryAction:status === "needs_clarification" ? "补充缺失信息" : (status === "ready_for_evidence" ? "生成候选证据" : "去平台确认"), secondaryActions:["复制搜索条件"], safetyCaveat:"唯珊不会付款、不会下单、不会上传证件或银行卡。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true });
  }
  function buildFlightWorkflowUiPresenterAuditDraft(input) {
    const presenter = buildFlightWorkflowUiPresenter(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_UI_PRESENTER_AUDIT_DRAFT", presenterName:PRESENTER_NAME, appVersion:FLIGHT_WORKFLOW_UI_PRESENTER_VERSION, status:presenter.status, currentStepLabel:presenter.currentStepLabel, stepCount:presenter.stepList.length, questionCount:presenter.clarificationQuestions.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true });
  }
  window.WeishanFlightWorkflowUiPresenter = { FLIGHT_WORKFLOW_UI_PRESENTER_VERSION, PRESENTER_NAME, buildFlightWorkflowUiPresenter, buildFlightWorkflowStepList, buildFlightWorkflowUserMessage, buildFlightWorkflowUiPresenterAuditDraft };
})();
