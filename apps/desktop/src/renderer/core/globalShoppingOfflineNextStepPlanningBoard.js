;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_NEXT_STEP_PLANNING_BOARD_VERSION = "4.2.8";
  const BOARD_NAME = "global_shopping_offline_next_step_planning_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, next_step_planning_only:true };
  const ALLOWED_OPTIONS = ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required", "blocked"];
  const BLOCKED_OPTIONS = ["enable_provider", "enable_payment", "enable_order", "production_ready", "auto_publish", "ready_to_publish"];
  const BLOCKED_TEXT_RE = /enable_provider|enable_payment|enable_order|production_ready|auto_publish|ready_to_publish/i;
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
  function safeMode(value) {
    const mode = text(value || "next_step_planning_only");
    return ALLOWED_MODES[mode] ? mode : "next_step_planning_only";
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
    if (safe.taskCreate === true || safe.createTask === true) blocked.push("task create");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.openExternal === true || safe.externalOpen === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("openExternal");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    ["status", "title", "summary", "subtitle", "planningStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingOfflineNextStepPlanningBoard(input) {
    const safe = obj(input);
    const closureArchiveSummary = resolveSummary(safe, "publicBetaClosureEvidenceArchiveSummary", "WeishanGlobalShoppingPublicBetaClosureEvidenceArchive", "buildGlobalShoppingPublicBetaClosureEvidenceArchive");
    const manualTrialExitCriteriaSummary = resolveSummary(safe, "manualTrialExitCriteriaSummary", "WeishanGlobalShoppingManualTrialExitCriteria", "buildGlobalShoppingManualTrialExitCriteria");
    const offlineTrialClosureBoardSummary = resolveSummary(safe, "offlineTrialClosureBoardSummary", "WeishanGlobalShoppingOfflineTrialClosureBoard", "buildGlobalShoppingOfflineTrialClosureBoard");
    const manualLaunchHandoffPackSummary = resolveSummary(safe, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const summaries = [
      closureArchiveSummary,
      manualTrialExitCriteriaSummary,
      offlineTrialClosureBoardSummary,
      manualLaunchHandoffPackSummary,
      publicBetaStabilityAuditSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(closureArchiveSummary).archiveStatus || obj(closureArchiveSummary).status, "needs_review"),
      normalizeStatus(obj(manualTrialExitCriteriaSummary).exitCriteriaStatus || obj(manualTrialExitCriteriaSummary).status, "needs_review"),
      normalizeStatus(obj(offlineTrialClosureBoardSummary).closureStatus || obj(offlineTrialClosureBoardSummary).status, "needs_review"),
      normalizeStatus(obj(manualLaunchHandoffPackSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaStabilityAuditSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; });
    const planningStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const nextStepOptions = planningStatus === "blocked"
      ? ["blocked"]
      : ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required"];

    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_NEXT_STEP_PLANNING_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      planningStatus:planningStatus,
      status:planningStatus,
      nextStepOptions:nextStepOptions,
      blockedOptions:BLOCKED_OPTIONS.slice(),
      manualChecklist:[
        "下一步只能继续测试、优化文案、扩展离线场景、人工复核或阻断",
        "仍不允许启用 provider、付款、下单或发布"
      ],
      riskNotes:[
        "当前仍为只读离线规划板",
        "不创建任务、不写文件、不上传、不发邮件"
      ],
      knownLimitations:[
        "不打开外部平台",
        "不启用交易",
        "不接真实 provider"
      ],
      manualReviewRequired:true,
      publicBetaClosureEvidenceArchiveSummary:closureArchiveSummary,
      manualTrialExitCriteriaSummary:manualTrialExitCriteriaSummary,
      offlineTrialClosureBoardSummary:offlineTrialClosureBoardSummary,
      manualLaunchHandoffPackSummary:manualLaunchHandoffPackSummary,
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      userFacingSummary:{
        title:"Offline Next-Step Planning Board",
        resultLabel:planningStatus === "blocked" ? "Offline Next-Step Planning Board 已阻断" : (planningStatus === "needs_review" ? "Offline Next-Step Planning Board 仍需复核" : "Offline Next-Step Planning Board 需人工复核"),
        caveat:"下一步只能继续测试、优化文案、扩展离线场景、人工复核或阻断。"
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

  function buildGlobalShoppingOfflineNextStepPlanningRows(input) {
    const safe = evaluateGlobalShoppingOfflineNextStepPlanningBoard(input || {});
    return clone([
      row("offline_next_step_planning_board", "Offline Next-Step Planning Board", safe.userFacingSummary.resultLabel, safe.planningStatus === "blocked" ? "blocked" : "warning"),
      row("offline_next_step_planning_options", "Next-Step Planning", safe.nextStepOptions.join(" / "), safe.planningStatus === "blocked" ? "blocked" : "warning"),
      row("offline_next_step_planning_blocked", "Blocked Options", safe.blockedOptions.join(" / "), "warning"),
      row("offline_next_step_planning_manual", "Manual Review Required", "下一步只能继续测试、优化文案、扩展离线场景、人工复核或阻断", "warning"),
      row("offline_next_step_planning_boundary", "Locked Capabilities", "仍不允许启用 provider、付款、下单或发布", "warning")
    ]);
  }

  function buildGlobalShoppingOfflineNextStepPlanningOptions(input) {
    const safe = evaluateGlobalShoppingOfflineNextStepPlanningBoard(input || {});
    return clone(ALLOWED_OPTIONS.map(function (option) {
      return {
        optionId:option,
        label:option,
        allowed:safe.nextStepOptions.indexOf(option) >= 0,
        redacted:true
      };
    }));
  }

  function buildGlobalShoppingOfflineNextStepPlanningBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineNextStepPlanningBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_NEXT_STEP_PLANNING_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_NEXT_STEP_PLANNING_BOARD_VERSION,
      planningStatus:safe.planningStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineNextStepPlanningBoard(board) {
    const safe = evaluateGlobalShoppingOfflineNextStepPlanningBoard(board || {});
    safe.rows = buildGlobalShoppingOfflineNextStepPlanningRows(safe);
    safe.options = buildGlobalShoppingOfflineNextStepPlanningOptions(safe);
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

  function buildGlobalShoppingOfflineNextStepPlanningBoard(input) {
    try {
      return sanitizeGlobalShoppingOfflineNextStepPlanningBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineNextStepPlanningBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineNextStepPlanningBoard = {
    GLOBAL_SHOPPING_OFFLINE_NEXT_STEP_PLANNING_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingOfflineNextStepPlanningBoard,
    evaluateGlobalShoppingOfflineNextStepPlanningBoard,
    buildGlobalShoppingOfflineNextStepPlanningRows,
    buildGlobalShoppingOfflineNextStepPlanningOptions,
    buildGlobalShoppingOfflineNextStepPlanningBoardAuditDraft,
    sanitizeGlobalShoppingOfflineNextStepPlanningBoard
  };
})();
