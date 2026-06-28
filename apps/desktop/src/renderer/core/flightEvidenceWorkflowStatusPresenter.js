;(function () {
  "use strict";

  const FLIGHT_EVIDENCE_WORKFLOW_STATUS_PRESENTER_VERSION = "2.1.89";
  const PRESENTER_NAME = "flight_evidence_workflow_status_presenter_v1";
  const STEP_LABELS = {
    intent_normalized: "识别机票需求",
    session_created: "创建只读报价会话",
    sandbox_dry_run: "运行只读沙盒报价",
    top_candidates: "生成 Top 3 候选",
    decision_assistant: "生成推荐理由",
    report_center: "生成候选对比",
    confidence_label: "生成候选价置信标签",
    next_step_coach: "生成下一步安全建议",
    handoff_readiness: "准备平台确认"
  };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(/(https?:\/\/\S+|token|key|secret|password|bookingUrl|paymentUrl|orderUrl)/ig, "redacted"); }

  function statusLabel(status) {
    if (status === "completed" || status === "ready") return "已完成";
    if (status === "needs_clarification") return "需要补充信息";
    if (status === "blocked") return "已安全阻断";
    if (status === "skipped") return "未运行";
    if (status === "failed_safe") return "安全降级";
    return "待处理";
  }

  function formatFlightEvidenceWorkflowSteps(steps) {
    const list = Array.isArray(steps) ? steps : [];
    return clone(list.map(function (step) {
      const id = text(step && step.id || "");
      return { id, label:safeText(step && step.label || STEP_LABELS[id] || "机票请求工作流"), status:text(step && step.status || "pending"), statusLabel:statusLabel(text(step && step.status || "pending")), redacted:true };
    }));
  }

  function workflowStatusLabel(status) {
    if (status === "ready") return "机票请求工作流";
    if (status === "needs_clarification") return "需要补充信息";
    if (status === "blocked") return "已安全阻断";
    if (status === "not_flight") return "非机票请求";
    return "安全降级";
  }

  function buildFlightEvidenceWorkflowStatusPresenter(input) {
    const safe = input && typeof input === "object" ? input : {};
    const status = text(safe.workflowStatus || safe.status || "failed_safe");
    return clone({ presenterName:PRESENTER_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_STATUS_PRESENTER_VERSION, title:"机票请求工作流", workflowStatus:status, workflowStatusLabel:workflowStatusLabel(status), routeSummary:safeText(safe.routeSummary || safe.flightIntentSummary && safe.flightIntentSummary.routeSummary || ""), tripSummary:safeText(safe.tripSummary || safe.flightIntentSummary && safe.flightIntentSummary.tripSummary || ""), clarificationQuestions:(safe.clarificationQuestions || safe.flightIntentSummary && safe.flightIntentSummary.clarificationQuestions || []).map(safeText), steps:formatFlightEvidenceWorkflowSteps(safe.workflowSteps || safe.steps || []), messages:{ needsClarification:"需要补充信息", blocked:"已安全阻断", platformFinal:"平台最终为准", handoff:"准备平台确认" }, bookingUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, secretStored:false, redacted:true });
  }

  function buildFlightEvidenceWorkflowStatusAuditDraft(input) {
    const presenter = buildFlightEvidenceWorkflowStatusPresenter(input);
    return clone({ eventType:"FLIGHT_EVIDENCE_WORKFLOW_STATUS_AUDIT_DRAFT", presenterName:PRESENTER_NAME, appVersion:FLIGHT_EVIDENCE_WORKFLOW_STATUS_PRESENTER_VERSION, workflowStatus:presenter.workflowStatus, stepCount:presenter.steps.length, routeSummary:presenter.routeSummary, tripSummary:presenter.tripSummary, rawResponseStored:false, secretStored:false, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  window.WeishanFlightEvidenceWorkflowStatusPresenter = { FLIGHT_EVIDENCE_WORKFLOW_STATUS_PRESENTER_VERSION, PRESENTER_NAME, buildFlightEvidenceWorkflowStatusPresenter, formatFlightEvidenceWorkflowSteps, buildFlightEvidenceWorkflowStatusAuditDraft };
})();
