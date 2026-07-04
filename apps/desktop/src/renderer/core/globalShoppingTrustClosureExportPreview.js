;(function () {
  "use strict";

  const GLOBAL_SHOPPING_TRUST_CLOSURE_EXPORT_PREVIEW_VERSION = "4.1.8";
  const PREVIEW_NAME = "global_shopping_trust_closure_export_preview_v1";

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
  function safeMode(value) { return /^(disabled|export_preview_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "export_preview_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.generateRealExport === true ? "real_export_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistExportPreview === true ? "export_persistence_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.provider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingTrustClosureExportSections(input) {
    const safe = obj(input);
    const providerReadOnlyPublicReleaseCenterSummary = resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter");
    const providerPublicTrustClosureCenterSummary = resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter");
    const offlineReleaseMemorySnapshotSummary = resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    return clone([
      section("provider_read_only_public_release_center", "Provider Read-Only Public Release Center", providerReadOnlyPublicReleaseCenterSummary.status, labelOf(providerReadOnlyPublicReleaseCenterSummary, "Provider Read-Only Public Release Center 仍需复核"), "Export Preview 不生成真实导出文件。"),
      section("provider_public_trust_closure_center", "Provider Public Trust Closure Center", providerPublicTrustClosureCenterSummary.status, labelOf(providerPublicTrustClosureCenterSummary, "Provider Public Trust Closure Center 仍需复核"), "Public Trust Closure 不生成真实公开声明。"),
      section("offline_release_memory_snapshot", "Offline Release Memory Snapshot", offlineReleaseMemorySnapshotSummary.status, labelOf(offlineReleaseMemorySnapshotSummary, "Offline Release Memory Snapshot 仍需复核"), "Release Memory 不持久化记忆快照。"),
      section("final_user_trust_summary", "Final User Trust Summary", finalUserTrustSummarySummary.status, labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "User Trust Summary 不保存真实治理结论。"),
      section("read_only_release_evidence_summary", "Read-Only Release Evidence Summary", readOnlyReleaseEvidenceSummary.status, labelOf(readOnlyReleaseEvidenceSummary, "Read-Only Release Evidence Summary 仍需复核"), "Release Evidence 不持久化证据。")
    ]);
  }

  function buildGlobalShoppingTrustClosureExportRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.exportPreviewSections).length ? toArray(safe.exportPreviewSections) : buildGlobalShoppingTrustClosureExportSections(safe);
    return clone([
      row("trust_closure_export_preview_status", "Trust Closure Export Preview", obj(safe.userFacingSummary).resultLabel || "Trust Closure Export Preview 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("trust_closure_export_preview_boundary", "Export Preview 边界", "当前只展示 trust closure export preview。", "pass"),
      row("trust_closure_export_preview_guard", "只读说明", "不生成真实导出文件，不下载，不写文件，不上传，不发邮件。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingTrustClosureExportPreview(input) {
    const safe = obj(input);
    const exportPreviewSections = buildGlobalShoppingTrustClosureExportSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = exportPreviewSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = exportPreviewSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      previewName:PREVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_TRUST_CLOSURE_EXPORT_PREVIEW_VERSION,
      status:status,
      previewMode:safeMode(safe.previewMode),
      exportPreviewBoundary:{
        exportPreviewOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealExport:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canPersistExportPreview:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canUseProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      exportPreviewSummary:{
        hasProviderReadOnlyPublicReleaseCenter:present(resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter")),
        hasProviderPublicTrustClosureCenter:present(resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter")),
        hasOfflineReleaseMemorySnapshot:present(resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot")),
        hasFinalUserTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        hasReadOnlyReleaseEvidenceSummary:present(resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary")),
        exportPreviewSectionCount:exportPreviewSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForFinalNoProviderBoundaryReceipt:status === "ready"
      },
      exportPreviewSections:exportPreviewSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Trust Closure Export Preview",
        resultLabel:status === "ready" ? "Trust Closure Export Preview 已准备" : (status === "blocked" ? "Trust Closure Export Preview 已阻断" : "Trust Closure Export Preview 仍需复核"),
        caveat:"Export Preview 不生成真实导出文件。"
      },
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
    result.rows = buildGlobalShoppingTrustClosureExportRows(result);
    return clone(result);
  }

  function buildGlobalShoppingTrustClosureExportPreviewAuditDraft(input) {
    const preview = buildGlobalShoppingTrustClosureExportPreview(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_TRUST_CLOSURE_EXPORT_PREVIEW_AUDIT_DRAFT",
      previewName:PREVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_TRUST_CLOSURE_EXPORT_PREVIEW_VERSION,
      status:preview.status,
      exportPreviewSectionCount:obj(preview.exportPreviewSummary).exportPreviewSectionCount || 0,
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

  function sanitizeGlobalShoppingTrustClosureExportPreview(preview) {
    return evaluateGlobalShoppingTrustClosureExportPreview(preview || {});
  }

  function buildGlobalShoppingTrustClosureExportPreview(input) {
    try {
      return evaluateGlobalShoppingTrustClosureExportPreview(input || {});
    } catch (_) {
      return evaluateGlobalShoppingTrustClosureExportPreview({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingTrustClosureExportPreview = {
    GLOBAL_SHOPPING_TRUST_CLOSURE_EXPORT_PREVIEW_VERSION,
    PREVIEW_NAME,
    buildGlobalShoppingTrustClosureExportPreview,
    evaluateGlobalShoppingTrustClosureExportPreview,
    buildGlobalShoppingTrustClosureExportRows,
    buildGlobalShoppingTrustClosureExportSections,
    buildGlobalShoppingTrustClosureExportPreviewAuditDraft,
    sanitizeGlobalShoppingTrustClosureExportPreview
  };
})();
