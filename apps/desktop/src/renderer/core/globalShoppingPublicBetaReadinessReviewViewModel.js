;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_REVIEW_VIEW_MODEL_VERSION = "4.2.3";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_readiness_review_view_model_v1";

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

  function buildGlobalShoppingReadinessSnapshotRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaReadinessSnapshotSummary", "WeishanGlobalShoppingPublicBetaReadinessSnapshot", "buildGlobalShoppingPublicBetaReadinessSnapshot");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("public_beta_readiness_snapshot_missing", "Public Beta Readiness Snapshot", "Public Beta Readiness Snapshot 仍需复核", "warning")];
  }
  function buildGlobalShoppingFeedbackReviewQueueRowsForView(input) {
    const summary = resolveSummary(input, "manualFeedbackReviewQueueMockSummary", "WeishanGlobalShoppingManualFeedbackReviewQueueMock", "buildGlobalShoppingManualFeedbackReviewQueueMock");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("manual_feedback_review_queue_mock_missing", "Manual Feedback Review Queue Mock", "Manual Feedback Review Queue Mock 仍需复核", "warning")];
  }
  function buildGlobalShoppingIssueTriageRowsForView(input) {
    const summary = resolveSummary(input, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("offline_issue_triage_board_missing", "Offline Issue Triage Board", "Offline Issue Triage Board 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaReadinessReviewCards(input) {
    const readinessSnapshot = resolveSummary(input, "publicBetaReadinessSnapshotSummary", "WeishanGlobalShoppingPublicBetaReadinessSnapshot", "buildGlobalShoppingPublicBetaReadinessSnapshot");
    const feedbackReviewQueue = resolveSummary(input, "manualFeedbackReviewQueueMockSummary", "WeishanGlobalShoppingManualFeedbackReviewQueueMock", "buildGlobalShoppingManualFeedbackReviewQueueMock");
    const issueTriageBoard = resolveSummary(input, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    return clone([
      card("public_beta_readiness_snapshot", "Public Beta Readiness Snapshot", text(obj(readinessSnapshot.userFacingSummary).resultLabel || "Public Beta Readiness Snapshot 仍需复核")),
      card("manual_feedback_review_queue_mock", "Manual Feedback Review Queue Mock", text(obj(feedbackReviewQueue.userFacingSummary).resultLabel || "Manual Feedback Review Queue Mock 仍需复核")),
      card("offline_issue_triage_board", "Offline Issue Triage Board", text(obj(issueTriageBoard.userFacingSummary).resultLabel || "Offline Issue Triage Board 仍需复核")),
      card("readiness_snapshot", "Readiness Snapshot", "准备快照仅为只读展示，不生成文件"),
      card("feedback_review_queue", "Feedback Review Queue", "反馈复核队列仅为 Mock，不保存、不上传、不创建 issue/task"),
      card("issue_triage", "Issue Triage", "问题分级仅为离线展示，不创建真实任务"),
      card("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaReadinessReviewRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_readiness_review_view_model", "Public Beta Readiness Review ViewModel", safe.status === "ready" ? "Public Beta Readiness Review ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta Readiness Review ViewModel 已阻断" : "Public Beta Readiness Review ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("readiness_snapshot", "Readiness Snapshot", "准备快照仅为只读展示，不生成文件", "warning"),
      row("feedback_review_queue", "Feedback Review Queue", "反馈复核队列仅为 Mock，不保存、不上传、不创建 issue/task", "warning"),
      row("issue_triage", "Issue Triage", "问题分级仅为离线展示，不创建真实任务", "warning"),
      row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaReadinessReviewViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaReadinessSnapshotSummary = resolveSummary(safe, "publicBetaReadinessSnapshotSummary", "WeishanGlobalShoppingPublicBetaReadinessSnapshot", "buildGlobalShoppingPublicBetaReadinessSnapshot");
    const manualFeedbackReviewQueueMockSummary = resolveSummary(safe, "manualFeedbackReviewQueueMockSummary", "WeishanGlobalShoppingManualFeedbackReviewQueueMock", "buildGlobalShoppingManualFeedbackReviewQueueMock");
    const offlineIssueTriageBoardSummary = resolveSummary(safe, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    const readinessSnapshotStatus = normalizeStatus(obj(publicBetaReadinessSnapshotSummary).status || obj(publicBetaReadinessSnapshotSummary).readinessSnapshotStatus, "needs_review");
    const manualFeedbackReviewQueueStatus = normalizeStatus(obj(manualFeedbackReviewQueueMockSummary).status || obj(manualFeedbackReviewQueueMockSummary).queueStatus, "needs_review");
    const offlineIssueTriageStatus = normalizeStatus(obj(offlineIssueTriageBoardSummary).status || obj(offlineIssueTriageBoardSummary).triageStatus, "needs_review");
    const missingRequired = !present(publicBetaReadinessSnapshotSummary) || !present(manualFeedbackReviewQueueMockSummary) || !present(offlineIssueTriageBoardSummary);
    const status = readinessSnapshotStatus === "blocked" || manualFeedbackReviewQueueStatus === "blocked" || offlineIssueTriageStatus === "blocked" ? "blocked" : (missingRequired ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Readiness Snapshot",
      subtitle:"Manual Feedback Review Queue Mock",
      cards:buildGlobalShoppingPublicBetaReadinessReviewCards({
        publicBetaReadinessSnapshotSummary:publicBetaReadinessSnapshotSummary,
        manualFeedbackReviewQueueMockSummary:manualFeedbackReviewQueueMockSummary,
        offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaReadinessReviewRows({ status:status }),
      readinessSnapshotRows:buildGlobalShoppingReadinessSnapshotRowsForView({ publicBetaReadinessSnapshotSummary:publicBetaReadinessSnapshotSummary }),
      feedbackReviewQueueRows:buildGlobalShoppingFeedbackReviewQueueRowsForView({ manualFeedbackReviewQueueMockSummary:manualFeedbackReviewQueueMockSummary }),
      issueTriageRows:buildGlobalShoppingIssueTriageRowsForView({ offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary }),
      publicBetaReadinessSnapshotSummary:publicBetaReadinessSnapshotSummary,
      manualFeedbackReviewQueueMockSummary:manualFeedbackReviewQueueMockSummary,
      offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary,
      manualReviewRequired:true,
      safeToProceedWithManualReadinessReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Readiness Review ViewModel",
        resultLabel:status === "ready" ? "Public Beta Readiness Snapshot / Manual Feedback Review Queue Mock / Offline Issue Triage Board 已准备" : (status === "blocked" ? "Public Beta Readiness Review ViewModel 已阻断" : "Public Beta Readiness Review ViewModel 仍需复核"),
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

  function buildGlobalShoppingPublicBetaReadinessReviewViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaReadinessReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_REVIEW_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualReadinessReview:safe.safeToProceedWithManualReadinessReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaReadinessReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaReadinessReviewViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaReadinessReviewViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaReadinessReviewViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_READINESS_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaReadinessReviewViewModel,
    buildGlobalShoppingPublicBetaReadinessReviewCards,
    buildGlobalShoppingPublicBetaReadinessReviewRows,
    buildGlobalShoppingReadinessSnapshotRowsForView,
    buildGlobalShoppingFeedbackReviewQueueRowsForView,
    buildGlobalShoppingIssueTriageRowsForView,
    buildGlobalShoppingPublicBetaReadinessReviewViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaReadinessReviewViewModel
  };
})();
