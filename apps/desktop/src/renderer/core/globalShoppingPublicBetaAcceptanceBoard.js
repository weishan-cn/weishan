;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_BOARD_VERSION = "4.2.0";
  const BOARD_NAME = "global_shopping_public_beta_acceptance_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, acceptance_board_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "acceptance_board_only");
    return ALLOWED_MODES[mode] ? mode : "acceptance_board_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }

  function buildGlobalShoppingPublicBetaAcceptanceCriteria(input) {
    const safe = obj(input);
    return clone([
      row("provider_zero_locked", "providerZeroLocked", safe.providerZeroLocked === true ? "true" : "false", safe.providerZeroLocked === true ? "pass" : "warning"),
      row("candidate_evidence_ready", "candidateEvidenceReady", safe.candidateEvidenceReady === true ? "true" : "false", safe.candidateEvidenceReady === true ? "pass" : "warning"),
      row("fee_normalization_ready", "feeNormalizationReady", safe.feeNormalizationReady === true ? "true" : "false", safe.feeNormalizationReady === true ? "pass" : "warning"),
      row("official_anchor_ready", "officialAnchorReady", safe.officialAnchorReady === true ? "true" : "false", safe.officialAnchorReady === true ? "pass" : "warning"),
      row("safety_copy_clean", "safetyCopyClean", safe.safetyCopyClean === true ? "true" : "false", safe.safetyCopyClean === true ? "pass" : "warning"),
      row("category_shell_ready", "categoryShellReady", safe.categoryShellReady === true ? "true" : "false", safe.categoryShellReady === true ? "pass" : "warning"),
      row("user_journey_ready", "userJourneyReady", safe.userJourneyReady === true ? "true" : "false", safe.userJourneyReady === true ? "pass" : "warning"),
      row("safe_intent_ready", "safeIntentReady", safe.safeIntentReady === true ? "true" : "false", safe.safeIntentReady === true ? "pass" : "warning"),
      row("user_boundary_ready", "userBoundaryReady", safe.userBoundaryReady === true ? "true" : "false", safe.userBoundaryReady === true ? "pass" : "warning"),
      row("category_result_ready", "categoryResultReady", safe.categoryResultReady === true ? "true" : "false", safe.categoryResultReady === true ? "pass" : "warning"),
      row("comparison_board_ready", "comparisonBoardReady", safe.comparisonBoardReady === true ? "true" : "false", safe.comparisonBoardReady === true ? "pass" : "warning"),
      row("trust_badge_ready", "trustBadgeReady", safe.trustBadgeReady === true ? "true" : "false", safe.trustBadgeReady === true ? "pass" : "warning"),
      row("trial_readiness_pack_ready", "trialReadinessPackReady", safe.trialReadinessPackReady === true ? "true" : "false", safe.trialReadinessPackReady === true ? "pass" : "warning"),
      row("manual_acceptance_console_ready", "manualAcceptanceConsoleReady", safe.manualAcceptanceConsoleReady === true ? "true" : "false", safe.manualAcceptanceConsoleReady === true ? "pass" : "warning"),
      row("feedback_placeholder_ready", "feedbackPlaceholderReady", safe.feedbackPlaceholderReady === true ? "true" : "false", safe.feedbackPlaceholderReady === true ? "pass" : "warning"),
      row("final_manual_view_model_ready", "finalManualViewModelReady", safe.finalManualViewModelReady === true ? "true" : "false", safe.finalManualViewModelReady === true ? "pass" : "warning"),
      row("final_audit_ready", "finalAuditReady", safe.finalAuditReady === true ? "true" : "false", safe.finalAuditReady === true ? "pass" : "warning"),
      row("no_payment", "noPayment", safe.noPayment === true ? "true" : "false", safe.noPayment === true ? "pass" : "blocked"),
      row("no_order", "noOrder", safe.noOrder === true ? "true" : "false", safe.noOrder === true ? "pass" : "blocked"),
      row("no_ticketing", "noTicketing", safe.noTicketing === true ? "true" : "false", safe.noTicketing === true ? "pass" : "blocked"),
      row("no_external_open", "noExternalOpen", safe.noExternalOpen === true ? "true" : "false", safe.noExternalOpen === true ? "pass" : "blocked"),
      row("manual_review_required", "manualReviewRequired", safe.manualReviewRequired === true ? "true" : "false", safe.manualReviewRequired === true ? "warning" : "blocked")
    ]);
  }

  function buildGlobalShoppingPublicBetaAcceptanceRows(input) {
    const safe = obj(input);
    return clone([
      row("public_beta_acceptance_board_status", "Public Beta Acceptance Board", safe.status === "ready" ? "Public Beta Acceptance Board 已准备" : (safe.status === "blocked" ? "Public Beta Acceptance Board 已阻断" : "Public Beta Acceptance Board 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning"))
    ].concat(toArray(safe.criteria)));
  }

  function buildGlobalShoppingPublicBetaAcceptanceBoardAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_BOARD_VERSION,
      status:safeStatus(safe.status),
      criteriaCount:toArray(safe.criteria).length,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function evaluateGlobalShoppingPublicBetaAcceptanceBoard(input) {
    const safe = obj(input);
    const criteriaSource = {
      providerZeroLocked:safe.providerZeroLocked === true,
      candidateEvidenceReady:safe.candidateEvidenceReady === true,
      feeNormalizationReady:safe.feeNormalizationReady === true,
      officialAnchorReady:safe.officialAnchorReady === true,
      safetyCopyClean:safe.safetyCopyClean === true,
      categoryShellReady:safe.categoryShellReady === true,
      userJourneyReady:safe.userJourneyReady === true,
      safeIntentReady:safe.safeIntentReady === true,
      userBoundaryReady:safe.userBoundaryReady === true,
      categoryResultReady:safe.categoryResultReady === true,
      comparisonBoardReady:safe.comparisonBoardReady === true,
      trustBadgeReady:safe.trustBadgeReady === true,
      trialReadinessPackReady:safe.trialReadinessPackReady === true,
      manualAcceptanceConsoleReady:safe.manualAcceptanceConsoleReady === true,
      feedbackPlaceholderReady:safe.feedbackPlaceholderReady === true,
      finalManualViewModelReady:safe.finalManualViewModelReady === true,
      finalAuditReady:safe.finalAuditReady === true,
      noPayment:safe.noPayment !== false,
      noOrder:safe.noOrder !== false,
      noTicketing:safe.noTicketing !== false,
      noExternalOpen:safe.noExternalOpen !== false,
      manualReviewRequired:true
    };
    const criteria = buildGlobalShoppingPublicBetaAcceptanceCriteria(criteriaSource);
    const hardBlocked =
      safe.provider === true ||
      safe.network === true ||
      safe.key === true ||
      safe.endpoint === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.external === true ||
      safe.openExternal === true ||
      safe.release === true ||
      safe.push === true ||
      safe.activation === true;
    const allReady = criteriaSource.providerZeroLocked &&
      criteriaSource.candidateEvidenceReady &&
      criteriaSource.feeNormalizationReady &&
      criteriaSource.officialAnchorReady &&
      criteriaSource.safetyCopyClean &&
      criteriaSource.categoryShellReady &&
      criteriaSource.userJourneyReady &&
      criteriaSource.safeIntentReady &&
      criteriaSource.userBoundaryReady &&
      criteriaSource.categoryResultReady &&
      criteriaSource.comparisonBoardReady &&
      criteriaSource.trustBadgeReady &&
      criteriaSource.trialReadinessPackReady &&
      criteriaSource.manualAcceptanceConsoleReady &&
      criteriaSource.feedbackPlaceholderReady &&
      criteriaSource.finalManualViewModelReady &&
      criteriaSource.finalAuditReady &&
      criteriaSource.noPayment &&
      criteriaSource.noOrder &&
      criteriaSource.noTicketing &&
      criteriaSource.noExternalOpen &&
      criteriaSource.manualReviewRequired;
    const status = hardBlocked ? "blocked" : (allReady ? "ready" : "needs_review");
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_BOARD_VERSION,
      status,
      boardMode:safeMode(safe.boardMode),
      title:"Public Beta Acceptance Board",
      criteria,
      rows:buildGlobalShoppingPublicBetaAcceptanceRows({ status, criteria }),
      auditDraft:buildGlobalShoppingPublicBetaAcceptanceBoardAuditDraft({ status, criteria }),
      userFacingSummary:{
        title:"Public Beta Acceptance Board",
        resultLabel:status === "ready" ? "Public Beta Acceptance Board 已准备" : (status === "blocked" ? "Public Beta Acceptance Board 已阻断" : "Public Beta Acceptance Board 仍需复核"),
        caveat:"仍需人工复核后再决定是否进入下一阶段。"
      },
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
    }, criteriaSource);
  }

  function sanitizeGlobalShoppingPublicBetaAcceptanceBoard(board) {
    return evaluateGlobalShoppingPublicBetaAcceptanceBoard(board || {});
  }

  function buildGlobalShoppingPublicBetaAcceptanceBoard(input) {
    try {
      return evaluateGlobalShoppingPublicBetaAcceptanceBoard(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicBetaAcceptanceBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaAcceptanceBoard = {
    GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingPublicBetaAcceptanceBoard,
    evaluateGlobalShoppingPublicBetaAcceptanceBoard,
    buildGlobalShoppingPublicBetaAcceptanceRows,
    buildGlobalShoppingPublicBetaAcceptanceCriteria,
    buildGlobalShoppingPublicBetaAcceptanceBoardAuditDraft,
    sanitizeGlobalShoppingPublicBetaAcceptanceBoard
  };
})();
