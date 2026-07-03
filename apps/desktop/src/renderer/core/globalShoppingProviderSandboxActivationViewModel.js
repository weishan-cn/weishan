;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_ACTIVATION_VIEW_MODEL_VERSION = "4.1.2";
  const VIEW_MODEL_NAME = "global_shopping_provider_sandbox_activation_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
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
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }

  function buildGlobalShoppingProviderSandboxActivationRows(input) {
    const center = resolveSummary(input, "readOnlySandboxActivationReadinessCenterSummary", "WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter", "buildGlobalShoppingReadOnlySandboxActivationReadinessCenter");
    return toArray(center.rows).length ? clone(center.rows) : clone([row("activation_readiness_missing", "Sandbox 激活准备", "Sandbox 激活准备仍需复核", "warning")]);
  }

  function buildGlobalShoppingOfflineMockSandboxSessionRowsForView(input) {
    const runner = resolveSummary(input, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    return toArray(runner.rows).length ? clone(runner.rows) : clone([row("offline_mock_missing", "离线 Mock 会话", "离线 Mock 会话仍需复核", "warning")]);
  }

  function buildGlobalShoppingManualProviderActivationHandoffRowsForView(input) {
    const packet = resolveSummary(input, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    return toArray(packet.rows).length ? clone(packet.rows) : clone([row("manual_handoff_missing", "人工激活交接", "人工激活交接仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderSandboxActivationCards(input) {
    const safe = obj(input);
    const center = resolveSummary(safe, "readOnlySandboxActivationReadinessCenterSummary", "WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter", "buildGlobalShoppingReadOnlySandboxActivationReadinessCenter");
    const runner = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const packet = resolveSummary(safe, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    return clone([
      card("activation_readiness", "Sandbox 激活准备", obj(center.userFacingSummary).resultLabel || "Sandbox 激活准备仍需复核"),
      card("offline_mock_session", "离线 Mock 会话", obj(runner.userFacingSummary).resultLabel || "离线 Mock 会话仍需复核"),
      card("manual_handoff", "人工激活交接", obj(packet.userFacingSummary).resultLabel || "人工激活交接仍需复核"),
      card("risk_disclosure", "风险说明", "Manual sandbox activation 仍需人工复核")
    ]);
  }

  function sanitizeGlobalShoppingProviderSandboxActivationViewModel(viewModel) {
    const safe = obj(viewModel);
    const readOnlySandboxActivationReadinessCenterSummary = resolveSummary(safe, "readOnlySandboxActivationReadinessCenterSummary", "WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter", "buildGlobalShoppingReadOnlySandboxActivationReadinessCenter");
    const offlineMockSandboxSessionRunnerSummary = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const manualProviderActivationHandoffPacketSummary = resolveSummary(safe, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    const blocked =
      safe.startRealProvider === true ||
      safe.startPilot === true ||
      safe.activateSandbox === true ||
      safe.showCredentialInput === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.generateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.enableProductionProvider === true ||
      safe.createApprovalTask === true ||
      safe.sendEmail === true ||
      safe.openExternalDocument === true ||
      safe.executeRollback === true ||
      safe.modifyRuntimeConfig === true ||
      safe.enableProvider === true ||
      safe.disableProvider === true ||
      safe.download === true ||
      safe.exportRealFile === true ||
      safe.createRelease === true ||
      safe.createTag === true ||
      safe.push === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      !!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl) ||
      readOnlySandboxActivationReadinessCenterSummary.status === "blocked" ||
      offlineMockSandboxSessionRunnerSummary.status === "blocked" ||
      manualProviderActivationHandoffPacketSummary.status === "blocked";
    const missing = !present(readOnlySandboxActivationReadinessCenterSummary) || !present(offlineMockSandboxSessionRunnerSummary) || !present(manualProviderActivationHandoffPacketSummary);
    const status = blocked ? "blocked" : (missing ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_ACTIVATION_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Sandbox 激活准备与离线演练",
      cards:buildGlobalShoppingProviderSandboxActivationCards({
        readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary,
        offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary,
        manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary
      }),
      activationReadinessRows:buildGlobalShoppingProviderSandboxActivationRows({ readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary }),
      offlineMockSessionRows:buildGlobalShoppingOfflineMockSandboxSessionRowsForView({ offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary }),
      manualHandoffRows:buildGlobalShoppingManualProviderActivationHandoffRowsForView({ manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary }),
      disclosureRows:[
        row("sandbox_activation_no_activation", "Sandbox 激活准备不执行激活", "Sandbox 激活准备不执行激活", "pass"),
        row("offline_mock_no_network_key", "离线 Mock 会话不联网、不读密钥", "离线 Mock 会话不联网、不读密钥", "pass"),
        row("manual_handoff_no_release_push", "人工激活交接包不创建 release、不 push", "人工激活交接包不创建 release、不 push", "pass"),
        row("manual_sandbox_activation_required", "Manual sandbox activation 仍需人工复核", "Manual sandbox activation 仍需人工复核", "warning")
      ],
      readOnlySandboxActivationReadinessCenterSummary:clone(readOnlySandboxActivationReadinessCenterSummary),
      offlineMockSandboxSessionRunnerSummary:clone(offlineMockSandboxSessionRunnerSummary),
      manualProviderActivationHandoffPacketSummary:clone(manualProviderActivationHandoffPacketSummary),
      caveat:"当前只展示 provider sandbox 激活准备、离线 mock 会话和人工激活交接，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。"
    });
  }

  function buildGlobalShoppingProviderSandboxActivationViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderSandboxActivationViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_ACTIVATION_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_ACTIVATION_VIEW_MODEL_VERSION,
      status:viewModel.status,
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

  function buildGlobalShoppingProviderSandboxActivationViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxActivationViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderSandboxActivationViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderSandboxActivationViewModel = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_ACTIVATION_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderSandboxActivationViewModel,
    buildGlobalShoppingProviderSandboxActivationCards,
    buildGlobalShoppingProviderSandboxActivationRows,
    buildGlobalShoppingOfflineMockSandboxSessionRowsForView,
    buildGlobalShoppingManualProviderActivationHandoffRowsForView,
    buildGlobalShoppingProviderSandboxActivationViewModelAuditDraft,
    sanitizeGlobalShoppingProviderSandboxActivationViewModel
  };
})();
