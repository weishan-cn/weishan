;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_READINESS_SIGN_OFF_PACKET_VERSION = "2.4.0";
  const PACKET_NAME = "global_shopping_provider_readiness_sign_off_packet_v1";

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
      requiredBeforeRelease:true,
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

  function buildGlobalShoppingProviderReadinessSignOffSections(input) {
    const safe = obj(input);
    const manualDecisionRoomSummary = resolveSummary(safe, "manualDecisionRoomSummary", "WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom", "buildGlobalShoppingManualGovernanceReleaseDecisionRoom");
    const exceptionRegisterSummary = resolveSummary(safe, "exceptionRegisterSummary", "WeishanGlobalShoppingSandboxPilotExceptionRegister", "buildGlobalShoppingSandboxPilotExceptionRegister");
    const governanceAuditConsoleSummary = resolveSummary(safe, "governanceAuditConsoleSummary", "WeishanGlobalShoppingProviderGovernanceAuditConsole", "buildGlobalShoppingProviderGovernanceAuditConsole");
    const complianceEvidencePackSummary = resolveSummary(safe, "complianceEvidencePackSummary", "WeishanGlobalShoppingComplianceEvidencePack", "buildGlobalShoppingComplianceEvidencePack");
    const releaseFreezeGateSummary = resolveSummary(safe, "releaseFreezeGateSummary", "WeishanGlobalShoppingSandboxProviderReleaseFreezeGate", "buildGlobalShoppingSandboxProviderReleaseFreezeGate");
    const verifyE2eBuildSummary = obj(safe.verifyE2eBuildSummary || safe.verifySummary || {});
    const verifyStatus = text(verifyE2eBuildSummary.status || "");
    const verifySectionStatus = !present(verifyE2eBuildSummary) ? "needs_review" :
      ((verifyStatus === "blocked" || verifyStatus === "fail" || verifyStatus === "failed_safe") ? "blocked" :
        ((verifyStatus === "ready" || verifyStatus === "pass" || verifyStatus === "all_passed") ? "pass" : "warning"));
    return clone([
      section("manual_decision_room", "Manual Governance Release 决策室", normalize(manualDecisionRoomSummary), "release_manager", labelOf(manualDecisionRoomSummary, "人工发布决策仍需复核"), "只展示人工决策状态，不创建 release。"),
      section("exception_register", "Sandbox Pilot 例外登记簿", normalize(exceptionRegisterSummary), "operator", labelOf(exceptionRegisterSummary, "例外登记仍需复核"), "只读登记，不持久化例外。"),
      section("governance_audit_console", "Provider Governance 审计控制台", normalize(governanceAuditConsoleSummary), "security", labelOf(governanceAuditConsoleSummary, "治理审计仍需复核"), "只展示审计摘要，不写文件。"),
      section("compliance_evidence_pack", "Compliance Evidence Pack", normalize(complianceEvidencePackSummary), "security", labelOf(complianceEvidencePackSummary, "合规证据仍需复核"), "只读证据摘要，不导出。"),
      section("release_freeze_gate", "Release Freeze Gate", normalize(releaseFreezeGateSummary), "security", labelOf(releaseFreezeGateSummary, "Release Freeze 仍需复核"), "只展示冻结条件，不 push。"),
      section("verify_e2e_build_summary", "Verify / E2E / Build Summary", verifySectionStatus, "qa", text(verifyE2eBuildSummary.summaryLabel || verifyE2eBuildSummary.resultLabel || verifyStatus || "验证链仍需复核"), "只展示验证摘要，不创建 tag。")
    ]);
  }

  function buildGlobalShoppingProviderReadinessSignOffRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.signOffSections) ? {
      signOffSections:safe.signOffSections.slice(),
      userFacingSummary:obj(safe.userFacingSummary),
      status:text(safe.status || "needs_review")
    } : evaluateGlobalShoppingProviderReadinessSignOffPacket(input);
    return clone([
      row("provider_signoff_status", "准备签核状态", obj(evaluation.userFacingSummary).resultLabel || "准备签核仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("provider_signoff_boundary", "签核边界", "不写文件，不下载，不导出，不上传，不保存签核结果。", "pass"),
      row("provider_signoff_runtime", "运行边界", "不创建 release / tag，不 push，不启动 provider，不读 key，不联网。", "pass")
    ].concat(toArray(evaluation.signOffSections).map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderReadinessSignOffPacket(input) {
    const safe = obj(input);
    const signOffSections = buildGlobalShoppingProviderReadinessSignOffSections(safe);
    const blockedBoundary = safe.fileWrite === true || safe.download === true || safe.exportRealFile === true || safe.uploadEvidence === true ||
      safe.sendEmail === true || safe.openExternalDocument === true || safe.persistSignOffResult === true || safe.createRelease === true ||
      safe.createTag === true || safe.push === true || safe.startRealProvider === true || safe.enableProvider === true || safe.readApiKey === true || safe.network === true;
    const blockedSections = signOffSections.filter(function (item) { return item.status === "blocked"; });
    const missingSections = signOffSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || blockedSections.length ? "blocked" : (missingSections.length ? "needs_review" : "ready");
    const signOffSummary = {
      hasManualDecisionRoom:signOffSections[0].status !== "needs_review",
      hasExceptionRegister:signOffSections[1].status !== "needs_review",
      hasGovernanceAuditConsole:signOffSections[2].status !== "needs_review",
      hasComplianceEvidencePack:signOffSections[3].status !== "needs_review",
      hasReleaseFreezeGate:signOffSections[4].status !== "needs_review",
      hasVerifyE2eBuildSummary:signOffSections[5].status !== "needs_review",
      signOffSectionCount:signOffSections.length,
      missingSignOffCount:missingSections.length,
      blockedSignOffCount:blockedSections.length,
      readyForManualSignOffReview:status === "ready",
      manualSignOffRequired:true
    };
    return clone({
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_READINESS_SIGN_OFF_PACKET_VERSION,
      status:status,
      signOffBoundary:{
        packetId:"global-shopping-provider-readiness-sign-off-packet",
        packetMode:"sign_off_packet_only",
        signOffPacketOnly:true,
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
        canPersistSignOffResult:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canStartRealProvider:false,
        canEnableProvider:false,
        canReadApiKey:false,
        canCallNetwork:false
      },
      signOffSummary:signOffSummary,
      signOffSections:signOffSections,
      signOffHealth:{
        noFileWrite:safe.fileWrite !== true,
        noDownload:safe.download !== true,
        noRealExport:safe.exportRealFile !== true,
        noEvidenceUpload:safe.uploadEvidence !== true,
        noEmailSend:safe.sendEmail !== true,
        noExternalDocumentOpen:safe.openExternalDocument !== true,
        noSignOffPersistence:safe.persistSignOffResult !== true,
        noReleaseCreation:safe.createRelease !== true,
        noTagCreation:safe.createTag !== true,
        noPush:safe.push !== true,
        noRealProviderStart:safe.startRealProvider !== true,
        noProviderEnablement:safe.enableProvider !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        manualSignOffRequired:true,
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingProviderReadinessSignOffRows({
        signOffSections:signOffSections,
        userFacingSummary:{
          resultLabel:status === "ready" ? "准备签核包已准备" : (status === "blocked" ? "准备签核已阻断" : "准备签核仍需复核")
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
          safe.persistSignOffResult === true ? "signoff_persistence_detected" : "",
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
        title:"Provider 准备签核包",
        resultLabel:status === "ready" ? "准备签核包已准备" : (status === "blocked" ? "准备签核已阻断" : "准备签核仍需复核"),
        caveat:"该签核包只展示准备度摘要，不写文件，不下载，不保存签核结果，不创建 release，不 push。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderReadinessSignOffPacketAuditDraft(input) {
    const packet = evaluateGlobalShoppingProviderReadinessSignOffPacket(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_READINESS_SIGN_OFF_PACKET_AUDIT_DRAFT",
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_READINESS_SIGN_OFF_PACKET_VERSION,
      status:packet.status,
      signOffSectionCount:obj(packet.signOffSummary).signOffSectionCount || 0,
      blockedSignOffCount:obj(packet.signOffSummary).blockedSignOffCount || 0,
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

  function sanitizeGlobalShoppingProviderReadinessSignOffPacket(packet) {
    return evaluateGlobalShoppingProviderReadinessSignOffPacket(packet || {});
  }

  function buildGlobalShoppingProviderReadinessSignOffPacket(input) {
    try {
      return sanitizeGlobalShoppingProviderReadinessSignOffPacket(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingProviderReadinessSignOffPacket({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderReadinessSignOffPacket = {
    GLOBAL_SHOPPING_PROVIDER_READINESS_SIGN_OFF_PACKET_VERSION,
    PACKET_NAME,
    buildGlobalShoppingProviderReadinessSignOffPacket,
    evaluateGlobalShoppingProviderReadinessSignOffPacket,
    buildGlobalShoppingProviderReadinessSignOffRows,
    buildGlobalShoppingProviderReadinessSignOffSections,
    buildGlobalShoppingProviderReadinessSignOffPacketAuditDraft,
    sanitizeGlobalShoppingProviderReadinessSignOffPacket
  };
})();
