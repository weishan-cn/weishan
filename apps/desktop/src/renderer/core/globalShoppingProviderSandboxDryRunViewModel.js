;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION = "2.1.97";
  const VIEW_MODEL_NAME = "global_shopping_provider_sandbox_dry_run_view_model_v1";
  const CAVEAT = "当前仅模拟只读 provider sandbox 生命周期，不发送请求，不读取真实密钥，不保存 raw request 或 raw response。";

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
  function api(name) { return window[name] || {}; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = api(apiName);
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](safe) : {};
  }
  function hasBlockedBoundary(summary) {
    const safe = obj(summary);
    return safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null ||
      safe.openExternal === true || safe.windowOpen === true || safe.networkEnabled === true || safe.realApiKeyDetected === true ||
      safe.rawRequestStored === true || safe.rawResponseStored === true || safe.userIdentityDetected === true || safe.paymentDataDetected === true;
  }

  function buildGlobalShoppingProviderSandboxDryRunCards(input) {
    const dryRun = resolveSummary(input || {}, "providerSandboxDryRunHarnessSummary", "WeishanGlobalShoppingProviderSandboxDryRunHarness", "buildGlobalShoppingProviderSandboxDryRunHarness");
    const adapter = resolveSummary(input || {}, "firstReadOnlyProviderAdapterShellSummary", "WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell", "buildGlobalShoppingFirstReadOnlyProviderAdapterShell");
    const killSwitch = resolveSummary(input || {}, "providerSandboxSafetyKillSwitchSummary", "WeishanGlobalShoppingProviderSandboxSafetyKillSwitch", "buildGlobalShoppingProviderSandboxSafetyKillSwitch");
    return clone([
      card("dry_run", "干跑框架", obj(obj(dryRun).userFacingSummary).resultLabel || "干跑框架仍需复核"),
      card("adapter_shell", "Adapter 外壳", obj(obj(adapter).userFacingSummary).resultLabel || "Adapter 外壳仍需复核"),
      card("kill_switch", "安全熔断器", obj(obj(killSwitch).userFacingSummary).resultLabel || "安全熔断器仍需复核"),
      card("next_step", "下一步", statusOf(dryRun) === "ready" && statusOf(adapter) === "ready" && statusOf(killSwitch) === "clear" ? "继续只读 sandbox fixture 干跑复核" : "继续只读复核")
    ]);
  }
  function buildGlobalShoppingProviderSandboxDryRunRows(input) {
    const dryRun = resolveSummary(input || {}, "providerSandboxDryRunHarnessSummary", "WeishanGlobalShoppingProviderSandboxDryRunHarness", "buildGlobalShoppingProviderSandboxDryRunHarness");
    return clone(toArray(dryRun.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingProviderAdapterRowsForView(input) {
    const adapter = resolveSummary(input || {}, "firstReadOnlyProviderAdapterShellSummary", "WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell", "buildGlobalShoppingFirstReadOnlyProviderAdapterShell");
    return clone(toArray(adapter.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingProviderKillSwitchRowsForView(input) {
    const killSwitch = resolveSummary(input || {}, "providerSandboxSafetyKillSwitchSummary", "WeishanGlobalShoppingProviderSandboxSafetyKillSwitch", "buildGlobalShoppingProviderSandboxSafetyKillSwitch");
    return clone(toArray(killSwitch.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }

  function sanitizeGlobalShoppingProviderSandboxDryRunViewModel(viewModel) {
    const safe = obj(viewModel);
    const dryRun = resolveSummary(safe, "providerSandboxDryRunHarnessSummary", "WeishanGlobalShoppingProviderSandboxDryRunHarness", "buildGlobalShoppingProviderSandboxDryRunHarness");
    const adapter = resolveSummary(safe, "firstReadOnlyProviderAdapterShellSummary", "WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell", "buildGlobalShoppingFirstReadOnlyProviderAdapterShell");
    const killSwitch = resolveSummary(safe, "providerSandboxSafetyKillSwitchSummary", "WeishanGlobalShoppingProviderSandboxSafetyKillSwitch", "buildGlobalShoppingProviderSandboxSafetyKillSwitch");
    const blocked = statusOf(killSwitch) === "blocked" || statusOf(dryRun) === "blocked" || statusOf(adapter) === "blocked" || hasBlockedBoundary(safe) || hasBlockedBoundary(dryRun) || hasBlockedBoundary(adapter) || hasBlockedBoundary(killSwitch);
    const needsReview = !blocked && (!Object.keys(dryRun).length || !Object.keys(adapter).length || !Object.keys(killSwitch).length || statusOf(dryRun) === "needs_review" || statusOf(adapter) === "needs_review" || statusOf(killSwitch) !== "clear");
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Sandbox 干跑准备",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderSandboxDryRunCards(safe),
      dryRunRows:toArray(safe.dryRunRows).length ? toArray(safe.dryRunRows) : buildGlobalShoppingProviderSandboxDryRunRows(safe),
      adapterRows:toArray(safe.adapterRows).length ? toArray(safe.adapterRows) : buildGlobalShoppingProviderAdapterRowsForView(safe),
      killSwitchRows:toArray(safe.killSwitchRows).length ? toArray(safe.killSwitchRows) : buildGlobalShoppingProviderKillSwitchRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("request_disabled", "请求边界", "干跑不发送真实请求", "pass"),
        row("adapter_endpoint", "Adapter 边界", "Adapter 外壳不包含真实 endpoint", "pass"),
        row("kill_switch", "安全边界", "安全熔断器阻断真实 provider 风险", "pass"),
        row("dry_run_caveat", "价格边界", "干跑不代表真实价格或下单能力", "pass")
      ],
      caveat:CAVEAT,
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxDryRunViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxDryRunViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderSandboxDryRunViewModel({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingProviderSandboxDryRunViewModelAuditDraft(input) {
    const model = buildGlobalShoppingProviderSandboxDryRunViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
      dryRunRowCount:model.dryRunRows.length,
      adapterRowCount:model.adapterRows.length,
      killSwitchRowCount:model.killSwitchRows.length,
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

  window.WeishanGlobalShoppingProviderSandboxDryRunViewModel = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_DRY_RUN_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderSandboxDryRunViewModel,
    buildGlobalShoppingProviderSandboxDryRunCards,
    buildGlobalShoppingProviderSandboxDryRunRows,
    buildGlobalShoppingProviderAdapterRowsForView,
    buildGlobalShoppingProviderKillSwitchRowsForView,
    buildGlobalShoppingProviderSandboxDryRunViewModelAuditDraft,
    sanitizeGlobalShoppingProviderSandboxDryRunViewModel
  };
})();
