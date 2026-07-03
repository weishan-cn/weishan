;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NO_PROVIDER_EXECUTION_FINAL_GUARD_VERSION = "4.0.5";
  const GUARD_NAME = "global_shopping_no_provider_execution_final_guard_v1";

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
  function safeMode(value) { return /^(disabled|final_guard_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "final_guard_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function rule(ruleId, label, value, status) {
    return { ruleId:text(ruleId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
      safe.executeRealBlocking === true ? "real_blocking_execution_detected" : "",
      safe.mutateConfig === true ? "config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.switchProductionProvider === true ? "production_provider_switch_detected" : "",
      safe.providerClient === true ? "provider_client_detected" : "",
      safe.endpoint === true ? "endpoint_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.openExternal === true ? "open_external_detected" : "",
      safe.windowOpen === true ? "window_open_detected" : "",
      safe.booking === true ? "booking_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.checkout === true ? "checkout_detected" : "",
      safe.ticketing === true ? "ticketing_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingNoProviderExecutionFinalGuardRules(input) {
    const safe = obj(input);
    const providerPublicTrustClosureCenterSummary = resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter");
    const offlineReleaseMemorySnapshotSummary = resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot");
    const providerNoProductionGuaranteeMatrixSummary = resolveSummary(safe, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix");
    const noActivationEnforcementLedgerSummary = resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger");
    const safetySentinelSummary = resolveSummary(safe, "safetySentinelSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport");
    return clone([
      rule("provider_public_trust_closure_center", "Provider Public Trust Closure Center", labelOf(providerPublicTrustClosureCenterSummary, "Provider Public Trust Closure Center 仍需复核"), safeStatus(providerPublicTrustClosureCenterSummary.status) === "ready" ? "pass" : (safeStatus(providerPublicTrustClosureCenterSummary.status) === "blocked" ? "blocked" : "warning")),
      rule("offline_release_memory_snapshot", "Offline Release Memory Snapshot", labelOf(offlineReleaseMemorySnapshotSummary, "Offline Release Memory Snapshot 仍需复核"), safeStatus(offlineReleaseMemorySnapshotSummary.status) === "ready" ? "pass" : (safeStatus(offlineReleaseMemorySnapshotSummary.status) === "blocked" ? "blocked" : "warning")),
      rule("provider_no_production_guarantee_matrix", "Provider No-Production Guarantee Matrix", labelOf(providerNoProductionGuaranteeMatrixSummary, "Provider No-Production Guarantee Matrix 仍需复核"), safeStatus(providerNoProductionGuaranteeMatrixSummary.status) === "ready" ? "pass" : (safeStatus(providerNoProductionGuaranteeMatrixSummary.status) === "blocked" ? "blocked" : "warning")),
      rule("no_activation_enforcement_ledger", "No-Activation Enforcement Ledger", labelOf(noActivationEnforcementLedgerSummary, "No-Activation Enforcement Ledger 仍需复核"), safeStatus(noActivationEnforcementLedgerSummary.status) === "ready" ? "pass" : (safeStatus(noActivationEnforcementLedgerSummary.status) === "blocked" ? "blocked" : "warning")),
      rule("safety_sentinel", "Safety Sentinel", labelOf(safetySentinelSummary, "Safety Sentinel 仍需复核"), safeStatus(safetySentinelSummary.status) === "ready" || safeStatus(safetySentinelSummary.status) === "pass" ? "pass" : (safeStatus(safetySentinelSummary.status) === "blocked" || safeStatus(safetySentinelSummary.status) === "fail" || safeStatus(safetySentinelSummary.status) === "failed_safe" ? "blocked" : "warning"))
    ]);
  }

  function buildGlobalShoppingNoProviderExecutionFinalGuardRows(input) {
    const safe = obj(input);
    const rules = toArray(safe.guardRules).length ? toArray(safe.guardRules) : buildGlobalShoppingNoProviderExecutionFinalGuardRules(safe);
    return clone([
      row("no_provider_execution_final_guard_status", "No-Provider-Execution Final Guard", obj(safe.userFacingSummary).resultLabel || "No-Provider-Execution Final Guard 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("no_provider_execution_final_guard_boundary", "No-Provider Guard 边界", "No-Provider Guard 不执行真实阻断、不打开平台。", "pass")
    ].concat(rules.map(function (item) {
      return row(item.ruleId, item.label, item.value, item.status);
    })));
  }

  function evaluateGlobalShoppingNoProviderExecutionFinalGuard(input) {
    const safe = obj(input);
    const guardRules = buildGlobalShoppingNoProviderExecutionFinalGuardRules(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedRules = guardRules.filter(function (item) { return item.status === "blocked"; });
    const needsReviewRules = guardRules.filter(function (item) { return item.status === "warning"; });
    const status = directBlockedReasons.length || blockedRules.length ? "blocked" : (needsReviewRules.length ? "needs_review" : "ready");
    const result = {
      guardName:GUARD_NAME,
      appVersion:GLOBAL_SHOPPING_NO_PROVIDER_EXECUTION_FINAL_GUARD_VERSION,
      status:status,
      guardMode:safeMode(safe.guardMode),
      guardBoundary:{
        finalGuardOnly:true,
        offlineMock:true,
        readOnly:true,
        canExecuteRealBlocking:false,
        canMutateConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canSwitchProductionProvider:false,
        canCreateProviderClient:false,
        canGenerateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canStoreRawProviderData:false,
        canWriteFile:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canOpenExternal:false,
        canWindowOpen:false,
        canBook:false,
        canPay:false,
        canOrder:false,
        canCheckout:false,
        canIssueTicket:false
      },
      guardSummary:{
        hasProviderPublicTrustClosureCenter:present(resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter")),
        hasOfflineReleaseMemorySnapshot:present(resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot")),
        hasProviderNoProductionGuaranteeMatrix:present(resolveSummary(safe, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix")),
        hasNoActivationEnforcementLedger:present(resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger")),
        hasSafetySentinel:present(resolveSummary(safe, "safetySentinelSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport")),
        guardRuleCount:guardRules.length,
        needsReviewRuleCount:needsReviewRules.length,
        blockedRuleCount:directBlockedReasons.length + blockedRules.length,
        readyForUserVisibleSafetyBoundaryExplainer:status === "ready"
      },
      guardRules:guardRules,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedRules.map(function (item) { return item.ruleId + "_blocked"; })),
      userFacingSummary:{
        title:"No-Provider-Execution Final Guard",
        resultLabel:status === "ready" ? "No-Provider-Execution Final Guard 已准备" : (status === "blocked" ? "No-Provider-Execution Final Guard 已阻断" : "No-Provider-Execution Final Guard 仍需复核"),
        caveat:"No-Provider Guard 不执行真实阻断、不打开平台。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingNoProviderExecutionFinalGuardRows(result);
    return clone(result);
  }

  function buildGlobalShoppingNoProviderExecutionFinalGuardAuditDraft(input) {
    const guard = buildGlobalShoppingNoProviderExecutionFinalGuard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NO_PROVIDER_EXECUTION_FINAL_GUARD_AUDIT_DRAFT",
      guardName:GUARD_NAME,
      appVersion:GLOBAL_SHOPPING_NO_PROVIDER_EXECUTION_FINAL_GUARD_VERSION,
      status:guard.status,
      guardRuleCount:obj(guard.guardSummary).guardRuleCount || 0,
      blockedRuleCount:obj(guard.guardSummary).blockedRuleCount || 0,
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

  function sanitizeGlobalShoppingNoProviderExecutionFinalGuard(guard) {
    return evaluateGlobalShoppingNoProviderExecutionFinalGuard(guard || {});
  }

  function buildGlobalShoppingNoProviderExecutionFinalGuard(input) {
    try {
      return evaluateGlobalShoppingNoProviderExecutionFinalGuard(input || {});
    } catch (_) {
      return evaluateGlobalShoppingNoProviderExecutionFinalGuard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingNoProviderExecutionFinalGuard = {
    GLOBAL_SHOPPING_NO_PROVIDER_EXECUTION_FINAL_GUARD_VERSION,
    GUARD_NAME,
    buildGlobalShoppingNoProviderExecutionFinalGuard,
    evaluateGlobalShoppingNoProviderExecutionFinalGuard,
    buildGlobalShoppingNoProviderExecutionFinalGuardRows,
    buildGlobalShoppingNoProviderExecutionFinalGuardRules,
    buildGlobalShoppingNoProviderExecutionFinalGuardAuditDraft,
    sanitizeGlobalShoppingNoProviderExecutionFinalGuard
  };
})();
