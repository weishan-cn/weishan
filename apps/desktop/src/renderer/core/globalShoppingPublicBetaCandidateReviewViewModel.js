;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_REVIEW_VIEW_MODEL_VERSION = "4.2.1";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_candidate_review_view_model_v1";

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
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }

  function buildGlobalShoppingCandidateEvidenceReviewRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaCandidateEvidenceReviewSummary", "WeishanGlobalShoppingPublicBetaCandidateEvidenceReview", "buildGlobalShoppingPublicBetaCandidateEvidenceReview");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("public_beta_candidate_evidence_review_missing", "Public Beta Candidate Evidence Review", "Public Beta Candidate Evidence Review 仍需复核", "warning")];
  }

  function buildGlobalShoppingTrialOperatorNotesRowsForView(input) {
    const summary = resolveSummary(input, "trialOperatorNotesPanelSummary", "WeishanGlobalShoppingTrialOperatorNotesPanel", "buildGlobalShoppingTrialOperatorNotesPanel");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("trial_operator_notes_panel_missing", "Trial Operator Notes Panel", "Trial Operator Notes Panel 仍需复核", "warning")];
  }

  function buildGlobalShoppingSafetyDeltaRowsForView(input) {
    const summary = resolveSummary(input, "offlineSafetyDeltaBoardSummary", "WeishanGlobalShoppingOfflineSafetyDeltaBoard", "buildGlobalShoppingOfflineSafetyDeltaBoard");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("offline_safety_delta_board_missing", "Offline Safety Delta Board", "Offline Safety Delta Board 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaCandidateReviewCards(input) {
    const evidenceReview = resolveSummary(input, "publicBetaCandidateEvidenceReviewSummary", "WeishanGlobalShoppingPublicBetaCandidateEvidenceReview", "buildGlobalShoppingPublicBetaCandidateEvidenceReview");
    const notesPanel = resolveSummary(input, "trialOperatorNotesPanelSummary", "WeishanGlobalShoppingTrialOperatorNotesPanel", "buildGlobalShoppingTrialOperatorNotesPanel");
    const safetyDelta = resolveSummary(input, "offlineSafetyDeltaBoardSummary", "WeishanGlobalShoppingOfflineSafetyDeltaBoard", "buildGlobalShoppingOfflineSafetyDeltaBoard");
    return clone([
      card("public_beta_candidate_evidence_review", "Public Beta Candidate Evidence Review", text(obj(evidenceReview.userFacingSummary).resultLabel || "Public Beta Candidate Evidence Review 仍需复核")),
      card("trial_operator_notes_panel", "Trial Operator Notes Panel", text(obj(notesPanel.userFacingSummary).resultLabel || "Trial Operator Notes Panel 仍需复核")),
      card("offline_safety_delta_board", "Offline Safety Delta Board", text(obj(safetyDelta.userFacingSummary).resultLabel || "Offline Safety Delta Board 仍需复核")),
      card("candidate_evidence", "Candidate Evidence", "候选证据仅为只读复核，不写文件"),
      card("operator_notes", "Operator Notes", "运营备注不保存、不上传、不创建任务"),
      card("safety_delta", "Safety Delta", "安全边界未扩大"),
      card("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch 仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaCandidateReviewRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_candidate_review_view_model", "Public Beta Candidate Review ViewModel", safe.status === "ready" ? "Public Beta Candidate Review ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta Candidate Review ViewModel 已阻断" : "Public Beta Candidate Review ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("candidate_evidence", "Candidate Evidence", "候选证据仅为只读复核，不写文件", "warning"),
      row("operator_notes", "Operator Notes", "运营备注不保存、不上传、不创建任务", "warning"),
      row("safety_delta", "Safety Delta", "安全边界未扩大", "warning"),
      row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch 仍保持关闭", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaCandidateReviewViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaCandidateEvidenceReviewSummary = resolveSummary(safe, "publicBetaCandidateEvidenceReviewSummary", "WeishanGlobalShoppingPublicBetaCandidateEvidenceReview", "buildGlobalShoppingPublicBetaCandidateEvidenceReview");
    const trialOperatorNotesPanelSummary = resolveSummary(safe, "trialOperatorNotesPanelSummary", "WeishanGlobalShoppingTrialOperatorNotesPanel", "buildGlobalShoppingTrialOperatorNotesPanel");
    const offlineSafetyDeltaBoardSummary = resolveSummary(safe, "offlineSafetyDeltaBoardSummary", "WeishanGlobalShoppingOfflineSafetyDeltaBoard", "buildGlobalShoppingOfflineSafetyDeltaBoard");
    const evidenceStatus = normalizeStatus(obj(publicBetaCandidateEvidenceReviewSummary).evidenceReviewStatus || obj(publicBetaCandidateEvidenceReviewSummary).status, "needs_review");
    const notesStatus = normalizeStatus(obj(trialOperatorNotesPanelSummary).notesStatus || obj(trialOperatorNotesPanelSummary).status, "needs_review");
    const deltaStatus = normalizeStatus(obj(offlineSafetyDeltaBoardSummary).deltaStatus || obj(offlineSafetyDeltaBoardSummary).status, "needs_review");
    const missingRequired = !present(publicBetaCandidateEvidenceReviewSummary) || !present(trialOperatorNotesPanelSummary) || !present(offlineSafetyDeltaBoardSummary);
    const status = evidenceStatus === "blocked" || notesStatus === "blocked" || deltaStatus === "blocked"
      ? "blocked"
      : (missingRequired ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Candidate Evidence Review",
      subtitle:"Trial Operator Notes Panel",
      cards:buildGlobalShoppingPublicBetaCandidateReviewCards({
        publicBetaCandidateEvidenceReviewSummary:publicBetaCandidateEvidenceReviewSummary,
        trialOperatorNotesPanelSummary:trialOperatorNotesPanelSummary,
        offlineSafetyDeltaBoardSummary:offlineSafetyDeltaBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaCandidateReviewRows({ status:status }),
      candidateEvidenceRows:buildGlobalShoppingCandidateEvidenceReviewRowsForView({ publicBetaCandidateEvidenceReviewSummary:publicBetaCandidateEvidenceReviewSummary }),
      trialOperatorNotesRows:buildGlobalShoppingTrialOperatorNotesRowsForView({ trialOperatorNotesPanelSummary:trialOperatorNotesPanelSummary }),
      safetyDeltaRows:buildGlobalShoppingSafetyDeltaRowsForView({ offlineSafetyDeltaBoardSummary:offlineSafetyDeltaBoardSummary }),
      publicBetaCandidateEvidenceReviewSummary:publicBetaCandidateEvidenceReviewSummary,
      trialOperatorNotesPanelSummary:trialOperatorNotesPanelSummary,
      offlineSafetyDeltaBoardSummary:offlineSafetyDeltaBoardSummary,
      manualReviewRequired:true,
      safeToProceedWithManualCandidateEvidenceReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Candidate Review ViewModel",
        resultLabel:status === "ready" ? "Public Beta Candidate Evidence Review / Trial Operator Notes Panel / Offline Safety Delta Board 已准备" : (status === "blocked" ? "Public Beta Candidate Review ViewModel 已阻断" : "Public Beta Candidate Review ViewModel 仍需复核"),
        caveat:"不输出任务创建、issue 创建、反馈发送、上传、下单、付款、出票、provider、release、push、launch 入口。"
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

  function buildGlobalShoppingPublicBetaCandidateReviewViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaCandidateReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_REVIEW_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualCandidateEvidenceReview:safe.safeToProceedWithManualCandidateEvidenceReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaCandidateReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaCandidateReviewViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaCandidateReviewViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaCandidateReviewViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_CANDIDATE_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaCandidateReviewViewModel,
    buildGlobalShoppingPublicBetaCandidateReviewCards,
    buildGlobalShoppingPublicBetaCandidateReviewRows,
    buildGlobalShoppingCandidateEvidenceReviewRowsForView,
    buildGlobalShoppingTrialOperatorNotesRowsForView,
    buildGlobalShoppingSafetyDeltaRowsForView,
    buildGlobalShoppingPublicBetaCandidateReviewViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaCandidateReviewViewModel
  };
})();
