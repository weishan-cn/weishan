;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER_VERSION = "4.0.6";
  const REVIEW_CENTER_NAME = "flight_workflow_beta_feedback_review_center_v1";
  const SENSITIVE_TEXT_RE = /https?:\/\/\S+|(?:token|apiKey|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport/ig;
  const TRADING_URL_RE = /bookingUrl|checkoutUrl|paymentUrl|orderUrl/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { rawUserTextStored:false, rawResponseStored:false, secretStored:false, identityUpload:false, credentialInput:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, redacted:true }; }
  function sanitizerApi() { return window.WeishanFlightWorkflowBetaFeedbackSanitizer || {}; }
  function sanitizerOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.feedbackSanitizerSummary) return safe.feedbackSanitizerSummary;
    if (safe.sanitizerSummary) return safe.sanitizerSummary;
    if (safe.sanitizerName === "flight_workflow_beta_feedback_sanitizer_v1") return safe;
    const api = sanitizerApi();
    return typeof api.sanitizeFlightWorkflowBetaFeedback === "function" ? api.sanitizeFlightWorkflowBetaFeedback(safe.feedback || safe.feedbackSummary || safe) : { status:"ready", sensitiveDetected:false, sensitiveTypes:[], redactedFeedback:safe.feedbackSummary || {}, safety:safety(), redacted:true };
  }
  function feedbackOf(input) {
    const sanitizer = sanitizerOf(input || {});
    return sanitizer.redactedFeedback || sanitizer.feedbackSummary || {};
  }
  function hasBlockedSafety(input, sanitizer) {
    const safe = input && typeof input === "object" ? input : {};
    const source = JSON.stringify(safe);
    const s = sanitizer && sanitizer.safety || {};
    return sanitizer && sanitizer.status === "blocked" || safe.rawUserTextStored === true || safe.secretStored === true || s.rawUserTextStored === true || s.secretStored === true || TRADING_URL_RE.test(source) && /https?:\/\//i.test(source);
  }
  function rating(value) { const safe = text(value); return /^(good|ok|bad)$/.test(safe) ? safe : "unknown"; }
  function overallSignal(usability, clarity) {
    if (usability === "bad" || clarity === "bad") return "negative";
    if (usability === "unknown" && clarity === "unknown") return "unknown";
    if (usability === "ok" || clarity === "ok" || usability === "unknown" || clarity === "unknown") return "mixed";
    return "positive";
  }
  function evaluateFlightWorkflowBetaFeedbackReview(input) {
    const sanitizer = sanitizerOf(input || {});
    const feedback = feedbackOf(input || {});
    const usability = rating(feedback.usabilityRating);
    const clarity = rating(feedback.clarityRating);
    const hasFeedback = usability !== "unknown" || clarity !== "unknown" || feedback.safetyCopyUnderstood != null || !!feedback.redactedUserComment;
    const blocked = hasBlockedSafety(input || {}, sanitizer);
    const needsReview = !blocked && (!hasFeedback || feedback.safetyCopyUnderstood === false || usability === "bad" || clarity === "bad");
    return clone({
      hasFeedback:hasFeedback,
      feedbackRedacted:sanitizer.status === "redacted" || sanitizer.redacted === true,
      hasUsabilitySignal:usability !== "unknown",
      hasClaritySignal:clarity !== "unknown",
      safetyCopyUnderstood:typeof feedback.safetyCopyUnderstood === "boolean" ? feedback.safetyCopyUnderstood : null,
      hasSensitiveInputBlocked:sanitizer.status === "redacted" || toArray(sanitizer.sensitiveTypes).length > 0,
      safeToUseForAcceptanceSummary:!blocked && !needsReview && hasFeedback,
      blocked:blocked,
      needsReview:needsReview,
      redacted:true
    });
  }
  function finding(findingId, severity, title, message) { return { findingId:findingId, severity:severity, title:safeText(title), message:safeText(message), redacted:true }; }
  function buildFlightWorkflowBetaFeedbackFindings(input) {
    const sanitizer = sanitizerOf(input || {});
    const health = evaluateFlightWorkflowBetaFeedbackReview(input || {});
    const feedback = feedbackOf(input || {});
    const findings = [];
    if (!health.hasFeedback) findings.push(finding("feedback_missing", "warning", "仍需补充反馈", "尚未收到可用于验收参考的脱敏反馈。"));
    if (sanitizer.status === "redacted" || health.hasSensitiveInputBlocked) findings.push(finding("feedback_redacted", "info", "反馈已脱敏", "敏感内容已被移除，仅保留摘要。"));
    if (sanitizer.status === "blocked" || health.blocked) findings.push(finding("feedback_blocked", "blocked", "反馈已安全阻断", "反馈包含不允许用于验收的安全风险。"));
    if (feedback.safetyCopyUnderstood === false) findings.push(finding("safety_copy_unclear", "warning", "安全文案理解不足", "测试者未确认理解安全提示。"));
    if (rating(feedback.usabilityRating) === "bad") findings.push(finding("usability_bad", "warning", "可用性反馈需复核", "可用性反馈为 bad，需要改进后继续。"));
    if (rating(feedback.clarityRating) === "bad") findings.push(finding("clarity_bad", "warning", "安全文案清晰度需复核", "清晰度反馈为 bad，需要改进后继续。"));
    if (!findings.length) findings.push(finding("feedback_ready", "info", "反馈可用于验收参考", "脱敏反馈可作为只读 Beta 验收参考。"));
    return clone(findings);
  }
  function buildFlightWorkflowBetaFeedbackReviewSummary(input) {
    const feedback = feedbackOf(input || {});
    const usability = rating(feedback.usabilityRating);
    const clarity = rating(feedback.clarityRating);
    return clone({ usabilityRating:usability, clarityRating:clarity, overallSignal:overallSignal(usability, clarity), redacted:true });
  }
  function statusFor(health) {
    if (health.blocked) return "blocked";
    if (health.needsReview) return "needs_review";
    return "ready";
  }
  function sanitizeFlightWorkflowBetaFeedbackReview(review) {
    const safe = review && typeof review === "object" ? review : {};
    return clone({
      reviewCenterName:REVIEW_CENTER_NAME,
      appVersion:FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER_VERSION,
      status:safeText(safe.status || "failed_safe"),
      feedbackHealth:clone(safe.feedbackHealth || evaluateFlightWorkflowBetaFeedbackReview({})),
      findings:toArray(safe.findings).map(function (item) { return finding(item.findingId || "finding", /^(info|warning|blocked)$/.test(item.severity) ? item.severity : "warning", item.title || "", item.message || ""); }),
      ratingSummary:clone(safe.ratingSummary || { usabilityRating:"unknown", clarityRating:"unknown", overallSignal:"unknown", redacted:true }),
      userFacingSummary:Object.assign({ title:"测试反馈汇总", resultLabel:"仍需补充反馈", caveat:"反馈仅用于改进只读候选证据流程，不包含证件、银行卡、登录凭据或密钥。", redacted:true }, safe.userFacingSummary || {}),
      safety:safety(),
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      redacted:true
    });
  }
  function buildFlightWorkflowBetaFeedbackReviewCenter(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowBetaFeedbackReview({ status:"failed_safe", findings:[finding("malformed_feedback", "blocked", "反馈已安全阻断", "输入格式异常。")] });
      const health = evaluateFlightWorkflowBetaFeedbackReview(input);
      const status = statusFor(health);
      const resultLabel = status === "ready" ? "反馈可用于验收参考" : (status === "blocked" ? "反馈已安全阻断" : "仍需补充反馈");
      return sanitizeFlightWorkflowBetaFeedbackReview({ status:status, feedbackHealth:health, findings:buildFlightWorkflowBetaFeedbackFindings(input), ratingSummary:buildFlightWorkflowBetaFeedbackReviewSummary(input), userFacingSummary:{ title:"测试反馈汇总", resultLabel:resultLabel, caveat:"反馈仅用于改进只读候选证据流程，不包含证件、银行卡、登录凭据或密钥。", redacted:true }, safety:safety(), redacted:true });
    } catch (error) {
      return sanitizeFlightWorkflowBetaFeedbackReview({ status:"failed_safe", findings:[finding("failed_safe", "blocked", "反馈已安全阻断", "反馈复核安全降级。")] });
    }
  }
  function buildFlightWorkflowBetaFeedbackReviewCenterAuditDraft(input) {
    const review = buildFlightWorkflowBetaFeedbackReviewCenter(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER_AUDIT_DRAFT", reviewCenterName:REVIEW_CENTER_NAME, appVersion:FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER_VERSION, status:review.status, findingCount:review.findings.length, rawUserTextStored:false, secretStored:false, bookingUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, redacted:true });
  }

  window.WeishanFlightWorkflowBetaFeedbackReviewCenter = { FLIGHT_WORKFLOW_BETA_FEEDBACK_REVIEW_CENTER_VERSION, REVIEW_CENTER_NAME, buildFlightWorkflowBetaFeedbackReviewCenter, evaluateFlightWorkflowBetaFeedbackReview, buildFlightWorkflowBetaFeedbackFindings, buildFlightWorkflowBetaFeedbackReviewSummary, buildFlightWorkflowBetaFeedbackReviewCenterAuditDraft, sanitizeFlightWorkflowBetaFeedbackReview };
})();
