;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RESUME_COACH_VERSION = "4.0.6";
  const COACH_NAME = "flight_workflow_resume_coach_v1";
  const FORBIDDEN_ACTIONS = ["付款", "下单", "出票", "上传证件", "上传银行卡", "输入登录凭据"];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(/立即购买|直接下单|付款|下单|出票|https?:\/\/\S+|token|key|secret|password/ig, "只读核对"); }

  function continuityOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.continuitySummary) return safe.continuitySummary;
    if (safe.continuityName === "flight_workflow_continuity_manager_v1") return safe;
    const api = window.WeishanFlightWorkflowContinuityManager || {};
    return typeof api.buildFlightWorkflowContinuity === "function" ? api.buildFlightWorkflowContinuity(safe) : { status:"failed_safe", resumePlan:{ nextStepId:"failed_safe" }, redacted:true };
  }

  function action(actionId, label, enabled, requiresUserConfirmation) {
    return { actionId, label:safeText(label), enabled:enabled === true, requiresUserConfirmation:requiresUserConfirmation !== false, redacted:true };
  }

  function buildFlightWorkflowResumeActions(input) {
    const continuity = continuityOf(input || {});
    const status = continuity.status || "failed_safe";
    if (status === "blocked" || status === "failed_safe") return [];
    if (status === "needs_clarification") return [action("answer_clarification", "补充信息", true, true)];
    if (status === "evidence_ready") return [action("select_candidate", "选择候选", true, true), action("rerun_readonly_quote", "重新运行只读报价", true, true)];
    if (status === "resumable") return [action("provider_handoff", "前往平台确认", true, true), action("record_platform_check", "记录平台核对结果", true, true)];
    if (status === "awaiting_platform_check") return [action("record_platform_check", "记录平台核对结果", true, true)];
    if (status === "completed_read_only") return [action("view_readonly_evidence", "查看只读证据", true, false), action("rerun_readonly_quote", "重新运行只读报价", true, true)];
    return [];
  }

  function recommendationFor(status) {
    if (status === "needs_clarification") return "请先补充缺失信息。";
    if (status === "evidence_ready") return "请选择一个只读候选。";
    if (status === "resumable") return "可继续前往平台确认，平台最终为准。";
    if (status === "awaiting_platform_check") return "请记录平台核对结果。";
    if (status === "completed_read_only") return "只读流程已完成，可查看本地证据。";
    if (status === "blocked") return "当前请求已安全阻断。";
    return "工作流已安全降级。";
  }

  function buildFlightWorkflowResumeCoach(input) {
    try {
      const continuity = continuityOf(input || {});
      const blocked = continuity.status === "blocked";
      const failed = continuity.status === "failed_safe";
      const actionApi = window.WeishanFlightWorkflowActionQueue || {};
      const timelineApi = window.WeishanFlightWorkflowProgressTimeline || {};
      const actionQueueSummary = typeof actionApi.buildFlightWorkflowActionQueue === "function" ? actionApi.buildFlightWorkflowActionQueue({ continuitySummary:continuity, recoverySummary:input && input.recoverySummary || null }) : null;
      const progressTimelineSummary = typeof timelineApi.buildFlightWorkflowProgressTimeline === "function" ? timelineApi.buildFlightWorkflowProgressTimeline({ continuitySummary:continuity }) : null;
      const safeResumeCenterSummary = input && input.safeResumeCenterSummary || null;
      const blockedActions = actionQueueSummary && Array.isArray(actionQueueSummary.blockedActions) ? actionQueueSummary.blockedActions : [];
      const enabledAction = actionQueueSummary && Array.isArray(actionQueueSummary.actions) ? actionQueueSummary.actions.find(function (action) { return action.enabled === true; }) : null;
      return clone({
        coachName:COACH_NAME,
        appVersion:FLIGHT_WORKFLOW_RESUME_COACH_VERSION,
        status:blocked ? "blocked" : (failed ? "failed_safe" : "ready"),
        title:"当前可继续操作", progressTimelineTitle:"进度时间线", blockedActionsTitle:"已阻断动作", safetyLimitTitle:"安全限制", currentActionLabel:enabledAction && enabledAction.label || "", nextSafeActionLabel:enabledAction && enabledAction.label || continuity.resumePlan && continuity.resumePlan.nextStepLabel || "", recommendation:safeText(recommendationFor(continuity.status)),
        actionQueueSummary:actionQueueSummary,
        progressTimelineSummary:progressTimelineSummary,
        safeResumeCenterSummary:safeResumeCenterSummary,
        actionExecutionResult:input && input.actionExecutionResult || continuity.actionExecutionResult || null,
        actionPolicyDecision:input && input.actionPolicyDecision || continuity.actionPolicyDecision || null,
        eventLedgerSummary:input && input.eventLedgerSummary || continuity.eventLedgerSummary || null,
        lastActionId:safeText(input && input.lastActionId || continuity.lastActionId || ""),
        lastActionStatus:safeText(input && input.lastActionStatus || continuity.lastActionStatus || ""),
        lastActionMessage:safeText(input && input.lastActionMessage || continuity.lastActionMessage || ""),
        blockedActions:blockedActions,
        allowedActions:buildFlightWorkflowResumeActions({ continuitySummary:continuity }),
        forbiddenActions:FORBIDDEN_ACTIONS.slice(),
        caveat:"唯珊只提供只读候选证据和平台核对辅助，不付款、不下单、不出票。",
        bookingUrl:null,
        checkoutUrl:null,
        paymentUrl:null,
        orderUrl:null,
        redacted:true
      });
    } catch (error) {
      return clone({ coachName:COACH_NAME, appVersion:FLIGHT_WORKFLOW_RESUME_COACH_VERSION, status:"failed_safe", recommendation:"工作流已安全降级。", allowedActions:[], forbiddenActions:FORBIDDEN_ACTIONS.slice(), caveat:"唯珊只提供只读候选证据和平台核对辅助，不付款、不下单、不出票。", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
    }
  }

  function buildFlightWorkflowResumeCoachAuditDraft(input) {
    const coach = buildFlightWorkflowResumeCoach(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_RESUME_COACH_AUDIT_DRAFT", coachName:COACH_NAME, appVersion:FLIGHT_WORKFLOW_RESUME_COACH_VERSION, status:coach.status, actionCount:coach.allowedActions.length, forbiddenActions:coach.forbiddenActions, lastActionId:coach.lastActionId || "", lastActionStatus:coach.lastActionStatus || "", lastActionMessage:coach.lastActionMessage || "", eventLedgerSummary:coach.eventLedgerSummary || null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
  }

  window.WeishanFlightWorkflowResumeCoach = { FLIGHT_WORKFLOW_RESUME_COACH_VERSION, COACH_NAME, buildFlightWorkflowResumeCoach, buildFlightWorkflowResumeActions, buildFlightWorkflowResumeCoachAuditDraft };
})();
