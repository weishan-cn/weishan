;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ZERO_ACTION_SAFETY_CONSOLE_VERSION = "4.2.6";
  const CONSOLE_NAME = "global_shopping_zero_action_safety_console_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, zero_action_safety_console_only:true };
  const DISABLED_ACTIONS = ["provider_call", "network_call", "open_external", "payment", "order", "ticketing", "feedback_submit", "upload", "issue_create", "task_create", "release_create", "release_publish", "push", "export_file", "send_email", "persist_data"];
  const BLOCKED_CAPABILITIES = ["provider", "network", "endpoint", "external_open", "payment", "order", "ticketing", "feedback_submit", "upload", "issue_create", "task_create", "release_create", "release_publish", "push", "export", "send_email", "persist_raw_user_text", "persist_feedback", "persist_evidence", "persist_rc_audit", "persist_token"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /provider_call|network_call|open_external|release_create|release_publish|persist_data|send_email|file write|window\.open/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "zero_action_safety_console_only");
    return ALLOWED_MODES[mode] ? mode : "zero_action_safety_console_only";
  }
  function normalizeStatus(value) {
    const status = text(value || "needs_review");
    return /^(manual_review_required|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
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
      actionExecutionEnabled:false,
      launchActionEnabled:false,
      releaseActionEnabled:false,
      providerActionEnabled:false,
      paymentActionEnabled:false,
      orderActionEnabled:false,
      feedbackSubmitEnabled:false,
      uploadEnabled:false,
      issueCreateEnabled:false,
      taskCreateEnabled:false,
      dataRetentionEnabled:false,
      rawUserTextPersistence:false,
      releaseCandidateAuditPersistence:false
    };
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.actionExecutionEnabled === true) blocked.push("action execution");
    if (safe.launchActionEnabled === true) blocked.push("launch action");
    if (safe.releaseActionEnabled === true) blocked.push("release action");
    if (safe.providerActionEnabled === true || safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.paymentActionEnabled === true || safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.orderActionEnabled === true || safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.feedbackSubmit === true || safe.feedbackSubmitEnabled === true) blocked.push("feedback submit");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.release === true || safe.createRelease === true || safe.publishRelease === true) blocked.push("release create");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.export === true || safe.exportEnabled === true || safe.download === true || safe.downloadEnabled === true) blocked.push("export");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.rawUserTextPersistence === true || safe.persistRawUserText === true) blocked.push("raw user text persistence");
    if (safe.feedbackPersistence === true || safe.persistFeedback === true) blocked.push("feedback persistence");
    if (safe.evidenceFilePersistence === true || safe.persistEvidenceFile === true) blocked.push("evidence persistence");
    if (safe.releaseCandidateAuditPersistence === true || safe.persistRcAudit === true) blocked.push("release candidate audit persistence");
    if (safe.tokenPersistence === true || safe.persistToken === true) blocked.push("token persistence");
    ["status", "summary", "title", "subtitle", "zeroActionStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe zero action language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingZeroActionSafetyConsole(input) {
    const safe = obj(input);
    const publicBetaFinalAcceptanceLockSummary = resolveSummary(safe, "publicBetaFinalAcceptanceLockSummary", "WeishanGlobalShoppingPublicBetaFinalAcceptanceLock", "buildGlobalShoppingPublicBetaFinalAcceptanceLock");
    const offlineReleaseCandidateAuditSummary = resolveSummary(safe, "offlineReleaseCandidateAuditSummary", "WeishanGlobalShoppingOfflineReleaseCandidateAudit", "buildGlobalShoppingOfflineReleaseCandidateAudit");
    const zeroPersistenceRegressionGateSummary = resolveSummary(safe, "zeroPersistenceRegressionGateSummary", "WeishanGlobalShoppingZeroPersistenceRegressionGate", "buildGlobalShoppingZeroPersistenceRegressionGate");
    const summaries = [
      publicBetaFinalAcceptanceLockSummary,
      offlineReleaseCandidateAuditSummary,
      zeroPersistenceRegressionGateSummary
    ];
    const statuses = summaries.map(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).finalAcceptanceLockStatus || obj(summary).releaseCandidateAuditStatus || obj(summary).zeroPersistenceStatus); });
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status === "needs_review"; });
    const zeroActionStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");

    return clone({
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_ZERO_ACTION_SAFETY_CONSOLE_VERSION,
      consoleMode:safeMode(safe.consoleMode),
      zeroActionStatus:zeroActionStatus,
      status:zeroActionStatus,
      disabledActions:DISABLED_ACTIONS.slice(),
      blockedCapabilities:BLOCKED_CAPABILITIES.slice(),
      zeroActionFlags:buildFlags(),
      safetyRows:[
        row("zero_action_safety_console", "Zero-Action Safety Console", zeroActionStatus === "blocked" ? "Zero-Action Safety Console 已阻断" : (zeroActionStatus === "needs_review" ? "Zero-Action Safety Console 仍需复核" : "Zero-Action Safety Console 需人工复核"), zeroActionStatus === "blocked" ? "blocked" : "warning"),
        row("zero_action_safety", "Zero Action Safety", "零动作安全控制台确认没有任何真实动作执行入口", "warning"),
        row("manual_review_required", "Manual Review Required", "provider、联网、外部打开、付款、下单、出票、release、push、launch、反馈提交、上传、issue/task 创建仍保持关闭", "warning")
      ],
      manualReviewRequired:true,
      blockedReasons:blocked,
      publicBetaFinalAcceptanceLockSummary:publicBetaFinalAcceptanceLockSummary,
      offlineReleaseCandidateAuditSummary:offlineReleaseCandidateAuditSummary,
      zeroPersistenceRegressionGateSummary:zeroPersistenceRegressionGateSummary,
      userFacingSummary:{
        title:"Zero-Action Safety Console",
        resultLabel:zeroActionStatus === "blocked" ? "Zero-Action Safety Console 已阻断" : (zeroActionStatus === "needs_review" ? "Zero-Action Safety Console 仍需复核" : "Zero-Action Safety Console 需人工复核"),
        caveat:"零动作安全控制台确认没有任何真实动作执行入口。"
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
      releaseCandidateAuditPersistence:false,
      redacted:true
    });
  }

  function buildGlobalShoppingZeroActionSafetyRows(input) {
    return clone(evaluateGlobalShoppingZeroActionSafetyConsole(input || {}).safetyRows || []);
  }

  function buildGlobalShoppingZeroActionSafetyRules(input) {
    const flags = evaluateGlobalShoppingZeroActionSafetyConsole(input || {}).zeroActionFlags || buildFlags();
    return clone([
      rule("action_execution_disabled", "actionExecutionEnabled 必须 false", flags.actionExecutionEnabled === false),
      rule("release_action_disabled", "releaseActionEnabled 必须 false", flags.releaseActionEnabled === false),
      rule("provider_action_disabled", "providerActionEnabled 必须 false", flags.providerActionEnabled === false),
      rule("feedback_submit_disabled", "feedbackSubmitEnabled 必须 false", flags.feedbackSubmitEnabled === false),
      rule("raw_user_text_persistence_disabled", "rawUserTextPersistence 必须 false", flags.rawUserTextPersistence === false),
      rule("rc_audit_persistence_disabled", "releaseCandidateAuditPersistence 必须 false", flags.releaseCandidateAuditPersistence === false)
    ]);
  }

  function buildGlobalShoppingZeroActionSafetyConsoleAuditDraft(input) {
    const safe = evaluateGlobalShoppingZeroActionSafetyConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_ZERO_ACTION_SAFETY_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_ZERO_ACTION_SAFETY_CONSOLE_VERSION,
      zeroActionStatus:safe.zeroActionStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingZeroActionSafetyConsole(consoleModel) {
    const safe = evaluateGlobalShoppingZeroActionSafetyConsole(consoleModel || {});
    safe.rows = buildGlobalShoppingZeroActionSafetyRows(safe);
    safe.rules = buildGlobalShoppingZeroActionSafetyRules(safe);
    safe.zeroActionFlags = buildFlags();
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
    safe.releaseCandidateAuditPersistence = false;
    return safe;
  }

  function buildGlobalShoppingZeroActionSafetyConsole(input) {
    try {
      return sanitizeGlobalShoppingZeroActionSafetyConsole(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingZeroActionSafetyConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingZeroActionSafetyConsole = {
    GLOBAL_SHOPPING_ZERO_ACTION_SAFETY_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingZeroActionSafetyConsole,
    evaluateGlobalShoppingZeroActionSafetyConsole,
    buildGlobalShoppingZeroActionSafetyRows,
    buildGlobalShoppingZeroActionSafetyRules,
    buildGlobalShoppingZeroActionSafetyConsoleAuditDraft,
    sanitizeGlobalShoppingZeroActionSafetyConsole
  };
})();
