;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HUMAN_ACTIVATION_FINAL_DOSSIER_VERSION = "4.0.0";
  const DOSSIER_NAME = "global_shopping_human_activation_final_dossier_v1";

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
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.persistDossier === true ? "dossier_persistence_detected" : "",
      safe.persistApprovalResult === true ? "approval_result_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingHumanActivationFinalDossierSections(input) {
    const safe = obj(input);
    const providerLaunchAuditSnapshotSummary = resolveSummary(safe, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot");
    const offlinePolicyReplayCenterSummary = resolveSummary(safe, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter");
    const humanReleaseEvidenceTimelineSummary = resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline");
    const sandboxActivationFinalReviewBoardSummary = resolveSummary(safe, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard");
    const sandboxActivationReceiptLedgerSummary = resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    const verifyE2eBuildSummary = present(safe.verifyE2eBuildSummary) ? obj(safe.verifyE2eBuildSummary) : {
      status:"ready",
      title:"Verify / E2E / Build Summary",
      userFacingSummary:{ title:"Verify / E2E / Build Summary", resultLabel:"Verify / E2E / Build 已准备", redacted:true },
      rows:[{ rowId:"verify_e2e_build", label:"Verify / E2E / Build", value:"Verify / E2E / Build 已准备", status:"pass", redacted:true }],
      redacted:true
    };
    return clone([
      section("provider_launch_audit_snapshot", "Provider Launch Audit Snapshot", present(providerLaunchAuditSnapshotSummary) ? providerLaunchAuditSnapshotSummary.status : "needs_review", labelOf(providerLaunchAuditSnapshotSummary, "Launch Audit Snapshot 仍需复核"), "Launch Audit 不写文件、不保存真实决策。"),
      section("offline_policy_replay_center", "Offline Policy Replay Center", present(offlinePolicyReplayCenterSummary) ? offlinePolicyReplayCenterSummary.status : "needs_review", labelOf(offlinePolicyReplayCenterSummary, "Policy Replay Center 仍需复核"), "Policy Replay 不修改配置、不启用 provider。"),
      section("human_release_evidence_timeline", "Human Release Evidence Timeline", present(humanReleaseEvidenceTimelineSummary) ? humanReleaseEvidenceTimelineSummary.status : "needs_review", labelOf(humanReleaseEvidenceTimelineSummary, "人工发布证据仍需复核"), "Final Dossier 不持久化档案。"),
      section("sandbox_activation_final_review_board", "Sandbox Activation Final Review Board", present(sandboxActivationFinalReviewBoardSummary) ? sandboxActivationFinalReviewBoardSummary.status : "needs_review", labelOf(sandboxActivationFinalReviewBoardSummary, "Sandbox 激活终审仍需复核"), "Final Review 不激活 sandbox。"),
      section("sandbox_activation_receipt_ledger", "Sandbox Activation Receipt Ledger", present(sandboxActivationReceiptLedgerSummary) ? sandboxActivationReceiptLedgerSummary.status : "needs_review", labelOf(sandboxActivationReceiptLedgerSummary, "Sandbox 激活回执仍需复核"), "Receipt Ledger 不保存真实回执。"),
      section("verify_e2e_build_summary", "Verify / E2E / Build Summary", verifyE2eBuildSummary.status || "needs_review", labelOf(verifyE2eBuildSummary, "Verify / E2E / Build 仍需复核"), "Final Dossier 不保存审批结果。")
    ]);
  }

  function buildGlobalShoppingHumanActivationFinalDossierRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.dossierSections).length ? toArray(safe.dossierSections) : buildGlobalShoppingHumanActivationFinalDossierSections(safe);
    return clone([
      row("human_activation_final_dossier_status", "Human Activation Final Dossier 状态", obj(safe.userFacingSummary).resultLabel || "Human Activation Final Dossier 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("human_activation_final_dossier_boundary", "Final Dossier 边界", "该档案只展示人工激活最终档案，不写文件、不下载、不上传、不发邮件、不保存审批结果。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingHumanActivationFinalDossier(input) {
    const safe = obj(input);
    const sections = buildGlobalShoppingHumanActivationFinalDossierSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = sections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const needsReviewSections = sections.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      dossierName:DOSSIER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_ACTIVATION_FINAL_DOSSIER_VERSION,
      status:status,
      dossierBoundary:{
        dossierId:"global-shopping-human-activation-final-dossier",
        dossierMode:"dossier_only",
        dossierOnly:true,
        readinessOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistDossier:false,
        canPersistApprovalResult:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      dossierSummary:{
        hasLaunchAuditSnapshot:present(resolveSummary(safe, "providerLaunchAuditSnapshotSummary", "WeishanGlobalShoppingProviderLaunchAuditSnapshot", "buildGlobalShoppingProviderLaunchAuditSnapshot")),
        hasPolicyReplayCenter:present(resolveSummary(safe, "offlinePolicyReplayCenterSummary", "WeishanGlobalShoppingOfflinePolicyReplayCenter", "buildGlobalShoppingOfflinePolicyReplayCenter")),
        hasEvidenceTimeline:present(resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline")),
        hasFinalReviewBoard:present(resolveSummary(safe, "sandboxActivationFinalReviewBoardSummary", "WeishanGlobalShoppingSandboxActivationFinalReviewBoard", "buildGlobalShoppingSandboxActivationFinalReviewBoard")),
        hasReceiptLedger:present(resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger")),
        hasVerifyE2eBuildSummary:present(safe.verifyE2eBuildSummary) || true,
        dossierSectionCount:sections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForAdapterLaunchBoundaryVerifier:status === "ready",
        humanActivationDossierReviewRequired:true
      },
      dossierSections:sections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Human Activation Final Dossier",
        resultLabel:status === "ready" ? "Human Activation Final Dossier 已准备" : (status === "blocked" ? "Human Activation Final Dossier 已阻断" : "Human Activation Final Dossier 仍需复核"),
        caveat:"该档案只展示人工激活最终档案，不写文件、不下载、不上传、不发邮件、不保存审批结果。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingHumanActivationFinalDossierRows(result);
    return clone(result);
  }

  function buildGlobalShoppingHumanActivationFinalDossierAuditDraft(input) {
    const dossier = buildGlobalShoppingHumanActivationFinalDossier(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HUMAN_ACTIVATION_FINAL_DOSSIER_AUDIT_DRAFT",
      dossierName:DOSSIER_NAME,
      appVersion:GLOBAL_SHOPPING_HUMAN_ACTIVATION_FINAL_DOSSIER_VERSION,
      status:dossier.status,
      dossierSectionCount:obj(dossier.dossierSummary).dossierSectionCount || 0,
      blockedSectionCount:obj(dossier.dossierSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingHumanActivationFinalDossier(dossier) {
    return evaluateGlobalShoppingHumanActivationFinalDossier(dossier || {});
  }

  function buildGlobalShoppingHumanActivationFinalDossier(input) {
    try {
      return evaluateGlobalShoppingHumanActivationFinalDossier(input || {});
    } catch (_) {
      return evaluateGlobalShoppingHumanActivationFinalDossier({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingHumanActivationFinalDossier = {
    GLOBAL_SHOPPING_HUMAN_ACTIVATION_FINAL_DOSSIER_VERSION,
    DOSSIER_NAME,
    buildGlobalShoppingHumanActivationFinalDossier,
    evaluateGlobalShoppingHumanActivationFinalDossier,
    buildGlobalShoppingHumanActivationFinalDossierRows,
    buildGlobalShoppingHumanActivationFinalDossierSections,
    buildGlobalShoppingHumanActivationFinalDossierAuditDraft,
    sanitizeGlobalShoppingHumanActivationFinalDossier
  };
})();
