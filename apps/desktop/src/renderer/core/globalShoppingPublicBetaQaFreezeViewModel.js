;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_VIEW_MODEL_VERSION = "4.2.3";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_qa_freeze_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
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

  function buildGlobalShoppingQaFreezeRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaCandidateQaFreezeSummary", "WeishanGlobalShoppingPublicBetaCandidateQaFreeze", "buildGlobalShoppingPublicBetaCandidateQaFreeze");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("public_beta_candidate_qa_freeze_missing", "Public Beta Candidate QA Freeze", "Public Beta Candidate QA Freeze 仍需复核", "warning")];
  }
  function buildGlobalShoppingFeedbackIntakeRowsForView(input) {
    const summary = resolveSummary(input, "trialFeedbackIntakeMockSummary", "WeishanGlobalShoppingTrialFeedbackIntakeMock", "buildGlobalShoppingTrialFeedbackIntakeMock");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("trial_feedback_intake_mock_missing", "Trial Feedback Intake Mock", "Trial Feedback Intake Mock 仍需复核", "warning")];
  }
  function buildGlobalShoppingRegressionEvidenceRowsForView(input) {
    const summary = resolveSummary(input, "offlineRegressionEvidenceBoardSummary", "WeishanGlobalShoppingOfflineRegressionEvidenceBoard", "buildGlobalShoppingOfflineRegressionEvidenceBoard");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("offline_regression_evidence_board_missing", "Offline Regression Evidence Board", "Offline Regression Evidence Board 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaQaFreezeCards(input) {
    const qaFreeze = resolveSummary(input, "publicBetaCandidateQaFreezeSummary", "WeishanGlobalShoppingPublicBetaCandidateQaFreeze", "buildGlobalShoppingPublicBetaCandidateQaFreeze");
    const feedbackIntake = resolveSummary(input, "trialFeedbackIntakeMockSummary", "WeishanGlobalShoppingTrialFeedbackIntakeMock", "buildGlobalShoppingTrialFeedbackIntakeMock");
    const regressionEvidence = resolveSummary(input, "offlineRegressionEvidenceBoardSummary", "WeishanGlobalShoppingOfflineRegressionEvidenceBoard", "buildGlobalShoppingOfflineRegressionEvidenceBoard");
    return clone([
      card("public_beta_candidate_qa_freeze", "Public Beta Candidate QA Freeze", text(obj(qaFreeze.userFacingSummary).resultLabel || "Public Beta Candidate QA Freeze 仍需复核")),
      card("trial_feedback_intake_mock", "Trial Feedback Intake Mock", text(obj(feedbackIntake.userFacingSummary).resultLabel || "Trial Feedback Intake Mock 仍需复核")),
      card("offline_regression_evidence_board", "Offline Regression Evidence Board", text(obj(regressionEvidence.userFacingSummary).resultLabel || "Offline Regression Evidence Board 仍需复核")),
      card("qa_freeze", "QA Freeze", "QA 冻结仅为只读范围，不修改配置"),
      card("feedback_intake", "Feedback Intake", "反馈入口仅为 Mock，不保存、不上传、不创建任务"),
      card("regression_evidence", "Regression Evidence", "回归证据仅为只读展示，不生成文件"),
      card("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaQaFreezeRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_qa_freeze_view_model", "Public Beta QA Freeze ViewModel", safe.status === "ready" ? "Public Beta QA Freeze ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta QA Freeze ViewModel 已阻断" : "Public Beta QA Freeze ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("qa_freeze", "QA Freeze", "QA 冻结仅为只读范围，不修改配置", "warning"),
      row("feedback_intake", "Feedback Intake", "反馈入口仅为 Mock，不保存、不上传、不创建任务", "warning"),
      row("regression_evidence", "Regression Evidence", "回归证据仅为只读展示，不生成文件", "warning"),
      row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaQaFreezeViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaCandidateQaFreezeSummary = resolveSummary(safe, "publicBetaCandidateQaFreezeSummary", "WeishanGlobalShoppingPublicBetaCandidateQaFreeze", "buildGlobalShoppingPublicBetaCandidateQaFreeze");
    const trialFeedbackIntakeMockSummary = resolveSummary(safe, "trialFeedbackIntakeMockSummary", "WeishanGlobalShoppingTrialFeedbackIntakeMock", "buildGlobalShoppingTrialFeedbackIntakeMock");
    const offlineRegressionEvidenceBoardSummary = resolveSummary(safe, "offlineRegressionEvidenceBoardSummary", "WeishanGlobalShoppingOfflineRegressionEvidenceBoard", "buildGlobalShoppingOfflineRegressionEvidenceBoard");
    const qaFreezeStatus = normalizeStatus(obj(publicBetaCandidateQaFreezeSummary).status || obj(publicBetaCandidateQaFreezeSummary).qaFreezeStatus, "needs_review");
    const feedbackIntakeStatus = normalizeStatus(obj(trialFeedbackIntakeMockSummary).status || obj(trialFeedbackIntakeMockSummary).intakeStatus, "needs_review");
    const regressionEvidenceStatus = normalizeStatus(obj(offlineRegressionEvidenceBoardSummary).status || obj(offlineRegressionEvidenceBoardSummary).regressionEvidenceStatus, "needs_review");
    const missingRequired = !present(publicBetaCandidateQaFreezeSummary) || !present(trialFeedbackIntakeMockSummary) || !present(offlineRegressionEvidenceBoardSummary);
    const status = qaFreezeStatus === "blocked" || feedbackIntakeStatus === "blocked" || regressionEvidenceStatus === "blocked" ? "blocked" : (missingRequired ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Candidate QA Freeze",
      subtitle:"Trial Feedback Intake Mock",
      cards:buildGlobalShoppingPublicBetaQaFreezeCards({
        publicBetaCandidateQaFreezeSummary:publicBetaCandidateQaFreezeSummary,
        trialFeedbackIntakeMockSummary:trialFeedbackIntakeMockSummary,
        offlineRegressionEvidenceBoardSummary:offlineRegressionEvidenceBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaQaFreezeRows({ status:status }),
      qaFreezeRows:buildGlobalShoppingQaFreezeRowsForView({ publicBetaCandidateQaFreezeSummary:publicBetaCandidateQaFreezeSummary }),
      feedbackIntakeRows:buildGlobalShoppingFeedbackIntakeRowsForView({ trialFeedbackIntakeMockSummary:trialFeedbackIntakeMockSummary }),
      regressionEvidenceRows:buildGlobalShoppingRegressionEvidenceRowsForView({ offlineRegressionEvidenceBoardSummary:offlineRegressionEvidenceBoardSummary }),
      publicBetaCandidateQaFreezeSummary:publicBetaCandidateQaFreezeSummary,
      trialFeedbackIntakeMockSummary:trialFeedbackIntakeMockSummary,
      offlineRegressionEvidenceBoardSummary:offlineRegressionEvidenceBoardSummary,
      manualReviewRequired:true,
      safeToProceedWithManualQaFreezeReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta QA Freeze ViewModel",
        resultLabel:status === "ready" ? "Public Beta Candidate QA Freeze / Trial Feedback Intake Mock / Offline Regression Evidence Board 已准备" : (status === "blocked" ? "Public Beta QA Freeze ViewModel 已阻断" : "Public Beta QA Freeze ViewModel 仍需复核"),
        caveat:"不输出真实反馈提交、任务创建、issue 创建、反馈发送、上传、下单、付款、出票、provider、release、push、launch 入口。"
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
      feedbackSubmitEnabled:false,
      uploadEnabled:false,
      issueCreateEnabled:false,
      taskCreateEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaQaFreezeViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaQaFreezeViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualQaFreezeReview:safe.safeToProceedWithManualQaFreezeReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaQaFreezeViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaQaFreezeViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaQaFreezeViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaQaFreezeViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaQaFreezeViewModel,
    buildGlobalShoppingPublicBetaQaFreezeCards,
    buildGlobalShoppingPublicBetaQaFreezeRows,
    buildGlobalShoppingQaFreezeRowsForView,
    buildGlobalShoppingFeedbackIntakeRowsForView,
    buildGlobalShoppingRegressionEvidenceRowsForView,
    buildGlobalShoppingPublicBetaQaFreezeViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaQaFreezeViewModel
  };
})();
