;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION = "3.3.0";
  const TIMELINE_NAME = "flight_workflow_progress_timeline_v1";
  const STEPS = [
    ["intent", "识别机票需求"],
    ["clarification", "补充缺失信息"],
    ["evidence", "生成只读候选证据"],
    ["decision", "选择候选并查看推荐理由"],
    ["provider_confirmation", "前往平台确认"],
    ["platform_check", "记录平台核对结果"]
  ];
  const FORBIDDEN_RE = /https?:\/\/\S+|token|key|secret|password|bookingUrl|paymentUrl|orderUrl|身份证|护照|银行卡/ig;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_RE, "redacted"); }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      if (/(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i.test(name) && !(/Url$/.test(name) && raw === null)) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true }; }
  function statusOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    const state = safe.workflowStateSummary || safe.state || {};
    const continuity = safe.continuitySummary || {};
    const status = safe.status || safe.workflowStatus || state.status || continuity.status || "needs_clarification";
    if (status === "manual_platform_check_ready" || status === "awaiting_platform_check") return "awaiting_platform_check";
    if (status === "resumable") return "provider_confirmation_ready";
    if (status === "ready") return state.status || "provider_confirmation_ready";
    return status;
  }
  function currentStepFor(status) {
    if (status === "blocked" || status === "failed_safe") return "intent";
    if (status === "needs_clarification") return "clarification";
    if (status === "ready_for_evidence" || status === "evidence_running") return "evidence";
    if (status === "evidence_ready") return "decision";
    if (status === "provider_confirmation_ready") return "provider_confirmation";
    if (status === "awaiting_platform_check") return "platform_check";
    if (status === "completed_read_only") return "platform_check";
    return "intent";
  }
  function buildSteps(currentStepId, status) {
    const currentIndex = STEPS.findIndex(function (step) { return step[0] === currentStepId; });
    return STEPS.map(function (step, index) {
      let stepStatus = index < currentIndex ? "completed" : (index === currentIndex ? "current" : "pending");
      if (status === "completed_read_only") stepStatus = "completed";
      if (status === "blocked" && index > 0) stepStatus = "blocked";
      if (status === "failed_safe") stepStatus = index === 0 ? "blocked" : "blocked";
      return { stepId:step[0], label:step[1], status:stepStatus, redacted:true };
    });
  }
  function withCounts(base) {
    const steps = Array.isArray(base.steps) ? base.steps : [];
    return Object.assign({}, base, { completedCount:steps.filter(function (step) { return step.status === "completed"; }).length, pendingCount:steps.filter(function (step) { return step.status === "pending" || step.status === "current"; }).length, blockedCount:steps.filter(function (step) { return step.status === "blocked"; }).length });
  }
  function buildFlightWorkflowProgressTimeline(input) {
    try {
      const status = statusOf(input || {});
      const currentStepId = currentStepFor(status);
      return sanitizeFlightWorkflowProgressTimeline(withCounts({ timelineName:TIMELINE_NAME, appVersion:FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION, title:"进度时间线", currentStepTitle:"当前步骤", completedTitle:"已完成", pendingTitle:"待完成", blockedTitle:"已阻断", status:status === "blocked" ? "blocked" : (status === "failed_safe" ? "failed_safe" : "ready"), currentStepId:currentStepId, steps:buildSteps(currentStepId, status), actionExecutionResult:stripUnsafe((input || {}).actionExecutionResult || null), actionPolicyDecision:stripUnsafe((input || {}).actionPolicyDecision || null), eventLedgerSummary:stripUnsafe((input || {}).eventLedgerSummary || null), lastActionId:safeText((input || {}).lastActionId || (input || {}).eventLedgerSummary && (input || {}).eventLedgerSummary.lastActionId || ""), lastActionStatus:safeText((input || {}).lastActionStatus || (input || {}).eventLedgerSummary && (input || {}).eventLedgerSummary.lastActionStatus || ""), lastActionMessage:safeText((input || {}).lastActionMessage || (input || {}).eventLedgerSummary && (input || {}).eventLedgerSummary.lastActionMessage || ""), safety:safety(), redacted:true }));
    } catch (error) {
      return sanitizeFlightWorkflowProgressTimeline(withCounts({ timelineName:TIMELINE_NAME, appVersion:FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION, status:"failed_safe", currentStepId:"intent", steps:buildSteps("intent", "failed_safe"), safety:safety(), redacted:true }));
    }
  }
  function updateFlightWorkflowProgressTimeline(timeline, event) {
    const safeEvent = event && typeof event === "object" ? event : {};
    const type = safeText(safeEvent.type || safeEvent.eventType || "");
    const statusMap = { CLARIFICATION_REQUESTED:"needs_clarification", EVIDENCE_RUN_REQUESTED:"ready_for_evidence", EVIDENCE_READY:"evidence_ready", CANDIDATE_SELECTED:"provider_confirmation_ready", PROVIDER_CONFIRMATION_REQUESTED:"provider_confirmation_ready", USER_CONFIRMED_PROVIDER_HANDOFF:"awaiting_platform_check", MANUAL_PLATFORM_CHECK_RECORDED:"completed_read_only", WORKFLOW_BLOCKED:"blocked" };
    return buildFlightWorkflowProgressTimeline(Object.assign({}, timeline || {}, { status:statusMap[type] || safeEvent.status || timeline && timeline.status || "needs_clarification" }));
  }
  function summarizeFlightWorkflowProgressTimeline(timeline) {
    const safe = timeline && timeline.timelineName === TIMELINE_NAME ? timeline : buildFlightWorkflowProgressTimeline(timeline || {});
    const current = (safe.steps || []).find(function (step) { return step.status === "current"; }) || null;
    return clone({ timelineName:TIMELINE_NAME, appVersion:FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION, status:safe.status, currentStepId:safe.currentStepId, currentStepLabel:current && current.label || "", completedCount:safe.completedCount || 0, pendingCount:safe.pendingCount || 0, blockedCount:safe.blockedCount || 0, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
  }
  function sanitizeFlightWorkflowProgressTimeline(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    safe.timelineName = TIMELINE_NAME; safe.appVersion = FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION;
    safe.steps = Array.isArray(safe.steps) ? safe.steps.map(stripUnsafe) : [];
    const counted = withCounts(safe);
    counted.actionExecutionResult = stripUnsafe(counted.actionExecutionResult || null);
    counted.actionPolicyDecision = stripUnsafe(counted.actionPolicyDecision || null);
    counted.eventLedgerSummary = stripUnsafe(counted.eventLedgerSummary || null);
    counted.lastActionId = safeText(counted.lastActionId || "");
    counted.lastActionStatus = safeText(counted.lastActionStatus || "");
    counted.lastActionMessage = safeText(counted.lastActionMessage || "");
    counted.safety = Object.assign(safety(), stripUnsafe(counted.safety || {}));
    counted.bookingUrl = null; counted.checkoutUrl = null; counted.paymentUrl = null; counted.orderUrl = null; counted.rawResponseStored = false; counted.secretStored = false; counted.redacted = true;
    return clone(counted);
  }
  function buildFlightWorkflowProgressTimelineAuditDraft(input) {
    const timeline = buildFlightWorkflowProgressTimeline(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_PROGRESS_TIMELINE_AUDIT_DRAFT", timelineName:TIMELINE_NAME, appVersion:FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION, status:timeline.status, currentStepId:timeline.currentStepId, completedCount:timeline.completedCount, pendingCount:timeline.pendingCount, blockedCount:timeline.blockedCount, lastActionId:timeline.lastActionId || "", lastActionStatus:timeline.lastActionStatus || "", lastActionMessage:timeline.lastActionMessage || "", eventLedgerSummary:timeline.eventLedgerSummary || null, bookingUrl:null, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true });
  }
  window.WeishanFlightWorkflowProgressTimeline = { FLIGHT_WORKFLOW_PROGRESS_TIMELINE_VERSION, TIMELINE_NAME, buildFlightWorkflowProgressTimeline, updateFlightWorkflowProgressTimeline, summarizeFlightWorkflowProgressTimeline, buildFlightWorkflowProgressTimelineAuditDraft };
})();
