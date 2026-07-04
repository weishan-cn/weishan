;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_VIEW_MODEL_VERSION = "4.2.6";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_offline_acceptance_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (status === "ready") return "ready";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }

  function buildGlobalShoppingOfflineAcceptanceEvidenceRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaOfflineAcceptanceEvidenceCenterSummary", "WeishanGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter", "buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("offline_acceptance_evidence_center_missing", "Public Beta Offline Acceptance Evidence Center", "Public Beta Offline Acceptance Evidence Center 仍需复核", "warning")];
  }
  function buildGlobalShoppingScenarioReviewRowsForView(input) {
    const summary = resolveSummary(input, "manualScenarioReviewBoardSummary", "WeishanGlobalShoppingManualScenarioReviewBoard", "buildGlobalShoppingManualScenarioReviewBoard");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("manual_scenario_review_board_missing", "Manual Scenario Review Board", "Manual Scenario Review Board 仍需复核", "warning")];
  }
  function buildGlobalShoppingZeroPersistenceRowsForView(input) {
    const summary = resolveSummary(input, "zeroPersistenceRegressionGateSummary", "WeishanGlobalShoppingZeroPersistenceRegressionGate", "buildGlobalShoppingZeroPersistenceRegressionGate");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("zero_persistence_regression_gate_missing", "Zero-Persistence Regression Gate", "Zero-Persistence Regression Gate 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaOfflineAcceptanceCards(input) {
    const evidenceSummary = resolveSummary(input, "publicBetaOfflineAcceptanceEvidenceCenterSummary", "WeishanGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter", "buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter");
    const scenarioSummary = resolveSummary(input, "manualScenarioReviewBoardSummary", "WeishanGlobalShoppingManualScenarioReviewBoard", "buildGlobalShoppingManualScenarioReviewBoard");
    const zeroSummary = resolveSummary(input, "zeroPersistenceRegressionGateSummary", "WeishanGlobalShoppingZeroPersistenceRegressionGate", "buildGlobalShoppingZeroPersistenceRegressionGate");
    return clone([
      card("public_beta_offline_acceptance_evidence_center", "Public Beta Offline Acceptance Evidence Center", text(obj(evidenceSummary.userFacingSummary).resultLabel || "Public Beta Offline Acceptance Evidence Center 仍需复核")),
      card("manual_scenario_review_board", "Manual Scenario Review Board", text(obj(scenarioSummary.userFacingSummary).resultLabel || "Manual Scenario Review Board 仍需复核")),
      card("zero_persistence_regression_gate", "Zero-Persistence Regression Gate", text(obj(zeroSummary.userFacingSummary).resultLabel || "Zero-Persistence Regression Gate 仍需复核")),
      card("offline_acceptance_evidence", "Offline Acceptance Evidence", "离线验收证据中心仅为只读展示，不生成证据文件"),
      card("scenario_review", "Scenario Review", "人工场景复核板仅为样例复核，不保存场景输入或复核结果"),
      card("zero_persistence", "Zero Persistence", "零持久化回归门确认不保存反馈、用户原文、场景输入、验收记录或证据文件"),
      card("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaOfflineAcceptanceRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_offline_acceptance_view_model", "Public Beta Offline Acceptance ViewModel", safe.status === "ready" ? "Public Beta Offline Acceptance ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta Offline Acceptance ViewModel 已阻断" : "Public Beta Offline Acceptance ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_acceptance_evidence", "Offline Acceptance Evidence", "离线验收证据中心仅为只读展示，不生成证据文件", "warning"),
      row("scenario_review", "Scenario Review", "人工场景复核板仅为样例复核，不保存场景输入或复核结果", "warning"),
      row("zero_persistence", "Zero Persistence", "零持久化回归门确认不保存反馈、用户原文、场景输入、验收记录或证据文件", "warning"),
      row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaOfflineAcceptanceViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaOfflineAcceptanceEvidenceCenterSummary = resolveSummary(safe, "publicBetaOfflineAcceptanceEvidenceCenterSummary", "WeishanGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter", "buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter");
    const manualScenarioReviewBoardSummary = resolveSummary(safe, "manualScenarioReviewBoardSummary", "WeishanGlobalShoppingManualScenarioReviewBoard", "buildGlobalShoppingManualScenarioReviewBoard");
    const zeroPersistenceRegressionGateSummary = resolveSummary(safe, "zeroPersistenceRegressionGateSummary", "WeishanGlobalShoppingZeroPersistenceRegressionGate", "buildGlobalShoppingZeroPersistenceRegressionGate");
    const evidenceStatus = normalizeStatus(obj(publicBetaOfflineAcceptanceEvidenceCenterSummary).status || obj(publicBetaOfflineAcceptanceEvidenceCenterSummary).evidenceCenterStatus, "needs_review");
    const scenarioStatus = normalizeStatus(obj(manualScenarioReviewBoardSummary).status || obj(manualScenarioReviewBoardSummary).scenarioReviewStatus, "needs_review");
    const zeroStatus = normalizeStatus(obj(zeroPersistenceRegressionGateSummary).status || obj(zeroPersistenceRegressionGateSummary).zeroPersistenceStatus, "needs_review");
    const missingRequired = !present(publicBetaOfflineAcceptanceEvidenceCenterSummary) || !present(manualScenarioReviewBoardSummary) || !present(zeroPersistenceRegressionGateSummary);
    const status = evidenceStatus === "blocked" || scenarioStatus === "blocked" || zeroStatus === "blocked"
      ? "blocked"
      : (missingRequired || evidenceStatus === "needs_review" || scenarioStatus === "needs_review" || zeroStatus === "needs_review"
        ? "needs_review"
        : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Offline Acceptance Evidence Center",
      subtitle:"Manual Scenario Review Board",
      cards:buildGlobalShoppingPublicBetaOfflineAcceptanceCards({
        publicBetaOfflineAcceptanceEvidenceCenterSummary:publicBetaOfflineAcceptanceEvidenceCenterSummary,
        manualScenarioReviewBoardSummary:manualScenarioReviewBoardSummary,
        zeroPersistenceRegressionGateSummary:zeroPersistenceRegressionGateSummary
      }),
      rows:buildGlobalShoppingPublicBetaOfflineAcceptanceRows({ status:status }),
      offlineAcceptanceEvidenceRows:buildGlobalShoppingOfflineAcceptanceEvidenceRowsForView({ publicBetaOfflineAcceptanceEvidenceCenterSummary:publicBetaOfflineAcceptanceEvidenceCenterSummary }),
      scenarioReviewRows:buildGlobalShoppingScenarioReviewRowsForView({ manualScenarioReviewBoardSummary:manualScenarioReviewBoardSummary }),
      zeroPersistenceRows:buildGlobalShoppingZeroPersistenceRowsForView({ zeroPersistenceRegressionGateSummary:zeroPersistenceRegressionGateSummary }),
      publicBetaOfflineAcceptanceEvidenceCenterSummary:publicBetaOfflineAcceptanceEvidenceCenterSummary,
      manualScenarioReviewBoardSummary:manualScenarioReviewBoardSummary,
      zeroPersistenceRegressionGateSummary:zeroPersistenceRegressionGateSummary,
      manualReviewRequired:true,
      safeToProceedWithManualOfflineAcceptanceReview:status === "ready",
      dataRetentionEnabled:false,
      rawUserTextPersistence:false,
      acceptanceRecordPersistence:false,
      scenarioInputPersistence:false,
      evidenceFilePersistence:false,
      scenarioReviewPersistence:false,
      userFacingSummary:{
        title:"Public Beta Offline Acceptance ViewModel",
        resultLabel:status === "ready" ? "Public Beta Offline Acceptance ViewModel 已准备" : (status === "blocked" ? "Public Beta Offline Acceptance ViewModel 已阻断" : "Public Beta Offline Acceptance ViewModel 仍需复核"),
        caveat:"不输出真实反馈提交、任务创建、issue 创建、反馈发送、上传、下单、付款、出票、provider、release、push、launch、保存记录入口。"
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

  function buildGlobalShoppingPublicBetaOfflineAcceptanceViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaOfflineAcceptanceViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualOfflineAcceptanceReview:safe.safeToProceedWithManualOfflineAcceptanceReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaOfflineAcceptanceViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaOfflineAcceptanceViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaOfflineAcceptanceViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaOfflineAcceptanceViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_OFFLINE_ACCEPTANCE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaOfflineAcceptanceViewModel,
    buildGlobalShoppingPublicBetaOfflineAcceptanceCards,
    buildGlobalShoppingPublicBetaOfflineAcceptanceRows,
    buildGlobalShoppingOfflineAcceptanceEvidenceRowsForView,
    buildGlobalShoppingScenarioReviewRowsForView,
    buildGlobalShoppingZeroPersistenceRowsForView,
    buildGlobalShoppingPublicBetaOfflineAcceptanceViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaOfflineAcceptanceViewModel
  };
})();
