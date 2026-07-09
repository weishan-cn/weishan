;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FINAL_OFFLINE_LAUNCH_REVIEW_CONSOLE_VERSION = "4.2.7";
  const CONSOLE_NAME = "global_shopping_final_offline_launch_review_console_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function panel(panelId, label, status, summary, caveat) {
    return { panelId:text(panelId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
      safe.persistLaunchDecision === true ? "launch_decision_persistence_detected" : "",
      safe.persistActivationReceipt === true ? "activation_receipt_persistence_detected" : "",
      safe.persistDossier === true ? "dossier_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createEndpoint === true ? "endpoint_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingFinalOfflineLaunchReviewPanels(input) {
    const safe = obj(input);
    const providerLaunchAuditSnapshotSummary = resolveSummary(safe, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot");
    const offlinePolicyReplayCenterSummary = resolveSummary(safe, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter");
    const humanActivationFinalDossierSummary = resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier");
    const adapterLaunchBoundaryVerifierSummary = resolveSummary(safe, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier");
    const providerFinalLaunchReviewViewModelSummary = resolveSummary(safe, "providerFinalLaunchReviewViewModelSummary", "WeishanGlobalShoppingProviderFinalLaunchReviewViewModel", "buildGlobalShoppingProviderFinalLaunchReviewViewModel");
    return clone([
      panel("provider_launch_audit_snapshot", "Provider Launch Audit Snapshot", present(providerLaunchAuditSnapshotSummary) ? providerLaunchAuditSnapshotSummary.status : "needs_review", labelOf(providerLaunchAuditSnapshotSummary, "Launch Audit 仍需复核"), "Final Review 不保存真实决策。"),
      panel("offline_policy_replay_center", "Offline Policy Replay Center", present(offlinePolicyReplayCenterSummary) ? offlinePolicyReplayCenterSummary.status : "needs_review", labelOf(offlinePolicyReplayCenterSummary, "Policy Replay 仍需复核"), "Decision Matrix 不修改配置、不启用 provider。"),
      panel("human_activation_final_dossier", "Human Activation Final Dossier", present(humanActivationFinalDossierSummary) ? humanActivationFinalDossierSummary.status : "needs_review", labelOf(humanActivationFinalDossierSummary, "Final Dossier 仍需复核"), "Evidence Summary 不持久化 dossier。"),
      panel("adapter_launch_boundary_verifier", "Adapter Launch Boundary Verifier", present(adapterLaunchBoundaryVerifierSummary) ? adapterLaunchBoundaryVerifierSummary.status : "needs_review", labelOf(adapterLaunchBoundaryVerifierSummary, "Boundary Verifier 仍需复核"), "Activation Blocker 不生成 endpoint、不读取密钥。"),
      panel("provider_final_launch_review_view_model", "Provider Final Launch Review", present(providerFinalLaunchReviewViewModelSummary) ? providerFinalLaunchReviewViewModelSummary.status : "needs_review", labelOf(providerFinalLaunchReviewViewModelSummary, "Final Launch Review 仍需复核"), "当前只展示 provider final review console。")
    ]);
  }

  function buildGlobalShoppingFinalOfflineLaunchReviewRows(input) {
    const safe = obj(input);
    const panels = toArray(safe.reviewPanels).length ? toArray(safe.reviewPanels) : buildGlobalShoppingFinalOfflineLaunchReviewPanels(safe);
    return clone([
      row("final_offline_launch_review_console_status", "Final Offline Launch Review Console", obj(safe.userFacingSummary).resultLabel || "Final Offline Launch Review Console 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("final_offline_launch_review_console_boundary", "Final Review 边界", "该控制台只展示最终离线复核，不保存真实决策或回执，不持久化 dossier，不创建 release/tag，不 push。", "pass")
    ].concat(panels.map(function (item) {
      return row(item.panelId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingFinalOfflineLaunchReviewConsole(input) {
    const safe = obj(input);
    const reviewPanels = buildGlobalShoppingFinalOfflineLaunchReviewPanels(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedPanels = reviewPanels.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewPanels = reviewPanels.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedPanels.length ? "blocked" : (needsReviewPanels.length ? "needs_review" : "ready");
    const result = {
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_OFFLINE_LAUNCH_REVIEW_CONSOLE_VERSION,
      status:status,
      consoleMode:"final_review_only",
      reviewBoundary:{
        finalReviewOnly:true,
        offlineMock:true,
        readOnly:true,
        canPersistLaunchDecision:false,
        canPersistActivationReceipt:false,
        canPersistDossier:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canActivateSandbox:false,
        canUseRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateEndpoint:false,
        canCreateProviderClient:false,
        canModifyRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false
      },
      reviewSummary:{
        hasLaunchAudit:present(resolveSummary(safe, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot")),
        hasPolicyReplay:present(resolveSummary(safe, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter")),
        hasFinalDossier:present(resolveSummary(safe, "humanActivationFinalDossierSummary", "WeishanGlobalShoppingHumanActivationFinalDossier", "buildGlobalShoppingHumanActivationFinalDossier")),
        hasBoundaryVerifier:present(resolveSummary(safe, "adapterLaunchBoundaryVerifierSummary", "WeishanGlobalShoppingAdapterLaunchBoundaryVerifier", "buildGlobalShoppingAdapterLaunchBoundaryVerifier")),
        hasFinalReviewViewModel:present(resolveSummary(safe, "providerFinalLaunchReviewViewModelSummary", "WeishanGlobalShoppingProviderFinalLaunchReviewViewModel", "buildGlobalShoppingProviderFinalLaunchReviewViewModel")),
        reviewPanelCount:reviewPanels.length,
        needsReviewPanelCount:needsReviewPanels.length,
        blockedPanelCount:directBlockedReasons.length + blockedPanels.length,
        readyForActivationBlockerReview:status === "ready",
        humanFinalOfflineReviewRequired:true
      },
      reviewPanels:reviewPanels,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedPanels.map(function (item) { return item.panelId + "_blocked"; })),
      userFacingSummary:{
        title:"Final Offline Launch Review Console",
        resultLabel:status === "ready" ? "Final Offline Launch Review Console 已准备" : (status === "blocked" ? "Final Offline Launch Review Console 已阻断" : "Final Offline Launch Review Console 仍需复核"),
        caveat:"当前只展示 provider final review console，不保存真实决策，不保存真实回执，不持久化 dossier，不创建 release/tag，不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingFinalOfflineLaunchReviewRows(result);
    return clone(result);
  }

  function buildGlobalShoppingFinalOfflineLaunchReviewConsoleAuditDraft(input) {
    const review = buildGlobalShoppingFinalOfflineLaunchReviewConsole(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FINAL_OFFLINE_LAUNCH_REVIEW_CONSOLE_AUDIT_DRAFT",
      consoleName:CONSOLE_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_OFFLINE_LAUNCH_REVIEW_CONSOLE_VERSION,
      status:review.status,
      reviewPanelCount:obj(review.reviewSummary).reviewPanelCount || 0,
      blockedPanelCount:obj(review.reviewSummary).blockedPanelCount || 0,
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

  function sanitizeGlobalShoppingFinalOfflineLaunchReviewConsole(consoleModel) {
    return evaluateGlobalShoppingFinalOfflineLaunchReviewConsole(consoleModel || {});
  }

  function buildGlobalShoppingFinalOfflineLaunchReviewConsole(input) {
    try {
      return evaluateGlobalShoppingFinalOfflineLaunchReviewConsole(input || {});
    } catch (_) {
      return evaluateGlobalShoppingFinalOfflineLaunchReviewConsole({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingFinalOfflineLaunchReviewConsole = {
    GLOBAL_SHOPPING_FINAL_OFFLINE_LAUNCH_REVIEW_CONSOLE_VERSION,
    CONSOLE_NAME,
    buildGlobalShoppingFinalOfflineLaunchReviewConsole,
    evaluateGlobalShoppingFinalOfflineLaunchReviewConsole,
    buildGlobalShoppingFinalOfflineLaunchReviewRows,
    buildGlobalShoppingFinalOfflineLaunchReviewPanels,
    buildGlobalShoppingFinalOfflineLaunchReviewConsoleAuditDraft,
    sanitizeGlobalShoppingFinalOfflineLaunchReviewConsole
  };
})();
