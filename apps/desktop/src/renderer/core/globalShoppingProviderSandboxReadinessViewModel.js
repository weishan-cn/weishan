;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_VIEW_MODEL_VERSION = "4.0.6";
  const VIEW_MODEL_NAME = "global_shopping_provider_sandbox_readiness_view_model_v1";
  const CAVEAT = "当前仅准备真实只读 provider sandbox 的请求封装和审计结构，不发送请求，不读取真实密钥，不保存 raw response。";

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
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true }; }
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
  function api(name) { return window[name] || {}; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = api(apiName);
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](safe) : {};
  }
  function hasBlockedBoundary(summary) {
    const safe = obj(summary);
    const safetySummary = obj(safe.safety);
    return safe.openExternal === true ||
      safe.autoOpen === true ||
      safe.networkEnabled === true ||
      safe.realApiKeyDetected === true ||
      safe.rawRequestStored === true ||
      safe.rawResponseStored === true ||
      safe.userIdentityDetected === true ||
      safe.paymentDataDetected === true ||
      safe.bookingUrl != null ||
      safe.checkoutUrl != null ||
      safe.paymentUrl != null ||
      safe.orderUrl != null ||
      safetySummary.bookingUrl != null ||
      safetySummary.checkoutUrl != null ||
      safetySummary.paymentUrl != null ||
      safetySummary.orderUrl != null ||
      safetySummary.secretStored === true ||
      safetySummary.rawResponseStored === true;
  }
  function buildGlobalShoppingProviderSandboxReadinessCards(input) {
    const safe = obj(input);
    const gate = resolveSummary(safe, "realProviderSandboxGateSummary", "WeishanGlobalShoppingReadOnlyRealProviderSandboxGate", "buildGlobalShoppingReadOnlyRealProviderSandboxGate");
    const envelope = resolveSummary(safe, "providerRequestEnvelopeSummary", "WeishanGlobalShoppingProviderRequestEnvelopeBuilder", "buildGlobalShoppingProviderRequestEnvelopeBuilder");
    const ledger = resolveSummary(safe, "providerCallAuditLedgerSummary", "WeishanGlobalShoppingProviderCallAuditLedger", "buildGlobalShoppingProviderCallAuditLedger");
    return clone([
      card("sandbox_gate", "Sandbox 闸门", obj(obj(gate).userFacingSummary).resultLabel || "仍需复核"),
      card("request_envelope", "请求封装", obj(obj(envelope).userFacingSummary).resultLabel || "仍需复核"),
      card("audit_ledger", "调用审计", obj(obj(ledger).userFacingSummary).resultLabel || "仍需复核"),
      card("next_step", "下一步", statusOf(gate) === "ready" && statusOf(envelope) === "ready" && statusOf(ledger) === "ready" ? "可以准备只读 Provider Sandbox" : "继续只读复核")
    ]);
  }
  function buildGlobalShoppingProviderSandboxReadinessRows(input) {
    const gate = resolveSummary(input || {}, "realProviderSandboxGateSummary", "WeishanGlobalShoppingReadOnlyRealProviderSandboxGate", "buildGlobalShoppingReadOnlyRealProviderSandboxGate");
    return clone(toArray(gate.readinessRows || gate.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingRequestEnvelopeRowsForView(input) {
    const envelope = resolveSummary(input || {}, "providerRequestEnvelopeSummary", "WeishanGlobalShoppingProviderRequestEnvelopeBuilder", "buildGlobalShoppingProviderRequestEnvelopeBuilder");
    return clone(toArray(envelope.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function buildGlobalShoppingProviderCallAuditRowsForView(input) {
    const ledger = resolveSummary(input || {}, "providerCallAuditLedgerSummary", "WeishanGlobalShoppingProviderCallAuditLedger", "buildGlobalShoppingProviderCallAuditLedger");
    return clone(toArray(ledger.rows).map(function (item) { return row(item.rowId, item.label, item.value, item.status); }));
  }
  function sanitizeGlobalShoppingProviderSandboxReadinessViewModel(viewModel) {
    const safe = obj(viewModel);
    const gate = resolveSummary(safe, "realProviderSandboxGateSummary", "WeishanGlobalShoppingReadOnlyRealProviderSandboxGate", "buildGlobalShoppingReadOnlyRealProviderSandboxGate");
    const envelope = resolveSummary(safe, "providerRequestEnvelopeSummary", "WeishanGlobalShoppingProviderRequestEnvelopeBuilder", "buildGlobalShoppingProviderRequestEnvelopeBuilder");
    const ledger = resolveSummary(safe, "providerCallAuditLedgerSummary", "WeishanGlobalShoppingProviderCallAuditLedger", "buildGlobalShoppingProviderCallAuditLedger");
    const blocked = statusOf(gate) === "blocked" || statusOf(envelope) === "blocked" || statusOf(ledger) === "blocked" || hasBlockedBoundary(safe) || hasBlockedBoundary(gate) || hasBlockedBoundary(envelope) || hasBlockedBoundary(ledger);
    const needsReview = !blocked && (!Object.keys(gate).length || !Object.keys(envelope).length || !Object.keys(ledger).length || statusOf(gate) === "needs_review" || statusOf(envelope) === "needs_review" || statusOf(ledger) === "needs_review");
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : (blocked ? "blocked" : (needsReview ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_VIEW_MODEL_VERSION,
      status:status,
      title:"真实只读 Provider Sandbox 准备",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderSandboxReadinessCards(safe),
      readinessRows:toArray(safe.readinessRows).length ? toArray(safe.readinessRows) : buildGlobalShoppingProviderSandboxReadinessRows(safe),
      envelopeRows:toArray(safe.envelopeRows).length ? toArray(safe.envelopeRows) : buildGlobalShoppingRequestEnvelopeRowsForView(safe),
      auditRows:toArray(safe.auditRows).length ? toArray(safe.auditRows) : buildGlobalShoppingProviderCallAuditRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("request_disabled", "请求边界", "请求封装不发送真实请求", "pass"),
        row("audit_memory_only", "审计边界", "调用审计不保存 raw response", "pass"),
        row("price_caveat", "价格边界", "Sandbox 准备不代表真实价格", "pass"),
        row("ordering_caveat", "交易边界", "Sandbox 准备不代表下单能力", "pass")
      ],
      caveat:CAVEAT,
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderSandboxReadinessViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxReadinessViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderSandboxReadinessViewModel({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingProviderSandboxReadinessViewModelAuditDraft(input) {
    const model = buildGlobalShoppingProviderSandboxReadinessViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
      readinessRowCount:model.readinessRows.length,
      envelopeRowCount:model.envelopeRows.length,
      auditRowCount:model.auditRows.length,
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

  window.WeishanGlobalShoppingProviderSandboxReadinessViewModel = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_READINESS_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderSandboxReadinessViewModel,
    buildGlobalShoppingProviderSandboxReadinessCards,
    buildGlobalShoppingProviderSandboxReadinessRows,
    buildGlobalShoppingRequestEnvelopeRowsForView,
    buildGlobalShoppingProviderCallAuditRowsForView,
    buildGlobalShoppingProviderSandboxReadinessViewModelAuditDraft,
    sanitizeGlobalShoppingProviderSandboxReadinessViewModel
  };
})();
