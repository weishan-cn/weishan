;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_SAFE_PUBLIC_CLAIM_VERIFIER_VERSION = "4.1.9";
  const VERIFIER_NAME = "global_shopping_user_safe_public_claim_verifier_v1";

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
  function safeMode(value) { return /^(disabled|claim_verifier_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "claim_verifier_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
  function claimBlockedReasons(input) {
    const safe = obj(input);
    return [
      safe.generateRealPublicClaim === true ? "real_public_claim_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.lowestPriceClaim === true ? "lowest_price_claim_detected" : "",
      safe.finalPriceClaim === true ? "final_price_claim_detected" : "",
      safe.partnershipClaim === true ? "partnership_claim_detected" : "",
      safe.endorsementClaim === true ? "endorsement_claim_detected" : "",
      safe.providerClaim === true ? "provider_claim_detected" : "",
      safe.provider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
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

  function buildGlobalShoppingUserSafePublicClaimRules(input) {
    const safe = obj(input);
    const publicReleaseEvidenceConsoleSummary = resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole");
    const noProviderUserAssurancePanelSummary = resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    const offlineLaunchReadinessFinalizerSummary = resolveSummary(safe, "offlineLaunchReadinessFinalizerSummary", "WeishanGlobalShoppingOfflineLaunchReadinessFinalizer", "buildGlobalShoppingOfflineLaunchReadinessFinalizer");
    const publicSafetyStatementPreviewSummary = resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    const userVisibleSafetyBoundaryExplainerSummary = resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    return clone([
      row("public_release_evidence_console", "Public Release Evidence Console", labelOf(publicReleaseEvidenceConsoleSummary, "Public Release Evidence Console 仍需复核"), safeStatus(publicReleaseEvidenceConsoleSummary.status) === "ready" ? "pass" : (safeStatus(publicReleaseEvidenceConsoleSummary.status) === "blocked" ? "blocked" : "warning")),
      row("no_provider_user_assurance_panel", "No-Provider User Assurance Panel", labelOf(noProviderUserAssurancePanelSummary, "No-Provider User Assurance Panel 仍需复核"), safeStatus(noProviderUserAssurancePanelSummary.status) === "ready" ? "pass" : (safeStatus(noProviderUserAssurancePanelSummary.status) === "blocked" ? "blocked" : "warning")),
      row("offline_launch_readiness_finalizer", "Offline Launch Readiness Finalizer", labelOf(offlineLaunchReadinessFinalizerSummary, "Offline Launch Readiness Finalizer 仍需复核"), safeStatus(offlineLaunchReadinessFinalizerSummary.status) === "ready" ? "pass" : (safeStatus(offlineLaunchReadinessFinalizerSummary.status) === "blocked" ? "blocked" : "warning")),
      row("public_safety_statement_preview", "Public Safety Statement Preview", labelOf(publicSafetyStatementPreviewSummary, "Public Safety Statement Preview 仍需复核"), safeStatus(publicSafetyStatementPreviewSummary.status) === "ready" ? "pass" : (safeStatus(publicSafetyStatementPreviewSummary.status) === "blocked" ? "blocked" : "warning")),
      row("user_visible_safety_boundary_explainer", "User-Visible Safety Boundary Explainer", labelOf(userVisibleSafetyBoundaryExplainerSummary, "User-Visible Safety Boundary Explainer 仍需复核"), safeStatus(userVisibleSafetyBoundaryExplainerSummary.status) === "ready" ? "pass" : (safeStatus(userVisibleSafetyBoundaryExplainerSummary.status) === "blocked" ? "blocked" : "warning"))
    ]);
  }

  function buildGlobalShoppingUserSafePublicClaimRows(input) {
    const safe = obj(input);
    const claimRules = toArray(safe.claimRules).length ? toArray(safe.claimRules) : buildGlobalShoppingUserSafePublicClaimRules(safe);
    return clone([
      row("user_safe_public_claim_verifier_status", "User-Safe Public Claim Verifier", obj(safe.userFacingSummary).resultLabel || "User-Safe Public Claim Verifier 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("user_safe_public_claim_verifier_boundary", "Claim Verifier 边界", "当前只展示 user-safe public claim verifier。", "pass"),
      row("user_safe_public_claim_verifier_guard", "只读说明", "不接真实 provider，不读取密钥，不联网，不创建 release，不 push，不承诺最低价、最终价或官方背书。", "pass")
    ].concat(claimRules));
  }

  function evaluateGlobalShoppingUserSafePublicClaimVerifier(input) {
    const safe = obj(input);
    const publicReleaseEvidenceConsoleSummary = resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole");
    const noProviderUserAssurancePanelSummary = resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    const offlineLaunchReadinessFinalizerSummary = resolveSummary(safe, "offlineLaunchReadinessFinalizerSummary", "WeishanGlobalShoppingOfflineLaunchReadinessFinalizer", "buildGlobalShoppingOfflineLaunchReadinessFinalizer");
    const publicSafetyStatementPreviewSummary = resolveSummary(safe, "publicSafetyStatementPreviewSummary", "WeishanGlobalShoppingPublicSafetyStatementPreview", "buildGlobalShoppingPublicSafetyStatementPreview");
    const userVisibleSafetyBoundaryExplainerSummary = resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    const claimRules = buildGlobalShoppingUserSafePublicClaimRules({
      publicReleaseEvidenceConsoleSummary:publicReleaseEvidenceConsoleSummary,
      noProviderUserAssurancePanelSummary:noProviderUserAssurancePanelSummary,
      offlineLaunchReadinessFinalizerSummary:offlineLaunchReadinessFinalizerSummary,
      publicSafetyStatementPreviewSummary:publicSafetyStatementPreviewSummary,
      userVisibleSafetyBoundaryExplainerSummary:userVisibleSafetyBoundaryExplainerSummary
    });
    const directBlockedReasons = claimBlockedReasons(safe);
    const statuses = [
      safeStatus(publicReleaseEvidenceConsoleSummary.status),
      safeStatus(noProviderUserAssurancePanelSummary.status),
      safeStatus(offlineLaunchReadinessFinalizerSummary.status),
      safeStatus(publicSafetyStatementPreviewSummary.status),
      safeStatus(userVisibleSafetyBoundaryExplainerSummary.status)
    ];
    const blocked = directBlockedReasons.length || statuses.indexOf("blocked") >= 0 || statuses.indexOf("failed_safe") >= 0;
    const needsReview =
      !present(publicReleaseEvidenceConsoleSummary) ||
      !present(noProviderUserAssurancePanelSummary) ||
      !present(offlineLaunchReadinessFinalizerSummary) ||
      !present(publicSafetyStatementPreviewSummary) ||
      !present(userVisibleSafetyBoundaryExplainerSummary) ||
      statuses.indexOf("needs_review") >= 0;
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      verifierName:VERIFIER_NAME,
      appVersion:GLOBAL_SHOPPING_USER_SAFE_PUBLIC_CLAIM_VERIFIER_VERSION,
      status:status,
      verifierMode:safeMode(safe.verifierMode),
      claimVerifierBoundary:{
        claimVerifierOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealPublicClaim:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canMakeLowestPriceClaim:false,
        canMakeFinalPriceClaim:false,
        canMakePartnershipClaim:false,
        canMakeEndorsementClaim:false,
        canMakeProviderClaim:false,
        canUseProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      claimRules:claimRules,
      blockedReasons:directBlockedReasons,
      userFacingSummary:{
        title:"User-Safe Public Claim Verifier",
        resultLabel:status === "ready" ? "User-Safe Public Claim Verifier 已准备" : (status === "blocked" ? "User-Safe Public Claim Verifier 已阻断" : "User-Safe Public Claim Verifier 仍需复核"),
        caveat:"Claim Verifier 不承诺最低价、最终价或官方背书。"
      },
      rows:buildGlobalShoppingUserSafePublicClaimRows({ status:status, userFacingSummary:{ resultLabel:status === "ready" ? "User-Safe Public Claim Verifier 已准备" : (status === "blocked" ? "User-Safe Public Claim Verifier 已阻断" : "User-Safe Public Claim Verifier 仍需复核") }, claimRules:claimRules }),
      publicReleaseEvidenceConsoleSummary:clone(publicReleaseEvidenceConsoleSummary),
      noProviderUserAssurancePanelSummary:clone(noProviderUserAssurancePanelSummary),
      offlineLaunchReadinessFinalizerSummary:clone(offlineLaunchReadinessFinalizerSummary),
      publicSafetyStatementPreviewSummary:clone(publicSafetyStatementPreviewSummary),
      userVisibleSafetyBoundaryExplainerSummary:clone(userVisibleSafetyBoundaryExplainerSummary),
      safety:safety(),
      redacted:true
    });
  }

  function buildGlobalShoppingUserSafePublicClaimVerifierAuditDraft(input) {
    const verifier = buildGlobalShoppingUserSafePublicClaimVerifier(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_SAFE_PUBLIC_CLAIM_VERIFIER_AUDIT_DRAFT",
      verifierName:VERIFIER_NAME,
      appVersion:GLOBAL_SHOPPING_USER_SAFE_PUBLIC_CLAIM_VERIFIER_VERSION,
      status:verifier.status,
      claimRuleCount:toArray(verifier.claimRules).length,
      blockedReasonCount:toArray(verifier.blockedReasons).length,
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

  function sanitizeGlobalShoppingUserSafePublicClaimVerifier(verifier) {
    return evaluateGlobalShoppingUserSafePublicClaimVerifier(verifier || {});
  }

  function buildGlobalShoppingUserSafePublicClaimVerifier(input) {
    try {
      return evaluateGlobalShoppingUserSafePublicClaimVerifier(input || {});
    } catch (_) {
      return evaluateGlobalShoppingUserSafePublicClaimVerifier({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingUserSafePublicClaimVerifier = {
    GLOBAL_SHOPPING_USER_SAFE_PUBLIC_CLAIM_VERIFIER_VERSION,
    VERIFIER_NAME,
    buildGlobalShoppingUserSafePublicClaimVerifier,
    evaluateGlobalShoppingUserSafePublicClaimVerifier,
    buildGlobalShoppingUserSafePublicClaimRows,
    buildGlobalShoppingUserSafePublicClaimRules,
    buildGlobalShoppingUserSafePublicClaimVerifierAuditDraft,
    sanitizeGlobalShoppingUserSafePublicClaimVerifier
  };
})();
