;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_SANDBOX_PROVIDER_INTEGRATION_BLUEPRINT_VERSION = "2.3.1";
  const BLUEPRINT_NAME = "global_shopping_read_only_sandbox_provider_integration_blueprint_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function summaryLabel(summary, fallback) {
    return text(obj(obj(summary).userFacingSummary).resultLabel || obj(summary).title || fallback || "");
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function stage(stageId, label, status, summary, caveat) {
    return {
      stageId:text(stageId),
      label:text(label),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      requiredBeforeRealSandbox:true,
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
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

  function evaluateGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint(input) {
    const safe = obj(input);
    const nextFeatureReadinessGateSummary = resolveSummary(safe, "nextFeatureReadinessGateSummary", "WeishanGlobalShoppingNextFeatureReadinessGate", "buildGlobalShoppingNextFeatureReadinessGate", safe);
    const commerceSessionRecapViewModelSummary = resolveSummary(safe, "commerceSessionRecapViewModelSummary", "WeishanGlobalShoppingCommerceSessionRecapViewModel", "buildGlobalShoppingCommerceSessionRecapViewModel", safe);
    const userTrustClosureSummarySummary = resolveSummary(safe, "userTrustClosureSummarySummary", "WeishanGlobalShoppingUserTrustClosureSummary", "buildGlobalShoppingUserTrustClosureSummary", safe);
    const safetyRegressionSentinelSummary = obj(safe.safetyRegressionSentinelSummary || safe.flightWorkflowSafetyRegressionSentinelSummary || {});
    const providerAdapterRegistrySummary = resolveSummary(safe, "providerAdapterRegistrySummary", "WeishanGlobalShoppingProviderAdapterRegistry", "buildGlobalShoppingProviderAdapterRegistry", safe);
    const firstSandboxProviderConnectorSummary = resolveSummary(safe, "firstSandboxProviderConnectorSummary", "WeishanGlobalShoppingFirstSandboxProviderConnector", "buildGlobalShoppingFirstSandboxProviderConnector", safe);
    const providerSandboxDryRunHarnessSummary = resolveSummary(safe, "providerSandboxDryRunHarnessSummary", "WeishanGlobalShoppingProviderSandboxDryRunHarness", "buildGlobalShoppingProviderSandboxDryRunHarness", safe);
    const providerSandboxSafetyKillSwitchSummary = resolveSummary(safe, "providerSandboxSafetyKillSwitchSummary", "WeishanGlobalShoppingProviderSandboxSafetyKillSwitch", "buildGlobalShoppingProviderSandboxSafetyKillSwitch", safe);
    const providerCredentialSafetySummary = resolveSummary(safe, "providerCredentialSafetySummary", "WeishanGlobalShoppingProviderCredentialSafetyReview", "buildGlobalShoppingProviderCredentialSafetyReview", safe);
    const readOnlySessionClosurePackSummary = resolveSummary(safe, "readOnlySessionClosurePackSummary", "WeishanGlobalShoppingReadOnlySessionClosurePack", "buildGlobalShoppingReadOnlySessionClosurePack", safe);
    const jumpToPlatformBoundarySummary = resolveSummary(safe, "jumpToPlatformBoundarySummary", "WeishanGlobalShoppingJumpToPlatformBoundary", "buildGlobalShoppingJumpToPlatformBoundary", safe);

    const blueprintSummary = {
      hasNextFeatureReadinessGate:Object.keys(obj(nextFeatureReadinessGateSummary)).length > 0,
      hasCommerceSessionRecap:Object.keys(obj(commerceSessionRecapViewModelSummary)).length > 0,
      hasTrustClosure:Object.keys(obj(userTrustClosureSummarySummary)).length > 0,
      hasProviderSafetySentinel:Object.keys(safetyRegressionSentinelSummary).length > 0,
      hasAdapterRegistry:Object.keys(obj(providerAdapterRegistrySummary)).length > 0,
      hasSandboxConnector:Object.keys(obj(firstSandboxProviderConnectorSummary)).length > 0,
      hasDryRunHarness:Object.keys(obj(providerSandboxDryRunHarnessSummary)).length > 0,
      hasKillSwitch:Object.keys(obj(providerSandboxSafetyKillSwitchSummary)).length > 0,
      hasCredentialSafety:Object.keys(obj(providerCredentialSafetySummary)).length > 0,
      hasNoCheckoutBoundary:Object.keys(obj(readOnlySessionClosurePackSummary)).length > 0,
      hasNoRealProviderBoundary:Object.keys(obj(jumpToPlatformBoundarySummary)).length > 0,
      stageCount:7,
      blockedRiskCount:0,
      manualApprovalRequired:true
    };

    const blocked =
      safe.startIntegrationNow === true ||
      safe.canStartIntegrationNow === true ||
      safe.readApiKey === true ||
      safe.canReadApiKey === true ||
      safe.callNetwork === true ||
      safe.canCallNetwork === true ||
      safe.generateEndpoint === true ||
      safe.canGenerateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.canOpenExternalNow === true ||
      safe.enableProductionProvider === true ||
      safe.canEnableProductionProvider === true ||
      safe.createOrder === true ||
      safe.authorizePayment === true ||
      safe.hasForbiddenClaim === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;

    blueprintSummary.blockedRiskCount = blocked ? 1 : 0;

    const blueprintHealth = {
      noIntegrationStart:safe.startIntegrationNow !== true && safe.canStartIntegrationNow !== true,
      noApiKeyRead:safe.readApiKey !== true && safe.canReadApiKey !== true,
      noNetworkCall:safe.callNetwork !== true && safe.canCallNetwork !== true,
      noEndpointGeneration:safe.generateEndpoint !== true && safe.canGenerateEndpoint !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.canOpenExternalNow !== true,
      noProductionProviderEnablement:safe.enableProductionProvider !== true && safe.canEnableProductionProvider !== true,
      noCheckoutPaymentTicketingOrder:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safe.createOrder === true || safe.authorizePayment === true),
      manualApprovalRequired:true,
      noForbiddenClaims:safe.hasForbiddenClaim !== true
    };

    const needsReview =
      !blueprintSummary.hasNextFeatureReadinessGate ||
      !blueprintSummary.hasCommerceSessionRecap ||
      !blueprintSummary.hasTrustClosure ||
      !blueprintSummary.hasProviderSafetySentinel ||
      !blueprintSummary.hasAdapterRegistry ||
      !blueprintSummary.hasSandboxConnector ||
      !blueprintSummary.hasDryRunHarness ||
      !blueprintSummary.hasKillSwitch ||
      !blueprintSummary.hasCredentialSafety ||
      !blueprintSummary.hasNoCheckoutBoundary ||
      !blueprintSummary.hasNoRealProviderBoundary;

    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary,
      commerceSessionRecapViewModelSummary:commerceSessionRecapViewModelSummary,
      userTrustClosureSummarySummary:userTrustClosureSummarySummary,
      safetyRegressionSentinelSummary:safetyRegressionSentinelSummary,
      providerAdapterRegistrySummary:providerAdapterRegistrySummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary,
      jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary,
      blueprintSummary:blueprintSummary,
      blueprintHealth:blueprintHealth,
      blockedReasons:blocked ? [
        safe.startIntegrationNow === true || safe.canStartIntegrationNow === true ? "integration_start_detected" : "",
        safe.readApiKey === true || safe.canReadApiKey === true ? "api_key_read_detected" : "",
        safe.callNetwork === true || safe.canCallNetwork === true ? "network_call_detected" : "",
        safe.generateEndpoint === true || safe.canGenerateEndpoint === true ? "endpoint_generation_detected" : "",
        safe.openExternal === true || safe.windowOpen === true || safe.canOpenExternalNow === true ? "external_open_detected" : "",
        safe.enableProductionProvider === true || safe.canEnableProductionProvider === true ? "production_provider_enablement_detected" : "",
        safe.createOrder === true || safe.authorizePayment === true ? "transaction_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintStages(input) {
    const evaluation = evaluateGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint(input);
    return clone([
      stage("session_recap", "会话总结与信任闭环", statusOf(evaluation.commerceSessionRecapViewModelSummary) === "ready" && statusOf(evaluation.userTrustClosureSummarySummary) === "ready" ? "pass" : "warning", "先确认只读会话总结、信任闭环和下一功能准备已经形成稳定边界。", "该阶段只用于规划，不代表接入开始。"),
      stage("safety_sentinel", "安全回归与边界确认", Object.keys(obj(evaluation.safetyRegressionSentinelSummary)).length ? "pass" : "warning", "必须保留 no real provider / no network / no checkout 的只读红线。", "安全哨兵未接入前不得进入真实 sandbox 准备。"),
      stage("adapter_registry", "Adapter 注册与 Provider 选择", statusOf(evaluation.providerAdapterRegistrySummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.providerAdapterRegistrySummary, "Adapter 注册表仍需复核"), "注册表存在不代表已经接入 provider。"),
      stage("connector_shell", "Sandbox Connector 与 Dry-Run 外壳", statusOf(evaluation.firstSandboxProviderConnectorSummary) === "ready" && statusOf(evaluation.providerSandboxDryRunHarnessSummary) === "ready" ? "pass" : "warning", "只允许准备 connector 外壳和 dry-run 结构，不发送真实请求。", "不读取密钥，不联网，不生成 endpoint。"),
      stage("kill_switch", "安全熔断与审计", statusOf(evaluation.providerSandboxSafetyKillSwitchSummary) === "ready" || statusOf(evaluation.providerSandboxSafetyKillSwitchSummary) === "clear" ? "pass" : "warning", summaryLabel(evaluation.providerSandboxSafetyKillSwitchSummary, "安全熔断器仍需复核"), "必须能够在真实 sandbox 前保持 production disabled。"),
      stage("credential_safety", "凭证隔离与安全存储前置条件", statusOf(evaluation.providerCredentialSafetySummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.providerCredentialSafetySummary, "凭证安全仍需复核"), "当前不读取、不输入、不保存任何真实 provider 密钥。"),
      stage("handoff_boundary", "无交易 / 无跳转 / 无真实 provider 边界", statusOf(evaluation.readOnlySessionClosurePackSummary) === "ready" && statusOf(evaluation.jumpToPlatformBoundarySummary) === "ready" ? "pass" : "warning", "接入蓝图阶段仍必须保持 no checkout / no payment / no provider enablement。", "只输出规划蓝图，不开放任何真实动作。")
    ]);
  }

  function buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintRows(input) {
    const evaluation = evaluateGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint(input);
    return buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintStages(input).map(function (item) {
      return row(item.stageId, item.label, item.summary, item.status);
    }).concat([
      row("blueprint_result", "只读 Sandbox Provider 接入蓝图", statusOf(evaluation) === "ready" ? "接入蓝图已准备" : "接入蓝图仍需复核", evaluation.status === "blocked" ? "blocked" : (evaluation.status === "ready" ? "pass" : "warning")),
      row("blueprint_boundary", "接入蓝图不启动真实接入", "不接真实 provider，不读取密钥，不联网，不打开平台，不启用 production provider", evaluation.blueprintHealth.noIntegrationStart && evaluation.blueprintHealth.noApiKeyRead && evaluation.blueprintHealth.noNetworkCall ? "pass" : "warning")
    ]);
  }

  function buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintAuditDraft(input) {
    const blueprint = buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_SANDBOX_PROVIDER_INTEGRATION_BLUEPRINT_AUDIT_DRAFT",
      blueprintName:BLUEPRINT_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SANDBOX_PROVIDER_INTEGRATION_BLUEPRINT_VERSION,
      status:blueprint.status,
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

  function sanitizeGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint(blueprint) {
    const safe = obj(blueprint);
    const evaluation = evaluateGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      blueprintName:BLUEPRINT_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SANDBOX_PROVIDER_INTEGRATION_BLUEPRINT_VERSION,
      status:status,
      blueprintBoundary:{
        blueprintId:text(safe.blueprintId || "global-shopping-read-only-sandbox-provider-integration-blueprint"),
        blueprintMode:/^(disabled|planning_only|readiness_only|sandbox_ready)$/.test(text(safe.blueprintMode)) ? text(safe.blueprintMode) : "planning_only",
        planningOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canStartIntegrationNow:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canOpenExternalNow:false,
        canEnableProductionProvider:false,
        canCreateOrder:false,
        canAuthorizePayment:false
      },
      blueprintSummary:clone(evaluation.blueprintSummary),
      blueprintStages:toArray(safe.blueprintStages).length ? toArray(safe.blueprintStages) : buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintStages(safe),
      blueprintHealth:clone(evaluation.blueprintHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"只读 Sandbox Provider 接入蓝图",
        resultLabel:status === "ready" ? "接入蓝图已准备" : (status === "blocked" ? "接入蓝图已阻断" : "接入蓝图仍需复核"),
        caveat:"该蓝图只用于规划下一阶段，不接真实 provider，不读取密钥，不联网，不打开平台，不自动开启接入。",
        redacted:true
      },
      nextFeatureReadinessGateSummary:clone(evaluation.nextFeatureReadinessGateSummary),
      commerceSessionRecapViewModelSummary:clone(evaluation.commerceSessionRecapViewModelSummary),
      userTrustClosureSummarySummary:clone(evaluation.userTrustClosureSummarySummary),
      safetyRegressionSentinelSummary:clone(evaluation.safetyRegressionSentinelSummary),
      providerAdapterRegistrySummary:clone(evaluation.providerAdapterRegistrySummary),
      firstSandboxProviderConnectorSummary:clone(evaluation.firstSandboxProviderConnectorSummary),
      providerSandboxDryRunHarnessSummary:clone(evaluation.providerSandboxDryRunHarnessSummary),
      providerSandboxSafetyKillSwitchSummary:clone(evaluation.providerSandboxSafetyKillSwitchSummary),
      providerCredentialSafetySummary:clone(evaluation.providerCredentialSafetySummary),
      readOnlySessionClosurePackSummary:clone(evaluation.readOnlySessionClosurePackSummary),
      jumpToPlatformBoundarySummary:clone(evaluation.jumpToPlatformBoundarySummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint(input) {
    try {
      return sanitizeGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint = {
    GLOBAL_SHOPPING_READ_ONLY_SANDBOX_PROVIDER_INTEGRATION_BLUEPRINT_VERSION,
    BLUEPRINT_NAME,
    buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint,
    evaluateGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint,
    buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintRows,
    buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintStages,
    buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprintAuditDraft,
    sanitizeGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint
  };
})();
