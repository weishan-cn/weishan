;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_RELEASE_MEMORY_SNAPSHOT_VERSION = "3.7.0";
  const SNAPSHOT_NAME = "global_shopping_offline_release_memory_snapshot_v1";

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
  function safeMode(value) { return /^(disabled|memory_snapshot_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "memory_snapshot_only"; }
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
      externalDocument:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      memorySnapshotPersisted:false,
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
      safe.persistMemorySnapshot === true ? "memory_snapshot_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
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

  function buildGlobalShoppingOfflineReleaseMemorySnapshotSections(input) {
    const safe = obj(input);
    const providerPublicTrustClosureCenterSummary = resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter");
    const providerDistributionFreezeConsoleSummary = resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const verifyE2eBuildSummary = obj(safe.verifyE2eBuildSummary);
    return clone([
      section("provider_public_trust_closure_center", "Provider Public Trust Closure Center", present(providerPublicTrustClosureCenterSummary) ? providerPublicTrustClosureCenterSummary.status : "needs_review", labelOf(providerPublicTrustClosureCenterSummary, "Provider Public Trust Closure Center 仍需复核"), "Release Memory 不持久化记忆快照。"),
      section("provider_distribution_freeze_console", "Provider Distribution Freeze Console", present(providerDistributionFreezeConsoleSummary) ? providerDistributionFreezeConsoleSummary.status : "needs_review", labelOf(providerDistributionFreezeConsoleSummary, "Provider Distribution Freeze Console 仍需复核"), "Distribution Freeze 不创建真实分发包。"),
      section("final_user_trust_summary", "Final User Trust Summary", present(finalUserTrustSummarySummary) ? finalUserTrustSummarySummary.status : "needs_review", labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "User Trust Summary 不写文件、不保存用户原文。"),
      section("read_only_release_evidence_summary", "Read-Only Release Evidence Summary", present(readOnlyReleaseEvidenceSummary) ? readOnlyReleaseEvidenceSummary.status : "needs_review", labelOf(readOnlyReleaseEvidenceSummary, "Read-Only Release Evidence Summary 仍需复核"), "Release Evidence 只展示脱敏摘要。"),
      section("verify_e2e_build_summary", "verify/e2e/build Summary", present(verifyE2eBuildSummary) ? safeStatus(verifyE2eBuildSummary.status) : "needs_review", labelOf(verifyE2eBuildSummary, "verify/e2e/build Summary 仍需复核"), "verify/e2e/build Summary 只展示离线快照。")
    ]);
  }

  function buildGlobalShoppingOfflineReleaseMemorySnapshotRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.snapshotSections).length ? toArray(safe.snapshotSections) : buildGlobalShoppingOfflineReleaseMemorySnapshotSections(safe);
    return clone([
      row("offline_release_memory_snapshot_status", "Offline Release Memory Snapshot", obj(safe.userFacingSummary).resultLabel || "Offline Release Memory Snapshot 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_release_memory_snapshot_boundary", "Release Memory 边界", "Release Memory 不持久化记忆快照。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineReleaseMemorySnapshot(input) {
    const safe = obj(input);
    const snapshotSections = buildGlobalShoppingOfflineReleaseMemorySnapshotSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = snapshotSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = snapshotSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_RELEASE_MEMORY_SNAPSHOT_VERSION,
      status:status,
      snapshotMode:safeMode(safe.snapshotMode),
      snapshotBoundary:{
        memorySnapshotOnly:true,
        offlineMock:true,
        readOnly:true,
        canPersistMemorySnapshot:false,
        canWriteFile:false,
        canUpload:false,
        canDownload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
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
      snapshotSummary:{
        hasProviderPublicTrustClosureCenter:present(resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter")),
        hasProviderDistributionFreezeConsole:present(resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole")),
        hasFinalUserTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        hasReadOnlyReleaseEvidenceSummary:present(resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary")),
        hasVerifyE2eBuildSummary:present(obj(safe.verifyE2eBuildSummary)),
        snapshotSectionCount:snapshotSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForNoProviderExecutionFinalGuard:status === "ready"
      },
      snapshotSections:snapshotSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Release Memory Snapshot",
        resultLabel:status === "ready" ? "Offline Release Memory Snapshot 已准备" : (status === "blocked" ? "Offline Release Memory Snapshot 已阻断" : "Offline Release Memory Snapshot 仍需复核"),
        caveat:"Release Memory 不持久化记忆快照。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineReleaseMemorySnapshotRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineReleaseMemorySnapshotAuditDraft(input) {
    const snapshot = buildGlobalShoppingOfflineReleaseMemorySnapshot(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_RELEASE_MEMORY_SNAPSHOT_AUDIT_DRAFT",
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_RELEASE_MEMORY_SNAPSHOT_VERSION,
      status:snapshot.status,
      snapshotSectionCount:obj(snapshot.snapshotSummary).snapshotSectionCount || 0,
      blockedSectionCount:obj(snapshot.snapshotSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingOfflineReleaseMemorySnapshot(snapshot) {
    return evaluateGlobalShoppingOfflineReleaseMemorySnapshot(snapshot || {});
  }

  function buildGlobalShoppingOfflineReleaseMemorySnapshot(input) {
    try {
      return evaluateGlobalShoppingOfflineReleaseMemorySnapshot(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineReleaseMemorySnapshot({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineReleaseMemorySnapshot = {
    GLOBAL_SHOPPING_OFFLINE_RELEASE_MEMORY_SNAPSHOT_VERSION,
    SNAPSHOT_NAME,
    buildGlobalShoppingOfflineReleaseMemorySnapshot,
    evaluateGlobalShoppingOfflineReleaseMemorySnapshot,
    buildGlobalShoppingOfflineReleaseMemorySnapshotRows,
    buildGlobalShoppingOfflineReleaseMemorySnapshotSections,
    buildGlobalShoppingOfflineReleaseMemorySnapshotAuditDraft,
    sanitizeGlobalShoppingOfflineReleaseMemorySnapshot
  };
})();
