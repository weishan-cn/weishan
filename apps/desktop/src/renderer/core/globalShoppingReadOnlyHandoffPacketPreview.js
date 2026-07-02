;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_HANDOFF_PACKET_PREVIEW_VERSION = "4.0.2";
  const PACKET_NAME = "global_shopping_read_only_handoff_packet_preview_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function mode(value) {
    const next = text(value || "disabled");
    return /^(disabled|preview_only|dry_run|sandbox_ready)$/.test(next) ? next : "disabled";
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function linkedSummary(summary) {
    const safe = obj(summary);
    return clone({
      status:text(safe.status || ""),
      title:text(safe.title || safe.packetName || safe.simulatorName || safe.receiptName || safe.gateName || ""),
      userFacingSummary:{
        title:text(obj(safe.userFacingSummary).title || ""),
        resultLabel:text(obj(safe.userFacingSummary).resultLabel || ""),
        caveat:text(obj(safe.userFacingSummary).caveat || ""),
        redacted:true
      },
      redacted:true
    });
  }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = window[apiName] || {};
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](buildInput || safe) : {};
  }
  function recommendedCandidateId(input) {
    const comparison = obj(input.sandboxCandidateComparisonWorkbenchSummary || input.sandboxCandidateComparisonWorkbench || input.candidateComparisonSummary);
    return text(obj(comparison.recommendationSummary).recommendedCandidateId || "");
  }
  function buildGlobalShoppingReadOnlyHandoffPacketSections(input) {
    const safe = obj(input);
    const simulator = resolveSummary(safe, "readOnlyPlatformHandoffSimulatorSummary", "WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator", "buildGlobalShoppingReadOnlyPlatformHandoffSimulator", safe);
    const pack = resolveSummary(safe, "redactedSearchParameterPackSummary", "WeishanGlobalShoppingRedactedSearchParameterPack", "buildGlobalShoppingRedactedSearchParameterPack", safe);
    const checklist = resolveSummary(safe, "userConfirmationChecklistSummary", "WeishanGlobalShoppingUserConfirmationChecklist", "buildGlobalShoppingUserConfirmationChecklist", safe);
    const decisionReview = obj(safe.sandboxDecisionReviewViewModelSummary || safe.sandboxDecisionReviewViewModel);
    const comparison = obj(safe.sandboxCandidateComparisonWorkbenchSummary || safe.sandboxCandidateComparisonWorkbench);
    const evidenceMatrix = obj(safe.providerEvidenceComparisonMatrixSummary || safe.providerEvidenceComparisonMatrix);
    const candidateJourney = obj(safe.readOnlyCandidateJourneySummary || safe.readOnlyCandidateJourneyBoard);
    const allowed = toArray(pack.allowedParameters);
    const confirmations = toArray(checklist.confirmationItems);
    return clone([
      {
        sectionId:"candidate_evidence",
        title:"候选与证据摘要",
        status:Object.keys(decisionReview).length && Object.keys(comparison).length && Object.keys(evidenceMatrix).length ? "pass" : "warning",
        rows:[
          { rowId:"decision_review", label:"决策复核", value:text(obj(decisionReview.userFacingSummary).resultLabel || decisionReview.title || "决策复核仍需补齐"), redacted:true },
          { rowId:"candidate_comparison", label:"候选对比", value:text(obj(comparison.userFacingSummary).resultLabel || comparison.title || "候选对比仍需补齐"), redacted:true },
          { rowId:"evidence_matrix", label:"证据矩阵", value:text(obj(evidenceMatrix.userFacingSummary).resultLabel || evidenceMatrix.title || "证据矩阵仍需补齐"), redacted:true },
          { rowId:"candidate_journey", label:"候选旅程", value:text(obj(candidateJourney.userFacingSummary).resultLabel || candidateJourney.title || "候选旅程仍需补齐"), redacted:true }
        ],
        caveat:"候选来源、可信度和证据摘要仅用于只读复核，不代表真实价格、锁价、可订或可出票。",
        redacted:true
      },
      {
        sectionId:"non_sensitive_parameters",
        title:"非敏感搜索参数",
        status:allowed.length ? "pass" : "warning",
        rows:allowed.map(function (item) {
          return { rowId:text(item.key), label:text(item.key), value:text(item.valueLabel), redacted:true };
        }),
        caveat:"交接包只展示非敏感搜索参数，不包含身份、联系方式、平台账号、支付资料或真实交易链接。",
        redacted:true
      },
      {
        sectionId:"user_confirmation_boundary",
        title:"用户必须自行确认",
        status:confirmations.length ? "pass" : "warning",
        rows:confirmations.slice(0, 6).map(function (item) {
          return { rowId:text(item.itemId), label:text(item.label), value:text(item.summary), redacted:true };
        }),
        caveat:"平台实时页面才是最终价格、库存、规则、账号、身份、支付与订单来源。",
        redacted:true
      },
      {
        sectionId:"handoff_boundary",
        title:"交接边界",
        status:statusOf(simulator) === "blocked" ? "blocked" : (statusOf(simulator) === "ready" && statusOf(pack) === "ready" && statusOf(checklist) === "ready" ? "pass" : "warning"),
        rows:[
          { rowId:"simulator", label:"交接模拟", value:text(obj(simulator.userFacingSummary).resultLabel || "交接模拟仍需复核"), redacted:true },
          { rowId:"parameter_pack", label:"搜索参数包", value:text(obj(pack.userFacingSummary).resultLabel || "参数包仍需复核"), redacted:true },
          { rowId:"user_checklist", label:"用户确认清单", value:text(obj(checklist.userFacingSummary).resultLabel || "清单仍需复核"), redacted:true }
        ],
        caveat:"Weishan 只准备非敏感搜索参数和只读说明，不代替用户登录、付款、下单或出票。",
        redacted:true
      }
    ]);
  }
  function buildGlobalShoppingReadOnlyHandoffPacketPreviewRows(input) {
    const safe = obj(input);
    const sections = buildGlobalShoppingReadOnlyHandoffPacketSections(safe);
    return clone(sections.map(function (section) {
      return {
        rowId:text(section.sectionId),
        label:text(section.title),
        value:text(section.caveat),
        status:section.status === "blocked" ? "blocked" : (section.status === "pass" ? "pass" : "warning"),
        redacted:true
      };
    }));
  }
  function evaluateGlobalShoppingReadOnlyHandoffPacketPreview(input) {
    const safe = obj(input);
    const simulator = resolveSummary(safe, "readOnlyPlatformHandoffSimulatorSummary", "WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator", "buildGlobalShoppingReadOnlyPlatformHandoffSimulator", safe);
    const pack = resolveSummary(safe, "redactedSearchParameterPackSummary", "WeishanGlobalShoppingRedactedSearchParameterPack", "buildGlobalShoppingRedactedSearchParameterPack", safe);
    const checklist = resolveSummary(safe, "userConfirmationChecklistSummary", "WeishanGlobalShoppingUserConfirmationChecklist", "buildGlobalShoppingUserConfirmationChecklist", safe);
    const decisionReview = obj(safe.sandboxDecisionReviewViewModelSummary || safe.sandboxDecisionReviewViewModel);
    const comparison = obj(safe.sandboxCandidateComparisonWorkbenchSummary || safe.sandboxCandidateComparisonWorkbench);
    const evidenceMatrix = obj(safe.providerEvidenceComparisonMatrixSummary || safe.providerEvidenceComparisonMatrix);
    const blockedReasons = [];
    if (safe.fileWrite === true || safe.persistPacket === true || safe.canPersistPacket === true) blockedReasons.push("packet_persistence_detected");
    if (safe.export === true || safe.canExportPacket === true || safe.download === true || safe.canDownloadPacket === true) blockedReasons.push("packet_export_download_detected");
    if (safe.upload === true || safe.canUploadPacket === true) blockedReasons.push("packet_upload_detected");
    if (safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safe.canGenerateRealUrl === true) blockedReasons.push("real_url_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true || safe.canOpenExternalNow === true) blockedReasons.push("external_open_detected");
    if (safe.identityIncluded === true || safe.realNameStored === true || safe.phoneStored === true || safe.emailStored === true) blockedReasons.push("identity_carry_detected");
    if (safe.paymentCredentialIncluded === true || safe.paymentCredentialStored === true) blockedReasons.push("payment_credential_detected");
    if (safe.paymentAuthorized === true || safe.authorizePayment === true || safe.canAuthorizePayment === true) blockedReasons.push("payment_authorization_detected");
    if (safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true || safe.createOrder === true || safe.canCheckout === true || safe.canPay === true || safe.canTicket === true || safe.canCreateOrder === true) blockedReasons.push("transaction_capability_detected");
    if (safe.bindUser === true || safe.canBindUser === true) blockedReasons.push("user_binding_detected");
    if (safe.claimsLowestPrice === true || safe.claimsBestPrice === true || safe.claimsLockedPrice === true || safe.claimsAvailability === true || safe.claimsBookability === true || safe.claimsTicketability === true || safe.claimsOfficialEndorsement === true) blockedReasons.push("forbidden_claim_detected");
    const packetSummary = {
      hasHandoffSimulator:Object.keys(simulator).length > 0,
      hasParameterPack:Object.keys(pack).length > 0,
      hasUserChecklist:Object.keys(checklist).length > 0,
      hasDecisionReview:Object.keys(decisionReview).length > 0,
      hasCandidateComparison:Object.keys(comparison).length > 0,
      hasEvidenceMatrix:Object.keys(evidenceMatrix).length > 0,
      hasRecommendedCandidate:!!recommendedCandidateId(safe),
      allowedParameterCount:toArray(pack.allowedParameters).length,
      blockedSensitiveParameterCount:toArray(pack.blockedParameters).length,
      userConfirmationItemCount:toArray(checklist.confirmationItems).length,
      userOnlyActionCount:toArray(checklist.userOnlyActions).length
    };
    const packetHealth = {
      noPersistence:safe.fileWrite !== true && safe.persistPacket !== true && safe.canPersistPacket !== true,
      noExportDownloadUpload:safe.export !== true && safe.canExportPacket !== true && safe.download !== true && safe.canDownloadPacket !== true && safe.upload !== true && safe.canUploadPacket !== true,
      noRealUrl:!safe.bookingUrl && !safe.checkoutUrl && !safe.paymentUrl && !safe.orderUrl && safe.canGenerateRealUrl !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true && safe.canOpenExternalNow !== true,
      noIdentityCarry:safe.identityIncluded !== true && safe.realNameStored !== true && safe.phoneStored !== true && safe.emailStored !== true,
      noPaymentCredentialCarry:safe.paymentCredentialIncluded !== true && safe.paymentCredentialStored !== true,
      noCheckoutPaymentTicketingOrder:safe.checkout !== true && safe.payment !== true && safe.ticketing !== true && safe.order !== true && safe.createOrder !== true && safe.canCheckout !== true && safe.canPay !== true && safe.canTicket !== true && safe.canCreateOrder !== true,
      noUserBinding:safe.bindUser !== true && safe.canBindUser !== true,
      noPaymentAuthorization:safe.paymentAuthorized !== true && safe.authorizePayment !== true && safe.canAuthorizePayment !== true,
      noForbiddenClaims:safe.claimsLowestPrice !== true && safe.claimsBestPrice !== true && safe.claimsLockedPrice !== true && safe.claimsAvailability !== true && safe.claimsBookability !== true && safe.claimsTicketability !== true && safe.claimsOfficialEndorsement !== true
    };
    const needsReview = !packetSummary.hasHandoffSimulator || !packetSummary.hasParameterPack || !packetSummary.hasUserChecklist || !packetSummary.hasDecisionReview || !packetSummary.hasCandidateComparison || !packetSummary.hasEvidenceMatrix || !packetSummary.hasRecommendedCandidate;
    const ready = !blockedReasons.length && !needsReview;
    return clone({
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_HANDOFF_PACKET_PREVIEW_VERSION,
      status:blockedReasons.length ? "blocked" : (ready ? "ready" : "needs_review"),
      packetBoundary:{
        packetId:text(safe.packetId || "handoff_packet_preview_v2_2_4"),
        packetMode:mode(safe.packetMode || (ready ? "sandbox_ready" : (packetSummary.allowedParameterCount ? "preview_only" : "disabled"))),
        previewOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canPersistPacket:false,
        canExportPacket:false,
        canDownloadPacket:false,
        canUploadPacket:false,
        canGenerateRealUrl:false,
        canOpenExternalNow:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false,
        doesNotBindUser:true,
        doesNotAuthorizePayment:true
      },
      packetSummary:packetSummary,
      packetSections:buildGlobalShoppingReadOnlyHandoffPacketSections(safe),
      packetHealth:packetHealth,
      rows:buildGlobalShoppingReadOnlyHandoffPacketPreviewRows(safe),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"只读交接包预览",
        resultLabel:blockedReasons.length ? "交接包预览已阻断" : (ready ? "交接包预览已准备" : "交接包预览仍需复核"),
        caveat:"当前只在界面内预览脱敏交接信息，不生成真实链接，不导出文件，不打开平台，不构成订单、付款授权或用户签名。"
      },
      readOnlyPlatformHandoffSimulatorSummary:linkedSummary(simulator),
      redactedSearchParameterPackSummary:linkedSummary(pack),
      userConfirmationChecklistSummary:linkedSummary(checklist),
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function sanitizeGlobalShoppingReadOnlyHandoffPacketPreview(packet) {
    const safe = obj(packet);
    const evaluated = evaluateGlobalShoppingReadOnlyHandoffPacketPreview(safe);
    return clone({
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_HANDOFF_PACKET_PREVIEW_VERSION,
      status:/^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status,
      packetBoundary:clone(evaluated.packetBoundary),
      packetSummary:clone(evaluated.packetSummary),
      packetSections:toArray(safe.packetSections).length ? toArray(safe.packetSections) : clone(evaluated.packetSections),
      packetHealth:clone(evaluated.packetHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : clone(evaluated.rows),
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:clone(evaluated.userFacingSummary),
      readOnlyPlatformHandoffSimulatorSummary:clone(evaluated.readOnlyPlatformHandoffSimulatorSummary),
      redactedSearchParameterPackSummary:clone(evaluated.redactedSearchParameterPackSummary),
      userConfirmationChecklistSummary:clone(evaluated.userConfirmationChecklistSummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingReadOnlyHandoffPacketPreview(input) {
    try {
      return sanitizeGlobalShoppingReadOnlyHandoffPacketPreview(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingReadOnlyHandoffPacketPreview({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingReadOnlyHandoffPacketPreviewAuditDraft(input) {
    const packet = buildGlobalShoppingReadOnlyHandoffPacketPreview(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_HANDOFF_PACKET_PREVIEW_AUDIT_DRAFT",
      packetName:PACKET_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_HANDOFF_PACKET_PREVIEW_VERSION,
      status:packet.status,
      blockedReasonCount:packet.blockedReasons.length,
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

  window.WeishanGlobalShoppingReadOnlyHandoffPacketPreview = {
    GLOBAL_SHOPPING_READ_ONLY_HANDOFF_PACKET_PREVIEW_VERSION,
    PACKET_NAME,
    buildGlobalShoppingReadOnlyHandoffPacketPreview,
    evaluateGlobalShoppingReadOnlyHandoffPacketPreview,
    buildGlobalShoppingReadOnlyHandoffPacketPreviewRows,
    buildGlobalShoppingReadOnlyHandoffPacketSections,
    buildGlobalShoppingReadOnlyHandoffPacketPreviewAuditDraft,
    sanitizeGlobalShoppingReadOnlyHandoffPacketPreview
  };
})();
