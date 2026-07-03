;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HUMAN_ACTIVATION_RUNBOOK_CENTER_VERSION = "4.1.3";
  const CENTER_NAME = "global_shopping_human_activation_runbook_center_v1";

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
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function stage(stageId, label, status, summary, caveat) {
    return { stageId:text(stageId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.createTask === true ? "task_creation_detected" : "",
      safe.persistRunbookResult === true ? "runbook_result_persistence_detected" : "",
      safe.sendEmail === true ? "email_send_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_start_detected" : "",
      safe.enableProvider === true ? "provider_enablement_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingHumanActivationRunbookStages(input) {
    const safe = obj(input);
    const qaMatrix = resolveSummary(safe, "mockSandboxQaMatrixSummary", "WeishanGlobalShoppingMockSandboxQaMatrix", "buildGlobalShoppingMockSandboxQaMatrix");
    const commandCenter = resolveSummary(safe, "manualActivationCommandCenterSummary", "WeishanGlobalShoppingManualActivationCommandCenter", "buildGlobalShoppingManualActivationCommandCenter");
    const dryRunChecklist = resolveSummary(safe, "manualActivationDryRunChecklistSummary", "WeishanGlobalShoppingManualActivationDryRunChecklist", "buildGlobalShoppingManualActivationDryRunChecklist");
    const handoffPacket = resolveSummary(safe, "manualActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    const releaseFreezeGate = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    const list = [
      ["mock_sandbox_qa_matrix", "Mock Sandbox QA Matrix", qaMatrix, "只展示离线 QA 矩阵，不运行真实 provider。"],
      ["manual_activation_command_center", "Manual Activation Command Center", commandCenter, "只展示人工指挥，不激活 sandbox。"],
      ["manual_activation_dry_run_checklist", "Manual Activation Dry-Run Checklist", dryRunChecklist, "只展示人工 dry-run 检查清单。"],
      ["manual_activation_handoff_packet", "Manual Activation Handoff Packet", handoffPacket, "只展示交接包，不创建任务。"],
      ["release_freeze_gate", "Release Freeze Gate", releaseFreezeGate, "只展示冻结门，不创建 release/tag。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      const status = !present(summary) ? "needs_review" : (safeStatus(summary.status) === "failed_safe" ? "blocked" : safeStatus(summary.status));
      return stage(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function buildGlobalShoppingHumanActivationRunbookRows(input) {
    const safe = obj(input);
    const runbookStages = toArray(safe.runbookStages).length ? toArray(safe.runbookStages) : buildGlobalShoppingHumanActivationRunbookStages(safe);
    return clone([
      row("human_activation_runbook_center_status", "Human Activation Runbook Center 状态", obj(safe.userFacingSummary).resultLabel || "人工激活运行手册仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("human_activation_runbook_center_boundary", "运行手册边界", "当前只读、人工、离线，不创建任务，不发邮件，不激活 sandbox。", "pass")
    ].concat(runbookStages.map(function (item) {
      return row(item.stageId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingHumanActivationRunbookCenter(input) {
    const safe = obj(input);
    const runbookStages = buildGlobalShoppingHumanActivationRunbookStages(safe);
    const blockedReasons = blockedReasonList(safe).concat(runbookStages.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.stageId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (runbookStages.some(function (item) { return item.status === "needs_review"; }) ? "needs_review" : "ready");
    const center = {
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_ACTIVATION_RUNBOOK_CENTER_VERSION,
      status:status,
      runbookBoundary:{
        centerId:"global-shopping-human-activation-runbook-center",
        centerMode:"runbook_only",
        runbookOnly:true,
        manualOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canCreateTask:false,
        canPersistRunbookResult:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      runbookSummary:{
        hasQaMatrix:runbookStages[0].status !== "needs_review",
        hasManualActivationCommandCenter:runbookStages[1].status !== "needs_review",
        hasManualActivationDryRunChecklist:runbookStages[2].status !== "needs_review",
        hasManualActivationHandoffPacket:runbookStages[3].status !== "needs_review",
        hasReleaseFreezeGate:runbookStages[4].status !== "needs_review",
        runbookStageCount:runbookStages.length,
        blockedRunbookStageCount:runbookStages.filter(function (item) { return item.status === "blocked"; }).length,
        needsReviewRunbookStageCount:runbookStages.filter(function (item) { return item.status === "needs_review"; }).length,
        readyForAdapterComplianceChecklist:status === "ready",
        manualActivationStillRequired:true
      },
      runbookStages:runbookStages,
      rows:[],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Human Activation Runbook Center",
        resultLabel:status === "ready" ? "人工激活运行手册已准备" : (status === "blocked" ? "人工激活运行手册已阻断" : "人工激活运行手册仍需复核"),
        caveat:"该运行手册只展示人工激活步骤，不创建任务，不激活 sandbox，不创建 release，不 push。"
      },
      safety:safety(),
      redacted:true
    };
    center.rows = buildGlobalShoppingHumanActivationRunbookRows(center);
    return clone(center);
  }

  function buildGlobalShoppingHumanActivationRunbookCenterAuditDraft(input) {
    const center = buildGlobalShoppingHumanActivationRunbookCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HUMAN_ACTIVATION_RUNBOOK_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_ACTIVATION_RUNBOOK_CENTER_VERSION,
      status:center.status,
      runbookStageCount:obj(center.runbookSummary).runbookStageCount || 0,
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

  function sanitizeGlobalShoppingHumanActivationRunbookCenter(center) {
    return evaluateGlobalShoppingHumanActivationRunbookCenter(center || {});
  }

  function buildGlobalShoppingHumanActivationRunbookCenter(input) {
    try {
      return evaluateGlobalShoppingHumanActivationRunbookCenter(input || {});
    } catch (_) {
      return evaluateGlobalShoppingHumanActivationRunbookCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingHumanActivationRunbookCenter = {
    GLOBAL_SHOPPING_HUMAN_ACTIVATION_RUNBOOK_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingHumanActivationRunbookCenter,
    evaluateGlobalShoppingHumanActivationRunbookCenter,
    buildGlobalShoppingHumanActivationRunbookRows,
    buildGlobalShoppingHumanActivationRunbookStages,
    buildGlobalShoppingHumanActivationRunbookCenterAuditDraft,
    sanitizeGlobalShoppingHumanActivationRunbookCenter
  };
})();
