;(function () {
  "use strict";

  const GLOBAL_SHOPPING_TRIAL_FEEDBACK_SAFETY_GATE_VERSION = "4.1.9";
  const GATE_NAME = "global_shopping_trial_feedback_safety_gate_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, feedback_safety_gate_only:true };
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeMode(value) {
    const mode = text(value || "feedback_safety_gate_only");
    return ALLOWED_MODES[mode] ? mode : "feedback_safety_gate_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
    if (safe.feedbackEnabled === true || safe.feedbackSent === true) blocked.push("feedback sent");
    if (safe.uploadEnabled === true || safe.upload === true || safe.uploaded === true) blocked.push("upload");
    if (safe.emailEnabled === true || safe.email === true || safe.mail === true || safe.sendMail === true) blocked.push("email");
    if (safe.externalForm === true || safe.externalFormUrl != null) blocked.push("external form");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true || safe.rawUserText === true) blocked.push("raw user text saved");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (SECRET_VALUE_RE.test(JSON.stringify(safe))) blocked.push("secret leak");
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingTrialFeedbackSafetyGate(input) {
    const safe = obj(input);
    const safeFeedbackDraftPanelSummary = resolveSummary(safe, "safeFeedbackDraftPanelSummary", "WeishanGlobalShoppingSafeFeedbackDraftPanel", "buildGlobalShoppingSafeFeedbackDraftPanel");
    const feedbackPlaceholderSummary = resolveSummary(safe, "publicBetaFeedbackPlaceholderSummary", "WeishanGlobalShoppingPublicBetaFeedbackPlaceholder", "buildGlobalShoppingPublicBetaFeedbackPlaceholder");
    const manualQaReportCenterSummary = resolveSummary(safe, "publicBetaManualQaReportCenterSummary", "WeishanGlobalShoppingPublicBetaManualQaReportCenter", "buildGlobalShoppingPublicBetaManualQaReportCenter");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const blocked = blockedReasons(safe);
    const upstreamBlocked = [safeFeedbackDraftPanelSummary, feedbackPlaceholderSummary, manualQaReportCenterSummary, noTransactionRegressionGuardSummary].some(function (summary) {
      return /^(blocked|failed_safe)$/.test(text(obj(summary).status || ""));
    });
    const status = blocked.length || upstreamBlocked ? "blocked" : "ready";
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_TRIAL_FEEDBACK_SAFETY_GATE_VERSION,
      gateMode:safeMode(safe.gateMode),
      status,
      title:"Trial Feedback Safety Gate",
      feedbackEnabled:false,
      uploadEnabled:false,
      emailEnabled:false,
      externalFormUrl:null,
      rawUserTextPersistence:false,
      manualReviewRequired:true,
      safeFeedbackDraftPanelSummary:safeFeedbackDraftPanelSummary,
      publicBetaFeedbackPlaceholderSummary:feedbackPlaceholderSummary,
      publicBetaManualQaReportCenterSummary:manualQaReportCenterSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"Trial Feedback Safety Gate",
        resultLabel:status === "blocked" ? "Trial Feedback Safety Gate 已阻断" : "Trial Feedback Safety Gate 已准备",
        caveat:"反馈仍为草稿，不发送、不上传、不保存用户原文。"
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

  function buildGlobalShoppingTrialFeedbackSafetyRows(input) {
    const safe = evaluateGlobalShoppingTrialFeedbackSafetyGate(input || {});
    return clone([
      row("trial_feedback_safety_gate", "Trial Feedback Safety Gate", safe.userFacingSummary.resultLabel, safe.status === "blocked" ? "blocked" : "pass"),
      row("trial_feedback_feedback_boundary", "Feedback Safety", "反馈仍为草稿，不发送、不上传、不保存用户原文", "warning"),
      row("trial_feedback_switches", "Feedback Switches", "feedbackEnabled:false / uploadEnabled:false / emailEnabled:false", "pass"),
      row("trial_feedback_external_form", "External Form", "externalFormUrl:null", "pass"),
      row("trial_feedback_manual_review", "Manual Review Required", "人工 QA 后再决定下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingTrialFeedbackSafetyRules(input) {
    const safe = evaluateGlobalShoppingTrialFeedbackSafetyGate(input || {});
    return clone([
      { ruleId:"feedback_enabled_false", label:"feedbackEnabled", passed:safe.feedbackEnabled === false, redacted:true },
      { ruleId:"upload_enabled_false", label:"uploadEnabled", passed:safe.uploadEnabled === false, redacted:true },
      { ruleId:"email_enabled_false", label:"emailEnabled", passed:safe.emailEnabled === false, redacted:true },
      { ruleId:"external_form_null", label:"externalFormUrl", passed:safe.externalFormUrl == null, redacted:true },
      { ruleId:"raw_user_text_not_persisted", label:"rawUserTextPersistence", passed:safe.rawUserTextPersistence === false, redacted:true }
    ]);
  }

  function buildGlobalShoppingTrialFeedbackSafetyGateAuditDraft(input) {
    const safe = evaluateGlobalShoppingTrialFeedbackSafetyGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_TRIAL_FEEDBACK_SAFETY_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_TRIAL_FEEDBACK_SAFETY_GATE_VERSION,
      status:safe.status,
      feedbackEnabled:false,
      uploadEnabled:false,
      emailEnabled:false,
      rawUserTextPersistence:false,
      externalFormUrl:null,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingTrialFeedbackSafetyGate(gate) {
    const safe = evaluateGlobalShoppingTrialFeedbackSafetyGate(gate || {});
    safe.rows = buildGlobalShoppingTrialFeedbackSafetyRows(safe);
    safe.rules = buildGlobalShoppingTrialFeedbackSafetyRules(safe);
    return safe;
  }

  function buildGlobalShoppingTrialFeedbackSafetyGate(input) {
    try {
      return sanitizeGlobalShoppingTrialFeedbackSafetyGate(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingTrialFeedbackSafetyGate({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingTrialFeedbackSafetyGate = {
    GLOBAL_SHOPPING_TRIAL_FEEDBACK_SAFETY_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingTrialFeedbackSafetyGate,
    evaluateGlobalShoppingTrialFeedbackSafetyGate,
    buildGlobalShoppingTrialFeedbackSafetyRows,
    buildGlobalShoppingTrialFeedbackSafetyRules,
    buildGlobalShoppingTrialFeedbackSafetyGateAuditDraft,
    sanitizeGlobalShoppingTrialFeedbackSafetyGate
  };
})();
