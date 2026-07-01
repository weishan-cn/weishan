;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NO_ACTIVATION_ENFORCEMENT_LEDGER_VERSION = "3.6.0";
  const LEDGER_NAME = "global_shopping_no_activation_enforcement_ledger_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|enforcement_ledger_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "enforcement_ledger_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function entry(entryId, label, status, summary, caveat) {
    return { entryId:text(entryId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.executeRealBlock === true ? "real_block_execution_detected" : "",
      safe.persistEnforcementResult === true ? "enforcement_result_persistence_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.createEndpoint === true ? "endpoint_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.booking === true ? "booking_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.checkout === true ? "checkout_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingNoActivationEnforcementEntries(input) {
    const safe = obj(input);
    const offlineDistributionReadinessCenterSummary = resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter");
    const noActivationComplianceSealSummary = resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal");
    const providerNoActivationGuaranteeBoardSummary = resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const safetySentinelSummary = present(safe.safetySentinelSummary) ? obj(safe.safetySentinelSummary) : {};
    return clone([
      entry("offline_distribution_readiness_center", "Offline Distribution Readiness Center", present(offlineDistributionReadinessCenterSummary) ? offlineDistributionReadinessCenterSummary.status : "needs_review", labelOf(offlineDistributionReadinessCenterSummary, "Offline Distribution Readiness Center 仍需复核"), "Distribution Readiness 不创建真实分发包。"),
      entry("no_activation_compliance_seal", "No-Activation Compliance Seal", present(noActivationComplianceSealSummary) ? noActivationComplianceSealSummary.status : "needs_review", labelOf(noActivationComplianceSealSummary, "No-Activation Compliance Seal 仍需复核"), "No-Activation Enforcement 不执行真实阻断。"),
      entry("provider_no_activation_guarantee_board", "Provider No-Activation Guarantee Board", present(providerNoActivationGuaranteeBoardSummary) ? providerNoActivationGuaranteeBoardSummary.status : "needs_review", labelOf(providerNoActivationGuaranteeBoardSummary, "Provider No-Activation Guarantee Board 仍需复核"), "No-Activation Guarantee 不修改配置、不启用 provider。"),
      entry("provider_activation_blocker_sentinel", "Provider Activation Blocker Sentinel", present(providerActivationBlockerSentinelSummary) ? providerActivationBlockerSentinelSummary.status : "needs_review", labelOf(providerActivationBlockerSentinelSummary, "Provider Activation Blocker Sentinel 仍需复核"), "Activation Blocker 不修改配置、不启用 provider。"),
      entry("safety_regression_sentinel", "Safety Regression Sentinel", present(safetySentinelSummary) ? safetySentinelSummary.status : "needs_review", labelOf(safetySentinelSummary, "Safety Regression Sentinel 仍需复核"), "Safety Sentinel 不写文件、不联网。")
    ]);
  }

  function buildGlobalShoppingNoActivationEnforcementRows(input) {
    const safe = obj(input);
    const entries = toArray(safe.enforcementEntries).length ? toArray(safe.enforcementEntries) : buildGlobalShoppingNoActivationEnforcementEntries(safe);
    return clone([
      row("no_activation_enforcement_ledger_status", "No-Activation Enforcement Ledger", obj(safe.userFacingSummary).resultLabel || "No-Activation Enforcement Ledger 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("no_activation_enforcement_ledger_boundary", "No-Activation Enforcement 边界", "该 Ledger 只展示不激活执行台账，不执行真实阻断、不修改配置、不持久化真实 enforcement 结果。", "pass")
    ].concat(entries.map(function (item) {
      return row(item.entryId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingNoActivationEnforcementLedger(input) {
    const safe = obj(input);
    const enforcementEntries = buildGlobalShoppingNoActivationEnforcementEntries(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedEntries = enforcementEntries.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewEntries = enforcementEntries.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedEntries.length ? "blocked" : (needsReviewEntries.length ? "needs_review" : "ready");
    const result = {
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_NO_ACTIVATION_ENFORCEMENT_LEDGER_VERSION,
      status:status,
      ledgerMode:safeMode(safe.ledgerMode),
      enforcementBoundary:{
        enforcementLedgerOnly:true,
        offlineMock:true,
        readOnly:true,
        canExecuteRealBlock:false,
        canPersistEnforcementResult:false,
        canModifyRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canCreateProviderClient:false,
        canCreateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canWriteFile:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canBook:false,
        canPay:false,
        canOrder:false,
        canCheckout:false
      },
      enforcementSummary:{
        hasDistributionReadinessCenter:present(resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter")),
        hasNoActivationComplianceSeal:present(resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal")),
        hasNoActivationGuaranteeBoard:present(resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard")),
        hasActivationBlockerSentinel:present(resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel")),
        hasSafetySentinel:present(safe.safetySentinelSummary),
        enforcementEntryCount:enforcementEntries.length,
        needsReviewEntryCount:needsReviewEntries.length,
        blockedEntryCount:directBlockedReasons.length + blockedEntries.length,
        readyForFinalUserTrustSummary:status === "ready",
        humanDistributionReadinessReviewRequired:true
      },
      enforcementEntries:enforcementEntries,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedEntries.map(function (item) { return item.entryId + "_blocked"; })),
      userFacingSummary:{
        title:"No-Activation Enforcement Ledger",
        resultLabel:status === "ready" ? "No-Activation Enforcement Ledger 已准备" : (status === "blocked" ? "No-Activation Enforcement Ledger 已阻断" : "No-Activation Enforcement Ledger 仍需复核"),
        caveat:"该 Ledger 只展示不激活执行台账，不执行真实阻断、不修改配置、不持久化真实 enforcement 结果。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingNoActivationEnforcementRows(result);
    return clone(result);
  }

  function buildGlobalShoppingNoActivationEnforcementLedgerAuditDraft(input) {
    const ledger = buildGlobalShoppingNoActivationEnforcementLedger(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NO_ACTIVATION_ENFORCEMENT_LEDGER_AUDIT_DRAFT",
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_NO_ACTIVATION_ENFORCEMENT_LEDGER_VERSION,
      status:ledger.status,
      enforcementEntryCount:obj(ledger.enforcementSummary).enforcementEntryCount || 0,
      blockedEntryCount:obj(ledger.enforcementSummary).blockedEntryCount || 0,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingNoActivationEnforcementLedger(ledger) {
    return evaluateGlobalShoppingNoActivationEnforcementLedger(ledger || {});
  }

  function buildGlobalShoppingNoActivationEnforcementLedger(input) {
    try {
      return evaluateGlobalShoppingNoActivationEnforcementLedger(input || {});
    } catch (_) {
      return evaluateGlobalShoppingNoActivationEnforcementLedger({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingNoActivationEnforcementLedger = {
    GLOBAL_SHOPPING_NO_ACTIVATION_ENFORCEMENT_LEDGER_VERSION,
    LEDGER_NAME,
    buildGlobalShoppingNoActivationEnforcementLedger,
    evaluateGlobalShoppingNoActivationEnforcementLedger,
    buildGlobalShoppingNoActivationEnforcementRows,
    buildGlobalShoppingNoActivationEnforcementEntries,
    buildGlobalShoppingNoActivationEnforcementLedgerAuditDraft,
    sanitizeGlobalShoppingNoActivationEnforcementLedger
  };
})();
