;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ADAPTER_BOUNDARY_LOCK_VERSION = "4.2.0";
  const LOCK_NAME = "global_shopping_adapter_boundary_lock_v1";

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
  function gate(gateId, label, status, summary, caveat) {
    return { gateId:text(gateId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.lockRuntimeConfig === true ? "runtime_config_lock_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_modify_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.createProviderClient === true ? "provider_client_creation_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_capability_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingAdapterBoundaryLockGates(input) {
    const safe = obj(input);
    const contractKit = resolveSummary(safe, "offlineProviderAdapterContractKitSummary", "WeishanGlobalShoppingOfflineProviderAdapterContractKit", "buildGlobalShoppingOfflineProviderAdapterContractKit");
    const certificationCenter = resolveSummary(safe, "offlineProviderCertificationCenterSummary", "WeishanGlobalShoppingOfflineProviderCertificationCenter", "buildGlobalShoppingOfflineProviderCertificationCenter");
    const regressionLab = resolveSummary(safe, "mockIntegrationRegressionLabSummary", "WeishanGlobalShoppingMockIntegrationRegressionLab", "buildGlobalShoppingMockIntegrationRegressionLab");
    const evidenceBinder = resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    const vaultBoundary = present(safe.vaultBoundaryContractSummary) ? obj(safe.vaultBoundaryContractSummary) : resolveSummary(safe, "vaultBoundaryContractSummary", "WeishanGlobalShoppingVaultBoundaryContract", "buildGlobalShoppingVaultBoundaryContract");
    const safetySentinel = present(safe.safetySentinelSummary) ? obj(safe.safetySentinelSummary) : obj(safe.safetyRegressionSummary);
    const list = [
      ["offline_provider_adapter_contract_kit", "Offline Provider Adapter Contract Kit", contractKit, "只展示 contract kit 边界，不生成真实 SDK。"],
      ["offline_provider_certification_center", "Offline Provider Certification Center", certificationCenter, "只展示离线认证，不创建真实认证。"],
      ["mock_integration_regression_lab", "Mock Integration Regression Lab", regressionLab, "只展示离线回归，不运行真实 provider。"],
      ["human_approval_evidence_binder", "Human Approval Evidence Binder", evidenceBinder, "只展示人工审批证据，不保存审批结果。"],
      ["vault_boundary_contract", "Vault Boundary Contract", vaultBoundary, "只展示 vault boundary，不读取密钥。"],
      ["safety_sentinel", "Safety Sentinel", safetySentinel, "只复核安全边界，不修改配置。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      let status = !present(summary) ? "needs_review" : safeStatus(summary.status);
      if (item[0] === "safety_sentinel") status = summary.status === "pass" ? "ready" : (summary.status === "fail" || summary.status === "failed_safe" ? "blocked" : "needs_review");
      else if (status === "failed_safe") status = "blocked";
      return gate(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function buildGlobalShoppingAdapterBoundaryLockRows(input) {
    const safe = obj(input);
    const lockGates = toArray(safe.lockGates).length ? toArray(safe.lockGates) : buildGlobalShoppingAdapterBoundaryLockGates(safe);
    return clone([
      row("adapter_boundary_lock_status", "Adapter Boundary Lock 状态", obj(safe.userFacingSummary).resultLabel || "Adapter 边界锁仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("adapter_boundary_lock_boundary", "边界锁边界", "当前只读、只展示 adapter 安全边界，不修改配置，不启用或禁用 provider，不读取密钥。", "pass")
    ].concat(lockGates.map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingAdapterBoundaryLock(input) {
    const safe = obj(input);
    const lockGates = buildGlobalShoppingAdapterBoundaryLockGates(safe);
    const blockedReasons = blockedReasonList(safe).concat(lockGates.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.gateId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (lockGates.some(function (item) { return item.status === "needs_review"; }) ? "needs_review" : "ready");
    const lock = {
      lockName:LOCK_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_BOUNDARY_LOCK_VERSION,
      status:status,
      lockBoundary:{
        lockId:"global-shopping-adapter-boundary-lock",
        lockMode:"lock_only",
        lockOnly:true,
        readinessOnly:true,
        contractOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canLockRuntimeConfig:false,
        canModifyRuntimeConfig:false,
        canDisableProvider:false,
        canEnableProvider:false,
        canCreateProviderClient:false,
        canGenerateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canWriteFile:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      lockSummary:{
        hasContractKit:lockGates[0].status !== "needs_review",
        hasCertificationCenter:lockGates[1].status !== "needs_review",
        hasRegressionLab:lockGates[2].status !== "needs_review",
        hasEvidenceBinder:lockGates[3].status !== "needs_review",
        hasVaultBoundaryContract:lockGates[4].status !== "needs_review",
        hasSafetySentinel:lockGates[5].status !== "needs_review",
        lockGateCount:lockGates.length,
        blockedLockGateCount:lockGates.filter(function (item) { return item.status === "blocked"; }).length,
        needsReviewLockGateCount:lockGates.filter(function (item) { return item.status === "needs_review"; }).length,
        readyForCertificationViewModel:status === "ready",
        manualBoundaryReviewRequired:true
      },
      lockGates:lockGates,
      rows:[],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Adapter Boundary Lock",
        resultLabel:status === "ready" ? "Adapter 边界锁已准备" : (status === "blocked" ? "Adapter 边界锁已阻断" : "Adapter 边界锁仍需复核"),
        caveat:"该边界锁只展示 adapter 安全边界，不修改配置，不启用或禁用 provider，不读取密钥。"
      },
      safety:safety(),
      redacted:true
    };
    lock.rows = buildGlobalShoppingAdapterBoundaryLockRows(lock);
    return clone(lock);
  }

  function buildGlobalShoppingAdapterBoundaryLockAuditDraft(input) {
    const lock = buildGlobalShoppingAdapterBoundaryLock(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_ADAPTER_BOUNDARY_LOCK_AUDIT_DRAFT",
      lockName:LOCK_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_BOUNDARY_LOCK_VERSION,
      status:lock.status,
      lockGateCount:obj(lock.lockSummary).lockGateCount || 0,
      blockedReasonCount:toArray(lock.blockedReasons).length,
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

  function sanitizeGlobalShoppingAdapterBoundaryLock(lock) {
    return evaluateGlobalShoppingAdapterBoundaryLock(lock || {});
  }

  function buildGlobalShoppingAdapterBoundaryLock(input) {
    try {
      return evaluateGlobalShoppingAdapterBoundaryLock(input || {});
    } catch (_) {
      return evaluateGlobalShoppingAdapterBoundaryLock({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingAdapterBoundaryLock = {
    GLOBAL_SHOPPING_ADAPTER_BOUNDARY_LOCK_VERSION,
    LOCK_NAME,
    buildGlobalShoppingAdapterBoundaryLock,
    evaluateGlobalShoppingAdapterBoundaryLock,
    buildGlobalShoppingAdapterBoundaryLockRows,
    buildGlobalShoppingAdapterBoundaryLockGates,
    buildGlobalShoppingAdapterBoundaryLockAuditDraft,
    sanitizeGlobalShoppingAdapterBoundaryLock
  };
})();
