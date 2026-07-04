;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_GATE_VERSION = "4.2.1";
  const GATE_NAME = "global_shopping_provider_offline_release_gate_v1";

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
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function boundaryReasons(input) {
    const safe = obj(input);
    return [
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderOfflineReleaseGates(input) {
    const safe = obj(input);
    const certificationCenterSummary = resolveSummary(safe, "offlineProviderCertificationCenterSummary", "WeishanGlobalShoppingOfflineProviderCertificationCenter", "buildGlobalShoppingOfflineProviderCertificationCenter");
    const regressionLabSummary = resolveSummary(safe, "mockIntegrationRegressionLabSummary", "WeishanGlobalShoppingMockIntegrationRegressionLab", "buildGlobalShoppingMockIntegrationRegressionLab");
    const evidenceBinderSummary = resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    const boundaryLockSummary = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    const certificationViewModelSummary = resolveSummary(safe, "providerCertificationViewModelSummary", "WeishanGlobalShoppingProviderCertificationViewModel", "buildGlobalShoppingProviderCertificationViewModel");
    return clone([
      gate("certification_center", "Offline Provider Certification Center", present(certificationCenterSummary) ? certificationCenterSummary.status : "needs_review", labelOf(certificationCenterSummary, "离线 Provider 认证仍需复核"), "只展示离线认证结果，不创建真实认证。"),
      gate("regression_lab", "Mock Integration Regression Lab", present(regressionLabSummary) ? regressionLabSummary.status : "needs_review", labelOf(regressionLabSummary, "Mock 集成回归仍需复核"), "只展示离线回归结果，不联网。"),
      gate("evidence_binder", "Human Approval Evidence Binder", present(evidenceBinderSummary) ? evidenceBinderSummary.status : "needs_review", labelOf(evidenceBinderSummary, "人工审批证据仍需复核"), "只展示人工证据摘要，不上传。"),
      gate("boundary_lock", "Adapter Boundary Lock", present(boundaryLockSummary) ? boundaryLockSummary.status : "needs_review", labelOf(boundaryLockSummary, "Adapter 边界锁仍需复核"), "只展示边界锁，不修改配置。"),
      gate("certification_view_model", "Provider Certification View Model", present(certificationViewModelSummary) ? certificationViewModelSummary.status : "needs_review", labelOf(certificationViewModelSummary, "Provider 离线认证视图仍需复核"), "只展示认证视图，不创建 release。")
    ]);
  }

  function buildGlobalShoppingProviderOfflineReleaseGateRows(input) {
    const safe = obj(input);
    const releaseGates = toArray(safe.releaseGates).length ? toArray(safe.releaseGates) : buildGlobalShoppingProviderOfflineReleaseGates(safe);
    return clone([
      row("provider_offline_release_gate_status", "Provider Offline Release Gate 状态", obj(safe.userFacingSummary).resultLabel || "离线发布仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_offline_release_gate_boundary", "离线发布边界", "该闸门只展示离线发布准备度，不创建 release，不创建 tag，不 push，不接真实 provider。", "pass")
    ].concat(releaseGates.map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderOfflineReleaseGate(input) {
    const safe = obj(input);
    const releaseGates = buildGlobalShoppingProviderOfflineReleaseGates(safe);
    const boundaryBlockedReasons = boundaryReasons(safe);
    const blockedUpstream = releaseGates.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewUpstream = releaseGates.filter(function (item) { return item.status === "needs_review"; });
    const status = boundaryBlockedReasons.length || blockedUpstream.length ? "blocked" : (needsReviewUpstream.length ? "needs_review" : "ready");
    const result = {
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_GATE_VERSION,
      status:status,
      releaseBoundary:{
        gateId:"global-shopping-provider-offline-release-gate",
        gateMode:"release_gate_only",
        releaseGateOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canCreateProviderClient:false,
        canModifyRuntimeConfig:false
      },
      releaseSummary:{
        hasCertificationCenter:releaseGates[0].status !== "needs_review",
        hasRegressionLab:releaseGates[1].status !== "needs_review",
        hasEvidenceBinder:releaseGates[2].status !== "needs_review",
        hasBoundaryLock:releaseGates[3].status !== "needs_review",
        hasCertificationViewModel:releaseGates[4].status !== "needs_review",
        releaseGateCount:releaseGates.length,
        hardBlockerCount:boundaryBlockedReasons.length + blockedUpstream.length,
        needsReviewGateCount:needsReviewUpstream.length,
        readyForCertificationFreezeLedger:status === "ready",
        humanReleaseReviewRequired:true
      },
      releaseGates:releaseGates,
      rows:[],
      blockedReasons:boundaryBlockedReasons.concat(blockedUpstream.map(function (item) { return item.gateId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Offline Release Gate",
        resultLabel:status === "ready" ? "离线发布闸门已准备" : (status === "blocked" ? "离线发布已阻断" : "离线发布仍需复核"),
        caveat:"该闸门只展示离线发布准备度，不创建 release，不创建 tag，不 push，不接真实 provider。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderOfflineReleaseGateRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderOfflineReleaseGateAuditDraft(input) {
    const gateSummary = buildGlobalShoppingProviderOfflineReleaseGate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_GATE_AUDIT_DRAFT",
      gateName:GATE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_GATE_VERSION,
      status:gateSummary.status,
      releaseGateCount:obj(gateSummary.releaseSummary).releaseGateCount || 0,
      hardBlockerCount:obj(gateSummary.releaseSummary).hardBlockerCount || 0,
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

  function sanitizeGlobalShoppingProviderOfflineReleaseGate(gateSummary) {
    return evaluateGlobalShoppingProviderOfflineReleaseGate(gateSummary || {});
  }

  function buildGlobalShoppingProviderOfflineReleaseGate(input) {
    try {
      return evaluateGlobalShoppingProviderOfflineReleaseGate(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderOfflineReleaseGate({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderOfflineReleaseGate = {
    GLOBAL_SHOPPING_PROVIDER_OFFLINE_RELEASE_GATE_VERSION,
    GATE_NAME,
    buildGlobalShoppingProviderOfflineReleaseGate,
    evaluateGlobalShoppingProviderOfflineReleaseGate,
    buildGlobalShoppingProviderOfflineReleaseGateRows,
    buildGlobalShoppingProviderOfflineReleaseGates,
    buildGlobalShoppingProviderOfflineReleaseGateAuditDraft,
    sanitizeGlobalShoppingProviderOfflineReleaseGate
  };
})();
