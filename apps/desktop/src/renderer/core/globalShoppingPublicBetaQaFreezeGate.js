;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_GATE_VERSION = "4.1.5";
  const GATE_NAME = "global_shopping_public_beta_qa_freeze_gate_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, qa_freeze_gate_only:true };
  const ALLOWED_NEXT_ACTIONS = ["continue_testing", "manual_review_required", "blocked"];
  const BLOCKED_NEXT_ACTIONS = ["enable_provider", "enable_payment", "enable_order", "auto_publish", "ready_to_publish"];
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish|enable_provider|enable_payment|enable_order/i;
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "qa_freeze_gate_only");
    return ALLOWED_MODES[mode] ? mode : "qa_freeze_gate_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function sanitizeWarnings(value) {
    return toArray(value).map(function (item) { return text(item); }).filter(Boolean).filter(function (item) {
      return !SECRET_VALUE_RE.test(item);
    });
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.runtimeMutation === true || safe.runtimeConfigMutation === true || safe.configWrite === true) blocked.push("runtime mutation");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.noRealProvider === false) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true || safe.noNetwork === false) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true || safe.noSecretRisk === false) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.noPayment === false) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.noOrder === false) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true || safe.noTicketing === false) blocked.push("ticketing");
    if (safe.rawProviderPersistence === true || safe.rawRequestPersistence === true || safe.rawResponsePersistence === true || safe.noRawResponsePersistence === false) blocked.push("raw persistence");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true || safe.persisted === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    ["status", "summary", "title", "subtitle", "freezeStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe action language");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingPublicBetaQaFreezeGate(input) {
    const safe = obj(input);
    const trialEvidence = resolveSummary(safe, "publicBetaTrialEvidenceLedgerSummary", "WeishanGlobalShoppingPublicBetaTrialEvidenceLedger", "buildGlobalShoppingPublicBetaTrialEvidenceLedger");
    const qaDecision = resolveSummary(safe, "publicBetaQaDecisionMatrixSummary", "WeishanGlobalShoppingPublicBetaQaDecisionMatrix", "buildGlobalShoppingPublicBetaQaDecisionMatrix");
    const issueTriage = resolveSummary(safe, "offlineIssueTriageBoardSummary", "WeishanGlobalShoppingOfflineIssueTriageBoard", "buildGlobalShoppingOfflineIssueTriageBoard");
    const qaOperations = resolveSummary(safe, "publicBetaQaOperationsViewModelSummary", "WeishanGlobalShoppingPublicBetaQaOperationsViewModel", "buildGlobalShoppingPublicBetaQaOperationsViewModel");
    const noTransactionGuard = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const summaries = [trialEvidence, qaDecision, issueTriage, qaOperations, noTransactionGuard];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const upstreamBlocked = summaries.some(function (summary) { return normalizeStatus(obj(summary).status || "", "needs_review") === "blocked"; });
    const upstreamNeedsReview = summaries.some(function (summary) { return normalizeStatus(obj(summary).status || "", "needs_review") !== "ready"; });
    const warnings = sanitizeWarnings(safe.knownWarnings || obj(trialEvidence).knownWarnings || obj(noTransactionGuard).knownWarnings);
    const blocked = blockedReasons(safe);
    const freezeStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "ready");
    const allowedNextActions = freezeStatus === "blocked" ? ["blocked"] : ["continue_testing", "manual_review_required"];
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_GATE_VERSION,
      gateMode:safeMode(safe.gateMode),
      freezeStatus:freezeStatus,
      status:freezeStatus,
      frozenScope:"只读 QA 范围",
      lockedCapabilities:[
        "不执行真实 freeze",
        "不启用 provider",
        "不付款",
        "不下单",
        "不发布"
      ],
      allowedNextActions:allowedNextActions,
      blockedNextActions:BLOCKED_NEXT_ACTIONS.slice(),
      knownWarnings:warnings,
      blockedCapabilities:blocked,
      manualReviewRequired:true,
      publicBetaTrialEvidenceLedgerSummary:trialEvidence,
      publicBetaQaDecisionMatrixSummary:qaDecision,
      offlineIssueTriageBoardSummary:issueTriage,
      publicBetaQaOperationsViewModelSummary:qaOperations,
      noTransactionRegressionGuardSummary:noTransactionGuard,
      userFacingSummary:{
        title:"Public Beta QA Freeze Gate",
        resultLabel:freezeStatus === "ready" ? "Public Beta QA Freeze Gate 已准备" : (freezeStatus === "blocked" ? "Public Beta QA Freeze Gate 已阻断" : "Public Beta QA Freeze Gate 仍需复核"),
        caveat:"当前冻结的是只读 QA 范围，不执行真实 freeze。"
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

  function buildGlobalShoppingPublicBetaQaFreezeRows(input) {
    const safe = evaluateGlobalShoppingPublicBetaQaFreezeGate(input || {});
    return clone([
      row("public_beta_qa_freeze_gate", "Public Beta QA Freeze Gate", safe.userFacingSummary.resultLabel, safe.freezeStatus === "ready" ? "pass" : (safe.freezeStatus === "blocked" ? "blocked" : "warning")),
      row("public_beta_qa_frozen_scope", "Frozen Scope", safe.frozenScope, "warning"),
      row("public_beta_qa_allowed_actions", "Allowed Next Actions", safe.allowedNextActions.join(" / "), safe.freezeStatus === "blocked" ? "blocked" : "warning"),
      row("public_beta_qa_blocked_actions", "Blocked Next Actions", "仍不允许启用 provider、付款、下单或发布", "warning"),
      row("public_beta_qa_review", "Manual Review Required", "只允许继续测试、人工复核或阻断", "warning")
    ]);
  }

  function buildGlobalShoppingPublicBetaQaFreezeRules(input) {
    const safe = evaluateGlobalShoppingPublicBetaQaFreezeGate(input || {});
    return clone([
      { ruleId:"allowed_actions", label:"Allowed Next Actions", value:safe.allowedNextActions.join(" / "), redacted:true },
      { ruleId:"blocked_actions", label:"Blocked Next Actions", value:safe.blockedNextActions.join(" / "), redacted:true },
      { ruleId:"manual_review", label:"Manual Review Required", value:"true", redacted:true }
    ]);
  }

  function buildGlobalShoppingPublicBetaQaFreezeGateAuditDraft(input) {
    const safe = evaluateGlobalShoppingPublicBetaQaFreezeGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_GATE_VERSION,
      freezeStatus:safe.freezeStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingPublicBetaQaFreezeGate(gate) {
    const safe = evaluateGlobalShoppingPublicBetaQaFreezeGate(gate || {});
    safe.rows = buildGlobalShoppingPublicBetaQaFreezeRows(safe);
    safe.rules = buildGlobalShoppingPublicBetaQaFreezeRules(safe);
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

  function buildGlobalShoppingPublicBetaQaFreezeGate(input) {
    try {
      return sanitizeGlobalShoppingPublicBetaQaFreezeGate(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingPublicBetaQaFreezeGate({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaQaFreezeGate = {
    GLOBAL_SHOPPING_PUBLIC_BETA_QA_FREEZE_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingPublicBetaQaFreezeGate,
    evaluateGlobalShoppingPublicBetaQaFreezeGate,
    buildGlobalShoppingPublicBetaQaFreezeRows,
    buildGlobalShoppingPublicBetaQaFreezeRules,
    buildGlobalShoppingPublicBetaQaFreezeGateAuditDraft,
    sanitizeGlobalShoppingPublicBetaQaFreezeGate
  };
})();
