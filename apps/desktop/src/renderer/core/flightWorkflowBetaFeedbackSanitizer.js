;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER_VERSION = "4.0.1";
  const SANITIZER_NAME = "flight_workflow_beta_feedback_sanitizer_v1";
  const SAFE_RATINGS = ["good", "ok", "bad"];
  const SENSITIVE_RULES = [
    { type:"identity", re:/\b\d{17}[\dXx]\b|身份证|身份证号/g },
    { type:"card", re:/\b(?:\d[ -]*?){13,19}\b|银行卡|信用卡|cardNumber/g },
    { type:"passport", re:/\b[A-Z][0-9]{7,9}\b|护照|passport/ig },
    { type:"token", re:/\btoken\b(?:\s*[:=]?\s*\S+)?|bearer\s+[a-z0-9._-]+/ig },
    { type:"key", re:/\b(apiKey|api_key|secretKey|accessKey|key)\b(?:\s*[:=]?\s*\S+)?/ig },
    { type:"secret", re:/\bsecret\b(?:\s*[:=]?\s*\S+)?|password(?:\s*[:=]?\s*\S+)?|credential|登录凭据/ig },
    { type:"order", re:/订单号|order\s*id|orderId/ig },
    { type:"payment_link", re:/https?:\/\/\S*(pay|payment|checkout|order|booking)\S*/ig }
  ];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function rating(value) { const safe = text(value); return SAFE_RATINGS.indexOf(safe) >= 0 ? safe : null; }
  function safety() { return { rawUserTextStored:false, secretStored:false, identityUpload:false, credentialInput:false, payment:false, order:false, ticketing:false, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }; }

  function detectFlightWorkflowBetaFeedbackSensitiveContent(input) {
    const safe = input && typeof input === "object" ? input : {};
    const source = [safe.userComment, safe.comment, safe.rawUserText, safe.text, safe.feedback].map(text).join(" ");
    const found = [];
    SENSITIVE_RULES.forEach(function (rule) {
      rule.re.lastIndex = 0;
      if (rule.re.test(source)) found.push(rule.type);
    });
    return clone({ sensitiveDetected:found.length > 0, sensitiveTypes:found.filter(function (item, index) { return found.indexOf(item) === index; }), redacted:true });
  }

  function redactComment(value) {
    let result = text(value).slice(0, 280);
    SENSITIVE_RULES.forEach(function (rule) {
      rule.re.lastIndex = 0;
      result = result.replace(rule.re, "[redacted]");
    });
    result = result.replace(/https?:\/\/\S+/ig, "[redacted]");
    return result || null;
  }

  function buildFlightWorkflowBetaFeedbackSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const comment = safe.redactedUserComment != null ? safe.redactedUserComment : (safe.userComment || safe.comment || safe.rawUserText || "");
    return clone({
      usabilityRating:rating(safe.usabilityRating),
      clarityRating:rating(safe.clarityRating),
      safetyCopyUnderstood:typeof safe.safetyCopyUnderstood === "boolean" ? safe.safetyCopyUnderstood : null,
      redactedUserComment:redactComment(comment)
    });
  }

  function sanitizeFlightWorkflowBetaFeedback(input) {
    const detection = detectFlightWorkflowBetaFeedbackSensitiveContent(input || {});
    const summary = buildFlightWorkflowBetaFeedbackSummary(input || {});
    return clone({
      sanitizerName:SANITIZER_NAME,
      appVersion:FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER_VERSION,
      status:detection.sensitiveDetected ? "redacted" : "ready",
      sensitiveDetected:detection.sensitiveDetected,
      sensitiveTypes:detection.sensitiveTypes,
      redactedFeedback:summary,
      safety:safety(),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawUserTextStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function buildFlightWorkflowBetaFeedbackSanitizerAuditDraft(input) {
    const sanitized = sanitizeFlightWorkflowBetaFeedback(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER_AUDIT_DRAFT", sanitizerName:SANITIZER_NAME, appVersion:FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER_VERSION, status:sanitized.status, sensitiveDetected:sanitized.sensitiveDetected, sensitiveTypes:sanitized.sensitiveTypes, rawUserTextStored:false, secretStored:false, bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }

  window.WeishanFlightWorkflowBetaFeedbackSanitizer = { FLIGHT_WORKFLOW_BETA_FEEDBACK_SANITIZER_VERSION, SANITIZER_NAME, sanitizeFlightWorkflowBetaFeedback, detectFlightWorkflowBetaFeedbackSensitiveContent, buildFlightWorkflowBetaFeedbackSummary, buildFlightWorkflowBetaFeedbackSanitizerAuditDraft };
})();
