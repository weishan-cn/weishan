;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_EVIDENCE_LEDGER_VERSION = "4.2.2";
  const LEDGER_NAME = "global_shopping_provider_governance_closure_evidence_ledger_v1";

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
  function safeMode(value) { return /^(disabled|evidence_ledger_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "evidence_ledger_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function entry(entryId, label, status, summary, caveat) {
    return { entryId:text(entryId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
      evidenceStored:false,
      approvalStored:false,
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
      safe.persistEvidence === true ? "evidence_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistApproval === true ? "approval_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startProvider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderGovernanceClosureEvidenceEntries(input) {
    const safe = obj(input);
    const offlineProviderGovernanceClosureBoardSummary = resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard");
    const noActivationComplianceSealSummary = resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal");
    const finalReadinessHandoffSimulatorSummary = resolveSummary(safe, "finalReadinessHandoffSimulatorSummary", "WeishanGlobalShoppingFinalReadinessHandoffSimulator", "buildGlobalShoppingFinalReadinessHandoffSimulator");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const verifyE2eBuildSummary = present(safe.verifyE2eBuildSummary) ? obj(safe.verifyE2eBuildSummary) : {};
    return clone([
      entry("offline_provider_governance_closure_board", "Offline Provider Governance Closure Board", present(offlineProviderGovernanceClosureBoardSummary) ? offlineProviderGovernanceClosureBoardSummary.status : "needs_review", labelOf(offlineProviderGovernanceClosureBoardSummary, "Governance Closure Board 仍需复核"), "Closure Evidence 不持久化台账、不保存真实 evidence。"),
      entry("no_activation_compliance_seal", "No-Activation Compliance Seal", present(noActivationComplianceSealSummary) ? noActivationComplianceSealSummary.status : "needs_review", labelOf(noActivationComplianceSealSummary, "No-Activation Compliance Seal 仍需复核"), "No-Activation Seal 不生成真实封条、不执行真实阻断。"),
      entry("final_readiness_handoff_simulator", "Final Readiness Handoff Simulator", present(finalReadinessHandoffSimulatorSummary) ? finalReadinessHandoffSimulatorSummary.status : "needs_review", labelOf(finalReadinessHandoffSimulatorSummary, "Final Readiness Handoff Simulator 仍需复核"), "Final Handoff 不执行真实交接。"),
      entry("read_only_release_evidence_summary", "Read-Only Release Evidence Summary", present(readOnlyReleaseEvidenceSummary) ? readOnlyReleaseEvidenceSummary.status : "needs_review", labelOf(readOnlyReleaseEvidenceSummary, "Read-Only Release Evidence Summary 仍需复核"), "Release Evidence 不写文件、不上传。"),
      entry("verify_e2e_build_summary", "verify/e2e/build summary", present(verifyE2eBuildSummary) ? safeStatus(verifyE2eBuildSummary.status || "needs_review") : "needs_review", labelOf(verifyE2eBuildSummary, "verify/e2e/build 仍需复核"), "Closure Evidence 不持久化台账、不保存真实 evidence。")
    ]);
  }

  function buildGlobalShoppingProviderGovernanceClosureEvidenceRows(input) {
    const safe = obj(input);
    const entries = toArray(safe.ledgerEntries).length ? toArray(safe.ledgerEntries) : buildGlobalShoppingProviderGovernanceClosureEvidenceEntries(safe);
    return clone([
      row("provider_governance_closure_evidence_ledger_status", "Provider Governance Closure Evidence Ledger", obj(safe.userFacingSummary).resultLabel || "Provider Governance Closure Evidence Ledger 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_governance_closure_evidence_ledger_boundary", "Closure Evidence 边界", "该 Ledger 只展示治理闭环证据台账，不持久化台账、不保存真实 evidence。", "pass")
    ].concat(entries.map(function (item) {
      return row(item.entryId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderGovernanceClosureEvidenceLedger(input) {
    const safe = obj(input);
    const ledgerEntries = buildGlobalShoppingProviderGovernanceClosureEvidenceEntries(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedEntries = ledgerEntries.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewEntries = ledgerEntries.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedEntries.length ? "blocked" : (needsReviewEntries.length ? "needs_review" : "ready");
    const result = {
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_EVIDENCE_LEDGER_VERSION,
      status:status,
      ledgerMode:safeMode(safe.ledgerMode),
      ledgerBoundary:{
        evidenceLedgerOnly:true,
        offlineMock:true,
        readOnly:true,
        canPersistLedger:false,
        canPersistEvidence:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistApproval:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canUseRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      ledgerSummary:{
        hasGovernanceClosureBoard:present(resolveSummary(safe, "offlineProviderGovernanceClosureBoardSummary", "WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard", "buildGlobalShoppingOfflineProviderGovernanceClosureBoard")),
        hasNoActivationComplianceSeal:present(resolveSummary(safe, "noActivationComplianceSealSummary", "WeishanGlobalShoppingNoActivationComplianceSeal", "buildGlobalShoppingNoActivationComplianceSeal")),
        hasFinalReadinessHandoffSimulator:present(resolveSummary(safe, "finalReadinessHandoffSimulatorSummary", "WeishanGlobalShoppingFinalReadinessHandoffSimulator", "buildGlobalShoppingFinalReadinessHandoffSimulator")),
        hasReleaseEvidenceSummary:present(resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary")),
        hasVerifyE2eBuildSummary:present(safe.verifyE2eBuildSummary),
        ledgerEntryCount:ledgerEntries.length,
        needsReviewEntryCount:needsReviewEntries.length,
        blockedEntryCount:directBlockedReasons.length + blockedEntries.length,
        readyForGovernanceClosureViewModel:status === "ready",
        humanGovernanceClosureReviewRequired:true
      },
      ledgerEntries:ledgerEntries,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedEntries.map(function (item) { return item.entryId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Governance Closure Evidence Ledger",
        resultLabel:status === "ready" ? "Provider Governance Closure Evidence Ledger 已准备" : (status === "blocked" ? "Provider Governance Closure Evidence Ledger 已阻断" : "Provider Governance Closure Evidence Ledger 仍需复核"),
        caveat:"该 Ledger 只展示治理闭环证据台账，不持久化台账、不保存真实 evidence。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderGovernanceClosureEvidenceRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderGovernanceClosureEvidenceLedgerAuditDraft(input) {
    const ledger = buildGlobalShoppingProviderGovernanceClosureEvidenceLedger(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_EVIDENCE_LEDGER_AUDIT_DRAFT",
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_EVIDENCE_LEDGER_VERSION,
      status:ledger.status,
      ledgerEntryCount:obj(ledger.ledgerSummary).ledgerEntryCount || 0,
      blockedEntryCount:obj(ledger.ledgerSummary).blockedEntryCount || 0,
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

  function sanitizeGlobalShoppingProviderGovernanceClosureEvidenceLedger(ledger) {
    return evaluateGlobalShoppingProviderGovernanceClosureEvidenceLedger(ledger || {});
  }

  function buildGlobalShoppingProviderGovernanceClosureEvidenceLedger(input) {
    try {
      return evaluateGlobalShoppingProviderGovernanceClosureEvidenceLedger(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderGovernanceClosureEvidenceLedger({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderGovernanceClosureEvidenceLedger = {
    GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_CLOSURE_EVIDENCE_LEDGER_VERSION,
    LEDGER_NAME,
    buildGlobalShoppingProviderGovernanceClosureEvidenceLedger,
    evaluateGlobalShoppingProviderGovernanceClosureEvidenceLedger,
    buildGlobalShoppingProviderGovernanceClosureEvidenceRows,
    buildGlobalShoppingProviderGovernanceClosureEvidenceEntries,
    buildGlobalShoppingProviderGovernanceClosureEvidenceLedgerAuditDraft,
    sanitizeGlobalShoppingProviderGovernanceClosureEvidenceLedger
  };
})();
