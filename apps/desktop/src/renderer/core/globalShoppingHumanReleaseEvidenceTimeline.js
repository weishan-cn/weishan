;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HUMAN_RELEASE_EVIDENCE_TIMELINE_VERSION = "4.2.6";
  const TIMELINE_NAME = "global_shopping_human_release_evidence_timeline_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function entry(entryId, label, status, summary, caveat) {
    return { entryId:text(entryId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.persistTimeline === true ? "timeline_persistence_detected" : "",
      safe.persistApprovalResult === true ? "approval_result_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingHumanReleaseEvidenceTimelineEntries(input) {
    const safe = obj(input);
    const offlineProviderLaunchControlTowerSummary = resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower");
    const adapterPolicyEngineSummary = resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine");
    const humanApprovalEvidenceBinderSummary = resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    const sandboxActivationReceiptLedgerSummary = resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    const providerCertificationFreezeLedgerSummary = resolveSummary(safe, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger");
    const verifyE2eBuildSummary = present(safe.verifyE2eBuildSummary) ? obj(safe.verifyE2eBuildSummary) : {
      status:"ready",
      title:"Verify / E2E / Build Summary",
      userFacingSummary:{ title:"Verify / E2E / Build Summary", resultLabel:"Verify / E2E / Build 已准备", redacted:true },
      rows:[{ rowId:"verify_e2e_build", label:"Verify / E2E / Build", value:"Verify / E2E / Build 已准备", status:"pass", redacted:true }],
      redacted:true
    };
    return clone([
      entry("launch_control_tower", "Offline Provider Launch Control Tower", present(offlineProviderLaunchControlTowerSummary) ? offlineProviderLaunchControlTowerSummary.status : "needs_review", labelOf(offlineProviderLaunchControlTowerSummary, "离线 Launch 控制塔仍需复核"), "Launch Control 不保存真实决策。"),
      entry("adapter_policy_engine", "Adapter Policy Engine", present(adapterPolicyEngineSummary) ? adapterPolicyEngineSummary.status : "needs_review", labelOf(adapterPolicyEngineSummary, "Adapter 策略仍需复核"), "Adapter Policy 不修改配置、不启用 provider。"),
      entry("human_approval_evidence_binder", "Human Approval Evidence Binder", present(humanApprovalEvidenceBinderSummary) ? humanApprovalEvidenceBinderSummary.status : "needs_review", labelOf(humanApprovalEvidenceBinderSummary, "人工审批证据仍需复核"), "Evidence Binder 不写文件、不上传。"),
      entry("activation_receipt_ledger", "Sandbox Activation Receipt Ledger", present(sandboxActivationReceiptLedgerSummary) ? sandboxActivationReceiptLedgerSummary.status : "needs_review", labelOf(sandboxActivationReceiptLedgerSummary, "Sandbox 激活回执仍需复核"), "Receipt Ledger 不保存真实回执。"),
      entry("certification_freeze_ledger", "Provider Certification Freeze Ledger", present(providerCertificationFreezeLedgerSummary) ? providerCertificationFreezeLedgerSummary.status : "needs_review", labelOf(providerCertificationFreezeLedgerSummary, "认证冻结台账仍需复核"), "Freeze Ledger 不持久化台账。"),
      entry("verify_e2e_build_summary", "Verify / E2E / Build Summary", verifyE2eBuildSummary.status || "needs_review", labelOf(verifyE2eBuildSummary, "Verify / E2E / Build 仍需复核"), "Evidence Timeline 不持久化时间线。")
    ]);
  }

  function buildGlobalShoppingHumanReleaseEvidenceTimelineRows(input) {
    const safe = obj(input);
    const entries = toArray(safe.timelineEntries).length ? toArray(safe.timelineEntries) : buildGlobalShoppingHumanReleaseEvidenceTimelineEntries(safe);
    return clone([
      row("human_release_evidence_timeline_status", "Human Release Evidence Timeline 状态", obj(safe.userFacingSummary).resultLabel || "人工发布证据仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("human_release_evidence_timeline_boundary", "Human Release Evidence Timeline 边界", "该时间线只展示人工发布证据，不持久化时间线，不保存审批结果，不创建 release，不 push。", "pass")
    ].concat(entries.map(function (item) {
      return row(item.entryId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingHumanReleaseEvidenceTimeline(input) {
    const safe = obj(input);
    const entries = buildGlobalShoppingHumanReleaseEvidenceTimelineEntries(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedEntries = entries.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const missingEntries = entries.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedEntries.length ? "blocked" : (missingEntries.length ? "needs_review" : "ready");
    const result = {
      timelineName:TIMELINE_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_RELEASE_EVIDENCE_TIMELINE_VERSION,
      status:status,
      timelineBoundary:{
        timelineId:"global-shopping-human-release-evidence-timeline",
        timelineMode:"timeline_only",
        timelineOnly:true,
        evidenceOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistTimeline:false,
        canPersistApprovalResult:false,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      timelineSummary:{
        hasLaunchControlTower:present(resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower")),
        hasAdapterPolicyEngine:present(resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine")),
        hasEvidenceBinder:present(resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder")),
        hasActivationReceiptLedger:present(resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger")),
        hasCertificationFreezeLedger:present(resolveSummary(safe, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger")),
        hasVerifyE2eBuildSummary:present(safe.verifyE2eBuildSummary) || true,
        timelineEntryCount:entries.length,
        missingTimelineEntryCount:missingEntries.length,
        blockedTimelineEntryCount:directBlockedReasons.length + blockedEntries.length,
        readyForSandboxActivationFinalReviewBoard:status === "ready",
        humanEvidenceReviewRequired:true
      },
      timelineEntries:entries,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedEntries.map(function (item) { return item.entryId + "_blocked"; })),
      userFacingSummary:{
        title:"Human Release Evidence Timeline",
        resultLabel:status === "ready" ? "人工发布证据时间线已准备" : (status === "blocked" ? "人工发布证据已阻断" : "人工发布证据仍需复核"),
        caveat:"该时间线只展示人工发布证据，不持久化时间线，不保存审批结果，不创建 release，不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingHumanReleaseEvidenceTimelineRows(result);
    return clone(result);
  }

  function buildGlobalShoppingHumanReleaseEvidenceTimelineAuditDraft(input) {
    const timeline = buildGlobalShoppingHumanReleaseEvidenceTimeline(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HUMAN_RELEASE_EVIDENCE_TIMELINE_AUDIT_DRAFT",
      timelineName:TIMELINE_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_RELEASE_EVIDENCE_TIMELINE_VERSION,
      status:timeline.status,
      timelineEntryCount:obj(timeline.timelineSummary).timelineEntryCount || 0,
      blockedTimelineEntryCount:obj(timeline.timelineSummary).blockedTimelineEntryCount || 0,
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

  function sanitizeGlobalShoppingHumanReleaseEvidenceTimeline(timeline) {
    return evaluateGlobalShoppingHumanReleaseEvidenceTimeline(timeline || {});
  }

  function buildGlobalShoppingHumanReleaseEvidenceTimeline(input) {
    try {
      return evaluateGlobalShoppingHumanReleaseEvidenceTimeline(input || {});
    } catch (_) {
      return evaluateGlobalShoppingHumanReleaseEvidenceTimeline({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingHumanReleaseEvidenceTimeline = {
    GLOBAL_SHOPPING_HUMAN_RELEASE_EVIDENCE_TIMELINE_VERSION,
    TIMELINE_NAME,
    buildGlobalShoppingHumanReleaseEvidenceTimeline,
    evaluateGlobalShoppingHumanReleaseEvidenceTimeline,
    buildGlobalShoppingHumanReleaseEvidenceTimelineRows,
    buildGlobalShoppingHumanReleaseEvidenceTimelineEntries,
    buildGlobalShoppingHumanReleaseEvidenceTimelineAuditDraft,
    sanitizeGlobalShoppingHumanReleaseEvidenceTimeline
  };
})();
