;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ZERO_RUNTIME_LOCK_VERSION = "4.2.8";
  const LOCK_NAME = "global_shopping_provider_zero_runtime_lock_v1";

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
  function safeMode(value) { return /^(disabled|provider_zero_lock_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "provider_zero_lock_only"; }
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
      safe.mutateConfig === true ? "config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.switchProductionProvider === true ? "production_provider_switch_detected" : "",
      safe.providerClient === true ? "provider_client_detected" : "",
      safe.endpoint === true ? "endpoint_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.openExternal === true ? "open_external_detected" : "",
      safe.windowOpen === true ? "window_open_detected" : "",
      safe.executeRealBlocking === true ? "real_blocking_execution_detected" : "",
      safe.booking === true ? "booking_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.checkout === true ? "checkout_detected" : ""
    ].filter(Boolean);
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      upload:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }

  function buildGlobalShoppingProviderZeroRuntimeLockRules(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const noProviderUserAssurancePanelSummary = resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    const noProviderExecutionFinalGuardSummary = resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    const providerNoProductionGuaranteeMatrixSummary = resolveSummary(safe, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix");
    const safetyRegressionSummary = resolveSummary(safe, "safetyRegressionSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionSentinel");
    const providerZeroStatusPanelSummary = present(safe.providerZeroStatusPanelSummary) ? obj(safe.providerZeroStatusPanelSummary) : {};
    return clone([
      row("public_beta_shell", "Global Shopping Read-Only Public Beta Shell", labelOf(publicBetaShellSummary, "Global Shopping Read-Only Public Beta Shell 仍需复核"), safeStatus(publicBetaShellSummary.status) === "ready" ? "pass" : (safeStatus(publicBetaShellSummary.status) === "blocked" ? "blocked" : "warning")),
      row("provider_zero_status_panel", "Provider-Zero Status Panel", labelOf(providerZeroStatusPanelSummary, "Provider-Zero Status Panel 仍需复核"), safeStatus(providerZeroStatusPanelSummary.status) === "ready" ? "pass" : (safeStatus(providerZeroStatusPanelSummary.status) === "blocked" ? "blocked" : "warning")),
      row("no_provider_user_assurance_panel", "No-Provider User Assurance Panel", labelOf(noProviderUserAssurancePanelSummary, "No-Provider User Assurance Panel 仍需复核"), safeStatus(noProviderUserAssurancePanelSummary.status) === "ready" ? "pass" : (safeStatus(noProviderUserAssurancePanelSummary.status) === "blocked" ? "blocked" : "warning")),
      row("no_provider_execution_final_guard", "No-Provider-Execution Final Guard", labelOf(noProviderExecutionFinalGuardSummary, "No-Provider-Execution Final Guard 仍需复核"), safeStatus(noProviderExecutionFinalGuardSummary.status) === "ready" ? "pass" : (safeStatus(noProviderExecutionFinalGuardSummary.status) === "blocked" ? "blocked" : "warning")),
      row("provider_no_production_guarantee_matrix", "Provider No-Production Guarantee Matrix", labelOf(providerNoProductionGuaranteeMatrixSummary, "Provider No-Production Guarantee Matrix 仍需复核"), safeStatus(providerNoProductionGuaranteeMatrixSummary.status) === "ready" ? "pass" : (safeStatus(providerNoProductionGuaranteeMatrixSummary.status) === "blocked" ? "blocked" : "warning")),
      row("safety_regression_summary", "Flight Workflow Safety Regression Sentinel", labelOf(safetyRegressionSummary, "Flight Workflow Safety Regression Sentinel 仍需复核"), safeStatus(safetyRegressionSummary.status) === "ready" ? "pass" : (safeStatus(safetyRegressionSummary.status) === "blocked" ? "blocked" : "warning"))
    ]);
  }

  function buildGlobalShoppingProviderZeroRuntimeLockRows(input) {
    const safe = obj(input);
    const rules = toArray(safe.providerZeroRuntimeLockRules).length ? toArray(safe.providerZeroRuntimeLockRules) : buildGlobalShoppingProviderZeroRuntimeLockRules(safe);
    return clone([
      row("provider_zero_runtime_lock_status", "Provider-Zero Runtime Lock", obj(safe.userFacingSummary).resultLabel || "Provider-Zero Runtime Lock 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_zero_runtime_lock_boundary", "Provider-Zero Lock 边界", "当前只展示 provider-zero runtime lock。", "pass"),
      row("provider_zero_runtime_lock_guard", "只读说明", "Provider-Zero：未接入真实供应商，未读取密钥，未联网调用，未生成订单。", "pass")
    ].concat(rules));
  }

  function evaluateGlobalShoppingProviderZeroRuntimeLock(input) {
    const safe = obj(input);
    const publicBetaShellSummary = resolveSummary(safe, "globalShoppingReadOnlyPublicBetaShellSummary", "WeishanGlobalShoppingReadOnlyPublicBetaShell", "buildGlobalShoppingReadOnlyPublicBetaShell");
    const noProviderUserAssurancePanelSummary = resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    const noProviderExecutionFinalGuardSummary = resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    const providerNoProductionGuaranteeMatrixSummary = resolveSummary(safe, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix");
    const safetyRegressionSummary = resolveSummary(safe, "safetyRegressionSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionSentinel");
    const providerZeroStatusPanelSummary = present(safe.providerZeroStatusPanelSummary) ? obj(safe.providerZeroStatusPanelSummary) : {};
    const rules = buildGlobalShoppingProviderZeroRuntimeLockRules({
      globalShoppingReadOnlyPublicBetaShellSummary:publicBetaShellSummary,
      providerZeroStatusPanelSummary:providerZeroStatusPanelSummary,
      noProviderUserAssurancePanelSummary:noProviderUserAssurancePanelSummary,
      noProviderExecutionFinalGuardSummary:noProviderExecutionFinalGuardSummary,
      providerNoProductionGuaranteeMatrixSummary:providerNoProductionGuaranteeMatrixSummary,
      safetyRegressionSummary:safetyRegressionSummary
    });
    const statuses = [
      safeStatus(publicBetaShellSummary.status),
      safeStatus(noProviderUserAssurancePanelSummary.status),
      safeStatus(noProviderExecutionFinalGuardSummary.status),
      safeStatus(providerNoProductionGuaranteeMatrixSummary.status),
      safeStatus(safetyRegressionSummary.status)
    ];
    const directBlockedReasons = blockedReasons(safe);
    const blocked = directBlockedReasons.length || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(publicBetaShellSummary) ||
      !present(noProviderUserAssurancePanelSummary) ||
      !present(noProviderExecutionFinalGuardSummary) ||
      !present(providerNoProductionGuaranteeMatrixSummary) ||
      !present(safetyRegressionSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      lockName:LOCK_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ZERO_RUNTIME_LOCK_VERSION,
      status:status,
      lockMode:safeMode(safe.lockMode),
      providerZeroRuntimeLockBoundary:{
        providerZeroLockOnly:true,
        offlineMock:true,
        readOnly:true,
        canMutateConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canSwitchProductionProvider:false,
        canCreateProviderClient:false,
        canGenerateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canStoreRawProviderData:false,
        canWriteFile:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canOpenExternal:false,
        canWindowOpen:false,
        canExecuteRealBlocking:false,
        canBook:false,
        canPay:false,
        canOrder:false,
        canCheckout:false
      },
      providerZeroRuntimeLockRules:rules,
      blockedReasons:directBlockedReasons,
      userFacingSummary:{
        title:"Provider-Zero Runtime Lock",
        resultLabel:status === "ready" ? "Provider-Zero Runtime Lock 已准备" : (status === "blocked" ? "Provider-Zero Runtime Lock 已阻断" : "Provider-Zero Runtime Lock 仍需复核"),
        caveat:"Provider-Zero：未接入真实供应商，未读取密钥，未联网调用，未生成订单。"
      },
      rows:buildGlobalShoppingProviderZeroRuntimeLockRows({ status:status, userFacingSummary:{ resultLabel:status === "ready" ? "Provider-Zero Runtime Lock 已准备" : (status === "blocked" ? "Provider-Zero Runtime Lock 已阻断" : "Provider-Zero Runtime Lock 仍需复核") }, providerZeroRuntimeLockRules:rules }),
      globalShoppingReadOnlyPublicBetaShellSummary:clone(publicBetaShellSummary),
      noProviderUserAssurancePanelSummary:clone(noProviderUserAssurancePanelSummary),
      noProviderExecutionFinalGuardSummary:clone(noProviderExecutionFinalGuardSummary),
      providerNoProductionGuaranteeMatrixSummary:clone(providerNoProductionGuaranteeMatrixSummary),
      safetyRegressionSummary:clone(safetyRegressionSummary),
      safety:safety(),
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
      redacted:true
    });
  }

  function buildGlobalShoppingProviderZeroRuntimeLockAuditDraft(input) {
    const lock = buildGlobalShoppingProviderZeroRuntimeLock(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_ZERO_RUNTIME_LOCK_AUDIT_DRAFT",
      lockName:LOCK_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ZERO_RUNTIME_LOCK_VERSION,
      status:lock.status,
      ruleCount:toArray(lock.providerZeroRuntimeLockRules).length,
      blockedReasonCount:toArray(lock.blockedReasons).length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingProviderZeroRuntimeLock(lock) {
    return evaluateGlobalShoppingProviderZeroRuntimeLock(lock || {});
  }

  function buildGlobalShoppingProviderZeroRuntimeLock(input) {
    try {
      return evaluateGlobalShoppingProviderZeroRuntimeLock(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderZeroRuntimeLock({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderZeroRuntimeLock = {
    GLOBAL_SHOPPING_PROVIDER_ZERO_RUNTIME_LOCK_VERSION,
    LOCK_NAME,
    buildGlobalShoppingProviderZeroRuntimeLock,
    evaluateGlobalShoppingProviderZeroRuntimeLock,
    buildGlobalShoppingProviderZeroRuntimeLockRows,
    buildGlobalShoppingProviderZeroRuntimeLockRules,
    buildGlobalShoppingProviderZeroRuntimeLockAuditDraft,
    sanitizeGlobalShoppingProviderZeroRuntimeLock
  };
})();
