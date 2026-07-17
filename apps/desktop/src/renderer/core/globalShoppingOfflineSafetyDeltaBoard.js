;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_SAFETY_DELTA_BOARD_VERSION = "4.2.8";
  const BOARD_NAME = "global_shopping_offline_safety_delta_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, safety_delta_board_only:true };
  const UNCHANGED_BOUNDARIES = ["provider", "network", "key", "endpoint", "external_open", "payment", "order", "ticketing", "release", "push", "launch"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /boundaryExpanded|safetyBoundaryRelaxed|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) {
    return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function rule(ruleId, label, passed) {
    return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "safety_delta_board_only");
    return ALLOWED_MODES[mode] ? mode : "safety_delta_board_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function hasTruthyUrl(value) {
    const normalized = text(value);
    return normalized && normalized !== "null";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true || safe.tag === true || safe.createTag === true) blocked.push("release");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.launch === true || safe.autoLaunch === true) blocked.push("launch");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    ["status", "title", "summary", "subtitle", "deltaStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe delta language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingOfflineSafetyDeltaBoard(input) {
    const safe = obj(input);
    const publicBetaCandidateEvidenceReviewSummary = resolveSummary(safe, "publicBetaCandidateEvidenceReviewSummary", "WeishanGlobalShoppingPublicBetaCandidateEvidenceReview", "buildGlobalShoppingPublicBetaCandidateEvidenceReview");
    const trialOperatorNotesPanelSummary = resolveSummary(safe, "trialOperatorNotesPanelSummary", "WeishanGlobalShoppingTrialOperatorNotesPanel", "buildGlobalShoppingTrialOperatorNotesPanel");
    const noProviderProductionBoundarySummary = resolveSummary(safe, "noProviderProductionBoundarySummary", "WeishanGlobalShoppingNoProviderProductionBoundary", "buildGlobalShoppingNoProviderProductionBoundary");
    const offlineLaunchBlockerMatrixSummary = resolveSummary(safe, "offlineLaunchBlockerMatrixSummary", "WeishanGlobalShoppingOfflineLaunchBlockerMatrix", "buildGlobalShoppingOfflineLaunchBlockerMatrix");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const summaries = [
      publicBetaCandidateEvidenceReviewSummary,
      trialOperatorNotesPanelSummary,
      noProviderProductionBoundarySummary,
      offlineLaunchBlockerMatrixSummary,
      noTransactionRegressionGuardSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateEvidenceReviewSummary).evidenceReviewStatus || obj(publicBetaCandidateEvidenceReviewSummary).status, "needs_review"),
      normalizeStatus(obj(trialOperatorNotesPanelSummary).notesStatus || obj(trialOperatorNotesPanelSummary).status, "needs_review"),
      normalizeStatus(obj(noProviderProductionBoundarySummary).boundaryStatus || obj(noProviderProductionBoundarySummary).status, "needs_review"),
      normalizeStatus(obj(offlineLaunchBlockerMatrixSummary).blockerMatrixStatus || obj(offlineLaunchBlockerMatrixSummary).status, "needs_review"),
      normalizeStatus(obj(noTransactionRegressionGuardSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; });
    const deltaStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_SAFETY_DELTA_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      deltaStatus:deltaStatus,
      status:deltaStatus,
      unchangedSafetyBoundaries:UNCHANGED_BOUNDARIES.slice(),
      changedSafetyNotes:["安全边界未扩大"],
      blockedCapabilities:["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch"],
      regressionChecks:[
        "provider / network / key / endpoint 仍关闭",
        "external open / payment / order / ticketing 仍关闭",
        "release / push / launch 仍关闭"
      ],
      manualReviewRequired:true,
      publicBetaCandidateEvidenceReviewSummary:publicBetaCandidateEvidenceReviewSummary,
      trialOperatorNotesPanelSummary:trialOperatorNotesPanelSummary,
      noProviderProductionBoundarySummary:noProviderProductionBoundarySummary,
      offlineLaunchBlockerMatrixSummary:offlineLaunchBlockerMatrixSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"Offline Safety Delta Board",
        resultLabel:deltaStatus === "blocked" ? "Offline Safety Delta Board 已阻断" : (deltaStatus === "needs_review" ? "Offline Safety Delta Board 仍需复核" : "Offline Safety Delta Board 需人工复核"),
        caveat:"安全边界未扩大"
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

  function buildGlobalShoppingOfflineSafetyDeltaRows(input) {
    const safe = evaluateGlobalShoppingOfflineSafetyDeltaBoard(input || {});
    return clone([
      row("offline_safety_delta_board", "Offline Safety Delta Board", safe.userFacingSummary.resultLabel, safe.deltaStatus === "blocked" ? "blocked" : "warning"),
      row("offline_safety_delta_unchanged", "Safety Delta", safe.unchangedSafetyBoundaries.join(" / "), "warning"),
      row("offline_safety_delta_changed", "Changed Safety Notes", safe.changedSafetyNotes.join(" / "), "warning"),
      row("offline_safety_delta_blocked", "Blocked Capabilities", safe.blockedCapabilities.join(" / "), "warning"),
      row("offline_safety_delta_manual", "Manual Review Required", "安全边界未扩大", "warning")
    ]);
  }

  function buildGlobalShoppingOfflineSafetyDeltaRules(input) {
    const safe = evaluateGlobalShoppingOfflineSafetyDeltaBoard(input || {});
    return clone(UNCHANGED_BOUNDARIES.map(function (boundary) {
      return rule("unchanged_" + boundary, boundary + " 未开放", safe.unchangedSafetyBoundaries.indexOf(boundary) >= 0);
    }).concat([rule("manual_review_required", "manualReviewRequired 必须 true", safe.manualReviewRequired === true)]));
  }

  function buildGlobalShoppingOfflineSafetyDeltaBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineSafetyDeltaBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_SAFETY_DELTA_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_SAFETY_DELTA_BOARD_VERSION,
      deltaStatus:safe.deltaStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineSafetyDeltaBoard(board) {
    const safe = evaluateGlobalShoppingOfflineSafetyDeltaBoard(board || {});
    safe.rows = buildGlobalShoppingOfflineSafetyDeltaRows(safe);
    safe.rules = buildGlobalShoppingOfflineSafetyDeltaRules(safe);
    safe.externalUrl = null;
    safe.platformUrl = null;
    safe.providerUrl = null;
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.buyButtonEnabled = false;
    safe.checkoutButtonEnabled = false;
    safe.paymentButtonEnabled = false;
    return safe;
  }

  function buildGlobalShoppingOfflineSafetyDeltaBoard(input) {
    try {
      return sanitizeGlobalShoppingOfflineSafetyDeltaBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineSafetyDeltaBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineSafetyDeltaBoard = {
    GLOBAL_SHOPPING_OFFLINE_SAFETY_DELTA_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingOfflineSafetyDeltaBoard,
    evaluateGlobalShoppingOfflineSafetyDeltaBoard,
    buildGlobalShoppingOfflineSafetyDeltaRows,
    buildGlobalShoppingOfflineSafetyDeltaRules,
    buildGlobalShoppingOfflineSafetyDeltaBoardAuditDraft,
    sanitizeGlobalShoppingOfflineSafetyDeltaBoard
  };
})();
