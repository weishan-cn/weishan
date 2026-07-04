;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VIEW_MODEL_VERSION = "4.2.0";
  const VIEW_MODEL_NAME = "global_shopping_provider_adapter_registry_view_model_v1";

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
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true }; }
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function hasBlockedBoundary(summary) {
    const safe = obj(summary);
    return safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null ||
      safe.openExternal === true || safe.windowOpen === true || safe.canCallNetwork === true || safe.networkEnabled === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true || safe.rawResponseStored === true || safe.secretStored === true;
  }

  function buildGlobalShoppingProviderAdapterRegistryCards(input) {
    const safe = obj(input);
    const registry = obj(safe.providerAdapterRegistrySummary);
    const normalizer = obj(safe.dryRunProviderResponseNormalizerSummary);
    const runbook = obj(safe.sandboxProviderRunbookSummary);
    return clone([
      card("adapter_registry", "Adapter 注册表", obj(registry.userFacingSummary).resultLabel || "Adapter 注册表仍需复核"),
      card("response_normalizer", "响应归一化", obj(normalizer.userFacingSummary).resultLabel || "响应归一化仍需复核"),
      card("runbook", "接入运行手册", obj(runbook.userFacingSummary).resultLabel || "接入手册仍需复核"),
      card("next_step", "下一步", safe.safeToProceedWithFirstSandboxProviderConnectorImplementation === true ? "继续只读 connector implementation 设计" : "继续只读复核")
    ]);
  }
  function buildGlobalShoppingProviderAdapterRegistryRows(input) {
    const registry = obj(obj(input).providerAdapterRegistrySummary);
    return clone(toArray(registry.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingResponseNormalizerRowsForView(input) {
    const normalizer = obj(obj(input).dryRunProviderResponseNormalizerSummary);
    return clone(toArray(normalizer.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingRunbookRowsForView(input) {
    const runbook = obj(obj(input).sandboxProviderRunbookSummary);
    return clone(toArray(runbook.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }

  function sanitizeGlobalShoppingProviderAdapterRegistryViewModel(viewModel) {
    const safe = obj(viewModel);
    const registry = obj(safe.providerAdapterRegistrySummary);
    const normalizer = obj(safe.dryRunProviderResponseNormalizerSummary);
    const runbook = obj(safe.sandboxProviderRunbookSummary);
    const blocked = statusOf(registry) === "blocked" || statusOf(normalizer) === "blocked" || statusOf(runbook) === "blocked" || hasBlockedBoundary(safe) || hasBlockedBoundary(registry) || hasBlockedBoundary(normalizer) || hasBlockedBoundary(runbook);
    const needsReview = !blocked && (!Object.keys(registry).length || !Object.keys(normalizer).length || !Object.keys(runbook).length || statusOf(registry) === "needs_review" || statusOf(normalizer) === "needs_review" || statusOf(runbook) === "needs_review");
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Adapter 注册与接入手册",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderAdapterRegistryCards(safe),
      registryRows:toArray(safe.registryRows).length ? toArray(safe.registryRows) : buildGlobalShoppingProviderAdapterRegistryRows(safe),
      normalizerRows:toArray(safe.normalizerRows).length ? toArray(safe.normalizerRows) : buildGlobalShoppingResponseNormalizerRowsForView(safe),
      runbookRows:toArray(safe.runbookRows).length ? toArray(safe.runbookRows) : buildGlobalShoppingRunbookRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("read_only_adapter", "Adapter 边界", "只允许只读 adapter 注册", "pass"),
        row("no_raw_response", "响应边界", "不接收 raw provider response", "pass"),
        row("runbook_no_execution", "接入手册边界", "接入手册不执行真实接入", "pass"),
        row("registry_not_connected", "接通边界", "Adapter 注册不代表真实 provider 接通", "pass")
      ],
      caveat:"当前仅管理只读 fixture/dry-run/sandbox adapter，不包含真实 endpoint、真实密钥、真实网络调用或下单能力。",
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderAdapterRegistryViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderAdapterRegistryViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderAdapterRegistryViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingProviderAdapterRegistryViewModelAuditDraft(input) {
    const model = buildGlobalShoppingProviderAdapterRegistryViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
      registryRowCount:model.registryRows.length,
      normalizerRowCount:model.normalizerRows.length,
      runbookRowCount:model.runbookRows.length,
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

  window.WeishanGlobalShoppingProviderAdapterRegistryViewModel = {
    GLOBAL_SHOPPING_PROVIDER_ADAPTER_REGISTRY_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderAdapterRegistryViewModel,
    buildGlobalShoppingProviderAdapterRegistryCards,
    buildGlobalShoppingProviderAdapterRegistryRows,
    buildGlobalShoppingResponseNormalizerRowsForView,
    buildGlobalShoppingRunbookRowsForView,
    buildGlobalShoppingProviderAdapterRegistryViewModelAuditDraft,
    sanitizeGlobalShoppingProviderAdapterRegistryViewModel
  };
})();
