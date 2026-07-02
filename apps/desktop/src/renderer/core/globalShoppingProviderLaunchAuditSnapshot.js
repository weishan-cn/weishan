;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_LAUNCH_AUDIT_SNAPSHOT_VERSION = "4.0.0";
  const SNAPSHOT_NAME = "global_shopping_provider_launch_audit_snapshot_v1";

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
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.writeAuditFile === true ? "audit_file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.persistLaunchDecision === true ? "launch_decision_persistence_detected" : "",
      safe.persistActivationReceipt === true ? "activation_receipt_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderLaunchAuditSnapshotSections(input) {
    const safe = obj(input);
    const offlineProviderLaunchControlTowerSummary = resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower");
    const adapterPolicyEngineSummary = resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine");
    const humanReleaseEvidenceTimelineSummary = resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline");
    const sandboxActivationFinalReviewBoardSummary = resolveSummary(safe, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard");
    const providerLaunchControlViewModelSummary = resolveSummary(safe, "providerLaunchControlViewModelSummary", "WeishanGlobalShoppingProviderLaunchControlViewModel", "buildGlobalShoppingProviderLaunchControlViewModel");
    return clone([
      section("offline_provider_launch_control_tower", "Offline Provider Launch Control Tower", present(offlineProviderLaunchControlTowerSummary) ? offlineProviderLaunchControlTowerSummary.status : "needs_review", labelOf(offlineProviderLaunchControlTowerSummary, "离线 Launch 控制塔仍需复核"), "Launch Audit 不写文件、不保存真实决策。"),
      section("adapter_policy_engine", "Adapter Policy Engine", present(adapterPolicyEngineSummary) ? adapterPolicyEngineSummary.status : "needs_review", labelOf(adapterPolicyEngineSummary, "Adapter 策略仍需复核"), "Policy Replay 不修改配置、不启用 provider。"),
      section("human_release_evidence_timeline", "Human Release Evidence Timeline", present(humanReleaseEvidenceTimelineSummary) ? humanReleaseEvidenceTimelineSummary.status : "needs_review", labelOf(humanReleaseEvidenceTimelineSummary, "人工发布证据仍需复核"), "Evidence Timeline 不持久化时间线。"),
      section("sandbox_activation_final_review_board", "Sandbox Activation Final Review Board", present(sandboxActivationFinalReviewBoardSummary) ? sandboxActivationFinalReviewBoardSummary.status : "needs_review", labelOf(sandboxActivationFinalReviewBoardSummary, "Sandbox 激活终审仍需复核"), "Final Review 不激活 sandbox。"),
      section("provider_launch_control_view_model", "Provider Launch Control Tower", present(providerLaunchControlViewModelSummary) ? providerLaunchControlViewModelSummary.status : "needs_review", labelOf(providerLaunchControlViewModelSummary, "Provider Launch Control Tower 仍需复核"), "当前只展示 provider launch control tower。")
    ]);
  }

  function buildGlobalShoppingProviderLaunchAuditSnapshotRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.snapshotSections).length ? toArray(safe.snapshotSections) : buildGlobalShoppingProviderLaunchAuditSnapshotSections(safe);
    return clone([
      row("provider_launch_audit_snapshot_status", "Provider Launch Audit Snapshot 状态", obj(safe.userFacingSummary).resultLabel || "Provider Launch Audit Snapshot 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_launch_audit_snapshot_boundary", "Launch Audit 边界", "该快照只展示离线 launch audit，不写审计文件，不保存真实决策或回执，不创建 release/tag，不 push。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderLaunchAuditSnapshot(input) {
    const safe = obj(input);
    const sections = buildGlobalShoppingProviderLaunchAuditSnapshotSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = sections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewSections = sections.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_AUDIT_SNAPSHOT_VERSION,
      status:status,
      snapshotBoundary:{
        snapshotId:"global-shopping-provider-launch-audit-snapshot",
        snapshotMode:"audit_only",
        auditOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canWriteAuditFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistLaunchDecision:false,
        canPersistActivationReceipt:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canModifyRuntimeConfig:false,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      snapshotSummary:{
        hasLaunchControlTower:present(resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower")),
        hasAdapterPolicyEngine:present(resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine")),
        hasEvidenceTimeline:present(resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline")),
        hasFinalReviewBoard:present(resolveSummary(safe, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard")),
        hasLaunchControlViewModel:present(resolveSummary(safe, "providerLaunchControlViewModelSummary", "WeishanGlobalShoppingProviderLaunchControlViewModel", "buildGlobalShoppingProviderLaunchControlViewModel")),
        snapshotSectionCount:sections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForOfflinePolicyReplayCenter:status === "ready",
        humanLaunchAuditReviewRequired:true
      },
      snapshotSections:sections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Launch Audit Snapshot",
        resultLabel:status === "ready" ? "Provider Launch Audit Snapshot 已准备" : (status === "blocked" ? "Provider Launch Audit Snapshot 已阻断" : "Provider Launch Audit Snapshot 仍需复核"),
        caveat:"该快照只展示离线 launch audit，不写审计文件，不保存真实决策或回执，不创建 release/tag，不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderLaunchAuditSnapshotRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderLaunchAuditSnapshotAuditDraft(input) {
    const snapshot = buildGlobalShoppingProviderLaunchAuditSnapshot(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_LAUNCH_AUDIT_SNAPSHOT_AUDIT_DRAFT",
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_LAUNCH_AUDIT_SNAPSHOT_VERSION,
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
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingProviderLaunchAuditSnapshot(snapshot) {
    return evaluateGlobalShoppingProviderLaunchAuditSnapshot(snapshot || {});
  }

  function buildGlobalShoppingProviderLaunchAuditSnapshot(input) {
    try {
      return evaluateGlobalShoppingProviderLaunchAuditSnapshot(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderLaunchAuditSnapshot({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderLaunchAuditSnapshot = {
    GLOBAL_SHOPPING_PROVIDER_LAUNCH_AUDIT_SNAPSHOT_VERSION,
    SNAPSHOT_NAME,
    buildGlobalShoppingProviderLaunchAuditSnapshot,
    evaluateGlobalShoppingProviderLaunchAuditSnapshot,
    buildGlobalShoppingProviderLaunchAuditSnapshotRows,
    buildGlobalShoppingProviderLaunchAuditSnapshotSections,
    buildGlobalShoppingProviderLaunchAuditSnapshotAuditDraft,
    sanitizeGlobalShoppingProviderLaunchAuditSnapshot
  };
})();
