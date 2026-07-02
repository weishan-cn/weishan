;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_READ_ONLY_PUBLIC_RELEASE_CENTER_VERSION = "4.0.4";
  const CENTER_NAME = "global_shopping_provider_read_only_public_release_center_v1";

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
  function safeMode(value) { return /^(disabled|public_release_preview_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "public_release_preview_only"; }
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
      publicReleasePersisted:false,
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
      safe.createRealPublicRelease === true ? "real_public_release_detected" : "",
      safe.generateRealPublicStatementFile === true ? "real_public_statement_file_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistPublicReleaseResult === true ? "public_release_result_persistence_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.gitMutation === true ? "git_mutation_detected" : "",
      safe.mutateConfig === true ? "config_mutation_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.provider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.endpoint === true ? "endpoint_detected" : "",
      safe.providerClient === true ? "provider_client_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderReadOnlyPublicReleaseSections(input) {
    const safe = obj(input);
    const providerPublicTrustClosureCenterSummary = resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter");
    const offlineReleaseMemorySnapshotSummary = resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot");
    const noProviderExecutionFinalGuardSummary = resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    const userVisibleSafetyBoundaryExplainerSummary = resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    const providerTrustClosureViewModelSummary = resolveSummary(safe, "providerTrustClosureViewModelSummary", "WeishanGlobalShoppingProviderTrustClosureViewModel", "buildGlobalShoppingProviderTrustClosureViewModel");
    return clone([
      section("provider_public_trust_closure_center", "Provider Public Trust Closure Center", providerPublicTrustClosureCenterSummary.status, labelOf(providerPublicTrustClosureCenterSummary, "Provider Public Trust Closure Center 仍需复核"), "Public Release 不创建真实公开发布。"),
      section("offline_release_memory_snapshot", "Offline Release Memory Snapshot", offlineReleaseMemorySnapshotSummary.status, labelOf(offlineReleaseMemorySnapshotSummary, "Offline Release Memory Snapshot 仍需复核"), "Release Memory 不持久化记忆快照。"),
      section("no_provider_execution_final_guard", "No-Provider-Execution Final Guard", noProviderExecutionFinalGuardSummary.status, labelOf(noProviderExecutionFinalGuardSummary, "No-Provider-Execution Final Guard 仍需复核"), "No-Provider Guard 不执行真实阻断、不打开平台。"),
      section("user_visible_safety_boundary_explainer", "User-Visible Safety Boundary Explainer", userVisibleSafetyBoundaryExplainerSummary.status, labelOf(userVisibleSafetyBoundaryExplainerSummary, "User-Visible Safety Boundary Explainer 仍需复核"), "Safety Boundary 不承诺最低价、最终价或官方背书。"),
      section("provider_trust_closure_view_model", "Provider Trust Closure Review", providerTrustClosureViewModelSummary.status, labelOf(providerTrustClosureViewModelSummary, "Provider Trust Closure Review 仍需复核"), "Human public release review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingProviderReadOnlyPublicReleaseRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.publicReleaseSections).length ? toArray(safe.publicReleaseSections) : buildGlobalShoppingProviderReadOnlyPublicReleaseSections(safe);
    return clone([
      row("provider_read_only_public_release_center_status", "Provider Read-Only Public Release Center", obj(safe.userFacingSummary).resultLabel || "Provider Read-Only Public Release Center 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_read_only_public_release_center_boundary", "Public Release 边界", "当前只展示 provider read-only public release review。", "pass"),
      row("provider_read_only_public_release_center_guard", "只读说明", "不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderReadOnlyPublicReleaseCenter(input) {
    const safe = obj(input);
    const publicReleaseSections = buildGlobalShoppingProviderReadOnlyPublicReleaseSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = publicReleaseSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = publicReleaseSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_READ_ONLY_PUBLIC_RELEASE_CENTER_VERSION,
      status:status,
      centerMode:safeMode(safe.centerMode),
      publicReleaseBoundary:{
        publicReleasePreviewOnly:true,
        offlineMock:true,
        readOnly:true,
        canCreateRealPublicRelease:false,
        canGenerateRealStatementFile:false,
        canWriteFile:false,
        canUpload:false,
        canDownload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canPersistPublicReleaseResult:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canMutateGit:false,
        canMutateConfig:false,
        canActivateSandbox:false,
        canUseProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canCreateProviderClient:false,
        canEnableProvider:false,
        canDisableProvider:false
      },
      publicReleaseSummary:{
        hasProviderPublicTrustClosureCenter:present(resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter")),
        hasOfflineReleaseMemorySnapshot:present(resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot")),
        hasNoProviderExecutionFinalGuard:present(resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard")),
        hasUserVisibleSafetyBoundaryExplainer:present(resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer")),
        hasProviderTrustClosureViewModel:present(resolveSummary(safe, "providerTrustClosureViewModelSummary", "WeishanGlobalShoppingProviderTrustClosureViewModel", "buildGlobalShoppingProviderTrustClosureViewModel")),
        publicReleaseSectionCount:publicReleaseSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForTrustClosureExportPreview:status === "ready",
        humanPublicReleaseReviewRequired:true
      },
      publicReleaseSections:publicReleaseSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Read-Only Public Release Center",
        resultLabel:status === "ready" ? "Provider Read-Only Public Release Center 已准备" : (status === "blocked" ? "Provider Read-Only Public Release Center 已阻断" : "Provider Read-Only Public Release Center 仍需复核"),
        caveat:"Public Release 不创建真实公开发布。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderReadOnlyPublicReleaseRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderReadOnlyPublicReleaseCenterAuditDraft(input) {
    const center = buildGlobalShoppingProviderReadOnlyPublicReleaseCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_READ_ONLY_PUBLIC_RELEASE_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_READ_ONLY_PUBLIC_RELEASE_CENTER_VERSION,
      status:center.status,
      publicReleaseSectionCount:obj(center.publicReleaseSummary).publicReleaseSectionCount || 0,
      blockedSectionCount:obj(center.publicReleaseSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingProviderReadOnlyPublicReleaseCenter(center) {
    return evaluateGlobalShoppingProviderReadOnlyPublicReleaseCenter(center || {});
  }

  function buildGlobalShoppingProviderReadOnlyPublicReleaseCenter(input) {
    try {
      return evaluateGlobalShoppingProviderReadOnlyPublicReleaseCenter(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderReadOnlyPublicReleaseCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter = {
    GLOBAL_SHOPPING_PROVIDER_READ_ONLY_PUBLIC_RELEASE_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingProviderReadOnlyPublicReleaseCenter,
    evaluateGlobalShoppingProviderReadOnlyPublicReleaseCenter,
    buildGlobalShoppingProviderReadOnlyPublicReleaseRows,
    buildGlobalShoppingProviderReadOnlyPublicReleaseSections,
    buildGlobalShoppingProviderReadOnlyPublicReleaseCenterAuditDraft,
    sanitizeGlobalShoppingProviderReadOnlyPublicReleaseCenter
  };
})();
