;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_RELEASE_EVIDENCE_SUMMARY_VERSION = "3.9.0";
  const SUMMARY_NAME = "global_shopping_read_only_release_evidence_summary_v1";

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
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistEvidence === true ? "evidence_persistence_detected" : "",
      safe.persistApproval === true ? "approval_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingReadOnlyReleaseEvidenceSections(input) {
    const safe = obj(input);
    const finalOfflineLaunchReviewConsoleSummary = resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const humanActivationFinalDossierSummary = resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier");
    const humanReleaseEvidenceTimelineSummary = resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline");
    const verifyE2eBuildSummary = present(safe.verifyE2eBuildSummary) ? obj(safe.verifyE2eBuildSummary) : { status:"needs_review", title:"verify/e2e/build summary", userFacingSummary:{ resultLabel:"verify/e2e/build 仍需复核", redacted:true }, redacted:true };
    return clone([
      section("final_offline_launch_review_console", "Final Offline Launch Review Console", present(finalOfflineLaunchReviewConsoleSummary) ? finalOfflineLaunchReviewConsoleSummary.status : "needs_review", labelOf(finalOfflineLaunchReviewConsoleSummary, "Final Review Console 仍需复核"), "Evidence Summary 不写文件、不上传。"),
      section("provider_activation_blocker_sentinel", "Provider Activation Blocker Sentinel", present(providerActivationBlockerSentinelSummary) ? providerActivationBlockerSentinelSummary.status : "needs_review", labelOf(providerActivationBlockerSentinelSummary, "Activation Blockers 仍需复核"), "Evidence Summary 不创建 release/tag。"),
      section("human_activation_final_dossier", "Human Activation Final Dossier", present(humanActivationFinalDossierSummary) ? humanActivationFinalDossierSummary.status : "needs_review", labelOf(humanActivationFinalDossierSummary, "Final Dossier 仍需复核"), "Evidence Summary 不持久化 evidence。"),
      section("human_release_evidence_timeline", "Human Release Evidence Timeline", present(humanReleaseEvidenceTimelineSummary) ? humanReleaseEvidenceTimelineSummary.status : "needs_review", labelOf(humanReleaseEvidenceTimelineSummary, "Evidence Timeline 仍需复核"), "Evidence Summary 不保存审批结果。"),
      section("verify_e2e_build_summary", "verify/e2e/build summary", safeStatus(verifyE2eBuildSummary.status), labelOf(verifyE2eBuildSummary, "verify/e2e/build 仍需复核"), "Evidence Summary 不激活 sandbox、不启动 provider。")
    ]);
  }

  function buildGlobalShoppingReadOnlyReleaseEvidenceRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.evidenceSections).length ? toArray(safe.evidenceSections) : buildGlobalShoppingReadOnlyReleaseEvidenceSections(safe);
    return clone([
      row("read_only_release_evidence_summary_status", "Read-Only Release Evidence Summary", obj(safe.userFacingSummary).resultLabel || "Read-Only Release Evidence Summary 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("read_only_release_evidence_summary_boundary", "Evidence Summary 边界", "该 Summary 只展示 release evidence，不写文件、不下载、不上传、不发邮件、不创建 release/tag，不 push。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingReadOnlyReleaseEvidenceSummary(input) {
    const safe = obj(input);
    const evidenceSections = buildGlobalShoppingReadOnlyReleaseEvidenceSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = evidenceSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = evidenceSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      summaryName:SUMMARY_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_RELEASE_EVIDENCE_SUMMARY_VERSION,
      status:status,
      summaryMode:"evidence_summary_only",
      evidenceBoundary:{
        evidenceSummaryOnly:true,
        offlineMock:true,
        readOnly:true,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistEvidence:false,
        canPersistApproval:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canStartProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      evidenceSummary:{
        hasFinalReviewConsole:present(resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole")),
        hasActivationBlocker:present(resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel")),
        hasFinalDossier:present(resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier")),
        hasEvidenceTimeline:present(resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline")),
        hasVerifyE2eBuildSummary:present(safe.verifyE2eBuildSummary),
        evidenceSectionCount:evidenceSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForDecisionMatrixReview:status === "ready",
        manualReleaseEvidenceReviewRequired:true
      },
      evidenceSections:evidenceSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Read-Only Release Evidence Summary",
        resultLabel:status === "ready" ? "Read-Only Release Evidence Summary 已准备" : (status === "blocked" ? "Read-Only Release Evidence Summary 已阻断" : "Read-Only Release Evidence Summary 仍需复核"),
        caveat:"该 Summary 只展示 release evidence，不写文件、不下载、不上传、不发邮件、不创建 release/tag，不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingReadOnlyReleaseEvidenceRows(result);
    return clone(result);
  }

  function buildGlobalShoppingReadOnlyReleaseEvidenceSummaryAuditDraft(input) {
    const summary = buildGlobalShoppingReadOnlyReleaseEvidenceSummary(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_RELEASE_EVIDENCE_SUMMARY_AUDIT_DRAFT",
      summaryName:SUMMARY_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_RELEASE_EVIDENCE_SUMMARY_VERSION,
      status:summary.status,
      evidenceSectionCount:obj(summary.evidenceSummary).evidenceSectionCount || 0,
      blockedSectionCount:obj(summary.evidenceSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingReadOnlyReleaseEvidenceSummary(summary) {
    return evaluateGlobalShoppingReadOnlyReleaseEvidenceSummary(summary || {});
  }

  function buildGlobalShoppingReadOnlyReleaseEvidenceSummary(input) {
    try {
      return evaluateGlobalShoppingReadOnlyReleaseEvidenceSummary(input || {});
    } catch (_) {
      return evaluateGlobalShoppingReadOnlyReleaseEvidenceSummary({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary = {
    GLOBAL_SHOPPING_READ_ONLY_RELEASE_EVIDENCE_SUMMARY_VERSION,
    SUMMARY_NAME,
    buildGlobalShoppingReadOnlyReleaseEvidenceSummary,
    evaluateGlobalShoppingReadOnlyReleaseEvidenceSummary,
    buildGlobalShoppingReadOnlyReleaseEvidenceRows,
    buildGlobalShoppingReadOnlyReleaseEvidenceSections,
    buildGlobalShoppingReadOnlyReleaseEvidenceSummaryAuditDraft,
    sanitizeGlobalShoppingReadOnlyReleaseEvidenceSummary
  };
})();
