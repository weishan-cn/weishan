;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_QA_VIEW_MODEL_VERSION = "4.2.2";
  const VIEW_MODEL_NAME = "global_shopping_public_beta_qa_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
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
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }

  function buildGlobalShoppingVisualQaRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaVisualQaConsoleSummary", "WeishanGlobalShoppingPublicBetaVisualQaConsole", "buildGlobalShoppingPublicBetaVisualQaConsole");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_visual_qa_console_missing", "Public Beta Visual QA Console", "Public Beta Visual QA Console 仍需复核", "warning")];
  }
  function buildGlobalShoppingTrialScenarioRowsForView(input) {
    const summary = resolveSummary(input, "publicBetaTrialScenarioChecklistSummary", "WeishanGlobalShoppingPublicBetaTrialScenarioChecklist", "buildGlobalShoppingPublicBetaTrialScenarioChecklist");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("public_beta_trial_scenario_checklist_missing", "Trial Scenario Checklist", "Trial Scenario Checklist 仍需复核", "warning")];
  }
  function buildGlobalShoppingNoTransactionRegressionRowsForView(input) {
    const summary = resolveSummary(input, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    return toArray(summary.rows).length ? clone(summary.rows) : [row("no_transaction_regression_guard_missing", "No-Transaction Regression Guard", "No-Transaction Regression Guard 仍需复核", "warning")];
  }

  function buildGlobalShoppingPublicBetaQaCards(input) {
    const safe = obj(input);
    const visualQaSummary = resolveSummary(safe, "publicBetaVisualQaConsoleSummary", "WeishanGlobalShoppingPublicBetaVisualQaConsole", "buildGlobalShoppingPublicBetaVisualQaConsole");
    const scenarioSummary = resolveSummary(safe, "publicBetaTrialScenarioChecklistSummary", "WeishanGlobalShoppingPublicBetaTrialScenarioChecklist", "buildGlobalShoppingPublicBetaTrialScenarioChecklist");
    const guardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    return clone([
      card("public_beta_visual_qa_console", "Public Beta Visual QA Console", labelOf(visualQaSummary, "Public Beta Visual QA Console 仍需复核")),
      card("trial_scenario_checklist", "Trial Scenario Checklist", labelOf(scenarioSummary, "Trial Scenario Checklist 仍需复核")),
      card("no_transaction_regression_guard", "No-Transaction Regression Guard", labelOf(guardSummary, "No-Transaction Regression Guard 仍需复核")),
      card("visual_acceptance", "Visual Acceptance", "仍需人工视觉验收"),
      card("scenario_coverage", "Scenario Coverage", "Flight / Hotel / Product / Restricted 场景已覆盖"),
      card("transaction_boundary", "Transaction Boundary", "交易按钮保持关闭 / 未打开外部平台")
    ]);
  }

  function buildGlobalShoppingPublicBetaQaRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("public_beta_qa_view_model_status", "Public Beta QA View Model", status === "ready" ? "Public Beta QA View Model 已准备" : (status === "blocked" ? "Public Beta QA View Model 已阻断" : "Public Beta QA View Model 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_qa_visual_acceptance", "Visual Acceptance", "仍需人工视觉验收", "warning"),
      row("public_beta_qa_scenario_coverage", "Scenario Coverage", "Flight / Hotel / Product / Restricted 场景已覆盖", "pass"),
      row("public_beta_qa_transaction_boundary", "Transaction Boundary", "交易按钮保持关闭 / 未生成 booking / payment / order / checkout URL / 未打开外部平台", "pass")
    ]);
  }

  function sanitizeGlobalShoppingPublicBetaQaViewModel(viewModel) {
    const safe = obj(viewModel);
    const visualQaSummary = resolveSummary(safe, "publicBetaVisualQaConsoleSummary", "WeishanGlobalShoppingPublicBetaVisualQaConsole", "buildGlobalShoppingPublicBetaVisualQaConsole");
    const scenarioSummary = resolveSummary(safe, "publicBetaTrialScenarioChecklistSummary", "WeishanGlobalShoppingPublicBetaTrialScenarioChecklist", "buildGlobalShoppingPublicBetaTrialScenarioChecklist");
    const guardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const statuses = [safeStatus(visualQaSummary.status), safeStatus(scenarioSummary.status), safeStatus(guardSummary.status)];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const missingRequiredSummary = !present(safe.publicBetaVisualQaConsoleSummary) || !present(safe.publicBetaTrialScenarioChecklistSummary) || !present(safe.noTransactionRegressionGuardSummary);
    const needsReview = missingRequiredSummary || statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_VIEW_MODEL_VERSION,
      status,
      title:"Public Beta Visual QA Console",
      subtitle:"Trial Scenario Checklist",
      cards:buildGlobalShoppingPublicBetaQaCards({
        publicBetaVisualQaConsoleSummary:visualQaSummary,
        publicBetaTrialScenarioChecklistSummary:scenarioSummary,
        noTransactionRegressionGuardSummary:guardSummary
      }),
      rows:buildGlobalShoppingPublicBetaQaRows({ status }),
      visualQaRows:buildGlobalShoppingVisualQaRowsForView({ publicBetaVisualQaConsoleSummary:visualQaSummary }),
      trialScenarioRows:buildGlobalShoppingTrialScenarioRowsForView({ publicBetaTrialScenarioChecklistSummary:scenarioSummary }),
      noTransactionRegressionRows:buildGlobalShoppingNoTransactionRegressionRowsForView({ noTransactionRegressionGuardSummary:guardSummary }),
      publicBetaVisualQaConsoleSummary:visualQaSummary,
      publicBetaTrialScenarioChecklistSummary:scenarioSummary,
      noTransactionRegressionGuardSummary:guardSummary,
      userFacingSummary:{
        title:"Public Beta QA View Model",
        resultLabel:status === "ready" ? "Public Beta Visual QA Console / Trial Scenario Checklist / No-Transaction Regression Guard 已准备" : (status === "blocked" ? "Public Beta QA View Model 已阻断" : "Public Beta QA View Model 仍需复核"),
        caveat:"不提供截图上传、真实反馈发送、下单、付款、出票、发布或 push 入口。"
      },
      manualReviewRequired:true,
      safeToProceedWithManualVisualQaReview:status === "ready",
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

  function buildGlobalShoppingPublicBetaQaViewModelAuditDraft(input) {
    const safe = sanitizeGlobalShoppingPublicBetaQaViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_QA_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_VIEW_MODEL_VERSION,
      status:safe.status,
      cardCount:toArray(safe.cards).length,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function buildGlobalShoppingPublicBetaQaViewModel(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaQaViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaQaViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaQaViewModel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_QA_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingPublicBetaQaViewModel,
    buildGlobalShoppingPublicBetaQaCards,
    buildGlobalShoppingPublicBetaQaRows,
    buildGlobalShoppingVisualQaRowsForView,
    buildGlobalShoppingTrialScenarioRowsForView,
    buildGlobalShoppingNoTransactionRegressionRowsForView,
    buildGlobalShoppingPublicBetaQaViewModelAuditDraft,
    sanitizeGlobalShoppingPublicBetaQaViewModel
  };
})();
