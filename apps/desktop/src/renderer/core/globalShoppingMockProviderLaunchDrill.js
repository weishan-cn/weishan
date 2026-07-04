;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL_VERSION = "4.2.6";
  const DRILL_NAME = "global_shopping_mock_provider_launch_drill_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function step(stepId, label, status, summary, caveat) {
    return { stepId:text(stepId), label:text(label), status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review", summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false, download:false, realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false,
      rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false, redacted:true
    }, obj(overrides));
  }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }

  function buildGlobalShoppingMockProviderLaunchDrillTimeline(input) {
    const safe = obj(input);
    const registry = obj(safe.mockProviderAdapterRegistryRuntimeSummary);
    const replay = obj(safe.providerContractReplayHarnessSummary);
    const launch = obj(safe.providerLaunchReadinessBoardSummary);
    const approval = obj(safe.humanApprovalSimulationGateSummary);
    return clone([
      step("mock_adapter_registry", "Mock Adapter 注册", Object.keys(registry).length ? (statusOf(registry) === "ready" ? "pass" : statusOf(registry) === "blocked" ? "blocked" : "needs_review") : "needs_review", obj(obj(registry).userFacingSummary).resultLabel || "Mock Adapter 注册仍需复核", "只允许 mock / fixture / dry_run / contract_only。"),
      step("contract_replay", "合同回放", Object.keys(replay).length ? (statusOf(replay) === "ready" ? "pass" : statusOf(replay) === "blocked" ? "blocked" : "needs_review") : "needs_review", obj(obj(replay).userFacingSummary).resultLabel || "合同回放仍需复核", "只回放脱敏 contract case。"),
      step("launch_readiness", "启动准备", Object.keys(launch).length ? (statusOf(launch) === "ready" ? "pass" : statusOf(launch) === "blocked" ? "blocked" : "needs_review") : "needs_review", obj(obj(launch).userFacingSummary).resultLabel || "启动准备仍需复核", "不启动真实 provider。"),
      step("human_approval_simulation", "人工审批模拟", Object.keys(approval).length ? (statusOf(approval) === "ready" ? "pass" : statusOf(approval) === "blocked" ? "blocked" : "needs_review") : "needs_review", obj(obj(approval).userFacingSummary).resultLabel || "审批模拟仍需复核", "模拟不代表真实审批完成。")
    ]);
  }

  function evaluateGlobalShoppingMockProviderLaunchDrill(input) {
    const safe = obj(input);
    const mockProviderAdapterRegistryRuntimeSummary = resolveSummary(safe, "mockProviderAdapterRegistryRuntimeSummary", "WeishanGlobalShoppingMockProviderAdapterRegistryRuntime", "buildGlobalShoppingMockProviderAdapterRegistryRuntime", safe);
    const providerContractReplayHarnessSummary = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness", safe);
    const providerLaunchReadinessBoardSummary = resolveSummary(safe, "providerLaunchReadinessBoardSummary", "WeishanGlobalShoppingProviderLaunchReadinessBoard", "buildGlobalShoppingProviderLaunchReadinessBoard", safe);
    const humanApprovalSimulationGateSummary = resolveSummary(safe, "humanApprovalSimulationGateSummary", "WeishanGlobalShoppingHumanApprovalSimulationGate", "buildGlobalShoppingHumanApprovalSimulationGate", safe);
    const drillTimeline = buildGlobalShoppingMockProviderLaunchDrillTimeline({
      mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary,
      providerContractReplayHarnessSummary:providerContractReplayHarnessSummary,
      providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary,
      humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary
    });
    const blocked =
      statusOf(mockProviderAdapterRegistryRuntimeSummary) === "blocked" ||
      statusOf(providerContractReplayHarnessSummary) === "blocked" ||
      statusOf(providerLaunchReadinessBoardSummary) === "blocked" ||
      statusOf(humanApprovalSimulationGateSummary) === "blocked" ||
      safe.startRealProvider === true ||
      safe.enableProvider === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.generateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.persistLaunchState === true ||
      safe.checkout === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const drillHealth = {
      noRealProviderStart:safe.startRealProvider !== true,
      noProviderEnablement:safe.enableProvider !== true,
      noApiKeyRead:safe.readApiKey !== true,
      noNetworkCall:safe.network !== true,
      noEndpointGeneration:safe.generateEndpoint !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true,
      noLaunchStatePersistence:safe.persistLaunchState !== true,
      noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true && !(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const drillSummary = {
      hasMockAdapterRegistryRuntime:Object.keys(mockProviderAdapterRegistryRuntimeSummary).length > 0,
      hasContractReplayHarness:Object.keys(providerContractReplayHarnessSummary).length > 0,
      hasLaunchReadinessBoard:Object.keys(providerLaunchReadinessBoardSummary).length > 0,
      hasHumanApprovalSimulationGate:Object.keys(humanApprovalSimulationGateSummary).length > 0,
      drillStepCount:drillTimeline.length,
      passedDrillStepCount:drillTimeline.filter(function (item) { return item.status === "pass"; }).length,
      needsReviewDrillStepCount:drillTimeline.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; }).length,
      blockedDrillStepCount:drillTimeline.filter(function (item) { return item.status === "blocked"; }).length,
      readyForRollbackPlanReview:false
    };
    drillSummary.readyForRollbackPlanReview =
      drillSummary.hasMockAdapterRegistryRuntime &&
      drillSummary.hasContractReplayHarness &&
      drillSummary.hasLaunchReadinessBoard &&
      drillSummary.hasHumanApprovalSimulationGate &&
      drillSummary.blockedDrillStepCount === 0 &&
      drillSummary.needsReviewDrillStepCount === 0;
    const needsReview =
      !drillSummary.hasMockAdapterRegistryRuntime ||
      !drillSummary.hasContractReplayHarness ||
      !drillSummary.hasLaunchReadinessBoard ||
      !drillSummary.hasHumanApprovalSimulationGate ||
      drillSummary.needsReviewDrillStepCount > 0;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      mockProviderAdapterRegistryRuntimeSummary:clone(mockProviderAdapterRegistryRuntimeSummary),
      providerContractReplayHarnessSummary:clone(providerContractReplayHarnessSummary),
      providerLaunchReadinessBoardSummary:clone(providerLaunchReadinessBoardSummary),
      humanApprovalSimulationGateSummary:clone(humanApprovalSimulationGateSummary),
      drillSummary:drillSummary,
      drillTimeline:drillTimeline,
      drillHealth:drillHealth,
      blockedReasons:blocked ? [
        !drillHealth.noRealProviderStart ? "real_provider_start_detected" : "",
        !drillHealth.noProviderEnablement ? "provider_enablement_detected" : "",
        !drillHealth.noApiKeyRead ? "api_key_read_detected" : "",
        !drillHealth.noNetworkCall ? "network_detected" : "",
        !drillHealth.noEndpointGeneration ? "endpoint_generation_detected" : "",
        !drillHealth.noExternalOpen ? "external_open_detected" : "",
        !drillHealth.noLaunchStatePersistence ? "launch_state_persistence_detected" : "",
        !drillHealth.noCheckoutPaymentTicketingOrder ? "transaction_capability_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingMockProviderLaunchDrillRows(input) {
    const evaluation = evaluateGlobalShoppingMockProviderLaunchDrill(input);
    return clone(evaluation.drillTimeline.map(function (item) {
      return row(item.stepId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("mock_launch_boundary", "Mock 启动边界", "该演练只模拟 provider 启动流程，不启动真实 provider，不读取密钥，不联网，不生成 endpoint。", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function runGlobalShoppingMockProviderLaunchDrill(input) {
    const drill = buildGlobalShoppingMockProviderLaunchDrill(input || {});
    return clone({
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL_VERSION,
      status:drill.status,
      drillSummary:drill.drillSummary,
      drillTimeline:drill.drillTimeline,
      rows:drill.rows,
      blockedReasons:drill.blockedReasons,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }

  function buildGlobalShoppingMockProviderLaunchDrillAuditDraft(input) {
    const drill = buildGlobalShoppingMockProviderLaunchDrill(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL_AUDIT_DRAFT",
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL_VERSION,
      status:drill.status,
      drillStepCount:obj(drill.drillSummary).drillStepCount || 0,
      blockedDrillStepCount:obj(drill.drillSummary).blockedDrillStepCount || 0,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false,
      fileWrite:false, download:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true
    });
  }

  function sanitizeGlobalShoppingMockProviderLaunchDrill(drill) {
    const safe = obj(drill);
    const evaluation = evaluateGlobalShoppingMockProviderLaunchDrill(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      drillName:DRILL_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL_VERSION,
      status:status,
      drillBoundary:{
        drillId:text(safe.drillId || "global-shopping-mock-provider-launch-drill"),
        drillMode:/^(disabled|mock|dry_run|contract_only)$/.test(text(safe.drillMode)) ? text(safe.drillMode) : "dry_run",
        mockOnly:true, dryRunOnly:true, contractOnly:true, readOnly:true, sandboxOnly:true, redactedOnly:true, productionDisabled:true,
        canStartRealProvider:false, canEnableProvider:false, canReadApiKey:false, canCallNetwork:false, canGenerateEndpoint:false,
        canOpenExternalNow:false, canPersistLaunchState:false, canCheckout:false, canPay:false, canTicket:false, canCreateOrder:false
      },
      drillSummary:clone(evaluation.drillSummary),
      drillTimeline:clone(evaluation.drillTimeline),
      drillHealth:clone(evaluation.drillHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingMockProviderLaunchDrillRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Mock Provider 启动演练",
        resultLabel:status === "ready" ? "Mock 启动演练已准备" : (status === "blocked" ? "Mock 启动演练已阻断" : "Mock 启动演练仍需复核"),
        caveat:"该演练只模拟 provider 启动流程，不启动真实 provider，不读取密钥，不联网，不生成 endpoint。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingMockProviderLaunchDrill(input) {
    try {
      return sanitizeGlobalShoppingMockProviderLaunchDrill(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingMockProviderLaunchDrill({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingMockProviderLaunchDrill = {
    GLOBAL_SHOPPING_MOCK_PROVIDER_LAUNCH_DRILL_VERSION,
    DRILL_NAME,
    buildGlobalShoppingMockProviderLaunchDrill,
    evaluateGlobalShoppingMockProviderLaunchDrill,
    runGlobalShoppingMockProviderLaunchDrill,
    buildGlobalShoppingMockProviderLaunchDrillRows,
    buildGlobalShoppingMockProviderLaunchDrillTimeline,
    buildGlobalShoppingMockProviderLaunchDrillAuditDraft,
    sanitizeGlobalShoppingMockProviderLaunchDrill
  };
})();
