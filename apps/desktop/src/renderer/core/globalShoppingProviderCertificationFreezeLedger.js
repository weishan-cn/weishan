;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_FREEZE_LEDGER_VERSION = "4.0.3";
  const LEDGER_NAME = "global_shopping_provider_certification_freeze_ledger_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function entry(entryId, label, status, ownerRole, summary, caveat) {
    return { entryId:text(entryId), label:text(label), status:safeStatus(status), ownerRole:text(ownerRole || "human_reviewer"), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.persistLedger === true ? "ledger_persistence_detected" : "",
      safe.persistApprovalResult === true ? "approval_result_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderCertificationFreezeEntries(input) {
    const safe = obj(input);
    const offlineReleaseGateSummary = resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    const certificationCenterSummary = resolveSummary(safe, "offlineProviderCertificationCenterSummary", "WeishanGlobalShoppingOfflineProviderCertificationCenter", "buildGlobalShoppingOfflineProviderCertificationCenter");
    const evidenceBinderSummary = resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    const boundaryLockSummary = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    const verifyE2eBuildSummary = present(safe.verifyE2eBuildSummary) ? obj(safe.verifyE2eBuildSummary) : {};
    return clone([
      entry("offline_release_gate", "Provider Offline Release Gate", present(offlineReleaseGateSummary) ? offlineReleaseGateSummary.status : "needs_review", "release_manager", labelOf(offlineReleaseGateSummary, "离线发布闸门仍需复核"), "只展示离线发布闸门，不创建 release。"),
      entry("certification_center", "Offline Provider Certification Center", present(certificationCenterSummary) ? certificationCenterSummary.status : "needs_review", "qa", labelOf(certificationCenterSummary, "离线 Provider 认证仍需复核"), "只展示离线认证摘要，不持久化台账。"),
      entry("evidence_binder", "Human Approval Evidence Binder", present(evidenceBinderSummary) ? evidenceBinderSummary.status : "needs_review", "security", labelOf(evidenceBinderSummary, "人工审批证据仍需复核"), "只展示人工证据，不保存审批结果。"),
      entry("boundary_lock", "Adapter Boundary Lock", present(boundaryLockSummary) ? boundaryLockSummary.status : "needs_review", "operator", labelOf(boundaryLockSummary, "Adapter 边界锁仍需复核"), "只展示边界锁，不改配置。"),
      entry("verify_e2e_build", "Verify / E2E / Build Summary", present(verifyE2eBuildSummary) ? safeStatus(verifyE2eBuildSummary.status) : "needs_review", "release_manager", labelOf(verifyE2eBuildSummary, "Verify / E2E / Build 仍需复核"), "只展示验证摘要，不写文件。")
    ]);
  }

  function buildGlobalShoppingProviderCertificationFreezeLedgerRows(input) {
    const safe = obj(input);
    const freezeEntries = toArray(safe.freezeEntries).length ? toArray(safe.freezeEntries) : buildGlobalShoppingProviderCertificationFreezeEntries(safe);
    return clone([
      row("provider_certification_freeze_ledger_status", "Provider Certification Freeze Ledger 状态", obj(safe.userFacingSummary).resultLabel || "认证冻结仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_certification_freeze_ledger_boundary", "认证冻结边界", "该台账只展示认证冻结状态，不持久化台账，不保存审批结果，不创建 release，不 push。", "pass")
    ].concat(freezeEntries.map(function (item) {
      return row(item.entryId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderCertificationFreezeLedger(input) {
    const safe = obj(input);
    const freezeEntries = buildGlobalShoppingProviderCertificationFreezeEntries(safe);
    const boundaryBlocks = blockedReasons(safe);
    const blockedEntries = freezeEntries.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const missingEntries = freezeEntries.filter(function (item) { return item.status === "needs_review"; });
    const status = boundaryBlocks.length || blockedEntries.length ? "blocked" : (missingEntries.length ? "needs_review" : "ready");
    const result = {
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_FREEZE_LEDGER_VERSION,
      status:status,
      freezeBoundary:{
        ledgerId:"global-shopping-provider-certification-freeze-ledger",
        ledgerMode:"freeze_ledger_only",
        freezeLedgerOnly:true,
        readinessOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistLedger:false,
        canPersistApprovalResult:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      freezeSummary:{
        hasOfflineReleaseGate:freezeEntries[0].status !== "needs_review",
        hasCertificationCenter:freezeEntries[1].status !== "needs_review",
        hasEvidenceBinder:freezeEntries[2].status !== "needs_review",
        hasBoundaryLock:freezeEntries[3].status !== "needs_review",
        hasVerifyE2eBuildSummary:freezeEntries[4].status !== "needs_review",
        freezeEntryCount:freezeEntries.length,
        missingFreezeEntryCount:missingEntries.length,
        blockedFreezeEntryCount:blockedEntries.length,
        readyForSandboxActivationReviewPacket:status === "ready",
        humanFreezeReviewRequired:true
      },
      freezeEntries:freezeEntries,
      rows:[],
      blockedReasons:boundaryBlocks.concat(blockedEntries.map(function (item) { return item.entryId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Certification Freeze Ledger",
        resultLabel:status === "ready" ? "认证冻结台账已准备" : (status === "blocked" ? "认证冻结已阻断" : "认证冻结仍需复核"),
        caveat:"该台账只展示认证冻结状态，不持久化台账，不保存审批结果，不创建 release，不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderCertificationFreezeLedgerRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderCertificationFreezeLedgerAuditDraft(input) {
    const ledger = buildGlobalShoppingProviderCertificationFreezeLedger(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_FREEZE_LEDGER_AUDIT_DRAFT",
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_FREEZE_LEDGER_VERSION,
      status:ledger.status,
      freezeEntryCount:obj(ledger.freezeSummary).freezeEntryCount || 0,
      blockedFreezeEntryCount:obj(ledger.freezeSummary).blockedFreezeEntryCount || 0,
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

  function sanitizeGlobalShoppingProviderCertificationFreezeLedger(ledger) {
    return evaluateGlobalShoppingProviderCertificationFreezeLedger(ledger || {});
  }

  function buildGlobalShoppingProviderCertificationFreezeLedger(input) {
    try {
      return evaluateGlobalShoppingProviderCertificationFreezeLedger(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderCertificationFreezeLedger({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderCertificationFreezeLedger = {
    GLOBAL_SHOPPING_PROVIDER_CERTIFICATION_FREEZE_LEDGER_VERSION,
    LEDGER_NAME,
    buildGlobalShoppingProviderCertificationFreezeLedger,
    evaluateGlobalShoppingProviderCertificationFreezeLedger,
    buildGlobalShoppingProviderCertificationFreezeLedgerRows,
    buildGlobalShoppingProviderCertificationFreezeEntries,
    buildGlobalShoppingProviderCertificationFreezeLedgerAuditDraft,
    sanitizeGlobalShoppingProviderCertificationFreezeLedger
  };
})();
