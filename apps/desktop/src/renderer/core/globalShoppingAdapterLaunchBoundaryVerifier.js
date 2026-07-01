;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ADAPTER_LAUNCH_BOUNDARY_VERIFIER_VERSION = "3.1.0";
  const VERIFIER_NAME = "global_shopping_adapter_launch_boundary_verifier_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const normalized = text(value);
    if (normalized === "pass") return "ready";
    return /^(ready|needs_review|blocked|failed_safe)$/.test(normalized) ? normalized : "needs_review";
  }
  function gate(gateId, label, status, summary, caveat) {
    return { gateId:text(gateId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.writeFile === true ? "file_write_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingAdapterLaunchBoundaryVerificationGates(input) {
    const safe = obj(input);
    const offlinePolicyReplayCenterSummary = resolveSummary(safe, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter");
    const adapterBoundaryLockSummary = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    const adapterBoundaryDiffInspectorSummary = resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector");
    const adapterPolicyEngineSummary = resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine");
    const humanActivationFinalDossierSummary = resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier");
    const safetySentinelSummary = resolveSummary(safe, "safetySentinelSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport");
    return clone([
      gate("offline_policy_replay_center", "Offline Policy Replay Center", present(offlinePolicyReplayCenterSummary) ? offlinePolicyReplayCenterSummary.status : "needs_review", labelOf(offlinePolicyReplayCenterSummary, "Policy Replay Center 仍需复核"), "Policy Replay 不修改配置、不启用 provider。"),
      gate("adapter_boundary_lock", "Adapter Boundary Lock", present(adapterBoundaryLockSummary) ? adapterBoundaryLockSummary.status : "needs_review", labelOf(adapterBoundaryLockSummary, "Adapter 边界锁仍需复核"), "Boundary Verifier 不修改配置。"),
      gate("adapter_boundary_diff_inspector", "Adapter Boundary Diff Inspector", present(adapterBoundaryDiffInspectorSummary) ? adapterBoundaryDiffInspectorSummary.status : "needs_review", labelOf(adapterBoundaryDiffInspectorSummary, "Adapter 边界差异仍需复核"), "Boundary Verifier 不生成 endpoint。"),
      gate("adapter_policy_engine", "Adapter Policy Engine", present(adapterPolicyEngineSummary) ? adapterPolicyEngineSummary.status : "needs_review", labelOf(adapterPolicyEngineSummary, "Adapter 策略仍需复核"), "Boundary Verifier 不启用或禁用 provider。"),
      gate("human_activation_final_dossier", "Human Activation Final Dossier", present(humanActivationFinalDossierSummary) ? humanActivationFinalDossierSummary.status : "needs_review", labelOf(humanActivationFinalDossierSummary, "Final Dossier 仍需复核"), "Final Dossier 不持久化档案。"),
      gate("safety_regression_sentinel", "Flight Workflow Safety Regression Sentinel", present(safetySentinelSummary) ? safetySentinelSummary.status : "needs_review", labelOf(safetySentinelSummary, "Safety Sentinel 仍需复核"), "Boundary Verifier 不读取密钥、不联网。")
    ]);
  }

  function buildGlobalShoppingAdapterLaunchBoundaryVerificationRows(input) {
    const safe = obj(input);
    const gates = toArray(safe.boundaryVerificationGates).length ? toArray(safe.boundaryVerificationGates) : buildGlobalShoppingAdapterLaunchBoundaryVerificationGates(safe);
    return clone([
      row("adapter_launch_boundary_verifier_status", "Adapter Launch Boundary Verifier 状态", obj(safe.userFacingSummary).resultLabel || "Adapter Launch Boundary Verifier 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("adapter_launch_boundary_verifier_boundary", "Boundary Verifier 边界", "该验证器只展示 adapter launch boundary verification，不修改配置、不启用 provider、不生成 endpoint、不读取密钥。", "pass")
    ].concat(gates.map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingAdapterLaunchBoundaryVerifier(input) {
    const safe = obj(input);
    const gates = buildGlobalShoppingAdapterLaunchBoundaryVerificationGates(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedGates = gates.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewGates = gates.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedGates.length ? "blocked" : (needsReviewGates.length ? "needs_review" : "ready");
    const result = {
      verifierName:VERIFIER_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_LAUNCH_BOUNDARY_VERIFIER_VERSION,
      status:status,
      verifierBoundary:{
        verifierId:"global-shopping-adapter-launch-boundary-verifier",
        verifierMode:"verifier_only",
        verifierOnly:true,
        readinessOnly:true,
        offlineOnly:true,
        mockOnly:true,
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
        canWriteFile:false
      },
      verifierSummary:{
        hasPolicyReplayCenter:present(resolveSummary(safe, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter")),
        hasBoundaryLock:present(resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock")),
        hasBoundaryDiffInspector:present(resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector")),
        hasAdapterPolicyEngine:present(resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine")),
        hasFinalDossier:present(resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier")),
        hasSafetySentinel:present(resolveSummary(safe, "safetySentinelSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport")),
        boundaryGateCount:gates.length,
        blockedBoundaryCount:directBlockedReasons.length + blockedGates.length,
        needsReviewBoundaryCount:needsReviewGates.length,
        readyForProviderFinalLaunchReview:status === "ready",
        manualBoundaryVerificationRequired:true
      },
      boundaryVerificationGates:gates,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedGates.map(function (item) { return item.gateId + "_blocked"; })),
      userFacingSummary:{
        title:"Adapter Launch Boundary Verifier",
        resultLabel:status === "ready" ? "Adapter Launch Boundary Verifier 已准备" : (status === "blocked" ? "Adapter Launch Boundary Verifier 已阻断" : "Adapter Launch Boundary Verifier 仍需复核"),
        caveat:"该验证器只展示 adapter launch boundary verification，不修改配置、不启用 provider、不生成 endpoint、不读取密钥。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingAdapterLaunchBoundaryVerificationRows(result);
    return clone(result);
  }

  function buildGlobalShoppingAdapterLaunchBoundaryVerifierAuditDraft(input) {
    const verifier = buildGlobalShoppingAdapterLaunchBoundaryVerifier(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_ADAPTER_LAUNCH_BOUNDARY_VERIFIER_AUDIT_DRAFT",
      verifierName:VERIFIER_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_LAUNCH_BOUNDARY_VERIFIER_VERSION,
      status:verifier.status,
      boundaryGateCount:obj(verifier.verifierSummary).boundaryGateCount || 0,
      blockedBoundaryCount:obj(verifier.verifierSummary).blockedBoundaryCount || 0,
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

  function sanitizeGlobalShoppingAdapterLaunchBoundaryVerifier(verifier) {
    return evaluateGlobalShoppingAdapterLaunchBoundaryVerifier(verifier || {});
  }

  function buildGlobalShoppingAdapterLaunchBoundaryVerifier(input) {
    try {
      return evaluateGlobalShoppingAdapterLaunchBoundaryVerifier(input || {});
    } catch (_) {
      return evaluateGlobalShoppingAdapterLaunchBoundaryVerifier({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingAdapterLaunchBoundaryVerifier = {
    GLOBAL_SHOPPING_ADAPTER_LAUNCH_BOUNDARY_VERIFIER_VERSION,
    VERIFIER_NAME,
    buildGlobalShoppingAdapterLaunchBoundaryVerifier,
    evaluateGlobalShoppingAdapterLaunchBoundaryVerifier,
    buildGlobalShoppingAdapterLaunchBoundaryVerificationRows,
    buildGlobalShoppingAdapterLaunchBoundaryVerificationGates,
    buildGlobalShoppingAdapterLaunchBoundaryVerifierAuditDraft,
    sanitizeGlobalShoppingAdapterLaunchBoundaryVerifier
  };
})();
