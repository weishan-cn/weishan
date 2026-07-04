;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_QA_OPERATIONS_VIEW_MODEL_VERSION = "4.1.9";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_qa_operations_view_model_v1";

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

  function buildGlobalShoppingPublicBetaQaOperationsCards(input) {
    const ledger = resolveSummary(input, "publicBetaTrialEvidenceLedgerSummary", "WeishanGlobalShoppingPublicBetaTrialEvidenceLedger", "buildGlobalShoppingPublicBetaTrialEvidenceLedger");
    const matrix = resolveSummary(input, "publicBetaQaDecisionMatrixSummary", "WeishanGlobalShoppingPublicBetaQaDecisionMatrix", "buildGlobalShoppingPublicBetaQaDecisionMatrix");
    const triage = resolveSummary(input, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    return clone([
      card("public_beta_trial_evidence_ledger", "Public Beta Trial Evidence Ledger", text(obj(ledger.userFacingSummary).resultLabel || "Public Beta Trial Evidence Ledger 仍需复核")),
      card("public_beta_qa_decision_matrix", "QA Decision Matrix", text(obj(matrix.userFacingSummary).resultLabel || "QA Decision Matrix 仍需复核")),
      card("offline_issue_triage_board", "Offline Issue Triage Board", text(obj(triage.userFacingSummary).resultLabel || "Offline Issue Triage Board 仍需复核")),
      card("allowed_decisions", "Allowed Decisions", "Continue Testing / Manual Review Required"),
      card("blocked_decisions", "Blocked Decisions", "production_ready / auto_publish / enable_provider"),
      card("manual_review_required", "Manual Review Required", "只允许继续测试、人工复核或阻断")
    ]);
  }

  function buildGlobalShoppingPublicBetaQaOperationsRows(input) {
    const safe = obj(input);
    const status = text(safe.status || "needs_review");
    return clone([
      row("public_beta_qa_operations_status", "Public Beta QA Operations View Model", status === "ready" ? "Public Beta QA Operations View Model 已准备" : (status === "blocked" ? "Public Beta QA Operations View Model 已阻断" : "Public Beta QA Operations View Model 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_qa_operations_allowed", "Allowed Decisions", "Continue Testing / Manual Review Required", "warning"),
      row("public_beta_qa_operations_blocked", "Blocked Decisions", "production_ready / auto_publish / enable_provider", "warning"),
      row("public_beta_qa_operations_triage", "Manual Review Items", "问题分流仅为离线视图，不创建真实 issue", "warning"),
      row("public_beta_qa_operations_boundary", "Manual Review Required", "不自动发布、不启用 provider、不启用交易", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaQaOperationsViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaTrialEvidenceLedgerSummary = resolveSummary(safe, "publicBetaTrialEvidenceLedgerSummary", "WeishanGlobalShoppingPublicBetaTrialEvidenceLedger", "buildGlobalShoppingPublicBetaTrialEvidenceLedger");
    const publicBetaQaDecisionMatrixSummary = resolveSummary(safe, "publicBetaQaDecisionMatrixSummary", "WeishanGlobalShoppingPublicBetaQaDecisionMatrix", "buildGlobalShoppingPublicBetaQaDecisionMatrix");
    const offlineIssueTriageBoardSummary = resolveSummary(safe, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    const hasLedger = present(safe.publicBetaTrialEvidenceLedgerSummary);
    const hasMatrix = present(safe.publicBetaQaDecisionMatrixSummary);
    const hasTriage = present(safe.offlineIssueTriageBoardSummary);
    const statuses = [
      text(publicBetaTrialEvidenceLedgerSummary.status || "needs_review"),
      text(publicBetaQaDecisionMatrixSummary.status || "needs_review"),
      text(offlineIssueTriageBoardSummary.status || "needs_review")
    ];
    const status = statuses.some(function (item) { return item === "blocked"; })
      ? "blocked"
      : (!hasLedger || !hasMatrix || !hasTriage || statuses.some(function (item) { return item !== "ready"; }) ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_OPERATIONS_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Trial Evidence Ledger",
      subtitle:"QA Decision Matrix",
      cards:buildGlobalShoppingPublicBetaQaOperationsCards({
        publicBetaTrialEvidenceLedgerSummary:publicBetaTrialEvidenceLedgerSummary,
        publicBetaQaDecisionMatrixSummary:publicBetaQaDecisionMatrixSummary,
        offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaQaOperationsRows({ status:status }),
      publicBetaTrialEvidenceLedgerSummary:publicBetaTrialEvidenceLedgerSummary,
      publicBetaQaDecisionMatrixSummary:publicBetaQaDecisionMatrixSummary,
      offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary,
      manualReviewRequired:true,
      safeToProceedWithManualQaOperationsReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta QA Operations View Model",
        resultLabel:status === "ready" ? "Public Beta Trial Evidence Ledger / QA Decision Matrix / Offline Issue Triage Board 已准备" : (status === "blocked" ? "Public Beta QA Operations View Model 已阻断" : "Public Beta QA Operations View Model 仍需复核"),
        caveat:"只读 QA 运营视图不创建真实 issue、不自动发布、不启用 provider。"
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

  function buildGlobalShoppingPublicBetaQaOperationsViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaQaOperationsViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_QA_OPERATIONS_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_OPERATIONS_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualQaOperationsReview:safe.safeToProceedWithManualQaOperationsReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaQaOperationsViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaQaOperationsViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaQaOperationsViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaQaOperationsViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_QA_OPERATIONS_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaQaOperationsViewModel,
    buildGlobalShoppingPublicBetaQaOperationsCards,
    buildGlobalShoppingPublicBetaQaOperationsRows,
    buildGlobalShoppingPublicBetaQaOperationsViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaQaOperationsViewModel
  };
})();
