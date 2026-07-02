;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_PUBLIC_BETA_SHELL_VERSION = "4.0.1";
  const SHELL_NAME = "global_shopping_read_only_public_beta_shell_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|externalUrl|platformUrl|providerUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|public_beta_shell_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "public_beta_shell_only"; }
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
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
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
      safe.generateRealEvidenceFile === true ? "real_evidence_file_detected" : "",
      safe.generateRealUserAssurance === true ? "real_user_assurance_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
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
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.booking === true ? "booking_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.checkout === true ? "checkout_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingReadOnlyPublicBetaShellSections(input) {
    const safe = obj(input);
    const publicReleaseEvidenceConsoleSummary = resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole");
    const noProviderUserAssurancePanelSummary = resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel");
    const offlineLaunchReadinessFinalizerSummary = resolveSummary(safe, "offlineLaunchReadinessFinalizerSummary", "WeishanGlobalShoppingOfflineLaunchReadinessFinalizer", "buildGlobalShoppingOfflineLaunchReadinessFinalizer");
    const userSafePublicClaimVerifierSummary = resolveSummary(safe, "userSafePublicClaimVerifierSummary", "WeishanGlobalShoppingUserSafePublicClaimVerifier", "buildGlobalShoppingUserSafePublicClaimVerifier");
    const providerLaunchReadinessFinalViewModelSummary = resolveSummary(safe, "providerLaunchReadinessFinalViewModelSummary", "WeishanGlobalShoppingProviderLaunchReadinessFinalViewModel", "buildGlobalShoppingProviderLaunchReadinessFinalViewModel");
    return clone([
      section("public_release_evidence_console", "Public Release Evidence Console", publicReleaseEvidenceConsoleSummary.status, labelOf(publicReleaseEvidenceConsoleSummary, "Public Release Evidence Console 仍需复核"), "Public Beta 不生成真实证据文件。"),
      section("no_provider_user_assurance_panel", "No-Provider User Assurance Panel", noProviderUserAssurancePanelSummary.status, labelOf(noProviderUserAssurancePanelSummary, "No-Provider User Assurance Panel 仍需复核"), "Public Beta 不生成真实用户保证书。"),
      section("offline_launch_readiness_finalizer", "Offline Launch Readiness Finalizer", offlineLaunchReadinessFinalizerSummary.status, labelOf(offlineLaunchReadinessFinalizerSummary, "Offline Launch Readiness Finalizer 仍需复核"), "Public Beta 不执行真实 launch。"),
      section("user_safe_public_claim_verifier", "User-Safe Public Claim Verifier", userSafePublicClaimVerifierSummary.status, labelOf(userSafePublicClaimVerifierSummary, "User-Safe Public Claim Verifier 仍需复核"), "Public Beta 不承诺最低价、最终价或官方背书。"),
      section("provider_launch_readiness_final_view_model", "Provider Launch Readiness Final Review", providerLaunchReadinessFinalViewModelSummary.status, labelOf(providerLaunchReadinessFinalViewModelSummary, "Provider Launch Readiness Final Review 仍需复核"), "Public Beta 只展示候选价证据与只读安全边界。")
    ]);
  }

  function buildGlobalShoppingReadOnlyPublicBetaShellCapabilities(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status || "needs_review");
    return clone([
      row("public_beta_cover_low_candidate", "只读候选价", "当前已覆盖来源中的较低候选价", status === "blocked" ? "blocked" : "pass"),
      row("public_beta_official_anchor", "官方价锚点", "与官方价对比", status === "blocked" ? "blocked" : "pass"),
      row("public_beta_fee_normalization", "费用归一化", "费用归一化", status === "blocked" ? "blocked" : "pass"),
      row("public_beta_realtime_boundary", "平台实时页面为准", "价格以跳转后平台实时页面为准", status === "blocked" ? "blocked" : "pass"),
      row("public_beta_read_only_boundary", "当前不提供付款、下单或出票能力", "当前不提供付款、下单或出票能力", status === "blocked" ? "blocked" : "pass")
    ]);
  }

  function buildGlobalShoppingReadOnlyPublicBetaShellRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.publicBetaShellSections).length ? toArray(safe.publicBetaShellSections) : buildGlobalShoppingReadOnlyPublicBetaShellSections(safe);
    const capabilities = toArray(safe.publicBetaShellCapabilities).length ? toArray(safe.publicBetaShellCapabilities) : buildGlobalShoppingReadOnlyPublicBetaShellCapabilities(safe);
    return clone([
      row("global_shopping_read_only_public_beta_shell_status", "Global Shopping Read-Only Public Beta Shell", obj(safe.userFacingSummary).resultLabel || "Global Shopping Read-Only Public Beta Shell 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("global_shopping_read_only_public_beta_shell_boundary", "Public Beta 边界", "当前只展示 global shopping public beta shell。", "pass"),
      row("global_shopping_read_only_public_beta_shell_guard", "只读说明", "不接真实 provider，不读取密钥，不联网，不打开平台，当前不提供付款、下单或出票能力。", "pass")
    ].concat(capabilities).concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingReadOnlyPublicBetaShell(input) {
    const safe = obj(input);
    const publicBetaShellSections = buildGlobalShoppingReadOnlyPublicBetaShellSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = publicBetaShellSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = publicBetaShellSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PUBLIC_BETA_SHELL_VERSION,
      status:status,
      shellMode:safeMode(safe.shellMode),
      publicBetaShellBoundary:{
        publicBetaShellOnly:true,
        offlineMock:true,
        readOnly:true,
        canCreateRealPublicRelease:false,
        canGenerateRealEvidenceFile:false,
        canGenerateRealUserAssurance:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
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
        canDisableProvider:false,
        canBook:false,
        canPay:false,
        canOrder:false,
        canCheckout:false
      },
      publicBetaShellSummary:{
        hasPublicReleaseEvidenceConsole:present(resolveSummary(safe, "publicReleaseEvidenceConsoleSummary", "WeishanGlobalShoppingPublicReleaseEvidenceConsole", "buildGlobalShoppingPublicReleaseEvidenceConsole")),
        hasNoProviderUserAssurancePanel:present(resolveSummary(safe, "noProviderUserAssurancePanelSummary", "WeishanGlobalShoppingNoProviderUserAssurancePanel", "buildGlobalShoppingNoProviderUserAssurancePanel")),
        hasOfflineLaunchReadinessFinalizer:present(resolveSummary(safe, "offlineLaunchReadinessFinalizerSummary", "WeishanGlobalShoppingOfflineLaunchReadinessFinalizer", "buildGlobalShoppingOfflineLaunchReadinessFinalizer")),
        hasUserSafePublicClaimVerifier:present(resolveSummary(safe, "userSafePublicClaimVerifierSummary", "WeishanGlobalShoppingUserSafePublicClaimVerifier", "buildGlobalShoppingUserSafePublicClaimVerifier")),
        hasProviderLaunchReadinessFinalViewModel:present(resolveSummary(safe, "providerLaunchReadinessFinalViewModelSummary", "WeishanGlobalShoppingProviderLaunchReadinessFinalViewModel", "buildGlobalShoppingProviderLaunchReadinessFinalViewModel")),
        publicBetaShellSectionCount:publicBetaShellSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForProviderZeroRuntimeLock:status === "ready",
        buyButtonEnabled:false,
        checkoutButtonEnabled:false,
        paymentButtonEnabled:false
      },
      publicBetaShellSections:publicBetaShellSections,
      publicBetaShellCapabilities:[],
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Global Shopping Read-Only Public Beta Shell",
        resultLabel:status === "ready" ? "Global Shopping Read-Only Public Beta Shell 已准备" : (status === "blocked" ? "Global Shopping Read-Only Public Beta Shell 已阻断" : "Global Shopping Read-Only Public Beta Shell 仍需复核"),
        caveat:"Public Beta 只提供只读候选价展示，当前不提供付款、下单或出票能力。"
      },
      safety:safety(),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    };
    result.publicBetaShellCapabilities = buildGlobalShoppingReadOnlyPublicBetaShellCapabilities(result);
    result.rows = buildGlobalShoppingReadOnlyPublicBetaShellRows(result);
    return clone(result);
  }

  function buildGlobalShoppingReadOnlyPublicBetaShellAuditDraft(input) {
    const shell = buildGlobalShoppingReadOnlyPublicBetaShell(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_PUBLIC_BETA_SHELL_AUDIT_DRAFT",
      shellName:SHELL_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PUBLIC_BETA_SHELL_VERSION,
      status:shell.status,
      publicBetaShellSectionCount:obj(shell.publicBetaShellSummary).publicBetaShellSectionCount || 0,
      blockedSectionCount:obj(shell.publicBetaShellSummary).blockedSectionCount || 0,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
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

  function sanitizeGlobalShoppingReadOnlyPublicBetaShell(shell) {
    return evaluateGlobalShoppingReadOnlyPublicBetaShell(shell || {});
  }

  function buildGlobalShoppingReadOnlyPublicBetaShell(input) {
    try {
      return evaluateGlobalShoppingReadOnlyPublicBetaShell(input || {});
    } catch (_) {
      return evaluateGlobalShoppingReadOnlyPublicBetaShell({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingReadOnlyPublicBetaShell = {
    GLOBAL_SHOPPING_READ_ONLY_PUBLIC_BETA_SHELL_VERSION,
    SHELL_NAME,
    buildGlobalShoppingReadOnlyPublicBetaShell,
    evaluateGlobalShoppingReadOnlyPublicBetaShell,
    buildGlobalShoppingReadOnlyPublicBetaShellRows,
    buildGlobalShoppingReadOnlyPublicBetaShellSections,
    buildGlobalShoppingReadOnlyPublicBetaShellCapabilities,
    buildGlobalShoppingReadOnlyPublicBetaShellAuditDraft,
    sanitizeGlobalShoppingReadOnlyPublicBetaShell
  };
})();
