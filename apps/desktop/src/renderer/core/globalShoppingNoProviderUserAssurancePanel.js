;(function () {
  "use strict";

  const GLOBAL_SHOPPING_NO_PROVIDER_USER_ASSURANCE_PANEL_VERSION = "4.1.2";
  const PANEL_NAME = "global_shopping_no_provider_user_assurance_panel_v1";

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
  function safeMode(value) { return /^(disabled|assurance_panel_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "assurance_panel_only"; }
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
      assurancePersisted:false,
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
      safe.generateRealUserAssurance === true ? "real_user_assurance_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistAssurance === true ? "assurance_persistence_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.executeRealBlocking === true ? "real_blocking_execution_detected" : "",
      safe.mutateConfig === true ? "config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.providerClient === true ? "provider_client_detected" : "",
      safe.endpoint === true ? "endpoint_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.openExternal === true ? "open_external_detected" : "",
      safe.windowOpen === true ? "window_open_detected" : "",
      safe.booking === true ? "booking_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.checkout === true ? "checkout_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingNoProviderUserAssuranceSections(input) {
    const safe = obj(input);
    const publicReleaseEvidenceConsoleSummary = resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole");
    const finalNoProviderBoundaryReceiptSummary = resolveSummary(safe, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt");
    const noProviderExecutionFinalGuardSummary = resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    const userVisibleSafetyBoundaryExplainerSummary = resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    return clone([
      section("public_release_evidence_console", "Public Release Evidence Console", publicReleaseEvidenceConsoleSummary.status, labelOf(publicReleaseEvidenceConsoleSummary, "Public Release Evidence Console 仍需复核"), "Release Evidence 不生成真实证据文件。"),
      section("final_no_provider_boundary_receipt", "Final No-Provider Boundary Receipt", finalNoProviderBoundaryReceiptSummary.status, labelOf(finalNoProviderBoundaryReceiptSummary, "Final No-Provider Boundary Receipt 仍需复核"), "No-Provider Receipt 不生成真实回执、不打开平台。"),
      section("no_provider_execution_final_guard", "No-Provider-Execution Final Guard", noProviderExecutionFinalGuardSummary.status, labelOf(noProviderExecutionFinalGuardSummary, "No-Provider-Execution Final Guard 仍需复核"), "No-Provider Guard 不执行真实阻断。"),
      section("user_visible_safety_boundary_explainer", "User-Visible Safety Boundary Explainer", userVisibleSafetyBoundaryExplainerSummary.status, labelOf(userVisibleSafetyBoundaryExplainerSummary, "User-Visible Safety Boundary Explainer 仍需复核"), "Safety Boundary 不承诺最低价、最终价或官方背书。"),
      section("final_user_trust_summary", "Final User Trust Summary", finalUserTrustSummarySummary.status, labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "User Assurance 不生成真实用户保证书。")
    ]);
  }

  function buildGlobalShoppingNoProviderUserAssuranceRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.noProviderUserAssuranceSections).length ? toArray(safe.noProviderUserAssuranceSections) : buildGlobalShoppingNoProviderUserAssuranceSections(safe);
    return clone([
      row("no_provider_user_assurance_panel_status", "No-Provider User Assurance Panel", obj(safe.userFacingSummary).resultLabel || "No-Provider User Assurance Panel 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("no_provider_user_assurance_panel_boundary", "User Assurance 边界", "当前只展示 no-provider user assurance panel。", "pass"),
      row("no_provider_user_assurance_panel_guard", "只读说明", "不接真实 provider，不读取密钥，不联网，不打开平台，不执行真实 launch，不生成真实用户保证书。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingNoProviderUserAssurancePanel(input) {
    const safe = obj(input);
    const noProviderUserAssuranceSections = buildGlobalShoppingNoProviderUserAssuranceSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = noProviderUserAssuranceSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = noProviderUserAssuranceSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_NO_PROVIDER_USER_ASSURANCE_PANEL_VERSION,
      status:status,
      panelMode:safeMode(safe.panelMode),
      noProviderUserAssuranceBoundary:{
        assurancePanelOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealUserAssurance:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canPersistAssurance:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canExecuteRealBlocking:false,
        canMutateConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canCreateProviderClient:false,
        canGenerateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canOpenExternalPlatform:false,
        canBook:false,
        canPay:false,
        canOrder:false,
        canCheckout:false
      },
      noProviderUserAssuranceSummary:{
        hasPublicReleaseEvidenceConsole:present(resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole")),
        hasFinalNoProviderBoundaryReceipt:present(resolveSummary(safe, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt")),
        hasNoProviderExecutionFinalGuard:present(resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard")),
        hasUserVisibleSafetyBoundaryExplainer:present(resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer")),
        hasFinalUserTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        noProviderUserAssuranceSectionCount:noProviderUserAssuranceSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForOfflineLaunchReadinessFinalizer:status === "ready",
        humanLaunchReadinessFinalReviewRequired:true
      },
      noProviderUserAssuranceSections:noProviderUserAssuranceSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"No-Provider User Assurance Panel",
        resultLabel:status === "ready" ? "No-Provider User Assurance Panel 已准备" : (status === "blocked" ? "No-Provider User Assurance Panel 已阻断" : "No-Provider User Assurance Panel 仍需复核"),
        caveat:"User Assurance 不生成真实用户保证书。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingNoProviderUserAssuranceRows(result);
    return clone(result);
  }

  function buildGlobalShoppingNoProviderUserAssurancePanelAuditDraft(input) {
    const panel = buildGlobalShoppingNoProviderUserAssurancePanel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_NO_PROVIDER_USER_ASSURANCE_PANEL_AUDIT_DRAFT",
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_NO_PROVIDER_USER_ASSURANCE_PANEL_VERSION,
      status:panel.status,
      noProviderUserAssuranceSectionCount:obj(panel.noProviderUserAssuranceSummary).noProviderUserAssuranceSectionCount || 0,
      blockedSectionCount:obj(panel.noProviderUserAssuranceSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingNoProviderUserAssurancePanel(panel) {
    return evaluateGlobalShoppingNoProviderUserAssurancePanel(panel || {});
  }

  function buildGlobalShoppingNoProviderUserAssurancePanel(input) {
    try {
      return evaluateGlobalShoppingNoProviderUserAssurancePanel(input || {});
    } catch (_) {
      return evaluateGlobalShoppingNoProviderUserAssurancePanel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingNoProviderUserAssurancePanel = {
    GLOBAL_SHOPPING_NO_PROVIDER_USER_ASSURANCE_PANEL_VERSION,
    PANEL_NAME,
    buildGlobalShoppingNoProviderUserAssurancePanel,
    evaluateGlobalShoppingNoProviderUserAssurancePanel,
    buildGlobalShoppingNoProviderUserAssuranceRows,
    buildGlobalShoppingNoProviderUserAssuranceSections,
    buildGlobalShoppingNoProviderUserAssurancePanelAuditDraft,
    sanitizeGlobalShoppingNoProviderUserAssurancePanel
  };
})();
