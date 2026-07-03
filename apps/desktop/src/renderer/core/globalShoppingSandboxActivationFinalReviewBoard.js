;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_ACTIVATION_FINAL_REVIEW_BOARD_VERSION = "4.1.0";
  const BOARD_NAME = "global_shopping_sandbox_activation_final_review_board_v1";

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
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.uploadEvidence === true ? "upload_evidence_detected" : "",
      safe.sendEmail === true ? "send_email_detected" : "",
      safe.openExternalDocument === true ? "external_document_open_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingSandboxActivationFinalReviewSections(input) {
    const safe = obj(input);
    const offlineProviderLaunchControlTowerSummary = resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower");
    const adapterPolicyEngineSummary = resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine");
    const humanReleaseEvidenceTimelineSummary = resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline");
    const sandboxActivationReviewPacketSummary = resolveSummary(safe, "sandboxActivationReviewPacketSummary", "WeishanGlobalShoppingSandboxActivationReviewPacket", "buildGlobalShoppingSandboxActivationReviewPacket");
    const sandboxActivationReceiptLedgerSummary = resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger");
    const providerOfflineReleaseGateSummary = resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    return clone([
      section("launch_control_tower", "Offline Provider Launch Control Tower", present(offlineProviderLaunchControlTowerSummary) ? offlineProviderLaunchControlTowerSummary.status : "needs_review", labelOf(offlineProviderLaunchControlTowerSummary, "离线 Launch 控制塔仍需复核"), "Launch Control 不保存真实决策。"),
      section("adapter_policy_engine", "Adapter Policy Engine", present(adapterPolicyEngineSummary) ? adapterPolicyEngineSummary.status : "needs_review", labelOf(adapterPolicyEngineSummary, "Adapter 策略仍需复核"), "Adapter Policy 不修改配置、不启用 provider。"),
      section("release_evidence_timeline", "Human Release Evidence Timeline", present(humanReleaseEvidenceTimelineSummary) ? humanReleaseEvidenceTimelineSummary.status : "needs_review", labelOf(humanReleaseEvidenceTimelineSummary, "人工发布证据仍需复核"), "Evidence Timeline 不持久化时间线。"),
      section("activation_review_packet", "Sandbox Activation Review Packet", present(sandboxActivationReviewPacketSummary) ? sandboxActivationReviewPacketSummary.status : "needs_review", labelOf(sandboxActivationReviewPacketSummary, "Sandbox 激活复核仍需复核"), "Final Review 不激活 sandbox。"),
      section("activation_receipt_ledger", "Sandbox Activation Receipt Ledger", present(sandboxActivationReceiptLedgerSummary) ? sandboxActivationReceiptLedgerSummary.status : "needs_review", labelOf(sandboxActivationReceiptLedgerSummary, "Sandbox 激活回执仍需复核"), "Receipt Ledger 不保存真实回执。"),
      section("offline_release_gate", "Provider Offline Release Gate", present(providerOfflineReleaseGateSummary) ? providerOfflineReleaseGateSummary.status : "needs_review", labelOf(providerOfflineReleaseGateSummary, "离线发布闸门仍需复核"), "Offline Release Gate 不创建 release、不 push。")
    ]);
  }

  function buildGlobalShoppingSandboxActivationFinalReviewRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.reviewSections).length ? toArray(safe.reviewSections) : buildGlobalShoppingSandboxActivationFinalReviewSections(safe);
    return clone([
      row("sandbox_activation_final_review_board_status", "Sandbox Activation Final Review Board 状态", obj(safe.userFacingSummary).resultLabel || "Sandbox 激活终审仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("sandbox_activation_final_review_board_boundary", "Sandbox Activation Final Review 边界", "该终审板只展示 sandbox 激活最终复核，不激活 sandbox，不读取密钥，不联网，不创建 release，不 push。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingSandboxActivationFinalReviewBoard(input) {
    const safe = obj(input);
    const sections = buildGlobalShoppingSandboxActivationFinalReviewSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = sections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const missingSections = sections.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (missingSections.length ? "needs_review" : "ready");
    const result = {
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_ACTIVATION_FINAL_REVIEW_BOARD_VERSION,
      status:status,
      reviewBoundary:{
        boardId:"global-shopping-sandbox-activation-final-review-board",
        boardMode:"final_review_only",
        finalReviewOnly:true,
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
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canWriteFile:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false
      },
      reviewSummary:{
        hasLaunchControlTower:present(resolveSummary(safe, "offlineProviderLaunchControlTowerSummary", "WeishanGlobalShoppingOfflineProviderLaunchControlTower", "buildGlobalShoppingOfflineProviderLaunchControlTower")),
        hasAdapterPolicyEngine:present(resolveSummary(safe, "adapterPolicyEngineSummary", "WeishanGlobalShoppingAdapterPolicyEngine", "buildGlobalShoppingAdapterPolicyEngine")),
        hasReleaseEvidenceTimeline:present(resolveSummary(safe, "humanReleaseEvidenceTimelineSummary", "WeishanGlobalShoppingHumanReleaseEvidenceTimeline", "buildGlobalShoppingHumanReleaseEvidenceTimeline")),
        hasActivationReviewPacket:present(resolveSummary(safe, "sandboxActivationReviewPacketSummary", "WeishanGlobalShoppingSandboxActivationReviewPacket", "buildGlobalShoppingSandboxActivationReviewPacket")),
        hasActivationReceiptLedger:present(resolveSummary(safe, "sandboxActivationReceiptLedgerSummary", "WeishanGlobalShoppingSandboxActivationReceiptLedger", "buildGlobalShoppingSandboxActivationReceiptLedger")),
        hasOfflineReleaseGate:present(resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate")),
        reviewSectionCount:sections.length,
        missingReviewSectionCount:missingSections.length,
        blockedReviewSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForLaunchControlViewModel:status === "ready",
        humanFinalReviewRequired:true
      },
      reviewSections:sections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Sandbox Activation Final Review Board",
        resultLabel:status === "ready" ? "Sandbox 激活终审板已准备" : (status === "blocked" ? "Sandbox 激活终审已阻断" : "Sandbox 激活终审仍需复核"),
        caveat:"该终审板只展示 sandbox 激活最终复核，不激活 sandbox，不读取密钥，不联网，不创建 release，不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingSandboxActivationFinalReviewRows(result);
    return clone(result);
  }

  function buildGlobalShoppingSandboxActivationFinalReviewBoardAuditDraft(input) {
    const board = buildGlobalShoppingSandboxActivationFinalReviewBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_ACTIVATION_FINAL_REVIEW_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_ACTIVATION_FINAL_REVIEW_BOARD_VERSION,
      status:board.status,
      reviewSectionCount:obj(board.reviewSummary).reviewSectionCount || 0,
      blockedReviewSectionCount:obj(board.reviewSummary).blockedReviewSectionCount || 0,
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

  function sanitizeGlobalShoppingSandboxActivationFinalReviewBoard(board) {
    return evaluateGlobalShoppingSandboxActivationFinalReviewBoard(board || {});
  }

  function buildGlobalShoppingSandboxActivationFinalReviewBoard(input) {
    try {
      return evaluateGlobalShoppingSandboxActivationFinalReviewBoard(input || {});
    } catch (_) {
      return evaluateGlobalShoppingSandboxActivationFinalReviewBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSandboxActivationFinalReviewBoard = {
    GLOBAL_SHOPPING_SANDBOX_ACTIVATION_FINAL_REVIEW_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingSandboxActivationFinalReviewBoard,
    evaluateGlobalShoppingSandboxActivationFinalReviewBoard,
    buildGlobalShoppingSandboxActivationFinalReviewRows,
    buildGlobalShoppingSandboxActivationFinalReviewSections,
    buildGlobalShoppingSandboxActivationFinalReviewBoardAuditDraft,
    sanitizeGlobalShoppingSandboxActivationFinalReviewBoard
  };
})();
