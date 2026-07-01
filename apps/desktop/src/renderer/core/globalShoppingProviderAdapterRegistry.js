;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VERSION = "3.4.0";
  const REGISTRY_NAME = "global_shopping_provider_adapter_registry_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function allowedRegistryMode(value) {
    const mode = text(value || "disabled");
    return /^(disabled|fixture|dry_run|sandbox_ready)$/.test(mode) ? mode : "";
  }
  function allowedProviderType(value) {
    const type = text(value || "unknown");
    return /^(official|authorized|partner|affiliate|aggregator|fixture|unknown)$/.test(type) ? type : "unknown";
  }
  function allowedAdapterMode(value) {
    const mode = text(value || "disabled");
    return /^(disabled|fixture|dry_run|sandbox_ready)$/.test(mode) ? mode : "";
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
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

  function registerGlobalShoppingProviderAdapter(input) {
    const safe = obj(input);
    const adapterMode = allowedAdapterMode(safe.adapterMode);
    const adapter = {
      adapterId:text(safe.adapterId || safe.providerId || "adapter"),
      providerId:text(safe.providerId || ""),
      providerName:text(safe.providerName || ""),
      providerType:allowedProviderType(safe.providerType),
      adapterMode:adapterMode,
      status:"registered",
      readOnly:safe.readOnly !== false,
      sandboxOnly:safe.sandboxOnly !== false,
      productionDisabled:safe.productionDisabled !== false,
      hasRealEndpoint:safe.hasRealEndpoint === true || safe.realEndpointEnabled === true,
      hasRealApiKey:safe.hasRealApiKey === true || safe.realApiKeyDetected === true,
      hasProviderSdk:safe.hasProviderSdk === true || safe.providerSdkEnabled === true,
      canCallNetwork:safe.canCallNetwork === true || safe.networkEnabled === true,
      canFetchLivePrice:safe.canFetchLivePrice === true || safe.liveFetchEnabled === true,
      canCheckout:safe.canCheckout === true || safe.checkout === true,
      canPay:safe.canPay === true || safe.payment === true,
      canTicket:safe.canTicket === true || safe.ticketing === true,
      redactedOutputOnly:safe.redactedOutputOnly !== false,
      canOpenExternalNow:safe.canOpenExternalNow === true || safe.openExternal === true || safe.windowOpen === true
    };
    if (!adapter.adapterMode || !adapter.providerId || adapter.readOnly !== true || adapter.sandboxOnly !== true || adapter.productionDisabled !== true || adapter.redactedOutputOnly !== true) {
      adapter.status = "needs_review";
    }
    if (adapter.hasRealEndpoint || adapter.hasRealApiKey || adapter.hasProviderSdk || adapter.canCallNetwork || adapter.canFetchLivePrice || adapter.canCheckout || adapter.canPay || adapter.canTicket || adapter.canOpenExternalNow) {
      adapter.status = "blocked";
    }
    return clone(adapter);
  }

  function evaluateGlobalShoppingProviderAdapterRegistry(input) {
    const safe = obj(input);
    const registryMode = allowedRegistryMode(safe.registryMode || safe.providerSandboxDryRunHarness && safe.providerSandboxDryRunHarness.dryRunLifecycle && safe.providerSandboxDryRunHarness.dryRunLifecycle.dryRunMode || "disabled");
    const adapters = toArray(safe.adapterShells).map(registerGlobalShoppingProviderAdapter);
    const blockedReasons = [];
    if (!registryMode) blockedReasons.push("invalid_registry_mode");
    adapters.forEach(function (adapter) {
      if (adapter.status === "blocked") blockedReasons.push("blocked_adapter_" + text(adapter.adapterId || adapter.providerId || "adapter"));
      if (adapter.hasRealEndpoint) blockedReasons.push("real_endpoint_detected");
      if (adapter.hasRealApiKey) blockedReasons.push("real_api_key_detected");
      if (adapter.hasProviderSdk) blockedReasons.push("provider_sdk_detected");
      if (adapter.canCallNetwork || adapter.canFetchLivePrice) blockedReasons.push("network_detected");
      if (adapter.canCheckout || adapter.canPay || adapter.canTicket) blockedReasons.push("transaction_capability_detected");
      if (adapter.canOpenExternalNow) blockedReasons.push("external_open_detected");
    });
    const registryHealth = {
      hasAdapters:adapters.length > 0,
      hasReadOnlyBoundary:adapters.length > 0 && adapters.every(function (adapter) { return adapter.readOnly === true && adapter.sandboxOnly === true && adapter.productionDisabled === true; }),
      noProductionAdapter:adapters.every(function (adapter) { return adapter.productionDisabled === true; }),
      noRealEndpoint:adapters.every(function (adapter) { return adapter.hasRealEndpoint === false; }),
      noRealApiKey:adapters.every(function (adapter) { return adapter.hasRealApiKey === false; }),
      noProviderSdk:adapters.every(function (adapter) { return adapter.hasProviderSdk === false; }),
      noNetwork:adapters.every(function (adapter) { return adapter.canCallNetwork === false && adapter.canFetchLivePrice === false; }),
      noCheckout:adapters.every(function (adapter) { return adapter.canCheckout === false; }),
      noPayment:adapters.every(function (adapter) { return adapter.canPay === false; }),
      noTicketing:adapters.every(function (adapter) { return adapter.canTicket === false; }),
      noExternalOpen:adapters.every(function (adapter) { return adapter.canOpenExternalNow === false; })
    };
    const blocked = blockedReasons.length > 0 || !registryHealth.noProductionAdapter || !registryHealth.noRealEndpoint || !registryHealth.noRealApiKey || !registryHealth.noProviderSdk || !registryHealth.noNetwork || !registryHealth.noCheckout || !registryHealth.noPayment || !registryHealth.noTicketing || !registryHealth.noExternalOpen;
    const needsReview = !blocked && (!registryHealth.hasAdapters || !registryHealth.hasReadOnlyBoundary || adapters.some(function (adapter) { return adapter.status === "needs_review"; }));
    return clone({
      registryBoundary:{
        registryMode:registryMode || "disabled",
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canRegisterProductionAdapter:false,
        canRegisterRealEndpoint:false,
        canRegisterRealApiKey:false,
        canRegisterProviderSdk:false,
        canRegisterCheckoutCapability:false,
        canRegisterPaymentCapability:false,
        canRegisterTicketingCapability:false,
        canCallNetwork:false,
        canOpenExternalNow:false
      },
      adapters:adapters,
      registryHealth:registryHealth,
      blockedReasons:blockedReasons,
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderAdapterRegistryRows(input) {
    const evaluation = evaluateGlobalShoppingProviderAdapterRegistry(input || {});
    const boundary = evaluation.registryBoundary;
    const health = evaluation.registryHealth;
    return clone([
      row("registry_mode", "注册表模式", boundary.registryMode ? "仅允许 disabled / fixture / dry_run / sandbox_ready" : "已阻断", boundary.registryMode ? "pass" : "blocked"),
      row("adapter_count", "Adapter 数量", health.hasAdapters ? "已登记只读 adapter" : "仍需复核", health.hasAdapters ? "pass" : "warning"),
      row("read_only_boundary", "只读边界", health.hasReadOnlyBoundary ? "只允许只读 adapter 注册" : "仍需复核", health.hasReadOnlyBoundary ? "pass" : "warning"),
      row("production_boundary", "Production 边界", health.noProductionAdapter && health.noRealEndpoint && health.noRealApiKey && health.noProviderSdk ? "不包含真实 endpoint、真实密钥或 SDK" : "已阻断", health.noProductionAdapter && health.noRealEndpoint && health.noRealApiKey && health.noProviderSdk ? "pass" : "blocked"),
      row("network_boundary", "网络边界", health.noNetwork && health.noExternalOpen ? "不请求真实网络，不打开外部平台" : "已阻断", health.noNetwork && health.noExternalOpen ? "pass" : "blocked"),
      row("transaction_boundary", "交易边界", health.noCheckout && health.noPayment && health.noTicketing ? "不付款、不下单、不出票" : "已阻断", health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked")
    ]);
  }

  function sanitizeGlobalShoppingProviderAdapterRegistry(registry) {
    const safe = obj(registry);
    const evaluation = evaluateGlobalShoppingProviderAdapterRegistry(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VERSION,
      status:status,
      registryBoundary:clone(evaluation.registryBoundary),
      adapters:clone(evaluation.adapters),
      registryHealth:clone(evaluation.registryHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderAdapterRegistryRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"Provider Adapter 注册表",
        resultLabel:status === "ready" ? "Adapter 注册表已准备" : (status === "needs_review" ? "Adapter 注册表仍需复核" : "Adapter 注册表已阻断"),
        caveat:"当前注册表只允许只读 fixture/dry-run/sandbox adapter，不包含真实 endpoint、真实密钥、真实网络调用或下单能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderAdapterRegistry(input) {
    try {
      return sanitizeGlobalShoppingProviderAdapterRegistry(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderAdapterRegistry({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingProviderAdapterRegistryAuditDraft(input) {
    const registry = buildGlobalShoppingProviderAdapterRegistry(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_AUDIT_DRAFT",
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VERSION,
      status:registry.status,
      adapterCount:registry.adapters.length,
      blockedReasons:registry.blockedReasons,
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

  window.WeishanGlobalShoppingProviderAdapterRegistry = {
    GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VERSION,
    REGISTRY_NAME,
    buildGlobalShoppingProviderAdapterRegistry,
    registerGlobalShoppingProviderAdapter,
    evaluateGlobalShoppingProviderAdapterRegistry,
    buildGlobalShoppingProviderAdapterRegistryRows,
    buildGlobalShoppingProviderAdapterRegistryAuditDraft,
    sanitizeGlobalShoppingProviderAdapterRegistry
  };
})();
