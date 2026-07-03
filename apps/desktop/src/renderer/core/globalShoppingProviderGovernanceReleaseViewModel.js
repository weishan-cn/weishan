;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_RELEASE_VIEW_MODEL_VERSION = "4.0.7";
  const VIEW_MODEL_NAME = "global_shopping_provider_governance_release_view_model_v1";
  const BUILD_GUARD_KEY = "__weishanGlobalShoppingProviderGovernanceReleaseViewModelBuilding";

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
  function directSummary(input, key) {
    const safe = obj(input);
    return present(safe[key]) ? obj(safe[key]) : {};
  }
  function card(cardId, label, value) { return { cardId:text(cardId), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }

  function buildGlobalShoppingProviderGovernanceReleaseRows(input) {
    const safe = obj(input);
    const hasDirectSummaries = Object.prototype.hasOwnProperty.call(safe, "governanceAuditConsoleSummary") ||
      Object.prototype.hasOwnProperty.call(safe, "humanPilotReadinessLedgerSummary") ||
      Object.prototype.hasOwnProperty.call(safe, "releaseFreezeGateSummary");
    const evaluation = hasDirectSummaries ? {
      governanceAuditConsoleSummary:obj(safe.governanceAuditConsoleSummary),
      humanPilotReadinessLedgerSummary:obj(safe.humanPilotReadinessLedgerSummary),
      releaseFreezeGateSummary:obj(safe.releaseFreezeGateSummary),
      status:text(safe.status || "needs_review")
    } : buildGlobalShoppingProviderGovernanceReleaseViewModel(input);
    return clone([
      row("governance_audit", "Provider Governance 审计控制台", obj(obj(evaluation.governanceAuditConsoleSummary).userFacingSummary).resultLabel || "治理审计仍需复核", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("human_pilot_ledger", "Human Pilot 准备台账", obj(obj(evaluation.humanPilotReadinessLedgerSummary).userFacingSummary).resultLabel || "Human Pilot 准备仍需复核", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("release_freeze", "Sandbox Provider Release Freeze Gate", obj(obj(evaluation.releaseFreezeGateSummary).userFacingSummary).resultLabel || "Release Freeze 仍需复核", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("risk_disclosure", "风险说明", "当前只展示 provider governance 发布审计与冻结闸门，不接真实 provider，不读取密钥，不联网，不改 git，不 push，不导出文件。", "pass")
    ]);
  }

  function buildGlobalShoppingHumanPilotReadinessRowsForView(input) {
    const ledger = resolveSummary(input, "humanPilotReadinessLedgerSummary", "WeishanGlobalShoppingHumanPilotReadinessLedger", "buildGlobalShoppingHumanPilotReadinessLedger");
    return toArray(ledger.rows).length ? clone(ledger.rows) : clone([row("human_pilot_ledger_missing", "Human Pilot 台账", "Human Pilot 准备仍需复核", "warning")]);
  }

  function buildGlobalShoppingReleaseFreezeRowsForView(input) {
    const gate = resolveSummary(input, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    return toArray(gate.rows).length ? clone(gate.rows) : clone([row("release_freeze_missing", "Release Freeze", "Release Freeze 仍需复核", "warning")]);
  }

  function buildGlobalShoppingProviderGovernanceReleaseCards(input) {
    const safe = obj(input);
    const hasDirectSummaries = Object.prototype.hasOwnProperty.call(safe, "governanceAuditConsoleSummary") ||
      Object.prototype.hasOwnProperty.call(safe, "humanPilotReadinessLedgerSummary") ||
      Object.prototype.hasOwnProperty.call(safe, "releaseFreezeGateSummary");
    const evaluation = hasDirectSummaries ? {
      governanceAuditConsoleSummary:obj(safe.governanceAuditConsoleSummary),
      humanPilotReadinessLedgerSummary:obj(safe.humanPilotReadinessLedgerSummary),
      releaseFreezeGateSummary:obj(safe.releaseFreezeGateSummary)
    } : buildGlobalShoppingProviderGovernanceReleaseViewModel(input);
    return clone([
      card("governance_audit", "治理审计", obj(obj(evaluation.governanceAuditConsoleSummary).userFacingSummary).resultLabel || "治理审计仍需复核"),
      card("human_pilot_ledger", "Human Pilot 台账", obj(obj(evaluation.humanPilotReadinessLedgerSummary).userFacingSummary).resultLabel || "Human Pilot 准备仍需复核"),
      card("release_freeze", "Release Freeze", obj(obj(evaluation.releaseFreezeGateSummary).userFacingSummary).resultLabel || "Release Freeze 仍需复核"),
      card("risk_disclosure", "风险说明", "Manual governance release decision 仍需人工确认")
    ]);
  }

  function sanitizeGlobalShoppingProviderGovernanceReleaseViewModel(viewModel) {
    const safe = obj(viewModel);
    const governanceAuditConsoleSummary = directSummary(safe, "governanceAuditConsoleSummary");
    const humanPilotReadinessLedgerSummary = directSummary(safe, "humanPilotReadinessLedgerSummary");
    const releaseFreezeGateSummary = directSummary(safe, "releaseFreezeGateSummary");
    const blocked = safe.startRealProvider === true || safe.startPilot === true || safe.showCredentialInput === true || safe.readApiKey === true ||
      safe.network === true || safe.generateEndpoint === true || safe.openExternal === true || safe.windowOpen === true || safe.enableProductionProvider === true ||
      safe.createApprovalTask === true || safe.sendEmail === true || safe.openExternalDocument === true || safe.executeRollback === true || safe.modifyRuntimeConfig === true ||
      safe.enableProvider === true || safe.disableProvider === true || safe.download === true || safe.exportRealFile === true || safe.createTag === true || safe.push === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true || !!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl) ||
      statusOf(governanceAuditConsoleSummary) === "blocked" || statusOf(humanPilotReadinessLedgerSummary) === "blocked" || statusOf(releaseFreezeGateSummary) === "blocked";
    const missing = !present(governanceAuditConsoleSummary) || !present(humanPilotReadinessLedgerSummary) || !present(releaseFreezeGateSummary);
    const status = blocked ? "blocked" : (missing ? "needs_review" : "ready");

    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_RELEASE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Governance 发布审计与冻结闸门",
      cards:buildGlobalShoppingProviderGovernanceReleaseCards({
        governanceAuditConsoleSummary:governanceAuditConsoleSummary,
        humanPilotReadinessLedgerSummary:humanPilotReadinessLedgerSummary,
        releaseFreezeGateSummary:releaseFreezeGateSummary
      }),
      governanceAuditRows:toArray(governanceAuditConsoleSummary.rows).length ? clone(governanceAuditConsoleSummary.rows) : clone([row("governance_audit_missing", "治理审计", "治理审计仍需复核", "warning")]),
      humanPilotLedgerRows:buildGlobalShoppingHumanPilotReadinessRowsForView({ humanPilotReadinessLedgerSummary:humanPilotReadinessLedgerSummary }),
      releaseFreezeRows:buildGlobalShoppingReleaseFreezeRowsForView({ releaseFreezeGateSummary:releaseFreezeGateSummary }),
      disclosureRows:[
        row("audit_console_only", "治理审计不写文件、不上传", "治理审计不写文件、不上传", "pass"),
        row("human_pilot_no_persistence", "Human Pilot 台账不持久化审批结果", "Human Pilot 台账不持久化审批结果", "pass"),
        row("freeze_gate_no_git_push", "Release Freeze Gate 不改 git、不 push", "Release Freeze Gate 不改 git、不 push", "pass"),
        row("manual_release_decision_required", "Manual governance release decision 仍需人工确认", "Manual governance release decision 仍需人工确认", "warning")
      ],
      governanceAuditConsoleSummary:clone(governanceAuditConsoleSummary),
      humanPilotReadinessLedgerSummary:clone(humanPilotReadinessLedgerSummary),
      releaseFreezeGateSummary:clone(releaseFreezeGateSummary),
      caveat:"当前只展示 provider governance 发布审计与冻结闸门，不接真实 provider，不读取密钥，不联网，不改 git，不 push，不导出文件。"
    });
  }

  function buildGlobalShoppingProviderGovernanceReleaseViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderGovernanceReleaseViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_RELEASE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_RELEASE_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderGovernanceReleaseViewModel(input) {
    if (window[BUILD_GUARD_KEY] === true) {
      return sanitizeGlobalShoppingProviderGovernanceReleaseViewModel({ status:"needs_review" });
    }
    window[BUILD_GUARD_KEY] = true;
    try {
      return sanitizeGlobalShoppingProviderGovernanceReleaseViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderGovernanceReleaseViewModel({ status:"failed_safe" });
    } finally {
      window[BUILD_GUARD_KEY] = false;
    }
  }

  window.WeishanGlobalShoppingProviderGovernanceReleaseViewModel = {
    GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_RELEASE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderGovernanceReleaseViewModel,
    buildGlobalShoppingProviderGovernanceReleaseCards,
    buildGlobalShoppingProviderGovernanceReleaseRows,
    buildGlobalShoppingHumanPilotReadinessRowsForView,
    buildGlobalShoppingReleaseFreezeRowsForView,
    buildGlobalShoppingProviderGovernanceReleaseViewModelAuditDraft,
    sanitizeGlobalShoppingProviderGovernanceReleaseViewModel
  };
})();
