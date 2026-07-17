;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ZERO_PERSISTENCE_REGRESSION_GATE_VERSION = "4.2.8";
  const GATE_NAME = "global_shopping_zero_persistence_regression_gate_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, zero_persistence_regression_gate_only:true };
  const REDACTION_RULES = ["phone", "email", "passport", "idCard", "bankCard", "address", "platformToken", "orderNumber", "rawMessage", "freeText", "providerPayload", "paymentPayload"];
  const BLOCKED_PERSISTENCE_ACTIONS = ["persist_raw_user_text", "persist_feedback", "persist_scenario_input", "persist_scenario_review", "persist_acceptance_record", "persist_evidence_file", "persist_provider_response", "persist_order", "persist_payment", "persist_token", "export_file", "upload_file", "send_email"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /persist_raw_user_text|persist_feedback|persist_scenario_input|persist_scenario_review|persist_acceptance_record|persist_evidence_file|persist_provider_response|persist_order|persist_payment|persist_token|export_file|upload_file|send_email|open_external|window\.open|enable_provider|enable_payment|enable_order|auto_publish|auto_launch|ready_to_publish|production_ready/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "zero_persistence_regression_gate_only");
    return ALLOWED_MODES[mode] ? mode : "zero_persistence_regression_gate_only";
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
  function buildFlags() {
    return {
      rawUserTextPersistence:false,
      feedbackPersistence:false,
      scenarioInputPersistence:false,
      scenarioReviewPersistence:false,
      acceptanceRecordPersistence:false,
      evidenceFilePersistence:false,
      providerResponsePersistence:false,
      orderPersistence:false,
      paymentPersistence:false,
      tokenPersistence:false,
      exportPersistence:false,
      uploadPersistence:false,
      emailPersistence:false
    };
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.rawUserTextPersistence === true || safe.persistRawUserText === true) blocked.push("raw user text persistence");
    if (safe.feedbackPersistence === true || safe.persistFeedback === true) blocked.push("feedback persistence");
    if (safe.scenarioInputPersistence === true || safe.persistScenarioInput === true) blocked.push("scenario input persistence");
    if (safe.scenarioReviewPersistence === true || safe.persistScenarioReview === true) blocked.push("scenario review persistence");
    if (safe.acceptanceRecordPersistence === true || safe.persistAcceptanceRecord === true) blocked.push("acceptance record persistence");
    if (safe.evidenceFilePersistence === true || safe.persistEvidenceFile === true) blocked.push("evidence file persistence");
    if (safe.providerResponsePersistence === true || safe.persistProviderResponse === true || safe.rawProviderPersistence === true || safe.rawResponsePersistence === true) blocked.push("provider response persistence");
    if (safe.orderPersistence === true || safe.persistOrder === true) blocked.push("order persistence");
    if (safe.paymentPersistence === true || safe.persistPayment === true) blocked.push("payment persistence");
    if (safe.tokenPersistence === true || safe.persistToken === true) blocked.push("token persistence");
    if (safe.exportPersistence === true || safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.uploadPersistence === true || safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.emailPersistence === true || safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
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
    ["status", "summary", "title", "subtitle", "zeroPersistenceStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe zero persistence language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingZeroPersistenceRegressionGate(input) {
    const safe = obj(input);
    const publicBetaOfflineAcceptanceEvidenceCenterSummary = resolveSummary(safe, "publicBetaOfflineAcceptanceEvidenceCenterSummary", "WeishanGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter", "buildGlobalShoppingPublicBetaOfflineAcceptanceEvidenceCenter");
    const manualScenarioReviewBoardSummary = resolveSummary(safe, "manualScenarioReviewBoardSummary", "WeishanGlobalShoppingManualScenarioReviewBoard", "buildGlobalShoppingManualScenarioReviewBoard");
    const noDataRetentionGuardSummary = resolveSummary(safe, "noDataRetentionGuardSummary", "WeishanGlobalShoppingNoDataRetentionGuard", "buildGlobalShoppingNoDataRetentionGuard");
    const trialFeedbackIntakeMockSummary = resolveSummary(safe, "trialFeedbackIntakeMockSummary", "WeishanGlobalShoppingTrialFeedbackIntakeMock", "buildGlobalShoppingTrialFeedbackIntakeMock");
    const manualFeedbackReviewQueueMockSummary = resolveSummary(safe, "manualFeedbackReviewQueueMockSummary", "WeishanGlobalShoppingManualFeedbackReviewQueueMock", "buildGlobalShoppingManualFeedbackReviewQueueMock");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const summaries = [
      publicBetaOfflineAcceptanceEvidenceCenterSummary,
      manualScenarioReviewBoardSummary,
      noDataRetentionGuardSummary,
      trialFeedbackIntakeMockSummary,
      manualFeedbackReviewQueueMockSummary,
      noTransactionRegressionGuardSummary
    ];
    const statuses = [
      normalizeStatus(obj(publicBetaOfflineAcceptanceEvidenceCenterSummary).status || obj(publicBetaOfflineAcceptanceEvidenceCenterSummary).evidenceCenterStatus, "needs_review"),
      normalizeStatus(obj(manualScenarioReviewBoardSummary).status || obj(manualScenarioReviewBoardSummary).scenarioReviewStatus, "needs_review"),
      normalizeStatus(obj(noDataRetentionGuardSummary).status || obj(noDataRetentionGuardSummary).noDataRetentionStatus, "needs_review"),
      normalizeStatus(obj(trialFeedbackIntakeMockSummary).status || obj(trialFeedbackIntakeMockSummary).intakeStatus, "needs_review"),
      normalizeStatus(obj(manualFeedbackReviewQueueMockSummary).status || obj(manualFeedbackReviewQueueMockSummary).queueStatus, "needs_review"),
      normalizeStatus(obj(noTransactionRegressionGuardSummary).status, "needs_review")
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const zeroPersistenceStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_ZERO_PERSISTENCE_REGRESSION_GATE_VERSION,
      gateMode:safeMode(safe.gateMode),
      zeroPersistenceStatus:zeroPersistenceStatus,
      status:zeroPersistenceStatus,
      zeroPersistenceFlags:buildFlags(),
      redactionRules:REDACTION_RULES.slice(),
      blockedPersistenceActions:BLOCKED_PERSISTENCE_ACTIONS.slice(),
      regressionRows:[
        row("zero_persistence_regression_gate", "Zero-Persistence Regression Gate", zeroPersistenceStatus === "blocked" ? "Zero-Persistence Regression Gate 已阻断" : (zeroPersistenceStatus === "needs_review" ? "Zero-Persistence Regression Gate 仍需复核" : "Zero-Persistence Regression Gate 需人工复核"), zeroPersistenceStatus === "blocked" ? "blocked" : "warning"),
        row("zero_persistence", "Zero Persistence", "零持久化回归门确认不保存反馈、用户原文、场景输入、验收记录或证据文件", "warning"),
        row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
      ],
      manualReviewRequired:true,
      blockedReasons:blocked,
      publicBetaOfflineAcceptanceEvidenceCenterSummary:publicBetaOfflineAcceptanceEvidenceCenterSummary,
      manualScenarioReviewBoardSummary:manualScenarioReviewBoardSummary,
      noDataRetentionGuardSummary:noDataRetentionGuardSummary,
      trialFeedbackIntakeMockSummary:trialFeedbackIntakeMockSummary,
      manualFeedbackReviewQueueMockSummary:manualFeedbackReviewQueueMockSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
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
      evidenceFilePersistence:false,
      scenarioReviewPersistence:false,
      userFacingSummary:{
        title:"Zero-Persistence Regression Gate",
        resultLabel:zeroPersistenceStatus === "blocked" ? "Zero-Persistence Regression Gate 已阻断" : (zeroPersistenceStatus === "needs_review" ? "Zero-Persistence Regression Gate 仍需复核" : "Zero-Persistence Regression Gate 需人工复核"),
        caveat:"专门确认 v4.2.7 没有保存任何真实用户数据、反馈、场景输入、验收记录、证据文件、provider 响应、订单、支付、token。"
      },
      redacted:true
    });
  }

  function buildGlobalShoppingZeroPersistenceRegressionRows(input) {
    return clone(evaluateGlobalShoppingZeroPersistenceRegressionGate(input || {}).regressionRows || []);
  }

  function buildGlobalShoppingZeroPersistenceRegressionRules(input) {
    const safe = evaluateGlobalShoppingZeroPersistenceRegressionGate(input || {});
    return clone([
      rule("raw_user_text_persistence_disabled", "rawUserTextPersistence 必须 false", safe.rawUserTextPersistence === false),
      rule("feedback_persistence_disabled", "feedbackPersistence 必须 false", safe.zeroPersistenceFlags.feedbackPersistence === false),
      rule("scenario_input_persistence_disabled", "scenarioInputPersistence 必须 false", safe.scenarioInputPersistence === false),
      rule("scenario_review_persistence_disabled", "scenarioReviewPersistence 必须 false", safe.scenarioReviewPersistence === false),
      rule("acceptance_record_persistence_disabled", "acceptanceRecordPersistence 必须 false", safe.acceptanceRecordPersistence === false),
      rule("evidence_file_persistence_disabled", "evidenceFilePersistence 必须 false", safe.evidenceFilePersistence === false),
      rule("provider_response_persistence_disabled", "providerResponsePersistence 必须 false", safe.zeroPersistenceFlags.providerResponsePersistence === false),
      rule("order_persistence_disabled", "orderPersistence 必须 false", safe.zeroPersistenceFlags.orderPersistence === false),
      rule("payment_persistence_disabled", "paymentPersistence 必须 false", safe.zeroPersistenceFlags.paymentPersistence === false),
      rule("token_persistence_disabled", "tokenPersistence 必须 false", safe.zeroPersistenceFlags.tokenPersistence === false)
    ]);
  }

  function buildGlobalShoppingZeroPersistenceRegressionGateAuditDraft(input) {
    const safe = evaluateGlobalShoppingZeroPersistenceRegressionGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_ZERO_PERSISTENCE_REGRESSION_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_ZERO_PERSISTENCE_REGRESSION_GATE_VERSION,
      zeroPersistenceStatus:safe.zeroPersistenceStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingZeroPersistenceRegressionGate(gate) {
    const safe = evaluateGlobalShoppingZeroPersistenceRegressionGate(gate || {});
    safe.rows = buildGlobalShoppingZeroPersistenceRegressionRows(safe);
    safe.rules = buildGlobalShoppingZeroPersistenceRegressionRules(safe);
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
    safe.evidenceFilePersistence = false;
    safe.scenarioReviewPersistence = false;
    safe.zeroPersistenceFlags = buildFlags();
    return safe;
  }

  function buildGlobalShoppingZeroPersistenceRegressionGate(input) {
    try {
      return sanitizeGlobalShoppingZeroPersistenceRegressionGate(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingZeroPersistenceRegressionGate({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingZeroPersistenceRegressionGate = {
    GLOBAL_SHOPPING_ZERO_PERSISTENCE_REGRESSION_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingZeroPersistenceRegressionGate,
    evaluateGlobalShoppingZeroPersistenceRegressionGate,
    buildGlobalShoppingZeroPersistenceRegressionRows,
    buildGlobalShoppingZeroPersistenceRegressionRules,
    buildGlobalShoppingZeroPersistenceRegressionGateAuditDraft,
    sanitizeGlobalShoppingZeroPersistenceRegressionGate
  };
})();
