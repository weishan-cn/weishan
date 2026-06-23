;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER_VERSION = "2.1.72";
  const ROUTER_NAME = "flight_workflow_safe_action_execution_router_v1";
  const FORBIDDEN_NAME_RE = /(rawText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|key|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      const raw = value[name];
      const allowedNullUrl = /Url$/.test(name) && raw === null;
      const allowedFalse = /(Stored|Included|Allowed|Enabled|Upload|Input|Open|Refresh)$/i.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function safety(localOnly) { return { localOnly:localOnly !== false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true }; }
  function redactionSummary() { return { rawResponseStored:false, rawUserTextStored:false, secretStored:false, tradingUrlStored:false, identityStored:false, redacted:true }; }
  function actionIdOf(action) { return safeText(action && (action.actionId || action.id || action.type) || ""); }
  function actionLabelOf(action) { return safeText(action && (action.actionLabel || action.label || action.title) || actionIdOf(action)); }
  function currentStage(context) { const safe = context && typeof context === "object" ? context : {}; return safeText(safe.currentStage || safe.stage || safe.workflowStage || safe.workflowStateSummary && safe.workflowStateSummary.currentStage || safe.continuitySummary && safe.continuitySummary.currentStage || ""); }
  function policyDecision(action, context) {
    const guard = window.WeishanFlightWorkflowActionPolicyGuard || {};
    if (typeof guard.evaluateFlightWorkflowActionPolicy === "function") return guard.evaluateFlightWorkflowActionPolicy(action || {}, context || {});
    return { status:"failed_safe", actionType:"blocked", allowed:false, requiresConfirmation:false, blocked:true, userFacingMessage:"未知动作已安全降级。", safety:safety(true), redacted:true };
  }
  function messageFor(status) {
    if (status === "executed_local") return "动作已执行";
    if (status === "confirmation_required") return "需要确认后继续";
    if (status === "blocked") return "动作已被安全阻断";
    return "动作已安全降级";
  }
  function nextStepFor(actionId, status) {
    if (status === "confirmation_required") return "等待用户二次确认";
    if (actionId === "answer_clarification") return "生成候选证据";
    if (actionId === "run_read_only_quotes") return "选择候选";
    if (actionId === "select_candidate") return "前往平台确认前检查";
    if (actionId === "record_platform_check") return "平台核对汇总";
    if (actionId === "resume_workflow") return "恢复本地脱敏工作流";
    if (actionId === "clear_workflow") return "清除本地工作流";
    if (actionId === "view_audit_preview") return "查看脱敏审计预览";
    return "停止";
  }
  function buildFlightWorkflowSafeActionResult(action, context) {
    const id = actionIdOf(action || {});
    const label = actionLabelOf(action || {});
    const decision = policyDecision(action || {}, context || {});
    const status = decision.status === "allowed" ? "executed_local" : (decision.status === "requires_confirmation" ? "confirmation_required" : (decision.status === "blocked" ? "blocked" : "failed_safe"));
    const stageBefore = currentStage(context || {});
    const result = sanitizeFlightWorkflowSafeActionResult({
      routerName:ROUTER_NAME,
      appVersion:FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER_VERSION,
      status:status,
      actionId:id,
      actionLabel:label,
      actionType:decision.actionType || (status === "confirmation_required" ? "requires_confirmation" : (status === "executed_local" ? "local_only" : "blocked")),
      result:{ workflowState:stripUnsafe((context || {}).workflowStateSummary || (context || {}).workflowState || {}), actionMessage:messageFor(status), nextStep:nextStepFor(id, status), updatedSummary:{ lastActionId:id, lastActionStatus:status, lastActionMessage:messageFor(status), currentStage:stageBefore, redacted:true } },
      confirmation:{ required:status === "confirmation_required", confirmationType:status === "confirmation_required" ? "provider_handoff" : "none", title:status === "confirmation_required" ? "需要确认后继续" : "", message:status === "confirmation_required" ? "外部平台操作需要二次确认，本动作不会付款、不会下单、不会出票。" : "" },
      actionPolicyDecision:decision,
      eventLedgerSummary:(context || {}).eventLedgerSummary || null,
      redactionSummary:redactionSummary(),
      auditFindingHints:status === "blocked" ? ["动作已安全阻断"] : (status === "confirmation_required" ? ["外部平台操作需要二次确认"] : []),
      exportSafeSummary:{ actionId:id, actionLabel:label, status:status, actionMessage:messageFor(status), canWriteFile:false, canDownload:false, bookingUrl:null, payment:false, order:false, redacted:true },
      riskBadgeHints:status === "blocked" ? ["交易动作已阻断"] : (status === "confirmation_required" ? ["需要二次确认"] : ["只读安全"]),
      safety:safety(status !== "confirmation_required"),
      redacted:true
    });
    return result;
  }
  function evaluateFlightWorkflowSafeAction(action, context) { return buildFlightWorkflowSafeActionResult(action || {}, context || {}); }
  function eventTypeFor(status) {
    if (status === "executed_local") return "action_executed";
    if (status === "confirmation_required") return "confirmation_required";
    if (status === "blocked") return "action_blocked";
    return "failed_safe";
  }
  function routeFlightWorkflowSafeAction(action, context) {
    const safeContext = context && typeof context === "object" ? context : {};
    const requested = { eventType:"action_requested", actionId:actionIdOf(action || {}), actionLabel:actionLabelOf(action || {}), status:"requested", stageBefore:currentStage(safeContext), stageAfter:currentStage(safeContext), message:"安全动作已请求", redactedPayloadSummary:{ actionId:actionIdOf(action || {}), redacted:true }, redactionSummary:redactionSummary(), exportSafeSummary:{ actionId:actionIdOf(action || {}), status:"requested", canWriteFile:false, canDownload:false, bookingUrl:null, payment:false, order:false, redacted:true }, riskBadgeHints:["只读安全"] };
    const result = buildFlightWorkflowSafeActionResult(action || {}, safeContext);
    const ledgerApi = window.WeishanFlightWorkflowEventLedger || {};
    if (safeContext.storageLike && typeof ledgerApi.appendFlightWorkflowEvent === "function") {
      ledgerApi.appendFlightWorkflowEvent(requested, safeContext.storageLike);
      const appended = ledgerApi.appendFlightWorkflowEvent({ eventType:eventTypeFor(result.status), actionId:result.actionId, actionLabel:result.actionLabel, status:result.status, stageBefore:currentStage(safeContext), stageAfter:result.result && result.result.updatedSummary && result.result.updatedSummary.currentStage || currentStage(safeContext), message:result.result && result.result.actionMessage || messageFor(result.status), redactedPayloadSummary:{ nextStep:result.result && result.result.nextStep || "", redacted:true }, safety:result.safety, redactionSummary:result.redactionSummary, auditFindingHints:result.auditFindingHints, exportSafeSummary:result.exportSafeSummary, riskBadgeHints:result.riskBadgeHints }, safeContext.storageLike);
      result.eventLedgerSummary = appended && appended.summary || result.eventLedgerSummary;
    }
    return sanitizeFlightWorkflowSafeActionResult(result);
  }
  function sanitizeFlightWorkflowSafeActionResult(result) {
    const safe = stripUnsafe(result && typeof result === "object" ? result : {}) || {};
    safe.routerName = ROUTER_NAME;
    safe.appVersion = FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER_VERSION;
    safe.result = Object.assign({ workflowState:{}, actionMessage:"动作已安全降级", nextStep:"停止", updatedSummary:{ redacted:true } }, stripUnsafe(safe.result || {}));
    safe.confirmation = Object.assign({ required:false, confirmationType:"none", title:"", message:"" }, stripUnsafe(safe.confirmation || {}));
    safe.redactionSummary = Object.assign(redactionSummary(), stripUnsafe(safe.redactionSummary || {}));
    safe.auditFindingHints = stripUnsafe(safe.auditFindingHints || []);
    safe.exportSafeSummary = stripUnsafe(Object.assign({ actionId:safe.actionId || "", status:safe.status || "", canWriteFile:false, canDownload:false, bookingUrl:null, payment:false, order:false, redacted:true }, safe.exportSafeSummary || {}));
    safe.riskBadgeHints = stripUnsafe(safe.riskBadgeHints || []);
    safe.safety = Object.assign(safety(safe.status !== "confirmation_required"), stripUnsafe(safe.safety || {}));
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.rawResponseStored = false;
    safe.rawUserTextStored = false;
    safe.secretStored = false;
    safe.redacted = true;
    return clone(safe);
  }
  function buildFlightWorkflowSafeActionExecutionAuditDraft(input) {
    const safe = input && typeof input === "object" ? input : {};
    const result = safe.actionExecutionResult || buildFlightWorkflowSafeActionResult(safe.action || safe, safe.context || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_AUDIT_DRAFT", routerName:ROUTER_NAME, appVersion:FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER_VERSION, status:result.status, actionId:result.actionId || "", actionType:result.actionType || "blocked", confirmationRequired:!!(result.confirmation && result.confirmation.required), lastActionMessage:result.result && result.result.actionMessage || "", safety:safety(result.status !== "confirmation_required"), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redactionSummary:redactionSummary(), redacted:true });
  }

  window.WeishanFlightWorkflowSafeActionExecutionRouter = { FLIGHT_WORKFLOW_SAFE_ACTION_EXECUTION_ROUTER_VERSION, ROUTER_NAME, routeFlightWorkflowSafeAction, evaluateFlightWorkflowSafeAction, buildFlightWorkflowSafeActionResult, buildFlightWorkflowSafeActionExecutionAuditDraft, sanitizeFlightWorkflowSafeActionResult };
})();
