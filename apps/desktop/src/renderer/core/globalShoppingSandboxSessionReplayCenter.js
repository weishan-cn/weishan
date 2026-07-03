;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER_VERSION = "4.1.6";
  const CENTER_NAME = "global_shopping_sandbox_session_replay_center_v1";

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
  function safeBool(value, fallback) { return value === true ? true : (value === false ? false : fallback); }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
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
  function buildGlobalShoppingSandboxSessionReplayTimeline(input) {
    const safe = obj(input);
    const steps = [
      { stepId:"sandbox_session", label:"Sandbox 价格候选会话", sourceType:"sandbox_session", evidenceType:"session_summary", summary:obj(obj(safe.sandboxPriceCandidateSession).userFacingSummary).resultLabel || "Sandbox 价格候选会话仍需复核", caveat:"只回放脱敏会话摘要，不回放 raw request/raw response。", ready:statusOf(safe.sandboxPriceCandidateSession) === "ready" },
      { stepId:"result_board", label:"Sandbox 价格候选结果", sourceType:"result_board", evidenceType:"result_board", summary:obj(safe.sandboxPriceCandidateResultBoard).title || "Sandbox 价格候选结果", caveat:obj(safe.sandboxPriceCandidateResultBoard).caveat || "不代表真实平台查询。", ready:statusOf(safe.sandboxPriceCandidateResultBoard) === "ready" },
      { stepId:"provider_connector", label:"Provider Connector", sourceType:"connector", evidenceType:"provider_candidate", summary:obj(obj(safe.firstSandboxProviderConnector).userFacingSummary).resultLabel || "Sandbox Connector 仍需复核", caveat:"来源结构只基于本地 fixture/dry-run/sandbox。", ready:statusOf(safe.firstSandboxProviderConnector) === "ready" },
      { stepId:"coverage", label:"Provider 覆盖", sourceType:"coverage", evidenceType:"coverage_summary", summary:obj(obj(safe.providerCoverageDashboard).userFacingSummary).resultLabel || "Provider 覆盖仍需复核", caveat:"覆盖来源不代表全网覆盖。", ready:statusOf(safe.providerCoverageDashboard) === "ready" },
      { stepId:"source_trust", label:"来源可信度", sourceType:"trust", evidenceType:"source_trust", summary:obj(obj(safe.readOnlySourceTrustScore).userFacingSummary).resultLabel || "来源可信度仍需复核", caveat:"可信度不代表官方背书。", ready:statusOf(safe.readOnlySourceTrustScore) === "ready" },
      { stepId:"price_pipeline", label:"只读价格流水线", sourceType:"pipeline", evidenceType:"normalization_pipeline", summary:obj(obj(safe.pricePipelineOrchestrator).userFacingSummary).resultLabel || "只读价格流水线仍需复核", caveat:"候选价只经历只读归一化步骤。", ready:statusOf(safe.pricePipelineOrchestrator) === "ready" },
      { stepId:"covered_lowest", label:"已覆盖来源较低候选价", sourceType:"normalization", evidenceType:"covered_lowest", summary:obj(obj(safe.coveredLowestCandidateBoard).userFacingSummary).resultLabel || "已覆盖来源较低候选价仍需复核", caveat:"低价不等于最佳。", ready:statusOf(safe.coveredLowestCandidateBoard) === "ready" },
      { stepId:"handoff_preview", label:"跳转预览", sourceType:"handoff", evidenceType:"handoff_preview", summary:obj(obj(safe.sandboxHandoffPreview).userFacingSummary).resultLabel || "跳转预览仍需复核", caveat:"回放不打开外部平台。", ready:statusOf(safe.sandboxHandoffPreview) === "ready" }
    ];
    return clone(steps.map(function (step) {
      return {
        stepId:step.stepId,
        label:step.label,
        status:step.ready ? "pass" : "warning",
        sourceType:step.sourceType,
        evidenceType:step.evidenceType,
        summary:text(step.summary),
        caveat:text(step.caveat)
      };
    }));
  }
  function evaluateGlobalShoppingSandboxSessionReplay(input) {
    const safe = obj(input);
    const session = obj(safe.sandboxPriceCandidateSession);
    const resultBoard = obj(safe.sandboxPriceCandidateResultBoard);
    const connector = obj(safe.firstSandboxProviderConnector);
    const coverage = obj(safe.providerCoverageDashboard);
    const trust = obj(safe.readOnlySourceTrustScore);
    const pipeline = obj(safe.pricePipelineOrchestrator);
    const coveredLowest = obj(safe.coveredLowestCandidateBoard);
    const handoff = obj(safe.sandboxHandoffPreview);
    const replayBoundary = {
      replayId:text(safe.replayId || "sandbox_replay_v2_2_1"),
      replayMode:allowedMode(safe.replayMode || "summary_only"),
      readOnly:true,
      summaryOnly:true,
      fixtureOnly:true,
      sandboxOnly:true,
      productionDisabled:true,
      canReplayRawRequest:false,
      canReplayRawResponse:false,
      canPersistReplay:false,
      canExportReplay:false,
      canUploadReplay:false,
      canCallNetwork:false,
      canOpenExternalNow:false,
      canGenerateBookingUrl:false,
      canGenerateCheckoutUrl:false,
      canGeneratePaymentUrl:false,
      canGenerateOrderUrl:false,
      canCheckout:false,
      canPay:false,
      canTicket:false
    };
    const timeline = buildGlobalShoppingSandboxSessionReplayTimeline({
      sandboxPriceCandidateSession:session,
      sandboxPriceCandidateResultBoard:resultBoard,
      firstSandboxProviderConnector:connector,
      providerCoverageDashboard:coverage,
      readOnlySourceTrustScore:trust,
      pricePipelineOrchestrator:pipeline,
      coveredLowestCandidateBoard:coveredLowest,
      sandboxHandoffPreview:handoff
    });
    const replaySummary = {
      hasSandboxSession:Object.keys(session).length > 0,
      hasResultBoard:Object.keys(resultBoard).length > 0,
      hasProviderConnector:Object.keys(connector).length > 0,
      hasCoverageDashboard:Object.keys(coverage).length > 0,
      hasSourceTrustScore:Object.keys(trust).length > 0,
      hasPricePipeline:Object.keys(pipeline).length > 0,
      hasCoveredLowestCandidate:Object.keys(coveredLowest).length > 0,
      hasHandoffPreview:Object.keys(handoff).length > 0,
      replayStepCount:timeline.length,
      providerStepCount:timeline.filter(function (item) { return /connector|coverage/.test(item.sourceType); }).length,
      normalizationStepCount:timeline.filter(function (item) { return /pipeline|normalization/.test(item.sourceType); }).length,
      trustStepCount:timeline.filter(function (item) { return item.sourceType === "trust"; }).length,
      handoffStepCount:timeline.filter(function (item) { return item.sourceType === "handoff"; }).length
    };
    const replayHealth = {
      noRawRequestReplay:safeBool(safe.noRawRequestReplay, safe.rawRequestReplay !== true && safe.canReplayRawRequest !== true),
      noRawResponseReplay:safeBool(safe.noRawResponseReplay, safe.rawResponseReplay !== true && safe.canReplayRawResponse !== true),
      noPersistence:safeBool(safe.noPersistence, safe.persistReplay !== true && safe.fileWrite !== true),
      noExport:safeBool(safe.noExport, safe.exportReplay !== true && safe.download !== true),
      noUpload:safeBool(safe.noUpload, safe.uploadReplay !== true && safe.upload !== true),
      noNetwork:safeBool(safe.noNetwork, safe.networkEnabled !== true && safe.canCallNetwork !== true),
      noExternalOpen:safeBool(safe.noExternalOpen, safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true),
      noTransactionUrl:safeBool(safe.noTransactionUrl, typeof safe.bookingUrl !== "string" && typeof safe.checkoutUrl !== "string" && typeof safe.paymentUrl !== "string" && typeof safe.orderUrl !== "string"),
      noCheckout:safeBool(safe.noCheckout, safe.checkout !== true && safe.canCheckout !== true),
      noPayment:safeBool(safe.noPayment, safe.payment !== true && safe.canPay !== true),
      noTicketing:safeBool(safe.noTicketing, safe.ticketing !== true && safe.canTicket !== true)
    };
    const blockedReasons = [];
    if (!replayHealth.noRawRequestReplay) blockedReasons.push("raw_request_replay_detected");
    if (!replayHealth.noRawResponseReplay) blockedReasons.push("raw_response_replay_detected");
    if (!replayHealth.noPersistence) blockedReasons.push("replay_persistence_detected");
    if (!replayHealth.noExport) blockedReasons.push("replay_export_detected");
    if (!replayHealth.noUpload) blockedReasons.push("replay_upload_detected");
    if (!replayHealth.noNetwork) blockedReasons.push("network_detected");
    if (!replayHealth.noExternalOpen) blockedReasons.push("external_open_detected");
    if (!replayHealth.noTransactionUrl) blockedReasons.push("transaction_url_detected");
    if (!replayHealth.noCheckout) blockedReasons.push("checkout_detected");
    if (!replayHealth.noPayment) blockedReasons.push("payment_detected");
    if (!replayHealth.noTicketing) blockedReasons.push("ticketing_detected");
    const needsReview = !replaySummary.hasSandboxSession || !replaySummary.hasResultBoard || !replaySummary.hasProviderConnector || !replaySummary.hasCoverageDashboard || !replaySummary.hasSourceTrustScore || !replaySummary.hasPricePipeline;
    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER_VERSION,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      replayBoundary:replayBoundary,
      replaySummary:replaySummary,
      replayTimeline:timeline,
      replayHealth:replayHealth,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxSessionReplayRows(input) {
    const evaluated = evaluateGlobalShoppingSandboxSessionReplay(input || {});
    const summary = evaluated.replaySummary;
    const health = evaluated.replayHealth;
    return clone([
      row("sandbox_session", "Sandbox 会话", summary.hasSandboxSession ? "已接入" : "仍需复核", summary.hasSandboxSession ? "pass" : "warning"),
      row("result_board", "候选结果板", summary.hasResultBoard ? "已接入" : "仍需复核", summary.hasResultBoard ? "pass" : "warning"),
      row("provider_chain", "Connector / 覆盖 / 可信度", summary.hasProviderConnector && summary.hasCoverageDashboard && summary.hasSourceTrustScore ? "已接入" : "仍需复核", summary.hasProviderConnector && summary.hasCoverageDashboard && summary.hasSourceTrustScore ? "pass" : "warning"),
      row("pipeline_chain", "价格流水线 / 覆盖较低价 / 跳转预览", summary.hasPricePipeline && summary.hasCoveredLowestCandidate && summary.hasHandoffPreview ? "已接入" : "仍需复核", summary.hasPricePipeline && summary.hasCoveredLowestCandidate && summary.hasHandoffPreview ? "pass" : "warning"),
      row("timeline", "回放步骤", String(summary.replayStepCount), "pass"),
      row("safety", "回放边界", health.noRawRequestReplay && health.noRawResponseReplay && health.noPersistence && health.noExport && health.noUpload && health.noNetwork && health.noExternalOpen && health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "只读边界满足" : "已阻断", health.noRawRequestReplay && health.noRawResponseReplay && health.noPersistence && health.noExport && health.noUpload && health.noNetwork && health.noExternalOpen && health.noTransactionUrl && health.noCheckout && health.noPayment && health.noTicketing ? "pass" : "blocked")
    ]);
  }
  function sanitizeGlobalShoppingSandboxSessionReplayCenter(center) {
    const safe = obj(center);
    const evaluated = evaluateGlobalShoppingSandboxSessionReplay(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status;
    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER_VERSION,
      status:status,
      replayBoundary:clone(evaluated.replayBoundary),
      replaySummary:clone(evaluated.replaySummary),
      replayTimeline:toArray(safe.replayTimeline).length ? toArray(safe.replayTimeline) : evaluated.replayTimeline,
      replayHealth:clone(evaluated.replayHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingSandboxSessionReplayRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluated.blockedReasons,
      userFacingSummary:{
        title:"Sandbox 会话回放中心",
        resultLabel:status === "ready" ? "Sandbox 会话回放已准备" : (status === "needs_review" ? "Sandbox 会话回放仍需复核" : "Sandbox 会话回放已阻断"),
        caveat:"当前只回放脱敏 sandbox 会话摘要，不回放 raw request/raw response，不联网，不打开平台，不代表真实平台查询。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxSessionReplayCenter(input) {
    try {
      return sanitizeGlobalShoppingSandboxSessionReplayCenter(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxSessionReplayCenter({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingSandboxSessionReplayCenterAuditDraft(input) {
    const center = buildGlobalShoppingSandboxSessionReplayCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER_VERSION,
      status:center.status,
      blockedReasons:center.blockedReasons,
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

  window.WeishanGlobalShoppingSandboxSessionReplayCenter = {
    GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingSandboxSessionReplayCenter,
    evaluateGlobalShoppingSandboxSessionReplay,
    buildGlobalShoppingSandboxSessionReplayRows,
    buildGlobalShoppingSandboxSessionReplayTimeline,
    buildGlobalShoppingSandboxSessionReplayCenterAuditDraft,
    sanitizeGlobalShoppingSandboxSessionReplayCenter
  };
})();