;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_TRIAL_EXIT_CRITERIA_VERSION = "4.2.8";
  const CRITERIA_NAME = "global_shopping_manual_trial_exit_criteria_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_exit_criteria_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish|enable_provider|enable_payment|enable_order/i;
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_DECISIONS = ["production_ready", "auto_launch", "auto_publish", "ready_to_publish", "enable_provider", "enable_payment", "enable_order"];
  const ALLOWED_DECISIONS = ["continue_testing", "manual_review_required", "blocked"];

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
    const mode = text(value || "manual_exit_criteria_only");
    return ALLOWED_MODES[mode] ? mode : "manual_exit_criteria_only";
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
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    ["status", "title", "summary", "subtitle", "nextManualAction"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingManualTrialExitCriteria(input) {
    const safe = obj(input);
    const closureArchiveSummary = resolveSummary(safe, "publicBetaClosureEvidenceArchiveSummary", "WeishanGlobalShoppingPublicBetaClosureEvidenceArchive", "buildGlobalShoppingPublicBetaClosureEvidenceArchive");
    const acceptanceReviewConsoleSummary = resolveSummary(safe, "publicBetaAcceptanceReviewConsoleSummary", "WeishanGlobalShoppingPublicBetaAcceptanceReviewConsole", "buildGlobalShoppingPublicBetaAcceptanceReviewConsole");
    const qaDecisionMatrixSummary = resolveSummary(safe, "publicBetaQaDecisionMatrixSummary", "WeishanGlobalShoppingPublicBetaQaDecisionMatrix", "buildGlobalShoppingPublicBetaQaDecisionMatrix");
    const manualTrialSummaryBoardSummary = resolveSummary(safe, "manualTrialSummaryBoardSummary", "WeishanGlobalShoppingManualTrialSummaryBoard", "buildGlobalShoppingManualTrialSummaryBoard");
    const offlineReadinessReviewPanelSummary = resolveSummary(safe, "offlineReadinessReviewPanelSummary", "WeishanGlobalShoppingOfflineReadinessReviewPanel", "buildGlobalShoppingOfflineReadinessReviewPanel");
    const summaries = [
      closureArchiveSummary,
      acceptanceReviewConsoleSummary,
      qaDecisionMatrixSummary,
      manualTrialSummaryBoardSummary,
      offlineReadinessReviewPanelSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(closureArchiveSummary).archiveStatus || obj(closureArchiveSummary).status, "needs_review"),
      normalizeStatus(obj(acceptanceReviewConsoleSummary).acceptanceReviewStatus || obj(acceptanceReviewConsoleSummary).status, "needs_review"),
      normalizeStatus(obj(qaDecisionMatrixSummary).status, "needs_review"),
      normalizeStatus(obj(manualTrialSummaryBoardSummary).trialSummaryStatus || obj(manualTrialSummaryBoardSummary).status, "needs_review"),
      normalizeStatus(obj(offlineReadinessReviewPanelSummary).readinessStatus || obj(offlineReadinessReviewPanelSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; });
    const exitCriteriaStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const allowedExitDecisions = exitCriteriaStatus === "blocked" ? ["blocked"] : ["continue_testing", "manual_review_required"];
    const unresolvedItems = exitCriteriaStatus === "manual_review_required"
      ? ["manual_review_required", "人工确认退出标准仅用于离线复核"]
      : ["continue_testing", "继续人工试用和离线复核"];
    const nextManualAction = exitCriteriaStatus === "blocked" ? "blocked" : (exitCriteriaStatus === "needs_review" ? "continue_testing" : "manual_review_required");

    return clone({
      criteriaName:CRITERIA_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_TRIAL_EXIT_CRITERIA_VERSION,
      criteriaMode:safeMode(safe.criteriaMode),
      exitCriteriaStatus:exitCriteriaStatus,
      status:exitCriteriaStatus,
      allowedExitDecisions:allowedExitDecisions,
      blockedExitDecisions:BLOCKED_DECISIONS.slice(),
      requiredManualChecks:[
        "确认闭环证据仅为只读归档视图",
        "确认退出标准不自动通过，不创建 release",
        "确认下一步仍为人工复核或继续测试"
      ],
      unresolvedItems:unresolvedItems,
      nextManualAction:nextManualAction,
      manualReviewRequired:true,
      publicBetaClosureEvidenceArchiveSummary:closureArchiveSummary,
      publicBetaAcceptanceReviewConsoleSummary:acceptanceReviewConsoleSummary,
      publicBetaQaDecisionMatrixSummary:qaDecisionMatrixSummary,
      manualTrialSummaryBoardSummary:manualTrialSummaryBoardSummary,
      offlineReadinessReviewPanelSummary:offlineReadinessReviewPanelSummary,
      userFacingSummary:{
        title:"Manual Trial Exit Criteria",
        resultLabel:exitCriteriaStatus === "blocked" ? "Manual Trial Exit Criteria 已阻断" : (exitCriteriaStatus === "needs_review" ? "Manual Trial Exit Criteria 仍需复核" : "Manual Trial Exit Criteria 需人工复核"),
        caveat:"退出标准不自动通过，不创建 release。"
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

  function buildGlobalShoppingManualTrialExitCriteriaRows(input) {
    const safe = evaluateGlobalShoppingManualTrialExitCriteria(input || {});
    return clone([
      row("manual_trial_exit_criteria", "Manual Trial Exit Criteria", safe.userFacingSummary.resultLabel, safe.exitCriteriaStatus === "blocked" ? "blocked" : "warning"),
      row("manual_trial_exit_allowed", "Allowed Exit Decisions", safe.allowedExitDecisions.join(" / "), safe.exitCriteriaStatus === "blocked" ? "blocked" : "warning"),
      row("manual_trial_exit_blocked", "Blocked Exit Decisions", safe.blockedExitDecisions.join(" / "), "warning"),
      row("manual_trial_exit_next", "Next Manual Action", safe.nextManualAction, safe.exitCriteriaStatus === "blocked" ? "blocked" : "warning"),
      row("manual_trial_exit_manual", "Manual Review Required", "退出标准不自动通过，不创建 release", "warning")
    ]);
  }

  function buildGlobalShoppingManualTrialExitCriteriaRules(input) {
    const safe = evaluateGlobalShoppingManualTrialExitCriteria(input || {});
    return clone([
      rule("manual_review_required", "Manual Review Required", true),
      rule("continue_testing", "Allow Continue Testing", safe.allowedExitDecisions.indexOf("continue_testing") >= 0 || safe.allowedExitDecisions.indexOf("blocked") >= 0),
      rule("block_production_ready", "Block production_ready", safe.blockedExitDecisions.indexOf("production_ready") >= 0),
      rule("block_auto_launch", "Block auto_launch", safe.blockedExitDecisions.indexOf("auto_launch") >= 0),
      rule("block_auto_publish", "Block auto_publish", safe.blockedExitDecisions.indexOf("auto_publish") >= 0),
      rule("block_enable_provider", "Block enable_provider", safe.blockedExitDecisions.indexOf("enable_provider") >= 0),
      rule("block_enable_payment", "Block enable_payment", safe.blockedExitDecisions.indexOf("enable_payment") >= 0),
      rule("block_enable_order", "Block enable_order", safe.blockedExitDecisions.indexOf("enable_order") >= 0)
    ]);
  }

  function buildGlobalShoppingManualTrialExitCriteriaAuditDraft(input) {
    const safe = evaluateGlobalShoppingManualTrialExitCriteria(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_TRIAL_EXIT_CRITERIA_AUDIT_DRAFT",
      criteriaName:CRITERIA_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_TRIAL_EXIT_CRITERIA_VERSION,
      exitCriteriaStatus:safe.exitCriteriaStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingManualTrialExitCriteria(criteria) {
    const safe = evaluateGlobalShoppingManualTrialExitCriteria(criteria || {});
    safe.rows = buildGlobalShoppingManualTrialExitCriteriaRows(safe);
    safe.rules = buildGlobalShoppingManualTrialExitCriteriaRules(safe);
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

  function buildGlobalShoppingManualTrialExitCriteria(input) {
    try {
      return sanitizeGlobalShoppingManualTrialExitCriteria(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualTrialExitCriteria({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualTrialExitCriteria = {
    GLOBAL_SHOPPING_MANUAL_TRIAL_EXIT_CRITERIA_VERSION,
    CRITERIA_NAME,
    buildGlobalShoppingManualTrialExitCriteria,
    evaluateGlobalShoppingManualTrialExitCriteria,
    buildGlobalShoppingManualTrialExitCriteriaRows,
    buildGlobalShoppingManualTrialExitCriteriaRules,
    buildGlobalShoppingManualTrialExitCriteriaAuditDraft,
    sanitizeGlobalShoppingManualTrialExitCriteria
  };
})();
