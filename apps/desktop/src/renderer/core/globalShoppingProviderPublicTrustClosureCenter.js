;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_PUBLIC_TRUST_CLOSURE_CENTER_VERSION = "4.0.0";
  const CENTER_NAME = "global_shopping_provider_public_trust_closure_center_v1";

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
  function safeMode(value) { return /^(disabled|trust_closure_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "trust_closure_only"; }
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
      trustClosurePersisted:false,
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
      safe.generateRealPublicStatement === true ? "real_public_statement_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistTrustClosure === true ? "trust_closure_persistence_detected" : "",
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

  function buildGlobalShoppingProviderPublicTrustClosureSections(input) {
    const safe = obj(input);
    const providerDistributionFreezeConsoleSummary = resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole");
    const userFacingSafetyReceiptSummary = resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt");
    const offlineReleaseCandidateClosurePackSummary = resolveSummary(safe, "offlineReleaseCandidateClosurePackSummary", "WeishanGlobalShoppingOfflineReleaseCandidateClosurePack", "buildGlobalShoppingOfflineReleaseCandidateClosurePack");
    const providerNoProductionGuaranteeMatrixSummary = resolveSummary(safe, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix");
    const providerDistributionClosureViewModelSummary = resolveSummary(safe, "providerDistributionClosureViewModelSummary", "WeishanGlobalShoppingProviderDistributionClosureViewModel", "buildGlobalShoppingProviderDistributionClosureViewModel");
    return clone([
      section("provider_distribution_freeze_console", "Provider Distribution Freeze Console", present(providerDistributionFreezeConsoleSummary) ? providerDistributionFreezeConsoleSummary.status : "needs_review", labelOf(providerDistributionFreezeConsoleSummary, "Provider Distribution Freeze Console 仍需复核"), "Public Trust Closure 不生成真实公开声明。"),
      section("user_facing_safety_receipt", "User-Facing Safety Receipt", present(userFacingSafetyReceiptSummary) ? userFacingSafetyReceiptSummary.status : "needs_review", labelOf(userFacingSafetyReceiptSummary, "User-Facing Safety Receipt 仍需复核"), "Safety Receipt 不生成真实回执文件。"),
      section("offline_release_candidate_closure_pack", "Offline Release Candidate Closure Pack", present(offlineReleaseCandidateClosurePackSummary) ? offlineReleaseCandidateClosurePackSummary.status : "needs_review", labelOf(offlineReleaseCandidateClosurePackSummary, "Offline Release Candidate Closure Pack 仍需复核"), "RC Closure Pack 不创建真实闭包文件。"),
      section("provider_no_production_guarantee_matrix", "Provider No-Production Guarantee Matrix", present(providerNoProductionGuaranteeMatrixSummary) ? providerNoProductionGuaranteeMatrixSummary.status : "needs_review", labelOf(providerNoProductionGuaranteeMatrixSummary, "Provider No-Production Guarantee Matrix 仍需复核"), "No-Production Guarantee 不切换 production provider。"),
      section("provider_distribution_closure_view_model", "Provider Distribution Closure Review", present(providerDistributionClosureViewModelSummary) ? providerDistributionClosureViewModelSummary.status : "needs_review", labelOf(providerDistributionClosureViewModelSummary, "Provider Distribution Closure Review 仍需复核"), "Human trust closure review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingProviderPublicTrustClosureRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.closureSections).length ? toArray(safe.closureSections) : buildGlobalShoppingProviderPublicTrustClosureSections(safe);
    return clone([
      row("provider_public_trust_closure_center_status", "Provider Public Trust Closure Center", obj(safe.userFacingSummary).resultLabel || "Provider Public Trust Closure Center 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_public_trust_closure_center_boundary", "Public Trust Closure 边界", "Public Trust Closure 不生成真实公开声明。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderPublicTrustClosureCenter(input) {
    const safe = obj(input);
    const closureSections = buildGlobalShoppingProviderPublicTrustClosureSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = closureSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = closureSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PUBLIC_TRUST_CLOSURE_CENTER_VERSION,
      status:status,
      centerMode:safeMode(safe.centerMode),
      closureBoundary:{
        trustClosureOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealPublicStatement:false,
        canPersistTrustClosure:false,
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
      closureSummary:{
        hasDistributionFreezeConsole:present(resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole")),
        hasUserFacingSafetyReceipt:present(resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt")),
        hasOfflineReleaseCandidateClosurePack:present(resolveSummary(safe, "offlineReleaseCandidateClosurePackSummary", "WeishanGlobalShoppingOfflineReleaseCandidateClosurePack", "buildGlobalShoppingOfflineReleaseCandidateClosurePack")),
        hasProviderNoProductionGuaranteeMatrix:present(resolveSummary(safe, "providerNoProductionGuaranteeMatrixSummary", "WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix", "buildGlobalShoppingProviderNoProductionGuaranteeMatrix")),
        hasProviderDistributionClosureViewModel:present(resolveSummary(safe, "providerDistributionClosureViewModelSummary", "WeishanGlobalShoppingProviderDistributionClosureViewModel", "buildGlobalShoppingProviderDistributionClosureViewModel")),
        closureSectionCount:closureSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForOfflineReleaseMemorySnapshot:status === "ready",
        humanTrustClosureReviewRequired:true
      },
      closureSections:closureSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Public Trust Closure Center",
        resultLabel:status === "ready" ? "Provider Public Trust Closure Center 已准备" : (status === "blocked" ? "Provider Public Trust Closure Center 已阻断" : "Provider Public Trust Closure Center 仍需复核"),
        caveat:"Public Trust Closure 不生成真实公开声明。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderPublicTrustClosureRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderPublicTrustClosureCenterAuditDraft(input) {
    const center = buildGlobalShoppingProviderPublicTrustClosureCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_PUBLIC_TRUST_CLOSURE_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_PUBLIC_TRUST_CLOSURE_CENTER_VERSION,
      status:center.status,
      closureSectionCount:obj(center.closureSummary).closureSectionCount || 0,
      blockedSectionCount:obj(center.closureSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingProviderPublicTrustClosureCenter(center) {
    return evaluateGlobalShoppingProviderPublicTrustClosureCenter(center || {});
  }

  function buildGlobalShoppingProviderPublicTrustClosureCenter(input) {
    try {
      return evaluateGlobalShoppingProviderPublicTrustClosureCenter(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderPublicTrustClosureCenter({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderPublicTrustClosureCenter = {
    GLOBAL_SHOPPING_PROVIDER_PUBLIC_TRUST_CLOSURE_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingProviderPublicTrustClosureCenter,
    evaluateGlobalShoppingProviderPublicTrustClosureCenter,
    buildGlobalShoppingProviderPublicTrustClosureRows,
    buildGlobalShoppingProviderPublicTrustClosureSections,
    buildGlobalShoppingProviderPublicTrustClosureCenterAuditDraft,
    sanitizeGlobalShoppingProviderPublicTrustClosureCenter
  };
})();
