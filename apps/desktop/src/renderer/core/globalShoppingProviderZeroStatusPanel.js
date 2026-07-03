;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ZERO_STATUS_PANEL_VERSION = "4.1.6";
  const PANEL_NAME = "global_shopping_provider_zero_status_panel_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|externalUrl|platformUrl|providerUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.provider === true ? "real_provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.endpoint === true ? "endpoint_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.openExternal === true ? "open_external_detected" : "",
      safe.windowOpen === true ? "window_open_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.ticketing === true ? "ticketing_detected" : "",
      safe.bookingUrl ? "booking_url_detected" : "",
      safe.checkoutUrl ? "checkout_url_detected" : "",
      safe.paymentUrl ? "payment_url_detected" : "",
      safe.orderUrl ? "order_url_detected" : "",
      safe.externalUrl ? "external_url_detected" : "",
      safe.platformUrl ? "platform_url_detected" : "",
      safe.providerUrl ? "provider_url_detected" : "",
      safe.buyButtonEnabled === true ? "buy_button_enabled_detected" : "",
      safe.checkoutButtonEnabled === true ? "checkout_button_enabled_detected" : "",
      safe.paymentButtonEnabled === true ? "payment_button_enabled_detected" : "",
      safe.mutateRuntime === true ? "runtime_mutation_detected" : "",
      safe.executeRealBlocking === true ? "real_blocking_execution_detected" : ""
    ].filter(Boolean);
  }
  function safety() {
    return {
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    };
  }

  function buildGlobalShoppingProviderZeroStatusRules(input) {
    const safe = obj(input);
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    return clone([
      row("provider_zero_runtime_lock", "Provider-Zero Runtime Lock", labelOf(providerZeroRuntimeLockSummary, "Provider-Zero Runtime Lock 仍需复核"), safeStatus(providerZeroRuntimeLockSummary.status) === "ready" ? "pass" : (safeStatus(providerZeroRuntimeLockSummary.status) === "blocked" ? "blocked" : "warning")),
      row("provider_zero_public_beta_shell", "Global Shopping Read-Only Public Beta Shell", labelOf(publicBetaShellSummary, "Global Shopping Read-Only Public Beta Shell 仍需复核"), safeStatus(publicBetaShellSummary.status) === "ready" ? "pass" : (safeStatus(publicBetaShellSummary.status) === "blocked" ? "blocked" : "warning")),
      row("provider_zero_status", "Provider-Zero：未接入真实供应商", "Provider-Zero：未接入真实供应商", "pass"),
      row("provider_zero_no_key", "未读取密钥", "未读取密钥", "pass"),
      row("provider_zero_no_network", "未联网调用", "未联网调用", "pass"),
      row("provider_zero_no_order", "未生成订单", "未生成订单", "pass")
    ]);
  }

  function buildGlobalShoppingProviderZeroStatusRows(input) {
    const safe = obj(input);
    const rules = toArray(safe.providerZeroStatusRules).length ? toArray(safe.providerZeroStatusRules) : buildGlobalShoppingProviderZeroStatusRules(safe);
    return clone([
      row("provider_zero_status_panel_status", "Provider-Zero Status Panel", obj(safe.userFacingSummary).resultLabel || "Provider-Zero Status Panel 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_zero_status_panel_guard", "当前不提供付款、下单或出票能力", "当前不提供付款、下单或出票能力", "pass")
    ].concat(rules));
  }

  function evaluateGlobalShoppingProviderZeroStatusPanel(input) {
    const safe = obj(input);
    const providerZeroRuntimeLockSummary = resolveSummary(safe, "providerZeroRuntimeLockSummary", "WeishanGlobalShoppingProviderZeroRuntimeLock", "buildGlobalShoppingProviderZeroRuntimeLock");
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const statuses = [
      safeStatus(providerZeroRuntimeLockSummary.status),
      safeStatus(publicBetaShellSummary.status)
    ];
    const directBlockedReasons = blockedReasons(safe);
    const status = directBlockedReasons.length || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0
      ? "blocked"
      : (!present(providerZeroRuntimeLockSummary) || !present(publicBetaShellSummary) || statuses.indexOf("needs_review") >= 0
        ? "needs_review"
        : "ready");
    const userFacingSummary = {
      title:"Provider-Zero Status Panel",
      resultLabel:status === "ready" ? "Provider-Zero Status Panel 已准备" : (status === "blocked" ? "Provider-Zero Status Panel 已阻断" : "Provider-Zero Status Panel 仍需复核"),
      caveat:"当前未接入真实供应商，不读密钥、不联网、不生成订单。"
    };
    return clone({
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ZERO_STATUS_PANEL_VERSION,
      status:status,
      userFacingSummary:userFacingSummary,
      providerZeroStatusRules:buildGlobalShoppingProviderZeroStatusRules({
        providerZeroRuntimeLockSummary:providerZeroRuntimeLockSummary,
        globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary
      }),
      rows:buildGlobalShoppingProviderZeroStatusRows({
        status:status,
        userFacingSummary:userFacingSummary,
        providerZeroStatusRules:buildGlobalShoppingProviderZeroStatusRules({
          providerZeroRuntimeLockSummary:providerZeroRuntimeLockSummary,
          globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary
        })
      }),
      blockedReasons:directBlockedReasons,
      providerZeroRuntimeLockSummary:clone(providerZeroRuntimeLockSummary),
      globalShoppingReadOnlyPublicBetaShellSummary:clone(publicBetaShellSummary),
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      safety:safety(),
      redacted:true
    });
  }

  function sanitizeGlobalShoppingProviderZeroStatusPanel(panel) {
    return evaluateGlobalShoppingProviderZeroStatusPanel(panel || {});
  }

  function buildGlobalShoppingProviderZeroStatusPanel(input) {
    try {
      return evaluateGlobalShoppingProviderZeroStatusPanel(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderZeroStatusPanel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderZeroStatusPanel = {
    GLOBAL_SHOPPING_PROVIDER_ZERO_STATUS_PANEL_VERSION,
    PANEL_NAME,
    buildGlobalShoppingProviderZeroStatusPanel,
    evaluateGlobalShoppingProviderZeroStatusPanel,
    buildGlobalShoppingProviderZeroStatusRows,
    buildGlobalShoppingProviderZeroStatusRules,
    sanitizeGlobalShoppingProviderZeroStatusPanel
  };
})();
