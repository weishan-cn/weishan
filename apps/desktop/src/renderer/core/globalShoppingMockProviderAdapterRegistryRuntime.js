;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MOCK_PROVIDER_ADAPTER_REGISTRY_RUNTIME_VERSION = "4.2.5";
  const RUNTIME_NAME = "global_shopping_mock_provider_adapter_registry_runtime_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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

  function normalizeProviderType(value) {
    return /^(fixture|official_candidate|authorized_candidate|partner_candidate|affiliate_candidate|aggregator_candidate|unknown)$/.test(text(value))
      ? text(value)
      : "unknown";
  }
  function normalizeAdapterMode(value) {
    return /^(disabled|mock|fixture|dry_run|contract_only)$/.test(text(value))
      ? text(value)
      : "disabled";
  }

  function normalizeMockAdapters(input) {
    const provided = toArray(obj(input).mockAdapters);
    const defaults = provided.length ? provided : [
      { adapterId:"fixture_registry_adapter", providerType:"fixture", adapterMode:"fixture", status:"registered", caveat:"Fixture adapter 仅用于脱敏 contract/fixture 验证。" },
      { adapterId:"official_candidate_mock_adapter", providerType:"official_candidate", adapterMode:"contract_only", status:"needs_review", caveat:"官方候选 adapter 仅保留合同能力，不代表已接入。" },
      { adapterId:"authorized_candidate_dry_run_adapter", providerType:"authorized_candidate", adapterMode:"dry_run", status:"registered", caveat:"Dry-run adapter 只消费脱敏输入，不调用真实 provider。" }
    ];
    return defaults.map(function (item, index) {
      const safe = obj(item);
      const hasRealEndpoint = safe.hasRealEndpoint === true || safe.realEndpoint === true;
      const hasApiKey = safe.hasApiKey === true || safe.apiKey === true || safe.readApiKey === true;
      const canCallNetwork = safe.canCallNetwork === true || safe.network === true;
      const canOpenExternalNow = safe.canOpenExternalNow === true || safe.openExternal === true || safe.windowOpen === true;
      const canCheckout = safe.canCheckout === true || safe.checkout === true;
      const canPay = safe.canPay === true || safe.payment === true;
      const canTicket = safe.canTicket === true || safe.ticketing === true;
      const canCreateOrder = safe.canCreateOrder === true || safe.order === true;
      const blocked = hasRealEndpoint || hasApiKey || canCallNetwork || canOpenExternalNow || canCheckout || canPay || canTicket || canCreateOrder || safe.realProvider === true;
      const mode = normalizeAdapterMode(safe.adapterMode);
      return {
        adapterId:text(safe.adapterId || ("mock_adapter_" + index)),
        providerType:normalizeProviderType(safe.providerType),
        adapterMode:mode,
        status:blocked ? "blocked" : (/^(registered|needs_review|blocked)$/.test(text(safe.status)) ? text(safe.status) : (mode === "disabled" ? "needs_review" : "registered")),
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        hasRealEndpoint:false,
        hasApiKey:false,
        canCallNetwork:false,
        canOpenExternalNow:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        caveat:text(safe.caveat || "该 adapter 仅允许 mock/fixture/dry-run/contract-only 运行。"),
        redacted:true
      };
    });
  }

  function buildGlobalShoppingMockProviderAdapterBlockedCapabilityRows(input) {
    const safe = obj(input);
    return clone([
      row("no_real_provider_registration", "禁止真实 provider 注册", safe.realProvider === true || safe.canRegisterRealProvider === true ? "检测到真实 provider 注册请求" : "Registry 不接真实 provider", safe.realProvider === true || safe.canRegisterRealProvider === true ? "blocked" : "pass"),
      row("no_real_endpoint_registration", "禁止真实 endpoint 注册", safe.realEndpoint === true || safe.canRegisterRealEndpoint === true ? "检测到真实 endpoint 注册请求" : "Registry 不注册真实 endpoint", safe.realEndpoint === true || safe.canRegisterRealEndpoint === true ? "blocked" : "pass"),
      row("no_api_key_registration", "禁止 API key 注册", safe.apiKey === true || safe.readApiKey === true || safe.canRegisterApiKey === true ? "检测到 API key 注册请求" : "Registry 不读取或注册真实密钥", safe.apiKey === true || safe.readApiKey === true || safe.canRegisterApiKey === true ? "blocked" : "pass"),
      row("no_network_call", "禁止联网", safe.network === true || safe.canCallNetwork === true ? "检测到网络请求" : "Registry runtime 不联网", safe.network === true || safe.canCallNetwork === true ? "blocked" : "pass"),
      row("no_external_open", "禁止打开外部平台", safe.openExternal === true || safe.windowOpen === true || safe.canOpenExternalNow === true ? "检测到外部打开" : "Registry runtime 不打开平台", safe.openExternal === true || safe.windowOpen === true || safe.canOpenExternalNow === true ? "blocked" : "pass"),
      row("no_transaction_capability", "禁止交易能力", safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "检测到交易动作" : "Registry runtime 不提供 checkout/payment/order/ticketing", safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "blocked" : "pass")
    ]);
  }

  function evaluateGlobalShoppingMockProviderAdapterRegistryRuntime(input) {
    const safe = obj(input);
    const sandboxProviderMockRuntimeSummary = resolveSummary(safe, "sandboxProviderMockRuntimeSummary", "WeishanGlobalShoppingSandboxProviderMockRuntime", "buildGlobalShoppingSandboxProviderMockRuntime", safe);
    const sandboxAdapterContractTestbedSummary = resolveSummary(safe, "sandboxAdapterContractTestbedSummary", "WeishanGlobalShoppingSandboxAdapterContractTestbed", "buildGlobalShoppingSandboxAdapterContractTestbed", safe);
    const providerMockRuntimeViewModelSummary = resolveSummary(safe, "providerMockRuntimeViewModelSummary", "WeishanGlobalShoppingProviderMockRuntimeViewModel", "buildGlobalShoppingProviderMockRuntimeViewModel", safe);
    const mockAdapters = normalizeMockAdapters(safe);
    const adapterBlockedCount = mockAdapters.filter(function (item) { return item.status === "blocked"; }).length;
    const blockedCapabilityRows = buildGlobalShoppingMockProviderAdapterBlockedCapabilityRows(safe);
    const blockedCapabilityCount = blockedCapabilityRows.filter(function (item) { return item.status === "blocked"; }).length;
    const blocked =
      statusOf(sandboxProviderMockRuntimeSummary) === "blocked" ||
      statusOf(sandboxAdapterContractTestbedSummary) === "blocked" ||
      statusOf(providerMockRuntimeViewModelSummary) === "blocked" ||
      safe.realProvider === true ||
      safe.canRegisterRealProvider === true ||
      safe.realEndpoint === true ||
      safe.canRegisterRealEndpoint === true ||
      safe.apiKey === true ||
      safe.readApiKey === true ||
      safe.canRegisterApiKey === true ||
      safe.network === true ||
      safe.canCallNetwork === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.canOpenExternalNow === true ||
      safe.enableProductionProvider === true ||
      safe.canEnableProductionProvider === true ||
      safe.checkout === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      adapterBlockedCount > 0 ||
      blockedCapabilityCount > 0;

    const runtimeHealth = {
      noRealProviderRegistration:safe.realProvider !== true && safe.canRegisterRealProvider !== true,
      noRealEndpointRegistration:safe.realEndpoint !== true && safe.canRegisterRealEndpoint !== true,
      noApiKeyRegistration:safe.apiKey !== true && safe.readApiKey !== true && safe.canRegisterApiKey !== true,
      noNetworkCall:safe.network !== true && safe.canCallNetwork !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.canOpenExternalNow !== true,
      noProductionProviderEnablement:safe.enableProductionProvider !== true && safe.canEnableProductionProvider !== true,
      noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true && !(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noForbiddenClaims:text(safe.forbiddenClaim || "") === ""
    };
    const summary = {
      hasSandboxProviderMockRuntime:Object.keys(sandboxProviderMockRuntimeSummary).length > 0,
      hasAdapterContractTestbed:Object.keys(sandboxAdapterContractTestbedSummary).length > 0,
      hasProviderMockRuntimeViewModel:Object.keys(providerMockRuntimeViewModelSummary).length > 0,
      registeredMockAdapterCount:mockAdapters.filter(function (item) { return item.status === "registered"; }).length,
      contractPassingAdapterCount:mockAdapters.filter(function (item) { return item.status !== "blocked" && /^(fixture|dry_run|contract_only|mock)$/.test(item.adapterMode); }).length,
      blockedAdapterCount:adapterBlockedCount,
      blockedCapabilityCount:blockedCapabilityCount,
      readyForContractReplay:false
    };
    summary.readyForContractReplay =
      summary.hasSandboxProviderMockRuntime &&
      summary.hasAdapterContractTestbed &&
      summary.hasProviderMockRuntimeViewModel &&
      summary.blockedAdapterCount === 0 &&
      summary.blockedCapabilityCount === 0;

    const needsReview =
      !summary.hasSandboxProviderMockRuntime ||
      !summary.hasAdapterContractTestbed ||
      !summary.hasProviderMockRuntimeViewModel;

    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      sandboxProviderMockRuntimeSummary:clone(sandboxProviderMockRuntimeSummary),
      sandboxAdapterContractTestbedSummary:clone(sandboxAdapterContractTestbedSummary),
      providerMockRuntimeViewModelSummary:clone(providerMockRuntimeViewModelSummary),
      registryRuntimeSummary:summary,
      mockAdapters:mockAdapters,
      runtimeHealth:runtimeHealth,
      blockedCapabilityRows:blockedCapabilityRows,
      blockedReasons:blocked ? [
        !runtimeHealth.noRealProviderRegistration ? "real_provider_registration_detected" : "",
        !runtimeHealth.noRealEndpointRegistration ? "real_endpoint_registration_detected" : "",
        !runtimeHealth.noApiKeyRegistration ? "api_key_registration_detected" : "",
        !runtimeHealth.noNetworkCall ? "network_detected" : "",
        !runtimeHealth.noExternalOpen ? "external_open_detected" : "",
        !runtimeHealth.noProductionProviderEnablement ? "production_provider_enablement_detected" : "",
        !runtimeHealth.noCheckoutPaymentTicketingOrder ? "transaction_capability_detected" : "",
        adapterBlockedCount > 0 ? "blocked_mock_adapter_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingMockProviderAdapterRows(input) {
    const evaluation = evaluateGlobalShoppingMockProviderAdapterRegistryRuntime(input);
    const rows = [
      row("sandbox_provider_mock_runtime", "Sandbox Provider Mock Runtime", obj(obj(evaluation.sandboxProviderMockRuntimeSummary).userFacingSummary).resultLabel || "Sandbox Provider Mock Runtime 仍需复核", evaluation.registryRuntimeSummary.hasSandboxProviderMockRuntime ? "pass" : "warning"),
      row("sandbox_adapter_contract_testbed", "Sandbox Adapter 合同测试台", obj(obj(evaluation.sandboxAdapterContractTestbedSummary).userFacingSummary).resultLabel || "Adapter 合同测试台仍需复核", evaluation.registryRuntimeSummary.hasAdapterContractTestbed ? "pass" : "warning"),
      row("provider_mock_runtime_view_model", "Provider Mock Runtime 与审批准备", obj(evaluation.providerMockRuntimeViewModelSummary).title || "Provider Mock Runtime 与审批准备", evaluation.registryRuntimeSummary.hasProviderMockRuntimeViewModel ? "pass" : "warning")
    ];
    return clone(rows.concat(evaluation.mockAdapters.map(function (item) {
      return row("mock_adapter_" + item.adapterId, "Mock Adapter · " + item.adapterId, item.caveat, item.status === "blocked" ? "blocked" : (item.status === "registered" ? "pass" : "warning"));
    })).concat(evaluation.blockedCapabilityRows));
  }

  function buildGlobalShoppingMockProviderAdapterRegistryRuntimeAuditDraft(input) {
    const runtime = buildGlobalShoppingMockProviderAdapterRegistryRuntime(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MOCK_PROVIDER_ADAPTER_REGISTRY_RUNTIME_AUDIT_DRAFT",
      runtimeName:RUNTIME_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_ADAPTER_REGISTRY_RUNTIME_VERSION,
      status:runtime.status,
      registeredMockAdapterCount:obj(runtime.registryRuntimeSummary).registeredMockAdapterCount || 0,
      blockedAdapterCount:obj(runtime.registryRuntimeSummary).blockedAdapterCount || 0,
      blockedCapabilityCount:obj(runtime.registryRuntimeSummary).blockedCapabilityCount || 0,
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

  function sanitizeGlobalShoppingMockProviderAdapterRegistryRuntime(runtime) {
    const safe = obj(runtime);
    const evaluation = evaluateGlobalShoppingMockProviderAdapterRegistryRuntime(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      runtimeName:RUNTIME_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_PROVIDER_ADAPTER_REGISTRY_RUNTIME_VERSION,
      status:status,
      registryRuntimeBoundary:{
        runtimeId:text(safe.runtimeId || "global-shopping-mock-provider-adapter-registry-runtime"),
        runtimeMode:/^(disabled|mock|fixture|dry_run|contract_only)$/.test(text(safe.runtimeMode)) ? text(safe.runtimeMode) : "contract_only",
        mockOnly:true,
        fixtureOnly:true,
        dryRunOnly:true,
        contractOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canRegisterRealProvider:false,
        canRegisterRealEndpoint:false,
        canRegisterApiKey:false,
        canCallNetwork:false,
        canOpenExternalNow:false,
        canEnableProductionProvider:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      registryRuntimeSummary:clone(evaluation.registryRuntimeSummary),
      mockAdapters:clone(evaluation.mockAdapters),
      runtimeHealth:clone(evaluation.runtimeHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingMockProviderAdapterRows(safe),
      blockedCapabilityRows:toArray(safe.blockedCapabilityRows).length ? toArray(safe.blockedCapabilityRows) : evaluation.blockedCapabilityRows,
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Mock Provider Adapter 注册运行时",
        resultLabel:status === "ready" ? "Mock Adapter 注册运行时已准备" : (status === "blocked" ? "Mock Adapter 注册已阻断" : "Mock Adapter 注册仍需复核"),
        caveat:"该运行时只注册 mock/fixture/dry-run adapter，不接真实 provider，不读取密钥，不联网，不打开平台。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingMockProviderAdapterRegistryRuntime(input) {
    try {
      return sanitizeGlobalShoppingMockProviderAdapterRegistryRuntime(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingMockProviderAdapterRegistryRuntime({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingMockProviderAdapterRegistryRuntime = {
    GLOBAL_SHOPPING_MOCK_PROVIDER_ADAPTER_REGISTRY_RUNTIME_VERSION,
    RUNTIME_NAME,
    buildGlobalShoppingMockProviderAdapterRegistryRuntime,
    evaluateGlobalShoppingMockProviderAdapterRegistryRuntime,
    buildGlobalShoppingMockProviderAdapterRows,
    buildGlobalShoppingMockProviderAdapterBlockedCapabilityRows,
    buildGlobalShoppingMockProviderAdapterRegistryRuntimeAuditDraft,
    sanitizeGlobalShoppingMockProviderAdapterRegistryRuntime
  };
})();
