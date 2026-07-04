;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_PROVIDER_CERTIFICATION_CENTER_VERSION = "4.2.2";
  const CENTER_NAME = "global_shopping_offline_provider_certification_center_v1";

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
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.createRealCertification === true ? "real_certification_creation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.startRealProvider === true ? "real_provider_start_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.createProviderClient === true ? "provider_client_creation_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineProviderCertificationSections(input) {
    const safe = obj(input);
    const releaseCandidateViewModel = resolveSummary(safe, "providerSandboxReleaseCandidateViewModelSummary", "WeishanGlobalShoppingProviderSandboxReleaseCandidateViewModel", "buildGlobalShoppingProviderSandboxReleaseCandidateViewModel");
    const adapterComplianceChecklist = resolveSummary(safe, "providerAdapterComplianceChecklistSummary", "WeishanGlobalShoppingProviderAdapterComplianceChecklist", "buildGlobalShoppingProviderAdapterComplianceChecklist");
    const qaMatrix = resolveSummary(safe, "mockSandboxQaMatrixSummary", "WeishanGlobalShoppingMockSandboxQaMatrix", "buildGlobalShoppingMockSandboxQaMatrix");
    const adapterContractKit = resolveSummary(safe, "offlineProviderAdapterContractKitSummary", "WeishanGlobalShoppingOfflineProviderAdapterContractKit", "buildGlobalShoppingOfflineProviderAdapterContractKit");
    const humanActivationRunbook = resolveSummary(safe, "humanActivationRunbookCenterSummary", "WeishanGlobalShoppingHumanActivationRunbookCenter", "buildGlobalShoppingHumanActivationRunbookCenter");
    const list = [
      ["release_candidate_view_model", "Provider Sandbox Release Candidate View Model", releaseCandidateViewModel, "只展示 release candidate 只读视图，不创建 release。"],
      ["adapter_compliance_checklist", "Provider Adapter Compliance Checklist", adapterComplianceChecklist, "只展示 adapter 合规要求，不创建 provider client。"],
      ["mock_sandbox_qa_matrix", "Mock Sandbox QA Matrix", qaMatrix, "只展示离线 QA 结果，不运行真实 provider。"],
      ["offline_adapter_contract_kit", "Offline Provider Adapter Contract Kit", adapterContractKit, "只展示 adapter 合同，不生成真实 SDK。"],
      ["human_activation_runbook", "Human Activation Runbook Center", humanActivationRunbook, "只展示人工 runbook，不启用 provider。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      const status = !present(summary) ? "needs_review" : (safeStatus(summary.status) === "failed_safe" ? "blocked" : safeStatus(summary.status));
      return section(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function buildGlobalShoppingOfflineProviderCertificationRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.certificationSections).length ? toArray(safe.certificationSections) : buildGlobalShoppingOfflineProviderCertificationSections(safe);
    return clone([
      row("offline_provider_certification_center_status", "Offline Provider Certification Center 状态", obj(safe.userFacingSummary).resultLabel || "离线 Provider 认证仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_provider_certification_center_boundary", "认证中心边界", "当前只读、离线、mock，不生成真实认证文件，不联网，不读取密钥，不创建 provider client。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineProviderCertificationCenter(input) {
    const safe = obj(input);
    const certificationSections = buildGlobalShoppingOfflineProviderCertificationSections(safe);
    const blockedReasons = blockedReasonList(safe).concat(certificationSections.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.sectionId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (certificationSections.some(function (item) { return item.status === "needs_review"; }) ? "needs_review" : "ready");
    const center = {
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_CERTIFICATION_CENTER_VERSION,
      status:status,
      certificationBoundary:{
        centerId:"global-shopping-offline-provider-certification-center",
        centerMode:"certification_only",
        certificationOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canCreateRealCertification:false,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canCreateProviderClient:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      certificationSummary:{
        hasReleaseCandidateViewModel:certificationSections[0].status !== "needs_review",
        hasAdapterComplianceChecklist:certificationSections[1].status !== "needs_review",
        hasQaMatrix:certificationSections[2].status !== "needs_review",
        hasAdapterContractKit:certificationSections[3].status !== "needs_review",
        hasHumanActivationRunbook:certificationSections[4].status !== "needs_review",
        certificationSectionCount:certificationSections.length,
        passedSectionCount:certificationSections.filter(function (item) { return item.status === "ready"; }).length,
        needsReviewSectionCount:certificationSections.filter(function (item) { return item.status === "needs_review"; }).length,
        blockedSectionCount:certificationSections.filter(function (item) { return item.status === "blocked"; }).length,
        readyForMockIntegrationRegressionLab:status === "ready",
        humanCertificationReviewRequired:true
      },
      certificationSections:certificationSections,
      rows:[],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Offline Provider Certification Center",
        resultLabel:status === "ready" ? "离线 Provider 认证中心已准备" : (status === "blocked" ? "离线 Provider 认证已阻断" : "离线 Provider 认证仍需复核"),
        caveat:"该认证中心只展示离线 readiness certification，不生成真实认证文件，不联网，不读取密钥，不创建 provider client。"
      },
      safety:safety(),
      redacted:true
    };
    center.rows = buildGlobalShoppingOfflineProviderCertificationRows(center);
    return clone(center);
  }

  function buildGlobalShoppingOfflineProviderCertificationCenterAuditDraft(input) {
    const center = buildGlobalShoppingOfflineProviderCertificationCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_PROVIDER_CERTIFICATION_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_CERTIFICATION_CENTER_VERSION,
      status:center.status,
      certificationSectionCount:obj(center.certificationSummary).certificationSectionCount || 0,
      blockedReasonCount:toArray(center.blockedReasons).length,
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

  function sanitizeGlobalShoppingOfflineProviderCertificationCenter(center) {
    return evaluateGlobalShoppingOfflineProviderCertificationCenter(center || {});
  }

  function buildGlobalShoppingOfflineProviderCertificationCenter(input) {
    try {
      return evaluateGlobalShoppingOfflineProviderCertificationCenter(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineProviderCertificationCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineProviderCertificationCenter = {
    GLOBAL_SHOPPING_OFFLINE_PROVIDER_CERTIFICATION_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingOfflineProviderCertificationCenter,
    evaluateGlobalShoppingOfflineProviderCertificationCenter,
    buildGlobalShoppingOfflineProviderCertificationRows,
    buildGlobalShoppingOfflineProviderCertificationSections,
    buildGlobalShoppingOfflineProviderCertificationCenterAuditDraft,
    sanitizeGlobalShoppingOfflineProviderCertificationCenter
  };
})();
