;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_MILESTONE_VIEW_MODEL_VERSION = "2.6.0";
  const VIEW_MODEL_NAME = "global_shopping_provider_sandbox_milestone_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
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
    return {
      cardId:text(cardId),
      label:text(label),
      value:text(value),
      redacted:true
    };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function summaryLabel(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }

  function buildGlobalShoppingOfflineScenarioRowsForView(input) {
    const summary = resolveSummary(input, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("offline_scenario_lab_missing", "Offline Scenario Lab", "离线场景仍需复核", "warning")]);
  }

  function buildGlobalShoppingAdapterSdkSkeletonRowsForView(input) {
    const summary = resolveSummary(input, "readOnlyProviderAdapterSdkSkeletonSummary", "WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton", "buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton");
    if (toArray(summary.interfaceRows).length || toArray(summary.contractRows).length) {
      return clone([].concat(toArray(summary.interfaceRows), toArray(summary.contractRows), toArray(summary.forbiddenCapabilityRows)));
    }
    return clone([row("adapter_sdk_skeleton_missing", "Adapter SDK Skeleton", "只读 Adapter SDK 骨架仍需复核", "warning")]);
  }

  function buildGlobalShoppingManualActivationCommandRowsForView(input) {
    const summary = resolveSummary(input, "manualActivationCommandCenterSummary", "WeishanGlobalShoppingManualActivationCommandCenter", "buildGlobalShoppingManualActivationCommandCenter");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("manual_activation_command_center_missing", "Command Center", "人工激活指挥仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderSandboxMilestoneRows(input) {
    const summary = resolveSummary(input, "providerSandboxReadinessWorkbenchSummary", "WeishanGlobalShoppingProviderSandboxReadinessWorkbench", "buildGlobalShoppingProviderSandboxReadinessWorkbench");
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row("readiness_workbench_missing", "Readiness Workbench", "Sandbox Readiness 仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderSandboxMilestoneCards(input) {
    const safe = obj(input);
    const readinessWorkbench = resolveSummary(safe, "providerSandboxReadinessWorkbenchSummary", "WeishanGlobalShoppingProviderSandboxReadinessWorkbench", "buildGlobalShoppingProviderSandboxReadinessWorkbench");
    const scenarioLab = resolveSummary(safe, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    const sdkSkeleton = resolveSummary(safe, "readOnlyProviderAdapterSdkSkeletonSummary", "WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton", "buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton");
    const commandCenter = resolveSummary(safe, "manualActivationCommandCenterSummary", "WeishanGlobalShoppingManualActivationCommandCenter", "buildGlobalShoppingManualActivationCommandCenter");
    return clone([
      card("readiness_workbench", "Readiness Workbench", summaryLabel(readinessWorkbench, "Sandbox Readiness 仍需复核")),
      card("offline_scenario_lab", "Offline Scenario Lab", summaryLabel(scenarioLab, "离线场景仍需复核")),
      card("adapter_sdk_skeleton", "Adapter SDK Skeleton", summaryLabel(sdkSkeleton, "只读 Adapter SDK 骨架仍需复核")),
      card("activation_command", "Command Center", summaryLabel(commandCenter, "人工激活指挥仍需复核")),
      card("risk_disclosure", "风险说明", "Human sandbox milestone review 仍需人工复核")
    ]);
  }

  function sanitizeGlobalShoppingProviderSandboxMilestoneViewModel(viewModel) {
    const safe = obj(viewModel);
    const readinessWorkbench = resolveSummary(safe, "providerSandboxReadinessWorkbenchSummary", "WeishanGlobalShoppingProviderSandboxReadinessWorkbench", "buildGlobalShoppingProviderSandboxReadinessWorkbench");
    const scenarioLab = resolveSummary(safe, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    const sdkSkeleton = resolveSummary(safe, "readOnlyProviderAdapterSdkSkeletonSummary", "WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton", "buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton");
    const commandCenter = resolveSummary(safe, "manualActivationCommandCenterSummary", "WeishanGlobalShoppingManualActivationCommandCenter", "buildGlobalShoppingManualActivationCommandCenter");
    const statuses = [readinessWorkbench, scenarioLab, sdkSkeleton, commandCenter].map(function (item) { return safeStatus(obj(item).status); });
    const blocked = statuses.indexOf("blocked") >= 0;
    const needsReview = !present(readinessWorkbench) || !present(scenarioLab) || !present(sdkSkeleton) || !present(commandCenter) || statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_MILESTONE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Sandbox 里程碑工作台",
      cards:buildGlobalShoppingProviderSandboxMilestoneCards({
        providerSandboxReadinessWorkbenchSummary:readinessWorkbench,
        offlineProviderScenarioLabSummary:scenarioLab,
        readOnlyProviderAdapterSdkSkeletonSummary:sdkSkeleton,
        manualActivationCommandCenterSummary:commandCenter
      }),
      readinessWorkbenchRows:buildGlobalShoppingProviderSandboxMilestoneRows({ providerSandboxReadinessWorkbenchSummary:readinessWorkbench }),
      offlineScenarioRows:buildGlobalShoppingOfflineScenarioRowsForView({ offlineProviderScenarioLabSummary:scenarioLab }),
      adapterSdkSkeletonRows:buildGlobalShoppingAdapterSdkSkeletonRowsForView({ readOnlyProviderAdapterSdkSkeletonSummary:sdkSkeleton }),
      activationCommandRows:buildGlobalShoppingManualActivationCommandRowsForView({ manualActivationCommandCenterSummary:commandCenter }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("milestone_disclosure_readiness", "Readiness Workbench 不激活 sandbox", "Readiness Workbench 不激活 sandbox", "pass"),
        row("milestone_disclosure_offline", "Offline Scenario Lab 不联网、不读密钥", "Offline Scenario Lab 不联网、不读密钥", "pass"),
        row("milestone_disclosure_sdk", "Adapter SDK Skeleton 不生成 endpoint、不导入真实 SDK", "Adapter SDK Skeleton 不生成 endpoint、不导入真实 SDK", "pass"),
        row("milestone_disclosure_command", "Command Center 不创建 release、不 push", "Command Center 不创建 release、不 push", "pass"),
        row("milestone_disclosure_human_review", "Human sandbox milestone review 仍需人工复核", "Human sandbox milestone review 仍需人工复核", "warning")
      ],
      providerSandboxReadinessWorkbenchSummary:clone(readinessWorkbench),
      offlineProviderScenarioLabSummary:clone(scenarioLab),
      readOnlyProviderAdapterSdkSkeletonSummary:clone(sdkSkeleton),
      manualActivationCommandCenterSummary:clone(commandCenter),
      caveat:"当前只展示 provider sandbox 里程碑工作台，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。"
    });
  }

  function buildGlobalShoppingProviderSandboxMilestoneViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderSandboxMilestoneViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_MILESTONE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_MILESTONE_VIEW_MODEL_VERSION,
      status:viewModel.status,
      cardCount:toArray(viewModel.cards).length,
      disclosureRowCount:toArray(viewModel.disclosureRows).length,
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

  function buildGlobalShoppingProviderSandboxMilestoneViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxMilestoneViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderSandboxMilestoneViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderSandboxMilestoneViewModel = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_MILESTONE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderSandboxMilestoneViewModel,
    buildGlobalShoppingProviderSandboxMilestoneCards,
    buildGlobalShoppingProviderSandboxMilestoneRows,
    buildGlobalShoppingOfflineScenarioRowsForView,
    buildGlobalShoppingAdapterSdkSkeletonRowsForView,
    buildGlobalShoppingManualActivationCommandRowsForView,
    buildGlobalShoppingProviderSandboxMilestoneViewModelAuditDraft,
    sanitizeGlobalShoppingProviderSandboxMilestoneViewModel
  };
})();
