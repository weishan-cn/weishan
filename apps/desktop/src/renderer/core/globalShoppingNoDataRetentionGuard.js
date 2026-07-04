;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NO_DATA_RETENTION_GUARD_VERSION = "4.2.4";
  const GUARD_NAME = "global_shopping_no_data_retention_guard_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, no_data_retention_guard_only:true };
  const REDACTION_RULES = ["phone", "email", "passport", "idCard", "bankCard", "address", "platformToken", "orderNumber", "rawMessage", "freeText", "providerPayload"];
  const BLOCKED_RETENTION_ACTIONS = ["persist_raw_user_text", "persist_feedback", "persist_scenario_input", "persist_acceptance_record", "persist_provider_response", "persist_order", "persist_payment", "export_file", "upload_file", "send_email"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /persist_raw_user_text|persist_feedback|persist_scenario_input|persist_acceptance_record|persist_provider_response|persist_order|persist_payment|export_file|upload_file|send_email|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "no_data_retention_guard_only");
    return ALLOWED_MODES[mode] ? mode : "no_data_retention_guard_only";
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
    if (safe.rawUserTextPersistence === true || safe.persistRawUserText === true) blocked.push("raw user text persistence");
    if (safe.feedbackPersistence === true || safe.persistFeedback === true) blocked.push("feedback persistence");
    if (safe.scenarioInputPersistence === true || safe.persistScenarioInput === true) blocked.push("scenario input persistence");
    if (safe.acceptanceRecordPersistence === true || safe.persistAcceptanceRecord === true) blocked.push("acceptance record persistence");
    if (safe.providerResponsePersistence === true || safe.persistProviderResponse === true || safe.rawProviderPersistence === true || safe.rawResponsePersistence === true) blocked.push("provider response persistence");
    if (safe.orderPersistence === true || safe.persistOrder === true) blocked.push("order persistence");
    if (safe.paymentPersistence === true || safe.persistPayment === true) blocked.push("payment persistence");
    if (safe.tokenPersistence === true || safe.persistToken === true) blocked.push("token persistence");
    if (safe.exportPersistence === true || safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.uploadPersistence === true || safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    ["status", "summary", "title", "subtitle", "noDataRetentionStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe retention language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function buildFlags() {
    return {
      rawUserTextPersistence:false,
      feedbackPersistence:false,
      scenarioInputPersistence:false,
      acceptanceRecordPersistence:false,
      providerResponsePersistence:false,
      orderPersistence:false,
      paymentPersistence:false,
      tokenPersistence:false,
      exportPersistence:false,
      uploadPersistence:false
    };
  }

  function evaluateGlobalShoppingNoDataRetentionGuard(input) {
    const safe = obj(input);
    const publicBetaManualAcceptanceChecklistSummary = resolveSummary(safe, "publicBetaManualAcceptanceChecklistSummary", "WeishanGlobalShoppingPublicBetaManualAcceptanceChecklist", "buildGlobalShoppingPublicBetaManualAcceptanceChecklist");
    const offlineUserScenarioPackSummary = resolveSummary(safe, "offlineUserScenarioPackSummary", "WeishanGlobalShoppingOfflineUserScenarioPack", "buildGlobalShoppingOfflineUserScenarioPack");
    const trialFeedbackIntakeMockSummary = resolveSummary(safe, "trialFeedbackIntakeMockSummary", "WeishanGlobalShoppingTrialFeedbackIntakeMock", "buildGlobalShoppingTrialFeedbackIntakeMock");
    const manualFeedbackReviewQueueMockSummary = resolveSummary(safe, "manualFeedbackReviewQueueMockSummary", "WeishanGlobalShoppingManualFeedbackReviewQueueMock", "buildGlobalShoppingManualFeedbackReviewQueueMock");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const summaries = [
      publicBetaManualAcceptanceChecklistSummary,
      offlineUserScenarioPackSummary,
      trialFeedbackIntakeMockSummary,
      manualFeedbackReviewQueueMockSummary,
      noTransactionRegressionGuardSummary
    ];
    const statuses = [
      normalizeStatus(obj(publicBetaManualAcceptanceChecklistSummary).status || obj(publicBetaManualAcceptanceChecklistSummary).acceptanceChecklistStatus, "needs_review"),
      normalizeStatus(obj(offlineUserScenarioPackSummary).status || obj(offlineUserScenarioPackSummary).scenarioPackStatus, "needs_review"),
      normalizeStatus(obj(trialFeedbackIntakeMockSummary).status || obj(trialFeedbackIntakeMockSummary).intakeStatus, "needs_review"),
      normalizeStatus(obj(manualFeedbackReviewQueueMockSummary).status || obj(manualFeedbackReviewQueueMockSummary).queueStatus, "needs_review"),
      normalizeStatus(obj(noTransactionRegressionGuardSummary).status, "needs_review")
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const flags = buildFlags();
    const noDataRetentionStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      guardName:GUARD_NAME,
      appVersion:GLOBAL_SHOPPING_NO_DATA_RETENTION_GUARD_VERSION,
      guardMode:safeMode(safe.guardMode),
      noDataRetentionStatus:noDataRetentionStatus,
      status:noDataRetentionStatus,
      noRetentionFlags:flags,
      redactionRules:REDACTION_RULES.slice(),
      blockedRetentionActions:BLOCKED_RETENTION_ACTIONS.slice(),
      regressionRows:[
        row("no_data_retention_guard", "No-Data-Retention Guard", noDataRetentionStatus === "blocked" ? "No-Data-Retention Guard 已阻断" : (noDataRetentionStatus === "needs_review" ? "No-Data-Retention Guard 仍需复核" : "No-Data-Retention Guard 需人工复核"), noDataRetentionStatus === "blocked" ? "blocked" : "warning"),
        row("no_data_retention", "No Data Retention", "无数据留存保护门确认不保存反馈、用户原文、场景输入或验收记录", "warning"),
        row("redaction_rules", "Redaction Rules", REDACTION_RULES.join(" / "), "warning"),
        row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
      ],
      manualReviewRequired:true,
      blockedReasons:blocked,
      publicBetaManualAcceptanceChecklistSummary:publicBetaManualAcceptanceChecklistSummary,
      offlineUserScenarioPackSummary:offlineUserScenarioPackSummary,
      trialFeedbackIntakeMockSummary:trialFeedbackIntakeMockSummary,
      manualFeedbackReviewQueueMockSummary:manualFeedbackReviewQueueMockSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      userFacingSummary:{
        title:"No-Data-Retention Guard",
        resultLabel:noDataRetentionStatus === "blocked" ? "No-Data-Retention Guard 已阻断" : (noDataRetentionStatus === "needs_review" ? "No-Data-Retention Guard 仍需复核" : "No-Data-Retention Guard 需人工复核"),
        caveat:"无数据留存保护门确认不保存反馈、用户原文、场景输入或验收记录"
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
      dataRetentionEnabled:false,
      rawUserTextPersistence:false,
      acceptanceRecordPersistence:false,
      scenarioInputPersistence:false,
      redacted:true
    });
  }

  function buildGlobalShoppingNoDataRetentionRows(input) {
    return clone(evaluateGlobalShoppingNoDataRetentionGuard(input || {}).regressionRows || []);
  }

  function buildGlobalShoppingNoDataRetentionRules(input) {
    const safe = evaluateGlobalShoppingNoDataRetentionGuard(input || {});
    return clone([
      rule("raw_user_text_persistence_disabled", "rawUserTextPersistence 必须 false", safe.rawUserTextPersistence === false),
      rule("feedback_persistence_disabled", "feedbackPersistence 必须 false", safe.noRetentionFlags.feedbackPersistence === false),
      rule("scenario_input_persistence_disabled", "scenarioInputPersistence 必须 false", safe.scenarioInputPersistence === false),
      rule("acceptance_record_persistence_disabled", "acceptanceRecordPersistence 必须 false", safe.acceptanceRecordPersistence === false),
      rule("provider_response_persistence_disabled", "providerResponsePersistence 必须 false", safe.noRetentionFlags.providerResponsePersistence === false),
      rule("token_persistence_disabled", "tokenPersistence 必须 false", safe.noRetentionFlags.tokenPersistence === false)
    ]);
  }

  function buildGlobalShoppingNoDataRetentionGuardAuditDraft(input) {
    const safe = evaluateGlobalShoppingNoDataRetentionGuard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NO_DATA_RETENTION_GUARD_AUDIT_DRAFT",
      guardName:GUARD_NAME,
      appVersion:GLOBAL_SHOPPING_NO_DATA_RETENTION_GUARD_VERSION,
      noDataRetentionStatus:safe.noDataRetentionStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingNoDataRetentionGuard(guard) {
    const safe = evaluateGlobalShoppingNoDataRetentionGuard(guard || {});
    safe.rows = buildGlobalShoppingNoDataRetentionRows(safe);
    safe.rules = buildGlobalShoppingNoDataRetentionRules(safe);
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
    safe.dataRetentionEnabled = false;
    safe.rawUserTextPersistence = false;
    safe.acceptanceRecordPersistence = false;
    safe.scenarioInputPersistence = false;
    safe.noRetentionFlags = buildFlags();
    return safe;
  }

  function buildGlobalShoppingNoDataRetentionGuard(input) {
    try {
      return sanitizeGlobalShoppingNoDataRetentionGuard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingNoDataRetentionGuard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingNoDataRetentionGuard = {
    GLOBAL_SHOPPING_NO_DATA_RETENTION_GUARD_VERSION,
    GUARD_NAME,
    buildGlobalShoppingNoDataRetentionGuard,
    evaluateGlobalShoppingNoDataRetentionGuard,
    buildGlobalShoppingNoDataRetentionRows,
    buildGlobalShoppingNoDataRetentionRules,
    buildGlobalShoppingNoDataRetentionGuardAuditDraft,
    sanitizeGlobalShoppingNoDataRetentionGuard
  };
})();
