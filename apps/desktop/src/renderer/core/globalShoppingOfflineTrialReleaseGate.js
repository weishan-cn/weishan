;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_TRIAL_RELEASE_GATE_VERSION = "4.1.6";
  const GATE_NAME = "global_shopping_offline_trial_release_gate_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_trial_gate_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeMode(value) {
    const mode = text(value || "offline_trial_gate_only");
    return ALLOWED_MODES[mode] ? mode : "offline_trial_gate_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function rule(ruleId, label, passed) {
    return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true };
  }
  function hasValue(value) { return value != null && value !== false; }

  function evaluateGlobalShoppingOfflineTrialReleaseGate(input) {
    const safe = obj(input);
    const noReleaseMutation = !(safe.release === true || safe.releaseMutation === true || safe.createRelease === true);
    const noPush = !(safe.push === true || safe.pushEnabled === true);
    const noProvider = !(safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.providerActivation === true);
    const noNetwork = !(safe.network === true || safe.fetch === true || safe.request === true);
    const noExternalOpen = !(safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true || hasValue(safe.externalUrl) || hasValue(safe.platformUrl) || hasValue(safe.providerUrl));
    const noTransaction = !(safe.payment === true || safe.order === true || safe.ticketing === true || safe.checkout === true || safe.createOrder === true || safe.submitBooking === true || hasValue(safe.bookingUrl) || hasValue(safe.checkoutUrl) || hasValue(safe.paymentUrl) || hasValue(safe.orderUrl) || safe.buyButtonEnabled === true || safe.checkoutButtonEnabled === true || safe.paymentButtonEnabled === true);
    const noGitMutation = !(safe.gitMutation === true || safe.tag === true || safe.tagMutation === true || safe.createTag === true);
    const noFileWrite = !(safe.fileWrite === true || safe.writeFile === true || safe.persisted === true);
    const noCredentialRead = !(safe.key === true || safe.readApiKey === true || safe.credentialRead === true);
    const noEndpoint = !(safe.endpoint === true || safe.generateEndpoint === true);
    const status = noReleaseMutation && noPush && noProvider && noNetwork && noExternalOpen && noTransaction && noGitMutation && noFileWrite && noCredentialRead && noEndpoint ? "ready" : "blocked";
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_TRIAL_RELEASE_GATE_VERSION,
      gateMode:safeMode(safe.gateMode),
      status,
      title:"Offline Trial Release Gate",
      noReleaseMutation,
      noPush,
      noProvider,
      noNetwork,
      noExternalOpen,
      noTransaction,
      manualReviewRequired:true,
      userFacingSummary:{
        title:"Offline Trial Release Gate",
        resultLabel:status === "ready" ? "Offline Trial Release Gate 已准备" : "Offline Trial Release Gate 已阻断",
        caveat:"名称里有 release，但不执行 release。"
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

  function buildGlobalShoppingOfflineTrialReleaseGateRules(input) {
    const safe = evaluateGlobalShoppingOfflineTrialReleaseGate(input || {});
    return clone([
      rule("no_release_mutation", "No Release Mutation", safe.noReleaseMutation),
      rule("no_push", "No Push", safe.noPush),
      rule("no_provider", "No Provider", safe.noProvider),
      rule("no_network", "No Network", safe.noNetwork),
      rule("no_external_open", "No External Open", safe.noExternalOpen),
      rule("no_transaction", "No Transaction", safe.noTransaction),
      rule("manual_review_required", "Manual Review Required", true)
    ]);
  }

  function buildGlobalShoppingOfflineTrialReleaseGateRows(input) {
    const safe = evaluateGlobalShoppingOfflineTrialReleaseGate(input || {});
    return clone([
      row("offline_trial_release_gate_status", "Offline Trial Release Gate", safe.status === "ready" ? "Offline Trial Release Gate 已准备" : "Offline Trial Release Gate 已阻断", safe.status === "ready" ? "pass" : "blocked"),
      row("offline_trial_release_gate_release", "No Release Mutation", safe.noReleaseMutation ? "不创建 release、不改 git" : "检测到 release/gIt mutation 风险", safe.noReleaseMutation ? "pass" : "blocked"),
      row("offline_trial_release_gate_transaction", "No Transaction", safe.noTransaction ? "不付款、不下单、不出票" : "检测到交易风险", safe.noTransaction ? "pass" : "blocked"),
      row("offline_trial_release_gate_external", "No External Open", safe.noExternalOpen ? "不打开外部平台" : "检测到外部打开风险", safe.noExternalOpen ? "pass" : "blocked"),
      row("offline_trial_release_gate_manual_review", "Manual Review Required", "人工复核通过后才能进入下一阶段", "warning")
    ]);
  }

  function buildGlobalShoppingOfflineTrialReleaseGateAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineTrialReleaseGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_TRIAL_RELEASE_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_TRIAL_RELEASE_GATE_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineTrialReleaseGate(gate) {
    const safe = evaluateGlobalShoppingOfflineTrialReleaseGate(gate || {});
    safe.rules = buildGlobalShoppingOfflineTrialReleaseGateRules(safe);
    safe.rows = buildGlobalShoppingOfflineTrialReleaseGateRows(safe);
    return safe;
  }

  function buildGlobalShoppingOfflineTrialReleaseGate(input) {
    try {
      return sanitizeGlobalShoppingOfflineTrialReleaseGate(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineTrialReleaseGate({ status:"blocked" });
    }
  }

  window.WeishanGlobalShoppingOfflineTrialReleaseGate = {
    GLOBAL_SHOPPING_OFFLINE_TRIAL_RELEASE_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingOfflineTrialReleaseGate,
    evaluateGlobalShoppingOfflineTrialReleaseGate,
    buildGlobalShoppingOfflineTrialReleaseGateRows,
    buildGlobalShoppingOfflineTrialReleaseGateRules,
    buildGlobalShoppingOfflineTrialReleaseGateAuditDraft,
    sanitizeGlobalShoppingOfflineTrialReleaseGate
  };
})();
