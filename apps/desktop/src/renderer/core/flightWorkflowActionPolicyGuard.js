;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_VERSION = "4.0.3";
  const GUARD_NAME = "flight_workflow_action_policy_guard_v1";
  const SUPPORTED_ACTIONS = ["answer_clarification", "run_read_only_quotes", "select_candidate", "open_provider_confirmation", "record_platform_check", "resume_workflow", "clear_workflow", "view_audit_preview", "blocked_action"];
  const LOCAL_ONLY_ACTIONS = ["answer_clarification", "run_read_only_quotes", "select_candidate", "record_platform_check", "resume_workflow", "clear_workflow", "view_audit_preview"];
  const FORBIDDEN_ACTION_RE = /(payment|pay|order|checkout|ticket|issue_ticket|identity|passport|credential|login|bank|card|付款|支付|下单|订单|出票|证件|护照|银行卡|登录凭据)/i;
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
  function safety() { return { localOnly:true, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true }; }
  function redactionSummary() { return { rawResponseStored:false, rawUserTextStored:false, secretStored:false, tradingUrlStored:false, identityStored:false, redacted:true }; }
  function actionIdOf(action) { return safeText(action && (action.actionId || action.id || action.type) || ""); }
  function actionLabelOf(action) { return safeText(action && (action.actionLabel || action.label || action.title) || actionIdOf(action)); }
  function actionText(action) { return [actionIdOf(action), actionLabelOf(action), safeText(action && action.actionType || "")].join(" "); }
  function isSupported(id) { return SUPPORTED_ACTIONS.indexOf(id) >= 0; }
  function statusFor(action, context) {
    const id = actionIdOf(action);
    const combined = actionText(action) + " " + safeText(context && (context.intent || context.reason || context.actionRequest) || "");
    if (!id || !isSupported(id)) return "failed_safe";
    if (id === "blocked_action" || FORBIDDEN_ACTION_RE.test(combined)) return "blocked";
    if (id === "open_provider_confirmation") return "requires_confirmation";
    if (LOCAL_ONLY_ACTIONS.indexOf(id) >= 0) return "allowed";
    return "failed_safe";
  }
  function buildFlightWorkflowActionPolicyDecision(action, context) {
    const id = actionIdOf(action);
    const status = statusFor(action || {}, context || {});
    const actionType = status === "requires_confirmation" ? "requires_confirmation" : (status === "blocked" ? "blocked" : (status === "allowed" ? "local_only" : "blocked"));
    const messageMap = {
      allowed:"动作已通过本地只读策略，可在本地执行。",
      requires_confirmation:"外部平台操作需要二次确认。",
      blocked:"动作已被安全阻断。",
      failed_safe:"未知动作已安全降级。"
    };
    return clone({
      guardName:GUARD_NAME,
      appVersion:FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_VERSION,
      actionId:id,
      actionLabel:actionLabelOf(action || {}),
      status:status,
      actionType:actionType,
      allowed:status === "allowed",
      requiresConfirmation:status === "requires_confirmation",
      blocked:status === "blocked" || status === "failed_safe",
      reason:messageMap[status] || messageMap.failed_safe,
      userFacingMessage:messageMap[status] || messageMap.failed_safe,
      safety:Object.assign(safety(), { localOnly:status !== "requires_confirmation" }),
      redactionSummary:redactionSummary(),
      auditFindingHints:status === "blocked" ? ["动作已安全阻断"] : (status === "requires_confirmation" ? ["外部平台操作需要二次确认"] : []),
      exportSafeSummary:{ actionId:id, status:status, actionType:actionType, canWriteFile:false, canDownload:false, bookingUrl:null, payment:false, order:false, redacted:true },
      riskBadgeHints:status === "blocked" ? ["交易动作已阻断"] : (status === "requires_confirmation" ? ["需要二次确认"] : ["只读安全"]),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      redacted:true
    });
  }
  function evaluateFlightWorkflowActionPolicy(action, context) {
    return buildFlightWorkflowActionPolicyDecision(action || {}, context || {});
  }
  function buildFlightWorkflowActionPolicyGuardAuditDraft(input) {
    const safe = input && typeof input === "object" ? input : {};
    const decision = safe.actionPolicyDecision || buildFlightWorkflowActionPolicyDecision(safe.action || safe, safe.context || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_AUDIT_DRAFT", guardName:GUARD_NAME, appVersion:FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_VERSION, actionId:decision.actionId || "", status:decision.status || "failed_safe", actionType:decision.actionType || "blocked", message:decision.userFacingMessage || "动作已被安全阻断。", safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redactionSummary:redactionSummary(), redacted:true });
  }
  function sanitizeFlightWorkflowActionPolicyDecision(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    safe.guardName = GUARD_NAME;
    safe.appVersion = FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_VERSION;
    safe.safety = Object.assign(safety(), stripUnsafe(safe.safety || {}));
    safe.redactionSummary = Object.assign(redactionSummary(), stripUnsafe(safe.redactionSummary || {}));
    safe.auditFindingHints = stripUnsafe(safe.auditFindingHints || []);
    safe.exportSafeSummary = stripUnsafe(Object.assign({ actionId:safe.actionId || "", status:safe.status || "", canWriteFile:false, canDownload:false, bookingUrl:null, payment:false, order:false, redacted:true }, safe.exportSafeSummary || {}));
    safe.riskBadgeHints = stripUnsafe(safe.riskBadgeHints || []);
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.redacted = true;
    return clone(safe);
  }

  window.WeishanFlightWorkflowActionPolicyGuard = { FLIGHT_WORKFLOW_ACTION_POLICY_GUARD_VERSION, GUARD_NAME, evaluateFlightWorkflowActionPolicy, buildFlightWorkflowActionPolicyDecision, buildFlightWorkflowActionPolicyGuardAuditDraft, sanitizeFlightWorkflowActionPolicyDecision };
})();
