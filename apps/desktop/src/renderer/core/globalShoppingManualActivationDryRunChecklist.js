;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_VERSION = "2.4.1";
  const CHECKLIST_NAME = "global_shopping_manual_activation_dry_run_checklist_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function section(sectionId, label, status, ownerRole, summary, caveat) {
    return {
      sectionId:text(sectionId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      ownerRole:text(ownerRole || "human_reviewer"),
      requiredBeforeActivation:true,
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
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
  function safety(overrides) {
    return Object.assign({
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
    }, obj(overrides));
  }
  function normalize(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "failed_safe" || status === "fail") return "blocked";
    if (status === "ready" || status === "pass" || status === "clear" || status === "approved" || status === "allowed") return "pass";
    return "warning";
  }

  function buildGlobalShoppingManualActivationDryRunSections(input) {
    const safe = obj(input);
    const readOnlySandboxActivationReadinessCenterSummary = resolveSummary(safe, "readOnlySandboxActivationReadinessCenterSummary", "WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter", "buildGlobalShoppingReadOnlySandboxActivationReadinessCenter");
    const offlineSandboxTraceInspectorSummary = resolveSummary(safe, "offlineSandboxTraceInspectorSummary", "WeishanGlobalShoppingOfflineSandboxTraceInspector", "buildGlobalShoppingOfflineSandboxTraceInspector");
    const mockProviderResultNormalizerSummary = resolveSummary(safe, "mockProviderResultNormalizerSummary", "WeishanGlobalShoppingMockProviderResultNormalizer", "buildGlobalShoppingMockProviderResultNormalizer");
    const manualProviderActivationHandoffPacketSummary = resolveSummary(safe, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    const releaseFreezeGateSummary = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    const providerReadinessSignOffPacketSummary = resolveSummary(safe, "providerReadinessSignOffPacketSummary", "WeishanGlobalShoppingProviderReadinessSignOffPacket", "buildGlobalShoppingProviderReadinessSignOffPacket");
    return clone([
      section("activation_readiness_center", "只读 Sandbox 激活准备中心", normalize(readOnlySandboxActivationReadinessCenterSummary), "release_manager", labelOf(readOnlySandboxActivationReadinessCenterSummary, "Sandbox 激活准备仍需复核"), "只读展示，不激活 sandbox。"),
      section("offline_trace_inspector", "离线 Sandbox Trace 检查器", normalize(offlineSandboxTraceInspectorSummary), "qa", labelOf(offlineSandboxTraceInspectorSummary, "离线 Trace 检查仍需复核"), "只查看脱敏 trace summary。"),
      section("mock_result_normalizer", "Mock Provider 结果归一化器", normalize(mockProviderResultNormalizerSummary), "qa", labelOf(mockProviderResultNormalizerSummary, "Mock 结果归一化仍需复核"), "只处理 mock/fixture/dry-run 结果。"),
      section("manual_activation_handoff_packet", "人工 Provider 激活交接包", normalize(manualProviderActivationHandoffPacketSummary), "operator", labelOf(manualProviderActivationHandoffPacketSummary, "人工激活交接仍需复核"), "只展示交接摘要，不创建任务。"),
      section("release_freeze_gate", "Release Freeze Gate", normalize(releaseFreezeGateSummary), "security", labelOf(releaseFreezeGateSummary, "Release Freeze 仍需复核"), "只展示冻结条件，不创建 release。"),
      section("readiness_signoff_packet", "Provider 准备签核包", normalize(providerReadinessSignOffPacketSummary), "security", labelOf(providerReadinessSignOffPacketSummary, "准备签核仍需复核"), "只读展示，不发送邮件。")
    ]);
  }

  function buildGlobalShoppingManualActivationDryRunRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.checklistSections) ? {
      checklistSections:safe.checklistSections.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingManualActivationDryRunChecklist(input);
    return clone([
      row("manual_activation_dry_run_status", "激活 Dry-run 状态", obj(evaluation.userFacingSummary).resultLabel || "Dry-run 检查仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("manual_activation_dry_run_boundary", "Dry-run 边界", "只读展示检查项，不保存结果，不激活 sandbox，不创建 release。", "pass"),
      row("manual_activation_dry_run_owner", "人工责任边界", "仍需人工复核，不自动创建审批任务、不发邮件、不 push。", "pass")
    ].concat(toArray(evaluation.checklistSections).map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingManualActivationDryRunChecklist(input) {
    const safe = obj(input);
    const checklistSections = buildGlobalShoppingManualActivationDryRunSections(safe);
    const blockedBoundary =
      safe.persistChecklistResult === true ||
      safe.createApprovalTask === true ||
      safe.sendEmail === true ||
      safe.openExternalDocument === true ||
      safe.activateSandbox === true ||
      safe.startRealProvider === true ||
      safe.enableProvider === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.createRelease === true ||
      safe.createTag === true ||
      safe.push === true;
    const blockedChecklistSections = checklistSections.filter(function (item) { return item.status === "blocked"; });
    const missingChecklistSections = checklistSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || blockedChecklistSections.length ? "blocked" : (missingChecklistSections.length ? "needs_review" : "ready");
    const checklistSummary = {
      hasActivationReadinessCenter:checklistSections[0].status === "pass",
      hasOfflineSandboxTraceInspector:checklistSections[1].status === "pass",
      hasMockProviderResultNormalizer:checklistSections[2].status === "pass",
      hasManualActivationHandoffPacket:checklistSections[3].status === "pass",
      hasReleaseFreezeGate:checklistSections[4].status === "pass",
      hasReadinessSignOffPacket:checklistSections[5].status === "pass",
      checklistSectionCount:checklistSections.length,
      missingChecklistSectionCount:missingChecklistSections.length,
      blockedChecklistSectionCount:blockedChecklistSections.length,
      readyForManualSandboxActivationReview:status === "ready",
      manualActivationStillRequired:true
    };
    return clone({
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_VERSION,
      status:status,
      title:"人工激活 Dry-run 检查清单",
      checklistBoundary:{
        checklistId:"global-shopping-manual-activation-dry-run-checklist",
        checklistMode:"dry_run",
        checklistOnly:true,
        readinessOnly:true,
        dryRunOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistChecklistResult:false,
        canCreateApprovalTask:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      checklistSummary:checklistSummary,
      checklistSections:checklistSections,
      checklistHealth:{
        noChecklistPersistence:safe.persistChecklistResult !== true,
        noApprovalTaskCreation:safe.createApprovalTask !== true,
        noEmailSend:safe.sendEmail !== true,
        noExternalDocumentOpen:safe.openExternalDocument !== true,
        noSandboxActivation:safe.activateSandbox !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        noReleaseCreation:safe.createRelease !== true,
        noTagCreation:safe.createTag !== true,
        noPush:safe.push !== true,
        manualActivationStillRequired:true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingManualActivationDryRunRows({
        checklistSections:checklistSections,
        userFacingSummary:{
          resultLabel:status === "ready" ? "人工激活 Dry-run 检查清单已准备" : (status === "blocked" ? "Dry-run 检查已阻断" : "Dry-run 检查仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.persistChecklistResult === true ? "checklist_persistence_detected" : "",
          safe.createApprovalTask === true ? "approval_task_creation_detected" : "",
          safe.sendEmail === true ? "email_send_detected" : "",
          safe.openExternalDocument === true ? "external_document_open_detected" : "",
          safe.activateSandbox === true ? "sandbox_activation_detected" : "",
          safe.startRealProvider === true ? "real_provider_start_detected" : "",
          safe.enableProvider === true ? "provider_enablement_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.network === true ? "network_detected" : "",
          safe.createRelease === true ? "release_creation_detected" : "",
          safe.createTag === true ? "tag_creation_detected" : "",
          safe.push === true ? "push_detected" : ""
        ].filter(Boolean) : [])
        .concat(blockedChecklistSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"人工激活 Dry-run 检查清单",
        resultLabel:status === "ready" ? "Dry-run 检查清单已准备" : (status === "blocked" ? "Dry-run 检查已阻断" : "Dry-run 检查仍需复核"),
        caveat:"该清单只展示人工激活 dry-run 检查项，不保存结果，不激活 sandbox，不创建 release，不 push。"
      },
      auditDraft:{
        eventType:"GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_AUDIT_DRAFT",
        checklistName:CHECKLIST_NAME,
        appVersion:GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_VERSION,
        status:status,
        checklistSectionCount:checklistSummary.checklistSectionCount || 0,
        blockedChecklistSectionCount:checklistSummary.blockedChecklistSectionCount || 0,
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
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingManualActivationDryRunChecklist(input) {
    try {
      return evaluateGlobalShoppingManualActivationDryRunChecklist(input || {});
    } catch (_) {
      return evaluateGlobalShoppingManualActivationDryRunChecklist({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingManualActivationDryRunChecklistAuditDraft(input) {
    const checklist = buildGlobalShoppingManualActivationDryRunChecklist(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_AUDIT_DRAFT",
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_VERSION,
      status:checklist.status,
      checklistSectionCount:obj(checklist.checklistSummary).checklistSectionCount || 0,
      blockedChecklistSectionCount:obj(checklist.checklistSummary).blockedChecklistSectionCount || 0,
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

  function sanitizeGlobalShoppingManualActivationDryRunChecklist(checklist) {
    return evaluateGlobalShoppingManualActivationDryRunChecklist(checklist || {});
  }

  window.WeishanGlobalShoppingManualActivationDryRunChecklist = {
    GLOBAL_SHOPPING_MANUAL_ACTIVATION_DRY_RUN_CHECKLIST_VERSION,
    CHECKLIST_NAME,
    buildGlobalShoppingManualActivationDryRunChecklist,
    evaluateGlobalShoppingManualActivationDryRunChecklist,
    buildGlobalShoppingManualActivationDryRunRows,
    buildGlobalShoppingManualActivationDryRunSections,
    buildGlobalShoppingManualActivationDryRunChecklistAuditDraft,
    sanitizeGlobalShoppingManualActivationDryRunChecklist
  };
})();
