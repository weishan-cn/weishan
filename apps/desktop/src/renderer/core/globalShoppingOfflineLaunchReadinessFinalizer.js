;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_LAUNCH_READINESS_FINALIZER_VERSION = "4.2.6";
  const FINALIZER_NAME = "global_shopping_offline_launch_readiness_finalizer_v1";

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
  function safeMode(value) { return /^(disabled|finalizer_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "finalizer_only"; }
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
      finalizerPersisted:false,
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
      safe.executeRealLaunch === true ? "real_launch_detected" : "",
      safe.persistFinalizerResult === true ? "finalizer_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.gitMutation === true ? "git_mutation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.provider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineLaunchReadinessFinalizerSections(input) {
    const safe = obj(input);
    const publicReleaseEvidenceConsoleSummary = resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole");
    const noProviderUserAssurancePanelSummary = resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    const offlineReleaseMemorySnapshotSummary = resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const verifyE2eBuildSummary = obj(safe.verifyE2eBuildSummary);
    return clone([
      section("public_release_evidence_console", "Public Release Evidence Console", publicReleaseEvidenceConsoleSummary.status, labelOf(publicReleaseEvidenceConsoleSummary, "Public Release Evidence Console 仍需复核"), "Release Evidence 不生成真实证据文件。"),
      section("no_provider_user_assurance_panel", "No-Provider User Assurance Panel", noProviderUserAssurancePanelSummary.status, labelOf(noProviderUserAssurancePanelSummary, "No-Provider User Assurance Panel 仍需复核"), "User Assurance 不生成真实用户保证书。"),
      section("offline_release_memory_snapshot", "Offline Release Memory Snapshot", offlineReleaseMemorySnapshotSummary.status, labelOf(offlineReleaseMemorySnapshotSummary, "Offline Release Memory Snapshot 仍需复核"), "Release Memory 不持久化记忆快照。"),
      section("read_only_release_evidence_summary", "Read-Only Release Evidence Summary", readOnlyReleaseEvidenceSummary.status, labelOf(readOnlyReleaseEvidenceSummary, "Read-Only Release Evidence Summary 仍需复核"), "Release Evidence Summary 不写文件、不上传。"),
      section("verify_e2e_build_summary", "Verify / E2E / Build Summary", verifyE2eBuildSummary.status, labelOf(verifyE2eBuildSummary, "Verify / E2E / Build 仍需复核"), "Launch Finalizer 不执行真实 launch。")
    ]);
  }

  function buildGlobalShoppingOfflineLaunchReadinessFinalizerRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.offlineLaunchReadinessFinalizerSections).length ? toArray(safe.offlineLaunchReadinessFinalizerSections) : buildGlobalShoppingOfflineLaunchReadinessFinalizerSections(safe);
    return clone([
      row("offline_launch_readiness_finalizer_status", "Offline Launch Readiness Finalizer", obj(safe.userFacingSummary).resultLabel || "Offline Launch Readiness Finalizer 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_launch_readiness_finalizer_boundary", "Launch Finalizer 边界", "当前只展示 offline launch readiness finalizer。", "pass"),
      row("offline_launch_readiness_finalizer_guard", "只读说明", "不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，不执行真实 launch。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineLaunchReadinessFinalizer(input) {
    const safe = obj(input);
    const offlineLaunchReadinessFinalizerSections = buildGlobalShoppingOfflineLaunchReadinessFinalizerSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = offlineLaunchReadinessFinalizerSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = offlineLaunchReadinessFinalizerSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      finalizerName:FINALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_LAUNCH_READINESS_FINALIZER_VERSION,
      status:status,
      finalizerMode:safeMode(safe.finalizerMode),
      offlineLaunchReadinessFinalizerBoundary:{
        finalizerOnly:true,
        offlineMock:true,
        readOnly:true,
        canExecuteRealLaunch:false,
        canPersistFinalizerResult:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canMutateGit:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canActivateSandbox:false,
        canUseProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      offlineLaunchReadinessFinalizerSummary:{
        hasPublicReleaseEvidenceConsole:present(resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole")),
        hasNoProviderUserAssurancePanel:present(resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel")),
        hasOfflineReleaseMemorySnapshot:present(resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot")),
        hasReadOnlyReleaseEvidenceSummary:present(resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary")),
        hasVerifyE2eBuildSummary:present(obj(safe.verifyE2eBuildSummary)),
        offlineLaunchReadinessFinalizerSectionCount:offlineLaunchReadinessFinalizerSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForUserSafePublicClaimVerifier:status === "ready",
        humanLaunchReadinessFinalReviewRequired:true
      },
      offlineLaunchReadinessFinalizerSections:offlineLaunchReadinessFinalizerSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Launch Readiness Finalizer",
        resultLabel:status === "ready" ? "Offline Launch Readiness Finalizer 已准备" : (status === "blocked" ? "Offline Launch Readiness Finalizer 已阻断" : "Offline Launch Readiness Finalizer 仍需复核"),
        caveat:"Launch Finalizer 不执行真实 launch。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineLaunchReadinessFinalizerRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineLaunchReadinessFinalizerAuditDraft(input) {
    const finalizer = buildGlobalShoppingOfflineLaunchReadinessFinalizer(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_LAUNCH_READINESS_FINALIZER_AUDIT_DRAFT",
      finalizerName:FINALIZER_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_LAUNCH_READINESS_FINALIZER_VERSION,
      status:finalizer.status,
      offlineLaunchReadinessFinalizerSectionCount:obj(finalizer.offlineLaunchReadinessFinalizerSummary).offlineLaunchReadinessFinalizerSectionCount || 0,
      blockedSectionCount:obj(finalizer.offlineLaunchReadinessFinalizerSummary).blockedSectionCount || 0,
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
      upload:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineLaunchReadinessFinalizer(finalizer) {
    return evaluateGlobalShoppingOfflineLaunchReadinessFinalizer(finalizer || {});
  }

  function buildGlobalShoppingOfflineLaunchReadinessFinalizer(input) {
    try {
      return evaluateGlobalShoppingOfflineLaunchReadinessFinalizer(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineLaunchReadinessFinalizer({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineLaunchReadinessFinalizer = {
    GLOBAL_SHOPPING_OFFLINE_LAUNCH_READINESS_FINALIZER_VERSION,
    FINALIZER_NAME,
    buildGlobalShoppingOfflineLaunchReadinessFinalizer,
    evaluateGlobalShoppingOfflineLaunchReadinessFinalizer,
    buildGlobalShoppingOfflineLaunchReadinessFinalizerRows,
    buildGlobalShoppingOfflineLaunchReadinessFinalizerSections,
    buildGlobalShoppingOfflineLaunchReadinessFinalizerAuditDraft,
    sanitizeGlobalShoppingOfflineLaunchReadinessFinalizer
  };
})();
