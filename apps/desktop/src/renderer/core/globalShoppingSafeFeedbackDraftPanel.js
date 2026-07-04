;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SAFE_FEEDBACK_DRAFT_PANEL_VERSION = "4.2.5";
  const PANEL_NAME = "global_shopping_safe_feedback_draft_panel_v1";
  const ALLOWED_MODES = { disabled:true, draft_only:true, readonly:true, offline_mock:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeMode(value) {
    const mode = text(value || "draft_only");
    return ALLOWED_MODES[mode] ? mode : "draft_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function blocked(input) {
    const safe = obj(input);
    return safe.feedbackSent === true
      || safe.uploaded === true
      || safe.savedRawUserText === true
      || safe.rawUserTextPersistence === true
      || safe.externalForm === true
      || safe.externalFormUrl != null
      || safe.emailEnabled === true
      || safe.uploadEnabled === true
      || safe.feedbackEnabled === true
      || safe.mail === true;
  }

  function buildGlobalShoppingSafeFeedbackDraftRows(input) {
    const safe = obj(input);
    return clone([
      row("safe_feedback_draft_status", "Safe Feedback Draft", safe.status === "blocked" ? "Safe Feedback Draft 已阻断" : (safe.status === "ready" ? "Safe Feedback Draft 已准备" : "Safe Feedback Draft 仍需复核"), safe.status === "blocked" ? "blocked" : (safe.status === "ready" ? "pass" : "warning")),
      row("safe_feedback_draft_boundary", "Privacy Boundary", "反馈入口目前仅为草稿，不发送、不上传、不保存用户原文", "warning"),
      row("safe_feedback_draft_switches", "Feedback Enabled", "feedbackEnabled:false / uploadEnabled:false / emailEnabled:false", "pass"),
      row("safe_feedback_draft_rc_boundary", "RC Candidate Boundary", "当前只是 RC 候选，不创建 release、不 push", "warning")
    ]);
  }

  function buildGlobalShoppingSafeFeedbackDraftSections() {
    return clone([
      { sectionId:"safe_feedback_draft_summary", label:"Safe Feedback Draft", value:"反馈入口目前仅为草稿，不发送、不上传、不保存用户原文", redacted:true }
    ]);
  }

  function evaluateGlobalShoppingSafeFeedbackDraftPanel(input) {
    const safe = obj(input);
    const status = blocked(safe) ? "blocked" : "ready";
    return clone({
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_SAFE_FEEDBACK_DRAFT_PANEL_VERSION,
      feedbackMode:safeMode(safe.feedbackMode),
      status,
      title:"Safe Feedback Draft",
      feedbackEnabled:false,
      uploadEnabled:false,
      emailEnabled:false,
      externalFormUrl:null,
      rawUserTextPersistence:false,
      manualReviewRequired:true,
      rows:buildGlobalShoppingSafeFeedbackDraftRows({ status }),
      sections:buildGlobalShoppingSafeFeedbackDraftSections(),
      userFacingSummary:{
        title:"Safe Feedback Draft",
        resultLabel:status === "blocked" ? "Safe Feedback Draft 已阻断" : "Safe Feedback Draft 已准备",
        caveat:"只展示未来反馈能力说明，不真实发送、不上传、不保存用户原文；当前只是 RC 候选，不创建 release、不 push。"
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

  function buildGlobalShoppingSafeFeedbackDraftPanelAuditDraft(input) {
    const safe = evaluateGlobalShoppingSafeFeedbackDraftPanel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SAFE_FEEDBACK_DRAFT_PANEL_AUDIT_DRAFT",
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_SAFE_FEEDBACK_DRAFT_PANEL_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingSafeFeedbackDraftPanel(panel) {
    return evaluateGlobalShoppingSafeFeedbackDraftPanel(panel || {});
  }

  function buildGlobalShoppingSafeFeedbackDraftPanel(input) {
    try {
      return sanitizeGlobalShoppingSafeFeedbackDraftPanel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingSafeFeedbackDraftPanel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSafeFeedbackDraftPanel = {
    GLOBAL_SHOPPING_SAFE_FEEDBACK_DRAFT_PANEL_VERSION,
    PANEL_NAME,
    buildGlobalShoppingSafeFeedbackDraftPanel,
    evaluateGlobalShoppingSafeFeedbackDraftPanel,
    buildGlobalShoppingSafeFeedbackDraftRows,
    buildGlobalShoppingSafeFeedbackDraftSections,
    buildGlobalShoppingSafeFeedbackDraftPanelAuditDraft,
    sanitizeGlobalShoppingSafeFeedbackDraftPanel
  };
})();
