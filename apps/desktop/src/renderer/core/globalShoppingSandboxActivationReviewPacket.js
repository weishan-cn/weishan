;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_ACTIVATION_REVIEW_PACKET_VERSION = "3.5.0";
  const PACKET_NAME = "global_shopping_sandbox_activation_review_packet_v1";

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
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingSandboxActivationReviewSections(input) {
    const safe = obj(input);
    const offlineReleaseGateSummary = resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    const certificationFreezeLedgerSummary = resolveSummary(safe, "providerCertificationFreezeLedgerSummary", "WeishanGlobalShoppingProviderCertificationFreezeLedger", "buildGlobalShoppingProviderCertificationFreezeLedger");
    const manualActivationCommandCenterSummary = resolveSummary(safe, "manualActivationCommandCenterSummary", "WeishanGlobalShoppingManualActivationCommandCenter", "buildGlobalShoppingManualActivationCommandCenter");
    const evidenceBinderSummary = resolveSummary(safe, "humanApprovalEvidenceBinderSummary", "WeishanGlobalShoppingHumanApprovalEvidenceBinder", "buildGlobalShoppingHumanApprovalEvidenceBinder");
    const boundaryLockSummary = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    const releaseFreezeGateSummary = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    return clone([
      section("offline_release_gate", "Provider Offline Release Gate", present(offlineReleaseGateSummary) ? offlineReleaseGateSummary.status : "needs_review", labelOf(offlineReleaseGateSummary, "离线发布闸门仍需复核"), "只展示离线发布闸门，不创建 release。"),
      section("certification_freeze_ledger", "Provider Certification Freeze Ledger", present(certificationFreezeLedgerSummary) ? certificationFreezeLedgerSummary.status : "needs_review", labelOf(certificationFreezeLedgerSummary, "认证冻结仍需复核"), "只展示认证冻结台账，不持久化台账。"),
      section("manual_activation_command_center", "Manual Activation Command Center", present(manualActivationCommandCenterSummary) ? manualActivationCommandCenterSummary.status : "needs_review", labelOf(manualActivationCommandCenterSummary, "人工激活指挥仍需复核"), "只展示人工激活命令摘要，不激活 sandbox。"),
      section("human_approval_evidence_binder", "Human Approval Evidence Binder", present(evidenceBinderSummary) ? evidenceBinderSummary.status : "needs_review", labelOf(evidenceBinderSummary, "人工审批证据仍需复核"), "只展示人工审批证据，不上传。"),
      section("adapter_boundary_lock", "Adapter Boundary Lock", present(boundaryLockSummary) ? boundaryLockSummary.status : "needs_review", labelOf(boundaryLockSummary, "Adapter 边界锁仍需复核"), "只展示边界锁，不改配置。"),
      section("release_freeze_gate", "Release Freeze Gate", present(releaseFreezeGateSummary) ? releaseFreezeGateSummary.status : "needs_review", labelOf(releaseFreezeGateSummary, "发布冻结仍需复核"), "只展示冻结门，不改 git。")
    ]);
  }

  function buildGlobalShoppingSandboxActivationReviewRows(input) {
    const safe = obj(input);
    const reviewSections = toArray(safe.reviewSections).length ? toArray(safe.reviewSections) : buildGlobalShoppingSandboxActivationReviewSections(safe);
    return clone([
      row("sandbox_activation_review_packet_status", "Sandbox Activation Review Packet 状态", obj(safe.userFacingSummary).resultLabel || "Sandbox 激活复核仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("sandbox_activation_review_packet_boundary", "Sandbox 激活复核边界", "该复核包只展示 sandbox 激活复核摘要，不激活 sandbox，不读取密钥，不联网，不创建 release，不 push。", "pass")
    ].concat(reviewSections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingSandboxActivationReviewPacket(input) {
    const safe = obj(input);
    const reviewSections = buildGlobalShoppingSandboxActivationReviewSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = reviewSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const missingSections = reviewSections.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (missingSections.length ? "needs_review" : "ready");
    const result = {
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_ACTIVATION_REVIEW_PACKET_VERSION,
      status:status,
      reviewBoundary:{
        packetId:"global-shopping-sandbox-activation-review-packet",
        packetMode:"review_packet_only",
        reviewPacketOnly:true,
        readinessOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canActivateSandbox:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canGenerateEndpoint:false,
        canWriteFile:false,
        canDownload:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      reviewSummary:{
        hasOfflineReleaseGate:reviewSections[0].status !== "needs_review",
        hasCertificationFreezeLedger:reviewSections[1].status !== "needs_review",
        hasManualActivationCommandCenter:reviewSections[2].status !== "needs_review",
        hasEvidenceBinder:reviewSections[3].status !== "needs_review",
        hasBoundaryLock:reviewSections[4].status !== "needs_review",
        hasReleaseFreezeGate:reviewSections[5].status !== "needs_review",
        reviewSectionCount:reviewSections.length,
        missingReviewSectionCount:missingSections.length,
        blockedReviewSectionCount:blockedSections.length,
        readyForAdapterBoundaryDiffInspector:status === "ready",
        manualActivationReviewRequired:true
      },
      reviewSections:reviewSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Sandbox Activation Review Packet",
        resultLabel:status === "ready" ? "Sandbox 激活复核包已准备" : (status === "blocked" ? "Sandbox 激活复核已阻断" : "Sandbox 激活复核仍需复核"),
        caveat:"该复核包只展示 sandbox 激活复核摘要，不激活 sandbox，不读取密钥，不联网，不创建 release，不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingSandboxActivationReviewRows(result);
    return clone(result);
  }

  function buildGlobalShoppingSandboxActivationReviewPacketAuditDraft(input) {
    const packet = buildGlobalShoppingSandboxActivationReviewPacket(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_ACTIVATION_REVIEW_PACKET_AUDIT_DRAFT",
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_ACTIVATION_REVIEW_PACKET_VERSION,
      status:packet.status,
      reviewSectionCount:obj(packet.reviewSummary).reviewSectionCount || 0,
      blockedReviewSectionCount:obj(packet.reviewSummary).blockedReviewSectionCount || 0,
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

  function sanitizeGlobalShoppingSandboxActivationReviewPacket(packet) {
    return evaluateGlobalShoppingSandboxActivationReviewPacket(packet || {});
  }

  function buildGlobalShoppingSandboxActivationReviewPacket(input) {
    try {
      return evaluateGlobalShoppingSandboxActivationReviewPacket(input || {});
    } catch (_) {
      return evaluateGlobalShoppingSandboxActivationReviewPacket({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSandboxActivationReviewPacket = {
    GLOBAL_SHOPPING_SANDBOX_ACTIVATION_REVIEW_PACKET_VERSION,
    PACKET_NAME,
    buildGlobalShoppingSandboxActivationReviewPacket,
    evaluateGlobalShoppingSandboxActivationReviewPacket,
    buildGlobalShoppingSandboxActivationReviewRows,
    buildGlobalShoppingSandboxActivationReviewSections,
    buildGlobalShoppingSandboxActivationReviewPacketAuditDraft,
    sanitizeGlobalShoppingSandboxActivationReviewPacket
  };
})();
