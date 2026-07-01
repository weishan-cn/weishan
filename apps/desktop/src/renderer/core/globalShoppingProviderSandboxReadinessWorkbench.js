;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_WORKBENCH_VERSION = "2.8.0";
  const WORKBENCH_NAME = "global_shopping_provider_sandbox_readiness_workbench_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
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
  function panel(panelId, label, status, summary, caveat) {
    return {
      panelId:text(panelId),
      label:text(label),
      status:safeStatus(status),
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
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
  function blockedByCapability(input) {
    const safe = obj(input);
    return safe.activateSandbox === true ||
      safe.startPilot === true ||
      safe.startRealProvider === true ||
      safe.enableProvider === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.generateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.openExternalNow === true ||
      safe.persistReadinessState === true ||
      safe.createRelease === true ||
      safe.createTag === true ||
      safe.push === true ||
      safe.modifyGit === true ||
      safe.modifyRuntimeConfig === true;
  }
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startPilot === true ? "pilot_start_detected" : "",
      safe.startRealProvider === true ? "real_provider_start_detected" : "",
      safe.enableProvider === true ? "provider_enablement_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.openExternal === true || safe.windowOpen === true || safe.openExternalNow === true ? "external_open_detected" : "",
      safe.persistReadinessState === true ? "readiness_state_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_modification_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_modification_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderSandboxReadinessPanels(input) {
    const safe = obj(input);
    const traceInspector = resolveSummary(safe, "offlineSandboxTraceInspectorSummary", "WeishanGlobalShoppingOfflineSandboxTraceInspector", "buildGlobalShoppingOfflineSandboxTraceInspector");
    const resultNormalizer = resolveSummary(safe, "mockProviderResultNormalizerSummary", "WeishanGlobalShoppingMockProviderResultNormalizer", "buildGlobalShoppingMockProviderResultNormalizer");
    const dryRunChecklist = resolveSummary(safe, "manualActivationDryRunChecklistSummary", "WeishanGlobalShoppingManualActivationDryRunChecklist", "buildGlobalShoppingManualActivationDryRunChecklist");
    const dryRunViewModel = resolveSummary(safe, "providerSandboxDryRunViewModelSummary", "WeishanGlobalShoppingProviderSandboxDryRunViewModel", "buildGlobalShoppingProviderSandboxDryRunViewModel");
    const readinessCenter = resolveSummary(safe, "readOnlySandboxActivationReadinessCenterSummary", "WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter", "buildGlobalShoppingReadOnlySandboxActivationReadinessCenter");
    const offlineRunner = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const handoffPacket = resolveSummary(safe, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    const summaries = [
      ["trace_inspector", "Offline Sandbox Trace Inspector", traceInspector, "只展示离线 trace readiness，不保存 raw trace。"],
      ["mock_result_normalizer", "Mock Provider Result Normalizer", resultNormalizer, "只处理 mock 结果摘要，不处理真实 provider response。"],
      ["activation_dry_run_checklist", "Manual Activation Dry-Run Checklist", dryRunChecklist, "只展示人工 dry-run 检查清单，不激活 sandbox。"],
      ["sandbox_dry_run_view_model", "Provider Sandbox Dry-Run View Model", dryRunViewModel, "只展示离线 dry-run 视图，不创建 release。"],
      ["activation_readiness_center", "Read-Only Sandbox Activation Readiness Center", readinessCenter, "只展示 readiness，不启动 pilot 或 provider。"],
      ["offline_mock_session_runner", "Offline Mock Sandbox Session Runner", offlineRunner, "只运行离线 mock 会话，不联网、不读密钥。"],
      ["manual_activation_handoff_packet", "Manual Provider Activation Handoff Packet", handoffPacket, "只展示人工交接摘要，不 push、不改 git。"]
    ];
    return clone(summaries.map(function (item) {
      const summary = obj(item[2]);
      const status = !present(summary) ? "needs_review" : (safeStatus(summary.status) === "failed_safe" ? "blocked" : safeStatus(summary.status));
      return panel(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function evaluateGlobalShoppingProviderSandboxReadinessWorkbench(input) {
    const safe = obj(input);
    const readinessPanels = buildGlobalShoppingProviderSandboxReadinessPanels(safe);
    const blockedPanels = readinessPanels.filter(function (item) { return item.status === "blocked"; });
    const needsReviewPanels = readinessPanels.filter(function (item) { return item.status === "needs_review"; });
    const blockedReasons = blockedReasonList(safe).concat(blockedPanels.map(function (item) { return item.panelId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (needsReviewPanels.length ? "needs_review" : "ready");
    return clone({
      workbenchName:WORKBENCH_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_WORKBENCH_VERSION,
      status:status,
      workbenchBoundary:{
        workbenchId:"global-shopping-provider-sandbox-readiness-workbench",
        workbenchMode:"workbench_only",
        workbenchOnly:true,
        readinessOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canActivateSandbox:false,
        canStartPilot:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canOpenExternalNow:false,
        canPersistReadinessState:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canModifyRuntimeConfig:false
      },
      workbenchSummary:{
        hasTraceInspector:readinessPanels[0].status !== "needs_review",
        hasMockResultNormalizer:readinessPanels[1].status !== "needs_review",
        hasActivationDryRunChecklist:readinessPanels[2].status !== "needs_review",
        hasSandboxDryRunViewModel:readinessPanels[3].status !== "needs_review",
        hasActivationReadinessCenter:readinessPanels[4].status !== "needs_review",
        hasOfflineMockSandboxSessionRunner:readinessPanels[5].status !== "needs_review",
        hasManualActivationHandoffPacket:readinessPanels[6].status !== "needs_review",
        panelCount:readinessPanels.length,
        hardBlockerCount:blockedPanels.length + blockedReasonList(safe).length,
        needsReviewPanelCount:needsReviewPanels.length,
        readyForOfflineScenarioLab:status === "ready",
        manualSandboxApprovalStillRequired:true
      },
      readinessPanels:readinessPanels,
      rows:buildGlobalShoppingProviderSandboxReadinessRows({
        readinessPanels:readinessPanels,
        status:status,
        userFacingSummary:{
          resultLabel:status === "ready" ? "Sandbox Readiness Workbench 已准备" : (status === "blocked" ? "Sandbox Readiness 已阻断" : "Sandbox Readiness 仍需复核")
        }
      }),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Provider Sandbox Readiness Workbench",
        resultLabel:status === "ready" ? "Sandbox Readiness Workbench 已准备" : (status === "blocked" ? "Sandbox Readiness 已阻断" : "Sandbox Readiness 仍需复核"),
        caveat:"该工作台只展示 sandbox readiness，不激活 sandbox，不读取密钥，不联网，不生成 endpoint。"
      },
      safety:safety(),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxReadinessRows(input) {
    const safe = obj(input);
    const readinessPanels = toArray(safe.readinessPanels).length ? toArray(safe.readinessPanels) : buildGlobalShoppingProviderSandboxReadinessPanels(safe);
    const status = safeStatus(safe.status || evaluateGlobalShoppingProviderSandboxReadinessWorkbench(safe).status);
    return clone([
      row("readiness_workbench_status", "Readiness Workbench 状态", obj(safe.userFacingSummary).resultLabel || (status === "ready" ? "Sandbox Readiness Workbench 已准备" : "Sandbox Readiness 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("readiness_workbench_boundary", "Readiness Workbench 边界", "只展示 sandbox readiness，不激活 sandbox，不启动 pilot/provider。", "pass"),
      row("readiness_workbench_runtime", "运行边界", "不读取密钥，不联网，不生成 endpoint，不创建 release/tag，不 push。", "pass")
    ].concat(readinessPanels.map(function (item) {
      return row(item.panelId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function buildGlobalShoppingProviderSandboxReadinessWorkbenchAuditDraft(input) {
    const workbench = buildGlobalShoppingProviderSandboxReadinessWorkbench(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_WORKBENCH_AUDIT_DRAFT",
      workbenchName:WORKBENCH_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_WORKBENCH_VERSION,
      status:workbench.status,
      panelCount:obj(workbench.workbenchSummary).panelCount || 0,
      blockedReasonCount:toArray(workbench.blockedReasons).length,
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

  function sanitizeGlobalShoppingProviderSandboxReadinessWorkbench(workbench) {
    return evaluateGlobalShoppingProviderSandboxReadinessWorkbench(workbench || {});
  }

  function buildGlobalShoppingProviderSandboxReadinessWorkbench(input) {
    try {
      return evaluateGlobalShoppingProviderSandboxReadinessWorkbench(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderSandboxReadinessWorkbench({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderSandboxReadinessWorkbench = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_WORKBENCH_VERSION,
    WORKBENCH_NAME,
    buildGlobalShoppingProviderSandboxReadinessWorkbench,
    evaluateGlobalShoppingProviderSandboxReadinessWorkbench,
    buildGlobalShoppingProviderSandboxReadinessRows,
    buildGlobalShoppingProviderSandboxReadinessPanels,
    buildGlobalShoppingProviderSandboxReadinessWorkbenchAuditDraft,
    sanitizeGlobalShoppingProviderSandboxReadinessWorkbench
  };
})();
