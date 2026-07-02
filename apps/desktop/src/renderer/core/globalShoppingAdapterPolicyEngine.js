;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ADAPTER_POLICY_ENGINE_VERSION = "3.9.0";
  const ENGINE_NAME = "global_shopping_adapter_policy_engine_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function rule(ruleId, label, status, summary, caveat) {
    return { ruleId:text(ruleId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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

  function buildGlobalShoppingAdapterPolicyRules(input) {
    const safe = obj(input);
    const offlineProviderLaunchControlTowerSummary = resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower");
    const adapterSecurityRegressionGuardSummary = resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard");
    const adapterBoundaryLockSummary = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    const adapterBoundaryDiffInspectorSummary = resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector");
    const providerAdapterComplianceChecklistSummary = resolveSummary(safe, "providerAdapterComplianceChecklistSummary", "WeishanGlobalShoppingProviderAdapterComplianceChecklist", "buildGlobalShoppingProviderAdapterComplianceChecklist");
    return clone([
      rule("launch_control_tower", "Offline Provider Launch Control Tower", present(offlineProviderLaunchControlTowerSummary) ? offlineProviderLaunchControlTowerSummary.status : "needs_review", labelOf(offlineProviderLaunchControlTowerSummary, "离线 Launch 控制塔仍需复核"), "Launch Control 不保存真实决策。"),
      rule("security_regression_guard", "Adapter Security Regression Guard", present(adapterSecurityRegressionGuardSummary) ? adapterSecurityRegressionGuardSummary.status : "needs_review", labelOf(adapterSecurityRegressionGuardSummary, "Adapter 安全回归仍需复核"), "Adapter Policy 不修改配置、不启用 provider。"),
      rule("adapter_boundary_lock", "Adapter Boundary Lock", present(adapterBoundaryLockSummary) ? adapterBoundaryLockSummary.status : "needs_review", labelOf(adapterBoundaryLockSummary, "Adapter 边界锁仍需复核"), "不锁真实配置，不启用 provider。"),
      rule("boundary_diff_inspector", "Adapter Boundary Diff Inspector", present(adapterBoundaryDiffInspectorSummary) ? adapterBoundaryDiffInspectorSummary.status : "needs_review", labelOf(adapterBoundaryDiffInspectorSummary, "Adapter 边界差异仍需复核"), "不生成 endpoint，不创建 provider client。"),
      rule("adapter_compliance_checklist", "Provider Adapter Compliance Checklist", present(providerAdapterComplianceChecklistSummary) ? providerAdapterComplianceChecklistSummary.status : "needs_review", labelOf(providerAdapterComplianceChecklistSummary, "Adapter 合规清单仍需复核"), "不读取密钥，不联网，不保存 raw request 或 raw response。")
    ]);
  }

  function buildGlobalShoppingAdapterPolicyRows(input) {
    const safe = obj(input);
    const rules = toArray(safe.policyRules).length ? toArray(safe.policyRules) : buildGlobalShoppingAdapterPolicyRules(safe);
    return clone([
      row("adapter_policy_engine_status", "Adapter Policy Engine 状态", obj(safe.userFacingSummary).resultLabel || "Adapter 策略仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("adapter_policy_engine_boundary", "Adapter Policy 边界", "该策略引擎只展示离线 adapter policy，不修改配置，不启用 provider，不读取密钥。", "pass")
    ].concat(rules.map(function (item) {
      return row(item.ruleId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingAdapterPolicyEngine(input) {
    const safe = obj(input);
    const rules = buildGlobalShoppingAdapterPolicyRules(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedRules = rules.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewRules = rules.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedRules.length ? "blocked" : (needsReviewRules.length ? "needs_review" : "ready");
    const result = {
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_POLICY_ENGINE_VERSION,
      status:status,
      policyBoundary:{
        engineId:"global-shopping-adapter-policy-engine",
        engineMode:"policy_only",
        policyOnly:true,
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
      policySummary:{
        hasLaunchControlTower:present(resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower")),
        hasSecurityRegressionGuard:present(resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard")),
        hasAdapterBoundaryLock:present(resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock")),
        hasBoundaryDiffInspector:present(resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector")),
        hasAdapterComplianceChecklist:present(resolveSummary(safe, "providerAdapterComplianceChecklistSummary", "WeishanGlobalShoppingProviderAdapterComplianceChecklist", "buildGlobalShoppingProviderAdapterComplianceChecklist")),
        policyRuleCount:rules.length,
        blockedPolicyCount:directBlockedReasons.length + blockedRules.length,
        needsReviewPolicyCount:needsReviewRules.length,
        readyForHumanReleaseEvidenceTimeline:status === "ready",
        humanPolicyReviewRequired:true
      },
      policyRules:rules,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedRules.map(function (item) { return item.ruleId + "_blocked"; })),
      userFacingSummary:{
        title:"Adapter Policy Engine",
        resultLabel:status === "ready" ? "Adapter 策略引擎已准备" : (status === "blocked" ? "Adapter 策略已阻断" : "Adapter 策略仍需复核"),
        caveat:"该策略引擎只展示离线 adapter policy，不修改配置，不启用 provider，不读取密钥。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingAdapterPolicyRows(result);
    return clone(result);
  }

  function buildGlobalShoppingAdapterPolicyEngineAuditDraft(input) {
    const engine = buildGlobalShoppingAdapterPolicyEngine(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_ADAPTER_POLICY_ENGINE_AUDIT_DRAFT",
      engineName:ENGINE_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_POLICY_ENGINE_VERSION,
      status:engine.status,
      policyRuleCount:obj(engine.policySummary).policyRuleCount || 0,
      blockedPolicyCount:obj(engine.policySummary).blockedPolicyCount || 0,
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

  function sanitizeGlobalShoppingAdapterPolicyEngine(engine) {
    return evaluateGlobalShoppingAdapterPolicyEngine(engine || {});
  }

  function buildGlobalShoppingAdapterPolicyEngine(input) {
    try {
      return evaluateGlobalShoppingAdapterPolicyEngine(input || {});
    } catch (_) {
      return evaluateGlobalShoppingAdapterPolicyEngine({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingAdapterPolicyEngine = {
    GLOBAL_SHOPPING_ADAPTER_POLICY_ENGINE_VERSION,
    ENGINE_NAME,
    buildGlobalShoppingAdapterPolicyEngine,
    evaluateGlobalShoppingAdapterPolicyEngine,
    buildGlobalShoppingAdapterPolicyRows,
    buildGlobalShoppingAdapterPolicyRules,
    buildGlobalShoppingAdapterPolicyEngineAuditDraft,
    sanitizeGlobalShoppingAdapterPolicyEngine
  };
})();
