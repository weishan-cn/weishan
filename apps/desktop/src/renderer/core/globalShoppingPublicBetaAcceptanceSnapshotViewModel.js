;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_SNAPSHOT_VIEW_MODEL_VERSION = "4.2.1";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_acceptance_snapshot_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
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
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }

  function buildGlobalShoppingPublicBetaAcceptanceSnapshotCards(input) {
    const safe = obj(input);
    return clone([
      card("public_beta_freeze_evidence_summary", "Public Beta Freeze Evidence Summary", text(obj(safe.publicBetaFreezeEvidenceSummary.userFacingSummary).resultLabel || "Public Beta Freeze Evidence Summary 仍需复核")),
      card("manual_trial_issue_review_board", "Manual Trial Issue Review Board", text(obj(safe.manualTrialIssueReviewBoardSummary.userFacingSummary).resultLabel || "Manual Trial Issue Review Board 仍需复核")),
      card("offline_acceptance_snapshot", "Offline Acceptance Snapshot", text(obj(safe.offlineAcceptanceSnapshotSummary.userFacingSummary).resultLabel || "Offline Acceptance Snapshot 仍需复核")),
      card("freeze_evidence", "Freeze Evidence", "冻结证据仅为只读摘要，不修改配置"),
      card("issue_review", "Issue Review", "问题复核仅为离线视图，不创建真实 issue"),
      card("acceptance_snapshot", "Acceptance Snapshot", "验收快照不写文件、不导出")
    ]);
  }

  function buildGlobalShoppingFreezeEvidenceRowsForView(input) {
    const summary = obj(input && input.publicBetaFreezeEvidenceSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingIssueReviewRowsForView(input) {
    const summary = obj(input && input.manualTrialIssueReviewBoardSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingAcceptanceSnapshotRowsForView(input) {
    const summary = obj(input && input.offlineAcceptanceSnapshotSummary);
    return clone((Array.isArray(summary.rows) ? summary.rows : []).slice(0, 3));
  }

  function buildGlobalShoppingPublicBetaAcceptanceSnapshotRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_acceptance_snapshot_title", "Public Beta Freeze Evidence Summary", text(obj(safe.publicBetaFreezeEvidenceSummary.userFacingSummary).resultLabel || "Public Beta Freeze Evidence Summary 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_acceptance_snapshot_issue_review", "Manual Trial Issue Review Board", text(obj(safe.manualTrialIssueReviewBoardSummary.userFacingSummary).resultLabel || "Manual Trial Issue Review Board 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_acceptance_snapshot_acceptance", "Offline Acceptance Snapshot", text(obj(safe.offlineAcceptanceSnapshotSummary.userFacingSummary).resultLabel || "Offline Acceptance Snapshot 仍需复核"), safe.status === "blocked" ? "blocked" : "warning"),
      row("public_beta_acceptance_snapshot_freeze_evidence", "Freeze Evidence", "冻结证据仅为只读摘要，不修改配置", "warning"),
      row("public_beta_acceptance_snapshot_issue_text", "Issue Review", "问题复核仅为离线视图，不创建真实 issue", "warning"),
      row("public_beta_acceptance_snapshot_snapshot_text", "Acceptance Snapshot", "验收快照不写文件、不导出", "warning"),
      row("public_beta_acceptance_snapshot_manual", "Manual Review Required", "仍需人工复核后再决定下一阶段", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaAcceptanceSnapshotViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaFreezeEvidenceSummary = resolveSummary(safe, "publicBetaFreezeEvidenceSummary", "WeishanGlobalShoppingPublicBetaFreezeEvidenceSummary", "buildGlobalShoppingPublicBetaFreezeEvidenceSummary");
    const manualTrialIssueReviewBoardSummary = resolveSummary(safe, "manualTrialIssueReviewBoardSummary", "WeishanGlobalShoppingManualTrialIssueReviewBoard", "buildGlobalShoppingManualTrialIssueReviewBoard");
    const offlineAcceptanceSnapshotSummary = resolveSummary(safe, "offlineAcceptanceSnapshotSummary", "WeishanGlobalShoppingOfflineAcceptanceSnapshot", "buildGlobalShoppingOfflineAcceptanceSnapshot");
    const freezeStatus = normalizeStatus(obj(publicBetaFreezeEvidenceSummary).status || obj(publicBetaFreezeEvidenceSummary).freezeEvidenceStatus || "", "needs_review");
    const issueStatus = normalizeStatus(obj(manualTrialIssueReviewBoardSummary).status || obj(manualTrialIssueReviewBoardSummary).issueReviewStatus || "", "needs_review");
    const snapshotStatus = normalizeStatus(obj(offlineAcceptanceSnapshotSummary).status || obj(offlineAcceptanceSnapshotSummary).acceptanceSnapshotStatus || "", "needs_review");
    const missingRequired = !present(publicBetaFreezeEvidenceSummary) || !present(manualTrialIssueReviewBoardSummary) || !present(offlineAcceptanceSnapshotSummary);
    const status = freezeStatus === "blocked" || issueStatus === "blocked" || snapshotStatus === "blocked"
      ? "blocked"
      : (missingRequired || freezeStatus !== "ready" || issueStatus !== "ready" || snapshotStatus !== "ready" ? "needs_review" : "ready");
    const result = {
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_SNAPSHOT_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Freeze Evidence Summary",
      subtitle:"Manual Trial Issue Review Board",
      publicBetaFreezeEvidenceSummary:publicBetaFreezeEvidenceSummary,
      manualTrialIssueReviewBoardSummary:manualTrialIssueReviewBoardSummary,
      offlineAcceptanceSnapshotSummary:offlineAcceptanceSnapshotSummary,
      cards:[],
      rows:[],
      freezeEvidenceRows:buildGlobalShoppingFreezeEvidenceRowsForView({ publicBetaFreezeEvidenceSummary:publicBetaFreezeEvidenceSummary }),
      issueReviewRows:buildGlobalShoppingIssueReviewRowsForView({ manualTrialIssueReviewBoardSummary:manualTrialIssueReviewBoardSummary }),
      acceptanceSnapshotRows:buildGlobalShoppingAcceptanceSnapshotRowsForView({ offlineAcceptanceSnapshotSummary:offlineAcceptanceSnapshotSummary }),
      manualReviewRequired:true,
      safeToProceedWithManualAcceptanceSnapshotReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Acceptance Snapshot View Model",
        resultLabel:status === "ready" ? "Public Beta Freeze Evidence Summary / Manual Trial Issue Review Board / Offline Acceptance Snapshot 已准备" : (status === "blocked" ? "Public Beta Acceptance Snapshot View Model 已阻断" : "Public Beta Acceptance Snapshot View Model 仍需复核"),
        caveat:"不写文件、不联网、不打开外部平台。"
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
    };
    result.cards = buildGlobalShoppingPublicBetaAcceptanceSnapshotCards(result);
    result.rows = buildGlobalShoppingPublicBetaAcceptanceSnapshotRows(result);
    return clone(result);
  }

  function buildGlobalShoppingPublicBetaAcceptanceSnapshotViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaAcceptanceSnapshotViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_SNAPSHOT_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_SNAPSHOT_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualAcceptanceSnapshotReview:safe.safeToProceedWithManualAcceptanceSnapshotReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaAcceptanceSnapshotViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaAcceptanceSnapshotViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaAcceptanceSnapshotViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaAcceptanceSnapshotViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_SNAPSHOT_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaAcceptanceSnapshotViewModel,
    buildGlobalShoppingPublicBetaAcceptanceSnapshotCards,
    buildGlobalShoppingPublicBetaAcceptanceSnapshotRows,
    buildGlobalShoppingFreezeEvidenceRowsForView,
    buildGlobalShoppingIssueReviewRowsForView,
    buildGlobalShoppingAcceptanceSnapshotRowsForView,
    buildGlobalShoppingPublicBetaAcceptanceSnapshotViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaAcceptanceSnapshotViewModel
  };
})();
