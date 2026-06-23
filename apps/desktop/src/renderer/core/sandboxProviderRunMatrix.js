;(function () {
  "use strict";

  const SANDBOX_PROVIDER_RUN_MATRIX_VERSION = "2.1.73";
  const MATRIX_NAME = "sandbox_provider_run_matrix_v1";
  const RUN_MODE = "read_only_sandbox";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function getRegistryApi() {
    return window.WeishanMultiProviderSandboxAdapterRegistry || {};
  }

  function readRegistryProviders() {
    const registryApi = getRegistryApi();
    const registry = typeof registryApi.getMultiProviderSandboxAdapterRegistry === "function"
      ? registryApi.getMultiProviderSandboxAdapterRegistry()
      : { providers: [] };
    return Array.isArray(registry.providers) ? registry.providers.slice() : [];
  }

  function classifyProvider(provider) {
    const raw = provider && typeof provider === "object" ? provider : {};
    const providerId = text(raw.providerId || "");
    const providerName = text(raw.providerName || providerId || "Unknown provider");
    const adapterType = text(raw.adapterType || "");
    const providerMode = text(raw.providerMode || "");
    const productionApi = raw.productionApi === true || providerMode === "production" || providerMode === "production_enabled";
    const handoffOnly = providerId === "google_flights_search" || adapterType === "search_handoff_only" || providerMode === "manual_search_only";
    const runnable = !productionApi && !handoffOnly && (
      providerMode === "fixture" ||
      providerMode === "sandbox_read_only_stub" ||
      providerMode === "sandbox_read_only" ||
      adapterType === "fixture_read_only" ||
      adapterType === "sandbox_read_only_stub" ||
      /_sandbox_stub$/i.test(providerId) ||
      /fixture$/i.test(providerId)
    );
    let status = "blocked";
    let reason = "unknown provider blocked";
    if (handoffOnly) {
      status = "handoff_only";
      reason = "search_handoff_only 仅用于平台确认，不参与只读 dry-run";
    } else if (runnable) {
      status = "runnable";
      reason = "fixture / sandbox_read_only_stub 可执行只读 dry-run";
    } else if (productionApi) {
      status = "blocked";
      reason = "production provider blocked";
    } else if (providerMode === "disabled" || adapterType === "blocked" || providerMode === "blocked") {
      status = "disabled";
      reason = "provider disabled";
    }
    const canRunDryRun = status === "runnable";
    return clone({
      providerId: providerId,
      providerName: providerName,
      adapterType: adapterType,
      providerMode: providerMode || (handoffOnly ? "manual_search_only" : "sandbox_read_only"),
      status: status,
      canRunDryRun: canRunDryRun,
      reason: reason,
      productionProviderEnabled: false,
      networkAllowed: false,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function buildSandboxProviderRunMatrix(options) {
    const safeOptions = options && typeof options === "object" ? options : {};
    const providers = Array.isArray(safeOptions.providers) && safeOptions.providers.length
      ? safeOptions.providers.slice()
      : readRegistryProviders();
    const rows = providers.map(classifyProvider);
    const summary = rows.reduce(function (acc, row) {
      acc.providerCount += 1;
      if (row.status === "runnable") acc.runnableCount += 1;
      else if (row.status === "handoff_only") acc.handoffOnlyCount += 1;
      else if (row.status === "disabled") acc.disabledCount += 1;
      else acc.blockedCount += 1;
      return acc;
    }, { providerCount: 0, runnableCount: 0, disabledCount: 0, handoffOnlyCount: 0, blockedCount: 0 });
    return clone({
      matrixName: MATRIX_NAME,
      appVersion: SANDBOX_PROVIDER_RUN_MATRIX_VERSION,
      runMode: RUN_MODE,
      providers: rows,
      providerCount: summary.providerCount,
      runnableCount: summary.runnableCount,
      disabledCount: summary.disabledCount,
      handoffOnlyCount: summary.handoffOnlyCount,
      blockedCount: summary.blockedCount,
      productionProviderEnabled: false,
      networkAllowed: false,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function evaluateSandboxProviderRunEligibility(providerId, options) {
    const matrix = buildSandboxProviderRunMatrix(options);
    const id = text(providerId);
    const provider = Array.isArray(matrix.providers) ? matrix.providers.find(function (row) { return row && row.providerId === id; }) : null;
    if (provider) return clone(provider);
    return clone({
      providerId: id || "unknown_provider",
      providerName: id || "Unknown provider",
      adapterType: "blocked",
      providerMode: "blocked",
      status: "blocked",
      canRunDryRun: false,
      reason: "unknown provider blocked",
      productionProviderEnabled: false,
      networkAllowed: false,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function buildSandboxProviderRunMatrixAuditDraft(options) {
    const matrix = buildSandboxProviderRunMatrix(options);
    return clone({
      eventType: "SANDBOX_PROVIDER_RUN_MATRIX_AUDIT_DRAFT",
      matrixName: MATRIX_NAME,
      appVersion: SANDBOX_PROVIDER_RUN_MATRIX_VERSION,
      runMode: RUN_MODE,
      providerCount: matrix.providerCount || 0,
      runnableCount: matrix.runnableCount || 0,
      disabledCount: matrix.disabledCount || 0,
      handoffOnlyCount: matrix.handoffOnlyCount || 0,
      blockedCount: matrix.blockedCount || 0,
      productionProviderEnabled: false,
      networkAllowed: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      autoOpen: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  window.WeishanSandboxProviderRunMatrix = {
    SANDBOX_PROVIDER_RUN_MATRIX_VERSION,
    MATRIX_NAME,
    RUN_MODE,
    buildSandboxProviderRunMatrix,
    evaluateSandboxProviderRunEligibility,
    buildSandboxProviderRunMatrixAuditDraft
  };
})();
