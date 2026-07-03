;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FINAL_USER_TRUST_SUMMARY_VERSION = "4.0.7";
  const SUMMARY_NAME = "global_shopping_final_user_trust_summary_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|trust_summary_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "trust_summary_only"; }
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
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      summaryStored:false,
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
      safe.createCertificate === true ? "certificate_generation_detected" : "",
      safe.createReport === true ? "report_generation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistTrustSummary === true ? "trust_summary_persistence_detected" : "",
      safe.persistUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startProvider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingFinalUserTrustSummarySections(input) {
    const safe = obj(input);
    const offlineDistributionReadinessCenterSummary = resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter");
    const noActivationEnforcementLedgerSummary = resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger");
    const readOnlyProviderReadinessCertificateSummary = resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const verifyE2eBuildSummary = present(safe.verifyE2eBuildSummary) ? obj(safe.verifyE2eBuildSummary) : {};
    return clone([
      section("offline_distribution_readiness_center", "Offline Distribution Readiness Center", present(offlineDistributionReadinessCenterSummary) ? offlineDistributionReadinessCenterSummary.status : "needs_review", labelOf(offlineDistributionReadinessCenterSummary, "Offline Distribution Readiness Center 仍需复核"), "Distribution Readiness 不创建真实分发包。"),
      section("no_activation_enforcement_ledger", "No-Activation Enforcement Ledger", present(noActivationEnforcementLedgerSummary) ? noActivationEnforcementLedgerSummary.status : "needs_review", labelOf(noActivationEnforcementLedgerSummary, "No-Activation Enforcement Ledger 仍需复核"), "No-Activation Enforcement 不执行真实阻断。"),
      section("read_only_provider_readiness_certificate", "Read-Only Provider Readiness Certificate", present(readOnlyProviderReadinessCertificateSummary) ? readOnlyProviderReadinessCertificateSummary.status : "needs_review", labelOf(readOnlyProviderReadinessCertificateSummary, "Read-Only Provider Readiness Certificate 仍需复核"), "User Trust Summary 不生成真实证书。"),
      section("read_only_release_evidence_summary", "Read-Only Release Evidence Summary", present(readOnlyReleaseEvidenceSummary) ? readOnlyReleaseEvidenceSummary.status : "needs_review", labelOf(readOnlyReleaseEvidenceSummary, "Read-Only Release Evidence Summary 仍需复核"), "User Trust Summary 不生成真实报告。"),
      section("verify_e2e_build_summary", "verify/e2e/build summary", present(verifyE2eBuildSummary) ? safeStatus(verifyE2eBuildSummary.status || "needs_review") : "needs_review", labelOf(verifyE2eBuildSummary, "verify/e2e/build 仍需复核"), "User Trust Summary 不写文件、不保存用户原文。")
    ]);
  }

  function buildGlobalShoppingFinalUserTrustSummaryRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.trustSections).length ? toArray(safe.trustSections) : buildGlobalShoppingFinalUserTrustSummarySections(safe);
    return clone([
      row("final_user_trust_summary_status", "Final User Trust Summary", obj(safe.userFacingSummary).resultLabel || "Final User Trust Summary 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("final_user_trust_summary_boundary", "User Trust Summary 边界", "该 Summary 只展示面向用户的最终信任摘要，不写文件、不生成真实证书或报告。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingFinalUserTrustSummary(input) {
    const safe = obj(input);
    const trustSections = buildGlobalShoppingFinalUserTrustSummarySections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = trustSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = trustSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      summaryName:SUMMARY_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_USER_TRUST_SUMMARY_VERSION,
      status:status,
      summaryMode:safeMode(safe.summaryMode),
      trustBoundary:{
        trustSummaryOnly:true,
        offlineMock:true,
        readOnly:true,
        canCreateCertificate:false,
        canCreateReport:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistTrustSummary:false,
        canPersistUserText:false,
        canPersistRawProviderData:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canUseRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      trustSummary:{
        hasDistributionReadinessCenter:present(resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter")),
        hasEnforcementLedger:present(resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger")),
        hasReadinessCertificate:present(resolveSummary(safe, "readOnlyProviderReadinessCertificateSummary", "WeishanGlobalShoppingReadOnlyProviderReadinessCertificate", "buildGlobalShoppingReadOnlyProviderReadinessCertificate")),
        hasReleaseEvidenceSummary:present(resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary")),
        hasVerifyE2eBuildSummary:present(safe.verifyE2eBuildSummary),
        trustSectionCount:trustSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForProviderSafetyDistributionMatrix:status === "ready",
        humanDistributionReadinessReviewRequired:true
      },
      trustSections:trustSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Final User Trust Summary",
        resultLabel:status === "ready" ? "Final User Trust Summary 已准备" : (status === "blocked" ? "Final User Trust Summary 已阻断" : "Final User Trust Summary 仍需复核"),
        caveat:"该 Summary 只展示面向用户的最终信任摘要，不写文件、不生成真实证书或报告。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingFinalUserTrustSummaryRows(result);
    return clone(result);
  }

  function buildGlobalShoppingFinalUserTrustSummaryAuditDraft(input) {
    const summary = buildGlobalShoppingFinalUserTrustSummary(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FINAL_USER_TRUST_SUMMARY_AUDIT_DRAFT",
      summaryName:SUMMARY_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_USER_TRUST_SUMMARY_VERSION,
      status:summary.status,
      trustSectionCount:obj(summary.trustSummary).trustSectionCount || 0,
      blockedSectionCount:obj(summary.trustSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingFinalUserTrustSummary(summary) {
    return evaluateGlobalShoppingFinalUserTrustSummary(summary || {});
  }

  function buildGlobalShoppingFinalUserTrustSummary(input) {
    try {
      return evaluateGlobalShoppingFinalUserTrustSummary(input || {});
    } catch (_) {
      return evaluateGlobalShoppingFinalUserTrustSummary({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingFinalUserTrustSummary = {
    GLOBAL_SHOPPING_FINAL_USER_TRUST_SUMMARY_VERSION,
    SUMMARY_NAME,
    buildGlobalShoppingFinalUserTrustSummary,
    evaluateGlobalShoppingFinalUserTrustSummary,
    buildGlobalShoppingFinalUserTrustSummaryRows,
    buildGlobalShoppingFinalUserTrustSummarySections,
    buildGlobalShoppingFinalUserTrustSummaryAuditDraft,
    sanitizeGlobalShoppingFinalUserTrustSummary
  };
})();
