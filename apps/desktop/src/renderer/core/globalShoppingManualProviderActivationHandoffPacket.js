;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_PROVIDER_ACTIVATION_HANDOFF_PACKET_VERSION = "4.1.1";
  const PACKET_NAME = "global_shopping_manual_provider_activation_handoff_packet_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function section(sectionId, label, status, ownerRole, summary, caveat) {
    return {
      sectionId:text(sectionId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      ownerRole:text(ownerRole || "human_reviewer"),
      requiredBeforeActivation:true,
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
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
    }, obj(overrides));
  }
  function normalize(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "fail" || status === "failed_safe") return "blocked";
    if (status === "ready" || status === "pass" || status === "approved" || status === "allowed" || status === "clear") return "pass";
    return "warning";
  }

  function buildGlobalShoppingManualProviderActivationHandoffSections(input) {
    const safe = obj(input);
    const readOnlySandboxActivationReadinessCenterSummary = resolveSummary(safe, "readOnlySandboxActivationReadinessCenterSummary", "WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter", "buildGlobalShoppingReadOnlySandboxActivationReadinessCenter");
    const offlineMockSandboxSessionRunnerSummary = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const manualGovernanceReleaseDecisionRoomSummary = resolveSummary(safe, "manualGovernanceReleaseDecisionRoomSummary", "WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom", "buildGlobalShoppingManualGovernanceReleaseDecisionRoom");
    const providerReadinessSignOffPacketSummary = resolveSummary(safe, "providerReadinessSignOffPacketSummary", "WeishanGlobalShoppingProviderReadinessSignOffPacket", "buildGlobalShoppingProviderReadinessSignOffPacket");
    const releaseFreezeGateSummary = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    const complianceEvidencePackSummary = resolveSummary(safe, "complianceEvidencePackSummary", "WeishanGlobalShoppingComplianceEvidencePack", "buildGlobalShoppingComplianceEvidencePack");
    return clone([
      section("activation_readiness_center", "只读 Sandbox 激活准备中心", normalize(readOnlySandboxActivationReadinessCenterSummary), "release_manager", labelOf(readOnlySandboxActivationReadinessCenterSummary, "Sandbox 激活准备仍需复核"), "只展示激活准备摘要，不执行激活。"),
      section("offline_mock_sandbox_session", "离线 Mock Sandbox 会话运行器", normalize(offlineMockSandboxSessionRunnerSummary), "qa", labelOf(offlineMockSandboxSessionRunnerSummary, "离线 Mock 会话仍需复核"), "只运行离线 mock 会话，不联网。"),
      section("manual_decision_room", "Manual Governance Release 决策室", normalize(manualGovernanceReleaseDecisionRoomSummary), "release_manager", labelOf(manualGovernanceReleaseDecisionRoomSummary, "人工发布决策仍需复核"), "只展示人工决策，不创建 release。"),
      section("readiness_signoff_packet", "Provider 准备签核包", normalize(providerReadinessSignOffPacketSummary), "security", labelOf(providerReadinessSignOffPacketSummary, "准备签核仍需复核"), "只读签核摘要，不导出。"),
      section("release_freeze_gate", "Release Freeze Gate", normalize(releaseFreezeGateSummary), "security", labelOf(releaseFreezeGateSummary, "Release Freeze 仍需复核"), "只展示冻结条件，不 push。"),
      section("compliance_evidence_pack", "Compliance Evidence Pack", normalize(complianceEvidencePackSummary), "security", labelOf(complianceEvidencePackSummary, "合规证据仍需复核"), "只展示证据摘要，不写文件。")
    ]);
  }

  function buildGlobalShoppingManualProviderActivationHandoffRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.handoffSections) ? {
      handoffSections:safe.handoffSections.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingManualProviderActivationHandoffPacket(input);
    return clone([
      row("manual_handoff_status", "人工激活交接状态", obj(evaluation.userFacingSummary).resultLabel || "人工激活交接仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("manual_handoff_boundary", "交接边界", "只展示 handoff packet view data，不写文件，不下载，不上传，不发邮件。", "pass"),
      row("manual_handoff_runtime", "运行边界", "不创建 release/tag，不 push，不启动 provider，不读 key，不联网。", "pass")
    ].concat(toArray(evaluation.handoffSections).map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingManualProviderActivationHandoffPacket(input) {
    const safe = obj(input);
    const handoffSections = buildGlobalShoppingManualProviderActivationHandoffSections(safe);
    const blockedBoundary =
      safe.fileWrite === true ||
      safe.download === true ||
      safe.exportRealFile === true ||
      safe.uploadEvidence === true ||
      safe.sendEmail === true ||
      safe.openExternalDocument === true ||
      safe.persistHandoffResult === true ||
      safe.createRelease === true ||
      safe.createTag === true ||
      safe.push === true ||
      safe.startRealProvider === true ||
      safe.enableProvider === true ||
      safe.readApiKey === true ||
      safe.network === true;
    const blockedSections = handoffSections.filter(function (item) { return item.status === "blocked"; });
    const missingSections = handoffSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || blockedSections.length ? "blocked" : (missingSections.length ? "needs_review" : "ready");
    const handoffSummary = {
      hasActivationReadinessCenter:handoffSections[0].status !== "needs_review",
      hasOfflineMockSandboxSessionRunner:handoffSections[1].status !== "needs_review",
      hasManualDecisionRoom:handoffSections[2].status !== "needs_review",
      hasReadinessSignOffPacket:handoffSections[3].status !== "needs_review",
      hasReleaseFreezeGate:handoffSections[4].status !== "needs_review",
      hasComplianceEvidencePack:handoffSections[5].status !== "needs_review",
      handoffSectionCount:handoffSections.length,
      missingHandoffCount:missingSections.length,
      blockedHandoffCount:blockedSections.length,
      readyForHumanActivationReview:status === "ready",
      manualActivationRequired:true
    };
    return clone({
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_PROVIDER_ACTIVATION_HANDOFF_PACKET_VERSION,
      status:status,
      handoffBoundary:{
        packetId:"global-shopping-manual-provider-activation-handoff-packet",
        packetMode:"handoff_packet_only",
        handoffPacketOnly:true,
        readinessOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canWriteFile:false,
        canDownload:false,
        canExportRealFile:false,
        canUploadEvidence:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistHandoffResult:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      handoffSummary:handoffSummary,
      handoffSections:handoffSections,
      handoffHealth:{
        noFileWrite:safe.fileWrite !== true,
        noDownload:safe.download !== true,
        noRealExport:safe.exportRealFile !== true,
        noEvidenceUpload:safe.uploadEvidence !== true,
        noEmailSend:safe.sendEmail !== true,
        noExternalDocumentOpen:safe.openExternalDocument !== true,
        noHandoffPersistence:safe.persistHandoffResult !== true,
        noReleaseCreation:safe.createRelease !== true,
        noTagCreation:safe.createTag !== true,
        noPush:safe.push !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        manualActivationRequired:true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingManualProviderActivationHandoffRows({
        handoffSections:handoffSections,
        userFacingSummary:{
          resultLabel:status === "ready" ? "人工激活交接包已准备" : (status === "blocked" ? "人工激活交接已阻断" : "人工激活交接仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.fileWrite === true ? "file_write_detected" : "",
          safe.download === true ? "download_detected" : "",
          safe.exportRealFile === true ? "real_export_detected" : "",
          safe.uploadEvidence === true ? "evidence_upload_detected" : "",
          safe.sendEmail === true ? "email_send_detected" : "",
          safe.openExternalDocument === true ? "external_document_open_detected" : "",
          safe.persistHandoffResult === true ? "handoff_persistence_detected" : "",
          safe.createRelease === true ? "release_creation_detected" : "",
          safe.createTag === true ? "tag_creation_detected" : "",
          safe.push === true ? "push_detected" : "",
          safe.startRealProvider === true ? "real_provider_start_detected" : "",
          safe.enableProvider === true ? "provider_enablement_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.network === true ? "network_detected" : ""
        ].filter(Boolean) : [])
        .concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"人工 Provider 激活交接包",
        resultLabel:status === "ready" ? "人工激活交接包已准备" : (status === "blocked" ? "人工激活交接已阻断" : "人工激活交接仍需复核"),
        caveat:"该交接包只展示人工激活准备摘要，不写文件，不下载，不创建 release，不 push，不启动 provider。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingManualProviderActivationHandoffPacketAuditDraft(input) {
    const packet = buildGlobalShoppingManualProviderActivationHandoffPacket(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_PROVIDER_ACTIVATION_HANDOFF_PACKET_AUDIT_DRAFT",
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_PROVIDER_ACTIVATION_HANDOFF_PACKET_VERSION,
      status:packet.status,
      handoffSectionCount:obj(packet.handoffSummary).handoffSectionCount || 0,
      blockedHandoffCount:obj(packet.handoffSummary).blockedHandoffCount || 0,
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

  function sanitizeGlobalShoppingManualProviderActivationHandoffPacket(packet) {
    return evaluateGlobalShoppingManualProviderActivationHandoffPacket(packet || {});
  }

  function buildGlobalShoppingManualProviderActivationHandoffPacket(input) {
    try {
      return sanitizeGlobalShoppingManualProviderActivationHandoffPacket(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualProviderActivationHandoffPacket({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualProviderActivationHandoffPacket = {
    GLOBAL_SHOPPING_MANUAL_PROVIDER_ACTIVATION_HANDOFF_PACKET_VERSION,
    PACKET_NAME,
    buildGlobalShoppingManualProviderActivationHandoffPacket,
    evaluateGlobalShoppingManualProviderActivationHandoffPacket,
    buildGlobalShoppingManualProviderActivationHandoffRows,
    buildGlobalShoppingManualProviderActivationHandoffSections,
    buildGlobalShoppingManualProviderActivationHandoffPacketAuditDraft,
    sanitizeGlobalShoppingManualProviderActivationHandoffPacket
  };
})();
