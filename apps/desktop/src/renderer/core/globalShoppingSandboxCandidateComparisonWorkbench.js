;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SANDBOX_CANDIDATE_COMPARISON_WORKBENCH_VERSION = "2.2.6";
  const WORKBENCH_NAME = "global_shopping_sandbox_candidate_comparison_workbench_v1";

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
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function sourceTrustLabel(sourceTrust, sourceId) {
    const scores = toArray(obj(sourceTrust).trustScores);
    const match = scores.find(function (item) { return text(item.sourceId || item.providerId) === text(sourceId); }) || scores[0] || {};
    return text(match.trustLabel || "needs_review");
  }
  function confidenceFor(explainer, candidateId) {
    const items = toArray(obj(explainer).confidenceExplanations);
    return items.find(function (item) { return text(item.candidateId) === text(candidateId); }) || {};
  }
  function evidenceFor(trace, candidateId, evidenceType) {
    return toArray(obj(trace).evidenceItems).find(function (item) {
      return text(item.candidateId) === text(candidateId) && text(item.evidenceType) === text(evidenceType);
    }) || {};
  }
  function buildCandidates(input) {
    const safe = obj(input);
    const resultBoard = obj(safe.sandboxPriceCandidateResultBoard);
    const normalizedBoard = obj(safe.normalizedPriceCandidateBoard);
    const candidates = []
      .concat(toArray(resultBoard.candidateItems || resultBoard.candidates))
      .concat(toArray(normalizedBoard.candidateItems || normalizedBoard.normalizedCandidates))
      .filter(Boolean);
    const deduped = [];
    candidates.forEach(function (item, index) {
      const candidate = obj(item);
      const candidateId = text(candidate.candidateId || candidate.quoteId || ("candidate_" + (index + 1)));
      if (deduped.some(function (entry) { return entry.candidateId === candidateId; })) return;
      deduped.push({
        candidateId:candidateId,
        sourceName:text(candidate.sourceName || candidate.providerName || "候选来源"),
        sourceType:text(candidate.sourceType || candidate.providerType || "fixture"),
        normalizedPriceLabel:text(candidate.normalizedPriceLabel || candidate.priceLabel || (candidate.totalPrice == null ? "待补充" : ("¥" + candidate.totalPrice))),
        taxesAndFeesComplete:candidate.taxesAndFees != null || candidate.taxFeeComplete === true,
        officialAnchorStatus:candidate.officialAnchorStatus,
        coveredLowestStatus:candidate.coveredLowestStatus,
        handoffReadinessStatus:candidate.handoffReadinessStatus,
        redacted:true
      });
    });
    return deduped;
  }
  function buildGlobalShoppingSandboxCandidateComparisonRows(input) {
    const safe = obj(input);
    const sourceTrust = obj(safe.readOnlySourceTrustScore);
    const trace = obj(safe.providerEvidenceTrace);
    const explainer = obj(safe.candidateConfidenceExplainer);
    return clone(buildCandidates(safe).map(function (candidate) {
      const confidence = confidenceFor(explainer, candidate.candidateId);
      const officialEvidence = evidenceFor(trace, candidate.candidateId, "official_anchor");
      const coveredLowestEvidence = evidenceFor(trace, candidate.candidateId, "covered_lowest");
      const handoffEvidence = evidenceFor(trace, candidate.candidateId, "handoff_preview");
      const trustLabel = sourceTrustLabel(sourceTrust, candidate.sourceName);
      const confidenceLabel = text(confidence.confidenceLabel || "needs_review");
      const evidenceCompletenessLabel = officialEvidence.evidenceStatus === "pass" ? "完整" : "需补充";
      const feeCompletenessLabel = candidate.taxesAndFeesComplete ? "完整" : "需补充";
      const officialAnchorStatus = text(candidate.officialAnchorStatus || officialEvidence.evidenceStatus || "needs_review");
      const coveredLowestStatus = text(candidate.coveredLowestStatus || coveredLowestEvidence.evidenceStatus || "needs_review");
      const handoffReadinessStatus = text(candidate.handoffReadinessStatus || handoffEvidence.evidenceStatus || "needs_review");
      const recommendationLabel = confidenceLabel === "high" && officialAnchorStatus === "pass" ? "review_first" : (confidenceLabel === "medium" ? "compare_with_official" : "needs_review");
      return {
        candidateId:candidate.candidateId,
        sourceName:candidate.sourceName,
        sourceType:candidate.sourceType,
        normalizedPriceLabel:candidate.normalizedPriceLabel,
        trustLabel:trustLabel,
        confidenceLabel:confidenceLabel,
        evidenceCompletenessLabel:evidenceCompletenessLabel,
        feeCompletenessLabel:feeCompletenessLabel,
        officialAnchorStatus:officialAnchorStatus === "pass" ? "official_anchor_ready" : "needs_review",
        coveredLowestStatus:coveredLowestStatus === "pass" ? "covered_lowest_ready" : "needs_review",
        handoffReadinessStatus:handoffReadinessStatus === "pass" ? "handoff_ready" : "needs_review",
        recommendationLabel:recommendationLabel,
        caveat:"该候选只表示当前 sandbox 证据下优先复核顺序，不代表最低价保证或交易能力。",
        redacted:true
      };
    }));
  }
  function buildGlobalShoppingSandboxCandidateRecommendationSummary(input) {
    const rows = buildGlobalShoppingSandboxCandidateComparisonRows(input);
    const preferred = rows.find(function (item) { return item.recommendationLabel === "review_first"; }) || rows.find(function (item) { return item.recommendationLabel === "compare_with_official"; }) || rows[0] || {};
    return clone({
      recommendedCandidateId:text(preferred.candidateId || ""),
      recommendationLabel:text(preferred.recommendationLabel || (rows.length ? "needs_review" : "blocked")),
      reason:text(preferred.sourceName ? (preferred.sourceName + " 在当前 sandbox 证据下更适合先复核。") : "仍需补充候选与证据。"),
      caveat:"该推荐只表示当前 sandbox 证据下优先复核的候选，不代表全网最低、最低价保证、锁价、可订、付款、下单或出票能力。"
    });
  }
  function evaluateGlobalShoppingSandboxCandidateComparison(input) {
    const safe = obj(input);
    const rows = buildGlobalShoppingSandboxCandidateComparisonRows(safe);
    const blockedReasons = [];
    if (safe.networkEnabled === true || safe.canCallNetwork === true) blockedReasons.push("network_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true) blockedReasons.push("external_open_detected");
    if (typeof safe.bookingUrl === "string" || typeof safe.checkoutUrl === "string" || typeof safe.paymentUrl === "string" || typeof safe.orderUrl === "string") blockedReasons.push("transaction_url_detected");
    if (safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true) blockedReasons.push("transaction_capability_detected");
    if (safe.claimsLowestPriceGuarantee === true || safe.claimsBestPriceGuarantee === true || safe.claimsLockedPrice === true || safe.claimsAvailability === true) blockedReasons.push("forbidden_claim_detected");
    const comparisonSummary = {
      candidateCount:rows.length,
      comparableCandidateCount:rows.length,
      highConfidenceCount:rows.filter(function (item) { return item.confidenceLabel === "high"; }).length,
      mediumConfidenceCount:rows.filter(function (item) { return item.confidenceLabel === "medium"; }).length,
      lowConfidenceCount:rows.filter(function (item) { return item.confidenceLabel === "low"; }).length,
      needsReviewCount:rows.filter(function (item) { return item.confidenceLabel === "needs_review"; }).length,
      hasOfficialAnchorCandidate:rows.some(function (item) { return item.officialAnchorStatus === "official_anchor_ready"; }),
      hasCoveredLowestCandidate:rows.some(function (item) { return item.coveredLowestStatus === "covered_lowest_ready"; }),
      hasTaxFeeCompleteCandidate:rows.some(function (item) { return item.feeCompletenessLabel === "完整"; }),
      hasHandoffReadyCandidate:rows.some(function (item) { return item.handoffReadinessStatus === "handoff_ready"; })
    };
    const health = {
      hasResultBoard:Object.keys(obj(safe.sandboxPriceCandidateResultBoard)).length > 0,
      hasEvidenceTrace:Object.keys(obj(safe.providerEvidenceTrace)).length > 0,
      hasConfidenceExplainer:Object.keys(obj(safe.candidateConfidenceExplainer)).length > 0,
      hasSourceTrustScore:Object.keys(obj(safe.readOnlySourceTrustScore)).length > 0,
      hasNormalizedCandidateBoard:Object.keys(obj(safe.normalizedPriceCandidateBoard)).length > 0,
      hasCandidates:rows.length > 0,
      noNetwork:safe.networkEnabled !== true && safe.canCallNetwork !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true,
      noTransactionUrl:typeof safe.bookingUrl !== "string" && typeof safe.checkoutUrl !== "string" && typeof safe.paymentUrl !== "string" && typeof safe.orderUrl !== "string",
      noCheckoutPaymentTicketing:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true,
      noForbiddenClaims:safe.claimsLowestPriceGuarantee !== true && safe.claimsBestPriceGuarantee !== true && safe.claimsLockedPrice !== true && safe.claimsAvailability !== true
    };
    const needsReview = !health.hasResultBoard || !health.hasEvidenceTrace || !health.hasConfidenceExplainer || !health.hasSourceTrustScore || !health.hasNormalizedCandidateBoard || !health.hasCandidates;
    return clone({
      workbenchName:WORKBENCH_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_CANDIDATE_COMPARISON_WORKBENCH_VERSION,
      status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "ready"),
      comparisonBoundary:{
        comparisonId:text(safe.comparisonId || "sandbox_candidate_comparison_v2_2_2"),
        comparisonMode:allowedMode(safe.comparisonMode || "summary_only"),
        readOnly:true,
        sandboxOnly:true,
        fixtureOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canCallNetwork:false,
        canOpenExternalNow:false,
        canGenerateBookingUrl:false,
        canGenerateCheckoutUrl:false,
        canGeneratePaymentUrl:false,
        canGenerateOrderUrl:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        doesNotClaimLowestPrice:true,
        doesNotClaimBestPrice:true,
        doesNotClaimLockedPrice:true,
        doesNotClaimAvailability:true
      },
      comparisonSummary:comparisonSummary,
      candidateRows:rows,
      recommendationSummary:buildGlobalShoppingSandboxCandidateRecommendationSummary(safe),
      health:health,
      blockedReasons:blockedReasons,
      redacted:true
    });
  }
  function sanitizeGlobalShoppingSandboxCandidateComparisonWorkbench(workbench) {
    const safe = obj(workbench);
    const evaluated = evaluateGlobalShoppingSandboxCandidateComparison(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status;
    return clone({
      workbenchName:WORKBENCH_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_CANDIDATE_COMPARISON_WORKBENCH_VERSION,
      status:status,
      comparisonBoundary:clone(evaluated.comparisonBoundary),
      comparisonSummary:clone(evaluated.comparisonSummary),
      candidateRows:clone(evaluated.candidateRows),
      recommendationSummary:clone(evaluated.recommendationSummary),
      health:clone(evaluated.health),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : [
        row("candidate_count", "候选数量", String(evaluated.comparisonSummary.candidateCount), evaluated.comparisonSummary.candidateCount ? "pass" : "warning"),
        row("official_anchor", "官方参考价锚点", evaluated.comparisonSummary.hasOfficialAnchorCandidate ? "已覆盖" : "需复核", evaluated.comparisonSummary.hasOfficialAnchorCandidate ? "pass" : "warning"),
        row("covered_lowest", "已覆盖来源较低候选", evaluated.comparisonSummary.hasCoveredLowestCandidate ? "已覆盖" : "需复核", evaluated.comparisonSummary.hasCoveredLowestCandidate ? "pass" : "warning"),
        row("handoff_ready", "交接演练准备度", evaluated.comparisonSummary.hasHandoffReadyCandidate ? "可演练" : "需复核", evaluated.comparisonSummary.hasHandoffReadyCandidate ? "pass" : "warning")
      ],
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:{
        title:"Sandbox 候选对比工作台",
        resultLabel:status === "ready" ? "候选对比已准备" : (status === "needs_review" ? "候选对比仍需复核" : "候选对比已阻断"),
        caveat:"当前仅比较脱敏 sandbox 候选，不代表真实价格、全网最低、锁价、可订、付款、下单或出票能力。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingSandboxCandidateComparisonWorkbench(input) {
    try {
      return sanitizeGlobalShoppingSandboxCandidateComparisonWorkbench(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingSandboxCandidateComparisonWorkbench({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingSandboxCandidateComparisonWorkbenchAuditDraft(input) {
    const workbench = buildGlobalShoppingSandboxCandidateComparisonWorkbench(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_SANDBOX_CANDIDATE_COMPARISON_WORKBENCH_AUDIT_DRAFT",
      workbenchName:WORKBENCH_NAME,
      appVersion:GLOBAL_SHOPPING_SANDBOX_CANDIDATE_COMPARISON_WORKBENCH_VERSION,
      status:workbench.status,
      blockedReasons:workbench.blockedReasons,
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

  window.WeishanGlobalShoppingSandboxCandidateComparisonWorkbench = {
    GLOBAL_SHOPPING_SANDBOX_CANDIDATE_COMPARISON_WORKBENCH_VERSION,
    WORKBENCH_NAME,
    buildGlobalShoppingSandboxCandidateComparisonWorkbench,
    evaluateGlobalShoppingSandboxCandidateComparison,
    buildGlobalShoppingSandboxCandidateComparisonRows,
    buildGlobalShoppingSandboxCandidateRecommendationSummary,
    buildGlobalShoppingSandboxCandidateComparisonWorkbenchAuditDraft,
    sanitizeGlobalShoppingSandboxCandidateComparisonWorkbench
  };
})();
