;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_USER_SCENARIO_PACK_VERSION = "4.2.4";
  const PACK_NAME = "global_shopping_offline_user_scenario_pack_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_user_scenario_pack_only:true };
  const SCENARIO_CATEGORIES = ["flight_price_compare", "hotel_price_compare", "product_price_compare", "fee_breakdown", "risk_badge_review", "feedback_review_mock", "issue_triage_mock", "no_provider_boundary"];
  const REDACTION_RULES = ["phone", "email", "passport", "idCard", "bankCard", "address", "platformToken", "orderNumber", "rawMessage", "freeText"];
  const BLOCKED_SCENARIO_ACTIONS = ["persist_scenario_input", "submit_feedback", "upload_feedback", "create_issue", "create_task", "send_email", "open_external"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /persist_scenario_input|submit_feedback|upload_feedback|create_issue|create_task|open_external|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "offline_user_scenario_pack_only");
    return ALLOWED_MODES[mode] ? mode : "offline_user_scenario_pack_only";
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
    if (safe.scenarioInputPersistence === true || safe.persistScenarioInput === true || safe.savedScenarioInput === true) blocked.push("scenario input persistence");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true) blocked.push("raw user text persistence");
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
    ["status", "summary", "title", "subtitle", "scenarioPackStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe scenario language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingOfflineUserScenarioPack(input) {
    const safe = obj(input);
    const publicBetaManualAcceptanceChecklistSummary = resolveSummary(safe, "publicBetaManualAcceptanceChecklistSummary", "WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist", "buildGlobalShoppingPublicBetaManualAcceptanceChecklist");
    const publicBetaReadinessSnapshotSummary = resolveSummary(safe, "publicBetaReadinessSnapshotSummary", "WeishanGlobalShoppingPublicBetaReadinessSnapshot", "buildGlobalShoppingPublicBetaReadinessSnapshot");
    const manualFeedbackReviewQueueMockSummary = resolveSummary(safe, "manualFeedbackReviewQueueMockSummary", "WeishanGlobalShoppingManualFeedbackReviewQueueMock", "buildGlobalShoppingManualFeedbackReviewQueueMock");
    const offlineIssueTriageBoardSummary = resolveSummary(safe, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    const summaries = [
      publicBetaManualAcceptanceChecklistSummary,
      publicBetaReadinessSnapshotSummary,
      manualFeedbackReviewQueueMockSummary,
      offlineIssueTriageBoardSummary
    ];
    const statuses = [
      normalizeStatus(obj(publicBetaManualAcceptanceChecklistSummary).status || obj(publicBetaManualAcceptanceChecklistSummary).acceptanceChecklistStatus, "needs_review"),
      normalizeStatus(obj(publicBetaReadinessSnapshotSummary).status || obj(publicBetaReadinessSnapshotSummary).readinessSnapshotStatus, "needs_review"),
      normalizeStatus(obj(manualFeedbackReviewQueueMockSummary).status || obj(manualFeedbackReviewQueueMockSummary).queueStatus, "needs_review"),
      normalizeStatus(obj(offlineIssueTriageBoardSummary).status || obj(offlineIssueTriageBoardSummary).triageStatus, "needs_review")
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const scenarioPackStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_USER_SCENARIO_PACK_VERSION,
      packMode:safeMode(safe.packMode),
      scenarioPackStatus:scenarioPackStatus,
      status:scenarioPackStatus,
      scenarioCategories:SCENARIO_CATEGORIES.slice(),
      scenarioRows:[
        row("offline_user_scenario_pack", "Offline User Scenario Pack", scenarioPackStatus === "blocked" ? "Offline User Scenario Pack 已阻断" : (scenarioPackStatus === "needs_review" ? "Offline User Scenario Pack 仍需复核" : "Offline User Scenario Pack 需人工复核"), scenarioPackStatus === "blocked" ? "blocked" : "warning"),
        row("offline_scenarios", "Offline Scenarios", "离线用户场景包仅为样例，不收集真实输入", "warning"),
        row("scenario_categories", "Scenario Categories", SCENARIO_CATEGORIES.join(" / "), "warning"),
        row("no_provider_boundary", "No Provider Boundary", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
      ],
      blockedScenarioActions:BLOCKED_SCENARIO_ACTIONS.slice(),
      scenarioRedactionRules:REDACTION_RULES.slice(),
      manualReviewRequired:true,
      scenarioInputPersistence:false,
      rawUserTextPersistence:false,
      blockedReasons:blocked,
      publicBetaManualAcceptanceChecklistSummary:publicBetaManualAcceptanceChecklistSummary,
      publicBetaReadinessSnapshotSummary:publicBetaReadinessSnapshotSummary,
      manualFeedbackReviewQueueMockSummary:manualFeedbackReviewQueueMockSummary,
      offlineIssueTriageBoardSummary:offlineIssueTriageBoardSummary,
      userFacingSummary:{
        title:"Offline User Scenario Pack",
        resultLabel:scenarioPackStatus === "blocked" ? "Offline User Scenario Pack 已阻断" : (scenarioPackStatus === "needs_review" ? "Offline User Scenario Pack 仍需复核" : "Offline User Scenario Pack 需人工复核"),
        caveat:"离线用户场景包仅为样例，不收集真实输入"
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
      feedbackSubmitEnabled:false,
      uploadEnabled:false,
      issueCreateEnabled:false,
      taskCreateEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingOfflineUserScenarioRows(input) {
    return clone(evaluateGlobalShoppingOfflineUserScenarioPack(input || {}).scenarioRows || []);
  }

  function buildGlobalShoppingOfflineUserScenarioRules(input) {
    const safe = evaluateGlobalShoppingOfflineUserScenarioPack(input || {});
    return clone([
      rule("scenario_input_persistence_disabled", "scenarioInputPersistence 必须 false", safe.scenarioInputPersistence === false),
      rule("raw_user_text_persistence_disabled", "rawUserTextPersistence 必须 false", safe.rawUserTextPersistence === false),
      rule("feedback_submit_disabled", "feedbackSubmitEnabled 必须 false", safe.feedbackSubmitEnabled === false),
      rule("upload_disabled", "uploadEnabled 必须 false", safe.uploadEnabled === false),
      rule("issue_create_disabled", "issueCreateEnabled 必须 false", safe.issueCreateEnabled === false),
      rule("task_create_disabled", "taskCreateEnabled 必须 false", safe.taskCreateEnabled === false)
    ]);
  }

  function buildGlobalShoppingOfflineUserScenarioPackAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineUserScenarioPack(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_USER_SCENARIO_PACK_AUDIT_DRAFT",
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_USER_SCENARIO_PACK_VERSION,
      scenarioPackStatus:safe.scenarioPackStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineUserScenarioPack(pack) {
    const safe = evaluateGlobalShoppingOfflineUserScenarioPack(pack || {});
    safe.rows = buildGlobalShoppingOfflineUserScenarioRows(safe);
    safe.rules = buildGlobalShoppingOfflineUserScenarioRules(safe);
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
    safe.rawUserTextPersistence = false;
    return safe;
  }

  function buildGlobalShoppingOfflineUserScenarioPack(input) {
    try {
      return sanitizeGlobalShoppingOfflineUserScenarioPack(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineUserScenarioPack({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineUserScenarioPack = {
    GLOBAL_SHOPPING_OFFLINE_USER_SCENARIO_PACK_VERSION,
    PACK_NAME,
    buildGlobalShoppingOfflineUserScenarioPack,
    evaluateGlobalShoppingOfflineUserScenarioPack,
    buildGlobalShoppingOfflineUserScenarioRows,
    buildGlobalShoppingOfflineUserScenarioRules,
    buildGlobalShoppingOfflineUserScenarioPackAuditDraft,
    sanitizeGlobalShoppingOfflineUserScenarioPack
  };
})();
