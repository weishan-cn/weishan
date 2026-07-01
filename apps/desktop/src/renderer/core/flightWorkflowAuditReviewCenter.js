;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION = "3.7.0";
  const CENTER_NAME = "flight_workflow_audit_review_center_v1";
  const DEFAULT_WORKFLOW_ID = "deterministic-flight-workflow-audit-review-v2.4.1";
  const FORBIDDEN_NAME_RE = /(rawText|rawUserText|rawInput|rawProviderResponse|rawResponse|rawPayload|token|apiKey|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card|idNumber|passportNumber)/i;
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;

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
      const allowedFalse = /(Stored|Included|Allowed|Enabled|Upload|Input|Open|Refresh|Risk|Payment|Order|Ticketing)$/i.test(name) && raw === false;
      if (FORBIDDEN_NAME_RE.test(name) && !allowedNullUrl && !allowedFalse) return;
      const next = stripUnsafe(raw);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true }; }
  function scanRisk(value) {
    const risk = { hasRawResponseRisk:false, hasSecretRisk:false, hasTradingUrlRisk:false, hasAutoOpenRisk:false, hasPaymentRisk:false, hasOrderRisk:false, hasTicketingRisk:false, hasIdentityUploadRisk:false, hasSensitiveInputBlocked:false, hasCredentialInputRisk:false, hasRawUserTextRisk:false };
    function visit(item, key) {
      if (item == null) return;
      const name = String(key || "");
      if (/rawProviderResponse|rawResponse|rawPayload/i.test(name) && item) risk.hasRawResponseRisk = true;
      if (/rawText|rawUserText|rawInput/i.test(name) && item) risk.hasRawUserTextRisk = true;
      if (/token|apiKey|secret|password|auth/i.test(name) && item) risk.hasSecretRisk = true;
      if (/credential/i.test(name) && item) risk.hasCredentialInputRisk = true;
      if (/identity|passport|bank|card|idNumber|passportNumber/i.test(name) && item) risk.hasIdentityUploadRisk = true;
      if (/bookingUrl|checkoutUrl|paymentUrl|orderUrl/i.test(name) && item !== null && item !== false && item !== "") risk.hasTradingUrlRisk = true;
      if (/autoOpen/i.test(name) && item === true) risk.hasAutoOpenRisk = true;
      if (/payment|pay/i.test(name) && item === true) risk.hasPaymentRisk = true;
      if (/order|checkout/i.test(name) && item === true) risk.hasOrderRisk = true;
      if (/ticketing|issue_ticket/i.test(name) && item === true) risk.hasTicketingRisk = true;
      if (/identityUpload/i.test(name) && item === true) risk.hasIdentityUploadRisk = true;
      if (/sensitiveInputBlocked/i.test(name) && item === true) risk.hasSensitiveInputBlocked = true;
      if (typeof item === "string") {
        if (/https?:\/\//i.test(item) && /Url/i.test(name)) risk.hasTradingUrlRisk = true;
        if (/token|apiKey|secret|password|sk-|pk-|live_|prod_/i.test(item)) risk.hasSecretRisk = true;
        if (/身份证|护照|银行卡|cardNumber|passport/i.test(item)) risk.hasIdentityUploadRisk = true;
      }
      if (Array.isArray(item)) item.forEach(function (child) { visit(child, name); });
      else if (item && typeof item === "object") Object.keys(item).forEach(function (childKey) { visit(item[childKey], childKey); });
    }
    visit(value, "");
    return risk;
  }
  function blockedActionsOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    return toArray(safe.blockedActions).concat(toArray(safe.actionQueueSummary && safe.actionQueueSummary.blockedActions)).concat(toArray(safe.actionQueue && safe.actionQueue.blockedActions)).filter(Boolean);
  }
  function hasConfirmation(input) {
    const safe = input && typeof input === "object" ? input : {};
    const action = safe.actionPolicyDecision || safe.actionExecutionResult && safe.actionExecutionResult.actionPolicyDecision || {};
    const confirmation = safe.actionExecutionResult && safe.actionExecutionResult.confirmation || safe.confirmationSummary || safe.confirmationStateSummary || {};
    const events = toArray(safe.eventLedgerSummary && safe.eventLedgerSummary.recentEvents).concat(toArray(safe.events));
    return action.status === "requires_confirmation" || action.requiresConfirmation === true || confirmation.required === true || events.some(function (event) { return event.eventType === "confirmation_required" || event.actionId === "open_provider_confirmation"; });
  }
  function evaluateFlightWorkflowAuditHealth(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return { overall:"unknown", hasBlockedActions:false, hasConfirmationRequiredActions:false, hasSensitiveInputBlocked:false, hasRawResponseRisk:false, hasSecretRisk:false, hasTradingUrlRisk:false, hasAutoOpenRisk:false, hasPaymentRisk:false, hasOrderRisk:false, hasTicketingRisk:false, hasIdentityUploadRisk:false };
    const risk = scanRisk(input);
    const sentinel = input.safetyRegressionSummary || input.sentinelReport || {};
    const hasSafetyRegressionBlocked = sentinel.status === "fail" || sentinel.status === "failed_safe";
    const hasPacketPolicyBlocked = input.handoffPacketPolicyDecision && input.handoffPacketPolicyDecision.status === "blocked" || input.finalSafeHandoffPacketSummary && input.finalSafeHandoffPacketSummary.status === "blocked";
    const hasBlockedActions = hasSafetyRegressionBlocked || hasPacketPolicyBlocked || blockedActionsOf(input).length > 0 || input.actionPolicyDecision && input.actionPolicyDecision.blocked === true || input.actionExecutionResult && input.actionExecutionResult.status === "blocked";
    const health = { overall:"pass", hasBlockedActions:hasBlockedActions, hasConfirmationRequiredActions:hasConfirmation(input), hasSensitiveInputBlocked:risk.hasSensitiveInputBlocked, hasRawResponseRisk:risk.hasRawResponseRisk, hasSecretRisk:risk.hasSecretRisk, hasTradingUrlRisk:risk.hasTradingUrlRisk, hasAutoOpenRisk:risk.hasAutoOpenRisk, hasPaymentRisk:risk.hasPaymentRisk, hasOrderRisk:risk.hasOrderRisk, hasTicketingRisk:risk.hasTicketingRisk, hasIdentityUploadRisk:risk.hasIdentityUploadRisk || risk.hasCredentialInputRisk };
    if (health.hasRawResponseRisk || health.hasSecretRisk || health.hasTradingUrlRisk || health.hasAutoOpenRisk || health.hasPaymentRisk || health.hasOrderRisk || health.hasTicketingRisk || health.hasIdentityUploadRisk) health.overall = "blocked";
    else if (health.hasBlockedActions || health.hasConfirmationRequiredActions || health.hasSensitiveInputBlocked) health.overall = "warning";
    return clone(health);
  }
  function finding(findingId, severity, title, message, relatedActionId) { return { findingId:findingId, severity:severity, title:title, message:message, relatedActionId:relatedActionId || "", redacted:true }; }
  function buildFlightWorkflowAuditFindings(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return [finding("malformed_input", "blocked", "审计输入异常", "malformed audit input 已安全降级。", "")];
      const health = evaluateFlightWorkflowAuditHealth(input);
      const findings = [finding("read_only_safe", "info", "只读安全", "唯珊只提供只读候选证据，不付款、不下单、不出票。", "")];
      if (health.hasBlockedActions) findings.push(finding("blocked_actions", "blocked", "动作已安全阻断", "检测到被阻断动作，交易动作已阻断。", "blocked_action"));
      if (input.safetyRegressionSummary && (input.safetyRegressionSummary.status === "fail" || input.safetyRegressionSummary.status === "failed_safe")) findings.push(finding("safety_regression_failed", "blocked", "安全回归失败", "安全回归哨兵发现风险，工作流已阻断。", "safety_regression_failed"));
      if (input.handoffPacketPolicyDecision && input.handoffPacketPolicyDecision.status === "blocked" || input.finalSafeHandoffPacketSummary && input.finalSafeHandoffPacketSummary.status === "blocked") findings.push(finding("handoff_packet_blocked", "blocked", "交接包已阻断", "最终安全交接包已被策略阻断。", "handoff_packet_blocked"));
      if (health.hasConfirmationRequiredActions) findings.push(finding("provider_confirmation", "warning", "外部平台操作需要二次确认", "前往平台确认只返回确认提示，不自动打开。", "open_provider_confirmation"));
      if (health.hasSensitiveInputBlocked) findings.push(finding("sensitive_input_blocked", "blocked", "敏感输入已阻断", "不包含证件、银行卡、登录凭据或密钥。", ""));
      if (health.hasRawResponseRisk) findings.push(finding("raw_response_risk", "blocked", "raw response 风险", "raw provider response 不允许进入审计或导出预览。", ""));
      if (health.hasSecretRisk) findings.push(finding("secret_risk", "blocked", "secret 风险", "token/key/secret 已阻断，不会显示或保存。", ""));
      if (health.hasTradingUrlRisk) findings.push(finding("trading_url_risk", "blocked", "交易 URL 风险", "booking/payment/order URL 必须为 null。", ""));
      if (health.hasAutoOpenRisk) findings.push(finding("auto_open_risk", "blocked", "自动打开风险", "审计链路不允许自动打开外部平台。", ""));
      if (health.hasPaymentRisk) findings.push(finding("payment_risk", "blocked", "付款风险", "付款入口已阻断。", ""));
      if (health.hasOrderRisk) findings.push(finding("order_risk", "blocked", "下单风险", "下单入口已阻断。", ""));
      if (health.hasTicketingRisk) findings.push(finding("ticketing_risk", "blocked", "出票风险", "出票入口已阻断。", ""));
      if (health.hasIdentityUploadRisk) findings.push(finding("identity_risk", "blocked", "身份信息风险", "证件、银行卡、登录凭据输入已阻断。", ""));
      return clone(findings.map(stripUnsafe));
    } catch (error) { return [finding("failed_safe", "blocked", "审计安全降级", "审计复核已安全降级。", "")]; }
  }
  function buildFlightWorkflowAuditReviewSummary(input) {
    const health = evaluateFlightWorkflowAuditHealth(input || {});
    const resultLabel = health.overall === "blocked" ? "已安全阻断" : (health.overall === "warning" ? "存在需要注意的项目" : "安全检查通过");
    return clone({ title:"本次机票工作流审计", resultLabel:resultLabel, caveat:"唯珊只提供只读候选证据，不付款、不下单、不出票。", redacted:true });
  }
  function buildFlightWorkflowAuditReviewCenter(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowAuditReview({ centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION, status:"failed_safe", workflowId:DEFAULT_WORKFLOW_ID, auditHealth:evaluateFlightWorkflowAuditHealth(null), findings:buildFlightWorkflowAuditFindings(null), userFacingSummary:buildFlightWorkflowAuditReviewSummary(null), safety:safety(), redacted:true });
      const health = evaluateFlightWorkflowAuditHealth(input);
      const status = health.overall === "blocked" ? "blocked" : (health.overall === "warning" ? "warning" : "ready");
      const findings = buildFlightWorkflowAuditFindings(input);
      return sanitizeFlightWorkflowAuditReview({ centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION, status:status, workflowId:safeText(input.workflowId || input.workflowStateSummary && input.workflowStateSummary.workflowId || DEFAULT_WORKFLOW_ID), auditHealth:health, findings:findings, userFacingSummary:buildFlightWorkflowAuditReviewSummary(input), eventLedgerSummary:stripUnsafe(input.eventLedgerSummary || null), actionPolicySummary:stripUnsafe(input.actionPolicyDecision || input.actionExecutionResult && input.actionExecutionResult.actionPolicyDecision || null), confirmationSummary:stripUnsafe(input.confirmationSummary || input.confirmationStateSummary || input.actionExecutionResult && input.actionExecutionResult.confirmation || null), blockedActionSummary:{ title:"被阻断动作", blockedActions:stripUnsafe(blockedActionsOf(input)), redacted:true }, humanReviewChecklistSummary:stripUnsafe(input.humanReviewChecklistSummary || null), finalSafeHandoffPacketSummary:stripUnsafe(input.finalSafeHandoffPacketSummary || null), handoffPacketPolicyDecision:stripUnsafe(input.handoffPacketPolicyDecision || null), finalReviewStatus:safeText(input.finalReviewStatus || input.finalSafeHandoffPacketSummary && input.finalSafeHandoffPacketSummary.status || ""), finalReviewBadges:stripUnsafe(input.finalReviewBadges || []), operatorConsoleSummary:stripUnsafe(input.operatorConsoleSummary || null), safetyRegressionSummary:stripUnsafe(input.safetyRegressionSummary || null), releaseReadinessSummary:stripUnsafe(input.releaseReadinessSummary || null), userSafetyCopySummary:stripUnsafe(input.userSafetyCopySummary || null), forbiddenCapabilitySummary:stripUnsafe(input.forbiddenCapabilitySummary || null), userFacingBetaReadiness:stripUnsafe(input.userFacingBetaReadiness || null), copyValidationStatus:safeText(input.copyValidationStatus || ""), sentinelStatus:safeText(input.sentinelStatus || input.safetyRegressionSummary && input.safetyRegressionSummary.status || ""), operatorReadiness:stripUnsafe(input.operatorReadiness || null), nextOperatorAction:stripUnsafe(input.nextOperatorAction || null), safety:safety(), redacted:true });
    } catch (error) {
      return sanitizeFlightWorkflowAuditReview({ centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION, status:"failed_safe", workflowId:DEFAULT_WORKFLOW_ID, auditHealth:evaluateFlightWorkflowAuditHealth(null), findings:buildFlightWorkflowAuditFindings(null), userFacingSummary:buildFlightWorkflowAuditReviewSummary(null), safety:safety(), redacted:true });
    }
  }
  function sanitizeFlightWorkflowAuditReview(input) {
    const raw = input && typeof input === "object" ? input : {};
    const rawHealth = raw.auditHealth && typeof raw.auditHealth === "object" ? raw.auditHealth : {};
    const safe = stripUnsafe(raw) || {};
    safe.centerName = CENTER_NAME;
    safe.appVersion = FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION;
    safe.workflowId = safeText(safe.workflowId || DEFAULT_WORKFLOW_ID);
    safe.auditHealth = Object.assign(evaluateFlightWorkflowAuditHealth({}), { overall:rawHealth.overall || safe.auditHealth && safe.auditHealth.overall || "pass", hasBlockedActions:rawHealth.hasBlockedActions === true, hasConfirmationRequiredActions:rawHealth.hasConfirmationRequiredActions === true, hasSensitiveInputBlocked:rawHealth.hasSensitiveInputBlocked === true, hasRawResponseRisk:rawHealth.hasRawResponseRisk === true, hasSecretRisk:rawHealth.hasSecretRisk === true, hasTradingUrlRisk:rawHealth.hasTradingUrlRisk === true, hasAutoOpenRisk:rawHealth.hasAutoOpenRisk === true, hasPaymentRisk:rawHealth.hasPaymentRisk === true, hasOrderRisk:rawHealth.hasOrderRisk === true, hasTicketingRisk:rawHealth.hasTicketingRisk === true, hasIdentityUploadRisk:rawHealth.hasIdentityUploadRisk === true });
    safe.findings = toArray(safe.findings).map(stripUnsafe);
    safe.userFacingSummary = Object.assign({ title:"本次机票工作流审计", resultLabel:"安全检查通过", caveat:"唯珊只提供只读候选证据，不付款、不下单、不出票。" }, stripUnsafe(safe.userFacingSummary || {}));
    safe.safety = Object.assign(safety(), stripUnsafe(safe.safety || {}));
    safe.bookingUrl = null; safe.checkoutUrl = null; safe.paymentUrl = null; safe.orderUrl = null; safe.autoOpen = false; safe.autoRefresh = false; safe.payment = false; safe.order = false; safe.ticketing = false; safe.identityUpload = false; safe.credentialInput = false; safe.rawResponseStored = false; safe.rawUserTextStored = false; safe.secretStored = false; safe.redacted = true;
    return clone(safe);
  }
  function buildFlightWorkflowAuditReviewCenterAuditDraft(input) {
    const review = buildFlightWorkflowAuditReviewCenter(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_AUDIT_DRAFT", centerName:CENTER_NAME, appVersion:FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION, status:review.status, workflowId:review.workflowId, findingCount:review.findings.length, overall:review.auditHealth.overall, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, redacted:true });
  }

  window.WeishanFlightWorkflowAuditReviewCenter = { FLIGHT_WORKFLOW_AUDIT_REVIEW_CENTER_VERSION, CENTER_NAME, buildFlightWorkflowAuditReviewCenter, evaluateFlightWorkflowAuditHealth, buildFlightWorkflowAuditFindings, buildFlightWorkflowAuditReviewSummary, buildFlightWorkflowAuditReviewCenterAuditDraft, sanitizeFlightWorkflowAuditReview };
})();
