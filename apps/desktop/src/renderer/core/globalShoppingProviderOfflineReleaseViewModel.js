;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_VIEW_MODEL_VERSION = "4.0.3";
  const VIEW_MODEL_NAME = "global_shopping_provider_offline_release_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) {
    const value = text(obj(summary).status || "");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(value) ? value : "needs_review";
  }
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

  function buildGlobalShoppingOfflineReleaseGateRowsForView(input) {
    const summary = resolveSummary(input, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    return rowsFor(summary, "provider_offline_release_gate_missing", "Offline Release Gate", "离线发布闸门仍需复核");
  }

  function buildGlobalShoppingCertificationFreezeLedgerRowsForView(input) {
    const summary = resolveSummary(input, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger");
    return rowsFor(summary, "provider_certification_freeze_ledger_missing", "Certification Freeze", "认证冻结仍需复核");
  }

  function buildGlobalShoppingActivationReviewPacketRowsForView(input) {
    const summary = resolveSummary(input, "sandboxActivationReviewPacketSummary", "WeishanGlobalShoppingSandboxActivationReviewPacket", "buildGlobalShoppingSandboxActivationReviewPacket");
    return rowsFor(summary, "sandbox_activation_review_packet_missing", "Activation Review", "Sandbox 激活复核仍需复核");
  }

  function buildGlobalShoppingBoundaryDiffRowsForView(input) {
    const summary = resolveSummary(input, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector");
    return rowsFor(summary, "adapter_boundary_diff_inspector_missing", "Boundary Diff", "Adapter 边界差异仍需复核");
  }

  function buildGlobalShoppingProviderOfflineReleaseCards(input) {
    const safe = obj(input);
    const offlineReleaseGateSummary = resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    const certificationFreezeLedgerSummary = resolveSummary(safe, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger");
    const sandboxActivationReviewPacketSummary = resolveSummary(safe, "sandboxActivationReviewPacketSummary", "WeishanGlobalShoppingSandboxActivationReviewPacket", "buildGlobalShoppingSandboxActivationReviewPacket");
    const adapterBoundaryDiffInspectorSummary = resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector");
    return clone([
      card("offline_release_gate", "Offline Release Gate", labelOf(offlineReleaseGateSummary, "离线发布闸门仍需复核")),
      card("certification_freeze", "Certification Freeze", labelOf(certificationFreezeLedgerSummary, "认证冻结仍需复核")),
      card("activation_review", "Activation Review", labelOf(sandboxActivationReviewPacketSummary, "Sandbox 激活复核仍需复核")),
      card("boundary_diff", "Boundary Diff", labelOf(adapterBoundaryDiffInspectorSummary, "Adapter 边界差异仍需复核")),
      card("risk_disclosure", "风险说明", "Manual offline release review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingProviderOfflineReleaseRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_offline_release_view_model_status", "Provider 离线发布闸门与激活复核", "当前只展示 provider 离线发布闸门与激活复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_offline_release_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderOfflineReleaseViewModel(viewModel) {
    const safe = obj(viewModel);
    const providerOfflineReleaseGateSummary = resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    const providerCertificationFreezeLedgerSummary = resolveSummary(safe, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger");
    const sandboxActivationReviewPacketSummary = resolveSummary(safe, "sandboxActivationReviewPacketSummary", "WeishanGlobalShoppingSandboxActivationReviewPacket", "buildGlobalShoppingSandboxActivationReviewPacket");
    const adapterBoundaryDiffInspectorSummary = resolveSummary(safe, "adapterBoundaryDiffInspectorSummary", "WeishanGlobalShoppingAdapterBoundaryDiffInspector", "buildGlobalShoppingAdapterBoundaryDiffInspector");
    const statuses = [
      statusOf(providerOfflineReleaseGateSummary),
      statusOf(providerCertificationFreezeLedgerSummary),
      statusOf(sandboxActivationReviewPacketSummary),
      statusOf(adapterBoundaryDiffInspectorSummary)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(providerOfflineReleaseGateSummary) ||
      !present(providerCertificationFreezeLedgerSummary) ||
      !present(sandboxActivationReviewPacketSummary) ||
      !present(adapterBoundaryDiffInspectorSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider 离线发布闸门与激活复核",
      cards:buildGlobalShoppingProviderOfflineReleaseCards({
        providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary,
        providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary,
        sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary,
        adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary
      }),
      offlineReleaseRows:buildGlobalShoppingOfflineReleaseGateRowsForView({ providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary }),
      certificationFreezeRows:buildGlobalShoppingCertificationFreezeLedgerRowsForView({ providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary }),
      activationReviewRows:buildGlobalShoppingActivationReviewPacketRowsForView({ sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary }),
      boundaryDiffRows:buildGlobalShoppingBoundaryDiffRowsForView({ adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_offline_release_disclosure_gate", "Offline Release Gate", "Offline Release Gate 不创建 release、不 push", "pass"),
        row("provider_offline_release_disclosure_freeze", "Certification Freeze", "Certification Freeze Ledger 不持久化台账", "pass"),
        row("provider_offline_release_disclosure_activation", "Activation Review", "Activation Review Packet 不激活 sandbox", "pass"),
        row("provider_offline_release_disclosure_boundary", "Boundary Diff", "Boundary Diff Inspector 不修改配置、不启用 provider", "pass"),
        row("provider_offline_release_disclosure_manual", "风险说明", "Manual offline release review 仍需人工复核", "warning")
      ],
      caveat:"当前只展示 provider 离线发布闸门与激活复核，不接真实 provider，不读取密钥，不联网，不创建 release，不 push。",
      providerOfflineReleaseGateSummary:clone(providerOfflineReleaseGateSummary),
      providerCertificationFreezeLedgerSummary:clone(providerCertificationFreezeLedgerSummary),
      sandboxActivationReviewPacketSummary:clone(sandboxActivationReviewPacketSummary),
      adapterBoundaryDiffInspectorSummary:clone(adapterBoundaryDiffInspectorSummary),
      safeToProceedWithManualOfflineReleaseReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderOfflineReleaseViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderOfflineReleaseViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderOfflineReleaseViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderOfflineReleaseViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderOfflineReleaseViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderOfflineReleaseViewModel = {
    GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderOfflineReleaseViewModel,
    buildGlobalShoppingProviderOfflineReleaseCards,
    buildGlobalShoppingProviderOfflineReleaseRows,
    buildGlobalShoppingOfflineReleaseGateRowsForView,
    buildGlobalShoppingCertificationFreezeLedgerRowsForView,
    buildGlobalShoppingActivationReviewPacketRowsForView,
    buildGlobalShoppingBoundaryDiffRowsForView,
    buildGlobalShoppingProviderOfflineReleaseViewModelAuditDraft,
    sanitizeGlobalShoppingProviderOfflineReleaseViewModel
  };
})();
