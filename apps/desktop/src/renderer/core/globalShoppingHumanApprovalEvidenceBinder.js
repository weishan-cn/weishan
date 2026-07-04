;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HUMAN_APPROVAL_EVIDENCE_BINDER_VERSION = "4.1.9";
  const BINDER_NAME = "global_shopping_human_approval_evidence_binder_v1";

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
  function verifyE2eBuildSummary(input) {
    const safe = obj(input);
    const summary = obj(safe.verifyE2eBuildSummary || safe.verificationSummary);
    if (present(summary)) return summary;
    if (safe.verifyStatus || safe.verifyE2eStatus || safe.buildStatus) {
      return {
        status:(safe.verifyStatus === "ready" || safe.verifyStatus === "pass") && (safe.verifyE2eStatus === "ready" || safe.verifyE2eStatus === "pass") && (safe.buildStatus === "ready" || safe.buildStatus === "pass") ? "ready" : "needs_review",
        userFacingSummary:{
          resultLabel:text(safe.verifyStatus || safe.verifyE2eStatus || safe.buildStatus || "Verify / E2E / Build 仍需复核"),
          redacted:true
        },
        redacted:true
      };
    }
    return {};
  }
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.persistApprovalResult === true ? "approval_result_persistence_detected" : "",
      safe.generateRealEvidencePackage === true ? "real_evidence_package_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.startRealProvider === true ? "real_provider_start_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingHumanApprovalEvidenceSections(input) {
    const safe = obj(input);
    const certificationCenter = resolveSummary(safe, "offlineProviderCertificationCenterSummary", "WeishanGlobalShoppingOfflineProviderCertificationCenter", "buildGlobalShoppingOfflineProviderCertificationCenter");
    const regressionLab = resolveSummary(safe, "mockIntegrationRegressionLabSummary", "WeishanGlobalShoppingMockIntegrationRegressionLab", "buildGlobalShoppingMockIntegrationRegressionLab");
    const runbookCenter = resolveSummary(safe, "humanActivationRunbookCenterSummary", "WeishanGlobalShoppingHumanActivationRunbookCenter", "buildGlobalShoppingHumanActivationRunbookCenter");
    const complianceChecklist = resolveSummary(safe, "providerAdapterComplianceChecklistSummary", "WeishanGlobalShoppingProviderAdapterComplianceChecklist", "buildGlobalShoppingProviderAdapterComplianceChecklist");
    const releaseFreezeGate = present(safe.releaseFreezeGateSummary) ? obj(safe.releaseFreezeGateSummary) : obj(safe.sandboxProviderReleaseFreezeGateSummary);
    const verifySummary = verifyE2eBuildSummary(safe);
    const list = [
      ["offline_provider_certification_center", "Offline Provider Certification Center", certificationCenter, "只展示离线认证摘要，不生成真实认证。"],
      ["mock_integration_regression_lab", "Mock Integration Regression Lab", regressionLab, "只展示离线回归摘要，不运行真实 provider。"],
      ["human_activation_runbook_center", "Human Activation Runbook Center", runbookCenter, "只展示 runbook，不执行激活。"],
      ["provider_adapter_compliance_checklist", "Provider Adapter Compliance Checklist", complianceChecklist, "只展示合规要求，不创建 provider client。"],
      ["release_freeze_gate", "Release Freeze Gate", releaseFreezeGate, "只展示 freeze gate 摘要，不创建 release/tag。"],
      ["verify_e2e_build_summary", "Verify / E2E / Build Summary", verifySummary, "只展示验证摘要，不写文件、不下载。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      let status = !present(summary) ? "needs_review" : safeStatus(summary.status);
      if (status === "failed_safe") status = "blocked";
      return section(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function buildGlobalShoppingHumanApprovalEvidenceRows(input) {
    const safe = obj(input);
    const evidenceSections = toArray(safe.evidenceSections).length ? toArray(safe.evidenceSections) : buildGlobalShoppingHumanApprovalEvidenceSections(safe);
    return clone([
      row("human_approval_evidence_binder_status", "Human Approval Evidence Binder 状态", obj(safe.userFacingSummary).resultLabel || "人工审批证据仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("human_approval_evidence_binder_boundary", "证据夹边界", "当前只读、只展示证据摘要，不写文件，不下载，不上传，不保存审批结果。", "pass")
    ].concat(evidenceSections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingHumanApprovalEvidenceBinder(input) {
    const safe = obj(input);
    const evidenceSections = buildGlobalShoppingHumanApprovalEvidenceSections(safe);
    const blockedReasons = blockedReasonList(safe).concat(evidenceSections.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.sectionId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (evidenceSections.some(function (item) { return item.status === "needs_review"; }) ? "needs_review" : "ready");
    const binder = {
      binderName:BINDER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_APPROVAL_EVIDENCE_BINDER_VERSION,
      status:status,
      evidenceBoundary:{
        binderId:"global-shopping-human-approval-evidence-binder",
        binderMode:"binder_only",
        binderOnly:true,
        evidenceOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistApprovalResult:false,
        canGenerateRealEvidencePackage:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      evidenceSummary:{
        hasCertificationCenter:evidenceSections[0].status !== "needs_review",
        hasRegressionLab:evidenceSections[1].status !== "needs_review",
        hasRunbookCenter:evidenceSections[2].status !== "needs_review",
        hasComplianceChecklist:evidenceSections[3].status !== "needs_review",
        hasReleaseFreezeGate:evidenceSections[4].status !== "needs_review",
        hasVerifyE2eBuildSummary:evidenceSections[5].status !== "needs_review",
        evidenceSectionCount:evidenceSections.length,
        missingEvidenceCount:evidenceSections.filter(function (item) { return item.status === "needs_review"; }).length,
        blockedEvidenceCount:evidenceSections.filter(function (item) { return item.status === "blocked"; }).length,
        readyForAdapterBoundaryLock:status === "ready",
        humanApprovalStillRequired:true
      },
      evidenceSections:evidenceSections,
      rows:[],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Human Approval Evidence Binder",
        resultLabel:status === "ready" ? "人工审批证据夹已准备" : (status === "blocked" ? "人工审批证据已阻断" : "人工审批证据仍需复核"),
        caveat:"该证据夹只展示人工审批证据摘要，不写文件，不下载，不上传，不保存审批结果。"
      },
      safety:safety(),
      redacted:true
    };
    binder.rows = buildGlobalShoppingHumanApprovalEvidenceRows(binder);
    return clone(binder);
  }

  function buildGlobalShoppingHumanApprovalEvidenceBinderAuditDraft(input) {
    const binder = buildGlobalShoppingHumanApprovalEvidenceBinder(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HUMAN_APPROVAL_EVIDENCE_BINDER_AUDIT_DRAFT",
      binderName:BINDER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_APPROVAL_EVIDENCE_BINDER_VERSION,
      status:binder.status,
      evidenceSectionCount:obj(binder.evidenceSummary).evidenceSectionCount || 0,
      blockedReasonCount:toArray(binder.blockedReasons).length,
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

  function sanitizeGlobalShoppingHumanApprovalEvidenceBinder(binder) {
    return evaluateGlobalShoppingHumanApprovalEvidenceBinder(binder || {});
  }

  function buildGlobalShoppingHumanApprovalEvidenceBinder(input) {
    try {
      return evaluateGlobalShoppingHumanApprovalEvidenceBinder(input || {});
    } catch (_) {
      return evaluateGlobalShoppingHumanApprovalEvidenceBinder({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingHumanApprovalEvidenceBinder = {
    GLOBAL_SHOPPING_HUMAN_APPROVAL_EVIDENCE_BINDER_VERSION,
    BINDER_NAME,
    buildGlobalShoppingHumanApprovalEvidenceBinder,
    evaluateGlobalShoppingHumanApprovalEvidenceBinder,
    buildGlobalShoppingHumanApprovalEvidenceRows,
    buildGlobalShoppingHumanApprovalEvidenceSections,
    buildGlobalShoppingHumanApprovalEvidenceBinderAuditDraft,
    sanitizeGlobalShoppingHumanApprovalEvidenceBinder
  };
})();
