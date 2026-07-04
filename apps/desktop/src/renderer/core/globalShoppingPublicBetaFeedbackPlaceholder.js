;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_FEEDBACK_PLACEHOLDER_VERSION = "4.2.5";
  const PLACEHOLDER_NAME = "global_shopping_public_beta_feedback_placeholder_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, feedback_placeholder_only:true };
  const BLOCKED_TEXT_RE = /feedback sent|uploaded|saved raw user text|external form|token|key|secret/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "feedback_placeholder_only");
    return ALLOWED_MODES[mode] ? mode : "feedback_placeholder_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.feedbackEnabled === true) reasons.push("feedback_enabled");
    if (safe.uploadEnabled === true) reasons.push("upload_enabled");
    if (safe.emailEnabled === true) reasons.push("email_enabled");
    if (safe.rawUserTextPersistence === true) reasons.push("raw_user_text_persistence");
    if (safe.externalFormUrl != null) reasons.push("external_form_url_detected");
    if (BLOCKED_TEXT_RE.test(JSON.stringify(safe))) reasons.push("forbidden_claim_detected");
    return reasons;
  }

  function buildGlobalShoppingPublicBetaFeedbackRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("public_beta_feedback_placeholder_status", "Feedback Placeholder", status === "ready" ? "Feedback Placeholder 已准备" : (status === "blocked" ? "Feedback Placeholder 已阻断" : "Feedback Placeholder 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_feedback_placeholder_copy", "反馈入口说明", "反馈入口暂不发送、不上传、不保存用户原文", "warning"),
      row("public_beta_feedback_placeholder_boundary", "Manual Review Required", "不保存反馈内容", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaFeedbackSections(input) {
    const safe = obj(input);
    return clone([
      { sectionId:"feedback_boundary", title:"Feedback Placeholder", summary:text(safe.feedbackSummary || "反馈入口暂不发送、不上传、不保存用户原文"), status:safeStatus(safe.status), redacted:true }
    ]);
  }

  function evaluateGlobalShoppingPublicBetaFeedbackPlaceholder(input) {
    const safe = obj(input);
    const blockedReasons = detectBlockedReasons(safe);
    const status = blockedReasons.length > 0 ? "blocked" : "ready";
    return clone({
      placeholderName:PLACEHOLDER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FEEDBACK_PLACEHOLDER_VERSION,
      placeholderMode:safeMode(safe.placeholderMode),
      status,
      title:"Feedback Placeholder",
      feedbackEnabled:false,
      uploadEnabled:false,
      emailEnabled:false,
      externalFormUrl:null,
      rawUserTextPersistence:false,
      manualReviewRequired:true,
      rows:buildGlobalShoppingPublicBetaFeedbackRows({ status }),
      sections:buildGlobalShoppingPublicBetaFeedbackSections({ status }),
      blockedReasons,
      userFacingSummary:{
        title:"Feedback Placeholder",
        resultLabel:status === "ready" ? "Feedback Placeholder 已准备" : "Feedback Placeholder 已阻断",
        caveat:"反馈入口暂不发送、不上传、不保存用户原文。"
      },
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaFeedbackPlaceholderAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaFeedbackPlaceholder(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_FEEDBACK_PLACEHOLDER_AUDIT_DRAFT",
      placeholderName:PLACEHOLDER_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_FEEDBACK_PLACEHOLDER_VERSION,
      status:safe.status,
      feedbackEnabled:false,
      uploadEnabled:false,
      emailEnabled:false,
      rawUserTextPersistence:false,
      externalFormUrl:null,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaFeedbackPlaceholder(placeholder) {
    return evaluateGlobalShoppingPublicBetaFeedbackPlaceholder(placeholder || {});
  }

  window.WeishanGlobalShoppingPublicBetaFeedbackPlaceholder = {
    GLOBAL_SHOPPING_PUBLIC_BETA_FEEDBACK_PLACEHOLDER_VERSION,
    PLACEHOLDER_NAME,
    buildGlobalShoppingPublicBetaFeedbackPlaceholder:sanitizeGlobalShoppingPublicBetaFeedbackPlaceholder,
    evaluateGlobalShoppingPublicBetaFeedbackPlaceholder,
    buildGlobalShoppingPublicBetaFeedbackRows,
    buildGlobalShoppingPublicBetaFeedbackSections,
    buildGlobalShoppingPublicBetaFeedbackPlaceholderAuditDraft,
    sanitizeGlobalShoppingPublicBetaFeedbackPlaceholder
  };
})();
