;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_VIEW_MODEL_VERSION = "4.1.3";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_manual_qa_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }

  function buildGlobalShoppingManualQaReportRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_manual_qa_report_center_missing", "Public Beta Manual QA Report Center", "Public Beta Manual QA Report Center 仍需复核", "warning")];
  }

  function buildGlobalShoppingFeedbackSafetyRowsForView(input) {
    const summary = resolveSummary(input, "trialFeedbackSafetyGateSummary", "WeishanGlobalShoppingTrialFeedbackSafetyGate", "buildGlobalShoppingTrialFeedbackSafetyGate");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("trial_feedback_safety_gate_missing", "Trial Feedback Safety Gate", "Trial Feedback Safety Gate 仍需复核", "warning")];
  }

  function buildGlobalShoppingRcEvidenceSnapshotRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaRcEvidenceSnapshotSummary", "WeishanGlobalShoppingPublicBetaRcEvidenceSnapshot", "buildGlobalShoppingPublicBetaRcEvidenceSnapshot");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_rc_evidence_snapshot_missing", "RC Evidence Snapshot", "RC Evidence Snapshot 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaManualQaCards(input) {
    const safe = obj(input);
    const manualQa = resolveSummary(safe, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    const feedbackGate = resolveSummary(safe, "trialFeedbackSafetyGateSummary", "WeishanGlobalShoppingTrialFeedbackSafetyGate", "buildGlobalShoppingTrialFeedbackSafetyGate");
    const snapshot = resolveSummary(safe, "publicBetaRcEvidenceSnapshotSummary", "WeishanGlobalShoppingPublicBetaRcEvidenceSnapshot", "buildGlobalShoppingPublicBetaRcEvidenceSnapshot");
    return clone([
      card("public_beta_manual_qa_report_center", "Public Beta Manual QA Report Center", text(obj(manualQa.userFacingSummary).resultLabel || "Public Beta Manual QA Report Center 仍需复核")),
      card("trial_feedback_safety_gate", "Trial Feedback Safety Gate", text(obj(feedbackGate.userFacingSummary).resultLabel || "Trial Feedback Safety Gate 仍需复核")),
      card("public_beta_rc_evidence_snapshot", "RC Evidence Snapshot", text(obj(snapshot.userFacingSummary).resultLabel || "RC Evidence Snapshot 仍需复核")),
      card("qa_evidence", "QA Evidence", text(manualQa.validationSummary || "人工 QA 结果待确认")),
      card("feedback_safety", "Feedback Safety", "反馈仍为草稿，不发送、不上传、不保存用户原文"),
      card("no_transaction_evidence", "No-Transaction Evidence", text(obj(obj(snapshot.noTransactionEvidence).userFacingSummary).resultLabel || "No-Transaction Regression Guard 仍需复核")),
      card("manual_review_required", "Manual Review Required", "人工 QA 后再决定下一阶段")
    ]);
  }

  function buildGlobalShoppingPublicBetaManualQaRows(input) {
    const safe = obj(input);
    const status = text(safe.status || "needs_review");
    return clone([
      row("public_beta_manual_qa_view_model_status", "Public Beta Manual QA ViewModel", status === "ready" ? "Public Beta Manual QA ViewModel 已准备" : (status === "blocked" ? "Public Beta Manual QA ViewModel 已阻断" : "Public Beta Manual QA ViewModel 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_manual_qa_view_model_feedback", "Feedback Safety", "反馈仍为草稿，不发送、不上传、不保存用户原文", "warning"),
      row("public_beta_manual_qa_view_model_snapshot", "RC Evidence Snapshot", "RC 证据快照不写文件、不导出", "warning"),
      row("public_beta_manual_qa_view_model_review", "Manual Review Required", "人工 QA 后再决定下一阶段", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaManualQaViewModel(viewModel) {
    const safe = obj(viewModel);
    const hasManualQa = present(safe.publicBetaManualQaReportCenterSummary);
    const hasFeedbackGate = present(safe.trialFeedbackSafetyGateSummary);
    const hasSnapshot = present(safe.publicBetaRcEvidenceSnapshotSummary);
    const manualQa = resolveSummary(safe, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    const feedbackGate = resolveSummary(safe, "trialFeedbackSafetyGateSummary", "WeishanGlobalShoppingTrialFeedbackSafetyGate", "buildGlobalShoppingTrialFeedbackSafetyGate");
    const snapshot = resolveSummary(safe, "publicBetaRcEvidenceSnapshotSummary", "WeishanGlobalShoppingPublicBetaRcEvidenceSnapshot", "buildGlobalShoppingPublicBetaRcEvidenceSnapshot");
    const statuses = [text(manualQa.status || "needs_review"), text(feedbackGate.status || "needs_review"), text(snapshot.status || "needs_review")];
    const status = statuses.some(function (item) { return item === "blocked"; })
      ? "blocked"
      : (!hasManualQa || !hasFeedbackGate || !hasSnapshot || statuses.some(function (item) { return item !== "ready"; }) ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_VIEW_MODEL_VERSION,
      status,
      title:"Public Beta Manual QA Report Center",
      subtitle:"Trial Feedback Safety Gate",
      cards:buildGlobalShoppingPublicBetaManualQaCards({
        publicBetaManualQaReportCenterSummary:manualQa,
        trialFeedbackSafetyGateSummary:feedbackGate,
        publicBetaRcEvidenceSnapshotSummary:snapshot
      }),
      rows:buildGlobalShoppingPublicBetaManualQaRows({ status:status }),
      manualQaReportRows:buildGlobalShoppingManualQaReportRowsForView({ publicBetaManualQaReportCenterSummary:manualQa }),
      feedbackSafetyRows:buildGlobalShoppingFeedbackSafetyRowsForView({ trialFeedbackSafetyGateSummary:feedbackGate }),
      rcEvidenceSnapshotRows:buildGlobalShoppingRcEvidenceSnapshotRowsForView({ publicBetaRcEvidenceSnapshotSummary:snapshot }),
      publicBetaManualQaReportCenterSummary:manualQa,
      trialFeedbackSafetyGateSummary:feedbackGate,
      publicBetaRcEvidenceSnapshotSummary:snapshot,
      manualReviewRequired:true,
      safeToProceedWithManualQaReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Manual QA ViewModel",
        resultLabel:status === "ready" ? "Public Beta Manual QA Report Center / Trial Feedback Safety Gate / RC Evidence Snapshot 已准备" : (status === "blocked" ? "Public Beta Manual QA ViewModel 已阻断" : "Public Beta Manual QA ViewModel 仍需复核"),
        caveat:"不输出报告导出、反馈发送、上传、发布、push 或 provider 入口。"
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

  function buildGlobalShoppingPublicBetaManualQaViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaManualQaViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualQaReview:safe.safeToProceedWithManualQaReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaManualQaViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaManualQaViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaManualQaViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaManualQaViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_MANUAL_QA_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaManualQaViewModel,
    buildGlobalShoppingPublicBetaManualQaCards,
    buildGlobalShoppingPublicBetaManualQaRows,
    buildGlobalShoppingManualQaReportRowsForView,
    buildGlobalShoppingFeedbackSafetyRowsForView,
    buildGlobalShoppingRcEvidenceSnapshotRowsForView,
    buildGlobalShoppingPublicBetaManualQaViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaManualQaViewModel
  };
})();
