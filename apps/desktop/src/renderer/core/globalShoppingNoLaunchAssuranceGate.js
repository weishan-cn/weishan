;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NO_LAUNCH_ASSURANCE_GATE_VERSION = "4.2.2";
  const GATE_NAME = "global_shopping_no_launch_assurance_gate_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, no_launch_assurance_only:true };
  const BLOCKED_TEXT_RE = /ready_to_publish|production_ready|auto_release|auto_launch|auto_publish/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function rule(ruleId, label, passed) {
    return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "no_launch_assurance_only");
    return ALLOWED_MODES[mode] ? mode : "no_launch_assurance_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function hasTruthyUrl(value) {
    const normalized = text(value);
    return normalized && normalized !== "null";
  }

  function evaluateGlobalShoppingNoLaunchAssuranceGate(input) {
    const safe = obj(input);
    const acceptanceReviewConsoleSummary = resolveSummary(safe, "publicBetaAcceptanceReviewConsoleSummary", "WeishanGlobalShoppingPublicBetaAcceptanceReviewConsole", "buildGlobalShoppingPublicBetaAcceptanceReviewConsole");
    const offlineTrialClosureBoardSummary = resolveSummary(safe, "offlineTrialClosureBoardSummary", "WeishanGlobalShoppingOfflineTrialClosureBoard", "buildGlobalShoppingOfflineTrialClosureBoard");
    const offlineTrialReleaseGateSummary = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const summaries = [acceptanceReviewConsoleSummary, offlineTrialClosureBoardSummary, offlineTrialReleaseGateSummary, noTransactionRegressionGuardSummary, publicBetaStabilityAuditSummary];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });

    const noLaunch = !(safe.launch === true || safe.autoLaunch === true || safe.releaseLaunch === true);
    const noReleaseMutation = !(safe.release === true || safe.createRelease === true || safe.releaseMutation === true);
    const noPush = !(safe.push === true || safe.pushEnabled === true);
    const noProvider = !(safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true);
    const noNetwork = !(safe.network === true || safe.fetch === true || safe.request === true);
    const noExternalOpen = !(safe.openExternal === true || safe.externalOpen === true || safe.windowOpen === true || safe["window.open"] === true || hasTruthyUrl(safe.externalUrl) || hasTruthyUrl(safe.platformUrl) || hasTruthyUrl(safe.providerUrl));
    const noTransaction = !(safe.payment === true || safe.order === true || safe.ticketing === true || safe.createOrder === true || safe.checkout === true || safe.buyButtonEnabled === true || safe.checkoutButtonEnabled === true || safe.paymentButtonEnabled === true || hasTruthyUrl(safe.bookingUrl) || hasTruthyUrl(safe.checkoutUrl) || hasTruthyUrl(safe.paymentUrl) || hasTruthyUrl(safe.orderUrl));
    const blockedByMutation = safe.gitMutation === true || safe.gitWrite === true || safe.fileWrite === true || safe.writeFile === true || safe.tag === true || safe.createTag === true;
    const blockedByEndpoint = safe.key === true || safe.readApiKey === true || safe.credentialRead === true || safe.endpoint === true || safe.generateEndpoint === true;
    const blockedByLanguage = ["status", "summary", "title", "subtitle", "gateStatus"].some(function (key) { return BLOCKED_TEXT_RE.test(text(safe[key])); });
    const upstreamStatuses = [
      normalizeStatus(obj(acceptanceReviewConsoleSummary).acceptanceReviewStatus || obj(acceptanceReviewConsoleSummary).status, "needs_review"),
      normalizeStatus(obj(offlineTrialClosureBoardSummary).closureStatus || obj(offlineTrialClosureBoardSummary).status, "needs_review"),
      normalizeStatus(obj(offlineTrialReleaseGateSummary).status, "needs_review"),
      normalizeStatus(obj(noTransactionRegressionGuardSummary).status, "needs_review"),
      normalizeStatus(obj(publicBetaStabilityAuditSummary).status, "needs_review")
    ];
    const upstreamBlocked = upstreamStatuses.some(function (status) { return status === "blocked"; });

    const status = !missingRequired && noLaunch && noReleaseMutation && noPush && noProvider && noNetwork && noExternalOpen && noTransaction && !blockedByMutation && !blockedByEndpoint && !blockedByLanguage && !upstreamBlocked
      ? "ready"
      : "blocked";

    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_NO_LAUNCH_ASSURANCE_GATE_VERSION,
      gateMode:safeMode(safe.gateMode),
      status:status,
      noLaunch:noLaunch,
      noReleaseMutation:noReleaseMutation,
      noPush:noPush,
      noProvider:noProvider,
      noNetwork:noNetwork,
      noExternalOpen:noExternalOpen,
      noTransaction:noTransaction,
      manualReviewRequired:true,
      publicBetaAcceptanceReviewConsoleSummary:acceptanceReviewConsoleSummary,
      offlineTrialClosureBoardSummary:offlineTrialClosureBoardSummary,
      offlineTrialReleaseGateSummary:offlineTrialReleaseGateSummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      userFacingSummary:{
        title:"No-Launch Assurance Gate",
        resultLabel:status === "ready" ? "No-Launch Assurance Gate 已准备" : "No-Launch Assurance Gate 已阻断",
        caveat:"当前不发布、不创建 release、不 push。"
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

  function buildGlobalShoppingNoLaunchAssuranceRows(input) {
    const safe = evaluateGlobalShoppingNoLaunchAssuranceGate(input || {});
    return clone([
      row("no_launch_assurance_gate", "No-Launch Assurance Gate", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : "blocked"),
      row("no_launch_assurance_launch", "No Launch", safe.noLaunch ? "不执行 launch" : "检测到 launch 风险", safe.noLaunch ? "pass" : "blocked"),
      row("no_launch_assurance_release", "No Release Mutation", safe.noReleaseMutation ? "不创建 release、不改 git" : "检测到 release/git mutation 风险", safe.noReleaseMutation ? "pass" : "blocked"),
      row("no_launch_assurance_push", "No Push", safe.noPush ? "不 push" : "检测到 push 风险", safe.noPush ? "pass" : "blocked"),
      row("no_launch_assurance_provider", "No Provider", safe.noProvider ? "不启用 provider、不联网、不付款" : "检测到 provider/交易风险", safe.noProvider && safe.noTransaction ? "pass" : "blocked"),
      row("no_launch_assurance_manual", "Manual Review Required", "仍不允许启用 provider、付款、下单或发布", "warning")
    ]);
  }

  function buildGlobalShoppingNoLaunchAssuranceRules(input) {
    const safe = evaluateGlobalShoppingNoLaunchAssuranceGate(input || {});
    return clone([
      rule("no_launch", "No Launch", safe.noLaunch),
      rule("no_release_mutation", "No Release Mutation", safe.noReleaseMutation),
      rule("no_push", "No Push", safe.noPush),
      rule("no_provider", "No Provider", safe.noProvider),
      rule("no_network", "No Network", safe.noNetwork),
      rule("no_external_open", "No External Open", safe.noExternalOpen),
      rule("no_transaction", "No Transaction", safe.noTransaction),
      rule("manual_review_required", "Manual Review Required", true)
    ]);
  }

  function buildGlobalShoppingNoLaunchAssuranceGateAuditDraft(input) {
    const safe = evaluateGlobalShoppingNoLaunchAssuranceGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NO_LAUNCH_ASSURANCE_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_NO_LAUNCH_ASSURANCE_GATE_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingNoLaunchAssuranceGate(gate) {
    const safe = evaluateGlobalShoppingNoLaunchAssuranceGate(gate || {});
    safe.rows = buildGlobalShoppingNoLaunchAssuranceRows(safe);
    safe.rules = buildGlobalShoppingNoLaunchAssuranceRules(safe);
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

  function buildGlobalShoppingNoLaunchAssuranceGate(input) {
    try {
      return sanitizeGlobalShoppingNoLaunchAssuranceGate(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingNoLaunchAssuranceGate({ status:"blocked" });
    }
  }

  window.WeishanGlobalShoppingNoLaunchAssuranceGate = {
    GLOBAL_SHOPPING_NO_LAUNCH_ASSURANCE_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingNoLaunchAssuranceGate,
    evaluateGlobalShoppingNoLaunchAssuranceGate,
    buildGlobalShoppingNoLaunchAssuranceRows,
    buildGlobalShoppingNoLaunchAssuranceRules,
    buildGlobalShoppingNoLaunchAssuranceGateAuditDraft,
    sanitizeGlobalShoppingNoLaunchAssuranceGate
  };
})();
