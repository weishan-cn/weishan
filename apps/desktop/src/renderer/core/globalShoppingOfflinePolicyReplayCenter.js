;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_POLICY_REPLAY_CENTER_VERSION = "4.2.5";
  const CENTER_NAME = "global_shopping_offline_policy_replay_center_v1";

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
  function replayCase(caseId, label, status, summary, caveat) {
    return { caseId:text(caseId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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

  function buildGlobalShoppingOfflinePolicyReplayCases(input) {
    const safe = obj(input);
    const providerLaunchAuditSnapshotSummary = resolveSummary(safe, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot");
    const adapterPolicyEngineSummary = resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine");
    const adapterSecurityRegressionGuardSummary = resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard");
    const adapterBoundaryDiffInspectorSummary = resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector");
    const safetySentinelSummary = resolveSummary(safe, "safetySentinelSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport");
    return clone([
      replayCase("launch_audit_snapshot", "Provider Launch Audit Snapshot", present(providerLaunchAuditSnapshotSummary) ? providerLaunchAuditSnapshotSummary.status : "needs_review", labelOf(providerLaunchAuditSnapshotSummary, "Launch Audit Snapshot 仍需复核"), "Launch Audit 不写文件、不保存真实决策。"),
      replayCase("adapter_policy_engine", "Adapter Policy Engine", present(adapterPolicyEngineSummary) ? adapterPolicyEngineSummary.status : "needs_review", labelOf(adapterPolicyEngineSummary, "Adapter 策略仍需复核"), "Policy Replay 不修改配置、不启用 provider。"),
      replayCase("adapter_security_regression_guard", "Adapter Security Regression Guard", present(adapterSecurityRegressionGuardSummary) ? adapterSecurityRegressionGuardSummary.status : "needs_review", labelOf(adapterSecurityRegressionGuardSummary, "Adapter 安全回归仍需复核"), "Replay 不读取密钥、不联网。"),
      replayCase("adapter_boundary_diff_inspector", "Adapter Boundary Diff Inspector", present(adapterBoundaryDiffInspectorSummary) ? adapterBoundaryDiffInspectorSummary.status : "needs_review", labelOf(adapterBoundaryDiffInspectorSummary, "Adapter 边界差异仍需复核"), "Boundary Verifier 不生成 endpoint。"),
      replayCase("safety_regression_sentinel", "Flight Workflow Safety Regression Sentinel", present(safetySentinelSummary) ? safetySentinelSummary.status : "needs_review", labelOf(safetySentinelSummary, "Safety Sentinel 仍需复核"), "Replay 不保存 raw request 或 raw response。")
    ]);
  }

  function buildGlobalShoppingOfflinePolicyReplayRows(input) {
    const safe = obj(input);
    const replayCases = toArray(safe.replayCases).length ? toArray(safe.replayCases) : buildGlobalShoppingOfflinePolicyReplayCases(safe);
    return clone([
      row("offline_policy_replay_center_status", "Offline Policy Replay Center 状态", obj(safe.userFacingSummary).resultLabel || "Offline Policy Replay Center 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_policy_replay_center_boundary", "Policy Replay 边界", "该回放中心只回放离线 policy，不修改配置，不启用 provider，不读取密钥，不写文件。", "pass")
    ].concat(replayCases.map(function (item) {
      return row(item.caseId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function runGlobalShoppingOfflinePolicyReplay(input) {
    return evaluateGlobalShoppingOfflinePolicyReplayCenter(input || {});
  }

  function evaluateGlobalShoppingOfflinePolicyReplayCenter(input) {
    const safe = obj(input);
    const replayCases = buildGlobalShoppingOfflinePolicyReplayCases(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedCases = replayCases.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewCases = replayCases.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedCases.length ? "blocked" : (needsReviewCases.length ? "needs_review" : "ready");
    const result = {
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_POLICY_REPLAY_CENTER_VERSION,
      status:status,
      replayBoundary:{
        centerId:"global-shopping-offline-policy-replay-center",
        replayMode:"replay_only",
        replayOnly:true,
        offlineOnly:true,
        mockOnly:true,
        dryRunOnly:true,
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
      replaySummary:{
        hasLaunchAuditSnapshot:present(resolveSummary(safe, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot")),
        hasAdapterPolicyEngine:present(resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine")),
        hasSecurityRegressionGuard:present(resolveSummary(safe, "adapterSecurityRegressionGuardSummary", "WeishanGlobalShoppingAdapterSecurityRegressionGuard", "buildGlobalShoppingAdapterSecurityRegressionGuard")),
        hasBoundaryDiffInspector:present(resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector")),
        hasSafetySentinel:present(resolveSummary(safe, "safetySentinelSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport")),
        replayCaseCount:replayCases.length,
        blockedReplayCount:directBlockedReasons.length + blockedCases.length,
        needsReviewReplayCount:needsReviewCases.length,
        readyForHumanActivationFinalDossier:status === "ready",
        humanPolicyReplayReviewRequired:true
      },
      replayCases:replayCases,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedCases.map(function (item) { return item.caseId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Policy Replay Center",
        resultLabel:status === "ready" ? "Offline Policy Replay Center 已准备" : (status === "blocked" ? "Offline Policy Replay Center 已阻断" : "Offline Policy Replay Center 仍需复核"),
        caveat:"该回放中心只回放离线 policy，不修改配置，不启用 provider，不读取密钥，不写文件。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflinePolicyReplayRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflinePolicyReplayCenterAuditDraft(input) {
    const center = buildGlobalShoppingOfflinePolicyReplayCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_POLICY_REPLAY_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_POLICY_REPLAY_CENTER_VERSION,
      status:center.status,
      replayCaseCount:obj(center.replaySummary).replayCaseCount || 0,
      blockedReplayCount:obj(center.replaySummary).blockedReplayCount || 0,
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

  function sanitizeGlobalShoppingOfflinePolicyReplayCenter(center) {
    return evaluateGlobalShoppingOfflinePolicyReplayCenter(center || {});
  }

  function buildGlobalShoppingOfflinePolicyReplayCenter(input) {
    try {
      return evaluateGlobalShoppingOfflinePolicyReplayCenter(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflinePolicyReplayCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflinePolicyReplayCenter = {
    GLOBAL_SHOPPING_OFFLINE_POLICY_REPLAY_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingOfflinePolicyReplayCenter,
    evaluateGlobalShoppingOfflinePolicyReplayCenter,
    runGlobalShoppingOfflinePolicyReplay,
    buildGlobalShoppingOfflinePolicyReplayRows,
    buildGlobalShoppingOfflinePolicyReplayCases,
    buildGlobalShoppingOfflinePolicyReplayCenterAuditDraft,
    sanitizeGlobalShoppingOfflinePolicyReplayCenter
  };
})();
