;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_ADAPTER_COMPLIANCE_CHECKLIST_VERSION = "3.0.0";
  const CHECKLIST_NAME = "global_shopping_provider_adapter_compliance_checklist_v1";

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
  function category(categoryId, label, status, summary, caveat) {
    return { categoryId:text(categoryId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
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
    };
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
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.persistChecklistResult === true ? "checklist_result_persistence_detected" : "",
      safe.generateRealSdk === true ? "real_sdk_generation_detected" : "",
      safe.importRealProviderSdk === true ? "real_provider_sdk_import_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createProviderClient === true ? "provider_client_creation_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_capability_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderAdapterComplianceCategories(input) {
    const safe = obj(input);
    const contractKit = resolveSummary(safe, "offlineProviderAdapterContractKitSummary", "WeishanGlobalShoppingOfflineProviderAdapterContractKit", "buildGlobalShoppingOfflineProviderAdapterContractKit");
    const qaMatrix = resolveSummary(safe, "mockSandboxQaMatrixSummary", "WeishanGlobalShoppingMockSandboxQaMatrix", "buildGlobalShoppingMockSandboxQaMatrix");
    const runbookCenter = resolveSummary(safe, "humanActivationRunbookCenterSummary", "WeishanGlobalShoppingHumanActivationRunbookCenter", "buildGlobalShoppingHumanActivationRunbookCenter");
    const vaultBoundary = resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract");
    const legalReview = resolveSummary(safe, "providerLegalReviewDossierSummary", "WeishanGlobalShoppingProviderLegalReviewDossier", "buildGlobalShoppingProviderLegalReviewDossier");
    const productionBlocker = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix");
    const list = [
      ["adapter_contract_kit", "Offline Provider Adapter Contract Kit", contractKit, "只展示 adapter 合同，不生成真实 SDK。"],
      ["mock_qa_matrix", "Mock Sandbox QA Matrix", qaMatrix, "只展示离线 QA 结果，不运行真实 provider。"],
      ["human_runbook_center", "Human Activation Runbook Center", runbookCenter, "只展示人工 runbook，不激活 sandbox。"],
      ["vault_boundary_contract", "Vault Boundary Contract", vaultBoundary, "只展示密钥边界，不读取密钥。"],
      ["legal_review_dossier", "Provider Legal Review Dossier", legalReview, "只展示法务材料，不代表已合作。"],
      ["production_blocker_matrix", "Production Blocker Matrix", productionBlocker, "只展示生产阻断条件，不启用 production provider。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      const status = !present(summary) ? "needs_review" : (safeStatus(summary.status) === "failed_safe" ? "blocked" : safeStatus(summary.status));
      return category(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function buildGlobalShoppingProviderAdapterComplianceRows(input) {
    const safe = obj(input);
    const complianceCategories = toArray(safe.complianceCategories).length ? toArray(safe.complianceCategories) : buildGlobalShoppingProviderAdapterComplianceCategories(safe);
    return clone([
      row("provider_adapter_compliance_checklist_status", "Provider Adapter Compliance Checklist 状态", obj(safe.userFacingSummary).resultLabel || "Adapter 合规清单仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_adapter_compliance_checklist_boundary", "合规边界", "当前只读、合同、离线，不生成真实 SDK，不创建 provider client，不联网。", "pass")
    ].concat(complianceCategories.map(function (item) {
      return row(item.categoryId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderAdapterComplianceChecklist(input) {
    const safe = obj(input);
    const complianceCategories = buildGlobalShoppingProviderAdapterComplianceCategories(safe);
    const blockedReasons = blockedReasonList(safe).concat(complianceCategories.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.categoryId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (complianceCategories.some(function (item) { return item.status === "needs_review"; }) ? "needs_review" : "ready");
    const checklist = {
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_COMPLIANCE_CHECKLIST_VERSION,
      status:status,
      complianceBoundary:{
        checklistId:"global-shopping-provider-adapter-compliance-checklist",
        checklistMode:"compliance_checklist_only",
        complianceChecklistOnly:true,
        readinessOnly:true,
        contractOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistChecklistResult:false,
        canGenerateRealSdk:false,
        canImportRealProviderSdk:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateProviderClient:false,
        canGenerateEndpoint:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      complianceSummary:{
        hasAdapterContractKit:complianceCategories[0].status !== "needs_review",
        hasQaMatrix:complianceCategories[1].status !== "needs_review",
        hasRunbookCenter:complianceCategories[2].status !== "needs_review",
        hasVaultBoundaryContract:complianceCategories[3].status !== "needs_review",
        hasLegalReviewDossier:complianceCategories[4].status !== "needs_review",
        hasProductionBlockerMatrix:complianceCategories[5].status !== "needs_review",
        complianceCategoryCount:complianceCategories.length,
        blockedComplianceCount:complianceCategories.filter(function (item) { return item.status === "blocked"; }).length,
        needsReviewComplianceCount:complianceCategories.filter(function (item) { return item.status === "needs_review"; }).length,
        readyForReleaseCandidateViewModel:status === "ready"
      },
      complianceCategories:complianceCategories,
      rows:[],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Provider Adapter Compliance Checklist",
        resultLabel:status === "ready" ? "Adapter 合规清单已准备" : (status === "blocked" ? "Adapter 合规清单已阻断" : "Adapter 合规清单仍需复核"),
        caveat:"该清单只展示 adapter 合规要求，不生成真实 SDK，不读取密钥，不联网，不创建 provider client。"
      },
      safety:safety(),
      redacted:true
    };
    checklist.rows = buildGlobalShoppingProviderAdapterComplianceRows(checklist);
    return clone(checklist);
  }

  function buildGlobalShoppingProviderAdapterComplianceChecklistAuditDraft(input) {
    const checklist = buildGlobalShoppingProviderAdapterComplianceChecklist(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_ADAPTER_COMPLIANCE_CHECKLIST_AUDIT_DRAFT",
      checklistName:CHECKLIST_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_ADAPTER_COMPLIANCE_CHECKLIST_VERSION,
      status:checklist.status,
      complianceCategoryCount:obj(checklist.complianceSummary).complianceCategoryCount || 0,
      blockedReasonCount:toArray(checklist.blockedReasons).length,
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

  function sanitizeGlobalShoppingProviderAdapterComplianceChecklist(checklist) {
    return evaluateGlobalShoppingProviderAdapterComplianceChecklist(checklist || {});
  }

  function buildGlobalShoppingProviderAdapterComplianceChecklist(input) {
    try {
      return evaluateGlobalShoppingProviderAdapterComplianceChecklist(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderAdapterComplianceChecklist({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderAdapterComplianceChecklist = {
    GLOBAL_SHOPPING_PROVIDER_ADAPTER_COMPLIANCE_CHECKLIST_VERSION,
    CHECKLIST_NAME,
    buildGlobalShoppingProviderAdapterComplianceChecklist,
    evaluateGlobalShoppingProviderAdapterComplianceChecklist,
    buildGlobalShoppingProviderAdapterComplianceRows,
    buildGlobalShoppingProviderAdapterComplianceCategories,
    buildGlobalShoppingProviderAdapterComplianceChecklistAuditDraft,
    sanitizeGlobalShoppingProviderAdapterComplianceChecklist
  };
})();
