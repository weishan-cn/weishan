;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_COVERAGE_VIEW_MODEL_VERSION = "2.2.3";
  const VIEW_MODEL_NAME = "global_shopping_provider_coverage_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true };
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function hasUnsafe(summary) {
    const safe = obj(summary);
    return safe.hasRealEndpoint === true || safe.hasRealApiKey === true || safe.canCallNetwork === true || safe.rawResponseStored === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true || safe.openExternal === true || safe.windowOpen === true ||
      typeof safe.bookingUrl === "string" && !!safe.bookingUrl.trim() || typeof safe.checkoutUrl === "string" && !!safe.checkoutUrl.trim() ||
      typeof safe.paymentUrl === "string" && !!safe.paymentUrl.trim() || typeof safe.orderUrl === "string" && !!safe.orderUrl.trim();
  }

  function buildGlobalShoppingProviderCoverageCards(input) {
    const safe = obj(input);
    const connector = obj(safe.firstSandboxProviderConnectorSummary);
    const coverage = obj(safe.providerCoverageDashboardSummary);
    const trust = obj(safe.readOnlySourceTrustScoreSummary);
    return clone([
      card("sandbox_connector", "Sandbox Connector", obj(obj(connector.userFacingSummary)).resultLabel || "Sandbox Connector 仍需复核"),
      card("coverage", "来源覆盖", obj(obj(coverage.userFacingSummary)).resultLabel || "Provider 覆盖仍需复核"),
      card("source_trust", "来源可信度", obj(obj(trust.userFacingSummary)).resultLabel || "来源可信度仍需复核"),
      card("next_step", "下一步", safe.safeToProceedWithFirstReadOnlyProviderSandboxIntegration === true ? "继续只读集成" : "继续只读复核")
    ]);
  }
  function buildGlobalShoppingProviderCoverageRows(input) {
    return clone(toArray(obj(obj(input).providerCoverageDashboardSummary).coverageRows).map(function (item) {
      return row(item.rowId, item.label, item.value, item.status);
    }));
  }
  function buildGlobalShoppingSourceTrustRowsForView(input) {
    return clone(toArray(obj(obj(input).readOnlySourceTrustScoreSummary).rows).map(function (item) {
      return row(item.rowId, item.label, item.value, item.status);
    }));
  }
  function buildGlobalShoppingProviderCoverageViewModelAuditDraft(input) {
    const model = buildGlobalShoppingProviderCoverageViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_COVERAGE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_COVERAGE_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
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
  function sanitizeGlobalShoppingProviderCoverageViewModel(viewModel) {
    const safe = obj(viewModel);
    const connector = obj(safe.firstSandboxProviderConnectorSummary);
    const coverage = obj(safe.providerCoverageDashboardSummary);
    const trust = obj(safe.readOnlySourceTrustScoreSummary);
    const blocked = statusOf(connector) === "blocked" || statusOf(coverage) === "blocked" || statusOf(trust) === "blocked" || hasUnsafe(safe) || hasUnsafe(connector) || hasUnsafe(coverage) || hasUnsafe(trust);
    const needsReview = !blocked && (!Object.keys(connector).length || !Object.keys(coverage).length || !Object.keys(trust).length);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_COVERAGE_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider 覆盖与来源可信度",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderCoverageCards(safe),
      connectorRows:toArray(safe.connectorRows).length ? toArray(safe.connectorRows) : toArray(connector.rows),
      coverageRows:toArray(safe.coverageRows).length ? toArray(safe.coverageRows) : buildGlobalShoppingProviderCoverageRows(safe),
      trustRows:toArray(safe.trustRows).length ? toArray(safe.trustRows) : buildGlobalShoppingSourceTrustRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("coverage_boundary", "覆盖来源边界", "覆盖来源不代表全网覆盖", "pass"),
        row("trust_boundary", "可信度边界", "可信度不代表官方背书", "pass"),
        row("price_boundary", "价格边界", "低价不等于最佳", "pass"),
        row("order_boundary", "能力边界", "Provider 覆盖不代表下单能力", "pass")
      ],
      caveat:"当前仅展示 fixture/dry-run/sandbox provider 覆盖和来源可信度，不代表全网覆盖、官方背书、真实价格或下单能力。",
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderCoverageViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderCoverageViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderCoverageViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderCoverageViewModel = {
    GLOBAL_SHOPPING_PROVIDER_COVERAGE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderCoverageViewModel,
    buildGlobalShoppingProviderCoverageCards,
    buildGlobalShoppingProviderCoverageRows,
    buildGlobalShoppingSourceTrustRowsForView,
    buildGlobalShoppingProviderCoverageViewModelAuditDraft,
    sanitizeGlobalShoppingProviderCoverageViewModel
  };
})();
