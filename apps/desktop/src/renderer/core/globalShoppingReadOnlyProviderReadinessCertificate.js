;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_PROVIDER_READINESS_CERTIFICATE_VERSION = "3.3.0";
  const CERTIFICATE_NAME = "global_shopping_read_only_provider_readiness_certificate_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|certificate_summary_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "certificate_summary_only"; }
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      certificateStored:false,
      approvalStored:false,
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
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.generateRealCertificate === true ? "real_certificate_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistCertificate === true ? "certificate_persistence_detected" : "",
      safe.persistApproval === true ? "approval_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startProvider === true ? "provider_start_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingReadOnlyProviderReadinessCertificateSections(input) {
    const safe = obj(input);
    const providerFinalSafetySealSummary = resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal");
    const offlineActivationWarRoomSummary = resolveSummary(safe, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const humanActivationFinalDossierSummary = resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier");
    const verifyE2eBuildSummary = present(safe.verifyE2eBuildSummary) ? obj(safe.verifyE2eBuildSummary) : {};
    return clone([
      section("provider_final_safety_seal", "Provider Final Safety Seal", present(providerFinalSafetySealSummary) ? providerFinalSafetySealSummary.status : "needs_review", labelOf(providerFinalSafetySealSummary, "Safety Seal 仍需复核"), "Safety Seal 不生成真实证书、不写文件。"),
      section("offline_activation_war_room", "Offline Activation War Room", present(offlineActivationWarRoomSummary) ? offlineActivationWarRoomSummary.status : "needs_review", labelOf(offlineActivationWarRoomSummary, "Activation War Room 仍需复核"), "Activation War Room 不激活 sandbox、不启用 provider。"),
      section("read_only_release_evidence_summary", "Read-Only Release Evidence Summary", present(readOnlyReleaseEvidenceSummary) ? readOnlyReleaseEvidenceSummary.status : "needs_review", labelOf(readOnlyReleaseEvidenceSummary, "Evidence Summary 仍需复核"), "Evidence Summary 不写文件、不上传。"),
      section("human_activation_final_dossier", "Human Activation Final Dossier", present(humanActivationFinalDossierSummary) ? humanActivationFinalDossierSummary.status : "needs_review", labelOf(humanActivationFinalDossierSummary, "Final Dossier 仍需复核"), "Readiness Certificate 不持久化证书。"),
      section("verify_e2e_build_summary", "verify/e2e/build summary", present(verifyE2eBuildSummary) ? safeStatus(verifyE2eBuildSummary.status || "needs_review") : "needs_review", labelOf(verifyE2eBuildSummary, "verify/e2e/build 仍需复核"), "Readiness Certificate 不创建 release、不 push。")
    ]);
  }

  function buildGlobalShoppingReadOnlyProviderReadinessCertificateRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.certificateSections).length ? toArray(safe.certificateSections) : buildGlobalShoppingReadOnlyProviderReadinessCertificateSections(safe);
    return clone([
      row("read_only_provider_readiness_certificate_status", "Read-Only Provider Readiness Certificate", obj(safe.userFacingSummary).resultLabel || "Read-Only Provider Readiness Certificate 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("read_only_provider_readiness_certificate_boundary", "Readiness Certificate 边界", "该 Certificate 只展示只读 readiness 摘要，不生成真实证书、不写文件、不创建 release/tag、不 push。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingReadOnlyProviderReadinessCertificate(input) {
    const safe = obj(input);
    const certificateSections = buildGlobalShoppingReadOnlyProviderReadinessCertificateSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = certificateSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = certificateSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      certificateName:CERTIFICATE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_READINESS_CERTIFICATE_VERSION,
      status:status,
      certificateMode:safeMode(safe.certificateMode),
      certificateBoundary:{
        certificateSummaryOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealCertificate:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistCertificate:false,
        canPersistApproval:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canStartProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      certificateSummary:{
        hasFinalSafetySeal:present(resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal")),
        hasActivationWarRoom:present(resolveSummary(safe, "offlineActivationWarRoomSummary", "WeishanGlobalShoppingOfflineActivationWarRoom", "buildGlobalShoppingOfflineActivationWarRoom")),
        hasEvidenceSummary:present(resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary")),
        hasFinalDossier:present(resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier")),
        hasVerifyE2eBuildSummary:present(safe.verifyE2eBuildSummary),
        certificateSectionCount:certificateSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForNoActivationGuarantee:status === "ready",
        humanFinalSafetyReviewRequired:true
      },
      certificateSections:certificateSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Read-Only Provider Readiness Certificate",
        resultLabel:status === "ready" ? "Read-Only Provider Readiness Certificate 已准备" : (status === "blocked" ? "Read-Only Provider Readiness Certificate 已阻断" : "Read-Only Provider Readiness Certificate 仍需复核"),
        caveat:"该 Certificate 只展示只读 readiness 摘要，不生成真实证书、不写文件、不创建 release/tag、不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingReadOnlyProviderReadinessCertificateRows(result);
    return clone(result);
  }

  function buildGlobalShoppingReadOnlyProviderReadinessCertificateAuditDraft(input) {
    const certificate = buildGlobalShoppingReadOnlyProviderReadinessCertificate(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_PROVIDER_READINESS_CERTIFICATE_AUDIT_DRAFT",
      certificateName:CERTIFICATE_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PROVIDER_READINESS_CERTIFICATE_VERSION,
      status:certificate.status,
      certificateSectionCount:obj(certificate.certificateSummary).certificateSectionCount || 0,
      blockedSectionCount:obj(certificate.certificateSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingReadOnlyProviderReadinessCertificate(certificate) {
    return evaluateGlobalShoppingReadOnlyProviderReadinessCertificate(certificate || {});
  }

  function buildGlobalShoppingReadOnlyProviderReadinessCertificate(input) {
    try {
      return evaluateGlobalShoppingReadOnlyProviderReadinessCertificate(input || {});
    } catch (_) {
      return evaluateGlobalShoppingReadOnlyProviderReadinessCertificate({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingReadOnlyProviderReadinessCertificate = {
    GLOBAL_SHOPPING_READ_ONLY_PROVIDER_READINESS_CERTIFICATE_VERSION,
    CERTIFICATE_NAME,
    buildGlobalShoppingReadOnlyProviderReadinessCertificate,
    evaluateGlobalShoppingReadOnlyProviderReadinessCertificate,
    buildGlobalShoppingReadOnlyProviderReadinessCertificateRows,
    buildGlobalShoppingReadOnlyProviderReadinessCertificateSections,
    buildGlobalShoppingReadOnlyProviderReadinessCertificateAuditDraft,
    sanitizeGlobalShoppingReadOnlyProviderReadinessCertificate
  };
})();
