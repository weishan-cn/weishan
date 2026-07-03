;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_VIEW_MODEL_VERSION = "4.0.5";
  const VIEW_MODEL_NAME = "global_shopping_provider_certification_view_model_v1";

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
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
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
  function rowsFor(summary, emptyId, emptyLabel, emptyValue) {
    return toArray(summary.rows).length ? clone(summary.rows) : clone([row(emptyId, emptyLabel, emptyValue, "warning")]);
  }

  function buildGlobalShoppingCertificationCenterRowsForView(input) {
    const summary = resolveSummary(input, "offlineProviderCertificationCenterSummary", "WeishanGlobalShoppingOfflineProviderCertificationCenter", "buildGlobalShoppingOfflineProviderCertificationCenter");
    return rowsFor(summary, "offline_provider_certification_center_missing", "Certification Center", "离线 Provider 认证仍需复核");
  }

  function buildGlobalShoppingRegressionLabRowsForView(input) {
    const summary = resolveSummary(input, "mockIntegrationRegressionLabSummary", "WeishanGlobalShoppingMockIntegrationRegressionLab", "buildGlobalShoppingMockIntegrationRegressionLab");
    return rowsFor(summary, "mock_integration_regression_lab_missing", "Regression Lab", "Mock 集成回归仍需复核");
  }

  function buildGlobalShoppingEvidenceBinderRowsForView(input) {
    const summary = resolveSummary(input, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    return rowsFor(summary, "human_approval_evidence_binder_missing", "Evidence Binder", "人工审批证据仍需复核");
  }

  function buildGlobalShoppingBoundaryLockRowsForView(input) {
    const summary = resolveSummary(input, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    return rowsFor(summary, "adapter_boundary_lock_missing", "Boundary Lock", "Adapter 边界锁仍需复核");
  }

  function buildGlobalShoppingProviderCertificationCards(input) {
    const safe = obj(input);
    const certificationCenter = resolveSummary(safe, "offlineProviderCertificationCenterSummary", "WeishanGlobalShoppingOfflineProviderCertificationCenter", "buildGlobalShoppingOfflineProviderCertificationCenter");
    const regressionLab = resolveSummary(safe, "mockIntegrationRegressionLabSummary", "WeishanGlobalShoppingMockIntegrationRegressionLab", "buildGlobalShoppingMockIntegrationRegressionLab");
    const evidenceBinder = resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    const boundaryLock = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    return clone([
      card("certification_center", "Certification Center", summaryLabel(certificationCenter, "离线 Provider 认证仍需复核")),
      card("regression_lab", "Regression Lab", summaryLabel(regressionLab, "Mock 集成回归仍需复核")),
      card("evidence_binder", "Evidence Binder", summaryLabel(evidenceBinder, "人工审批证据仍需复核")),
      card("boundary_lock", "Boundary Lock", summaryLabel(boundaryLock, "Adapter 边界锁仍需复核")),
      card("risk_disclosure", "风险说明", "Human certification review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingProviderCertificationRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_certification_view_model_status", "Provider 离线认证与边界锁", "当前只展示 provider 离线认证与边界锁", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_certification_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不生成 endpoint，不创建 release，不 push。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderCertificationViewModel(viewModel) {
    const safe = obj(viewModel);
    const certificationCenter = resolveSummary(safe, "offlineProviderCertificationCenterSummary", "WeishanGlobalShoppingOfflineProviderCertificationCenter", "buildGlobalShoppingOfflineProviderCertificationCenter");
    const regressionLab = resolveSummary(safe, "mockIntegrationRegressionLabSummary", "WeishanGlobalShoppingMockIntegrationRegressionLab", "buildGlobalShoppingMockIntegrationRegressionLab");
    const evidenceBinder = resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    const boundaryLock = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    const statuses = [certificationCenter, regressionLab, evidenceBinder, boundaryLock].map(function (item) { return safeStatus(obj(item).status); });
    const blocked = statuses.indexOf("blocked") >= 0;
    const needsReview = !present(certificationCenter) || !present(regressionLab) || !present(evidenceBinder) || !present(boundaryLock) || statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider 离线认证与边界锁",
      cards:buildGlobalShoppingProviderCertificationCards({
        offlineProviderCertificationCenterSummary:certificationCenter,
        mockIntegrationRegressionLabSummary:regressionLab,
        humanApprovalEvidenceBinderSummary:evidenceBinder,
        adapterBoundaryLockSummary:boundaryLock
      }),
      certificationRows:buildGlobalShoppingCertificationCenterRowsForView({ offlineProviderCertificationCenterSummary:certificationCenter }),
      regressionRows:buildGlobalShoppingRegressionLabRowsForView({ mockIntegrationRegressionLabSummary:regressionLab }),
      evidenceRows:buildGlobalShoppingEvidenceBinderRowsForView({ humanApprovalEvidenceBinderSummary:evidenceBinder }),
      boundaryLockRows:buildGlobalShoppingBoundaryLockRowsForView({ adapterBoundaryLockSummary:boundaryLock }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_certification_disclosure_certification", "Certification Center", "Certification Center 不生成真实认证文件", "pass"),
        row("provider_certification_disclosure_regression", "Regression Lab", "Regression Lab 不运行真实 provider", "pass"),
        row("provider_certification_disclosure_evidence", "Evidence Binder", "Evidence Binder 不写文件、不上传", "pass"),
        row("provider_certification_disclosure_boundary", "Boundary Lock", "Boundary Lock 不修改配置、不启用 provider", "pass"),
        row("provider_certification_disclosure_manual", "风险说明", "Human certification review 仍需人工复核", "warning")
      ],
      caveat:"当前只展示 provider 离线认证与边界锁，不接真实 provider，不读取密钥，不联网，不生成 endpoint，不创建 release，不 push。",
      offlineProviderCertificationCenterSummary:clone(certificationCenter),
      mockIntegrationRegressionLabSummary:clone(regressionLab),
      humanApprovalEvidenceBinderSummary:clone(evidenceBinder),
      adapterBoundaryLockSummary:clone(boundaryLock)
    });
  }

  function buildGlobalShoppingProviderCertificationViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderCertificationViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderCertificationViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderCertificationViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderCertificationViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderCertificationViewModel = {
    GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderCertificationViewModel,
    buildGlobalShoppingProviderCertificationCards,
    buildGlobalShoppingProviderCertificationRows,
    buildGlobalShoppingCertificationCenterRowsForView,
    buildGlobalShoppingRegressionLabRowsForView,
    buildGlobalShoppingEvidenceBinderRowsForView,
    buildGlobalShoppingBoundaryLockRowsForView,
    buildGlobalShoppingProviderCertificationViewModelAuditDraft,
    sanitizeGlobalShoppingProviderCertificationViewModel
  };
})();
