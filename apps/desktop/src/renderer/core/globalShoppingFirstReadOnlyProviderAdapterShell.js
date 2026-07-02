;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FIRST_READ_ONLY_PROVIDER_ADAPTER_SHELL_VERSION = "4.0.1";
  const SHELL_NAME = "global_shopping_first_read_only_provider_adapter_shell_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
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
  function adapterMode(input) {
    const value = text(obj(input).adapterMode || "dry_run");
    return /^(disabled|fixture|dry_run|sandbox_ready)$/.test(value) ? value : "";
  }
  function providerType(input) {
    const value = text(obj(input).providerType || "fixture");
    return /^(official|authorized|partner|affiliate|aggregator|fixture|unknown)$/.test(value) ? value : "unknown";
  }

  function evaluateGlobalShoppingFirstReadOnlyProviderAdapterShell(input) {
    const safe = obj(input);
    const shell = {
      adapterId:text(safe.adapterId || "global_shopping_first_read_only_provider_adapter_shell"),
      providerId:text(safe.providerId || ""),
      providerName:text(safe.providerName || ""),
      adapterMode:adapterMode(safe),
      providerType:providerType(safe),
      readOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      hasRealEndpoint:false,
      hasRealApiKey:false,
      hasProviderSdk:false,
      canCallNetwork:false,
      canFetchLivePrice:false,
      canSubmitBooking:false,
      canSubmitOrder:false,
      canSubmitPayment:false,
      canIssueTicket:false,
      canPersistRawResponse:false,
      canPersistUserQuery:false,
      canPersistUserIdentity:false,
      canOpenExternalNow:false
    };
    const adapterContract = {
      acceptsRequestEnvelope:safe.acceptsRequestEnvelope !== false,
      emitsProviderResponseContract:safe.emitsProviderResponseContract !== false,
      emitsNormalizedSourceInputs:safe.emitsNormalizedSourceInputs !== false,
      emitsAuditLedgerEntry:safe.emitsAuditLedgerEntry !== false,
      redactedOutputOnly:safe.redactedOutputOnly !== false
    };
    const adapterHealth = {
      hasProviderId:!!shell.providerId,
      hasAdapterMode:!!shell.adapterMode,
      hasReadOnlyBoundary:safe.readOnly !== false && safe.sandboxOnly !== false && safe.productionDisabled !== false,
      noRealEndpoint:safe.hasRealEndpoint !== true && safe.realEndpointEnabled !== true,
      noRealApiKey:safe.hasRealApiKey !== true && safe.realApiKeyDetected !== true,
      noProviderSdk:safe.hasProviderSdk !== true && safe.providerSdkEnabled !== true,
      noNetwork:safe.canCallNetwork !== true && safe.networkEnabled !== true,
      noLiveFetch:safe.canFetchLivePrice !== true && safe.liveFetchEnabled !== true,
      noBooking:safe.canSubmitBooking !== true && safe.booking === true !== true,
      noOrder:safe.canSubmitOrder !== true && safe.order !== true,
      noPayment:safe.canSubmitPayment !== true && safe.payment !== true,
      noTicketing:safe.canIssueTicket !== true && safe.ticketing !== true,
      noRawPersistence:safe.canPersistRawResponse !== true && safe.rawResponseStored !== true,
      noUserPersistence:safe.canPersistUserQuery !== true && safe.canPersistUserIdentity !== true && safe.rawUserTextStored !== true && safe.userIdentityDetected !== true,
      noExternalOpen:safe.canOpenExternalNow !== true && safe.openExternal !== true && safe.windowOpen !== true
    };
    const blockedReasons = [];
    if (!adapterHealth.noRealEndpoint) blockedReasons.push("real_endpoint_detected");
    if (!adapterHealth.noRealApiKey) blockedReasons.push("real_api_key_detected");
    if (!adapterHealth.noProviderSdk) blockedReasons.push("provider_sdk_detected");
    if (!adapterHealth.noNetwork || !adapterHealth.noLiveFetch) blockedReasons.push("network_or_live_fetch_detected");
    if (!adapterHealth.noBooking || !adapterHealth.noOrder || !adapterHealth.noPayment || !adapterHealth.noTicketing) blockedReasons.push("transaction_capability_detected");
    if (!adapterHealth.noRawPersistence) blockedReasons.push("raw_persistence_detected");
    if (!adapterHealth.noUserPersistence) blockedReasons.push("user_persistence_detected");
    if (!adapterHealth.noExternalOpen) blockedReasons.push("external_open_detected");
    if (adapterContract.redactedOutputOnly !== true) blockedReasons.push("non_redacted_output_detected");
    const needsReview = !blockedReasons.length && (!adapterHealth.hasProviderId || !adapterHealth.hasAdapterMode || !adapterHealth.hasReadOnlyBoundary);
    return clone({
      adapterShell:shell,
      adapterContract:adapterContract,
      adapterHealth:adapterHealth,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      redacted:true
    });
  }

  function buildGlobalShoppingFirstReadOnlyProviderAdapterRows(input) {
    const evaluation = evaluateGlobalShoppingFirstReadOnlyProviderAdapterShell(input || {});
    const health = evaluation.adapterHealth;
    return clone([
      row("provider_id", "Provider 标识", health.hasProviderId ? "Provider 已脱敏标识" : "仍需补充", health.hasProviderId ? "pass" : "warning"),
      row("adapter_mode", "Adapter 模式", health.hasAdapterMode ? "仅允许 disabled / fixture / dry_run / sandbox_ready" : "仍需补充", health.hasAdapterMode ? "pass" : "warning"),
      row("read_only_boundary", "只读边界", health.hasReadOnlyBoundary ? "只读 / sandboxOnly / productionDisabled 已建立" : "仍需补充", health.hasReadOnlyBoundary ? "pass" : "warning"),
      row("real_endpoint", "真实 endpoint", health.noRealEndpoint ? "未开放" : "已阻断", health.noRealEndpoint ? "pass" : "blocked"),
      row("real_key_sdk", "真实密钥 / SDK", health.noRealApiKey && health.noProviderSdk ? "未开放" : "已阻断", health.noRealApiKey && health.noProviderSdk ? "pass" : "blocked"),
      row("network_live", "网络 / 实时抓取", health.noNetwork && health.noLiveFetch ? "未开放" : "已阻断", health.noNetwork && health.noLiveFetch ? "pass" : "blocked"),
      row("transaction", "下单 / 支付 / 出票", health.noBooking && health.noOrder && health.noPayment && health.noTicketing ? "未开放" : "已阻断", health.noBooking && health.noOrder && health.noPayment && health.noTicketing ? "pass" : "blocked"),
      row("persistence_open", "原始数据 / 外部打开", health.noRawPersistence && health.noUserPersistence && health.noExternalOpen ? "未开放" : "已阻断", health.noRawPersistence && health.noUserPersistence && health.noExternalOpen ? "pass" : "blocked"),
      row("output", "输出边界", evaluation.adapterContract.redactedOutputOnly === true ? "仅输出脱敏摘要" : "已阻断", evaluation.adapterContract.redactedOutputOnly === true ? "pass" : "blocked")
    ]);
  }

  function sanitizeGlobalShoppingFirstReadOnlyProviderAdapterShell(shell) {
    const safe = obj(shell);
    const evaluation = evaluateGlobalShoppingFirstReadOnlyProviderAdapterShell(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_FIRST_READ_ONLY_PROVIDER_ADAPTER_SHELL_VERSION,
      status:status,
      adapterShell:clone(evaluation.adapterShell),
      adapterContract:clone(evaluation.adapterContract),
      adapterHealth:clone(evaluation.adapterHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingFirstReadOnlyProviderAdapterRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"第一个只读 Provider Adapter 外壳",
        resultLabel:status === "ready" ? "Adapter 外壳已准备" : (status === "needs_review" ? "Adapter 外壳仍需复核" : "Adapter 外壳已阻断"),
        caveat:"当前仅定义只读 Provider Adapter 外壳，不包含真实 endpoint、真实密钥、真实请求或真实下单能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingFirstReadOnlyProviderAdapterShell(input) {
    try {
      return sanitizeGlobalShoppingFirstReadOnlyProviderAdapterShell(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingFirstReadOnlyProviderAdapterShell({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingFirstReadOnlyProviderAdapterShellAuditDraft(input) {
    const shell = buildGlobalShoppingFirstReadOnlyProviderAdapterShell(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FIRST_READ_ONLY_PROVIDER_ADAPTER_SHELL_AUDIT_DRAFT",
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_FIRST_READ_ONLY_PROVIDER_ADAPTER_SHELL_VERSION,
      status:shell.status,
      blockedReasons:shell.blockedReasons,
      rowCount:shell.rows.length,
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

  window.WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell = {
    GLOBAL_SHOPPING_FIRST_READ_ONLY_PROVIDER_ADAPTER_SHELL_VERSION,
    SHELL_NAME,
    buildGlobalShoppingFirstReadOnlyProviderAdapterShell,
    evaluateGlobalShoppingFirstReadOnlyProviderAdapterShell,
    buildGlobalShoppingFirstReadOnlyProviderAdapterRows,
    buildGlobalShoppingFirstReadOnlyProviderAdapterShellAuditDraft,
    sanitizeGlobalShoppingFirstReadOnlyProviderAdapterShell
  };
})();
