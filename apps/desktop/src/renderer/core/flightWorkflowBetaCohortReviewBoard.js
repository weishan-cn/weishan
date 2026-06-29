;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD_VERSION = "2.2.8";
  const BOARD_NAME = "flight_workflow_beta_cohort_review_board_v1";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;
  const TRADING_RE = /"(bookingUrl|checkoutUrl|paymentUrl|orderUrl)"\s*:\s*"https?:\/\//i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { rawUserTextStored:false, rawResponseStored:false, secretStored:false, identityUpload:false, credentialInput:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, redacted:true }; }
  function sessionsOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (Array.isArray(safe.sessions)) return safe.sessions;
    if (Array.isArray(safe.feedbackReviews)) return safe.feedbackReviews;
    if (Array.isArray(safe.items)) return safe.items;
    if (safe.feedbackReviewSummary || safe.acceptanceSessionSummary || safe.feedbackSanitizerSummary) return [safe];
    return [];
  }
  function feedbackOf(item) {
    const safe = item && typeof item === "object" ? item : {};
    const review = safe.feedbackReviewSummary || safe.betaFeedbackReviewSummary || (safe.reviewCenterName === "flight_workflow_beta_feedback_review_center_v1" ? safe : {});
    const sanitizer = safe.feedbackSanitizerSummary || (safe.sanitizerName === "flight_workflow_beta_feedback_sanitizer_v1" ? safe : {});
    const health = review.feedbackHealth || {};
    const rating = review.ratingSummary || sanitizer.redactedFeedback || safe.redactedFeedback || safe.feedbackSummary || {};
    return {
      status:review.status || sanitizer.status || safe.status || "needs_review",
      usability:rating.usabilityRating || safe.usabilityRating || "unknown",
      clarity:rating.clarityRating || safe.clarityRating || "unknown",
      safetyCopyUnderstood:typeof health.safetyCopyUnderstood === "boolean" ? health.safetyCopyUnderstood : (typeof rating.safetyCopyUnderstood === "boolean" ? rating.safetyCopyUnderstood : safe.safetyCopyUnderstood),
      redacted:review.redacted === true || sanitizer.redacted === true || safe.redacted === true || review.status === "redacted" || sanitizer.status === "redacted",
      blocked:review.status === "blocked" || sanitizer.status === "blocked" || safe.status === "blocked" || safe.blocked === true
    };
  }
  function hasBlockedSafety(input) {
    const source = JSON.stringify(input && typeof input === "object" ? input : {});
    return /rawUserTextStored"?\s*:?\s*true/i.test(source) || /secretStored"?\s*:?\s*true/i.test(source) || TRADING_RE.test(source);
  }
  function evaluateFlightWorkflowBetaCohortHealth(input) {
    const sessions = sessionsOf(input || {});
    let usable = 0, redacted = 0, blocked = 0, safetyUnderstood = 0, goodUsability = 0, goodClarity = 0;
    sessions.forEach(function (item) {
      const feedback = feedbackOf(item);
      if (feedback.blocked) blocked += 1;
      if (feedback.redacted) redacted += 1;
      const usableFeedback = feedback.status === "ready" || feedback.status === "redacted" || feedback.usability !== "unknown" || feedback.clarity !== "unknown" || typeof feedback.safetyCopyUnderstood === "boolean";
      if (usableFeedback && !feedback.blocked) usable += 1;
      if (feedback.safetyCopyUnderstood === true) safetyUnderstood += 1;
      if (feedback.usability === "good") goodUsability += 1;
      if (feedback.clarity === "good") goodClarity += 1;
    });
    const safeToExpand = sessions.length >= 3 && usable >= 3 && blocked === 0 && usable > 0 && safetyUnderstood / usable >= 0.7 && goodUsability / usable >= 0.6 && goodClarity / usable >= 0.6 && !hasBlockedSafety(input || {});
    return clone({ sessionCount:sessions.length, usableFeedbackCount:usable, redactedFeedbackCount:redacted, blockedFeedbackCount:blocked, safetyCopyUnderstoodCount:safetyUnderstood, goodUsabilityCount:goodUsability, goodClarityCount:goodClarity, safeToExpandBeta:safeToExpand, redacted:true });
  }
  function statusFor(health, input) {
    if (hasBlockedSafety(input || {})) return "blocked";
    if (health.sessionCount === 0) return "needs_more_feedback";
    if (health.blockedFeedbackCount > 0) return "needs_review";
    if (health.usableFeedbackCount < 3) return "needs_more_feedback";
    if (health.usableFeedbackCount && health.safetyCopyUnderstoodCount / health.usableFeedbackCount < 0.7) return "needs_review";
    if (health.usableFeedbackCount && health.goodUsabilityCount / health.usableFeedbackCount < 0.6) return "needs_review";
    if (health.usableFeedbackCount && health.goodClarityCount / health.usableFeedbackCount < 0.6) return "needs_review";
    return health.safeToExpandBeta ? "ready" : "needs_review";
  }
  function row(rowId, label, value, status) { return { rowId:rowId, label:safeText(label), value:safeText(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function buildFlightWorkflowBetaCohortRows(input) {
    const h = evaluateFlightWorkflowBetaCohortHealth(input || {});
    return clone([
      row("sessions", "验收会话", String(h.sessionCount), h.sessionCount >= 3 ? "pass" : "warning"),
      row("usable_feedback", "可用反馈", String(h.usableFeedbackCount), h.usableFeedbackCount >= 3 ? "pass" : "warning"),
      row("safety_copy", "安全文案理解", h.usableFeedbackCount ? Math.round(h.safetyCopyUnderstoodCount / h.usableFeedbackCount * 100) + "%" : "unknown", h.usableFeedbackCount && h.safetyCopyUnderstoodCount / h.usableFeedbackCount >= 0.7 ? "pass" : "warning"),
      row("usability", "可用性评分", h.usableFeedbackCount ? Math.round(h.goodUsabilityCount / h.usableFeedbackCount * 100) + "% good" : "unknown", h.usableFeedbackCount && h.goodUsabilityCount / h.usableFeedbackCount >= 0.6 ? "pass" : "warning"),
      row("clarity", "清晰度评分", h.usableFeedbackCount ? Math.round(h.goodClarityCount / h.usableFeedbackCount * 100) + "% good" : "unknown", h.usableFeedbackCount && h.goodClarityCount / h.usableFeedbackCount >= 0.6 ? "pass" : "warning")
    ]);
  }
  function finding(findingId, severity, title, message) { return { findingId:findingId, severity:/^(info|warning|blocked)$/.test(severity) ? severity : "warning", title:safeText(title), message:safeText(message), redacted:true }; }
  function buildFlightWorkflowBetaCohortFindings(input) {
    const h = evaluateFlightWorkflowBetaCohortHealth(input || {});
    const status = statusFor(h, input || {});
    const list = [];
    if (status === "blocked") list.push(finding("cohort_blocked", "blocked", "已阻断", "批次反馈包含禁止的原文、密钥或交易链接风险。"));
    if (h.usableFeedbackCount < 3) list.push(finding("cohort_more_feedback", "warning", "仍需更多反馈", "至少需要 3 条可用脱敏反馈再判断趋势。"));
    if (h.blockedFeedbackCount > 0) list.push(finding("cohort_blocked_feedback", "warning", "仍需复核", "存在已阻断反馈，需要人工复核。"));
    if (h.usableFeedbackCount >= 3 && h.safetyCopyUnderstoodCount / h.usableFeedbackCount < 0.7) list.push(finding("safety_copy_low", "warning", "安全文案理解不足", "安全文案理解率低于 70%。"));
    if (h.usableFeedbackCount >= 3 && h.goodUsabilityCount / h.usableFeedbackCount < 0.6) list.push(finding("usability_low", "warning", "可用性反馈偏弱", "good 可用性反馈低于 60%。"));
    if (h.usableFeedbackCount >= 3 && h.goodClarityCount / h.usableFeedbackCount < 0.6) list.push(finding("clarity_low", "warning", "仍需复核", "good 清晰度反馈低于 60%。"));
    if (!list.length) list.push(finding("cohort_ready", "info", "可以扩大只读测试", "脱敏批次反馈满足扩大只读 Beta 测试条件。"));
    return clone(list);
  }
  function sanitizeFlightWorkflowBetaCohortReviewBoard(board) {
    const safe = board && typeof board === "object" ? board : {};
    return clone({ boardName:BOARD_NAME, appVersion:FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD_VERSION, status:safeText(safe.status || "failed_safe"), cohortHealth:clone(safe.cohortHealth || evaluateFlightWorkflowBetaCohortHealth({})), rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status || "warning"); }), findings:toArray(safe.findings).map(function (item) { return finding(item.findingId || "finding", item.severity || "warning", item.title || "", item.message || ""); }), userFacingSummary:Object.assign({ title:"Beta 反馈复核板", resultLabel:"仍需更多反馈", caveat:"反馈只用于改进只读候选证据流程，不代表真实票价、库存或可出票。", redacted:true }, safe.userFacingSummary || {}), safety:safety(), rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
  }
  function buildFlightWorkflowBetaCohortReviewBoard(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowBetaCohortReviewBoard({ status:"failed_safe", findings:[finding("malformed", "blocked", "已阻断", "输入格式异常。")] });
      const health = evaluateFlightWorkflowBetaCohortHealth(input);
      const status = statusFor(health, input);
      const label = status === "ready" ? "可以扩大只读测试" : (status === "needs_more_feedback" ? "仍需更多反馈" : (status === "blocked" ? "已阻断" : "仍需复核"));
      return sanitizeFlightWorkflowBetaCohortReviewBoard({ status:status, cohortHealth:health, rows:buildFlightWorkflowBetaCohortRows(input), findings:buildFlightWorkflowBetaCohortFindings(input), userFacingSummary:{ title:"Beta 反馈复核板", resultLabel:label, caveat:"反馈只用于改进只读候选证据流程，不代表真实票价、库存或可出票。", redacted:true } });
    } catch (error) { return sanitizeFlightWorkflowBetaCohortReviewBoard({ status:"failed_safe" }); }
  }
  function buildFlightWorkflowBetaCohortReviewBoardAuditDraft(input) { const board = buildFlightWorkflowBetaCohortReviewBoard(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD_AUDIT_DRAFT", boardName:BOARD_NAME, appVersion:FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD_VERSION, status:board.status, sessionCount:board.cohortHealth.sessionCount, rawUserTextStored:false, secretStored:false, bookingUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, redacted:true }); }
  window.WeishanFlightWorkflowBetaCohortReviewBoard = { FLIGHT_WORKFLOW_BETA_COHORT_REVIEW_BOARD_VERSION, BOARD_NAME, buildFlightWorkflowBetaCohortReviewBoard, evaluateFlightWorkflowBetaCohortHealth, buildFlightWorkflowBetaCohortRows, buildFlightWorkflowBetaCohortFindings, buildFlightWorkflowBetaCohortReviewBoardAuditDraft, sanitizeFlightWorkflowBetaCohortReviewBoard };
})();
