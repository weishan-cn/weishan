;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_PILOT_GOVERNANCE_VIEW_MODEL_VERSION = "2.3.6";
  const VIEW_MODEL_NAME = "global_shopping_provider_pilot_governance_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
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
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }
  function rowsFrom(list, fallbackLabel) {
    return toArray(list).map(function (item, index) {
      const safe = obj(item);
      return row(
        safe.rowId || safe.categoryId || safe.stageId || safe.triggerId || ("row_" + index),
        safe.label || fallbackLabel || "摘要",
        safe.value || safe.summary || "",
        safe.status === "pass" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")
      );
    });
  }

  function evaluate(input) {
    const safe = obj(input);
    const humanControlledSandboxProviderPilotPlannerSummary = resolveSummary(safe, "humanControlledSandboxProviderPilotPlannerSummary", "WeishanGlobalShoppingHumanControlledSandboxProviderPilotPlanner", "buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner", safe);
    const providerKillSwitchDrillSummary = resolveSummary(safe, "providerKillSwitchDrillSummary", "WeishanGlobalShoppingProviderKillSwitchDrill", "buildGlobalShoppingProviderKillSwitchDrill", safe);
    const complianceEvidencePackSummary = resolveSummary(safe, "complianceEvidencePackSummary", "WeishanGlobalShoppingComplianceEvidencePack", "buildGlobalShoppingComplianceEvidencePack", safe);
    const blocked =
      statusOf(humanControlledSandboxProviderPilotPlannerSummary) === "blocked" ||
      statusOf(providerKillSwitchDrillSummary) === "blocked" ||
      statusOf(complianceEvidencePackSummary) === "blocked" ||
      safe.startRealProvider === true ||
      safe.startPilot === true ||
      safe.showCredentialInput === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.generateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.enableProductionProvider === true ||
      safe.executeRollback === true ||
      safe.modifyRuntimeConfig === true ||
      safe.enableProvider === true ||
      safe.disableProvider === true ||
      safe.download === true ||
      safe.exportRealFile === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready =
      statusOf(humanControlledSandboxProviderPilotPlannerSummary) === "ready" &&
      statusOf(providerKillSwitchDrillSummary) === "ready" &&
      statusOf(complianceEvidencePackSummary) === "ready";
    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      humanControlledSandboxProviderPilotPlannerSummary:clone(humanControlledSandboxProviderPilotPlannerSummary),
      providerKillSwitchDrillSummary:clone(providerKillSwitchDrillSummary),
      complianceEvidencePackSummary:clone(complianceEvidencePackSummary),
      blockedReasons:blocked ? ["provider_pilot_governance_view_model_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderPilotGovernanceCards(input) {
    const evaluation = evaluate(input);
    return clone([
      card("pilot_planner", "Pilot 计划", obj(obj(evaluation.humanControlledSandboxProviderPilotPlannerSummary).userFacingSummary).resultLabel || "Pilot 计划仍需复核"),
      card("kill_switch", "Kill Switch", obj(obj(evaluation.providerKillSwitchDrillSummary).userFacingSummary).resultLabel || "Kill Switch 演练仍需复核"),
      card("compliance_evidence", "合规证据", obj(obj(evaluation.complianceEvidencePackSummary).userFacingSummary).resultLabel || "合规证据仍需复核"),
      card("risk_disclosure", "风险说明", "Human audit 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingProviderPilotGovernanceRows(input) {
    return rowsFrom(obj(evaluate(input).humanControlledSandboxProviderPilotPlannerSummary).rows, "Pilot 计划");
  }

  function buildGlobalShoppingKillSwitchRowsForView(input) {
    return rowsFrom(obj(evaluate(input).providerKillSwitchDrillSummary).rows, "Kill Switch");
  }

  function buildGlobalShoppingComplianceEvidenceRowsForView(input) {
    return rowsFrom(obj(evaluate(input).complianceEvidencePackSummary).rows, "合规证据");
  }

  function buildGlobalShoppingProviderPilotGovernanceViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderPilotGovernanceViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_PILOT_GOVERNANCE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PILOT_GOVERNANCE_VIEW_MODEL_VERSION,
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

  function sanitizeGlobalShoppingProviderPilotGovernanceViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PILOT_GOVERNANCE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Pilot 治理与合规证据",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderPilotGovernanceCards(safe),
      pilotPlannerRows:toArray(safe.pilotPlannerRows).length ? toArray(safe.pilotPlannerRows) : buildGlobalShoppingProviderPilotGovernanceRows(safe),
      killSwitchRows:toArray(safe.killSwitchRows).length ? toArray(safe.killSwitchRows) : buildGlobalShoppingKillSwitchRowsForView(safe),
      complianceEvidenceRows:toArray(safe.complianceEvidenceRows).length ? toArray(safe.complianceEvidenceRows) : buildGlobalShoppingComplianceEvidenceRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_pilot_governance_scope", "当前范围", "当前只展示 provider pilot 治理和合规证据", "pass"),
        row("provider_pilot_governance_boundary", "安全边界", "不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚，不导出文件", "pass"),
        row("provider_pilot_governance_human_audit", "人工复核", "Human audit 仍需人工复核", "pass"),
        row("provider_pilot_governance_controls", "禁用操作", "不提供启动 pilot、真实 provider、审批、邮件、回滚、导出、平台跳转按钮", "pass")
      ],
      caveat:"当前只展示 provider pilot 治理和合规证据，不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚，不导出文件。",
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderPilotGovernanceViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderPilotGovernanceViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderPilotGovernanceViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderPilotGovernanceViewModel = {
    GLOBAL_SHOPPING_PROVIDER_PILOT_GOVERNANCE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderPilotGovernanceViewModel,
    buildGlobalShoppingProviderPilotGovernanceCards,
    buildGlobalShoppingProviderPilotGovernanceRows,
    buildGlobalShoppingKillSwitchRowsForView,
    buildGlobalShoppingComplianceEvidenceRowsForView,
    buildGlobalShoppingProviderPilotGovernanceViewModelAuditDraft,
    sanitizeGlobalShoppingProviderPilotGovernanceViewModel
  };
})();
