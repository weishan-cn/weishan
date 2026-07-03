;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_RELEASE_EVIDENCE_CONSOLE_VERSION = "4.1.0";
  const CONSOLE_NAME = "global_shopping_public_release_evidence_console_v1";

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
  function safeMode(value) { return /^(disabled|evidence_console_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "evidence_console_only"; }
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
      evidencePersisted:false,
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
      safe.generateRealEvidenceFile === true ? "real_evidence_file_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistPublicReleaseResult === true ? "public_release_result_persistence_detected" : "",
      safe.persistRealEvidence === true ? "real_evidence_persistence_detected" : "",
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

  function buildGlobalShoppingPublicReleaseEvidenceSections(input) {
    const safe = obj(input);
    const providerReadOnlyPublicReleaseCenterSummary = resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter");
    const trustClosureExportPreviewSummary = resolveSummary(safe, "trustClosureExportPreviewSummary", "WeishanGlobalShoppingTrustClosureExportPreview", "buildGlobalShoppingTrustClosureExportPreview");
    const finalNoProviderBoundaryReceiptSummary = resolveSummary(safe, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt");
    const publicSafetyStatementPreviewSummary = resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    const providerPublicReleaseViewModelSummary = resolveSummary(safe, "providerPublicReleaseViewModelSummary", "WeishanGlobalShoppingProviderPublicReleaseViewModel", "buildGlobalShoppingProviderPublicReleaseViewModel");
    return clone([
      section("provider_read_only_public_release_center", "Provider Read-Only Public Release Center", providerReadOnlyPublicReleaseCenterSummary.status, labelOf(providerReadOnlyPublicReleaseCenterSummary, "Provider Read-Only Public Release Center 仍需复核"), "Release Evidence 不生成真实证据文件。"),
      section("trust_closure_export_preview", "Trust Closure Export Preview", trustClosureExportPreviewSummary.status, labelOf(trustClosureExportPreviewSummary, "Trust Closure Export Preview 仍需复核"), "Export Preview 不生成真实导出文件。"),
      section("final_no_provider_boundary_receipt", "Final No-Provider Boundary Receipt", finalNoProviderBoundaryReceiptSummary.status, labelOf(finalNoProviderBoundaryReceiptSummary, "Final No-Provider Boundary Receipt 仍需复核"), "No-Provider Receipt 不生成真实回执、不打开平台。"),
      section("public_safety_statement_preview", "Public Safety Statement Preview", publicSafetyStatementPreviewSummary.status, labelOf(publicSafetyStatementPreviewSummary, "Public Safety Statement Preview 仍需复核"), "Safety Statement 不承诺最低价、最终价或官方背书。"),
      section("provider_public_release_view_model", "Provider Public Release Review", providerPublicReleaseViewModelSummary.status, labelOf(providerPublicReleaseViewModelSummary, "Provider Public Release Review 仍需复核"), "Human launch readiness final review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingPublicReleaseEvidenceRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.publicReleaseEvidenceSections).length ? toArray(safe.publicReleaseEvidenceSections) : buildGlobalShoppingPublicReleaseEvidenceSections(safe);
    return clone([
      row("public_release_evidence_console_status", "Public Release Evidence Console", obj(safe.userFacingSummary).resultLabel || "Public Release Evidence Console 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_release_evidence_console_boundary", "Release Evidence 边界", "当前只展示 public release evidence console。", "pass"),
      row("public_release_evidence_console_guard", "只读说明", "不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，不生成真实证据文件。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingPublicReleaseEvidenceConsole(input) {
    const safe = obj(input);
    const publicReleaseEvidenceSections = buildGlobalShoppingPublicReleaseEvidenceSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = publicReleaseEvidenceSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = publicReleaseEvidenceSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_RELEASE_EVIDENCE_CONSOLE_VERSION,
      status:status,
      consoleMode:safeMode(safe.consoleMode),
      publicReleaseEvidenceBoundary:{
        evidenceConsoleOnly:true,
        offlineMock:true,
        readOnly:true,
        canCreateRealPublicRelease:false,
        canGenerateRealStatementFile:false,
        canGenerateRealEvidenceFile:false,
        canWriteFile:false,
        canUpload:false,
        canDownload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canPersistPublicReleaseResult:false,
        canPersistRealEvidence:false,
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
      publicReleaseEvidenceSummary:{
        hasProviderReadOnlyPublicReleaseCenter:present(resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter")),
        hasTrustClosureExportPreview:present(resolveSummary(safe, "trustClosureExportPreviewSummary", "WeishanGlobalShoppingTrustClosureExportPreview", "buildGlobalShoppingTrustClosureExportPreview")),
        hasFinalNoProviderBoundaryReceipt:present(resolveSummary(safe, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt")),
        hasPublicSafetyStatementPreview:present(resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview")),
        hasProviderPublicReleaseViewModel:present(resolveSummary(safe, "providerPublicReleaseViewModelSummary", "WeishanGlobalShoppingProviderPublicReleaseViewModel", "buildGlobalShoppingProviderPublicReleaseViewModel")),
        publicReleaseEvidenceSectionCount:publicReleaseEvidenceSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForNoProviderUserAssurancePanel:status === "ready",
        humanLaunchReadinessFinalReviewRequired:true
      },
      publicReleaseEvidenceSections:publicReleaseEvidenceSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Public Release Evidence Console",
        resultLabel:status === "ready" ? "Public Release Evidence Console 已准备" : (status === "blocked" ? "Public Release Evidence Console 已阻断" : "Public Release Evidence Console 仍需复核"),
        caveat:"Release Evidence 不生成真实证据文件。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingPublicReleaseEvidenceRows(result);
    return clone(result);
  }

  function buildGlobalShoppingPublicReleaseEvidenceConsoleAuditDraft(input) {
    const evidenceConsole = buildGlobalShoppingPublicReleaseEvidenceConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_RELEASE_EVIDENCE_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_RELEASE_EVIDENCE_CONSOLE_VERSION,
      status:evidenceConsole.status,
      publicReleaseEvidenceSectionCount:obj(evidenceConsole.publicReleaseEvidenceSummary).publicReleaseEvidenceSectionCount || 0,
      blockedSectionCount:obj(evidenceConsole.publicReleaseEvidenceSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingPublicReleaseEvidenceConsole(evidenceConsole) {
    return evaluateGlobalShoppingPublicReleaseEvidenceConsole(evidenceConsole || {});
  }

  function buildGlobalShoppingPublicReleaseEvidenceConsole(input) {
    try {
      return evaluateGlobalShoppingPublicReleaseEvidenceConsole(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicReleaseEvidenceConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicReleaseEvidenceConsole = {
    GLOBAL_SHOPPING_PUBLIC_RELEASE_EVIDENCE_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingPublicReleaseEvidenceConsole,
    evaluateGlobalShoppingPublicReleaseEvidenceConsole,
    buildGlobalShoppingPublicReleaseEvidenceRows,
    buildGlobalShoppingPublicReleaseEvidenceSections,
    buildGlobalShoppingPublicReleaseEvidenceConsoleAuditDraft,
    sanitizeGlobalShoppingPublicReleaseEvidenceConsole
  };
})();
