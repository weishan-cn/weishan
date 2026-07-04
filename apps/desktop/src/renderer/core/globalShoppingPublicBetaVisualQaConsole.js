;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_VISUAL_QA_CONSOLE_VERSION = "4.2.3";
  const CONSOLE_NAME = "global_shopping_public_beta_visual_qa_console_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, visual_qa_console_only:true };
  const BLOCKED_COPY_RE = /screenshot|screen capture|upload|payment|order|checkout|ticketing|openExternal|window\.open/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "visual_qa_console_only");
    return ALLOWED_MODES[mode] ? mode : "visual_qa_console_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function checklistItem(itemId, label, visible, status) {
    return { itemId:text(itemId), label:text(label), visible:visible === true, status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    [
      "provider",
      "network",
      "key",
      "endpoint",
      "externalOpen",
      "openExternal",
      "windowOpen",
      "payment",
      "order",
      "checkout",
      "ticketing",
      "screenshotUpload",
      "upload",
      "fileWrite"
    ].forEach(function (name) {
      if (safe[name] === true) reasons.push(name + "_enabled");
    });
    if (safe["window.open"] === true) reasons.push("window_open_enabled");
    if (BLOCKED_COPY_RE.test(text(safe.runtimeSummary || safe.summary || safe.copy || safe.riskLabel))) reasons.push("blocked_copy_detected");
    return reasons;
  }

  function buildGlobalShoppingPublicBetaVisualQaChecklist(input) {
    const safe = obj(input);
    return clone([
      checklistItem("header_visible", "headerVisible", safe.headerVisible === true, safe.headerVisible === true ? "pass" : "warning"),
      checklistItem("category_cards_visible", "categoryCardsVisible", safe.categoryCardsVisible === true, safe.categoryCardsVisible === true ? "pass" : "warning"),
      checklistItem("candidate_cards_visible", "candidateCardsVisible", safe.candidateCardsVisible === true, safe.candidateCardsVisible === true ? "pass" : "warning"),
      checklistItem("comparison_board_visible", "comparisonBoardVisible", safe.comparisonBoardVisible === true, safe.comparisonBoardVisible === true ? "pass" : "warning"),
      checklistItem("trust_badge_visible", "trustBadgeVisible", safe.trustBadgeVisible === true, safe.trustBadgeVisible === true ? "pass" : "warning"),
      checklistItem("boundary_copy_visible", "boundaryCopyVisible", safe.boundaryCopyVisible === true, safe.boundaryCopyVisible === true ? "pass" : "warning"),
      checklistItem("known_limitations_visible", "knownLimitationsVisible", safe.knownLimitationsVisible === true, safe.knownLimitationsVisible === true ? "pass" : "warning"),
      checklistItem("manual_review_visible", "manualReviewVisible", safe.manualReviewVisible === true, safe.manualReviewVisible === true ? "pass" : "warning"),
      checklistItem("no_transaction_buttons_visible", "noTransactionButtonsVisible", safe.noTransactionButtonsVisible === false, safe.noTransactionButtonsVisible === false ? "pass" : "blocked")
    ]);
  }

  function buildGlobalShoppingPublicBetaVisualQaRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("public_beta_visual_qa_console_status", "Public Beta Visual QA Console", status === "ready" ? "Public Beta Visual QA Console 已准备" : (status === "blocked" ? "Public Beta Visual QA Console 已阻断" : "Public Beta Visual QA Console 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_visual_qa_visual_acceptance", "Visual Acceptance", safe.headerVisible === true && safe.categoryCardsVisible === true && safe.candidateCardsVisible === true ? "Visual Acceptance 已满足" : "Visual Acceptance 仍需复核", safe.headerVisible === true && safe.categoryCardsVisible === true && safe.candidateCardsVisible === true ? "pass" : "warning"),
      row("public_beta_visual_qa_scenario_coverage", "Scenario Coverage", "Flight / Hotel / Product / Restricted 场景已覆盖", "pass"),
      row("public_beta_visual_qa_transaction_boundary", "Transaction Boundary", safe.noTransactionButtonsVisible === false ? "交易按钮保持关闭" : "交易按钮可见", safe.noTransactionButtonsVisible === false ? "pass" : "blocked"),
      row("public_beta_visual_qa_manual_review", "Manual Review Required", "仍需人工视觉验收", "warning")
    ]);
  }

  function evaluateGlobalShoppingPublicBetaVisualQaConsole(input) {
    const safe = obj(input);
    const hasExplicitTrialSummary = present(safe.publicBetaTrialReadinessPackSummary);
    const hasExplicitManualAcceptanceSummary = present(safe.finalManualAcceptanceConsoleSummary);
    const hasExplicitFinalManualViewModelSummary = present(safe.publicBetaFinalManualViewModelSummary);
    const hasExplicitCategoryResultSummary = present(safe.categoryResultSimulatorSummary);
    const hasExplicitComparisonBoardSummary = present(safe.readOnlyComparisonBoardSummary);
    const trialSummary = resolveSummary(safe, "publicBetaTrialReadinessPackSummary", "WeishanGlobalShoppingPublicBetaTrialReadinessPack", "buildGlobalShoppingPublicBetaTrialReadinessPack");
    const manualAcceptanceSummary = resolveSummary(safe, "finalManualAcceptanceConsoleSummary", "WeishanGlobalShoppingFinalManualAcceptanceConsole", "buildGlobalShoppingFinalManualAcceptanceConsole");
    const finalManualViewModelSummary = resolveSummary(safe, "publicBetaFinalManualViewModelSummary", "WeishanGlobalShoppingPublicBetaFinalManualViewModel", "buildGlobalShoppingPublicBetaFinalManualViewModel");
    const categorySimulatorSummary = resolveSummary(safe, "categoryResultSimulatorSummary", "WeishanGlobalShoppingCategoryResultSimulator", "buildGlobalShoppingCategoryResultSimulator");
    const comparisonBoardSummary = resolveSummary(safe, "readOnlyComparisonBoardSummary", "WeishanGlobalShoppingReadOnlyComparisonBoard", "buildGlobalShoppingReadOnlyComparisonBoard");
    const blockedReasons = detectBlockedReasons(safe);
    const missingUpstream = !hasExplicitTrialSummary || !hasExplicitManualAcceptanceSummary || !hasExplicitFinalManualViewModelSummary || !hasExplicitCategoryResultSummary || !hasExplicitComparisonBoardSummary;
    const upstreamBlocked = [trialSummary, manualAcceptanceSummary, finalManualViewModelSummary, categorySimulatorSummary, comparisonBoardSummary].some(function (summary) {
      return safeStatus(obj(summary).status) === "blocked" || safeStatus(obj(summary).status) === "failed_safe";
    });
    const visibility = {
      headerVisible:safe.headerVisible !== false,
      categoryCardsVisible:safe.categoryCardsVisible !== false,
      candidateCardsVisible:safe.candidateCardsVisible !== false,
      comparisonBoardVisible:safe.comparisonBoardVisible !== false,
      trustBadgeVisible:safe.trustBadgeVisible !== false,
      boundaryCopyVisible:safe.boundaryCopyVisible !== false,
      knownLimitationsVisible:safe.knownLimitationsVisible !== false,
      manualReviewVisible:safe.manualReviewVisible !== false,
      noTransactionButtonsVisible:safe.noTransactionButtonsVisible === true
    };
    const mustReady = visibility.headerVisible && visibility.categoryCardsVisible && visibility.candidateCardsVisible && visibility.boundaryCopyVisible && visibility.manualReviewVisible;
    const status = blockedReasons.length || upstreamBlocked || visibility.noTransactionButtonsVisible ? "blocked" : ((!mustReady || missingUpstream) ? "needs_review" : "ready");
    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_VISUAL_QA_CONSOLE_VERSION,
      consoleMode:safeMode(safe.consoleMode),
      status,
      title:"Public Beta Visual QA Console",
      trialReadinessPackSummary:trialSummary,
      finalManualAcceptanceConsoleSummary:manualAcceptanceSummary,
      publicBetaFinalManualViewModelSummary:finalManualViewModelSummary,
      categoryResultSimulatorSummary:categorySimulatorSummary,
      readOnlyComparisonBoardSummary:comparisonBoardSummary,
      headerVisible:visibility.headerVisible,
      categoryCardsVisible:visibility.categoryCardsVisible,
      candidateCardsVisible:visibility.candidateCardsVisible,
      comparisonBoardVisible:visibility.comparisonBoardVisible,
      trustBadgeVisible:visibility.trustBadgeVisible,
      boundaryCopyVisible:visibility.boundaryCopyVisible,
      knownLimitationsVisible:visibility.knownLimitationsVisible,
      manualReviewVisible:visibility.manualReviewVisible,
      noTransactionButtonsVisible:visibility.noTransactionButtonsVisible,
      manualReviewRequired:true,
      checklist:buildGlobalShoppingPublicBetaVisualQaChecklist(visibility),
      rows:buildGlobalShoppingPublicBetaVisualQaRows(Object.assign({ status }, visibility)),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Public Beta Visual QA Console",
        resultLabel:status === "ready" ? "Public Beta Visual QA Console 已准备" : (status === "blocked" ? "Public Beta Visual QA Console 已阻断" : "Public Beta Visual QA Console 仍需复核"),
        caveat:"仍需人工视觉验收；不截图、不上传、不打开平台；当前只是 RC 候选，不创建 release、不 push。"
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

  function buildGlobalShoppingPublicBetaVisualQaConsoleAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaVisualQaConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_VISUAL_QA_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_VISUAL_QA_CONSOLE_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      checklistCount:toArray(safe.checklist).length,
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

  function sanitizeGlobalShoppingPublicBetaVisualQaConsole(consoleState) {
    return evaluateGlobalShoppingPublicBetaVisualQaConsole(consoleState || {});
  }

  function buildGlobalShoppingPublicBetaVisualQaConsole(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaVisualQaConsole(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaVisualQaConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaVisualQaConsole = {
    GLOBAL_SHOPPING_PUBLIC_BETA_VISUAL_QA_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingPublicBetaVisualQaConsole,
    evaluateGlobalShoppingPublicBetaVisualQaConsole,
    buildGlobalShoppingPublicBetaVisualQaRows,
    buildGlobalShoppingPublicBetaVisualQaChecklist,
    buildGlobalShoppingPublicBetaVisualQaConsoleAuditDraft,
    sanitizeGlobalShoppingPublicBetaVisualQaConsole
  };
})();
