;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_CONSOLE_VERSION = "4.1.5";
  const CONSOLE_NAME = "global_shopping_public_beta_operator_console_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, operator_console_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|endpoint|providerClient|rawRequest|rawResponse|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "operator_console_only");
    return ALLOWED_MODES[mode] ? mode : "operator_console_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, title, summary, status) {
    return { sectionId:text(sectionId), title:text(title), summary:text(summary), status:safeStatus(status), redacted:true };
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
  function blockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.appVersion && text(safe.appVersion) !== GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_CONSOLE_VERSION) reasons.push("app_version_mismatch");
    if (safe.provider === true || safe.enableProvider === true || safe.productionProvider === true) reasons.push("provider_detected");
    if (safe.network === true) reasons.push("network_detected");
    if (safe.readApiKey === true || safe.key === true) reasons.push("key_detected");
    if (safe.endpoint === true || safe.providerClient === true) reasons.push("endpoint_detected");
    if (safe.external === true || safe.openExternal === true || safe.windowOpen === true) reasons.push("external_open_detected");
    if (safe.payment === true || safe.order === true || safe.ticketing === true || safe.booking === true || safe.checkout === true) reasons.push("transaction_detected");
    if (safe.persistRawProviderData === true || safe.persistRawUserText === true || safe.rawPersistence === true) reasons.push("raw_persistence_detected");
    if (safe.release === true || safe.createRelease === true) reasons.push("release_detected");
    if (safe.tag === true || safe.createTag === true) reasons.push("tag_detected");
    if (safe.push === true) reasons.push("push_detected");
    if (safe.fileWrite === true || safe.writeFile === true) reasons.push("file_write_detected");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    if (safe.buyButtonEnabled === true || safe.checkoutButtonEnabled === true || safe.paymentButtonEnabled === true) reasons.push("transaction_button_enabled");
    return reasons;
  }

  function buildGlobalShoppingPublicBetaOperatorSections(input) {
    const safe = obj(input);
    const finalGateSummary = resolveSummary(safe, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate");
    const rcBoardSummary = resolveSummary(safe, "releaseCandidateConfidenceBoardSummary", "WeishanGlobalShoppingReleaseCandidateConfidenceBoard", "buildGlobalShoppingReleaseCandidateConfidenceBoard");
    const providerZeroSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const evidenceSummary = resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier");
    const feeSummary = resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView");
    const anchorSummary = resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView");
    const userJourneySummary = resolveSummary(safe, "publicBetaUserJourneyShellSummary", "WeishanGlobalShoppingPublicBetaUserJourneyShell", "buildGlobalShoppingPublicBetaUserJourneyShell");
    const safeIntentSummary = resolveSummary(safe, "safeSearchIntentMatrixSummary", "WeishanGlobalShoppingSafeSearchIntentMatrix", "buildGlobalShoppingSafeSearchIntentMatrix");
    const userBoundarySummary = resolveSummary(safe, "publicBetaUserBoundaryPanelSummary", "WeishanGlobalShoppingPublicBetaUserBoundaryPanel", "buildGlobalShoppingPublicBetaUserBoundaryPanel");
    const categoryResultSimulatorSummary = resolveSummary(safe, "categoryResultSimulatorSummary", "WeishanGlobalShoppingCategoryResultSimulator", "buildGlobalShoppingCategoryResultSimulator");
    const readOnlyComparisonBoardSummary = resolveSummary(safe, "readOnlyComparisonBoardSummary", "WeishanGlobalShoppingReadOnlyComparisonBoard", "buildGlobalShoppingReadOnlyComparisonBoard");
    const resultTrustBadgePanelSummary = resolveSummary(safe, "resultTrustBadgePanelSummary", "WeishanGlobalShoppingResultTrustBadgePanel", "buildGlobalShoppingResultTrustBadgePanel");
    return clone([
      section("public_beta_final_gate", "Public Beta Final Gate", labelOf(finalGateSummary, "Public Beta Final Gate 仍需复核"), finalGateSummary.status),
      section("release_candidate_confidence_board", "RC Confidence Board", labelOf(rcBoardSummary, "RC Confidence Board 仍需复核"), rcBoardSummary.status),
      section("provider_zero_runtime_lock", "Provider-Zero Runtime Lock", labelOf(providerZeroSummary, "Provider-Zero Runtime Lock 仍需复核"), providerZeroSummary.status),
      section("candidate_evidence_unifier", "Candidate Evidence Unifier", labelOf(evidenceSummary, "候选价证据仍需复核"), evidenceSummary.status),
      section("fee_normalization_view", "Fee Normalization View", labelOf(feeSummary, "费用归一化仍需复核"), feeSummary.status),
      section("official_anchor_view", "Official Anchor Comparison View", labelOf(anchorSummary, "官方价锚点仍需复核"), anchorSummary.status),
      section("public_beta_user_journey", "Public Beta User Journey", labelOf(userJourneySummary, "Public Beta User Journey 仍需复核"), userJourneySummary.status),
      section("safe_search_intent_matrix", "Safe Search Intent Matrix", labelOf(safeIntentSummary, "Safe Search Intent Matrix 仍需复核"), safeIntentSummary.status),
      section("user_boundary_panel", "User Boundary Panel", labelOf(userBoundarySummary, "User Boundary Panel 仍需复核"), userBoundarySummary.status),
      section("category_result_simulator", "Category Result Simulator", labelOf(categoryResultSimulatorSummary, "Category Result Simulator 仍需复核"), categoryResultSimulatorSummary.status),
      section("read_only_comparison_board", "Read-Only Comparison Board", labelOf(readOnlyComparisonBoardSummary, "Read-Only Comparison Board 仍需复核"), readOnlyComparisonBoardSummary.status),
      section("result_trust_badge_panel", "Result Trust Badge", labelOf(resultTrustBadgePanelSummary, "Result Trust Badge 仍需复核"), resultTrustBadgePanelSummary.status)
    ]);
  }

  function buildGlobalShoppingPublicBetaOperatorRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    const sections = toArray(safe.sections);
    return clone([
      row("public_beta_operator_console_status", "Public Beta Operator Console", status === "ready" ? "Public Beta Operator Console 已准备" : (status === "blocked" ? "Public Beta Operator Console 已阻断" : "Public Beta Operator Console 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("public_beta_operator_console_boundary", "Operator Console 边界", "不提供 release / push / activation 入口，不写文件，不联网，不打开外部平台", "pass"),
      row("public_beta_operator_console_manual_review", "Manual Review Required", "仍需人工复核后再决定是否进入下一阶段", safe.manualReviewRequired === true ? "warning" : "blocked")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.title, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function buildGlobalShoppingPublicBetaOperatorConsoleAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_CONSOLE_VERSION,
      status:safeStatus(safe.status),
      sectionCount:toArray(safe.sections).length,
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
      fileWrite:false,
      download:false,
      upload:false,
      redacted:true
    });
  }

  function evaluateGlobalShoppingPublicBetaOperatorConsole(input) {
    const safe = obj(input);
    const sections = buildGlobalShoppingPublicBetaOperatorSections(safe);
    const statuses = sections.map(function (item) { return safeStatus(item.status); });
    const hasMissing = sections.some(function (item) { return item.summary.indexOf("仍需复核") >= 0; }) && sections.some(function (item) { return item.status === "needs_review"; });
    const directBlockedReasons = blockedReasons(safe);
    const blocked = directBlockedReasons.length > 0 || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      sections.length < 12 ||
      statuses.indexOf("needs_review") >= 0 ||
      !present(resolveSummary(safe, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate")) ||
      !present(resolveSummary(safe, "releaseCandidateConfidenceBoardSummary", "WeishanGlobalShoppingReleaseCandidateConfidenceBoard", "buildGlobalShoppingReleaseCandidateConfidenceBoard")) ||
      !present(resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock")) ||
      !present(resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier")) ||
      !present(resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView")) ||
      !present(resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView")) ||
      !present(resolveSummary(safe, "publicBetaUserJourneyShellSummary", "WeishanGlobalShoppingPublicBetaUserJourneyShell", "buildGlobalShoppingPublicBetaUserJourneyShell")) ||
      !present(resolveSummary(safe, "safeSearchIntentMatrixSummary", "WeishanGlobalShoppingSafeSearchIntentMatrix", "buildGlobalShoppingSafeSearchIntentMatrix")) ||
      !present(resolveSummary(safe, "publicBetaUserBoundaryPanelSummary", "WeishanGlobalShoppingPublicBetaUserBoundaryPanel", "buildGlobalShoppingPublicBetaUserBoundaryPanel")) ||
      !present(resolveSummary(safe, "categoryResultSimulatorSummary", "WeishanGlobalShoppingCategoryResultSimulator", "buildGlobalShoppingCategoryResultSimulator")) ||
      !present(resolveSummary(safe, "readOnlyComparisonBoardSummary", "WeishanGlobalShoppingReadOnlyComparisonBoard", "buildGlobalShoppingReadOnlyComparisonBoard")) ||
      !present(resolveSummary(safe, "resultTrustBadgePanelSummary", "WeishanGlobalShoppingResultTrustBadgePanel", "buildGlobalShoppingResultTrustBadgePanel")) ||
      hasMissing;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_CONSOLE_VERSION,
      status,
      consoleMode:safeMode(safe.consoleMode),
      title:"Public Beta Operator Console",
      publicBetaStatus:safeStatus(resolveSummary(safe, "publicBetaFinalGateSummary", "WeishanGlobalShoppingPublicBetaFinalGate", "buildGlobalShoppingPublicBetaFinalGate").status),
      providerZeroStatus:safeStatus(resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock").status),
      evidenceStatus:safeStatus(resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier").status),
      feeNormalizationStatus:safeStatus(resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView").status),
      officialAnchorStatus:safeStatus(resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView").status),
      publicBetaUserJourneyStatus:safeStatus(resolveSummary(safe, "publicBetaUserJourneyShellSummary", "WeishanGlobalShoppingPublicBetaUserJourneyShell", "buildGlobalShoppingPublicBetaUserJourneyShell").status),
      safeSearchIntentMatrixStatus:safeStatus(resolveSummary(safe, "safeSearchIntentMatrixSummary", "WeishanGlobalShoppingSafeSearchIntentMatrix", "buildGlobalShoppingSafeSearchIntentMatrix").status),
      publicBetaUserBoundaryStatus:safeStatus(resolveSummary(safe, "publicBetaUserBoundaryPanelSummary", "WeishanGlobalShoppingPublicBetaUserBoundaryPanel", "buildGlobalShoppingPublicBetaUserBoundaryPanel").status),
      categoryResultSimulatorStatus:safeStatus(resolveSummary(safe, "categoryResultSimulatorSummary", "WeishanGlobalShoppingCategoryResultSimulator", "buildGlobalShoppingCategoryResultSimulator").status),
      readOnlyComparisonBoardStatus:safeStatus(resolveSummary(safe, "readOnlyComparisonBoardSummary", "WeishanGlobalShoppingReadOnlyComparisonBoard", "buildGlobalShoppingReadOnlyComparisonBoard").status),
      resultTrustBadgePanelStatus:safeStatus(resolveSummary(safe, "resultTrustBadgePanelSummary", "WeishanGlobalShoppingResultTrustBadgePanel", "buildGlobalShoppingResultTrustBadgePanel").status),
      lockedCapabilities:[
        "Provider-Zero 状态通过",
        "候选价证据通过",
        "费用归一化通过",
        "官方价锚点通过",
        "Category Result Simulator",
        "Read-Only Comparison Board",
        "Result Trust Badge",
        "只读搜索计划通过",
        "用户边界确认通过",
        "Manual Review Required"
      ],
      manualReviewRequired:true,
      sections,
      rows:buildGlobalShoppingPublicBetaOperatorRows({ status, sections, manualReviewRequired:true }),
      auditDraft:buildGlobalShoppingPublicBetaOperatorConsoleAuditDraft({ status, sections }),
      blockedReasons:directBlockedReasons,
      userFacingSummary:{
        title:"Public Beta Operator Console",
        resultLabel:status === "ready" ? "Public Beta Operator Console 已准备" : (status === "blocked" ? "Public Beta Operator Console 已阻断" : "Public Beta Operator Console 仍需复核"),
        caveat:"仍需人工复核后再决定是否进入下一阶段。"
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
      safeToProceedWithManualComparisonReview:status === "ready",
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaOperatorConsole(consoleSummary) {
    return evaluateGlobalShoppingPublicBetaOperatorConsole(consoleSummary || {});
  }

  function buildGlobalShoppingPublicBetaOperatorConsole(input) {
    try {
      return evaluateGlobalShoppingPublicBetaOperatorConsole(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicBetaOperatorConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaOperatorConsole = {
    GLOBAL_SHOPPING_PUBLIC_BETA_OPERATOR_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingPublicBetaOperatorConsole,
    evaluateGlobalShoppingPublicBetaOperatorConsole,
    buildGlobalShoppingPublicBetaOperatorRows,
    buildGlobalShoppingPublicBetaOperatorSections,
    buildGlobalShoppingPublicBetaOperatorConsoleAuditDraft,
    sanitizeGlobalShoppingPublicBetaOperatorConsole
  };
})();
