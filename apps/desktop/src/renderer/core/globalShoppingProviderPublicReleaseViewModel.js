;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_PUBLIC_RELEASE_VIEW_MODEL_VERSION = "4.2.5";
  const VIEW_MODEL_NAME = "global_shopping_provider_public_release_view_model_v1";

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
  function rowsFor(summary, emptyId, emptyLabel, emptyValue) {
    return toArray(obj(summary).rows).length ? clone(summary.rows) : [row(emptyId, emptyLabel, emptyValue, "warning")];
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

  function buildGlobalShoppingProviderPublicReleaseCards(input) {
    const safe = obj(input);
    const providerReadOnlyPublicReleaseCenterSummary = resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter");
    const trustClosureExportPreviewSummary = resolveSummary(safe, "trustClosureExportPreviewSummary", "WeishanGlobalShoppingTrustClosureExportPreview", "buildGlobalShoppingTrustClosureExportPreview");
    const finalNoProviderBoundaryReceiptSummary = resolveSummary(safe, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt");
    const publicSafetyStatementPreviewSummary = resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    return clone([
      card("public_release", "Public Release", labelOf(providerReadOnlyPublicReleaseCenterSummary, "Provider Read-Only Public Release Center 仍需复核")),
      card("export_preview", "Export Preview", labelOf(trustClosureExportPreviewSummary, "Trust Closure Export Preview 仍需复核")),
      card("no_provider_receipt", "No-Provider Receipt", labelOf(finalNoProviderBoundaryReceiptSummary, "Final No-Provider Boundary Receipt 仍需复核")),
      card("safety_statement", "Safety Statement", labelOf(publicSafetyStatementPreviewSummary, "Public Safety Statement Preview 仍需复核")),
      card("risk_disclosure", "风险说明", "Human public release review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingPublicReleaseRowsForView(input) {
    const summary = resolveSummary(input, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter");
    return rowsFor(summary, "provider_read_only_public_release_center_missing", "Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 仍需复核");
  }

  function buildGlobalShoppingTrustClosureExportRowsForView(input) {
    const summary = resolveSummary(input, "trustClosureExportPreviewSummary", "WeishanGlobalShoppingTrustClosureExportPreview", "buildGlobalShoppingTrustClosureExportPreview");
    return rowsFor(summary, "trust_closure_export_preview_missing", "Trust Closure Export Preview", "Trust Closure Export Preview 仍需复核");
  }

  function buildGlobalShoppingNoProviderBoundaryRowsForView(input) {
    const summary = resolveSummary(input, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt");
    return rowsFor(summary, "final_no_provider_boundary_receipt_missing", "Final No-Provider Boundary Receipt", "Final No-Provider Boundary Receipt 仍需复核");
  }

  function buildGlobalShoppingPublicSafetyStatementRowsForView(input) {
    const summary = resolveSummary(input, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    return rowsFor(summary, "public_safety_statement_preview_missing", "Public Safety Statement Preview", "Public Safety Statement Preview 仍需复核");
  }

  function buildGlobalShoppingProviderPublicReleaseRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_public_release_view_model_status", "Provider Public Release Review", "当前只展示 provider public release review", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_public_release_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，不生成真实导出文件。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderPublicReleaseViewModel(viewModel) {
    const safe = obj(viewModel);
    const providerReadOnlyPublicReleaseCenterSummary = resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter");
    const trustClosureExportPreviewSummary = resolveSummary(safe, "trustClosureExportPreviewSummary", "WeishanGlobalShoppingTrustClosureExportPreview", "buildGlobalShoppingTrustClosureExportPreview");
    const finalNoProviderBoundaryReceiptSummary = resolveSummary(safe, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt");
    const publicSafetyStatementPreviewSummary = resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    const statuses = [
      safeStatus(providerReadOnlyPublicReleaseCenterSummary.status),
      safeStatus(trustClosureExportPreviewSummary.status),
      safeStatus(finalNoProviderBoundaryReceiptSummary.status),
      safeStatus(publicSafetyStatementPreviewSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(providerReadOnlyPublicReleaseCenterSummary) ||
      !present(trustClosureExportPreviewSummary) ||
      !present(finalNoProviderBoundaryReceiptSummary) ||
      !present(publicSafetyStatementPreviewSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PUBLIC_RELEASE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Public Release Review",
      cards:buildGlobalShoppingProviderPublicReleaseCards({
        providerReadOnlyPublicReleaseCenterSummary:providerReadOnlyPublicReleaseCenterSummary,
        trustClosureExportPreviewSummary:trustClosureExportPreviewSummary,
        finalNoProviderBoundaryReceiptSummary:finalNoProviderBoundaryReceiptSummary,
        publicSafetyStatementPreviewSummary:publicSafetyStatementPreviewSummary
      }),
      publicReleaseRows:buildGlobalShoppingPublicReleaseRowsForView({ providerReadOnlyPublicReleaseCenterSummary:providerReadOnlyPublicReleaseCenterSummary }),
      exportPreviewRows:buildGlobalShoppingTrustClosureExportRowsForView({ trustClosureExportPreviewSummary:trustClosureExportPreviewSummary }),
      noProviderReceiptRows:buildGlobalShoppingNoProviderBoundaryRowsForView({ finalNoProviderBoundaryReceiptSummary:finalNoProviderBoundaryReceiptSummary }),
      safetyStatementRows:buildGlobalShoppingPublicSafetyStatementRowsForView({ publicSafetyStatementPreviewSummary:publicSafetyStatementPreviewSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_public_release_view_model_disclosure_public_release", "Public Release", "Public Release 不创建真实公开发布", "pass"),
        row("provider_public_release_view_model_disclosure_export_preview", "Export Preview", "Export Preview 不生成真实导出文件", "pass"),
        row("provider_public_release_view_model_disclosure_no_provider_receipt", "No-Provider Receipt", "No-Provider Receipt 不生成真实回执、不打开平台", "pass"),
        row("provider_public_release_view_model_disclosure_safety_statement", "Safety Statement", "Safety Statement 不承诺最低价、最终价或官方背书", "pass"),
        row("provider_public_release_view_model_disclosure_manual", "风险说明", "Human public release review 仍需人工复核", "warning")
      ],
      rows:buildGlobalShoppingProviderPublicReleaseRows({ status:status }),
      caveat:"当前只展示 provider public release review，不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，不生成真实导出文件。",
      providerReadOnlyPublicReleaseCenterSummary:clone(providerReadOnlyPublicReleaseCenterSummary),
      trustClosureExportPreviewSummary:clone(trustClosureExportPreviewSummary),
      finalNoProviderBoundaryReceiptSummary:clone(finalNoProviderBoundaryReceiptSummary),
      publicSafetyStatementPreviewSummary:clone(publicSafetyStatementPreviewSummary),
      safeToProceedWithHumanPublicReleaseReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderPublicReleaseViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderPublicReleaseViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_PUBLIC_RELEASE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PUBLIC_RELEASE_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderPublicReleaseViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderPublicReleaseViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderPublicReleaseViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderPublicReleaseViewModel = {
    GLOBAL_SHOPPING_PROVIDER_PUBLIC_RELEASE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderPublicReleaseViewModel,
    buildGlobalShoppingProviderPublicReleaseCards,
    buildGlobalShoppingProviderPublicReleaseRows,
    buildGlobalShoppingPublicReleaseRowsForView,
    buildGlobalShoppingTrustClosureExportRowsForView,
    buildGlobalShoppingNoProviderBoundaryRowsForView,
    buildGlobalShoppingPublicSafetyStatementRowsForView,
    buildGlobalShoppingProviderPublicReleaseViewModelAuditDraft,
    sanitizeGlobalShoppingProviderPublicReleaseViewModel
  };
})();
