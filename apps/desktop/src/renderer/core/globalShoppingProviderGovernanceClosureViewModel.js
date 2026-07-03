;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_VIEW_MODEL_VERSION = "4.1.7";
  const VIEW_MODEL_NAME = "global_shopping_provider_governance_closure_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function rowsFor(summary, emptyId, emptyLabel, emptyValue) {
    return toArray(obj(summary).rows).length ? clone(summary.rows) : [row(emptyId, emptyLabel, emptyValue, "warning")];
  }

  function buildGlobalShoppingProviderGovernanceClosureCards(input) {
    const safe = obj(input);
    const offlineProviderGovernanceClosureBoardSummary = resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard");
    const noActivationComplianceSealSummary = resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal");
    const finalReadinessHandoffSimulatorSummary = resolveSummary(safe, "finalReadinessHandoffSimulatorSummary", "WeishanGlobalShoppingFinalReadinessHandoffSimulator", "buildGlobalShoppingFinalReadinessHandoffSimulator");
    const providerGovernanceClosureEvidenceLedgerSummary = resolveSummary(safe, "providerGovernanceClosureEvidenceLedgerSummary", "WeishanGlobalShoppingProviderGovernanceClosureEvidenceLedger", "buildGlobalShoppingProviderGovernanceClosureEvidenceLedger");
    return clone([
      card("offline_provider_governance_closure_board", "Governance Closure", labelOf(offlineProviderGovernanceClosureBoardSummary, "Governance Closure 仍需复核")),
      card("no_activation_compliance_seal", "No-Activation Seal", labelOf(noActivationComplianceSealSummary, "No-Activation Seal 仍需复核")),
      card("final_readiness_handoff_simulator", "Final Handoff", labelOf(finalReadinessHandoffSimulatorSummary, "Final Handoff 仍需复核")),
      card("provider_governance_closure_evidence_ledger", "Closure Evidence", labelOf(providerGovernanceClosureEvidenceLedgerSummary, "Closure Evidence 仍需复核")),
      card("risk_disclosure", "风险说明", "Human governance closure review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingGovernanceClosureRowsForView(input) {
    const summary = resolveSummary(input, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard");
    return rowsFor(summary, "offline_provider_governance_closure_board_missing", "Offline Provider Governance Closure Board", "Offline Provider Governance Closure Board 仍需复核");
  }

  function buildGlobalShoppingNoActivationSealRowsForView(input) {
    const summary = resolveSummary(input, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal");
    return rowsFor(summary, "no_activation_compliance_seal_missing", "No-Activation Compliance Seal", "No-Activation Compliance Seal 仍需复核");
  }

  function buildGlobalShoppingFinalHandoffRowsForView(input) {
    const summary = resolveSummary(input, "finalReadinessHandoffSimulatorSummary", "WeishanGlobalShoppingFinalReadinessHandoffSimulator", "buildGlobalShoppingFinalReadinessHandoffSimulator");
    return rowsFor(summary, "final_readiness_handoff_simulator_missing", "Final Readiness Handoff Simulator", "Final Readiness Handoff Simulator 仍需复核");
  }

  function buildGlobalShoppingClosureEvidenceRowsForView(input) {
    const summary = resolveSummary(input, "providerGovernanceClosureEvidenceLedgerSummary", "WeishanGlobalShoppingProviderGovernanceClosureEvidenceLedger", "buildGlobalShoppingProviderGovernanceClosureEvidenceLedger");
    return rowsFor(summary, "provider_governance_closure_evidence_ledger_missing", "Provider Governance Closure Evidence Ledger", "Provider Governance Closure Evidence Ledger 仍需复核");
  }

  function buildGlobalShoppingProviderGovernanceClosureRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_governance_closure_view_model_status", "Provider Governance Closure Review", "当前只展示 provider governance closure review", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_governance_closure_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderGovernanceClosureViewModel(viewModel) {
    const safe = obj(viewModel);
    const offlineProviderGovernanceClosureBoardSummary = resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard");
    const noActivationComplianceSealSummary = resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal");
    const finalReadinessHandoffSimulatorSummary = resolveSummary(safe, "finalReadinessHandoffSimulatorSummary", "WeishanGlobalShoppingFinalReadinessHandoffSimulator", "buildGlobalShoppingFinalReadinessHandoffSimulator");
    const providerGovernanceClosureEvidenceLedgerSummary = resolveSummary(safe, "providerGovernanceClosureEvidenceLedgerSummary", "WeishanGlobalShoppingProviderGovernanceClosureEvidenceLedger", "buildGlobalShoppingProviderGovernanceClosureEvidenceLedger");
    const statuses = [
      safeStatus(offlineProviderGovernanceClosureBoardSummary.status),
      safeStatus(noActivationComplianceSealSummary.status),
      safeStatus(finalReadinessHandoffSimulatorSummary.status),
      safeStatus(providerGovernanceClosureEvidenceLedgerSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(offlineProviderGovernanceClosureBoardSummary) ||
      !present(noActivationComplianceSealSummary) ||
      !present(finalReadinessHandoffSimulatorSummary) ||
      !present(providerGovernanceClosureEvidenceLedgerSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Governance Closure Review",
      cards:buildGlobalShoppingProviderGovernanceClosureCards({
        offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary,
        noActivationComplianceSealSummary:noActivationComplianceSealSummary,
        finalReadinessHandoffSimulatorSummary:finalReadinessHandoffSimulatorSummary,
        providerGovernanceClosureEvidenceLedgerSummary:providerGovernanceClosureEvidenceLedgerSummary
      }),
      governanceClosureRows:buildGlobalShoppingGovernanceClosureRowsForView({ offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary }),
      noActivationSealRows:buildGlobalShoppingNoActivationSealRowsForView({ noActivationComplianceSealSummary:noActivationComplianceSealSummary }),
      finalHandoffRows:buildGlobalShoppingFinalHandoffRowsForView({ finalReadinessHandoffSimulatorSummary:finalReadinessHandoffSimulatorSummary }),
      closureEvidenceRows:buildGlobalShoppingClosureEvidenceRowsForView({ providerGovernanceClosureEvidenceLedgerSummary:providerGovernanceClosureEvidenceLedgerSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_governance_closure_view_model_disclosure_board", "Offline Provider Governance Closure Board", "Governance Closure 不保存真实治理结论", "pass"),
        row("provider_governance_closure_view_model_disclosure_seal", "No-Activation Compliance Seal", "No-Activation Seal 不生成真实封条、不执行真实阻断", "pass"),
        row("provider_governance_closure_view_model_disclosure_handoff", "Final Readiness Handoff Simulator", "Final Handoff 不执行真实交接", "pass"),
        row("provider_governance_closure_view_model_disclosure_evidence", "Provider Governance Closure Evidence Ledger", "Closure Evidence 不持久化台账、不保存真实 evidence", "pass"),
        row("provider_governance_closure_view_model_disclosure_manual", "风险说明", "Human governance closure review 仍需人工复核", "warning")
      ],
      rows:buildGlobalShoppingProviderGovernanceClosureRows({ status:status }),
      caveat:"当前只展示 provider governance closure review，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。",
      offlineProviderGovernanceClosureBoardSummary:clone(offlineProviderGovernanceClosureBoardSummary),
      noActivationComplianceSealSummary:clone(noActivationComplianceSealSummary),
      finalReadinessHandoffSimulatorSummary:clone(finalReadinessHandoffSimulatorSummary),
      providerGovernanceClosureEvidenceLedgerSummary:clone(providerGovernanceClosureEvidenceLedgerSummary),
      safeToProceedWithHumanGovernanceClosureReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderGovernanceClosureViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderGovernanceClosureViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_VIEW_MODEL_VERSION,
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
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function buildGlobalShoppingProviderGovernanceClosureViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderGovernanceClosureViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderGovernanceClosureViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderGovernanceClosureViewModel = {
    GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderGovernanceClosureViewModel,
    buildGlobalShoppingProviderGovernanceClosureCards,
    buildGlobalShoppingProviderGovernanceClosureRows,
    buildGlobalShoppingGovernanceClosureRowsForView,
    buildGlobalShoppingNoActivationSealRowsForView,
    buildGlobalShoppingFinalHandoffRowsForView,
    buildGlobalShoppingClosureEvidenceRowsForView,
    buildGlobalShoppingProviderGovernanceClosureViewModelAuditDraft,
    sanitizeGlobalShoppingProviderGovernanceClosureViewModel
  };
})();
