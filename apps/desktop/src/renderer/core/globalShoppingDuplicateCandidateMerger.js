;(function () {
  "use strict";

  const GLOBAL_SHOPPING_DUPLICATE_CANDIDATE_MERGER_VERSION = "3.6.0";
  const MERGER_NAME = "global_shopping_duplicate_candidate_merger_v1";
  const CAVEAT = "合并结果只覆盖当前已接入或 fixture 来源，不代表全网覆盖或最低价承诺。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function numberOrNull(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
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
  function matcherApi() { return window.WeishanGlobalShoppingSameItemMatcher || {}; }
  function matchedGroups(input) {
    const safe = obj(input);
    if (toArray(safe.matchedGroups).length) return toArray(safe.matchedGroups);
    if (safe.sameItemMatcherSummary && toArray(safe.sameItemMatcherSummary.matchedGroups).length) return toArray(safe.sameItemMatcherSummary.matchedGroups);
    const api = matcherApi();
    return typeof api.matchGlobalShoppingSameItemCandidates === "function" ? api.matchGlobalShoppingSameItemCandidates(safe) : [];
  }
  function unsafe(input) {
    const safe = obj(input);
    const safeSafety = obj(safe.safety);
    const serial = JSON.stringify(safe);
    return safe.payment === true || safe.order === true || safe.ticketing === true || safe.autoOpen === true || safe.openExternal === true ||
      safeSafety.payment === true || safeSafety.order === true || safeSafety.ticketing === true || safeSafety.autoOpen === true ||
      Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safeSafety.bookingUrl || safeSafety.checkoutUrl || safeSafety.paymentUrl || safeSafety.orderUrl) ||
      /全网最低|lowest price guarantee|最低价保证|已锁价|locked price|真实最终价/i.test(serial);
  }
  function coveredCandidates(group) {
    return toArray(group.candidates).filter(function (candidate) {
      return candidate && candidate.sourceType !== "user_submitted";
    });
  }
  function mergeGroup(group, index) {
    const candidates = toArray(group.candidates);
    const covered = coveredCandidates(group).filter(function (candidate) { return numberOrNull(candidate.normalizedTotal) !== null; });
    const sorted = covered.slice().sort(function (a, b) { return Number(a.normalizedTotal) - Number(b.normalizedTotal); });
    const lowest = sorted[0] || null;
    const highest = sorted[sorted.length - 1] || null;
    const official = candidates.find(function (candidate) { return candidate && candidate.sourceType === "official"; }) || null;
    const currency = text((lowest || highest || official || {}).currency || "");
    const warnings = [].concat(toArray(group.matchWarnings || []));
    if (!sorted.length) warnings.push("missing_covered_normalized_totals");
    if (!official) warnings.push("missing_official_candidate");
    if (official && candidates.some(function (candidate) { return candidate && candidate.sourceType === "user_submitted"; })) warnings.push("user_submitted_cannot_override_official");
    const sourceCountBy = function (sourceType) {
      return candidates.filter(function (candidate) { return candidate && candidate.sourceType === sourceType; }).length;
    };
    return {
      mergedCandidateId:text("merged_candidate_" + (index + 1)),
      canonicalItemId:text(group.canonicalItemId || ""),
      itemType:text(group.itemType || "unknown"),
      title:text(official && official.title || candidates[0] && candidates[0].title || "只读候选价"),
      sourceCount:candidates.length,
      officialCandidateId:official ? official.candidateId : "",
      authorizedSourceCount:sourceCountBy("authorized"),
      aggregatorSourceCount:sourceCountBy("aggregator"),
      userSubmittedSourceCount:sourceCountBy("user_submitted"),
      fixtureSourceCount:sourceCountBy("fixture"),
      lowestCoveredCandidateId:lowest ? lowest.candidateId : "",
      highestCoveredCandidateId:highest ? highest.candidateId : "",
      lowestCoveredNormalizedTotal:lowest ? Number(lowest.normalizedTotal) : null,
      highestCoveredNormalizedTotal:highest ? Number(highest.normalizedTotal) : null,
      priceRange:lowest && highest ? (currency ? currency + " " : "") + String(lowest.normalizedTotal) + " - " + String(highest.normalizedTotal) : "",
      currency:currency,
      matchConfidence:text(group.matchConfidence || "needs_review"),
      mergeWarnings:Array.from(new Set(warnings.map(text).filter(Boolean))),
      caveat:"当前仅比较已覆盖来源中的候选价，不代表最低承诺、价格保证、锁定承诺、最终成交价或可下单能力。",
      redacted:true
    };
  }
  function mergeGlobalShoppingDuplicateCandidates(input) {
    return clone(matchedGroups(input || {}).map(mergeGroup));
  }
  function evaluateGlobalShoppingDuplicateMerge(input) {
    const safe = obj(input);
    const groups = matchedGroups(safe);
    const merged = toArray(safe.mergedCandidates).length ? toArray(safe.mergedCandidates) : mergeGlobalShoppingDuplicateCandidates(safe);
    const blockedReasons = [];
    if (unsafe(safe)) blockedReasons.push("unsafe_duplicate_merge_capability_detected");
    const mergeHealth = {
      hasMatchedGroups:groups.length > 0,
      hasMergedCandidates:merged.length > 0,
      hasOfficialCandidatePreserved:merged.every(function (item) { return item.officialCandidateId !== undefined; }),
      hasCoveredLowestCandidate:merged.every(function (item) { return item.lowestCoveredCandidateId !== undefined; }),
      hasPriceRange:merged.every(function (item) { return typeof item.priceRange === "string"; }),
      hasSourceCoverage:merged.every(function (item) { return Number(item.sourceCount) >= 0; }),
      noWholeNetworkLowestClaim:blockedReasons.indexOf("unsafe_duplicate_merge_capability_detected") < 0,
      noLockedPriceClaim:blockedReasons.indexOf("unsafe_duplicate_merge_capability_detected") < 0,
      noRealFinalPriceClaim:blockedReasons.indexOf("unsafe_duplicate_merge_capability_detected") < 0,
      noPayment:safe.payment !== true,
      noOrder:safe.order !== true,
      noTicketing:safe.ticketing !== true,
      noExternalOpen:safe.autoOpen !== true && safe.openExternal !== true
    };
    const needsReview = !mergeHealth.hasMatchedGroups || !mergeHealth.hasMergedCandidates || merged.some(function (item) {
      return item.matchConfidence === "low" || item.matchConfidence === "needs_review";
    });
    return clone({ status:blockedReasons.length ? "blocked" : (needsReview ? "needs_review" : "merged"), mergedCandidates:merged, mergeHealth:mergeHealth, blockedReasons:blockedReasons, redacted:true });
  }
  function buildGlobalShoppingDuplicateMergeRows(input) {
    const merged = mergeGlobalShoppingDuplicateCandidates(input || {});
    return clone(merged.map(function (item) {
      return {
        rowId:item.mergedCandidateId,
        label:item.title || item.canonicalItemId,
        value:"sources:" + String(item.sourceCount) + " / range:" + (item.priceRange || "review"),
        status:item.matchConfidence === "high" ? "pass" : (item.matchConfidence === "medium" ? "warning" : "blocked"),
        redacted:true
      };
    }));
  }
  function sanitizeGlobalShoppingDuplicateCandidateMerger(merger) {
    const safe = obj(merger);
    const evaluated = evaluateGlobalShoppingDuplicateMerge(safe);
    return clone({
      mergerName:MERGER_NAME,
      appVersion:GLOBAL_SHOPPING_DUPLICATE_CANDIDATE_MERGER_VERSION,
      status:/^(merged|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status,
      mergedCandidates:clone(evaluated.mergedCandidates),
      mergeHealth:clone(evaluated.mergeHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingDuplicateMergeRows({ mergedCandidates:evaluated.mergedCandidates, matchedGroups:matchedGroups(safe) }),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluated.blockedReasons,
      userFacingSummary:{
        title:"重复候选合并",
        resultLabel:evaluated.status === "merged" ? "重复候选已合并" : (evaluated.status === "blocked" ? "重复候选已阻断" : "重复候选仍需复核"),
        caveat:CAVEAT,
        redacted:true
      },
      externalDeepLinkSafetySummary:clone(safe.externalDeepLinkSafetySummary || null),
      searchParameterPrefillSummary:clone(safe.searchParameterPrefillSummary || null),
      jumpToPlatformHandoffPreviewSummary:clone(safe.jumpToPlatformHandoffPreviewSummary || null),
      externalDeepLinkSafetyStatus:text(safe.externalDeepLinkSafetyStatus || obj(safe.externalDeepLinkSafetySummary).status || ""),
      searchPrefillStatus:text(safe.searchPrefillStatus || obj(safe.searchParameterPrefillSummary).status || ""),
      handoffPreviewStatus:text(safe.handoffPreviewStatus || obj(safe.jumpToPlatformHandoffPreviewSummary).status || ""),
      safeToProceedWithSandboxDeepLinkCandidate:safe.safeToProceedWithSandboxDeepLinkCandidate === true,
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingDuplicateCandidateMerger(input) {
    try {
      return sanitizeGlobalShoppingDuplicateCandidateMerger(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingDuplicateCandidateMerger({ status:"failed_safe", mergedCandidates:[], blockedReasons:["failed_safe"] });
    }
  }
  function buildGlobalShoppingDuplicateCandidateMergerAuditDraft(input) {
    const merger = buildGlobalShoppingDuplicateCandidateMerger(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_DUPLICATE_CANDIDATE_MERGER_AUDIT_DRAFT",
      mergerName:MERGER_NAME,
      appVersion:GLOBAL_SHOPPING_DUPLICATE_CANDIDATE_MERGER_VERSION,
      status:merger.status,
      mergedCandidateCount:merger.mergedCandidates.length,
      rowCount:merger.rows.length,
      blockedReasons:merger.blockedReasons,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingDuplicateCandidateMerger = {
    GLOBAL_SHOPPING_DUPLICATE_CANDIDATE_MERGER_VERSION,
    MERGER_NAME,
    buildGlobalShoppingDuplicateCandidateMerger,
    mergeGlobalShoppingDuplicateCandidates,
    evaluateGlobalShoppingDuplicateMerge,
    buildGlobalShoppingDuplicateMergeRows,
    buildGlobalShoppingDuplicateCandidateMergerAuditDraft,
    sanitizeGlobalShoppingDuplicateCandidateMerger
  };
})();
