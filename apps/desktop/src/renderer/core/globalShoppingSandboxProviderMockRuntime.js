;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_PROVIDER_MOCK_RUNTIME_VERSION = "2.3.3";
  const RUNTIME_NAME = "global_shopping_sandbox_provider_mock_runtime_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
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
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      summary:text(summary),
      caveat:text(caveat),
      futureOnly:true,
      readOnly:true,
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

  function evaluateGlobalShoppingSandboxProviderMockRuntime(input) {
    const safe = obj(input);
    const providerLegalReviewDossierSummary = resolveSummary(safe, "providerLegalReviewDossierSummary", "WeishanGlobalShoppingProviderLegalReviewDossier", "buildGlobalShoppingProviderLegalReviewDossier", safe);
    const credentialVaultInterfaceStubSummary = resolveSummary(safe, "credentialVaultInterfaceStubSummary", "WeishanGlobalShoppingCredentialVaultInterfaceStub", "buildGlobalShoppingCredentialVaultInterfaceStub", safe);
    const sandboxAdapterContractTestbedSummary = resolveSummary(safe, "sandboxAdapterContractTestbedSummary", "WeishanGlobalShoppingSandboxAdapterContractTestbed", "buildGlobalShoppingSandboxAdapterContractTestbed", safe);
    const providerIntegrationPrepViewModelSummary = resolveSummary(safe, "providerIntegrationPrepViewModelSummary", "WeishanGlobalShoppingProviderIntegrationPrepViewModel", "buildGlobalShoppingProviderIntegrationPrepViewModel", safe);
    const credentialIsolationReadinessBoardSummary = resolveSummary(safe, "credentialIsolationReadinessBoardSummary", "WeishanGlobalShoppingCredentialIsolationReadinessBoard", "buildGlobalShoppingCredentialIsolationReadinessBoard", safe);
    const providerContractSelectionBoardSummary = resolveSummary(safe, "providerContractSelectionBoardSummary", "WeishanGlobalShoppingProviderContractSelectionBoard", "buildGlobalShoppingProviderContractSelectionBoard", safe);

    const blocked =
      statusOf(providerLegalReviewDossierSummary) === "blocked" ||
      statusOf(credentialVaultInterfaceStubSummary) === "blocked" ||
      statusOf(sandboxAdapterContractTestbedSummary) === "blocked" ||
      statusOf(providerIntegrationPrepViewModelSummary) === "blocked" ||
      statusOf(credentialIsolationReadinessBoardSummary) === "blocked" ||
      statusOf(providerContractSelectionBoardSummary) === "blocked" ||
      safe.realProvider === true ||
      safe.noRealProvider === false ||
      safe.network === true ||
      safe.noNetwork === false ||
      safe.readRealApiKey === true ||
      safe.readApiKey === true ||
      safe.realEndpoint === true ||
      safe.generateEndpoint === true ||
      safe.rawResponseStored === true ||
      safe.rawRequestStored === true ||
      safe.noRawResponsePersistence === false ||
      safe.noRawRequestPersistence === false ||
      safe.secretRisk === true ||
      safe.noSecretRisk === false ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.externalOpen === true ||
      safe.noExternalOpen === false ||
      safe.transactionUrl === true ||
      safe.noTransactionUrl === false ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.payment === true ||
      safe.noPayment === false ||
      safe.order === true ||
      safe.noOrder === false ||
      safe.ticketing === true ||
      safe.noTicketing === false ||
      safe.startRealIntegration === true;

    const runtimeHealth = {
      hasProviderLegalReviewDossier:Object.keys(providerLegalReviewDossierSummary).length > 0,
      hasCredentialVaultInterfaceStub:Object.keys(credentialVaultInterfaceStubSummary).length > 0,
      hasSandboxAdapterContractTestbed:Object.keys(sandboxAdapterContractTestbedSummary).length > 0,
      hasProviderIntegrationPrepViewModel:Object.keys(providerIntegrationPrepViewModelSummary).length > 0,
      hasCredentialIsolationReadinessBoard:Object.keys(credentialIsolationReadinessBoardSummary).length > 0,
      hasProviderContractSelectionBoard:Object.keys(providerContractSelectionBoardSummary).length > 0,
      noRealProvider:safe.noRealProvider !== false && safe.realProvider !== true,
      noNetwork:safe.noNetwork !== false && safe.network !== true,
      noKeyRead:safe.readRealApiKey !== true && safe.readApiKey !== true,
      noEndpoint:safe.realEndpoint !== true && safe.generateEndpoint !== true,
      noRawPersistence:safe.rawResponseStored !== true && safe.rawRequestStored !== true && safe.noRawResponsePersistence !== false && safe.noRawRequestPersistence !== false,
      noSecretRisk:safe.secretRisk !== true && safe.noSecretRisk !== false,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.externalOpen !== true && safe.noExternalOpen !== false,
      noTransactionUrl:safe.transactionUrl !== true && safe.noTransactionUrl !== false && !(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noPayment:safe.payment !== true && safe.noPayment !== false,
      noOrder:safe.order !== true && safe.noOrder !== false,
      noTicketing:safe.ticketing !== true && safe.noTicketing !== false
    };

    const needsReview =
      !runtimeHealth.hasProviderLegalReviewDossier ||
      !runtimeHealth.hasCredentialVaultInterfaceStub ||
      !runtimeHealth.hasSandboxAdapterContractTestbed ||
      !runtimeHealth.hasProviderIntegrationPrepViewModel ||
      !runtimeHealth.hasCredentialIsolationReadinessBoard ||
      !runtimeHealth.hasProviderContractSelectionBoard;

    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      runtimeHealth:runtimeHealth,
      providerLegalReviewDossierSummary:providerLegalReviewDossierSummary,
      credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary,
      sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary,
      providerIntegrationPrepViewModelSummary:providerIntegrationPrepViewModelSummary,
      credentialIsolationReadinessBoardSummary:credentialIsolationReadinessBoardSummary,
      providerContractSelectionBoardSummary:providerContractSelectionBoardSummary,
      safeToProceedWithMockAdapterRuntimeHardening:!blocked && !needsReview,
      blockedReasons:blocked ? [
        safe.realProvider === true || safe.noRealProvider === false ? "real_provider_detected" : "",
        safe.network === true || safe.noNetwork === false ? "network_detected" : "",
        safe.readRealApiKey === true || safe.readApiKey === true ? "api_key_read_detected" : "",
        safe.realEndpoint === true || safe.generateEndpoint === true ? "endpoint_detected" : "",
        safe.rawResponseStored === true || safe.rawRequestStored === true || safe.noRawResponsePersistence === false || safe.noRawRequestPersistence === false ? "raw_persistence_detected" : "",
        safe.secretRisk === true || safe.noSecretRisk === false ? "secret_risk_detected" : "",
        safe.openExternal === true || safe.windowOpen === true || safe.externalOpen === true || safe.noExternalOpen === false ? "external_open_detected" : "",
        safe.transactionUrl === true || safe.noTransactionUrl === false || safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : "",
        safe.payment === true || safe.noPayment === false ? "payment_detected" : "",
        safe.order === true || safe.noOrder === false ? "order_detected" : "",
        safe.ticketing === true || safe.noTicketing === false ? "ticketing_detected" : "",
        safe.startRealIntegration === true ? "real_integration_start_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxProviderMockRuntimeLifecycle(input) {
    const evaluation = evaluateGlobalShoppingSandboxProviderMockRuntime(input);
    return clone([
      stage("legal_and_boundary_inputs", "上游法务与边界输入", evaluation.runtimeHealth.hasProviderLegalReviewDossier && evaluation.runtimeHealth.hasCredentialIsolationReadinessBoard && evaluation.runtimeHealth.hasProviderContractSelectionBoard ? "pass" : "needs_review", "依赖法务档案、凭证隔离和 Provider 合同边界。", "缺少任一上游输入时仅允许 needs_review。"),
      stage("contract_prep", "合同与接口准备", evaluation.runtimeHealth.hasCredentialVaultInterfaceStub && evaluation.runtimeHealth.hasSandboxAdapterContractTestbed ? "pass" : "needs_review", "依赖凭证接口桩和 Adapter 合同测试台。", "当前不读取密钥，不接真实 endpoint。"),
      stage("mock_runtime_prep", "Mock Runtime 准备", evaluation.runtimeHealth.hasProviderIntegrationPrepViewModel ? "pass" : "needs_review", "依赖 Provider 接入前准备视图。", "当前只允许只读 mock runtime 规划。"),
      stage("mock_runtime_boundary", "Mock Runtime 安全边界", evaluation.status === "blocked" ? "blocked" : "pass", "Mock Runtime 不接真实 provider，不联网，不读 key，不生成 endpoint。", "任何真实 provider / network / endpoint / raw persistence 都必须 blocked。"),
      stage("manual_review_gate", "人工审批前置门", evaluation.safeToProceedWithMockAdapterRuntimeHardening ? "pass" : "needs_review", "只有在所有上游 summary 齐全且红线通过时，才可进入下一步人工审批准备。", "ready 也不代表可以启用真实 provider。")
    ]);
  }

  function buildGlobalShoppingSandboxProviderMockRuntimeRows(input) {
    const evaluation = evaluateGlobalShoppingSandboxProviderMockRuntime(input);
    return clone(buildGlobalShoppingSandboxProviderMockRuntimeLifecycle(input).map(function (item) {
      return row(item.stageId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    }).concat([
      row("provider_legal_review", "Provider 法务审查档案", summaryLabel(evaluation.providerLegalReviewDossierSummary, "法务审查仍需复核"), evaluation.runtimeHealth.hasProviderLegalReviewDossier ? "pass" : "warning"),
      row("credential_vault_stub", "凭证保险箱接口桩", summaryLabel(evaluation.credentialVaultInterfaceStubSummary, "凭证接口桩仍需复核"), evaluation.runtimeHealth.hasCredentialVaultInterfaceStub ? "pass" : "warning"),
      row("adapter_contract", "Sandbox Adapter 合同测试台", summaryLabel(evaluation.sandboxAdapterContractTestbedSummary, "Adapter 合同测试仍需复核"), evaluation.runtimeHealth.hasSandboxAdapterContractTestbed ? "pass" : "warning"),
      row("provider_prep_view", "Provider 接入前准备", summaryLabel(evaluation.providerIntegrationPrepViewModelSummary, "Provider 接入前准备仍需复核"), evaluation.runtimeHealth.hasProviderIntegrationPrepViewModel ? "pass" : "warning"),
      row("runtime_boundary", "Mock Runtime 安全边界", "不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider", evaluation.status === "blocked" ? "blocked" : "pass")
    ]));
  }

  function runGlobalShoppingSandboxProviderMockRuntimeDryRun(input) {
    const runtime = buildGlobalShoppingSandboxProviderMockRuntime(input || {});
    return clone({
      runtimeName:RUNTIME_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_MOCK_RUNTIME_VERSION,
      status:runtime.status,
      safeToProceedWithMockAdapterRuntimeHardening:runtime.safeToProceedWithMockAdapterRuntimeHardening === true,
      lifecycle:runtime.lifecycle,
      rows:runtime.rows,
      blockedReasons:runtime.blockedReasons,
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

  function buildGlobalShoppingSandboxProviderMockRuntimeAuditDraft(input) {
    const runtime = buildGlobalShoppingSandboxProviderMockRuntime(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_PROVIDER_MOCK_RUNTIME_AUDIT_DRAFT",
      runtimeName:RUNTIME_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_MOCK_RUNTIME_VERSION,
      status:runtime.status,
      safeToProceedWithMockAdapterRuntimeHardening:runtime.safeToProceedWithMockAdapterRuntimeHardening === true,
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

  function sanitizeGlobalShoppingSandboxProviderMockRuntime(runtime) {
    const safe = obj(runtime);
    const evaluation = evaluateGlobalShoppingSandboxProviderMockRuntime(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      runtimeName:RUNTIME_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_PROVIDER_MOCK_RUNTIME_VERSION,
      status:status,
      title:"Sandbox Provider Mock Runtime",
      runtimeBoundary:{
        runtimeId:text(safe.runtimeId || "global-shopping-sandbox-provider-mock-runtime"),
        runtimeMode:/^(disabled|planning_only|mock_runtime|review_only)$/.test(text(safe.runtimeMode)) ? text(safe.runtimeMode) : "planning_only",
        readOnly:true,
        planningOnly:true,
        sandboxOnly:true,
        mockOnly:true,
        productionDisabled:true,
        canReadApiKey:false,
        canCallNetwork:false,
        canUseRealEndpoint:false,
        canOpenExternalNow:false,
        canGenerateTransactionUrl:false,
        canCreateOrder:false,
        canPay:false,
        canTicket:false
      },
      runtimeHealth:clone(evaluation.runtimeHealth),
      lifecycle:toArray(safe.lifecycle).length ? toArray(safe.lifecycle) : buildGlobalShoppingSandboxProviderMockRuntimeLifecycle(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingSandboxProviderMockRuntimeRows(safe),
      safeToProceedWithMockAdapterRuntimeHardening:evaluation.safeToProceedWithMockAdapterRuntimeHardening,
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      providerLegalReviewDossierSummary:clone(evaluation.providerLegalReviewDossierSummary),
      credentialVaultInterfaceStubSummary:clone(evaluation.credentialVaultInterfaceStubSummary),
      sandboxAdapterContractTestbedSummary:clone(evaluation.sandboxAdapterContractTestbedSummary),
      providerIntegrationPrepViewModelSummary:clone(evaluation.providerIntegrationPrepViewModelSummary),
      credentialIsolationReadinessBoardSummary:clone(evaluation.credentialIsolationReadinessBoardSummary),
      providerContractSelectionBoardSummary:clone(evaluation.providerContractSelectionBoardSummary),
      userFacingSummary:{
        title:"Sandbox Provider Mock Runtime",
        resultLabel:status === "ready" ? "Sandbox Provider Mock Runtime 已准备" : (status === "blocked" ? "Sandbox Provider Mock Runtime 已阻断" : "Sandbox Provider Mock Runtime 仍需复核"),
        caveat:"当前只展示 provider mock runtime 准备，不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingSandboxProviderMockRuntime(input) {
    try {
      return sanitizeGlobalShoppingSandboxProviderMockRuntime(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingSandboxProviderMockRuntime({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSandboxProviderMockRuntime = {
    GLOBAL_SHOPPING_SANDBOX_PROVIDER_MOCK_RUNTIME_VERSION,
    RUNTIME_NAME,
    buildGlobalShoppingSandboxProviderMockRuntime,
    evaluateGlobalShoppingSandboxProviderMockRuntime,
    runGlobalShoppingSandboxProviderMockRuntimeDryRun,
    buildGlobalShoppingSandboxProviderMockRuntimeRows,
    buildGlobalShoppingSandboxProviderMockRuntimeLifecycle,
    buildGlobalShoppingSandboxProviderMockRuntimeAuditDraft,
    sanitizeGlobalShoppingSandboxProviderMockRuntime
  };
})();
