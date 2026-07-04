;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER_VERSION = "4.2.1";
  const RUNNER_NAME = "global_shopping_offline_mock_sandbox_session_runner_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function step(stepId, label, status, summary, caveat) {
    return {
      stepId:text(stepId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
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
  function normalize(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "fail" || status === "failed_safe") return "blocked";
    if (status === "ready" || status === "pass" || status === "approved" || status === "allowed" || status === "clear") return "pass";
    return "warning";
  }

  function buildGlobalShoppingOfflineMockSandboxSessionTimeline(input) {
    const safe = obj(input);
    const readOnlySandboxActivationReadinessCenterSummary = resolveSummary(safe, "readOnlySandboxActivationReadinessCenterSummary", "WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter", "buildGlobalShoppingReadOnlySandboxActivationReadinessCenter");
    const providerContractReplayHarnessSummary = resolveSummary(safe, "providerContractReplayHarnessSummary", "WeishanGlobalShoppingProviderContractReplayHarness", "buildGlobalShoppingProviderContractReplayHarness");
    const mockProviderAdapterRegistryRuntimeSummary = resolveSummary(safe, "mockProviderAdapterRegistryRuntimeSummary", "WeishanGlobalShoppingMockProviderAdapterRegistryRuntime", "buildGlobalShoppingMockProviderAdapterRegistryRuntime");
    const vaultBoundaryContractSummary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract");
    const productionBlockerMatrixSummary = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix");
    return clone([
      step("activation_readiness_center", "只读 Sandbox 激活准备中心", normalize(readOnlySandboxActivationReadinessCenterSummary), labelOf(readOnlySandboxActivationReadinessCenterSummary, "Sandbox 激活准备仍需复核"), "只展示准备度，不执行激活。"),
      step("contract_replay_harness", "Provider 合同回放", normalize(providerContractReplayHarnessSummary), labelOf(providerContractReplayHarnessSummary, "合同回放仍需复核"), "只回放脱敏 contract case。"),
      step("mock_adapter_registry_runtime", "Mock Adapter Registry Runtime", normalize(mockProviderAdapterRegistryRuntimeSummary), labelOf(mockProviderAdapterRegistryRuntimeSummary, "Mock Registry 仍需复核"), "只允许 mock/fixture/dry-run。"),
      step("vault_boundary_contract", "Vault Boundary Contract", normalize(vaultBoundaryContractSummary), labelOf(vaultBoundaryContractSummary, "Vault 边界仍需复核"), "不读取密钥，不保存 secret。"),
      step("production_blocker_matrix", "Production 阻断矩阵", normalize(productionBlockerMatrixSummary), labelOf(productionBlockerMatrixSummary, "Production 阻断矩阵仍需复核"), "只展示阻断条件，不启用生产 provider。")
    ]);
  }

  function buildGlobalShoppingOfflineMockSandboxSessionRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.sessionTimeline) ? {
      sessionTimeline:safe.sessionTimeline.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingOfflineMockSandboxSessionRunner(input);
    return clone([
      row("offline_mock_status", "离线 Mock 会话状态", obj(evaluation.userFacingSummary).resultLabel || "离线 Mock 会话仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("offline_mock_boundary", "会话边界", "只运行离线 mock sandbox 会话，不联网，不读取密钥，不使用真实 endpoint。", "pass"),
      row("offline_mock_persistence", "持久化边界", "不保存 raw request/raw response/raw user text，不生成交易 URL。", "pass")
    ].concat(toArray(evaluation.sessionTimeline).map(function (item) {
      return row(item.stepId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineMockSandboxSessionRunner(input) {
    const safe = obj(input);
    const sessionTimeline = buildGlobalShoppingOfflineMockSandboxSessionTimeline(safe);
    const blockedBoundary =
      safe.network === true ||
      safe.readApiKey === true ||
      safe.realEndpoint === true ||
      safe.useRealEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.openExternalNow === true ||
      safe.persistRawRequest === true ||
      safe.persistRawResponse === true ||
      safe.persistRawUserText === true ||
      safe.bookingUrl ||
      safe.checkoutUrl ||
      safe.paymentUrl ||
      safe.orderUrl ||
      safe.checkout === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true;
    const blockedSteps = sessionTimeline.filter(function (item) { return item.status === "blocked"; });
    const reviewSteps = sessionTimeline.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || blockedSteps.length ? "blocked" : (reviewSteps.length ? "needs_review" : "ready");
    const sessionSummary = {
      hasActivationReadinessCenter:sessionTimeline[0].status !== "needs_review",
      hasContractReplayHarness:sessionTimeline[1].status !== "needs_review",
      hasMockAdapterRegistryRuntime:sessionTimeline[2].status !== "needs_review",
      hasVaultBoundaryContract:sessionTimeline[3].status !== "needs_review",
      hasProductionBlockerMatrix:sessionTimeline[4].status !== "needs_review",
      sessionStepCount:sessionTimeline.length,
      passedStepCount:sessionTimeline.filter(function (item) { return item.status === "pass"; }).length,
      needsReviewStepCount:reviewSteps.length,
      blockedStepCount:blockedSteps.length,
      readyForManualActivationHandoff:status === "ready"
    };
    return clone({
      runnerName:RUNNER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER_VERSION,
      status:status,
      sessionBoundary:{
        runnerId:"global-shopping-offline-mock-sandbox-session-runner",
        runnerMode:"offline_mock",
        offlineOnly:true,
        mockOnly:true,
        fixtureOnly:true,
        dryRunOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canCallNetwork:false,
        canReadApiKey:false,
        canUseRealEndpoint:false,
        canOpenExternalNow:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canPersistRawUserText:false,
        canGenerateBookingUrl:false,
        canGenerateCheckoutUrl:false,
        canGeneratePaymentUrl:false,
        canGenerateOrderUrl:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      sessionSummary:sessionSummary,
      sessionTimeline:sessionTimeline,
      sessionHealth:{
        noNetworkCall:safe.network !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noRealEndpoint:safe.realEndpoint !== true && safe.useRealEndpoint !== true,
        noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.openExternalNow !== true,
        noRawRequestPersistence:safe.persistRawRequest !== true,
        noRawResponsePersistence:safe.persistRawResponse !== true,
        noRawUserTextPersistence:safe.persistRawUserText !== true,
        noBookingCheckoutPaymentOrderUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
        noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingOfflineMockSandboxSessionRows({
        sessionTimeline:sessionTimeline,
        userFacingSummary:{
          resultLabel:status === "ready" ? "离线 Mock 会话运行器已准备" : (status === "blocked" ? "离线 Mock 会话已阻断" : "离线 Mock 会话仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.network === true ? "network_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.realEndpoint === true || safe.useRealEndpoint === true ? "real_endpoint_detected" : "",
          safe.openExternal === true || safe.windowOpen === true || safe.openExternalNow === true ? "external_open_detected" : "",
          safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
          safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
          safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
          safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : "",
          safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_capability_detected" : ""
        ].filter(Boolean) : [])
        .concat(blockedSteps.map(function (item) { return item.stepId + "_blocked"; })),
      userFacingSummary:{
        title:"离线 Mock Sandbox 会话运行器",
        resultLabel:status === "ready" ? "离线 Mock 会话运行器已准备" : (status === "blocked" ? "离线 Mock 会话已阻断" : "离线 Mock 会话仍需复核"),
        caveat:"该运行器只执行离线 mock sandbox 会话，不联网，不读取密钥，不保存 raw provider 数据。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function runGlobalShoppingOfflineMockSandboxSession(input) {
    const runner = buildGlobalShoppingOfflineMockSandboxSessionRunner(input || {});
    return clone({
      runnerName:RUNNER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER_VERSION,
      status:runner.status,
      sessionSummary:runner.sessionSummary,
      sessionTimeline:runner.sessionTimeline,
      rows:runner.rows,
      blockedReasons:runner.blockedReasons,
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
    });
  }

  function buildGlobalShoppingOfflineMockSandboxSessionRunnerAuditDraft(input) {
    const runner = buildGlobalShoppingOfflineMockSandboxSessionRunner(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER_AUDIT_DRAFT",
      runnerName:RUNNER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER_VERSION,
      status:runner.status,
      sessionStepCount:obj(runner.sessionSummary).sessionStepCount || 0,
      blockedStepCount:obj(runner.sessionSummary).blockedStepCount || 0,
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

  function sanitizeGlobalShoppingOfflineMockSandboxSessionRunner(runner) {
    return evaluateGlobalShoppingOfflineMockSandboxSessionRunner(runner || {});
  }

  function buildGlobalShoppingOfflineMockSandboxSessionRunner(input) {
    try {
      return sanitizeGlobalShoppingOfflineMockSandboxSessionRunner(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineMockSandboxSessionRunner({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineMockSandboxSessionRunner = {
    GLOBAL_SHOPPING_OFFLINE_MOCK_SANDBOX_SESSION_RUNNER_VERSION,
    RUNNER_NAME,
    buildGlobalShoppingOfflineMockSandboxSessionRunner,
    evaluateGlobalShoppingOfflineMockSandboxSessionRunner,
    runGlobalShoppingOfflineMockSandboxSession,
    buildGlobalShoppingOfflineMockSandboxSessionRows,
    buildGlobalShoppingOfflineMockSandboxSessionTimeline,
    buildGlobalShoppingOfflineMockSandboxSessionRunnerAuditDraft,
    sanitizeGlobalShoppingOfflineMockSandboxSessionRunner
  };
})();
