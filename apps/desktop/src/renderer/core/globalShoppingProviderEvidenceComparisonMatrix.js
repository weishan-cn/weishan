;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_EVIDENCE_COMPARISON_MATRIX_VERSION = "4.2.3";
  const MATRIX_NAME = "global_shopping_provider_evidence_comparison_matrix_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function allowedMode(value) {
    const mode = text(value || "disabled");
    return /^(disabled|summary_only|dry_run|sandbox_ready)$/.test(mode) ? mode : "disabled";
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
  function buildGlobalShoppingProviderEvidenceComparisonColumns() {
    return clone([
      { columnId:"official_anchor", label:"官方参考价证据", evidenceType:"official_anchor" },
      { columnId:"provider_candidate", label:"provider candidate 证据", evidenceType:"provider_candidate" },
      { columnId:"tax_fee_normalization", label:"税费归一化证据", evidenceType:"tax_fee_normalization" },
      { columnId:"source_trust", label:"source trust 证据", evidenceType:"source_trust" },
      { columnId:"covered_lowest", label:"covered lowest 证据", evidenceType:"covered_lowest" },
      { columnId:"handoff_preview", label:"handoff preview 证据", evidenceType:"handoff_preview" },
      { columnId:"safety_disclosure", label:"safety disclosure 证据", evidenceType:"safety_disclosure" }
    ]);
  }
  function evidenceText(trace, candidateId, evidenceType, fallback) {
    const item = toArray(obj(trace).evidenceItems).find(function (entry) {
      return text(entry.candidateId) === text(candidateId) && text(entry.evidenceType) === text(evidenceType);
    });
    return text(item && (item.traceSummary || item.caveat) || fallback || "需复核");
  }
  function buildGlobalShoppingProviderEvidenceComparisonRows(input) {
    const safe = obj(input);
    const trace = obj(safe.providerEvidenceTrace);
    const candidates = toArray(obj(safe.sandboxCandidateComparisonWorkbench).candidateRows || safe.candidateRows);
    return clone(candidates.map(function (candidate) {
      return {
        rowId:text(candidate.candidateId || "candidate"),
        candidateId:text(candidate.candidateId || "candidate"),
        sourceName:text(candidate.sourceName || "候选来源"),
        sourceType:text(candidate.sourceType || "fixture"),
        officialAnchorEvidence:evidenceText(trace, candidate.candidateId, "official_anchor", "官方参考价证据仍需复核"),
        providerCandidateEvidence:evidenceText(trace, candidate.candidateId, "provider_candidate", "provider candidate 证据仍需复核"),
        taxFeeNormalizationEvidence:evidenceText(trace, candidate.candidateId, "tax_fee_normalization", "税费归一化证据仍需复核"),
        sourceTrustEvidence:evidenceText(trace, candidate.candidateId, "source_trust", "source trust 证据仍需复核"),
        coveredLowestEvidence:evidenceText(trace, candidate.candidateId, "covered_lowest", "covered lowest 证据仍需复核"),
        handoffPreviewEvidence:evidenceText(trace, candidate.candidateId, "handoff_preview", "handoff preview 证据仍需复核"),
        safetyDisclosureEvidence:"当前矩阵只展示脱敏 sandbox 证据摘要。",
        completenessLabel:text(candidate.evidenceCompletenessLabel || "需复核"),
        caveat:"当前矩阵只展示脱敏 sandbox 证据摘要，不包含 raw response、真实 URL、密钥、身份、付款或订单数据。",
        redacted:true
      };
    }));
  }
  function evaluateGlobalShoppingProviderEvidenceComparisonMatrix(input) {
    const safe = obj(input);
    const columns = buildGlobalShoppingProviderEvidenceComparisonColumns(safe);
    const rows = buildGlobalShoppingProviderEvidenceComparisonRows(safe);
    const blockedReasons = [];
    if (safe.rawRequestStored === true || safe.rawRequestIncluded === true) blockedReasons.push("raw_request_detected");
    if (safe.rawResponseStored === true || safe.rawResponseIncluded === true) blockedReasons.push("raw_response_detected");
    if (typeof safe.bookingUrl === "string" || typeof safe.checkoutUrl === "string" || typeof safe.paymentUrl === "string" || typeof safe.orderUrl === "string" || safe.realUrlIncluded === true) blockedReasons.push("real_url_detected");
    if (safe.hasRealApiKey === true || safe.apiKeyIncluded === true) blockedReasons.push("api_key_detected");
    if (safe.userIdentityIncluded === true || safe.identityUpload === true || safe.paymentDataIncluded === true || safe.orderDataIncluded === true || safe.payment === true || safe.order === true) blockedReasons.push("user_or_transaction_data_detected");
    if (safe.exportTrace === true || safe.download === true || safe.canExportMatrix === true || safe.canDownloadMatrix === true) blockedReasons.push("export_download_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true) blockedReasons.push("external_open_detected");
    const matrixHealth = {
      hasEvidenceTrace:Object.keys(obj(safe.providerEvidenceTrace)).length > 0,
      hasCandidates:toArray(obj(safe.sandboxCandidateComparisonWorkbench).candidateRows || safe.candidateRows).length > 0,
      hasMatrixColumns:columns.length > 0,
      hasMatrixRows:rows.length > 0,
      hasOfficialAnchorColumn:columns.some(function (item) { return item.columnId === "official_anchor"; }),
      hasSourceTrustColumn:columns.some(function (item) { return item.columnId === "source_trust"; }),
      hasSafetyDisclosureColumn:columns.some(function (item) { return item.columnId === "safety_disclosure"; }),
      noRawRequest:safe.rawRequestStored !== true && safe.rawRequestIncluded !== true,
      noRawResponse:safe.rawResponseStored !== true && safe.rawResponseIncluded !== true,
      noRealUrl:typeof safe.bookingUrl !== "string" && typeof safe.checkoutUrl !== "string" && typeof safe.paymentUrl !== "string" && typeof safe.orderUrl !== "string" && safe.realUrlIncluded !== true,
      noApiKey:safe.hasRealApiKey !== true && safe.apiKeyIncluded !== true,
      noUserIdentity:safe.userIdentityIncluded !== true && safe.identityUpload !== true,
      noPaymentOrderData:safe.paymentDataIncluded !== true && safe.orderDataIncluded !== true && safe.payment !== true && safe.order !== true,
      noExportDownload:safe.exportTrace !== true && safe.download !== true && safe.canExportMatrix !== true && safe.canDownloadMatrix !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true
    };
    const needsReview = !matrixHealth.hasEvidenceTrace || !matrixHealth.hasCandidates || !matrixHealth.hasMatrixColumns || !matrixHealth.hasMatrixRows;
    return clone({
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_EVIDENCE_COMPARISON_MATRIX_VERSION,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      matrixBoundary:{
        matrixId:text(safe.matrixId || "provider_evidence_matrix_v2_2_2"),
        matrixMode:allowedMode(safe.matrixMode || "summary_only"),
        readOnly:true,
        redactedOnly:true,
        sandboxOnly:true,
        fixtureOnly:true,
        productionDisabled:true,
        canContainRawRequest:false,
        canContainRawResponse:false,
        canContainRealUrl:false,
        canContainApiKey:false,
        canContainUserIdentity:false,
        canContainPaymentData:false,
        canContainOrderData:false,
        canExportMatrix:false,
        canDownloadMatrix:false,
        canOpenExternalNow:false
      },
      matrixColumns:columns,
      matrixRows:rows,
      matrixHealth:matrixHealth,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function sanitizeGlobalShoppingProviderEvidenceComparisonMatrix(matrix) {
    const safe = obj(matrix);
    const evaluated = evaluateGlobalShoppingProviderEvidenceComparisonMatrix(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status;
    return clone({
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_EVIDENCE_COMPARISON_MATRIX_VERSION,
      status:status,
      matrixBoundary:clone(evaluated.matrixBoundary),
      matrixColumns:clone(evaluated.matrixColumns),
      matrixRows:clone(evaluated.matrixRows),
      matrixHealth:clone(evaluated.matrixHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : evaluated.matrixRows,
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:{
        title:"Provider 证据对比矩阵",
        resultLabel:status === "ready" ? "证据矩阵已准备" : (status === "needs_review" ? "证据矩阵仍需复核" : "证据矩阵已阻断"),
        caveat:"当前矩阵只展示脱敏 sandbox 证据摘要，不包含 raw response、真实 URL、密钥、身份、付款或订单数据。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingProviderEvidenceComparisonMatrix(input) {
    try {
      return sanitizeGlobalShoppingProviderEvidenceComparisonMatrix(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderEvidenceComparisonMatrix({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingProviderEvidenceComparisonMatrixAuditDraft(input) {
    const matrix = buildGlobalShoppingProviderEvidenceComparisonMatrix(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_EVIDENCE_COMPARISON_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_EVIDENCE_COMPARISON_MATRIX_VERSION,
      status:matrix.status,
      blockedReasons:matrix.blockedReasons,
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

  window.WeishanGlobalShoppingProviderEvidenceComparisonMatrix = {
    GLOBAL_SHOPPING_PROVIDER_EVIDENCE_COMPARISON_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingProviderEvidenceComparisonMatrix,
    evaluateGlobalShoppingProviderEvidenceComparisonMatrix,
    buildGlobalShoppingProviderEvidenceComparisonRows,
    buildGlobalShoppingProviderEvidenceComparisonColumns,
    buildGlobalShoppingProviderEvidenceComparisonMatrixAuditDraft,
    sanitizeGlobalShoppingProviderEvidenceComparisonMatrix
  };
})();
