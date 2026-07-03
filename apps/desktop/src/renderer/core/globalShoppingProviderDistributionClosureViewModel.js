;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_CLOSURE_VIEW_MODEL_VERSION = "4.0.5";
  const DISTRIBUTION_CLOSURE_VIEW_MODEL_NAME = "global_shopping_provider_distribution_closure_view_model_v1";

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

  function buildGlobalShoppingProviderDistributionClosureCards(input) {
    const safe = obj(input);
    const providerDistributionFreezeConsoleSummary = resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole");
    const userFacingSafetyReceiptSummary = resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt");
    const offlineReleaseCandidateClosurePackSummary = resolveSummary(safe, "offlineReleaseCandidateClosurePackSummary", "WeishanGlobalShoppingOfflineReleaseCandidateClosurePack", "buildGlobalShoppingOfflineReleaseCandidateClosurePack");
    const providerNoProductionGuaranteeMatrixSummary = resolveSummary(safe, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix");
    return clone([
      card("distribution_freeze", "Distribution Freeze", labelOf(providerDistributionFreezeConsoleSummary, "Distribution Freeze 仍需复核")),
      card("safety_receipt", "Safety Receipt", labelOf(userFacingSafetyReceiptSummary, "Safety Receipt 仍需复核")),
      card("rc_closure_pack", "RC Closure Pack", labelOf(offlineReleaseCandidateClosurePackSummary, "RC Closure Pack 仍需复核")),
      card("no_production_guarantee", "No-Production Guarantee", labelOf(providerNoProductionGuaranteeMatrixSummary, "No-Production Guarantee 仍需复核")),
      card("risk_disclosure", "风险说明", "Human distribution closure review 仍需人工复核")
    ]);
  }

  function buildGlobalShoppingDistributionFreezeRowsForView(input) {
    const summary = resolveSummary(input, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole");
    return rowsFor(summary, "provider_distribution_freeze_console_missing", "Provider Distribution Freeze Console", "Provider Distribution Freeze Console 仍需复核");
  }

  function buildGlobalShoppingSafetyReceiptRowsForView(input) {
    const summary = resolveSummary(input, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt");
    return rowsFor(summary, "user_facing_safety_receipt_missing", "User-Facing Safety Receipt", "User-Facing Safety Receipt 仍需复核");
  }

  function buildGlobalShoppingRcClosurePackRowsForView(input) {
    const summary = resolveSummary(input, "offlineReleaseCandidateClosurePackSummary", "WeishanGlobalShoppingOfflineReleaseCandidateClosurePack", "buildGlobalShoppingOfflineReleaseCandidateClosurePack");
    return rowsFor(summary, "offline_release_candidate_closure_pack_missing", "Offline Release Candidate Closure Pack", "Offline Release Candidate Closure Pack 仍需复核");
  }

  function buildGlobalShoppingNoProductionGuaranteeRowsForView(input) {
    const summary = resolveSummary(input, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix");
    return rowsFor(summary, "provider_no_production_guarantee_matrix_missing", "Provider No-Production Guarantee Matrix", "Provider No-Production Guarantee Matrix 仍需复核");
  }

  function buildGlobalShoppingProviderDistributionClosureRows(input) {
    const safe = obj(input);
    return clone([
      row("provider_distribution_closure_view_model_status", "Provider Distribution Closure Review", "当前只展示 provider distribution closure review", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_distribution_closure_view_model_boundary", "只读边界", "不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不创建真实分发包。", "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderDistributionClosureViewModel(viewModel) {
    const safe = obj(viewModel);
    const providerDistributionFreezeConsoleSummary = resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole");
    const userFacingSafetyReceiptSummary = resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt");
    const offlineReleaseCandidateClosurePackSummary = resolveSummary(safe, "offlineReleaseCandidateClosurePackSummary", "WeishanGlobalShoppingOfflineReleaseCandidateClosurePack", "buildGlobalShoppingOfflineReleaseCandidateClosurePack");
    const providerNoProductionGuaranteeMatrixSummary = resolveSummary(safe, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix");
    const statuses = [
      safeStatus(providerDistributionFreezeConsoleSummary.status),
      safeStatus(userFacingSafetyReceiptSummary.status),
      safeStatus(offlineReleaseCandidateClosurePackSummary.status),
      safeStatus(providerNoProductionGuaranteeMatrixSummary.status)
    ];
    const blocked = statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(providerDistributionFreezeConsoleSummary) ||
      !present(userFacingSafetyReceiptSummary) ||
      !present(offlineReleaseCandidateClosurePackSummary) ||
      !present(providerNoProductionGuaranteeMatrixSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      viewModelName:DISTRIBUTION_CLOSURE_VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_CLOSURE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider Distribution Closure Review",
      cards:buildGlobalShoppingProviderDistributionClosureCards({
        providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary,
        userFacingSafetyReceiptSummary:userFacingSafetyReceiptSummary,
        offlineReleaseCandidateClosurePackSummary:offlineReleaseCandidateClosurePackSummary,
        providerNoProductionGuaranteeMatrixSummary:providerNoProductionGuaranteeMatrixSummary
      }),
      distributionFreezeRows:buildGlobalShoppingDistributionFreezeRowsForView({ providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary }),
      safetyReceiptRows:buildGlobalShoppingSafetyReceiptRowsForView({ userFacingSafetyReceiptSummary:userFacingSafetyReceiptSummary }),
      rcClosurePackRows:buildGlobalShoppingRcClosurePackRowsForView({ offlineReleaseCandidateClosurePackSummary:offlineReleaseCandidateClosurePackSummary }),
      noProductionGuaranteeRows:buildGlobalShoppingNoProductionGuaranteeRowsForView({ providerNoProductionGuaranteeMatrixSummary:providerNoProductionGuaranteeMatrixSummary }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("provider_distribution_closure_view_model_disclosure_distribution", "Provider Distribution Freeze Console", "Distribution Freeze 不创建真实分发包、不冻结配置", "pass"),
        row("provider_distribution_closure_view_model_disclosure_receipt", "User-Facing Safety Receipt", "Safety Receipt 不生成真实回执文件", "pass"),
        row("provider_distribution_closure_view_model_disclosure_closure", "Offline Release Candidate Closure Pack", "RC Closure Pack 不创建真实闭包文件", "pass"),
        row("provider_distribution_closure_view_model_disclosure_no_production", "Provider No-Production Guarantee Matrix", "No-Production Guarantee 不切换 production provider", "pass"),
        row("provider_distribution_closure_view_model_disclosure_manual", "风险说明", "Human distribution closure review 仍需人工复核", "warning")
      ],
      rows:buildGlobalShoppingProviderDistributionClosureRows({ status:status }),
      caveat:"当前只展示 provider distribution closure review，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不创建真实分发包。",
      providerDistributionFreezeConsoleSummary:clone(providerDistributionFreezeConsoleSummary),
      userFacingSafetyReceiptSummary:clone(userFacingSafetyReceiptSummary),
      offlineReleaseCandidateClosurePackSummary:clone(offlineReleaseCandidateClosurePackSummary),
      providerNoProductionGuaranteeMatrixSummary:clone(providerNoProductionGuaranteeMatrixSummary),
      safeToProceedWithHumanDistributionClosureReview:status === "ready"
    });
  }

  function buildGlobalShoppingProviderDistributionClosureViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderDistributionClosureViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_CLOSURE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:DISTRIBUTION_CLOSURE_VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_CLOSURE_VIEW_MODEL_VERSION,
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

  function buildGlobalShoppingProviderDistributionClosureViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderDistributionClosureViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderDistributionClosureViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderDistributionClosureViewModel = {
    GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_CLOSURE_VIEW_MODEL_VERSION,
    DISTRIBUTION_CLOSURE_VIEW_MODEL_NAME,
    buildGlobalShoppingProviderDistributionClosureViewModel,
    buildGlobalShoppingProviderDistributionClosureCards,
    buildGlobalShoppingProviderDistributionClosureRows,
    buildGlobalShoppingDistributionFreezeRowsForView,
    buildGlobalShoppingSafetyReceiptRowsForView,
    buildGlobalShoppingRcClosurePackRowsForView,
    buildGlobalShoppingNoProductionGuaranteeRowsForView,
    buildGlobalShoppingProviderDistributionClosureViewModelAuditDraft,
    sanitizeGlobalShoppingProviderDistributionClosureViewModel
  };
})();
