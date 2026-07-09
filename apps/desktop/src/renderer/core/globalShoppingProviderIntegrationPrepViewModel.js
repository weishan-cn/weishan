;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_INTEGRATION_PREP_VIEW_MODEL_VERSION = "4.2.7";
  const VIEW_MODEL_NAME = "global_shopping_provider_integration_prep_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
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
      return row(safe.rowId || safe.requirementId || safe.sectionId || safe.caseId || ("row_" + index), safe.label || safe.title || fallbackLabel || "摘要", safe.value || safe.summary || "", safe.status || "warning");
    });
  }

  function evaluate(input) {
    const safe = obj(input);
    const providerLegalReviewDossierSummary = resolveSummary(safe, "providerLegalReviewDossierSummary", "WeishanGlobalShoppingProviderLegalReviewDossier", "buildGlobalShoppingProviderLegalReviewDossier", safe);
    const credentialVaultInterfaceStubSummary = resolveSummary(safe, "credentialVaultInterfaceStubSummary", "WeishanGlobalShoppingCredentialVaultInterfaceStub", "buildGlobalShoppingCredentialVaultInterfaceStub", safe);
    const sandboxAdapterContractTestbedSummary = resolveSummary(safe, "sandboxAdapterContractTestbedSummary", "WeishanGlobalShoppingSandboxAdapterContractTestbed", "buildGlobalShoppingSandboxAdapterContractTestbed", safe);
    const blocked =
      statusOf(providerLegalReviewDossierSummary) === "blocked" ||
      statusOf(credentialVaultInterfaceStubSummary) === "blocked" ||
      statusOf(sandboxAdapterContractTestbedSummary) === "blocked" ||
      safe.startRealProviderIntegration === true ||
      safe.showCredentialInput === true ||
      safe.readRealApiKey === true ||
      safe.callNetwork === true ||
      safe.generateEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.enableProductionProvider === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const ready =
      statusOf(providerLegalReviewDossierSummary) === "ready" &&
      statusOf(credentialVaultInterfaceStubSummary) === "ready" &&
      statusOf(sandboxAdapterContractTestbedSummary) === "ready";
    const needsReview = !ready;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      providerLegalReviewDossierSummary:providerLegalReviewDossierSummary,
      credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary,
      sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary,
      blockedReasons:blocked ? ["provider_integration_prep_blocked"] : [],
      redacted:true
    });
  }

  function buildGlobalShoppingProviderIntegrationPrepCards(input) {
    const evaluation = evaluate(input);
    return clone([
      card("legal_review", "法务审查", obj(obj(evaluation.providerLegalReviewDossierSummary).userFacingSummary).resultLabel || "法务审查仍需复核"),
      card("credential_vault", "凭证接口桩", obj(obj(evaluation.credentialVaultInterfaceStubSummary).userFacingSummary).resultLabel || "凭证接口桩仍需复核"),
      card("adapter_contract", "Adapter 合同测试", obj(obj(evaluation.sandboxAdapterContractTestbedSummary).userFacingSummary).resultLabel || "Adapter 合同测试仍需复核"),
      card("risk_disclosure", "风险说明", "下一步仍需人工安全审批")
    ]);
  }

  function buildGlobalShoppingProviderIntegrationPrepRows(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.providerLegalReviewDossierSummary).rows, "法务审查");
  }
  function buildGlobalShoppingCredentialVaultRowsForView(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.credentialVaultInterfaceStubSummary).rows, "凭证接口桩");
  }
  function buildGlobalShoppingSandboxAdapterContractRowsForView(input) {
    const evaluation = evaluate(input);
    return rowsFrom(obj(evaluation.sandboxAdapterContractTestbedSummary).rows, "Adapter 合同测试");
  }

  function buildGlobalShoppingProviderIntegrationPrepViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingProviderIntegrationPrepViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_INTEGRATION_PREP_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_INTEGRATION_PREP_VIEW_MODEL_VERSION,
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

  function sanitizeGlobalShoppingProviderIntegrationPrepViewModel(viewModel) {
    const safe = obj(viewModel);
    const evaluation = evaluate(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_INTEGRATION_PREP_VIEW_MODEL_VERSION,
      status:status,
      title:"Provider 接入前准备",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingProviderIntegrationPrepCards(safe),
      legalReviewRows:toArray(safe.legalReviewRows).length ? toArray(safe.legalReviewRows) : buildGlobalShoppingProviderIntegrationPrepRows(safe),
      credentialVaultRows:toArray(safe.credentialVaultRows).length ? toArray(safe.credentialVaultRows) : buildGlobalShoppingCredentialVaultRowsForView(safe),
      adapterContractRows:toArray(safe.adapterContractRows).length ? toArray(safe.adapterContractRows) : buildGlobalShoppingSandboxAdapterContractRowsForView(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("prep_scope", "当前范围", "当前只展示 provider 接入前准备", "pass"),
        row("prep_boundary", "安全边界", "不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider", "pass"),
        row("prep_human_approval", "人工审批", "下一步仍需人工安全审批", "pass"),
        row("prep_no_actions", "禁止动作", "不提供 key 输入、网络测试、endpoint 生成或平台跳转", "pass")
      ],
      caveat:"当前只展示 provider 接入前准备，不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider。",
      providerLegalReviewDossierSummary:clone(evaluation.providerLegalReviewDossierSummary),
      credentialVaultInterfaceStubSummary:clone(evaluation.credentialVaultInterfaceStubSummary),
      sandboxAdapterContractTestbedSummary:clone(evaluation.sandboxAdapterContractTestbedSummary),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderIntegrationPrepViewModel(input) {
    try {
      return sanitizeGlobalShoppingProviderIntegrationPrepViewModel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderIntegrationPrepViewModel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderIntegrationPrepViewModel = {
    GLOBAL_SHOPPING_PROVIDER_INTEGRATION_PREP_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingProviderIntegrationPrepViewModel,
    buildGlobalShoppingProviderIntegrationPrepCards,
    buildGlobalShoppingProviderIntegrationPrepRows,
    buildGlobalShoppingCredentialVaultRowsForView,
    buildGlobalShoppingSandboxAdapterContractRowsForView,
    buildGlobalShoppingProviderIntegrationPrepViewModelAuditDraft,
    sanitizeGlobalShoppingProviderIntegrationPrepViewModel
  };
})();
