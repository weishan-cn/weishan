;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION = "4.1.6";
  const VIEW_MODEL_NAME = "flight_workflow_beta_acceptance_review_view_model_v1";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function feedbackOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.feedbackReviewSummary) return safe.feedbackReviewSummary;
    const api = window.WeishanFlightWorkflowBetaFeedbackReviewCenter || {};
    return typeof api.buildFlightWorkflowBetaFeedbackReviewCenter === "function" ? api.buildFlightWorkflowBetaFeedbackReviewCenter(safe) : { status:"needs_review", findings:[], userFacingSummary:{ resultLabel:"仍需补充反馈", redacted:true }, redacted:true };
  }
  function sessionOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.acceptanceSessionSummary) return safe.acceptanceSessionSummary;
    const api = window.WeishanFlightWorkflowAcceptanceSessionSummary || {};
    return typeof api.buildFlightWorkflowAcceptanceSessionSummary === "function" ? api.buildFlightWorkflowAcceptanceSessionSummary(safe) : { status:"needs_review", rows:[], nextStepRecommendation:"仍需复核", userFacingSummary:{ resultLabel:"仍需复核", redacted:true }, redacted:true };
  }
  function card(cardId, label, value, severity) { return { cardId:cardId, label:label, value:safeText(value), severity:severity || "info", redacted:true }; }
  function buildFlightWorkflowBetaFeedbackReviewCards(input) {
    const feedback = feedbackOf(input || {});
    const session = sessionOf(input || {});
    return clone([
      card("feedback", "测试反馈汇总", feedback.userFacingSummary && feedback.userFacingSummary.resultLabel || feedback.status || "仍需补充反馈", feedback.status === "ready" ? "info" : "warning"),
      card("session", "验收会话摘要", session.userFacingSummary && session.userFacingSummary.resultLabel || session.status || "仍需复核", session.status === "completed" ? "info" : "warning"),
      card("safety", "安全限制", "不会付款、不会下单、不会出票", "info")
    ]);
  }
  function buildFlightWorkflowAcceptanceSessionRows(input) {
    const session = sessionOf(input || {});
    return clone(toArray(session.rows).map(function (item) {
      return { rowId:safeText(item.rowId || "row"), label:safeText(item.label || ""), value:safeText(item.status || ""), message:safeText(item.message || ""), redacted:true };
    }));
  }
  function statusFor(feedback, session) {
    if (feedback.status === "blocked" || session.status === "blocked" || feedback.status === "failed_safe" || session.status === "failed_safe") return "blocked";
    if (session.status === "completed" && feedback.status === "ready") return "completed";
    if (session.status === "in_progress") return "in_progress";
    return "needs_review";
  }
  function buildFlightWorkflowBetaAcceptanceReviewViewModel(input) {
    const feedback = feedbackOf(input || {});
    const session = sessionOf(input || {});
    const status = statusFor(feedback, session);
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"只读 Beta 验收复核",
      cards:buildFlightWorkflowBetaFeedbackReviewCards({ feedbackReviewSummary:feedback, acceptanceSessionSummary:session }),
      rows:buildFlightWorkflowAcceptanceSessionRows({ acceptanceSessionSummary:session }),
      findings:toArray(feedback.findings).map(function (item) { return { findingId:safeText(item.findingId || "finding"), severity:safeText(item.severity || "warning"), title:safeText(item.title || ""), message:safeText(item.message || ""), redacted:true }; }),
      nextStepLabel:safeText(session.nextStepRecommendation || "仍需复核"),
      caveat:"验收复核只用于改进只读候选证据流程，不代表真实票价、库存或可出票。",
      safety:safety(),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawResponseStored:false,
      rawUserTextStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      redacted:true
    });
  }
  function buildFlightWorkflowBetaAcceptanceReviewViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowBetaAcceptanceReviewViewModel(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION, status:vm.status, cardCount:vm.cards.length, rowCount:vm.rows.length, findingCount:vm.findings.length, rawUserTextStored:false, secretStored:false, bookingUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, redacted:true });
  }

  window.WeishanFlightWorkflowBetaAcceptanceReviewViewModel = { FLIGHT_WORKFLOW_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowBetaAcceptanceReviewViewModel, buildFlightWorkflowBetaFeedbackReviewCards, buildFlightWorkflowAcceptanceSessionRows, buildFlightWorkflowBetaAcceptanceReviewViewModelAuditDraft };
})();
