;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FINAL_MANUAL_ACCEPTANCE_CONSOLE_VERSION = "4.0.9";
  const CONSOLE_NAME = "global_shopping_final_manual_acceptance_console_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, final_manual_acceptance_only:true };
  const BLOCKED_TEXT_RE = /auto_pass|auto_release|production_ready|release|push|activation|file write|export|download|upload|mail|provider|network|key|endpoint|payment|order|ticketing|token|secret/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "final_manual_acceptance_only");
    return ALLOWED_MODES[mode] ? mode : "final_manual_acceptance_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    [
      "provider",
      "network",
      "key",
      "endpoint",
      "external",
      "payment",
      "order",
      "ticketing",
      "rawPersistence",
      "release",
      "push",
      "activation",
      "fileWrite",
      "export",
      "download",
      "upload",
      "mail"
    ].forEach(function (key) {
      if (safe[key] === true) reasons.push(key + "_enabled");
    });
    if (BLOCKED_TEXT_RE.test(text(safe.runtimeSummary || safe.riskLabel || safe.nextStageDecision || safe.copy || safe.summary))) {
      reasons.push("forbidden_claim_detected");
    }
    return reasons;
  }
  function safeDecision(value) {
    const decision = text(value || "manual_review_required");
    return /^(manual_review_required|not_ready|blocked)$/.test(decision) ? decision : "manual_review_required";
  }

  function buildGlobalShoppingFinalManualAcceptanceRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("final_manual_acceptance_console_status", "Final Manual Acceptance Console", status === "ready" ? "Final Manual Acceptance Console 已准备" : (status === "blocked" ? "Final Manual Acceptance Console 已阻断" : "Final Manual Acceptance Console 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("final_manual_acceptance_manual_review", "Manual Review Required", "人工验收后再决定下一阶段", "warning"),
      row("final_manual_acceptance_next_stage", "Next Stage Decision", safeDecision(safe.nextStageDecision), status === "blocked" ? "blocked" : "warning")
    ]);
  }

  function buildGlobalShoppingFinalManualAcceptanceChecklist(input) {
    const safe = obj(input);
    return clone([
      row("manual_acceptance_check_provider_zero", "Provider-Zero", safe.providerZeroLocked === true ? "true" : "false", safe.providerZeroLocked === true ? "pass" : "blocked"),
      row("manual_acceptance_check_read_only", "Read-Only", safe.readOnly === true ? "true" : "false", safe.readOnly === true ? "pass" : "blocked"),
      row("manual_acceptance_check_manual_review", "manualReviewRequired", safe.manualReviewRequired === true ? "true" : "false", safe.manualReviewRequired === true ? "pass" : "blocked")
    ]);
  }

  function evaluateGlobalShoppingFinalManualAcceptanceConsole(input) {
    const safe = obj(input);
    const blockedReasons = detectBlockedReasons(safe);
    const nextStageDecision = safeDecision(safe.nextStageDecision);
    const blocked = blockedReasons.length > 0 || nextStageDecision === "blocked" || safe.manualReviewRequired === false;
    const readySignals = safe.providerZeroLocked === true && safe.readOnly === true && safe.manualReviewRequired === true;
    const status = blocked ? "blocked" : (readySignals ? "ready" : "needs_review");
    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_MANUAL_ACCEPTANCE_CONSOLE_VERSION,
      consoleMode:safeMode(safe.consoleMode),
      status,
      title:"Final Manual Acceptance Console",
      checklist:buildGlobalShoppingFinalManualAcceptanceChecklist({
        providerZeroLocked:safe.providerZeroLocked !== false,
        readOnly:safe.readOnly !== false,
        manualReviewRequired:safe.manualReviewRequired !== false
      }),
      passCriteria:["Provider-Zero", "Read-Only", "Manual Review Required"],
      blockedCapabilities:["付款", "下单", "出票", "provider", "联网"],
      testerWarnings:["不自动通过", "不自动发布", "人工验收后再决定下一阶段"],
      manualReviewRequired:true,
      nextStageDecision:status === "ready" ? "manual_review_required" : nextStageDecision,
      rows:buildGlobalShoppingFinalManualAcceptanceRows({ status, nextStageDecision }),
      blockedReasons,
      userFacingSummary:{
        title:"Final Manual Acceptance Console",
        resultLabel:status === "ready" ? "Final Manual Acceptance Console 已准备" : (status === "blocked" ? "Final Manual Acceptance Console 已阻断" : "Final Manual Acceptance Console 仍需复核"),
        caveat:"不自动通过，不自动发布，人工验收后再决定下一阶段。"
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

  function buildGlobalShoppingFinalManualAcceptanceConsoleAuditDraft(input) {
    const safe = evaluateGlobalShoppingFinalManualAcceptanceConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FINAL_MANUAL_ACCEPTANCE_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_MANUAL_ACCEPTANCE_CONSOLE_VERSION,
      status:safe.status,
      nextStageDecision:safe.nextStageDecision,
      manualReviewRequired:true,
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

  function sanitizeGlobalShoppingFinalManualAcceptanceConsole(consoleState) {
    return evaluateGlobalShoppingFinalManualAcceptanceConsole(consoleState || {});
  }

  window.WeishanGlobalShoppingFinalManualAcceptanceConsole = {
    GLOBAL_SHOPPING_FINAL_MANUAL_ACCEPTANCE_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingFinalManualAcceptanceConsole:sanitizeGlobalShoppingFinalManualAcceptanceConsole,
    evaluateGlobalShoppingFinalManualAcceptanceConsole,
    buildGlobalShoppingFinalManualAcceptanceRows,
    buildGlobalShoppingFinalManualAcceptanceChecklist,
    buildGlobalShoppingFinalManualAcceptanceConsoleAuditDraft,
    sanitizeGlobalShoppingFinalManualAcceptanceConsole
  };
})();
