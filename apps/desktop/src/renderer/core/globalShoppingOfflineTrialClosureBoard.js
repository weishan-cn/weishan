;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_TRIAL_CLOSURE_BOARD_VERSION = "4.2.6";
  const BOARD_NAME = "global_shopping_offline_trial_closure_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_trial_closure_only:true };
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;

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
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "offline_trial_closure_only");
    return ALLOWED_MODES[mode] ? mode : "offline_trial_closure_only";
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
    if (safe.taskClose === true || safe.closeTask === true || safe.realTaskClose === true) blocked.push("task close");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueUpload === true || safe.uploadIssue === true) blocked.push("issue create");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.openExternal === true || safe.externalOpen === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true || safe.rawUserText === true) blocked.push("raw user text persistence");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingOfflineTrialClosureBoard(input) {
    const safe = obj(input);
    const acceptanceReviewConsoleSummary = resolveSummary(safe, "publicBetaAcceptanceReviewConsoleSummary", "WeishanGlobalShoppingPublicBetaAcceptanceReviewConsole", "buildGlobalShoppingPublicBetaAcceptanceReviewConsole");
    const issueReviewBoardSummary = resolveSummary(safe, "manualTrialIssueReviewBoardSummary", "WeishanGlobalShoppingManualTrialIssueReviewBoard", "buildGlobalShoppingManualTrialIssueReviewBoard");
    const trialEvidenceLedgerSummary = resolveSummary(safe, "publicBetaTrialEvidenceLedgerSummary", "WeishanGlobalShoppingPublicBetaTrialEvidenceLedger", "buildGlobalShoppingPublicBetaTrialEvidenceLedger");
    const manualTrialSummaryBoardSummary = resolveSummary(safe, "manualTrialSummaryBoardSummary", "WeishanGlobalShoppingManualTrialSummaryBoard", "buildGlobalShoppingManualTrialSummaryBoard");
    const offlineReadinessReviewPanelSummary = resolveSummary(safe, "offlineReadinessReviewPanelSummary", "WeishanGlobalShoppingOfflineReadinessReviewPanel", "buildGlobalShoppingOfflineReadinessReviewPanel");
    const summaries = [acceptanceReviewConsoleSummary, issueReviewBoardSummary, trialEvidenceLedgerSummary, manualTrialSummaryBoardSummary, offlineReadinessReviewPanelSummary];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(acceptanceReviewConsoleSummary).acceptanceReviewStatus || obj(acceptanceReviewConsoleSummary).status, "needs_review"),
      normalizeStatus(obj(issueReviewBoardSummary).issueReviewStatus || obj(issueReviewBoardSummary).status, "needs_review"),
      normalizeStatus(obj(trialEvidenceLedgerSummary).ledgerStatus || obj(trialEvidenceLedgerSummary).status, "needs_review"),
      normalizeStatus(obj(manualTrialSummaryBoardSummary).trialSummaryStatus || obj(manualTrialSummaryBoardSummary).status, "needs_review"),
      normalizeStatus(obj(offlineReadinessReviewPanelSummary).readinessStatus || obj(offlineReadinessReviewPanelSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; });
    const closureStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const closedLoopItems = unique([
      text(obj(acceptanceReviewConsoleSummary.userFacingSummary).resultLabel || "Public Beta Acceptance Review Console 仍需复核"),
      text(obj(issueReviewBoardSummary.userFacingSummary).resultLabel || "Manual Trial Issue Review Board 仍需复核"),
      text(obj(trialEvidenceLedgerSummary.userFacingSummary).resultLabel || "Public Beta Trial Evidence Ledger 仍需复核"),
      text(obj(manualTrialSummaryBoardSummary.userFacingSummary).resultLabel || "Manual Trial Summary Board 仍需复核"),
      text(obj(offlineReadinessReviewPanelSummary.userFacingSummary).resultLabel || "Offline Readiness Review Panel 仍需复核")
    ]);
    const openManualItems = closureStatus === "manual_review_required"
      ? ["manual_review_required", "continue_testing"]
      : ["continue_testing", "manual_review_required", "试用闭环仅为离线视图，不关闭真实任务"];

    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_TRIAL_CLOSURE_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      closureStatus:closureStatus,
      status:closureStatus,
      closedLoopItems:closedLoopItems,
      openManualItems:openManualItems,
      blockedCapabilities:blocked,
      knownLimitations:[
        "试用闭环仅为离线视图，不关闭真实任务",
        "不创建 issue、不上传、不发邮件",
        "不保存用户原文"
      ],
      nextManualAction:closureStatus === "blocked" ? "blocked" : (closureStatus === "manual_review_required" ? "manual_review_required" : "continue_testing"),
      manualReviewRequired:true,
      publicBetaAcceptanceReviewConsoleSummary:acceptanceReviewConsoleSummary,
      manualTrialIssueReviewBoardSummary:issueReviewBoardSummary,
      publicBetaTrialEvidenceLedgerSummary:trialEvidenceLedgerSummary,
      manualTrialSummaryBoardSummary:manualTrialSummaryBoardSummary,
      offlineReadinessReviewPanelSummary:offlineReadinessReviewPanelSummary,
      userFacingSummary:{
        title:"Offline Trial Closure Board",
        resultLabel:closureStatus === "blocked" ? "Offline Trial Closure Board 已阻断" : (closureStatus === "needs_review" ? "Offline Trial Closure Board 仍需复核" : "Offline Trial Closure Board 需人工复核"),
        caveat:"试用闭环仅为离线视图，不关闭真实任务。"
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

  function buildGlobalShoppingOfflineTrialClosureRows(input) {
    const safe = evaluateGlobalShoppingOfflineTrialClosureBoard(input || {});
    return clone([
      row("offline_trial_closure_board", "Offline Trial Closure Board", safe.userFacingSummary.resultLabel, safe.closureStatus === "blocked" ? "blocked" : (safe.closureStatus === "manual_review_required" ? "pass" : "warning")),
      row("offline_trial_closure_loop", "Trial Closure", safe.closedLoopItems.join(" / "), safe.closureStatus === "blocked" ? "blocked" : "warning"),
      row("offline_trial_closure_limitations", "Known Limitations", safe.knownLimitations.join(" / "), "warning"),
      row("offline_trial_closure_next", "Next Manual Action", safe.nextManualAction, safe.closureStatus === "blocked" ? "blocked" : "warning"),
      row("offline_trial_closure_manual", "Manual Review Required", "验收复核后仍需人工决定下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingOfflineTrialClosureSections(input) {
    const safe = evaluateGlobalShoppingOfflineTrialClosureBoard(input || {});
    return clone([
      section("offline_trial_closure_board", "Offline Trial Closure Board", safe.userFacingSummary.resultLabel),
      section("offline_trial_closure_scope", "Trial Closure", "试用闭环仅为离线视图，不关闭真实任务"),
      section("offline_trial_closure_manual", "Manual Review Required", "验收复核后仍需人工决定下一阶段")
    ]);
  }

  function buildGlobalShoppingOfflineTrialClosureBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineTrialClosureBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_TRIAL_CLOSURE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_TRIAL_CLOSURE_BOARD_VERSION,
      closureStatus:safe.closureStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineTrialClosureBoard(board) {
    const safe = evaluateGlobalShoppingOfflineTrialClosureBoard(board || {});
    safe.rows = buildGlobalShoppingOfflineTrialClosureRows(safe);
    safe.sections = buildGlobalShoppingOfflineTrialClosureSections(safe);
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

  function buildGlobalShoppingOfflineTrialClosureBoard(input) {
    try {
      return sanitizeGlobalShoppingOfflineTrialClosureBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineTrialClosureBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineTrialClosureBoard = {
    GLOBAL_SHOPPING_OFFLINE_TRIAL_CLOSURE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingOfflineTrialClosureBoard,
    evaluateGlobalShoppingOfflineTrialClosureBoard,
    buildGlobalShoppingOfflineTrialClosureRows,
    buildGlobalShoppingOfflineTrialClosureSections,
    buildGlobalShoppingOfflineTrialClosureBoardAuditDraft,
    sanitizeGlobalShoppingOfflineTrialClosureBoard
  };
})();
