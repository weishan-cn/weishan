;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_ACTIVATION_RECEIPT_LEDGER_VERSION = "3.8.0";
  const LEDGER_NAME = "global_shopping_sandbox_activation_receipt_ledger_v1";

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
      safe.persistRealReceipt === true ? "real_receipt_persistence_detected" : "",
      safe.persistLedger === true ? "ledger_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingSandboxActivationReceiptEntries(input) {
    const safe = obj(input);
    const offlineLaunchDecisionSimulatorSummary = resolveSummary(safe, "offlineLaunchDecisionSimulatorSummary", "WeishanGlobalShoppingOfflineLaunchDecisionSimulator", "buildGlobalShoppingOfflineLaunchDecisionSimulator");
    const sandboxActivationReviewPacketSummary = resolveSummary(safe, "sandboxActivationReviewPacketSummary", "WeishanGlobalShoppingSandboxActivationReviewPacket", "buildGlobalShoppingSandboxActivationReviewPacket");
    const providerCertificationFreezeLedgerSummary = resolveSummary(safe, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger");
    const humanApprovalEvidenceBinderSummary = resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    const releaseFreezeGateSummary = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    return clone([
      entry("launch_decision_simulator", "Offline Launch Decision Simulator", present(offlineLaunchDecisionSimulatorSummary) ? offlineLaunchDecisionSimulatorSummary.status : "needs_review", "release_manager", labelOf(offlineLaunchDecisionSimulatorSummary, "离线发布决策仍需复核"), "只展示离线发布决策，不保存真实决策。"),
      entry("activation_review_packet", "Sandbox Activation Review Packet", present(sandboxActivationReviewPacketSummary) ? sandboxActivationReviewPacketSummary.status : "needs_review", "activation_reviewer", labelOf(sandboxActivationReviewPacketSummary, "Sandbox 激活复核仍需复核"), "只展示激活复核，不激活 sandbox。"),
      entry("certification_freeze_ledger", "Provider Certification Freeze Ledger", present(providerCertificationFreezeLedgerSummary) ? providerCertificationFreezeLedgerSummary.status : "needs_review", "qa", labelOf(providerCertificationFreezeLedgerSummary, "认证冻结仍需复核"), "只展示冻结台账，不持久化台账。"),
      entry("evidence_binder", "Human Approval Evidence Binder", present(humanApprovalEvidenceBinderSummary) ? humanApprovalEvidenceBinderSummary.status : "needs_review", "security", labelOf(humanApprovalEvidenceBinderSummary, "人工审批证据仍需复核"), "只展示证据摘要，不上传。"),
      entry("release_freeze_gate", "Release Freeze Gate", present(releaseFreezeGateSummary) ? releaseFreezeGateSummary.status : "needs_review", "release_manager", labelOf(releaseFreezeGateSummary, "发布冻结仍需复核"), "只展示冻结门，不改 git。")
    ]);
  }

  function buildGlobalShoppingSandboxActivationReceiptRows(input) {
    const safe = obj(input);
    const receiptEntries = toArray(safe.receiptEntries).length ? toArray(safe.receiptEntries) : buildGlobalShoppingSandboxActivationReceiptEntries(safe);
    return clone([
      row("sandbox_activation_receipt_ledger_status", "Sandbox Activation Receipt Ledger 状态", obj(safe.userFacingSummary).resultLabel || "Sandbox 激活回执仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("sandbox_activation_receipt_ledger_boundary", "Sandbox 激活回执边界", "该台账只展示 mock activation receipt，不保存真实回执，不激活 sandbox，不启动 provider。", "pass")
    ].concat(receiptEntries.map(function (item) {
      return row(item.entryId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingSandboxActivationReceiptLedger(input) {
    const safe = obj(input);
    const receiptEntries = buildGlobalShoppingSandboxActivationReceiptEntries(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedReceiptEntries = receiptEntries.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const missingReceiptEntries = receiptEntries.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedReceiptEntries.length ? "blocked" : (missingReceiptEntries.length ? "needs_review" : "ready");
    const result = {
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_ACTIVATION_RECEIPT_LEDGER_VERSION,
      status:status,
      receiptBoundary:{
        ledgerId:"global-shopping-sandbox-activation-receipt-ledger",
        ledgerMode:"receipt_ledger_only",
        receiptLedgerOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readinessOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistRealReceipt:false,
        canPersistLedger:false,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      receiptSummary:{
        hasLaunchDecisionSimulator:receiptEntries[0].status !== "needs_review",
        hasActivationReviewPacket:receiptEntries[1].status !== "needs_review",
        hasCertificationFreezeLedger:receiptEntries[2].status !== "needs_review",
        hasEvidenceBinder:receiptEntries[3].status !== "needs_review",
        hasReleaseFreezeGate:receiptEntries[4].status !== "needs_review",
        receiptEntryCount:receiptEntries.length,
        missingReceiptEntryCount:missingReceiptEntries.length,
        blockedReceiptEntryCount:blockedReceiptEntries.length,
        readyForAdapterSecurityRegressionGuard:status === "ready",
        humanReceiptReviewRequired:true
      },
      receiptEntries:receiptEntries,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedReceiptEntries.map(function (item) { return item.entryId + "_blocked"; })),
      userFacingSummary:{
        title:"Sandbox Activation Receipt Ledger",
        resultLabel:status === "ready" ? "Sandbox 激活回执台账已准备" : (status === "blocked" ? "Sandbox 激活回执已阻断" : "Sandbox 激活回执仍需复核"),
        caveat:"该台账只展示 mock activation receipt，不保存真实回执，不激活 sandbox，不启动 provider。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingSandboxActivationReceiptRows(result);
    return clone(result);
  }

  function buildGlobalShoppingSandboxActivationReceiptLedgerAuditDraft(input) {
    const ledger = buildGlobalShoppingSandboxActivationReceiptLedger(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_ACTIVATION_RECEIPT_LEDGER_AUDIT_DRAFT",
      ledgerName:LEDGER_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_ACTIVATION_RECEIPT_LEDGER_VERSION,
      status:ledger.status,
      receiptEntryCount:obj(ledger.receiptSummary).receiptEntryCount || 0,
      blockedReceiptEntryCount:obj(ledger.receiptSummary).blockedReceiptEntryCount || 0,
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

  function sanitizeGlobalShoppingSandboxActivationReceiptLedger(ledger) {
    return evaluateGlobalShoppingSandboxActivationReceiptLedger(ledger || {});
  }

  function buildGlobalShoppingSandboxActivationReceiptLedger(input) {
    try {
      return evaluateGlobalShoppingSandboxActivationReceiptLedger(input || {});
    } catch (_) {
      return evaluateGlobalShoppingSandboxActivationReceiptLedger({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSandboxActivationReceiptLedger = {
    GLOBAL_SHOPPING_SANDBOX_ACTIVATION_RECEIPT_LEDGER_VERSION,
    LEDGER_NAME,
    buildGlobalShoppingSandboxActivationReceiptLedger,
    evaluateGlobalShoppingSandboxActivationReceiptLedger,
    buildGlobalShoppingSandboxActivationReceiptRows,
    buildGlobalShoppingSandboxActivationReceiptEntries,
    buildGlobalShoppingSandboxActivationReceiptLedgerAuditDraft,
    sanitizeGlobalShoppingSandboxActivationReceiptLedger
  };
})();
