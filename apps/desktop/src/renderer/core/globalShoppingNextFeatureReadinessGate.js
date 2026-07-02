;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NEXT_FEATURE_READINESS_GATE_VERSION = "4.0.4";
  const GATE_NAME = "global_shopping_next_feature_readiness_gate_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function summaryLabel(summary, fallback) { return text(obj(obj(summary).userFacingSummary).resultLabel || obj(summary).title || fallback || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function recommendation(recommendationId, label, priority, allowedNextStep, reason, caveat) {
    return { recommendationId:text(recommendationId), label:text(label), priority:/^(high|medium|low)$/.test(priority) ? priority : "medium", allowedNextStep:allowedNextStep === true, reason:text(reason), caveat:text(caveat), redacted:true };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
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
    }, obj(overrides));
  }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }

  function evaluateGlobalShoppingNextFeatureReadinessGate(input) {
    const safe = obj(input);
    const readOnlyCommerceSessionRecapCenterSummary = resolveSummary(safe, "readOnlyCommerceSessionRecapCenterSummary", "WeishanGlobalShoppingReadOnlyCommerceSessionRecapCenter", "buildGlobalShoppingReadOnlyCommerceSessionRecapCenter", safe);
    const userTrustClosureSummarySummary = resolveSummary(safe, "userTrustClosureSummarySummary", "WeishanGlobalShoppingUserTrustClosureSummary", "buildGlobalShoppingUserTrustClosureSummary", safe);
    const readOnlySessionClosurePackSummary = resolveSummary(safe, "readOnlySessionClosurePackSummary", "WeishanGlobalShoppingReadOnlySessionClosurePack", "buildGlobalShoppingReadOnlySessionClosurePack", safe);
    const externalPlatformExitRampPreviewSummary = resolveSummary(safe, "externalPlatformExitRampPreviewSummary", "WeishanGlobalShoppingExternalPlatformExitRampPreview", "buildGlobalShoppingExternalPlatformExitRampPreview", safe);
    const finalUserSafetyChecklistSummary = resolveSummary(safe, "finalUserSafetyChecklistSummary", "WeishanGlobalShoppingFinalUserSafetyChecklist", "buildGlobalShoppingFinalUserSafetyChecklist", safe);
    const safetyRegressionSentinelSummary = obj(safe.safetyRegressionSentinelSummary || safe.flightWorkflowSafetyRegressionSentinelSummary || {});
    const blocked =
      safe.startRealProviderIntegration === true || safe.readRealApiKey === true || safe.callNetwork === true ||
      safe.generateEndpoint === true || safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ||
      safe.createProviderTask === true || safe.enableProductionProvider === true || safe.hasForbiddenClaim === true;
    const readinessSummary = {
      hasSessionRecapCenter:Object.keys(obj(readOnlyCommerceSessionRecapCenterSummary)).length > 0,
      hasTrustClosureSummary:Object.keys(obj(userTrustClosureSummarySummary)).length > 0,
      hasSessionClosurePack:Object.keys(obj(readOnlySessionClosurePackSummary)).length > 0,
      hasExitRampPreview:Object.keys(obj(externalPlatformExitRampPreviewSummary)).length > 0,
      hasFinalSafetyChecklist:Object.keys(obj(finalUserSafetyChecklistSummary)).length > 0,
      hasProviderSafetySentinel:Object.keys(safetyRegressionSentinelSummary).length > 0,
      hasCommerceE2EBoundary:safe.hasCommerceE2EBoundary !== false,
      hasSecretPersistenceGuard:safe.hasSecretPersistenceGuard !== false,
      hasNoRealProviderBoundary:safe.hasNoRealProviderBoundary !== false,
      hasNoCheckoutBoundary:safe.hasNoCheckoutBoundary !== false,
      canPrepareReadOnlySandboxProviderNext:statusOf(readOnlyCommerceSessionRecapCenterSummary) === "ready" && statusOf(userTrustClosureSummarySummary) === "ready" && safe.hasNoRealProviderBoundary !== false,
      canPrepareBetaReadOnlyTrialNext:statusOf(readOnlyCommerceSessionRecapCenterSummary) === "ready" && statusOf(userTrustClosureSummarySummary) === "ready" && safe.hasCommerceE2EBoundary !== false,
      shouldContinueTrustCopyPolish:statusOf(userTrustClosureSummarySummary) !== "ready" || statusOf(readOnlyCommerceSessionRecapCenterSummary) !== "ready"
    };
    const readinessHealth = {
      noRealProviderStart:safe.startRealProviderIntegration !== true,
      noApiKeyRead:safe.readRealApiKey !== true,
      noNetworkCall:safe.callNetwork !== true,
      noEndpointGeneration:safe.generateEndpoint !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true,
      noProviderTaskCreation:safe.createProviderTask !== true,
      noProductionProviderEnablement:safe.enableProductionProvider !== true,
      noForbiddenClaims:safe.hasForbiddenClaim !== true
    };
    const needsReview =
      !readinessSummary.hasSessionRecapCenter || !readinessSummary.hasTrustClosureSummary || !readinessSummary.hasSessionClosurePack ||
      !readinessSummary.hasExitRampPreview || !readinessSummary.hasFinalSafetyChecklist || !readinessSummary.hasProviderSafetySentinel ||
      !readinessSummary.hasCommerceE2EBoundary || !readinessSummary.hasSecretPersistenceGuard || !readinessSummary.hasNoRealProviderBoundary ||
      !readinessSummary.hasNoCheckoutBoundary;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      readOnlyCommerceSessionRecapCenterSummary:readOnlyCommerceSessionRecapCenterSummary,
      userTrustClosureSummarySummary:userTrustClosureSummarySummary,
      readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary,
      externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary,
      safetyRegressionSentinelSummary:safetyRegressionSentinelSummary,
      readinessSummary:readinessSummary,
      readinessHealth:readinessHealth,
      blockedReasons:blocked ? [
        safe.startRealProviderIntegration === true ? "real_provider_start_detected" : "",
        safe.readRealApiKey === true ? "api_key_read_detected" : "",
        safe.callNetwork === true ? "network_call_detected" : "",
        safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
        safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ? "external_open_detected" : "",
        safe.createProviderTask === true ? "provider_task_creation_detected" : "",
        safe.enableProductionProvider === true ? "production_provider_enablement_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingNextFeatureReadinessRecommendations(input) {
    const evaluation = evaluateGlobalShoppingNextFeatureReadinessGate(input);
    return clone([
      recommendation("read_only_sandbox_provider_next", "准备真实只读 sandbox provider 接入评估", "high", evaluation.readinessSummary.canPrepareReadOnlySandboxProviderNext, "当前只读复核闭环已形成，可以评估下一阶段的只读 sandbox provider 准备度。", "仅评估准备度，不接真实 provider、不读取密钥、不联网。"),
      recommendation("beta_read_only_trial_next", "准备 Beta 用户只读试用评估", "medium", evaluation.readinessSummary.canPrepareBetaReadOnlyTrialNext, "当会话总结、信任闭环和 E2E 边界都稳定时，可继续评估 Beta 只读试用准备。", "仍不代表交易能力。"),
      recommendation("trust_copy_polish", "继续强化信任说明与边界文案", "low", evaluation.readinessSummary.shouldContinueTrustCopyPolish, "如果用户还不够容易理解当前边界，应优先继续打磨 trust copy。", "不要借此开启真实 provider 接入。")
    ]);
  }

  function buildGlobalShoppingNextFeatureReadinessRows(input) {
    const evaluation = evaluateGlobalShoppingNextFeatureReadinessGate(input);
    return clone([
      row("session_recap_center", "只读会话总结中心", summaryLabel(evaluation.readOnlyCommerceSessionRecapCenterSummary, "会话总结中心仍需复核"), statusOf(evaluation.readOnlyCommerceSessionRecapCenterSummary) === "ready" ? "pass" : "warning"),
      row("trust_closure", "用户信任闭环摘要", summaryLabel(evaluation.userTrustClosureSummarySummary, "信任闭环摘要仍需复核"), statusOf(evaluation.userTrustClosureSummarySummary) === "ready" ? "pass" : "warning"),
      row("session_closure_pack", "只读会话关闭包", summaryLabel(evaluation.readOnlySessionClosurePackSummary, "只读会话关闭包仍需复核"), statusOf(evaluation.readOnlySessionClosurePackSummary) === "ready" ? "pass" : "warning"),
      row("safety_sentinel", "安全回归哨兵", Object.keys(obj(evaluation.safetyRegressionSentinelSummary)).length ? "已接入安全回归哨兵扫描" : "安全回归哨兵仍需复核", Object.keys(obj(evaluation.safetyRegressionSentinelSummary)).length ? "pass" : "warning"),
      row("next_boundary", "下一功能闸门不接真实 provider", "只评估 readiness，不接真实 provider，不读取密钥，不联网", evaluation.readinessHealth.noRealProviderStart && evaluation.readinessHealth.noApiKeyRead && evaluation.readinessHealth.noNetworkCall ? "pass" : "warning"),
      row("human_approval", "下一步仍需人工审批", "即使 readiness 为 ready，下一阶段也仍需人工审批", "pass")
    ]);
  }

  function sanitizeGlobalShoppingNextFeatureReadinessGate(gate) {
    const safe = obj(gate);
    const evaluation = evaluateGlobalShoppingNextFeatureReadinessGate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_NEXT_FEATURE_READINESS_GATE_VERSION,
      status:status,
      readinessBoundary:{
        gateId:text(safe.gateId || "global-shopping-next-feature-readiness-gate"),
        gateMode:/^(disabled|readiness_only|review_only|sandbox_ready)$/.test(text(safe.gateMode)) ? text(safe.gateMode) : "readiness_only",
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canStartRealProviderIntegration:false,
        canReadRealApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canOpenExternalNow:false,
        canCreateProviderTask:false,
        canEnableProductionProvider:false
      },
      readinessSummary:clone(evaluation.readinessSummary),
      recommendations:toArray(safe.recommendations).length ? toArray(safe.recommendations) : buildGlobalShoppingNextFeatureReadinessRecommendations(safe),
      readinessHealth:clone(evaluation.readinessHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingNextFeatureReadinessRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"下一功能准备闸门",
        resultLabel:status === "ready" ? "下一功能准备评估已完成" : (status === "blocked" ? "下一功能准备已阻断" : "下一功能仍需复核"),
        caveat:"该闸门只评估下一阶段准备度，不接真实 provider，不读取密钥，不打开平台，不自动开启下一阶段。",
        redacted:true
      },
      readOnlyCommerceSessionRecapCenterSummary:clone(evaluation.readOnlyCommerceSessionRecapCenterSummary),
      userTrustClosureSummarySummary:clone(evaluation.userTrustClosureSummarySummary),
      readOnlySessionClosurePackSummary:clone(evaluation.readOnlySessionClosurePackSummary),
      externalPlatformExitRampPreviewSummary:clone(evaluation.externalPlatformExitRampPreviewSummary),
      finalUserSafetyChecklistSummary:clone(evaluation.finalUserSafetyChecklistSummary),
      safetyRegressionSentinelSummary:clone(evaluation.safetyRegressionSentinelSummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingNextFeatureReadinessGate(input) {
    try {
      return sanitizeGlobalShoppingNextFeatureReadinessGate(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingNextFeatureReadinessGate({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingNextFeatureReadinessGateAuditDraft(input) {
    const gate = buildGlobalShoppingNextFeatureReadinessGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NEXT_FEATURE_READINESS_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_NEXT_FEATURE_READINESS_GATE_VERSION,
      status:gate.status,
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

  window.WeishanGlobalShoppingNextFeatureReadinessGate = {
    GLOBAL_SHOPPING_NEXT_FEATURE_READINESS_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingNextFeatureReadinessGate,
    evaluateGlobalShoppingNextFeatureReadinessGate,
    buildGlobalShoppingNextFeatureReadinessRows,
    buildGlobalShoppingNextFeatureReadinessRecommendations,
    buildGlobalShoppingNextFeatureReadinessGateAuditDraft,
    sanitizeGlobalShoppingNextFeatureReadinessGate
  };
})();
