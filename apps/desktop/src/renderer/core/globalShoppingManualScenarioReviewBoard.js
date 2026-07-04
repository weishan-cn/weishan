;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_SCENARIO_REVIEW_BOARD_VERSION = "4.2.5";
  const BOARD_NAME = "global_shopping_manual_scenario_review_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_scenario_review_board_only:true };
  const SCENARIO_COVERAGE = ["flight_price_compare", "hotel_price_compare", "product_price_compare", "fee_breakdown", "risk_badge_review", "feedback_review_mock", "issue_triage_mock", "no_provider_boundary", "no_data_retention", "manual_acceptance"];
  const REDACTION_RULES = ["phone", "email", "passport", "idCard", "bankCard", "address", "platformToken", "orderNumber", "rawMessage", "freeText", "providerPayload"];
  const BLOCKED_SCENARIO_REVIEW_ACTIONS = ["persist_scenario_input", "persist_scenario_review", "submit_feedback", "upload_feedback", "create_issue", "create_task", "send_email", "open_external"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /persist_scenario_input|persist_scenario_review|submit_feedback|upload_feedback|create_issue|create_task|send_email|open_external|file write|export|download/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "manual_scenario_review_board_only");
    return ALLOWED_MODES[mode] ? mode : "manual_scenario_review_board_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (status === "manual_review_required") return "manual_review_required";
    return /^(needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
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
    if (safe.scenarioInputPersistence === true || safe.persistScenarioInput === true) blocked.push("scenario input persistence");
    if (safe.scenarioReviewPersistence === true || safe.persistScenarioReview === true) blocked.push("scenario review persistence");
    if (safe.rawUserTextPersistence === true || safe.persistRawUserText === true) blocked.push("raw user text persistence");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    ["status", "summary", "title", "subtitle", "scenarioReviewStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe scenario review language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingManualScenarioReviewBoard(input) {
    const safe = obj(input);
    const publicBetaOfflineAcceptanceEvidenceCenterSummary = resolveSummary(safe, "publicBetaOfflineAcceptanceEvidenceCenterSummary", "WeishanGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter", "buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter");
    const offlineUserScenarioPackSummary = resolveSummary(safe, "offlineUserScenarioPackSummary", "WeishanGlobalShoppingOfflineUserScenarioPack", "buildGlobalShoppingOfflineUserScenarioPack");
    const publicBetaManualAcceptanceChecklistSummary = resolveSummary(safe, "publicBetaManualAcceptanceChecklistSummary", "WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist", "buildGlobalShoppingPublicBetaManualAcceptanceChecklist");
    const offlineIssueTriageBoardSummary = resolveSummary(safe, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    const summaries = [
      publicBetaOfflineAcceptanceEvidenceCenterSummary,
      offlineUserScenarioPackSummary,
      publicBetaManualAcceptanceChecklistSummary,
      offlineIssueTriageBoardSummary
    ];
    const statuses = [
      normalizeStatus(obj(publicBetaOfflineAcceptanceEvidenceCenterSummary).status || obj(publicBetaOfflineAcceptanceEvidenceCenterSummary).evidenceCenterStatus, "needs_review"),
      normalizeStatus(obj(offlineUserScenarioPackSummary).status || obj(offlineUserScenarioPackSummary).scenarioPackStatus, "needs_review"),
      normalizeStatus(obj(publicBetaManualAcceptanceChecklistSummary).status || obj(publicBetaManualAcceptanceChecklistSummary).acceptanceChecklistStatus, "needs_review"),
      normalizeStatus(obj(offlineIssueTriageBoardSummary).status || obj(offlineIssueTriageBoardSummary).triageStatus, "needs_review")
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const scenarioReviewStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_SCENARIO_REVIEW_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      scenarioReviewStatus:scenarioReviewStatus,
      status:scenarioReviewStatus,
      scenarioReviewRows:[
        row("manual_scenario_review_board", "Manual Scenario Review Board", scenarioReviewStatus === "blocked" ? "Manual Scenario Review Board 已阻断" : (scenarioReviewStatus === "needs_review" ? "Manual Scenario Review Board 仍需复核" : "Manual Scenario Review Board 需人工复核"), scenarioReviewStatus === "blocked" ? "blocked" : "warning"),
        row("scenario_review", "Scenario Review", "人工场景复核板仅为样例复核，不保存场景输入或复核结果", "warning"),
        row("scenario_coverage", "Scenario Coverage", SCENARIO_COVERAGE.join(" / "), "warning")
      ],
      scenarioCoverage:SCENARIO_COVERAGE.slice(),
      reviewerChecklist:[
        "确认离线场景仍为只读样例",
        "确认不保存场景输入与复核结果",
        "确认不创建真实 issue/task",
        "确认不打开外部平台",
        "确认仍需人工复核"
      ],
      blockedScenarioReviewActions:BLOCKED_SCENARIO_REVIEW_ACTIONS.slice(),
      scenarioRedactionRules:REDACTION_RULES.slice(),
      manualReviewRequired:true,
      blockedReasons:blocked,
      publicBetaOfflineAcceptanceEvidenceCenterSummary:publicBetaOfflineAcceptanceEvidenceCenterSummary,
      offlineUserScenarioPackSummary:offlineUserScenarioPackSummary,
      publicBetaManualAcceptanceChecklistSummary:publicBetaManualAcceptanceChecklistSummary,
      offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary,
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
      feedbackSubmitEnabled:false,
      uploadEnabled:false,
      issueCreateEnabled:false,
      taskCreateEnabled:false,
      scenarioInputPersistence:false,
      scenarioReviewPersistence:false,
      rawUserTextPersistence:false,
      userFacingSummary:{
        title:"Manual Scenario Review Board",
        resultLabel:scenarioReviewStatus === "blocked" ? "Manual Scenario Review Board 已阻断" : (scenarioReviewStatus === "needs_review" ? "Manual Scenario Review Board 仍需复核" : "Manual Scenario Review Board 需人工复核"),
        caveat:"只展示人工如何复核离线场景，不保存真实场景输入或复核结果。"
      },
      redacted:true
    });
  }

  function buildGlobalShoppingManualScenarioReviewRows(input) {
    return clone(evaluateGlobalShoppingManualScenarioReviewBoard(input || {}).scenarioReviewRows || []);
  }

  function buildGlobalShoppingManualScenarioReviewRules(input) {
    const safe = evaluateGlobalShoppingManualScenarioReviewBoard(input || {});
    return clone([
      rule("scenario_input_persistence_disabled", "scenarioInputPersistence 必须 false", safe.scenarioInputPersistence === false),
      rule("scenario_review_persistence_disabled", "scenarioReviewPersistence 必须 false", safe.scenarioReviewPersistence === false),
      rule("raw_user_text_persistence_disabled", "rawUserTextPersistence 必须 false", safe.rawUserTextPersistence === false),
      rule("upload_disabled", "uploadEnabled 必须 false", safe.uploadEnabled === false),
      rule("issue_create_disabled", "issueCreateEnabled 必须 false", safe.issueCreateEnabled === false),
      rule("task_create_disabled", "taskCreateEnabled 必须 false", safe.taskCreateEnabled === false)
    ]);
  }

  function buildGlobalShoppingManualScenarioReviewBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingManualScenarioReviewBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_SCENARIO_REVIEW_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_SCENARIO_REVIEW_BOARD_VERSION,
      scenarioReviewStatus:safe.scenarioReviewStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingManualScenarioReviewBoard(board) {
    const safe = evaluateGlobalShoppingManualScenarioReviewBoard(board || {});
    safe.rows = buildGlobalShoppingManualScenarioReviewRows(safe);
    safe.rules = buildGlobalShoppingManualScenarioReviewRules(safe);
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
    safe.feedbackSubmitEnabled = false;
    safe.uploadEnabled = false;
    safe.issueCreateEnabled = false;
    safe.taskCreateEnabled = false;
    safe.scenarioInputPersistence = false;
    safe.scenarioReviewPersistence = false;
    safe.rawUserTextPersistence = false;
    return safe;
  }

  function buildGlobalShoppingManualScenarioReviewBoard(input) {
    try {
      return sanitizeGlobalShoppingManualScenarioReviewBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualScenarioReviewBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualScenarioReviewBoard = {
    GLOBAL_SHOPPING_MANUAL_SCENARIO_REVIEW_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingManualScenarioReviewBoard,
    evaluateGlobalShoppingManualScenarioReviewBoard,
    buildGlobalShoppingManualScenarioReviewRows,
    buildGlobalShoppingManualScenarioReviewRules,
    buildGlobalShoppingManualScenarioReviewBoardAuditDraft,
    sanitizeGlobalShoppingManualScenarioReviewBoard
  };
})();
