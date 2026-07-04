;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION = "4.2.3";
  const QUEUE_NAME = "flight_workflow_action_queue_v1";
  const FORBIDDEN_NAME_RE = /(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|key|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  const ACTIONS = [
    ["answer_clarification", "补充缺失信息", false],
    ["run_read_only_quotes", "运行只读报价", false],
    ["select_candidate", "选择候选", false],
    ["open_provider_confirmation", "前往平台确认", true],
    ["record_platform_check", "记录平台核对结果", false],
    ["resume_workflow", "恢复上次机票工作流", false],
    ["clear_workflow", "清除工作流", false],
    ["view_audit_preview", "查看脱敏审计预览", false],
    ["blocked_action", "安全阻断动作", false]
  ];

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
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true }; }
  function blockedActions() { return [
    { actionId:"pay", label:"付款", reason:"唯珊不会付款", redacted:true },
    { actionId:"order", label:"下单", reason:"唯珊不会下单", redacted:true },
    { actionId:"issue_ticket", label:"出票", reason:"唯珊不会出票", redacted:true },
    { actionId:"upload_identity", label:"上传证件或银行卡", reason:"唯珊不会上传证件或银行卡", redacted:true }
  ]; }
  function stateOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.workflowStateSummary || safe.state || safe.workflowState || {}; }
  function continuityOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.continuitySummary) return safe.continuitySummary;
    if (safe.continuityName === "flight_workflow_continuity_manager_v1") return safe;
    const api = window.WeishanFlightWorkflowContinuityManager || {};
    return typeof api.buildFlightWorkflowContinuity === "function" ? api.buildFlightWorkflowContinuity(safe) : null;
  }
  function recoveryAvailable(input) {
    const safe = input && typeof input === "object" ? input : {};
    const rec = safe.recoverySummary || safe.recoveryState || safe.loadedRecovery || null;
    if (rec && (rec.status === "loaded" || rec.status === "available" || rec.status === "saved" || rec.status === "resumable" || rec.state)) return true;
    if (safe.hasRecovery === true || safe.recoveryAvailable === true) return true;
    return false;
  }
  function statusOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    const state = stateOf(safe);
    const continuity = continuityOf(safe) || {};
    const status = safe.status || safe.workflowStatus || state.status || continuity.status || "empty";
    if (status === "manual_platform_check_ready") return "awaiting_platform_check";
    if (status === "resumable") return "provider_confirmation_ready";
    if (status === "ready") return state.status || "provider_confirmation_ready";
    return status;
  }
  function enabledActionIds(input) {
    const status = statusOf(input);
    if (status === "blocked" || status === "failed_safe") return [];
    const ids = [];
    if (status === "needs_clarification") ids.push("answer_clarification");
    if (status === "ready_for_evidence" || status === "evidence_running") ids.push("run_read_only_quotes");
    if (status === "evidence_ready") ids.push("select_candidate");
    if (status === "provider_confirmation_ready") ids.push("open_provider_confirmation");
    if (status === "awaiting_platform_check") ids.push("record_platform_check");
    if (recoveryAvailable(input)) ids.push("resume_workflow", "clear_workflow");
    if (status !== "blocked" && status !== "failed_safe") ids.push("view_audit_preview");
    return ids;
  }
  function reasonFor(actionId, enabled, status) {
    if (actionId === "blocked_action") return "动作已被安全阻断";
    if (enabled) return actionId === "open_provider_confirmation" ? "需要用户二次确认后手动前往平台" : "当前阶段可执行";
    if (status === "blocked") return "安全限制：当前请求已阻断";
    if (status === "failed_safe") return "安全降级：动作不可用";
    return "当前阶段不可执行";
  }
  function evaluateFlightWorkflowActionAvailability(actionId, input) {
    const id = safeText(actionId || "");
    const status = statusOf(input || {});
    const enabled = enabledActionIds(input || {}).indexOf(id) >= 0;
    const def = ACTIONS.find(function (item) { return item[0] === id; }) || [id, id, false];
    return clone({ actionId:id, label:def[1], enabled:id === "blocked_action" ? false : enabled, visible:id === "blocked_action" ? true : (id !== "clear_workflow" || recoveryAvailable(input || {})), requiresUserConfirmation:def[2] === true, actionType:id === "open_provider_confirmation" ? "requires_confirmation" : (id === "blocked_action" ? "blocked" : "local_only"), reason:reasonFor(id, enabled, status), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }
  function buildFlightWorkflowActionQueue(input) {
    try {
      const safe = input && typeof input === "object" ? input : {};
      const status = statusOf(safe);
      const continuity = continuityOf(safe) || {};
      const actions = ACTIONS.map(function (item) { return evaluateFlightWorkflowActionAvailability(item[0], safe); }).filter(function (action) { return action.visible !== false; });
      return sanitizeFlightWorkflowActionQueue({ queueName:QUEUE_NAME, appVersion:FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION, title:"当前可继续操作", blockedActionsTitle:"已阻断动作", safetyTitle:"安全限制", status:status === "blocked" ? "blocked" : (status === "failed_safe" ? "failed_safe" : (actions.length ? "ready" : "empty")), currentStage:safeText(safe.currentStage || continuity.currentStage || stateOf(safe).currentStage || status), actions:actions, blockedActions:blockedActions(), actionExecutionResult:stripUnsafe(safe.actionExecutionResult || null), actionPolicyDecision:stripUnsafe(safe.actionPolicyDecision || null), eventLedgerSummary:stripUnsafe(safe.eventLedgerSummary || null), lastActionId:safeText(safe.lastActionId || safe.actionExecutionResult && safe.actionExecutionResult.actionId || safe.eventLedgerSummary && safe.eventLedgerSummary.lastActionId || ""), lastActionStatus:safeText(safe.lastActionStatus || safe.actionExecutionResult && safe.actionExecutionResult.status || safe.eventLedgerSummary && safe.eventLedgerSummary.lastActionStatus || ""), lastActionMessage:safeText(safe.lastActionMessage || safe.actionExecutionResult && safe.actionExecutionResult.result && safe.actionExecutionResult.result.actionMessage || safe.eventLedgerSummary && safe.eventLedgerSummary.lastActionMessage || ""), safety:safety(), redacted:true });
    } catch (error) {
      return sanitizeFlightWorkflowActionQueue({ queueName:QUEUE_NAME, appVersion:FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION, status:"failed_safe", currentStage:"failed_safe", actions:[], blockedActions:blockedActions(), safety:safety(), redacted:true });
    }
  }
  function sanitizeFlightWorkflowActionQueue(queue) {
    const safe = stripUnsafe(queue && typeof queue === "object" ? queue : {}) || {};
    safe.queueName = QUEUE_NAME;
    safe.appVersion = FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION;
    safe.actions = toArray(safe.actions).map(function (action) { return Object.assign({ visible:true, enabled:false, requiresUserConfirmation:false, reason:"" }, stripUnsafe(action || {}), { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true }); });
    safe.blockedActions = blockedActions();
    safe.safety = Object.assign(safety(), stripUnsafe(safe.safety || {}));
    safe.actionExecutionResult = stripUnsafe(safe.actionExecutionResult || null);
    safe.actionPolicyDecision = stripUnsafe(safe.actionPolicyDecision || null);
    safe.eventLedgerSummary = stripUnsafe(safe.eventLedgerSummary || null);
    safe.lastActionId = safeText(safe.lastActionId || "");
    safe.lastActionStatus = safeText(safe.lastActionStatus || "");
    safe.lastActionMessage = safeText(safe.lastActionMessage || "");
    safe.bookingUrl = null; safe.checkoutUrl = null; safe.paymentUrl = null; safe.orderUrl = null;
    safe.rawResponseStored = false; safe.secretStored = false; safe.redacted = true;
    return clone(safe);
  }
  function buildFlightWorkflowActionQueueAuditDraft(input) {
    const queue = buildFlightWorkflowActionQueue(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_ACTION_QUEUE_AUDIT_DRAFT", queueName:QUEUE_NAME, appVersion:FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION, status:queue.status, currentStage:queue.currentStage, enabledActionCount:queue.actions.filter(function (action) { return action.enabled === true; }).length, blockedActionCount:queue.blockedActions.length, lastActionId:queue.lastActionId || "", lastActionStatus:queue.lastActionStatus || "", lastActionMessage:queue.lastActionMessage || "", eventLedgerSummary:queue.eventLedgerSummary || null, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, secretStored:false, redacted:true });
  }
  window.WeishanFlightWorkflowActionQueue = { FLIGHT_WORKFLOW_ACTION_QUEUE_VERSION, QUEUE_NAME, buildFlightWorkflowActionQueue, evaluateFlightWorkflowActionAvailability, buildFlightWorkflowActionQueueAuditDraft, sanitizeFlightWorkflowActionQueue };
})();
