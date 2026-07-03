;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ADAPTER_SECURITY_REGRESSION_GUARD_VERSION = "4.1.7";
  const GUARD_NAME = "global_shopping_adapter_security_regression_guard_v1";
  const BUILD_GUARD_KEY = "__weishanGlobalShoppingAdapterSecurityRegressionGuardBuilding";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|fail|warning)$/.test(text(value)) ? text(value) : "needs_review"; }
  function normalizedSummaryStatus(summary) {
    const status = safeStatus(obj(summary).status);
    if (status === "pass") return "ready";
    if (status === "fail" || status === "warning") return "blocked";
    return status;
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function gate(gateId, label, status, summary, caveat) {
    return { gateId:text(gateId), label:text(label), status:/^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review", summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
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
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.lockRuntimeConfig === true ? "runtime_config_lock_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.checkout === true ? "checkout_detected" : "",
      safe.pay === true ? "payment_detected" : "",
      safe.ticket === true ? "ticketing_detected" : "",
      safe.createOrder === true ? "order_creation_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingAdapterSecurityRegressionGates(input) {
    const safe = obj(input);
    const adapterBoundaryDiffInspectorSummary = resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector");
    const adapterBoundaryLockSummary = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    const sandboxActivationReceiptLedgerSummary = resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    const mockIntegrationRegressionLabSummary = resolveSummary(safe, "mockIntegrationRegressionLabSummary", "WeishanGlobalShoppingMockIntegrationRegressionLab", "buildGlobalShoppingMockIntegrationRegressionLab");
    const safetySentinelSummary = present(safe.safetySentinelSummary) ? obj(safe.safetySentinelSummary) : resolveSummary(safe, "safetyRegressionSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport");
    return clone([
      gate("boundary_diff_inspector", "Adapter Boundary Diff Inspector", present(adapterBoundaryDiffInspectorSummary) ? adapterBoundaryDiffInspectorSummary.status : "needs_review", labelOf(adapterBoundaryDiffInspectorSummary, "Adapter 边界差异仍需复核"), "只展示边界差异，不修改配置。"),
      gate("boundary_lock", "Adapter Boundary Lock", present(adapterBoundaryLockSummary) ? adapterBoundaryLockSummary.status : "needs_review", labelOf(adapterBoundaryLockSummary, "Adapter 边界锁仍需复核"), "只展示边界锁，不锁真实配置。"),
      gate("activation_receipt_ledger", "Sandbox Activation Receipt Ledger", present(sandboxActivationReceiptLedgerSummary) ? sandboxActivationReceiptLedgerSummary.status : "needs_review", labelOf(sandboxActivationReceiptLedgerSummary, "Sandbox 激活回执仍需复核"), "只展示回执台账，不持久化台账。"),
      gate("regression_lab", "Mock Integration Regression Lab", present(mockIntegrationRegressionLabSummary) ? mockIntegrationRegressionLabSummary.status : "needs_review", labelOf(mockIntegrationRegressionLabSummary, "Mock 集成回归仍需复核"), "只展示离线回归，不联网。"),
      gate("safety_sentinel", "Safety Sentinel", present(safetySentinelSummary) ? normalizedSummaryStatus(safetySentinelSummary) : "needs_review", labelOf(safetySentinelSummary, "安全回归仍需复核"), "只展示安全检查，不保存 raw request/response。")
    ]);
  }

  function buildGlobalShoppingAdapterSecurityRegressionRows(input) {
    const safe = obj(input);
    const guardGates = toArray(safe.guardGates).length ? toArray(safe.guardGates) : buildGlobalShoppingAdapterSecurityRegressionGates(safe);
    return clone([
      row("adapter_security_regression_guard_status", "Adapter Security Regression Guard 状态", obj(safe.userFacingSummary).resultLabel || "Adapter 安全回归仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("adapter_security_regression_guard_boundary", "Adapter 安全回归边界", "该守卫只展示 adapter 安全回归状态，不修改配置，不启用或禁用 provider，不读取密钥。", "pass")
    ].concat(guardGates.map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingAdapterSecurityRegressionGuard(input) {
    const safe = obj(input);
    const guardGates = buildGlobalShoppingAdapterSecurityRegressionGates(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedGuardGates = guardGates.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewGuardGates = guardGates.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedGuardGates.length ? "blocked" : (needsReviewGuardGates.length ? "needs_review" : "ready");
    const result = {
      guardName:GUARD_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_SECURITY_REGRESSION_GUARD_VERSION,
      status:status,
      guardBoundary:{
        guardId:"global-shopping-adapter-security-regression-guard",
        guardMode:"guard_only",
        guardOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canModifyRuntimeConfig:false,
        canLockRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canCreateProviderClient:false,
        canGenerateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canWriteFile:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      guardSummary:{
        hasBoundaryDiffInspector:guardGates[0].status !== "needs_review",
        hasBoundaryLock:guardGates[1].status !== "needs_review",
        hasActivationReceiptLedger:guardGates[2].status !== "needs_review",
        hasRegressionLab:guardGates[3].status !== "needs_review",
        hasSafetySentinel:guardGates[4].status !== "needs_review",
        guardGateCount:guardGates.length,
        blockedGuardGateCount:blockedGuardGates.length,
        needsReviewGuardGateCount:needsReviewGuardGates.length,
        readyForOfflineLaunchChecklist:status === "ready",
        manualSecurityReviewRequired:true
      },
      guardGates:guardGates,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedGuardGates.map(function (item) { return item.gateId + "_blocked"; })),
      userFacingSummary:{
        title:"Adapter Security Regression Guard",
        resultLabel:status === "ready" ? "Adapter 安全回归守卫已准备" : (status === "blocked" ? "Adapter 安全回归已阻断" : "Adapter 安全回归仍需复核"),
        caveat:"该守卫只展示 adapter 安全回归状态，不修改配置，不启用或禁用 provider，不读取密钥。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingAdapterSecurityRegressionRows(result);
    return clone(result);
  }

  function buildGlobalShoppingAdapterSecurityRegressionGuardAuditDraft(input) {
    const guard = buildGlobalShoppingAdapterSecurityRegressionGuard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_ADAPTER_SECURITY_REGRESSION_GUARD_AUDIT_DRAFT",
      guardName:GUARD_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_SECURITY_REGRESSION_GUARD_VERSION,
      status:guard.status,
      guardGateCount:obj(guard.guardSummary).guardGateCount || 0,
      blockedGuardGateCount:obj(guard.guardSummary).blockedGuardGateCount || 0,
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
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingAdapterSecurityRegressionGuard(guard) {
    return evaluateGlobalShoppingAdapterSecurityRegressionGuard(guard || {});
  }

  function buildGlobalShoppingAdapterSecurityRegressionGuard(input) {
    if (window[BUILD_GUARD_KEY] === true) {
      return evaluateGlobalShoppingAdapterSecurityRegressionGuard({ status:"needs_review" });
    }
    window[BUILD_GUARD_KEY] = true;
    try {
      return evaluateGlobalShoppingAdapterSecurityRegressionGuard(input || {});
    } catch (_) {
      return evaluateGlobalShoppingAdapterSecurityRegressionGuard({ status:"failed_safe" });
    } finally {
      window[BUILD_GUARD_KEY] = false;
    }
  }

  window.WeishanGlobalShoppingAdapterSecurityRegressionGuard = {
    GLOBAL_SHOPPING_ADAPTER_SECURITY_REGRESSION_GUARD_VERSION,
    GUARD_NAME,
    buildGlobalShoppingAdapterSecurityRegressionGuard,
    evaluateGlobalShoppingAdapterSecurityRegressionGuard,
    buildGlobalShoppingAdapterSecurityRegressionRows,
    buildGlobalShoppingAdapterSecurityRegressionGates,
    buildGlobalShoppingAdapterSecurityRegressionGuardAuditDraft,
    sanitizeGlobalShoppingAdapterSecurityRegressionGuard
  };
})();
