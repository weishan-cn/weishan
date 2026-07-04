;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION = "4.2.4";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_acceptance_review_view_model_v1";

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

  function buildGlobalShoppingManualAcceptanceChecklistRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaManualAcceptanceChecklistSummary", "WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist", "buildGlobalShoppingPublicBetaManualAcceptanceChecklist");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("manual_acceptance_checklist_missing", "Public Beta Manual Acceptance Checklist", "Public Beta Manual Acceptance Checklist 仍需复核", "warning")];
  }
  function buildGlobalShoppingOfflineUserScenarioRowsForView(input) {
    const summary = resolveSummary(input, "offlineUserScenarioPackSummary", "WeishanGlobalShoppingOfflineUserScenarioPack", "buildGlobalShoppingOfflineUserScenarioPack");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("offline_user_scenario_pack_missing", "Offline User Scenario Pack", "Offline User Scenario Pack 仍需复核", "warning")];
  }
  function buildGlobalShoppingNoDataRetentionRowsForView(input) {
    const summary = resolveSummary(input, "noDataRetentionGuardSummary", "WeishanGlobalShoppingNoDataRetentionGuard", "buildGlobalShoppingNoDataRetentionGuard");
    return toArray(summary.rows).length ? clone(summary.rows).slice(0, 3) : [row("no_data_retention_guard_missing", "No-Data-Retention Guard", "No-Data-Retention Guard 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaAcceptanceReviewCards(input) {
    const manualAcceptanceChecklist = resolveSummary(input, "publicBetaManualAcceptanceChecklistSummary", "WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist", "buildGlobalShoppingPublicBetaManualAcceptanceChecklist");
    const offlineUserScenarioPack = resolveSummary(input, "offlineUserScenarioPackSummary", "WeishanGlobalShoppingOfflineUserScenarioPack", "buildGlobalShoppingOfflineUserScenarioPack");
    const noDataRetentionGuard = resolveSummary(input, "noDataRetentionGuardSummary", "WeishanGlobalShoppingNoDataRetentionGuard", "buildGlobalShoppingNoDataRetentionGuard");
    return clone([
      card("public_beta_manual_acceptance_checklist", "Public Beta Manual Acceptance Checklist", text(obj(manualAcceptanceChecklist.userFacingSummary).resultLabel || "Public Beta Manual Acceptance Checklist 仍需复核")),
      card("offline_user_scenario_pack", "Offline User Scenario Pack", text(obj(offlineUserScenarioPack.userFacingSummary).resultLabel || "Offline User Scenario Pack 仍需复核")),
      card("no_data_retention_guard", "No-Data-Retention Guard", text(obj(noDataRetentionGuard.userFacingSummary).resultLabel || "No-Data-Retention Guard 仍需复核")),
      card("manual_acceptance", "Manual Acceptance", "人工验收清单仅为只读展示，不保存验收记录"),
      card("offline_scenarios", "Offline Scenarios", "离线用户场景包仅为样例，不收集真实输入"),
      card("no_data_retention", "No Data Retention", "无数据留存保护门确认不保存反馈、用户原文、场景输入或验收记录"),
      card("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭")
    ]);
  }

  function buildGlobalShoppingPublicBetaAcceptanceReviewRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_acceptance_review_view_model", "Public Beta Acceptance Review ViewModel", safe.status === "ready" ? "Public Beta Acceptance Review ViewModel 已准备" : (safe.status === "blocked" ? "Public Beta Acceptance Review ViewModel 已阻断" : "Public Beta Acceptance Review ViewModel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("manual_acceptance", "Manual Acceptance", "人工验收清单仅为只读展示，不保存验收记录", "warning"),
      row("offline_scenarios", "Offline Scenarios", "离线用户场景包仅为样例，不收集真实输入", "warning"),
      row("no_data_retention", "No Data Retention", "无数据留存保护门确认不保存反馈、用户原文、场景输入或验收记录", "warning"),
      row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaAcceptanceReviewViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaManualAcceptanceChecklistSummary = resolveSummary(safe, "publicBetaManualAcceptanceChecklistSummary", "WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist", "buildGlobalShoppingPublicBetaManualAcceptanceChecklist");
    const offlineUserScenarioPackSummary = resolveSummary(safe, "offlineUserScenarioPackSummary", "WeishanGlobalShoppingOfflineUserScenarioPack", "buildGlobalShoppingOfflineUserScenarioPack");
    const noDataRetentionGuardSummary = resolveSummary(safe, "noDataRetentionGuardSummary", "WeishanGlobalShoppingNoDataRetentionGuard", "buildGlobalShoppingNoDataRetentionGuard");
    const manualAcceptanceStatus = normalizeStatus(obj(publicBetaManualAcceptanceChecklistSummary).status || obj(publicBetaManualAcceptanceChecklistSummary).acceptanceChecklistStatus, "needs_review");
    const scenarioPackStatus = normalizeStatus(obj(offlineUserScenarioPackSummary).status || obj(offlineUserScenarioPackSummary).scenarioPackStatus, "needs_review");
    const noDataRetentionStatus = normalizeStatus(obj(noDataRetentionGuardSummary).status || obj(noDataRetentionGuardSummary).noDataRetentionStatus, "needs_review");
    const missingRequired = !present(publicBetaManualAcceptanceChecklistSummary) || !present(offlineUserScenarioPackSummary) || !present(noDataRetentionGuardSummary);
    const status = manualAcceptanceStatus === "blocked" || scenarioPackStatus === "blocked" || noDataRetentionStatus === "blocked"
      ? "blocked"
      : (missingRequired || manualAcceptanceStatus === "needs_review" || scenarioPackStatus === "needs_review" || noDataRetentionStatus === "needs_review"
        ? "needs_review"
        : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"Public Beta Manual Acceptance Checklist",
      subtitle:"Offline User Scenario Pack",
      cards:buildGlobalShoppingPublicBetaAcceptanceReviewCards({
        publicBetaManualAcceptanceChecklistSummary:publicBetaManualAcceptanceChecklistSummary,
        offlineUserScenarioPackSummary:offlineUserScenarioPackSummary,
        noDataRetentionGuardSummary:noDataRetentionGuardSummary
      }),
      rows:buildGlobalShoppingPublicBetaAcceptanceReviewRows({ status:status }),
      publicBetaManualAcceptanceChecklistRows:buildGlobalShoppingManualAcceptanceChecklistRowsForView({ publicBetaManualAcceptanceChecklistSummary:publicBetaManualAcceptanceChecklistSummary }),
      offlineUserScenarioRows:buildGlobalShoppingOfflineUserScenarioRowsForView({ offlineUserScenarioPackSummary:offlineUserScenarioPackSummary }),
      noDataRetentionRows:buildGlobalShoppingNoDataRetentionRowsForView({ noDataRetentionGuardSummary:noDataRetentionGuardSummary }),
      publicBetaManualAcceptanceChecklistSummary:publicBetaManualAcceptanceChecklistSummary,
      offlineUserScenarioPackSummary:offlineUserScenarioPackSummary,
      noDataRetentionGuardSummary:noDataRetentionGuardSummary,
      manualReviewRequired:true,
      safeToProceedWithManualAcceptanceReview:status === "ready",
      dataRetentionEnabled:false,
      rawUserTextPersistence:false,
      acceptanceRecordPersistence:false,
      scenarioInputPersistence:false,
      userFacingSummary:{
        title:"Public Beta Acceptance Review ViewModel",
        resultLabel:status === "ready" ? "Public Beta Manual Acceptance Checklist / Offline User Scenario Pack / No-Data-Retention Guard 已准备" : (status === "blocked" ? "Public Beta Acceptance Review ViewModel 已阻断" : "Public Beta Acceptance Review ViewModel 仍需复核"),
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

  function buildGlobalShoppingPublicBetaAcceptanceReviewViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaAcceptanceReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualAcceptanceReview:safe.safeToProceedWithManualAcceptanceReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaAcceptanceReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaAcceptanceReviewViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaAcceptanceReviewViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaAcceptanceReviewViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaAcceptanceReviewViewModel,
    buildGlobalShoppingPublicBetaAcceptanceReviewCards,
    buildGlobalShoppingPublicBetaAcceptanceReviewRows,
    buildGlobalShoppingManualAcceptanceChecklistRowsForView,
    buildGlobalShoppingOfflineUserScenarioRowsForView,
    buildGlobalShoppingNoDataRetentionRowsForView,
    buildGlobalShoppingPublicBetaAcceptanceReviewViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaAcceptanceReviewViewModel
  };
})();
