;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE_VERSION = "4.1.1";
  const TRACE_NAME = "global_shopping_provider_evidence_trace_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function allowedMode(value) {
    const mode = text(value || "disabled");
    return /^(disabled|summary_only|dry_run|sandbox_ready)$/.test(mode) ? mode : "disabled";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId || "row"), label:text(label || ""), value:text(value || ""), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
      sensitiveStored:false,
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
  function defaultEvidenceItems(input) {
    const safe = obj(input);
    const replay = obj(safe.sandboxSessionReplayCenter);
    const coverage = obj(safe.providerCoverageDashboard);
    const trust = obj(safe.readOnlySourceTrustScore);
    const normalizer = obj(safe.dryRunProviderResponseNormalizer);
    const pipeline = obj(safe.pricePipelineOrchestrator);
    const resultBoard = obj(safe.sandboxPriceCandidateResultBoard);
    const connector = obj(safe.firstSandboxProviderConnector);
    const hasHandoff = !!(replay.replaySummary && replay.replaySummary.hasHandoffPreview);
    return [
      { evidenceId:"official_anchor_1", candidateId:"candidate_1", sourceId:"official_anchor", sourceName:"官方参考价", sourceType:"official", evidenceType:"official_anchor", evidenceStatus:statusOf(obj(pipeline.officialPriceAnchorSummary)) === "anchored" ? "pass" : "needs_review", trustLabel:"high", traceSummary:"官方参考价锚点用于校对候选价来源。", caveat:"官方参考价不代表官方背书或可订能力。" },
      { evidenceId:"provider_candidate_1", candidateId:"candidate_1", sourceId:"sandbox_connector", sourceName:"Sandbox Provider Connector", sourceType:"fixture", evidenceType:"provider_candidate", evidenceStatus:statusOf(connector) === "ready" ? "pass" : "needs_review", trustLabel:"medium", traceSummary:"候选价来自本地只读 sandbox provider 摘要。", caveat:"不包含真实 provider response 或真实 URL。" },
      { evidenceId:"tax_fee_normalization_1", candidateId:"candidate_1", sourceId:"price_normalizer", sourceName:"税费归一化", sourceType:"fixture", evidenceType:"tax_fee_normalization", evidenceStatus:statusOf(normalizer) === "ready" || statusOf(obj(pipeline.priceSourceNormalizationSummary)) === "ready" ? "pass" : "needs_review", trustLabel:"medium", traceSummary:"候选价经过税费和展示字段归一化。", caveat:"归一化不代表真实最终价。" },
      { evidenceId:"source_trust_1", candidateId:"candidate_1", sourceId:"source_trust", sourceName:"来源可信度", sourceType:"authorized", evidenceType:"source_trust", evidenceStatus:statusOf(trust) === "ready" ? "pass" : "needs_review", trustLabel:text(obj(obj(trust.trustScores || [])[0]).trustLabel || "needs_review"), traceSummary:"来源可信度基于脱敏来源结构和证据完整性。", caveat:"可信度不代表官方背书。" },
      { evidenceId:"covered_lowest_1", candidateId:"candidate_1", sourceId:"covered_lowest", sourceName:"已覆盖来源较低候选价", sourceType:"fixture", evidenceType:"covered_lowest", evidenceStatus:statusOf(obj(pipeline.coveredLowestCandidateBoardSummary)) === "ready" ? "pass" : "needs_review", trustLabel:"medium", traceSummary:"在已覆盖来源范围内比较较低候选价。", caveat:"低价不等于最佳，也不代表全网最低。" },
      { evidenceId:"handoff_preview_1", candidateId:"candidate_1", sourceId:"handoff_preview", sourceName:"跳转预览", sourceType:"fixture", evidenceType:"handoff_preview", evidenceStatus:hasHandoff || statusOf(resultBoard) === "ready" ? "pass" : "needs_review", trustLabel:"low", traceSummary:"保留前往平台查看前的只读预览步骤。", caveat:"只展示跳转预览，不打开外部平台。" }
    ].map(function (item) {
      return Object.assign(item, { redacted:true });
    });
  }
  function buildGlobalShoppingProviderEvidenceTraceTimeline(input) {
    const safe = obj(input);
    const evidenceItems = Array.isArray(safe.evidenceItems) ? toArray(safe.evidenceItems) : (Array.isArray(safe.candidateEvidenceItems) ? toArray(safe.candidateEvidenceItems) : defaultEvidenceItems(safe));
    return clone(evidenceItems.map(function (item) {
      return {
        stepId:text(item.evidenceId || item.sourceId || "trace_row"),
        label:text((item.sourceName || "证据项") + " / " + (item.evidenceType || "trace_row")),
        status:item.evidenceStatus === "pass" ? "pass" : (item.evidenceStatus === "blocked" ? "blocked" : "warning"),
        sourceType:text(item.sourceType || "evidence_trace"),
        evidenceType:text(item.evidenceType || "trace_row"),
        summary:text(item.traceSummary || "当前证据链仅展示脱敏来源摘要。"),
        caveat:"当前证据链只展示脱敏 sandbox 来源摘要，不包含 raw response、真实 URL、密钥、身份、付款或订单数据。"
      };
    }));
  }
  function evaluateGlobalShoppingProviderEvidenceTrace(input) {
    const safe = obj(input);
    const traceBoundary = {
      traceId:text(safe.traceId || "provider_evidence_trace_v2_2_1"),
      traceMode:allowedMode(safe.traceMode || obj(obj(safe.sandboxSessionReplayCenter).replayBoundary).replayMode || "summary_only"),
      readOnly:true,
      redactedOnly:true,
      fixtureOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      canContainRawRequest:false,
      canContainRawResponse:false,
      canContainRealUrl:false,
      canContainCredentialValue:false,
      canContainUserIdentity:false,
      canContainPaymentData:false,
      canContainOrderData:false,
      canPersistTrace:false,
      canExportTrace:false,
      canUploadTrace:false,
      canCallNetwork:false,
      canOpenExternalNow:false
    };
    const evidenceItems = Array.isArray(safe.candidateEvidenceItems) ? toArray(safe.candidateEvidenceItems).map(function (item) {
      return Object.assign({}, item, { redacted:true });
    }) : defaultEvidenceItems(safe);
    const traceHealth = {
      hasEvidenceItems:evidenceItems.length > 0,
      hasOfficialAnchorTrace:evidenceItems.some(function (item) { return item.evidenceType === "official_anchor"; }),
      hasProviderCandidateTrace:evidenceItems.some(function (item) { return item.evidenceType === "provider_candidate"; }),
      hasTaxFeeNormalizationTrace:evidenceItems.some(function (item) { return item.evidenceType === "tax_fee_normalization"; }),
      hasSourceTrustTrace:evidenceItems.some(function (item) { return item.evidenceType === "source_trust"; }),
      hasCoveredLowestTrace:evidenceItems.some(function (item) { return item.evidenceType === "covered_lowest"; }),
      hasHandoffPreviewTrace:evidenceItems.some(function (item) { return item.evidenceType === "handoff_preview"; }),
      noRawRequest:safe.rawRequestStored !== true && safe.rawRequestIncluded !== true,
      noRawResponse:safe.rawResponseStored !== true && safe.rawResponseIncluded !== true,
      noRealUrl:safe.realUrlIncluded !== true && typeof safe.bookingUrl !== "string" && typeof safe.checkoutUrl !== "string" && typeof safe.paymentUrl !== "string" && typeof safe.orderUrl !== "string",
      noCredentialValue:safe.hasRealApiKey !== true && safe.apiKeyIncluded !== true,
      noUserIdentity:safe.userIdentityIncluded !== true && safe.identityUpload !== true,
      noPaymentData:safe.paymentDataIncluded !== true && safe.payment !== true,
      noOrderData:safe.orderDataIncluded !== true && safe.order !== true,
      noPersistence:safe.persistTrace !== true && safe.fileWrite !== true,
      noExport:safe.exportTrace !== true && safe.download !== true,
      noUpload:safe.uploadTrace !== true && safe.upload !== true,
      noNetwork:safe.networkEnabled !== true && safe.canCallNetwork !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true
    };
    const blockedReasons = [];
    if (!traceHealth.noRawRequest) blockedReasons.push("raw_request_detected");
    if (!traceHealth.noRawResponse) blockedReasons.push("raw_response_detected");
    if (!traceHealth.noRealUrl) blockedReasons.push("real_url_detected");
    if (!traceHealth.noCredentialValue) blockedReasons.push("api_key_detected");
    if (!traceHealth.noUserIdentity) blockedReasons.push("user_identity_detected");
    if (!traceHealth.noPaymentData) blockedReasons.push("payment_data_detected");
    if (!traceHealth.noOrderData) blockedReasons.push("order_data_detected");
    if (!traceHealth.noPersistence) blockedReasons.push("trace_persistence_detected");
    if (!traceHealth.noExport) blockedReasons.push("trace_export_detected");
    if (!traceHealth.noUpload) blockedReasons.push("trace_upload_detected");
    if (!traceHealth.noNetwork) blockedReasons.push("network_detected");
    if (!traceHealth.noExternalOpen) blockedReasons.push("external_open_detected");
    const needsReview = !traceHealth.hasEvidenceItems || !traceHealth.hasOfficialAnchorTrace || !traceHealth.hasProviderCandidateTrace || !traceHealth.hasTaxFeeNormalizationTrace || !traceHealth.hasSourceTrustTrace || !traceHealth.hasCoveredLowestTrace || !traceHealth.hasHandoffPreviewTrace;
    return clone({
      traceName:TRACE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE_VERSION,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      traceBoundary:traceBoundary,
      evidenceItems:evidenceItems,
      traceHealth:traceHealth,
      timeline:buildGlobalShoppingProviderEvidenceTraceTimeline({ candidateEvidenceItems:evidenceItems }),
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingProviderEvidenceTraceRows(input) {
    const evaluated = evaluateGlobalShoppingProviderEvidenceTrace(input || {});
    return clone(evaluated.evidenceItems.map(function (item) {
      return row(item.evidenceId, item.sourceName + " / " + item.evidenceType, item.traceSummary + " / " + item.trustLabel, item.evidenceStatus === "pass" ? "pass" : (item.evidenceStatus === "blocked" ? "blocked" : "warning"));
    }));
  }
  function sanitizeGlobalShoppingProviderEvidenceTrace(trace) {
    const safe = obj(trace);
    const evaluated = evaluateGlobalShoppingProviderEvidenceTrace(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status;
    return clone({
      traceName:TRACE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE_VERSION,
      status:status,
      traceBoundary:clone(evaluated.traceBoundary),
      evidenceItems:clone(evaluated.evidenceItems),
      traceHealth:clone(evaluated.traceHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderEvidenceTraceRows(safe),
      timeline:toArray(safe.timeline).length ? toArray(safe.timeline) : evaluated.timeline,
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluated.blockedReasons,
      userFacingSummary:{
        title:"Provider 证据链追踪",
        resultLabel:status === "ready" ? "Provider 证据链已准备" : (status === "needs_review" ? "Provider 证据链仍需复核" : "Provider 证据链已阻断"),
        caveat:"当前证据链只展示脱敏 sandbox 来源摘要，不包含 raw response、真实 URL、密钥、身份、付款或订单数据。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderEvidenceTrace(input) {
    try {
      return sanitizeGlobalShoppingProviderEvidenceTrace(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderEvidenceTrace({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingProviderEvidenceTraceAuditDraft(input) {
    const trace = buildGlobalShoppingProviderEvidenceTrace(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE_AUDIT_DRAFT",
      traceName:TRACE_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE_VERSION,
      status:trace.status,
      blockedReasons:trace.blockedReasons,
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
      sensitiveStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderEvidenceTrace = {
    GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE_VERSION,
    TRACE_NAME,
    buildGlobalShoppingProviderEvidenceTrace,
    evaluateGlobalShoppingProviderEvidenceTrace,
    buildGlobalShoppingProviderEvidenceTraceRows,
    buildGlobalShoppingProviderEvidenceTraceTimeline,
    buildGlobalShoppingProviderEvidenceTraceAuditDraft,
    sanitizeGlobalShoppingProviderEvidenceTrace
  };
})();