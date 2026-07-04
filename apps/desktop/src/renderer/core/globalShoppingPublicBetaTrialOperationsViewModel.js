;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_VIEW_MODEL_VERSION = "4.2.0";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_trial_operations_view_model_v1";

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

  function buildGlobalShoppingTrialOperationsRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaTrialOperationsConsoleSummary", "WeishanGlobalShoppingPublicBetaTrialOperationsConsole", "buildGlobalShoppingPublicBetaTrialOperationsConsole");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_trial_operations_console_missing", "Public Beta Trial Operations Console", "Public Beta Trial Operations Console 仍需复核", "warning")];
  }

  function buildGlobalShoppingManualQaScenarioRowsForView(input) {
    const summary = resolveSummary(input, "manualQaScenarioRunnerSummary", "WeishanGlobalShoppingManualQaScenarioRunner", "buildGlobalShoppingManualQaScenarioRunner");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("manual_qa_scenario_runner_missing", "Manual QA Scenario Runner", "Manual QA Scenario Runner 仍需复核", "warning")];
  }

  function buildGlobalShoppingOfflineFeedbackReviewRowsForView(input) {
    const summary = resolveSummary(input, "offlineFeedbackReviewBoardSummary", "WeishanGlobalShoppingOfflineFeedbackReviewBoard", "buildGlobalShoppingOfflineFeedbackReviewBoard");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("offline_feedback_review_board_missing", "Offline Feedback Review Board", "Offline Feedback Review Board 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaTrialOperationsCards(input) {
    const trialOperations = resolveSummary(input, "publicBetaTrialOperationsConsoleSummary", "WeishanGlobalShoppingPublicBetaTrialOperationsConsole", "buildGlobalShoppingPublicBetaTrialOperationsConsole");
    const scenarioRunner = resolveSummary(input, "manualQaScenarioRunnerSummary", "WeishanGlobalShoppingManualQaScenarioRunner", "buildGlobalShoppingManualQaScenarioRunner");
    const feedbackBoard = resolveSummary(input, "offlineFeedbackReviewBoardSummary", "WeishanGlobalShoppingOfflineFeedbackReviewBoard", "buildGlobalShoppingOfflineFeedbackReviewBoard");
    return clone([
      card("public_beta_trial_operations_console", "Public Beta Trial Operations Console", text(obj(trialOperations.userFacingSummary).resultLabel || "Public Beta Trial Operations Console 仍需复核")),
      card("manual_qa_scenario_runner", "Manual QA Scenario Runner", text(obj(scenarioRunner.userFacingSummary).resultLabel || "Manual QA Scenario Runner 仍需复核")),
      card("offline_feedback_review_board", "Offline Feedback Review Board", text(obj(feedbackBoard.userFacingSummary).resultLabel || "Offline Feedback Review Board 仍需复核")),
      card("scenario_coverage", "Scenario Coverage", "Flight / Hotel / Product / Restricted / Feedback / No-Transaction / No-Provider 场景已覆盖"),
      card("feedback_review", "Feedback Review", "反馈仍保持关闭，不发送、不上传、不保存用户原文"),
      card("next_manual_action", "Next Manual Action", text(trialOperations.nextManualAction || "continue_testing")),
      card("manual_review_required", "Manual Review Required", "下一步只能人工复核或继续测试")
    ]);
  }

  function buildGlobalShoppingPublicBetaTrialOperationsRows(input) {
    const safe = obj(input);
    const status = text(safe.status || "needs_review");
    return clone([
      row("public_beta_trial_operations_view_model_status", "Public Beta Trial Operations View Model", status === "ready" ? "Public Beta Trial Operations View Model 已准备" : (status === "blocked" ? "Public Beta Trial Operations View Model 已阻断" : "Public Beta Trial Operations View Model 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_trial_operations_view_model_coverage", "Scenario Coverage", "Flight / Hotel / Product / Restricted / Feedback / No-Transaction / No-Provider 场景已覆盖", "warning"),
      row("public_beta_trial_operations_view_model_feedback", "Feedback Review", "反馈仍保持关闭，不发送、不上传、不保存用户原文", "warning"),
      row("public_beta_trial_operations_view_model_next", "Next Manual Action", "下一步只能人工复核或继续测试", "warning"),
      row("public_beta_trial_operations_view_model_boundary", "Manual Review Required", "不自动发布、不接 provider、不启用交易", "warning")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaTrialOperationsViewModel(viewModel) {
    const safe = obj(viewModel);
    const publicBetaTrialOperationsConsoleSummary = resolveSummary(safe, "publicBetaTrialOperationsConsoleSummary", "WeishanGlobalShoppingPublicBetaTrialOperationsConsole", "buildGlobalShoppingPublicBetaTrialOperationsConsole");
    const manualQaScenarioRunnerSummary = resolveSummary(safe, "manualQaScenarioRunnerSummary", "WeishanGlobalShoppingManualQaScenarioRunner", "buildGlobalShoppingManualQaScenarioRunner");
    const offlineFeedbackReviewBoardSummary = resolveSummary(safe, "offlineFeedbackReviewBoardSummary", "WeishanGlobalShoppingOfflineFeedbackReviewBoard", "buildGlobalShoppingOfflineFeedbackReviewBoard");
    const hasTrialOperations = present(safe.publicBetaTrialOperationsConsoleSummary);
    const hasScenarioRunner = present(safe.manualQaScenarioRunnerSummary);
    const hasFeedbackBoard = present(safe.offlineFeedbackReviewBoardSummary);
    const statuses = [
      text(publicBetaTrialOperationsConsoleSummary.status || "needs_review"),
      text(manualQaScenarioRunnerSummary.status || "needs_review"),
      text(offlineFeedbackReviewBoardSummary.status || "needs_review")
    ];
    const status = statuses.some(function (item) { return item === "blocked"; })
      ? "blocked"
      : (!hasTrialOperations || !hasScenarioRunner || !hasFeedbackBoard || statuses.some(function (item) { return item !== "ready"; }) ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_VIEW_MODEL_VERSION,
      status,
      title:"Public Beta Trial Operations Console",
      subtitle:"Manual QA Scenario Runner",
      cards:buildGlobalShoppingPublicBetaTrialOperationsCards({
        publicBetaTrialOperationsConsoleSummary:publicBetaTrialOperationsConsoleSummary,
        manualQaScenarioRunnerSummary:manualQaScenarioRunnerSummary,
        offlineFeedbackReviewBoardSummary:offlineFeedbackReviewBoardSummary
      }),
      rows:buildGlobalShoppingPublicBetaTrialOperationsRows({ status:status }),
      trialOperationsRows:buildGlobalShoppingTrialOperationsRowsForView({ publicBetaTrialOperationsConsoleSummary:publicBetaTrialOperationsConsoleSummary }),
      manualQaScenarioRows:buildGlobalShoppingManualQaScenarioRowsForView({ manualQaScenarioRunnerSummary:manualQaScenarioRunnerSummary }),
      offlineFeedbackReviewRows:buildGlobalShoppingOfflineFeedbackReviewRowsForView({ offlineFeedbackReviewBoardSummary:offlineFeedbackReviewBoardSummary }),
      publicBetaTrialOperationsConsoleSummary:publicBetaTrialOperationsConsoleSummary,
      manualQaScenarioRunnerSummary:manualQaScenarioRunnerSummary,
      offlineFeedbackReviewBoardSummary:offlineFeedbackReviewBoardSummary,
      manualReviewRequired:true,
      safeToProceedWithManualTrialOperationsReview:status === "ready",
      userFacingSummary:{
        title:"Public Beta Trial Operations View Model",
        resultLabel:status === "ready" ? "Public Beta Trial Operations Console / Manual QA Scenario Runner / Offline Feedback Review Board 已准备" : (status === "blocked" ? "Public Beta Trial Operations View Model 已阻断" : "Public Beta Trial Operations View Model 仍需复核"),
        caveat:"不输出反馈发送、上传、下单、付款、出票、provider、release、push 入口。"
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

  function buildGlobalShoppingPublicBetaTrialOperationsViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaTrialOperationsViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_VIEW_MODEL_VERSION,
      status:safe.status,
      safeToProceedWithManualTrialOperationsReview:safe.safeToProceedWithManualTrialOperationsReview === true,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaTrialOperationsViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaTrialOperationsViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaTrialOperationsViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaTrialOperationsViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_TRIAL_OPERATIONS_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaTrialOperationsViewModel,
    buildGlobalShoppingPublicBetaTrialOperationsCards,
    buildGlobalShoppingPublicBetaTrialOperationsRows,
    buildGlobalShoppingTrialOperationsRowsForView,
    buildGlobalShoppingManualQaScenarioRowsForView,
    buildGlobalShoppingOfflineFeedbackReviewRowsForView,
    buildGlobalShoppingPublicBetaTrialOperationsViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaTrialOperationsViewModel
  };
})();
