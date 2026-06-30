;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_LAUNCH_SIMULATION_VIEW_MODEL_VERSION = "2.3.9";
  const VIEW_MODEL_NAME = "global_shopping_provider_launch_simulation_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false, download:false, realNameStored:false, phoneStored:false, emailStored:false, identityUpload:false, credentialInput:false,
      rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false, redacted:true
    }, obj(overrides));
  }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }
  function rowsFrom(list, fallbackLabel) {
    return toArray(list).map(function (item, index) {
      const safe = obj(item);
      return row(safe.rowId || safe.gateId || safe.stepId || safe.stageId || ("row_" + index), safe.label || fallbackLabel || "摘要", safe.value || safe.summary || "", safe.status || "warning");
    });
  }

  function evaluate(input) {
    const safe = obj(input);
    const humanApprovalSimulationGateSummary = resolveSummary(safe, "humanApprovalSimulationGateSummary", "WeishanGlobalShoppingHumanApprovalSimulationGate", "buildGlobalShoppingHumanApprovalSimulationGate", safe);
    const mockProviderLaunchDrillSummary = resolveSummary(safe, "mockProviderLaunchDrillSummary", "WeishanGlobalShoppingMockProviderLaunchDrill", "buildGlobalShoppingMockProviderLaunchDrill", safe);
    const sandboxProviderRollbackPlanSummary = resolveSummary(safe, "sandboxProviderRollbackPlanSummary", "WeishanGlobalShoppingSandboxProviderRollbackPlan", "buildGlobalShoppingSandboxProviderRollbackPlan", safe);
    const blocked =
      statusOf(humanApprovalSimulationGateSummary) === "blocked" ||
      statusOf(mockProviderLaunchDrillSummary) === "blocked" ||
      statusOf(sandboxProviderRollbackPlanSummary) === "blocked" ||
      safe.startRealProvider === true ||
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
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready =
      statusOf(humanApprovalSimulationGateSummary) === "ready" &&
      statusOf(mockProviderLaunchDrillSummary) === "ready" &&
      statusOf(sandboxProviderRollbackPlanSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      humanApprovalSimulationGateSummary:clone(humanApprovalSimulationGateSummary),
      mockProviderLaunchDrillSummary:clone(mockProviderLaunchDrillSummary),
      sandboxProviderRollbackPlanSummary:clone(sandboxProviderRollbackPlanSummary),
      blockedReasons:blocked ? ["provider_launch_simulation_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLaunchSimulationCards(input) {
    const evaluation = evaluate(input);
    return clone([
      card("human_approval", "人工审批模拟", obj(obj(evaluation.humanApprovalSimulationGateSummary).userFacingSummary).resultLabel || "审批模拟仍需复核"),
      card("mock_launch_drill", "Mock 启动演练", obj(obj(evaluation.mockProviderLaunchDrillSummary).userFacingSummary).resultLabel || "Mock 启动演练仍需复核"),
      card("rollback_plan", "回滚预案", obj(obj(evaluation.sandboxProviderRollbackPlanSummary).userFacingSummary).resultLabel || "回滚预案仍需复核"),
      card("risk_disclosure", "风险说明", "真实 sandbox provider pilot 仍需人工控制")
    ]);
  }

  function buildGlobalShoppingHumanApprovalRowsForView(input) {
    return rowsFrom(obj(evaluate(input).humanApprovalSimulationGateSummary).rows, "人工审批模拟");
  }

  function buildGlobalShoppingProviderLaunchSimulationRows(input) {
    return rowsFrom(obj(evaluate(input).mockProviderLaunchDrillSummary).rows, "Mock 启动演练");
  }

  function buildGlobalShoppingRollbackPlanRowsForView(input) {
    return rowsFrom(obj(evaluate(input).sandboxProviderRollbackPlanSummary).rows, "回滚预案");
  }

  function buildGlobalShoppingProviderLaunchSimulationViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderLaunchSimulationViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_LAUNCH_SIMULATION_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_SIMULATION_VIEW_MODEL_VERSION,
      status:viewModel.status,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null,
      payment:false, order:false, ticketing:false, autoOpen:false, autoRefresh:false,
      fileWrite:false, download:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, redacted:true
    });
  }

  function sanitizeGlobalShoppingProviderLaunchSimulationViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_SIMULATION_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider 启动模拟与回滚预案",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderLaunchSimulationCards(safe),
      humanApprovalRows:toArray(safe.humanApprovalRows).length ? toArray(safe.humanApprovalRows) : buildGlobalShoppingHumanApprovalRowsForView(safe),
      mockLaunchRows:toArray(safe.mockLaunchRows).length ? toArray(safe.mockLaunchRows) : buildGlobalShoppingProviderLaunchSimulationRows(safe),
      rollbackPlanRows:toArray(safe.rollbackPlanRows).length ? toArray(safe.rollbackPlanRows) : buildGlobalShoppingRollbackPlanRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("launch_simulation_scope", "当前范围", "当前只展示 provider 启动模拟和回滚预案", "pass"),
        row("launch_simulation_boundary", "安全边界", "不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚", "pass"),
        row("launch_simulation_approval", "审批模拟", "审批模拟不代表真实审批完成", "pass"),
        row("launch_simulation_human_control", "人工控制", "真实 sandbox provider pilot 仍需人工控制", "pass")
      ],
      caveat:"当前只展示 provider 启动模拟和回滚预案，不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚。",
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderLaunchSimulationViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderLaunchSimulationViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderLaunchSimulationViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderLaunchSimulationViewModel = {
    GLOBAL_SHOPPING_PROVIDER_LAUNCH_SIMULATION_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderLaunchSimulationViewModel,
    buildGlobalShoppingProviderLaunchSimulationCards,
    buildGlobalShoppingProviderLaunchSimulationRows,
    buildGlobalShoppingHumanApprovalRowsForView,
    buildGlobalShoppingRollbackPlanRowsForView,
    buildGlobalShoppingProviderLaunchSimulationViewModelAuditDraft,
    sanitizeGlobalShoppingProviderLaunchSimulationViewModel
  };
})();
