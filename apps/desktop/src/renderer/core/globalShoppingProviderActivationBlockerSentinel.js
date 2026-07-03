;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ACTIVATION_BLOCKER_SENTINEL_VERSION = "4.1.6";
  const SENTINEL_NAME = "global_shopping_provider_activation_blocker_sentinel_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function rule(ruleId, label, status, summary, caveat) {
    return { ruleId:text(ruleId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
  function resolveSentinel(input) {
    const safe = obj(input);
    if (present(safe.safetyRegressionSummary)) return obj(safe.safetyRegressionSummary);
    if (present(safe.safetySentinelSummary)) return obj(safe.safetySentinelSummary);
    const api = window.WeishanFlightWorkflowSafetyRegressionSentinel || {};
    return typeof api.buildFlightWorkflowSafetyRegressionReport === "function" ? obj(api.buildFlightWorkflowSafetyRegressionReport(safe)) : {};
  }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.blockRealProcess === true ? "real_process_block_detected" : "",
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
      safe.booking === true ? "booking_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.checkout === true ? "checkout_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderActivationBlockerRules(input) {
    const safe = obj(input);
    const finalOfflineLaunchReviewConsoleSummary = resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole");
    const adapterLaunchBoundaryVerifierSummary = resolveSummary(safe, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier");
    const adapterPolicyEngineSummary = present(safe.adapterPolicyEngineSummary) ? obj(safe.adapterPolicyEngineSummary) : {};
    const adapterSecurityRegressionGuardSummary = present(safe.adapterSecurityRegressionGuardSummary) ? obj(safe.adapterSecurityRegressionGuardSummary) : {};
    const safetySentinelSummary = resolveSentinel(safe);
    return clone([
      rule("final_offline_launch_review_console", "Final Offline Launch Review Console", present(finalOfflineLaunchReviewConsoleSummary) ? finalOfflineLaunchReviewConsoleSummary.status : "needs_review", labelOf(finalOfflineLaunchReviewConsoleSummary, "Final Review Console 仍需复核"), "Activation Blocker 只展示最终离线复核。"),
      rule("adapter_launch_boundary_verifier", "Adapter Launch Boundary Verifier", present(adapterLaunchBoundaryVerifierSummary) ? adapterLaunchBoundaryVerifierSummary.status : "needs_review", labelOf(adapterLaunchBoundaryVerifierSummary, "Boundary Verifier 仍需复核"), "Activation Blocker 不生成 endpoint、不读取密钥。"),
      rule("adapter_policy_engine", "Adapter Policy Engine", present(adapterPolicyEngineSummary) ? adapterPolicyEngineSummary.status : "needs_review", labelOf(adapterPolicyEngineSummary, "Policy Engine 仍需复核"), "Activation Blocker 不修改配置、不启用 provider。"),
      rule("adapter_security_regression_guard", "Adapter Security Regression Guard", present(adapterSecurityRegressionGuardSummary) ? adapterSecurityRegressionGuardSummary.status : "needs_review", labelOf(adapterSecurityRegressionGuardSummary, "Security Guard 仍需复核"), "Activation Blocker 不保存 raw request/response。"),
      rule("flight_workflow_safety_sentinel", "Safety Sentinel", present(safetySentinelSummary) ? (safeStatus(safetySentinelSummary.status) === "pass" ? "ready" : "needs_review") : "needs_review", text(safetySentinelSummary.status === "pass" ? "安全回归通过" : (toArray(safetySentinelSummary.failures).length ? "安全回归存在阻断" : "安全回归仍需复核")), "Activation Blocker 不阻断真实系统进程。")
    ]);
  }

  function buildGlobalShoppingProviderActivationBlockerRows(input) {
    const safe = obj(input);
    const rules = toArray(safe.blockerRules).length ? toArray(safe.blockerRules) : buildGlobalShoppingProviderActivationBlockerRules(safe);
    return clone([
      row("provider_activation_blocker_sentinel_status", "Provider Activation Blocker Sentinel", obj(safe.userFacingSummary).resultLabel || "Provider Activation Blocker Sentinel 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_activation_blocker_sentinel_boundary", "Activation Blocker 边界", "该 Sentinel 只展示 activation blocker 检查，不修改配置，不启用或禁用 provider，不创建 provider client。", "pass")
    ].concat(rules.map(function (item) {
      return row(item.ruleId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderActivationBlockerSentinel(input) {
    const safe = obj(input);
    const blockerRules = buildGlobalShoppingProviderActivationBlockerRules(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedRules = blockerRules.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewRules = blockerRules.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedRules.length ? "blocked" : (needsReviewRules.length ? "needs_review" : "ready");
    const result = {
      sentinelName:SENTINEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ACTIVATION_BLOCKER_SENTINEL_VERSION,
      status:status,
      sentinelMode:"blocker_only",
      blockerBoundary:{
        blockerOnly:true,
        offlineMock:true,
        readOnly:true,
        canBlockRealProcess:false,
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
        canBook:false,
        canPay:false,
        canOrder:false,
        canCheckout:false
      },
      blockerSummary:{
        hasFinalReviewConsole:present(resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole")),
        hasBoundaryVerifier:present(resolveSummary(safe, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier")),
        hasPolicyEngine:present(safe.adapterPolicyEngineSummary),
        hasSecurityGuard:present(safe.adapterSecurityRegressionGuardSummary),
        hasSafetySentinel:present(resolveSentinel(safe)),
        blockerRuleCount:blockerRules.length,
        needsReviewRuleCount:needsReviewRules.length,
        blockedRuleCount:directBlockedReasons.length + blockedRules.length,
        readyForReadOnlyEvidenceSummary:status === "ready",
        manualActivationBlockerReviewRequired:true
      },
      blockerRules:blockerRules,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedRules.map(function (item) { return item.ruleId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Activation Blocker Sentinel",
        resultLabel:status === "ready" ? "Provider Activation Blocker Sentinel 已准备" : (status === "blocked" ? "Provider Activation Blocker Sentinel 已阻断" : "Provider Activation Blocker Sentinel 仍需复核"),
        caveat:"该 Sentinel 只展示 activation blocker 检查，不修改配置，不启用或禁用 provider，不创建 provider client。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderActivationBlockerRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderActivationBlockerSentinelAuditDraft(input) {
    const sentinel = buildGlobalShoppingProviderActivationBlockerSentinel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_ACTIVATION_BLOCKER_SENTINEL_AUDIT_DRAFT",
      sentinelName:SENTINEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ACTIVATION_BLOCKER_SENTINEL_VERSION,
      status:sentinel.status,
      blockerRuleCount:obj(sentinel.blockerSummary).blockerRuleCount || 0,
      blockedRuleCount:obj(sentinel.blockerSummary).blockedRuleCount || 0,
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

  function sanitizeGlobalShoppingProviderActivationBlockerSentinel(sentinel) {
    return evaluateGlobalShoppingProviderActivationBlockerSentinel(sentinel || {});
  }

  function buildGlobalShoppingProviderActivationBlockerSentinel(input) {
    try {
      return evaluateGlobalShoppingProviderActivationBlockerSentinel(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderActivationBlockerSentinel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderActivationBlockerSentinel = {
    GLOBAL_SHOPPING_PROVIDER_ACTIVATION_BLOCKER_SENTINEL_VERSION,
    SENTINEL_NAME,
    buildGlobalShoppingProviderActivationBlockerSentinel,
    evaluateGlobalShoppingProviderActivationBlockerSentinel,
    buildGlobalShoppingProviderActivationBlockerRows,
    buildGlobalShoppingProviderActivationBlockerRules,
    buildGlobalShoppingProviderActivationBlockerSentinelAuditDraft,
    sanitizeGlobalShoppingProviderActivationBlockerSentinel
  };
})();
