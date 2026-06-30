;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY_VERSION = "2.3.9";
  const SUMMARY_NAME = "flight_workflow_acceptance_session_summary_v1";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport/ig;
  const TRADING_FIELD_RE = /(bookingUrl|checkoutUrl|paymentUrl|orderUrl)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { rawUserTextStored:false, rawResponseStored:false, secretStored:false, identityUpload:false, credentialInput:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, redacted:true }; }
  function safeStatus(value, fallback) { const safe = text(value); return /^(completed|in_progress|needs_review|blocked|failed_safe|ready|redacted|not_started|warning)$/.test(safe) ? safe : fallback; }
  function hasTradingUrl(input) {
    const source = input && typeof input === "object" ? JSON.stringify(input) : "";
    return TRADING_FIELD_RE.test(source) && /https?:\/\//i.test(source);
  }
  function packOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.betaAcceptancePack || safe.betaAcceptanceSummary || {}; }
  function guidedOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.guidedUserTestMode || safe.guidedUserTestSummary || {}; }
  function feedbackOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.feedbackReviewSummary || safe.betaFeedbackReviewSummary || {}; }
  function row(rowId, label, status, message) { return { rowId:rowId, label:label, status:safeStatus(status, "needs_review"), message:safeText(message || ""), redacted:true }; }
  function evaluateFlightWorkflowAcceptanceSession(input) {
    const safe = input && typeof input === "object" ? input : {};
    const pack = packOf(safe);
    const guided = guidedOf(safe);
    const feedback = feedbackOf(safe);
    const blocked = pack.status === "blocked" || pack.status === "failed_safe" || feedback.status === "blocked" || hasTradingUrl(safe) || safe.rawUserTextStored === true || safe.secretStored === true;
    const feedbackNeedsReview = feedback.status === "needs_review" || feedback.status === "failed_safe" || !feedback.status;
    const guidedCompleted = guided.status === "completed";
    const safetyConfirmed = safe.safetyConfirmed === true || feedback.status === "ready" && feedback.feedbackHealth && feedback.feedbackHealth.safetyCopyUnderstood === true;
    const allReady = !blocked && (pack.status === "ready" || pack.status === "completed") && guidedCompleted && feedback.status === "ready" && safetyConfirmed;
    return clone({
      betaPackReady:pack.status === "ready" || pack.status === "completed",
      guidedCompleted:guidedCompleted,
      feedbackReviewed:feedback.status === "ready",
      feedbackNeedsReview:feedbackNeedsReview,
      safetyConfirmed:safetyConfirmed,
      safeToAdvance:allReady,
      blocked:blocked,
      redacted:true
    });
  }
  function statusFor(health) {
    if (health.blocked) return "blocked";
    if (health.feedbackNeedsReview) return "needs_review";
    if (!health.guidedCompleted) return "in_progress";
    return health.safeToAdvance ? "completed" : "needs_review";
  }
  function buildFlightWorkflowAcceptanceSessionRows(input) {
    const pack = packOf(input || {});
    const guided = guidedOf(input || {});
    const feedback = feedbackOf(input || {});
    const health = evaluateFlightWorkflowAcceptanceSession(input || {});
    return clone([
      row("beta_pack", "只读 Beta 验收包", pack.status || "needs_review", pack.userFacingSummary && pack.userFacingSummary.resultLabel || "仍需复核"),
      row("guided_test", "只读 Beta 用户测试", guided.status || "not_started", guided.userFacingSummary && guided.userFacingSummary.resultLabel || "验收进行中"),
      row("feedback", "测试反馈汇总", feedback.status || "needs_review", feedback.userFacingSummary && feedback.userFacingSummary.resultLabel || "仍需补充反馈"),
      row("safety", "安全确认", health.safetyConfirmed ? "completed" : "needs_review", health.safetyConfirmed ? "本次验收已完成" : "仍需复核")
    ]);
  }
  function buildFlightWorkflowAcceptanceSessionSummary(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowAcceptanceSessionSummary({ status:"failed_safe" });
      const health = evaluateFlightWorkflowAcceptanceSession(input);
      const status = statusFor(health);
      const recommendation = status === "completed" ? "本次验收已完成" : (status === "in_progress" ? "验收进行中" : (status === "blocked" ? "验收已阻断" : "仍需复核"));
      return sanitizeFlightWorkflowAcceptanceSessionSummary({
        status:status,
        sessionHealth:health,
        rows:buildFlightWorkflowAcceptanceSessionRows(input),
        nextStepRecommendation:recommendation,
        userFacingSummary:{ title:"验收会话摘要", resultLabel:recommendation, caveat:"验收复核只用于改进只读候选证据流程，不代表真实票价、库存或可出票。", redacted:true },
        redacted:true
      });
    } catch (error) {
      return sanitizeFlightWorkflowAcceptanceSessionSummary({ status:"failed_safe" });
    }
  }
  function sanitizeFlightWorkflowAcceptanceSessionSummary(summary) {
    const safe = summary && typeof summary === "object" ? summary : {};
    return clone({
      summaryName:SUMMARY_NAME,
      appVersion:FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY_VERSION,
      status:safeStatus(safe.status, "failed_safe"),
      sessionHealth:clone(safe.sessionHealth || evaluateFlightWorkflowAcceptanceSession({})),
      rows:toArray(safe.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.status || "needs_review", item.message || ""); }),
      nextStepRecommendation:safeText(safe.nextStepRecommendation || "仍需复核"),
      userFacingSummary:Object.assign({ title:"验收会话摘要", resultLabel:"仍需复核", caveat:"验收复核只用于改进只读候选证据流程，不代表真实票价、库存或可出票。", redacted:true }, safe.userFacingSummary || {}),
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
  function buildFlightWorkflowAcceptanceSessionSummaryAuditDraft(input) {
    const summary = buildFlightWorkflowAcceptanceSessionSummary(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY_AUDIT_DRAFT", summaryName:SUMMARY_NAME, appVersion:FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY_VERSION, status:summary.status, rowCount:summary.rows.length, nextStepRecommendation:summary.nextStepRecommendation, rawUserTextStored:false, secretStored:false, bookingUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, redacted:true });
  }

  window.WeishanFlightWorkflowAcceptanceSessionSummary = { FLIGHT_WORKFLOW_ACCEPTANCE_SESSION_SUMMARY_VERSION, SUMMARY_NAME, buildFlightWorkflowAcceptanceSessionSummary, evaluateFlightWorkflowAcceptanceSession, buildFlightWorkflowAcceptanceSessionRows, buildFlightWorkflowAcceptanceSessionSummaryAuditDraft, sanitizeFlightWorkflowAcceptanceSessionSummary };
})();
