;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_ACTIVATION_COMMAND_CENTER_VERSION = "4.0.4";
  const CENTER_NAME = "global_shopping_manual_activation_command_center_v1";

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
  function stage(stageId, label, status, summary, caveat) {
    return {
      stageId:text(stageId),
      label:text(label),
      status:safeStatus(status),
      summary:text(summary),
      caveat:text(caveat),
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
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_start_detected" : "",
      safe.enableProvider === true ? "provider_enablement_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_modification_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_modification_detected" : "",
      safe.sendEmail === true ? "email_send_detected" : "",
      safe.createApprovalTask === true ? "approval_task_detected" : "",
      safe.persistCommandState === true ? "command_state_persistence_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingManualActivationCommandStages(input) {
    const safe = obj(input);
    const readinessWorkbench = resolveSummary(safe, "providerSandboxReadinessWorkbenchSummary", "WeishanGlobalShoppingProviderSandboxReadinessWorkbench", "buildGlobalShoppingProviderSandboxReadinessWorkbench");
    const scenarioLab = resolveSummary(safe, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    const sdkSkeleton = resolveSummary(safe, "readOnlyProviderAdapterSdkSkeletonSummary", "WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton", "buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton");
    const dryRunChecklist = resolveSummary(safe, "manualActivationDryRunChecklistSummary", "WeishanGlobalShoppingManualActivationDryRunChecklist", "buildGlobalShoppingManualActivationDryRunChecklist");
    const handoffPacket = resolveSummary(safe, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    const releaseFreezeGate = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    const list = [
      ["readiness_workbench", "Provider Sandbox Readiness Workbench", readinessWorkbench, "只展示 readiness workbench，不激活 sandbox。"],
      ["offline_scenario_lab", "Offline Provider Scenario Lab", scenarioLab, "只运行离线场景，不联网、不读密钥。"],
      ["adapter_sdk_skeleton", "Read-Only Provider Adapter SDK Skeleton", sdkSkeleton, "只展示接口骨架，不导入真实 SDK。"],
      ["manual_activation_dry_run", "Manual Activation Dry-Run Checklist", dryRunChecklist, "只展示人工 dry-run 检查清单，不创建 release。"],
      ["manual_activation_handoff_packet", "Manual Provider Activation Handoff Packet", handoffPacket, "只展示人工交接包，不 push、不改 git。"],
      ["release_freeze_gate", "Release Freeze Gate", releaseFreezeGate, "只展示冻结条件，不改配置。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      const status = !present(summary) ? "needs_review" : (safeStatus(summary.status) === "failed_safe" ? "blocked" : safeStatus(summary.status));
      return stage(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function evaluateGlobalShoppingManualActivationCommandCenter(input) {
    const safe = obj(input);
    const commandStages = buildGlobalShoppingManualActivationCommandStages(safe);
    const blockedStages = commandStages.filter(function (item) { return item.status === "blocked"; });
    const reviewStages = commandStages.filter(function (item) { return item.status === "needs_review"; });
    const blockedReasons = blockedReasonList(safe).concat(blockedStages.map(function (item) { return item.stageId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (reviewStages.length ? "needs_review" : "ready");
    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_ACTIVATION_COMMAND_CENTER_VERSION,
      status:status,
      commandBoundary:{
        centerId:"global-shopping-manual-activation-command-center",
        centerMode:"command_center_only",
        commandCenterOnly:true,
        readinessOnly:true,
        manualOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canModifyRuntimeConfig:false,
        canSendEmail:false,
        canCreateApprovalTask:false,
        canPersistCommandState:false
      },
      commandSummary:{
        hasReadinessWorkbench:commandStages[0].status !== "needs_review",
        hasOfflineScenarioLab:commandStages[1].status !== "needs_review",
        hasAdapterSdkSkeleton:commandStages[2].status !== "needs_review",
        hasManualActivationDryRunChecklist:commandStages[3].status !== "needs_review",
        hasManualActivationHandoffPacket:commandStages[4].status !== "needs_review",
        hasReleaseFreezeGate:commandStages[5].status !== "needs_review",
        commandStageCount:commandStages.length,
        blockedCommandCount:blockedStages.length + blockedReasonList(safe).length,
        needsReviewCommandCount:reviewStages.length,
        readyForHumanSandboxActivationDecision:status === "ready",
        humanActivationStillRequired:true
      },
      commandStages:commandStages,
      rows:buildGlobalShoppingManualActivationCommandRows({
        commandStages:commandStages,
        status:status,
        userFacingSummary:{
          resultLabel:status === "ready" ? "人工激活指挥中心已准备" : (status === "blocked" ? "人工激活指挥已阻断" : "人工激活指挥仍需复核")
        }
      }),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Manual Activation Command Center",
        resultLabel:status === "ready" ? "人工激活指挥中心已准备" : (status === "blocked" ? "人工激活指挥已阻断" : "人工激活指挥仍需复核"),
        caveat:"该指挥中心只展示人工激活准备状态，不激活 sandbox，不启动 provider，不创建 release，不 push。"
      },
      safety:{
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
      },
      redacted:true
    });
  }

  function buildGlobalShoppingManualActivationCommandRows(input) {
    const safe = obj(input);
    const commandStages = toArray(safe.commandStages).length ? toArray(safe.commandStages) : buildGlobalShoppingManualActivationCommandStages(safe);
    const status = safeStatus(safe.status || evaluateGlobalShoppingManualActivationCommandCenter(safe).status);
    return clone([
      row("manual_activation_command_status", "Command Center 状态", obj(safe.userFacingSummary).resultLabel || (status === "ready" ? "人工激活指挥中心已准备" : "人工激活指挥仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("manual_activation_command_boundary", "Command Center 边界", "只展示人工激活准备状态，不激活 sandbox，不启动 provider。", "pass"),
      row("manual_activation_command_runtime", "运行边界", "不创建 release/tag，不 push，不发邮件，不创建审批任务。", "pass")
    ].concat(commandStages.map(function (item) {
      return row(item.stageId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function buildGlobalShoppingManualActivationCommandCenterAuditDraft(input) {
    const center = buildGlobalShoppingManualActivationCommandCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_ACTIVATION_COMMAND_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_ACTIVATION_COMMAND_CENTER_VERSION,
      status:center.status,
      commandStageCount:obj(center.commandSummary).commandStageCount || 0,
      blockedReasonCount:toArray(center.blockedReasons).length,
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

  function sanitizeGlobalShoppingManualActivationCommandCenter(center) {
    return evaluateGlobalShoppingManualActivationCommandCenter(center || {});
  }

  function buildGlobalShoppingManualActivationCommandCenter(input) {
    try {
      return evaluateGlobalShoppingManualActivationCommandCenter(input || {});
    } catch (_) {
      return evaluateGlobalShoppingManualActivationCommandCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualActivationCommandCenter = {
    GLOBAL_SHOPPING_MANUAL_ACTIVATION_COMMAND_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingManualActivationCommandCenter,
    evaluateGlobalShoppingManualActivationCommandCenter,
    buildGlobalShoppingManualActivationCommandRows,
    buildGlobalShoppingManualActivationCommandStages,
    buildGlobalShoppingManualActivationCommandCenterAuditDraft,
    sanitizeGlobalShoppingManualActivationCommandCenter
  };
})();
