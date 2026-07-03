;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_COMPARISON_BOARD_VERSION = "4.1.4";
  const BOARD_NAME = "global_shopping_read_only_comparison_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, read_only_comparison_only:true };
  const FORBIDDEN_CLAIM_RE = /lowest price|final price|locked price|官方认证|平台授权|官方背书|provider connected|已接入 provider|可调用 provider/i;

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
    const mode = text(value || "read_only_comparison_only");
    return ALLOWED_MODES[mode] ? mode : "read_only_comparison_only";
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
  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (FORBIDDEN_CLAIM_RE.test(JSON.stringify(safe))) reasons.push("forbidden_claim_detected");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    return reasons;
  }

  function buildGlobalShoppingReadOnlyComparisonRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("readonly_comparison_board_status", "Read-Only Comparison Board", status === "ready" ? "Read-Only Comparison Board 已准备" : (status === "blocked" ? "Read-Only Comparison Board 已阻断" : "Read-Only Comparison Board 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("readonly_comparison_board_boundary", "只读对比", "费用已归一化 / 已与官方价锚点对比 / Provider-Zero / 需要人工复核", "pass"),
      row("readonly_comparison_board_caveat", "风险提示", "不代表真实最低价 / 不代表最终成交价", "warning")
    ]);
  }

  function buildGlobalShoppingReadOnlyComparisonSections(input) {
    const safe = obj(input);
    const candidateEvidenceSummary = resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier");
    const feeNormalizationSummary = resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView");
    const officialAnchorSummary = resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView");
    const categoryResultSimulatorSummary = resolveSummary(safe, "categoryResultSimulatorSummary", "WeishanGlobalShoppingCategoryResultSimulator", "buildGlobalShoppingCategoryResultSimulator");
    return clone([
      section("comparison_candidate_evidence", "Candidate Evidence", labelOf(candidateEvidenceSummary, "候选价证据仍需复核"), candidateEvidenceSummary.status),
      section("comparison_fee_normalization", "Fee Normalization", labelOf(feeNormalizationSummary, "费用归一化仍需复核"), feeNormalizationSummary.status),
      section("comparison_official_anchor", "Official Anchor", labelOf(officialAnchorSummary, "官方价锚点仍需复核"), officialAnchorSummary.status),
      section("comparison_category_result", "Category Result Simulator", labelOf(categoryResultSimulatorSummary, "Category Result Simulator 仍需复核"), categoryResultSimulatorSummary.status)
    ]);
  }

  function evaluateGlobalShoppingReadOnlyComparisonBoard(input) {
    const safe = obj(input);
    const sections = buildGlobalShoppingReadOnlyComparisonSections(safe);
    const statuses = sections.map(function (item) { return safeStatus(item.status); });
    const blockedReasons = detectBlockedReasons(safe);
    const missingUpstream =
      !present(resolveSummary(safe, "globalShoppingReadOnlyCandidateEvidenceUnifierSummary", "WeishanGlobalShoppingReadOnlyCandidateEvidenceUnifier", "buildGlobalShoppingReadOnlyCandidateEvidenceUnifier")) ||
      !present(resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView")) ||
      !present(resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView")) ||
      !present(resolveSummary(safe, "categoryResultSimulatorSummary", "WeishanGlobalShoppingCategoryResultSimulator", "buildGlobalShoppingCategoryResultSimulator"));
    const blocked = blockedReasons.length > 0 || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview = missingUpstream || statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_COMPARISON_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      status,
      title:"Read-Only Comparison Board",
      comparedCandidates:toArray(obj(resolveSummary(safe, "categoryResultSimulatorSummary", "WeishanGlobalShoppingCategoryResultSimulator", "buildGlobalShoppingCategoryResultSimulator")).cards),
      normalizedPriceRows:toArray(obj(resolveSummary(safe, "globalShoppingFeeNormalizationViewSummary", "WeishanGlobalShoppingFeeNormalizationView", "buildGlobalShoppingFeeNormalizationView")).rows),
      officialAnchorRows:toArray(obj(resolveSummary(safe, "globalShoppingOfficialAnchorComparisonViewSummary", "WeishanGlobalShoppingOfficialAnchorComparisonView", "buildGlobalShoppingOfficialAnchorComparisonView")).rows),
      riskNotes:["不代表真实最低价", "不代表最终成交价"],
      userBoundary:"需要人工复核",
      providerZeroLocked:true,
      manualReviewRequired:true,
      sections,
      rows:buildGlobalShoppingReadOnlyComparisonRows({ status }),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Read-Only Comparison Board",
        resultLabel:status === "ready" ? "Read-Only Comparison Board 已准备" : (status === "blocked" ? "Read-Only Comparison Board 已阻断" : "Read-Only Comparison Board 仍需复核"),
        caveat:"当前只用于只读对比，不代表真实最低价或最终成交价。"
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

  function buildGlobalShoppingReadOnlyComparisonBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingReadOnlyComparisonBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_COMPARISON_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_COMPARISON_BOARD_VERSION,
      status:safe.status,
      sectionCount:toArray(safe.sections).length,
      providerZeroLocked:true,
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

  function sanitizeGlobalShoppingReadOnlyComparisonBoard(board) {
    return evaluateGlobalShoppingReadOnlyComparisonBoard(board || {});
  }

  window.WeishanGlobalShoppingReadOnlyComparisonBoard = {
    GLOBAL_SHOPPING_READ_ONLY_COMPARISON_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingReadOnlyComparisonBoard:sanitizeGlobalShoppingReadOnlyComparisonBoard,
    evaluateGlobalShoppingReadOnlyComparisonBoard,
    buildGlobalShoppingReadOnlyComparisonRows,
    buildGlobalShoppingReadOnlyComparisonSections,
    buildGlobalShoppingReadOnlyComparisonBoardAuditDraft,
    sanitizeGlobalShoppingReadOnlyComparisonBoard
  };
})();
